from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class OptimisationWeights(BaseModel):
    heat_reduction: float = Field(default=0.25, ge=0.0, le=1.0)
    flood_reduction: float = Field(default=0.25, ge=0.0, le=1.0)
    water_resilience: float = Field(default=0.20, ge=0.0, le=1.0)
    green_equity: float = Field(default=0.20, ge=0.0, le=1.0)
    cost_efficiency: float = Field(default=0.10, ge=0.0, le=1.0)

class OptimisationRequest(BaseModel):
    dataset_id: str
    total_budget_cap: float = Field(..., gt=0, description="Maximum upfront capital expenditure in USD")
    max_annual_maintenance_budget: Optional[float] = Field(
        default=None, description="Optional cap on ongoing operational and maintenance expenses"
    )
    max_additional_water_demand_m3_year: Optional[float] = Field(
        default=None, description="Optional cap on additional net municipal water consumed by new interventions"
    )
    min_equity_investment_share: float = Field(
        default=0.30, ge=0.0, le=1.0, description="Minimum fraction of capital that must be allocated to high-vulnerability neighbourhoods"
    )
    target_neighbourhood_ids: Optional[List[str]] = Field(
        default=None, description="Subset of neighbourhood IDs to include, or None for all"
    )
    weights: OptimisationWeights = Field(default_factory=OptimisationWeights)

class InterventionAllocation(BaseModel):
    intervention_id: str
    intervention_name: str
    neighbourhood_id: str
    neighbourhood_name: str
    units_allocated: float = Field(..., ge=0)
    unit_label: str
    capital_cost: float
    annual_maintenance: float
    space_used_m2: float
    water_demand_impact_m3_year: float
    estimated_heat_reduction_deg_effect: float
    estimated_runoff_reduction_m3: float

class NeighbourhoodAllocationSummary(BaseModel):
    neighbourhood_id: str
    neighbourhood_name: str
    population: int
    social_vulnerability_index: float
    capital_allocated: float
    annual_maintenance_allocated: float
    heat_risk_reduction_pct: float
    flood_runoff_reduction_pct: float
    net_water_impact_m3_year: float
    interventions_count: int

class AlternativePortfolio(BaseModel):
    strategy_id: str = Field(..., description="'cost_focused', 'balanced', or 'equity_focused'")
    strategy_label: str
    strategy_rationale: str
    
    # Financial aggregate
    total_capital_cost: float
    total_annual_maintenance: float
    budget_utilization_pct: float
    
    # Environmental aggregates
    net_annual_water_impact_m3: float
    total_stormwater_runoff_diverted_m3: float
    estimated_city_heat_reduction_score: float
    total_carbon_sequestration_tco2_year: float
    
    # Equity aggregate
    equity_score: float = Field(..., ge=0, le=100, description="Score measuring progress in closing climate vulnerability gaps")
    vulnerable_area_investment_share_pct: float
    
    # Detailed breakdowns
    allocations: List[InterventionAllocation]
    neighbourhood_summaries: List[NeighbourhoodAllocationSummary]
    
    # Mathematical and decision diagnostics
    binding_constraints: List[str]
    trade_off_summary: List[str]
    solver_status: str

class InfeasibilityReport(BaseModel):
    is_infeasible: bool
    explanation: str
    primary_bottleneck: str
    suggested_remedy: str
    conflicting_constraints: List[str]

class OptimisationResult(BaseModel):
    dataset_id: str
    dataset_name: str
    is_feasible: bool
    selected_strategy: str = "balanced"
    alternatives: List[AlternativePortfolio]
    infeasibility_report: Optional[InfeasibilityReport] = None
    solver_engine: str = "PuLP-SciPy Multi-Objective Simplex & Interior Point"
    execution_time_ms: float
