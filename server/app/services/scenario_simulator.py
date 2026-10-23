from typing import List, Dict, Any, Tuple
import copy
import pandas as pd

from ..models.scenario import (
    ScenarioType,
    ScenarioParams,
    ScenarioSimulationResult,
    ScenarioDelta,
)
from ..models.optimisation import OptimisationRequest, AlternativePortfolio
from .data_service import data_service
from .optimisation_engine import optimisation_engine

class ScenarioSimulator:
    def simulate(self, params: ScenarioParams) -> ScenarioSimulationResult:
        base_req = params.base_optimisation_request
        base_df = data_service.get_dataset(base_req.dataset_id)
        
        # 1. Solve baseline portfolio first
        base_res = optimisation_engine.solve(base_req)
        if not base_res.is_feasible or not base_res.alternatives:
            # Fallback mock baseline if original was infeasible
            raise ValueError("Baseline optimisation request was infeasible; cannot run scenario simulation.")

        # Select balanced portfolio as reference baseline
        baseline = next((a for a in base_res.alternatives if a.strategy_id == "balanced"), base_res.alternatives[0])

        # 2. Modify dataset and optimisation constraints according to scenario
        scenario_req = copy.deepcopy(base_req)
        stype = params.scenario_type
        
        # Scenario specifics
        water_change_pct = params.water_supply_change_pct
        rain_surge_pct = params.extreme_rainfall_surge_pct
        budget_cut_pct = params.budget_cut_pct
        temp_anomaly = params.temperature_anomaly_c

        narrative = ""
        unintended_risks: List[str] = []
        mitigations: List[str] = []
        uncertainty = "Moderate Confidence"

        if stype == ScenarioType.DROUGHT:
            params.scenario_name = "Prolonged Multi-Year Megadrought"
            water_change_pct = water_change_pct if water_change_pct != 0.0 else -50.0
            temp_anomaly = temp_anomaly if temp_anomaly != 0.0 else 2.2
            scenario_req.weights.water_resilience = 0.40
            scenario_req.weights.heat_reduction = 0.30
            # Strict cap on net water demand
            scenario_req.max_additional_water_demand_m3_year = -500.0  # must be NET positive water producer!
            narrative = (
                f"Simulates a 3-year prolonged drought with a {abs(water_change_pct):.0f}% reduction in municipal water reserves "
                f"and a +{temp_anomaly:.1f}°C summer temperature anomaly. Interventions requiring persistent irrigation face high sapling mortality."
            )
            unintended_risks = [
                "Newly planted young urban tree canopies risk severe desiccation without auxiliary greywater irrigation.",
                "Public parks and vegetative bioswales experience vegetation dieback, releasing trapped particulates.",
                "Competition between municipal residential drinking supply and urban greening water allocations."
            ]
            mitigations = [
                "Shift intervention mix toward closed-loop rainwater retention cisterns and drought-hardy xeriscape flora.",
                "Mandate drip-irrigation retrofits and root-zone moisture telemetry for all newly planted street trees.",
                "Utilize Class-A treated wastewater effluent for initial 2-year sapling establishment."
            ]

        elif stype == ScenarioType.EXTREME_RAINFALL:
            params.scenario_name = "100-Year Cloudburst & Inundation Surge"
            rain_surge_pct = rain_surge_pct if rain_surge_pct != 0.0 else 45.0
            scenario_req.weights.flood_reduction = 0.50
            scenario_req.weights.water_resilience = 0.25
            narrative = (
                f"Simulates a severe cloudburst event where peak 1-hour storm intensity surges by +{rain_surge_pct:.0f}%, "
                f"saturating legacy trunk sewer networks and triggering flash ponding across low-lying districts."
            )
            unintended_risks = [
                "Cisterns fill to capacity within the first 20 minutes, causing secondary overland overflow if bypass pipes lack head.",
                "Sediment and motor oil wash-off from impervious roads can clog permeable pavement gravel pores without vacuum sweeping.",
                "Bioswales risk temporary inundation (>48 hours), creating localized mosquito breeding hazards if percolation is impeded."
            ]
            mitigations = [
                "Incorporate sacrificial high-volume retention dry wells and bioretention sub-base infiltration trenches.",
                "Mandate bi-annual high-pressure vacuum sweeping for all permeable roadway corridors.",
                "Enforce secondary gravitational relief weirs connecting roadside bioswales directly to deep recharge aquifers."
            ]

        elif stype == ScenarioType.BUDGET_CUT:
            params.scenario_name = "Austerity Fiscal Shock (-35% Budget Reduction)"
            budget_cut_pct = budget_cut_pct if budget_cut_pct != 0.0 else 35.0
            scenario_req.total_budget_cap = base_req.total_budget_cap * (1.0 - (budget_cut_pct / 100.0))
            scenario_req.weights.cost_efficiency = 0.45
            narrative = (
                f"Models an unexpected municipal fiscal austerity mandate cutting available capital funding by {budget_cut_pct:.0f}%. "
                f"Forces the algorithm to de-scope high-capex assets and concentrate remaining dollars where marginal hazard reduction is steepest."
            )
            unintended_risks = [
                "High-cost transformative projects (e.g. comprehensive green roofs) are cancelled in favor of lower-cost asphalt retrofits.",
                "Disadvantaged districts may experience delayed implementation if equity safeguards are not strictly preserved.",
                "Maintenance budgets are reduced, shortening asset operational lifespans by up to 25%."
            ]
            mitigations = [
                "Protect frontline vulnerable district budgets using statutory equity covenants.",
                "Leverage commercial rooftop co-funding incentives and private stormwater utility fee credits.",
                "Phase deployment over multiple fiscal cycles rather than truncating engineering quality."
            ]

        elif stype == ScenarioType.COMBINED_SHOCK:
            params.scenario_name = "Combined Compound Climate Shock"
            water_change_pct = water_change_pct if water_change_pct != 0.0 else -40.0
            rain_surge_pct = rain_surge_pct if rain_surge_pct != 0.0 else 35.0
            budget_cut_pct = budget_cut_pct if budget_cut_pct != 0.0 else 25.0
            temp_anomaly = temp_anomaly if temp_anomaly != 0.0 else 1.8
            scenario_req.total_budget_cap = base_req.total_budget_cap * (1.0 - (budget_cut_pct / 100.0))
            scenario_req.weights.flood_reduction = 0.35
            scenario_req.weights.water_resilience = 0.35
            scenario_req.weights.heat_reduction = 0.20
            narrative = (
                f"A compounding crisis scenario combining severe dry-season water stress ({water_change_pct:.0f}%), "
                f"intermittent cloudburst surges (+{rain_surge_pct:.0f}%), and a concurrent {budget_cut_pct:.0f}% capital contraction."
            )
            unintended_risks = [
                "Interacting stressors: dry, compacted soils repel heavy storm downpours, amplifying initial runoff coefficient.",
                "Constrained municipal capital limits ability to perform rapid emergency repairs following peak events.",
                "High social vulnerability districts suffer compound compounding heat and localized flood distress."
            ]
            mitigations = [
                "Deploy hybrid retention bioswales with deep root native grasses that survive both saturated inundation and prolonged dry spells.",
                "Prioritize modular cistern retention that buffers both drought reserves and flood attenuation.",
                "Establish community resilience hubs equipped with passive cooling and autonomous stormwater storage."
            ]

        else:  # Custom
            params.scenario_name = "User Configured Custom Stress Test"
            if budget_cut_pct > 0:
                scenario_req.total_budget_cap = base_req.total_budget_cap * (1.0 - (budget_cut_pct / 100.0))
            if water_change_pct < -20:
                scenario_req.weights.water_resilience += 0.20
            if rain_surge_pct > 20:
                scenario_req.weights.flood_reduction += 0.20
            narrative = (
                f"Custom stress test: Water supply shift: {water_change_pct}%, Rainfall surge: +{rain_surge_pct}%, "
                f"Budget cut: {budget_cut_pct}%, Temperature anomaly: +{temp_anomaly}°C."
            )
            unintended_risks = ["Custom stress thresholds can alter expected marginal benefit trajectories."]
            mitigations = ["Review individual district trade-offs and monitor boundary constraint utilization."]

        # 3. Re-run optimization solver with scenario adjustments!
        scenario_res = optimisation_engine.solve(scenario_req)
        if not scenario_res.is_feasible or not scenario_res.alternatives:
            # If constrained, relax slightly or capture constraint failure
            scenario_req.max_additional_water_demand_m3_year = None
            scenario_res = optimisation_engine.solve(scenario_req)

        scenario_portfolio = next((a for a in scenario_res.alternatives if a.strategy_id == "balanced"), scenario_res.alternatives[0])

        # 4. Calculate exact deltas
        capex_diff = round(scenario_portfolio.total_capital_cost - baseline.total_capital_cost, 2)
        water_diff = round(scenario_portfolio.net_annual_water_impact_m3 - baseline.net_annual_water_impact_m3, 1)
        runoff_diff = round(scenario_portfolio.total_stormwater_runoff_diverted_m3 - baseline.total_stormwater_runoff_diverted_m3, 1)
        heat_diff = round(scenario_portfolio.estimated_city_heat_reduction_score - baseline.estimated_city_heat_reduction_score, 2)
        equity_diff = round(scenario_portfolio.equity_score - baseline.equity_score, 1)

        # Trace which interventions expanded or contracted
        base_alloc_by_type = {}
        for a in baseline.allocations:
            base_alloc_by_type[a.intervention_name] = base_alloc_by_type.get(a.intervention_name, 0.0) + a.units_allocated

        scen_alloc_by_type = {}
        for a in scenario_portfolio.allocations:
            scen_alloc_by_type[a.intervention_name] = scen_alloc_by_type.get(a.intervention_name, 0.0) + a.units_allocated

        abandoned: List[str] = []
        prioritised: List[str] = []

        all_types = set(list(base_alloc_by_type.keys()) + list(scen_alloc_by_type.keys()))
        for t in all_types:
            b_val = base_alloc_by_type.get(t, 0.0)
            s_val = scen_alloc_by_type.get(t, 0.0)
            if b_val > 0 and s_val < b_val * 0.70:
                abandoned.append(f"{t}: reduced from {b_val:,.0f} to {s_val:,.0f} units ({((s_val - b_val) / b_val) * 100:.0f}%)")
            elif s_val > b_val * 1.15:
                prioritised.append(f"{t}: scaled from {b_val:,.0f} to {s_val:,.0f} units (+{((s_val - b_val) / max(1.0, b_val)) * 100:.0f}%)")

        deltas = ScenarioDelta(
            capital_cost_difference=capex_diff,
            water_impact_difference_m3=water_diff,
            runoff_reduction_difference_m3=runoff_diff,
            heat_score_difference=heat_diff,
            equity_score_difference=equity_diff,
            abandoned_or_reduced_interventions=abandoned,
            newly_prioritised_interventions=prioritised,
        )

        return ScenarioSimulationResult(
            scenario_type=stype,
            scenario_name=params.scenario_name,
            scenario_narrative=narrative,
            applied_parameters={
                "water_supply_change_pct": water_change_pct,
                "extreme_rainfall_surge_pct": rain_surge_pct,
                "budget_cut_pct": budget_cut_pct,
                "temperature_anomaly_c": temp_anomaly,
            },
            baseline_portfolio=baseline,
            scenario_portfolio=scenario_portfolio,
            deltas=deltas,
            new_vulnerabilities_introduced=unintended_risks,
            unintended_consequences=[
                f"Portfolio shift results in {abs(runoff_diff):,.0f} m³ {'less' if runoff_diff < 0 else 'more'} stormwater retention capacity.",
                f"Net water demand delta of {water_diff:+,.0f} m³/year compared to baseline design.",
                f"Frontline equity score shifted by {equity_diff:+.1f} points."
            ],
            recommended_mitigations=mitigations,
            uncertainty_level=uncertainty,
            disclaimer="Scenario outputs are stress-test heuristics based on localized climate hazard multipliers; they do not constitute downscaled GCM climate projections."
        )

scenario_simulator = ScenarioSimulator()
