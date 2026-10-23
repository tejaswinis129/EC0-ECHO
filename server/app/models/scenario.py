from typing import List, Optional, Dict, Any
from enum import Enum
from pydantic import BaseModel, Field
from .optimisation import AlternativePortfolio, OptimisationRequest

class ScenarioType(str, Enum):
    DROUGHT = "drought"
    EXTREME_RAINFALL = "extreme_rainfall"
    BUDGET_CUT = "budget_cut"
    COMBINED_SHOCK = "combined_shock"
    CUSTOM = "custom"

class ScenarioParams(BaseModel):
    scenario_type: ScenarioType
    scenario_name: str = "Custom Stress Test"
    water_supply_change_pct: float = Field(
        default=0.0, description="Percentage shift in municipal water availability (e.g. -50% in drought)"
    )
    extreme_rainfall_surge_pct: float = Field(
        default=0.0, description="Percentage increase in peak storm runoff volume (e.g. +40% in extreme storm)"
    )
    budget_cut_pct: float = Field(
        default=0.0, ge=0.0, le=90.0, description="Percentage reduction in available capital budget (e.g. 30%)"
    )
    temperature_anomaly_c: float = Field(
        default=0.0, ge=-5.0, le=10.0, description="Summer heatwave anomaly addition (°C)"
    )
    base_optimisation_request: OptimisationRequest

class ScenarioDelta(BaseModel):
    capital_cost_difference: float
    water_impact_difference_m3: float
    runoff_reduction_difference_m3: float
    heat_score_difference: float
    equity_score_difference: float
    abandoned_or_reduced_interventions: List[str]
    newly_prioritised_interventions: List[str]

class ScenarioSimulationResult(BaseModel):
    scenario_type: ScenarioType
    scenario_name: str
    scenario_narrative: str
    applied_parameters: Dict[str, Any]
    
    # Baseline comparison
    baseline_portfolio: AlternativePortfolio
    scenario_portfolio: AlternativePortfolio
    deltas: ScenarioDelta
    
    # Strategic shifts
    new_vulnerabilities_introduced: List[str]
    unintended_consequences: List[str]
    recommended_mitigations: List[str]
    uncertainty_level: str
    disclaimer: str
