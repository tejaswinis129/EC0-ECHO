from typing import List, Optional, Dict, Any
import pandas as pd
import numpy as np

from ..models.risk import (
    RiskWeightConfig,
    NeighbourhoodRiskScore,
    RiskOverview,
    FormulaDocumentation,
)
from .data_service import data_service

FORMULAS_DOCS = [
    FormulaDocumentation(
        indicator_name="Urban Heat Risk Index (UHRI)",
        mathematical_formula="UHRI = 0.50 * clip(((T_surface - T_base) / 10) * 100, 0, 100) + 0.30 * (100 - Canopy_pct) + 0.20 * Impervious_pct",
        description="Quantifies local thermal stress by integrating thermal anomaly above ambient baseline, tree canopy cooling deficit, and surface albedo/impermeability factor.",
        inputs=["surface_temp_c", "baseline_temp_c", "tree_canopy_pct", "impervious_surface_pct"],
        normalisation_method="Linear min-max bounding [0, 100]",
        scientific_limitations="Assumes satellite-derived land surface temperature correlates with human thermal comfort; does not incorporate micro-scale wind corridors or relative humidity."
    ),
    FormulaDocumentation(
        indicator_name="Stormwater Runoff & Inundation Risk Index (SRIRI)",
        mathematical_formula="SRIRI = 0.60 * clip((Runoff_extreme / max(1, Drainage_capacity)) * 50, 0, 100) + 0.40 * Impervious_pct",
        description="Evaluates drainage system hydraulic capacity exceedance during 10-year storm events coupled with impervious barrier density.",
        inputs=["extreme_rainfall_runoff_m3", "drainage_capacity_m3", "impervious_surface_pct"],
        normalisation_method="Hydraulic ratio scaled to [0, 100] with 2.0x overload reaching 100",
        scientific_limitations="Simplified rational hydrograph model; does not calculate pipe-by-pipe hydraulic grade lines or backwater tidal effects."
    ),
    FormulaDocumentation(
        indicator_name="Municipal Water Stress Index (MWSI)",
        mathematical_formula="MWSI = clip((Water_demand / max(1, Water_supply)) * 75, 0, 100)",
        description="Measures baseline municipal water vulnerability by comparing daily consumption with available utility yield.",
        inputs=["water_demand_m3_day", "water_supply_m3_day"],
        normalisation_method="Deficit ratio where demand > 1.33x supply triggers max stress (100)",
        scientific_limitations="Reflects daily average municipal distribution; does not reflect seasonal aquifer recharge dynamics or water quality."
    ),
    FormulaDocumentation(
        indicator_name="Green Canopy & Access Gap (GCAG)",
        mathematical_formula="GCAG = 0.60 * (100 - Canopy_pct) + 0.40 * (100 - Park_access_pct)",
        description="Measures neighbourhood green infrastructure deficits relative to WHO guidelines (15-minute park access and 30% canopy target).",
        inputs=["tree_canopy_pct", "park_access_pct"],
        normalisation_method="Deficit inversion [0, 100]",
        scientific_limitations="Treats all canopy types uniformly without differentiating native shade trees from small ornamental shrubs."
    ),
    FormulaDocumentation(
        indicator_name="Composite Climate Vulnerability Score (CCVS)",
        mathematical_formula="CCVS = (w_heat * UHRI + w_flood * SRIRI + w_water * MWSI + w_green * GCAG + w_equity * (SVI * 100)) / sum(weights)",
        description="Transparent multi-hazard index integrating environmental hazards with underlying socioeconomic sensitivity.",
        inputs=["UHRI", "SRIRI", "MWSI", "GCAG", "social_vulnerability_index", "weights"],
        normalisation_method="Weighted linear combination [0, 100]",
        scientific_limitations="Linear weighting assumes non-interacting hazards; in extreme climate shocks, co-occurring stressors can exhibit non-linear compounding impacts."
    ),
]

class RiskService:
    def calculate_risk(self, dataset_id: str, weights: Optional[RiskWeightConfig] = None) -> Optional[RiskOverview]:
        df = data_service.get_dataset(dataset_id)
        meta = data_service.get_dataset_metadata(dataset_id)
        if df is None or meta is None:
            return None

        if weights is None:
            weights = RiskWeightConfig()

        scores: List[NeighbourhoodRiskScore] = []
        total_weight = (
            weights.heat_weight +
            weights.flood_weight +
            weights.water_stress_weight +
            weights.green_gap_weight +
            weights.equity_weight
        )
        if total_weight <= 0:
            total_weight = 1.0

        for _, row in df.iterrows():
            # 1. Heat risk
            t_surf = float(row.get("surface_temp_c", 30.0))
            t_base = float(row.get("baseline_temp_c", 30.0))
            temp_diff = max(0.0, t_surf - t_base)
            canopy_pct = float(row.get("tree_canopy_pct", 10.0))
            imperv_pct = float(row.get("impervious_surface_pct", 50.0))
            
            heat_score = (
                0.50 * min(100.0, (temp_diff / 10.0) * 100.0) +
                0.30 * max(0.0, 100.0 - canopy_pct) +
                0.20 * imperv_pct
            )
            heat_score = round(min(100.0, max(0.0, heat_score)), 1)

            # 2. Flood risk
            runoff_m3 = float(row.get("extreme_rainfall_runoff_m3", 100000.0))
            drainage_m3 = float(row.get("drainage_capacity_m3", 100000.0))
            drainage_ratio = (runoff_m3 / max(1.0, drainage_m3))
            flood_score = (
                0.60 * min(100.0, drainage_ratio * 50.0) +
                0.40 * imperv_pct
            )
            flood_score = round(min(100.0, max(0.0, flood_score)), 1)

            # 3. Water stress
            demand_m3 = float(row.get("water_demand_m3_day", 10000.0))
            supply_m3 = float(row.get("water_supply_m3_day", 10000.0))
            stress_score = round(min(100.0, max(0.0, (demand_m3 / max(1.0, supply_m3)) * 75.0)), 1)

            # 4. Green cover gap
            park_access = float(row.get("park_access_pct", 50.0))
            green_gap = (
                0.60 * max(0.0, 100.0 - canopy_pct) +
                0.40 * max(0.0, 100.0 - park_access)
            )
            green_gap = round(min(100.0, max(0.0, green_gap)), 1)

            # 5. Social vulnerability
            svi = float(row.get("social_vulnerability_index", 0.5))

            # Composite
            composite = (
                weights.heat_weight * heat_score +
                weights.flood_weight * flood_score +
                weights.water_stress_weight * stress_score +
                weights.green_gap_weight * green_gap +
                weights.equity_weight * (svi * 100.0)
            ) / total_weight
            composite = round(min(100.0, max(0.0, composite)), 1)

            # Carbon per capita
            carbon_val = row.get("current_carbon_emissions_tco2")
            pop = int(row.get("population", 1))
            carbon_per_capita = None
            if pd.notnull(carbon_val) and pop > 0:
                carbon_per_capita = round(float(carbon_val) / pop, 2)

            # Primary risk driver
            hazard_map = {
                "Urban Heat Island": heat_score,
                "Stormwater Inundation": flood_score,
                "Municipal Water Deficit": stress_score,
                "Green Space Deprivation": green_gap,
            }
            primary_driver = max(hazard_map.items(), key=lambda x: x[1])[0]

            # Caveats
            caveats = []
            if t_surf >= 38.0:
                caveats.append("Extreme surface temperature exceeds public health heat advisory thresholds.")
            if drainage_ratio > 1.2:
                caveats.append("Stormwater runoff exceeds sewer drainage rating by >20% during peak events.")
            if stress_score > 70.0:
                caveats.append("Water demand severely strains local municipal supply buffers.")

            scores.append(NeighbourhoodRiskScore(
                neighbourhood_id=str(row["neighbourhood_id"]),
                neighbourhood_name=str(row["neighbourhood_name"]),
                population=pop,
                surface_temp_c=t_surf,
                heat_risk_score=heat_score,
                flood_risk_score=flood_score,
                water_stress_score=stress_score,
                green_gap_score=green_gap,
                social_vulnerability_index=svi,
                composite_risk_score=composite,
                carbon_tco2_per_capita=carbon_per_capita,
                primary_risk_driver=primary_driver,
                data_quality_label="High Confidence" if not caveats else "Moderate Confidence (High Exposure)",
                warnings_or_caveats=caveats,
            ))

        # Overall summary
        scores_sorted = sorted(scores, key=lambda s: s.composite_risk_score, reverse=True)
        city_avg = round(float(np.mean([s.composite_risk_score for s in scores])), 1)

        limitations = [
            "Data reflects aggregate district averages; intra-neighbourhood microclimates and street-level variations are not captured.",
            "Water stress calculation is based on current municipal infrastructure and does not model future regional aquifer depletion.",
            "Flood risk accounts for 10-year storm recurrence events; 100-year catastrophic floods require dynamic 2D hydrodynamic simulation.",
            "Social Vulnerability Index is an aggregated screening proxy; it must not be used to profile individuals or replace community townhalls.",
        ]

        return RiskOverview(
            dataset_id=dataset_id,
            dataset_name=meta.name,
            city_composite_risk=city_avg,
            highest_risk_neighbourhood=scores_sorted[0].neighbourhood_name if scores_sorted else "N/A",
            lowest_risk_neighbourhood=scores_sorted[-1].neighbourhood_name if scores_sorted else "N/A",
            weights_applied=weights,
            neighbourhood_scores=scores,
            formulas_documentation=FORMULAS_DOCS,
            limitations=limitations,
        )

risk_service = RiskService()
