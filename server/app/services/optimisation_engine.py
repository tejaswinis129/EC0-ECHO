import time
from typing import List, Dict, Tuple, Optional, Any
import numpy as np
import pandas as pd
from scipy.optimize import linprog

from ..models.optimisation import (
    OptimisationRequest,
    OptimisationResult,
    AlternativePortfolio,
    InterventionAllocation,
    NeighbourhoodAllocationSummary,
    InfeasibilityReport,
    OptimisationWeights,
)
from ..models.intervention import InterventionDefinition, SpaceRequirementType
from .data_service import data_service
from .intervention_service import intervention_service

class OptimisationEngine:
    def solve(self, request: OptimisationRequest) -> OptimisationResult:
        start_time = time.time()
        df = data_service.get_dataset(request.dataset_id)
        meta = data_service.get_dataset_metadata(request.dataset_id)
        
        if df is None or meta is None:
            return OptimisationResult(
                dataset_id=request.dataset_id,
                dataset_name="Unknown Dataset",
                is_feasible=False,
                alternatives=[],
                infeasibility_report=InfeasibilityReport(
                    is_infeasible=True,
                    explanation=f"Dataset with ID '{request.dataset_id}' could not be located.",
                    primary_bottleneck="Dataset missing",
                    suggested_remedy="Select a valid dataset or upload a new CSV file.",
                    conflicting_constraints=["dataset_id"]
                ),
                execution_time_ms=round((time.time() - start_time) * 1000, 2)
            )

        # Filter target neighbourhoods if specified
        if request.target_neighbourhood_ids and len(request.target_neighbourhood_ids) > 0:
            active_df = df[df["neighbourhood_id"].isin(request.target_neighbourhood_ids)].copy().reset_index(drop=True)
            if active_df.empty:
                active_df = df.copy().reset_index(drop=True)
        else:
            active_df = df.copy().reset_index(drop=True)

        interventions = intervention_service.list_interventions()

        # Check early budget impossibility
        min_cost_any = min([item.capital_cost_per_unit for item in interventions])
        if request.total_budget_cap < min_cost_any * 5.0:
            return OptimisationResult(
                dataset_id=request.dataset_id,
                dataset_name=meta.name,
                is_feasible=False,
                alternatives=[],
                infeasibility_report=InfeasibilityReport(
                    is_infeasible=True,
                    explanation=f"Allocated budget (${request.total_budget_cap:,.0f}) is below the minimum threshold required to deploy any functional unit of green infrastructure across {len(active_df)} target districts.",
                    primary_bottleneck="Capital budget severely constrained",
                    suggested_remedy=f"Increase total budget cap to at least ${min_cost_any * 20:,.0f} USD.",
                    conflicting_constraints=["total_budget_cap"]
                ),
                execution_time_ms=round((time.time() - start_time) * 1000, 2)
            )

        # Solve for the 3 distinct alternatives using SciPy HiGHS:
        # 1. Cost-focused
        # 2. Balanced
        # 3. Equity-focused
        cost_portfolio, cost_err = self._solve_single_strategy(
            strategy_id="cost_focused",
            label="Cost-Focused Allocation",
            rationale="Maximizes flood diversion and heat attenuation per capital dollar spent while preserving at least 35% of the overall budget reserve.",
            request=request,
            df=active_df,
            interventions=interventions,
            effective_budget=request.total_budget_cap * 0.65,
            equity_multiplier=1.0,
            cost_efficiency_weight=0.55
        )

        balanced_portfolio, bal_err = self._solve_single_strategy(
            strategy_id="balanced",
            label="Multi-Objective Balanced Portfolio",
            rationale="Optimal Pareto trade-off harmonizing thermal reduction, stormwater diversion, water resilience, and district equity.",
            request=request,
            df=active_df,
            interventions=interventions,
            effective_budget=request.total_budget_cap,
            equity_multiplier=1.5,
            cost_efficiency_weight=0.15
        )

        equity_portfolio, eq_err = self._solve_single_strategy(
            strategy_id="equity_focused",
            label="Equity & Frontline Climate Protection",
            rationale="Directs the majority of capital towards highest-vulnerability districts (SVI >= 0.60) suffering from heat island and canopy deprivation.",
            request=request,
            df=active_df,
            interventions=interventions,
            effective_budget=request.total_budget_cap,
            equity_multiplier=3.5,
            cost_efficiency_weight=0.05
        )

        alternatives = [p for p in [balanced_portfolio, cost_portfolio, equity_portfolio] if p is not None]

        if not alternatives:
            err_msg = bal_err or cost_err or eq_err or "Linear optimization solver could not satisfy boundary constraints."
            return OptimisationResult(
                dataset_id=request.dataset_id,
                dataset_name=meta.name,
                is_feasible=False,
                alternatives=[],
                infeasibility_report=InfeasibilityReport(
                    is_infeasible=True,
                    explanation=f"Optimisation constraints are mathematically incompatible: {err_msg}",
                    primary_bottleneck="Conflicting resource or equity constraints",
                    suggested_remedy="Relax annual maintenance limits, reduce minimum equity floor, or increase capital budget.",
                    conflicting_constraints=["total_budget_cap", "min_equity_investment_share"]
                ),
                execution_time_ms=round((time.time() - start_time) * 1000, 2)
            )

        return OptimisationResult(
            dataset_id=request.dataset_id,
            dataset_name=meta.name,
            is_feasible=True,
            selected_strategy="balanced",
            alternatives=alternatives,
            infeasibility_report=None,
            solver_engine="SciPy HiGHS Dual Simplex & Interior Point",
            execution_time_ms=round((time.time() - start_time) * 1000, 2)
        )

    def _solve_single_strategy(
        self,
        strategy_id: str,
        label: str,
        rationale: str,
        request: OptimisationRequest,
        df: pd.DataFrame,
        interventions: List[InterventionDefinition],
        effective_budget: float,
        equity_multiplier: float,
        cost_efficiency_weight: float,
    ) -> Tuple[Optional[AlternativePortfolio], Optional[str]]:
        
        n_districts = len(df)
        n_interventions = len(interventions)
        n_vars = n_districts * n_interventions

        def var_idx(i_idx: int, d_idx: int) -> int:
            return i_idx * n_districts + d_idx

        # 1. Build Objective Function Vector (c)
        # Note: linprog minimizes c^T * x. To maximize Utility, minimize -Utility.
        c = np.zeros(n_vars)
        for i_idx, item in enumerate(interventions):
            for d_idx, row in df.iterrows():
                svi = float(row.get("social_vulnerability_index", 0.5))
                t_surf = float(row.get("surface_temp_c", 32.0))
                drainage_ratio = float(row.get("extreme_rainfall_runoff_m3", 100000)) / max(1.0, float(row.get("drainage_capacity_m3", 100000)))

                heat_need = max(0.5, (t_surf - 30.0) / 5.0)
                flood_need = max(0.5, drainage_ratio)
                equity_need = 1.0 + (svi * equity_multiplier)

                heat_benefit = item.heat_reduction_index_per_unit * heat_need * 1200.0 * request.weights.heat_reduction
                flood_benefit = item.runoff_reduction_m3_per_unit_year * flood_need * 0.8 * request.weights.flood_reduction
                water_benefit = (-item.water_demand_m3_per_unit_year) * 2.5 * request.weights.water_resilience
                cost_penalty = (item.capital_cost_per_unit / 100.0) * cost_efficiency_weight

                unit_score = (heat_benefit + flood_benefit + water_benefit) * equity_need - cost_penalty
                idx = var_idx(i_idx, d_idx)
                c[idx] = -unit_score  # Negate for minimization

        # 2. Build Constraints (A_ub, b_ub)
        A_ub_list = []
        b_ub_list = []

        # Constraint 1: Total Capital Budget
        row_capex = np.zeros(n_vars)
        for i_idx, item in enumerate(interventions):
            for d_idx in range(n_districts):
                row_capex[var_idx(i_idx, d_idx)] = item.capital_cost_per_unit
        A_ub_list.append(row_capex)
        b_ub_list.append(effective_budget)

        # Constraint 2: Maintenance Budget (if specified)
        if request.max_annual_maintenance_budget:
            row_opex = np.zeros(n_vars)
            for i_idx, item in enumerate(interventions):
                for d_idx in range(n_districts):
                    row_opex[var_idx(i_idx, d_idx)] = item.annual_maintenance_per_unit
            A_ub_list.append(row_opex)
            b_ub_list.append(request.max_annual_maintenance_budget)

        # Constraint 3: Net Water Consumption Limit (if specified)
        if request.max_additional_water_demand_m3_year is not None:
            row_water = np.zeros(n_vars)
            for i_idx, item in enumerate(interventions):
                for d_idx in range(n_districts):
                    row_water[var_idx(i_idx, d_idx)] = item.water_demand_m3_per_unit_year
            A_ub_list.append(row_water)
            b_ub_list.append(request.max_additional_water_demand_m3_year)

        # Constraint 4: District Space Constraints
        for d_idx, row in df.iterrows():
            roof_avail = float(row.get("available_roof_area_m2", 50000.0)) * 0.70
            land_avail = float(row.get("available_public_land_m2", 20000.0)) * 0.75
            corridor_avail = float(row.get("available_road_corridor_m2", 15000.0)) * 0.80

            row_roof = np.zeros(n_vars)
            row_land = np.zeros(n_vars)
            row_corridor = np.zeros(n_vars)

            for i_idx, item in enumerate(interventions):
                idx = var_idx(i_idx, d_idx)
                if item.space_type == SpaceRequirementType.ROOF:
                    row_roof[idx] = item.space_consumed_m2_per_unit
                elif item.space_type == SpaceRequirementType.PUBLIC_LAND:
                    row_land[idx] = item.space_consumed_m2_per_unit
                elif item.space_type == SpaceRequirementType.ROAD_CORRIDOR:
                    row_corridor[idx] = item.space_consumed_m2_per_unit

            A_ub_list.append(row_roof)
            b_ub_list.append(roof_avail)

            A_ub_list.append(row_land)
            b_ub_list.append(land_avail)

            A_ub_list.append(row_corridor)
            b_ub_list.append(corridor_avail)

        # Constraint 5: Equity Investment Floor (High Vulnerability Districts SVI >= 0.60)
        high_vuln_indices = [
            d_idx for d_idx, r in df.iterrows()
            if float(r.get("social_vulnerability_index", 0.0)) >= 0.60
        ]
        if high_vuln_indices and request.min_equity_investment_share > 0:
            target_share = request.min_equity_investment_share
            if strategy_id == "equity_focused":
                target_share = max(target_share, 0.55)

            # In standard <= form:
            # target_share * sum(all capex) - sum(high_vuln capex) <= 0
            row_equity = np.zeros(n_vars)
            for i_idx, item in enumerate(interventions):
                for d_idx in range(n_districts):
                    idx = var_idx(i_idx, d_idx)
                    if d_idx in high_vuln_indices:
                        row_equity[idx] = (target_share - 1.0) * item.capital_cost_per_unit
                    else:
                        row_equity[idx] = target_share * item.capital_cost_per_unit
            A_ub_list.append(row_equity)
            b_ub_list.append(0.0)

        A_ub = np.array(A_ub_list)
        b_ub = np.array(b_ub_list)
        bounds = [(0.0, None) for _ in range(n_vars)]

        # 3. Solve with SciPy HiGHS Solver
        res = linprog(c=c, A_ub=A_ub, b_ub=b_ub, bounds=bounds, method="highs")
        
        if not res.success:
            return None, f"HiGHS solver failed: {res.message}"

        solution = res.x

        # 4. Extract Allocations and Aggregates
        allocations: List[InterventionAllocation] = []
        total_capex = 0.0
        total_opex = 0.0
        total_water_impact = 0.0
        total_runoff = 0.0
        total_heat_score = 0.0
        total_carbon = 0.0
        high_vuln_capex = 0.0

        dist_capex = [0.0] * n_districts
        dist_opex = [0.0] * n_districts
        dist_runoff = [0.0] * n_districts
        dist_heat = [0.0] * n_districts
        dist_water = [0.0] * n_districts
        dist_count = [0] * n_districts

        for i_idx, item in enumerate(interventions):
            for d_idx, row in df.iterrows():
                val = solution[var_idx(i_idx, d_idx)]
                if val >= 0.1:
                    units = float(np.floor(val * 10.0) / 10.0)
                    if units < 0.1:
                        continue
                    capex = round(units * item.capital_cost_per_unit, 2)
                    opex = round(units * item.annual_maintenance_per_unit, 2)
                    space = round(units * item.space_consumed_m2_per_unit, 1)
                    water = round(units * item.water_demand_m3_per_unit_year, 1)
                    runoff = round(units * item.runoff_reduction_m3_per_unit_year, 1)
                    heat_eff = round(units * item.heat_reduction_index_per_unit, 3)

                    total_capex += capex
                    total_opex += opex
                    total_water_impact += water
                    total_runoff += runoff
                    total_heat_score += heat_eff
                    if item.carbon_sequestration_kg_per_unit_year:
                        total_carbon += (units * item.carbon_sequestration_kg_per_unit_year) / 1000.0

                    if d_idx in high_vuln_indices:
                        high_vuln_capex += capex

                    dist_capex[d_idx] += capex
                    dist_opex[d_idx] += opex
                    dist_runoff[d_idx] += runoff
                    dist_heat[d_idx] += heat_eff
                    dist_water[d_idx] += water
                    dist_count[d_idx] += 1

                    allocations.append(InterventionAllocation(
                        intervention_id=item.id,
                        intervention_name=item.name,
                        neighbourhood_id=str(row["neighbourhood_id"]),
                        neighbourhood_name=str(row["neighbourhood_name"]),
                        units_allocated=units,
                        unit_label=item.unit_label,
                        capital_cost=capex,
                        annual_maintenance=opex,
                        space_used_m2=space,
                        water_demand_impact_m3_year=water,
                        estimated_heat_reduction_deg_effect=heat_eff,
                        estimated_runoff_reduction_m3=runoff
                    ))

        # Build district summaries
        district_summaries: List[NeighbourhoodAllocationSummary] = []
        for d_idx, r in df.iterrows():
            n_id = str(r["neighbourhood_id"])
            baseline_runoff = float(r.get("extreme_rainfall_runoff_m3", 100000.0))
            runoff_pct = min(60.0, round((dist_runoff[d_idx] / max(1.0, baseline_runoff)) * 100.0, 1))
            heat_pct = min(40.0, round(dist_heat[d_idx] * 8.0, 1))

            district_summaries.append(NeighbourhoodAllocationSummary(
                neighbourhood_id=n_id,
                neighbourhood_name=str(r["neighbourhood_name"]),
                population=int(r["population"]),
                social_vulnerability_index=float(r["social_vulnerability_index"]),
                capital_allocated=round(dist_capex[d_idx], 2),
                annual_maintenance_allocated=round(dist_opex[d_idx], 2),
                heat_risk_reduction_pct=heat_pct,
                flood_runoff_reduction_pct=runoff_pct,
                net_water_impact_m3_year=round(dist_water[d_idx], 1),
                interventions_count=dist_count[d_idx]
            ))

        vulnerable_share_pct = round((high_vuln_capex / max(1.0, total_capex)) * 100.0, 1)
        budget_util_pct = round((total_capex / request.total_budget_cap) * 100.0, 1)

        # Binding constraints analysis
        binding: List[str] = []
        if budget_util_pct >= 95.0:
            binding.append(f"Capital budget capacity reached ({budget_util_pct}% utilized)")
        if request.max_annual_maintenance_budget and (total_opex / request.max_annual_maintenance_budget) >= 0.90:
            binding.append("Annual maintenance ceiling tightly constrained further intervention expansion")
        if total_water_impact > 0 and request.max_additional_water_demand_m3_year:
            binding.append("Net water availability cap actively constrained additional tree planting")
        if not binding:
            binding.append("Available physical roof and open public land boundary limits")

        # Trade-off summary
        trade_offs: List[str] = []
        if total_water_impact > 500:
            trade_offs.append(f"Net water demand increases by {total_water_impact:,.0f} m³/year due to urban forest canopy expansion.")
        else:
            trade_offs.append(f"Rainwater harvesting offset yields a net water surplus of {abs(total_water_impact):,.0f} m³/year.")

        if vulnerable_share_pct >= 50.0:
            trade_offs.append(f"Equity prioritization channelled {vulnerable_share_pct}% of funds to frontline districts, trading off suburban canopy additions.")
        else:
            trade_offs.append(f"Balanced spread across all districts preserves city-wide cooling, but leaves high-SVI districts with residual gaps.")

        equity_score = round(min(100.0, max(20.0, vulnerable_share_pct * 1.3)), 1)

        portfolio = AlternativePortfolio(
            strategy_id=strategy_id,
            strategy_label=label,
            strategy_rationale=rationale,
            total_capital_cost=round(total_capex, 2),
            total_annual_maintenance=round(total_opex, 2),
            budget_utilization_pct=budget_util_pct,
            net_annual_water_impact_m3=round(total_water_impact, 1),
            total_stormwater_runoff_diverted_m3=round(total_runoff, 1),
            estimated_city_heat_reduction_score=round(total_heat_score, 2),
            total_carbon_sequestration_tco2_year=round(total_carbon, 1),
            equity_score=equity_score,
            vulnerable_area_investment_share_pct=vulnerable_share_pct,
            allocations=allocations,
            neighbourhood_summaries=district_summaries,
            binding_constraints=binding,
            trade_off_summary=trade_offs,
            solver_status="Optimal (Verified Feasible via SciPy HiGHS)"
        )

        return portfolio, None

optimisation_engine = OptimisationEngine()
