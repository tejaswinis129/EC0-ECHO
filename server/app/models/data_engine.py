from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class NeighbourhoodRecord(BaseModel):
    neighbourhood_id: str = Field(..., description="Unique alphanumeric identifier")
    neighbourhood_name: str = Field(..., description="Official neighbourhood or district name")
    population: int = Field(..., ge=0, description="Total resident population")
    area_sqkm: float = Field(..., gt=0, description="Surface area in square kilometers")
    surface_temp_c: float = Field(..., description="Mean summer land surface temperature (°C)")
    baseline_temp_c: float = Field(default=30.0, description="Regional ambient baseline temperature (°C)")
    impervious_surface_pct: float = Field(..., ge=0, le=100, description="Percentage of paved/sealed surface")
    tree_canopy_pct: float = Field(..., ge=0, le=100, description="Current tree canopy percentage")
    park_access_pct: float = Field(..., ge=0, le=100, description="Share of population living within 500m of a park")
    annual_rainfall_mm: float = Field(..., ge=0, description="Annual mean precipitation (mm)")
    extreme_rainfall_runoff_m3: float = Field(..., ge=0, description="Peak storm event runoff volume (m³)")
    drainage_capacity_m3: float = Field(..., ge=0, description="Installed storm sewer handling capacity (m³)")
    water_demand_m3_day: float = Field(..., ge=0, description="Average daily municipal water demand (m³/day)")
    water_supply_m3_day: float = Field(..., ge=0, description="Average daily municipal water supply (m³/day)")
    social_vulnerability_index: float = Field(..., ge=0.0, le=1.0, description="Socioeconomic vulnerability metric (0.0 to 1.0)")
    available_roof_area_m2: float = Field(..., ge=0, description="Potential roof surface for greening (m²)")
    available_public_land_m2: float = Field(..., ge=0, description="Potential public land for urban forests (m²)")
    available_road_corridor_m2: float = Field(..., ge=0, description="Potential road corridor for permeable pavements (m²)")
    current_carbon_emissions_tco2: Optional[float] = Field(default=None, ge=0, description="Annual carbon emissions (tCO2e)")

class ValidationIssue(BaseModel):
    severity: str = Field(..., description="'error', 'warning', or 'info'")
    column: Optional[str] = None
    row: Optional[int] = None
    message: str

class ValidationReport(BaseModel):
    is_valid: bool
    total_rows: int
    issues: List[ValidationIssue]
    columns_found: List[str]
    missing_required_columns: List[str]
    data_quality_score: float = Field(..., ge=0, le=100, description="Data completeness and reliability percentage")
    summary: str

class DatasetMetadata(BaseModel):
    dataset_id: str
    name: str
    description: str
    provenance: str
    created_at: str
    row_count: int
    is_sample: bool = False
    file_size_bytes: int = 0

class DatasetSummary(BaseModel):
    total_population: int
    total_area_sqkm: float
    avg_surface_temp_c: float
    avg_tree_canopy_pct: float
    avg_impervious_pct: float
    avg_park_access_pct: float
    total_water_demand_m3_day: float
    total_water_supply_m3_day: float
    water_stress_ratio: float
    avg_social_vulnerability: float
    total_available_roof_m2: float
    total_available_public_land_m2: float
    total_available_corridor_m2: float
    neighbourhood_count: int
