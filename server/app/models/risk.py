from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class RiskWeightConfig(BaseModel):
    heat_weight: float = Field(default=0.25, ge=0.0, le=1.0)
    flood_weight: float = Field(default=0.25, ge=0.0, le=1.0)
    water_stress_weight: float = Field(default=0.20, ge=0.0, le=1.0)
    green_gap_weight: float = Field(default=0.15, ge=0.0, le=1.0)
    equity_weight: float = Field(default=0.15, ge=0.0, le=1.0)

class NeighbourhoodRiskScore(BaseModel):
    neighbourhood_id: str
    neighbourhood_name: str
    population: int
    surface_temp_c: float
    
    # 0 - 100 normalised indicators
    heat_risk_score: float = Field(..., ge=0, le=100, description="Normalized heat exposure and canopy deficit score")
    flood_risk_score: float = Field(..., ge=0, le=100, description="Normalized runoff overload risk score")
    water_stress_score: float = Field(..., ge=0, le=100, description="Normalized municipal demand vs supply deficit score")
    green_gap_score: float = Field(..., ge=0, le=100, description="Normalized tree canopy and park accessibility deficit")
    social_vulnerability_index: float = Field(..., ge=0, le=1, description="Raw social vulnerability index")
    
    # Composite risk score (transparently computed from weights)
    composite_risk_score: float = Field(..., ge=0, le=100, description="Weighted composite climate risk score")
    
    # Carbon footprint indicator (or None if unavailable)
    carbon_tco2_per_capita: Optional[float] = None
    
    # Transparency fields
    primary_risk_driver: str
    data_quality_label: str = Field(default="High Confidence")
    warnings_or_caveats: List[str] = Field(default_factory=list)

class FormulaDocumentation(BaseModel):
    indicator_name: str
    mathematical_formula: str
    description: str
    inputs: List[str]
    normalisation_method: str
    scientific_limitations: str

class RiskOverview(BaseModel):
    dataset_id: str
    dataset_name: str
    city_composite_risk: float
    highest_risk_neighbourhood: str
    lowest_risk_neighbourhood: str
    weights_applied: RiskWeightConfig
    neighbourhood_scores: List[NeighbourhoodRiskScore]
    formulas_documentation: List[FormulaDocumentation]
    limitations: List[str]
