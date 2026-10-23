from typing import List, Optional
from enum import Enum
from pydantic import BaseModel, Field

class InterventionType(str, Enum):
    GREEN_ROOF = "green_roof"
    URBAN_FOREST = "urban_forest"
    RAINWATER_HARVESTING = "rainwater_harvesting"
    SUDS_BIOSWALE = "suds_bioswale"
    PERMEABLE_PAVEMENT = "permeable_pavement"

class SpaceRequirementType(str, Enum):
    ROOF = "available_roof_area_m2"
    PUBLIC_LAND = "available_public_land_m2"
    ROAD_CORRIDOR = "available_road_corridor_m2"

class InterventionDefinition(BaseModel):
    id: str
    type: InterventionType
    name: str
    category: str
    description: str
    unit_label: str = Field(..., description="e.g. 'm² installed', 'trees planted', 'm³ cistern capacity'")
    
    # Financial metrics
    capital_cost_per_unit: float = Field(..., ge=0, description="Upfront capital cost per unit in USD")
    annual_maintenance_per_unit: float = Field(..., ge=0, description="Annual maintenance and operational cost per unit in USD")
    
    # Space & Resource Requirements
    space_type: SpaceRequirementType
    space_consumed_m2_per_unit: float = Field(..., ge=0, description="Ground or roof surface required per unit")
    water_demand_m3_per_unit_year: float = Field(
        ...,
        description="Net annual water required (positive = consumes water, negative = harvests/saves water)"
    )
    
    # Performance & Environmental Impacts
    heat_reduction_index_per_unit: float = Field(
        ..., ge=0, description="Local cooling effect factor per unit installed"
    )
    runoff_reduction_m3_per_unit_year: float = Field(
        ..., ge=0, description="Volume of stormwater runoff diverted or absorbed annually per unit"
    )
    carbon_sequestration_kg_per_unit_year: Optional[float] = Field(
        default=None, description="Carbon dioxide sequestered or avoided annually (kg CO2e)"
    )
    
    # Lifespan and Operational Constraints
    implementation_time_months: int = Field(..., ge=1, description="Average deployment timeline")
    expected_lifespan_years: int = Field(..., ge=1, description="Asset operating lifespan before overhaul")
    
    # Provenance and Uncertainty
    data_source: str = Field(..., description="Scientific literature, EPA, or municipal benchmarking source")
    confidence_level: str = Field(..., description="'High', 'Medium', or 'Low'")
    is_custom: bool = False
