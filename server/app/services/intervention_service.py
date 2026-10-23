from typing import List, Dict, Optional
from ..models.intervention import (
    InterventionDefinition,
    InterventionType,
    SpaceRequirementType,
)

DEFAULT_INTERVENTIONS: List[InterventionDefinition] = [
    InterventionDefinition(
        id="int-green-roof",
        type=InterventionType.GREEN_ROOF,
        name="Extensive Sedum Green Roof",
        category="Rooftop Nature-Based Solution",
        description="Lightweight vegetative rooftop blanket (70-120mm depth) with drought-resistant sedum and succulent species. Reduces roof surface thermal gain by up to 15°C and retains initial storm precipitation.",
        unit_label="m² of installed roof",
        capital_cost_per_unit=110.0,
        annual_maintenance_per_unit=4.5,
        space_type=SpaceRequirementType.ROOF,
        space_consumed_m2_per_unit=1.0,
        water_demand_m3_per_unit_year=0.08,  # requires minimal establishment and dry-spell irrigation
        heat_reduction_index_per_unit=0.0022,
        runoff_reduction_m3_per_unit_year=0.45,
        carbon_sequestration_kg_per_unit_year=1.8,
        implementation_time_months=4,
        expected_lifespan_years=35,
        data_source="US EPA Heat Island Reduction Guidelines & European Green Roof Association (EFB)",
        confidence_level="High",
        is_custom=False,
    ),
    InterventionDefinition(
        id="int-urban-forest",
        type=InterventionType.URBAN_FOREST,
        name="Urban Micro-Forest & Native Shade Trees",
        category="Canopy Expansion",
        description="Miyawaki-style dense planting or street-tree canopies using native multi-tier deciduous and evergreen species. Maximizes evapotranspiration cooling, local biodiversity, and air filtration.",
        unit_label="trees planted (approx. 15m² canopy)",
        capital_cost_per_unit=380.0,
        annual_maintenance_per_unit=28.0,
        space_type=SpaceRequirementType.PUBLIC_LAND,
        space_consumed_m2_per_unit=15.0,
        water_demand_m3_per_unit_year=1.65,  # significant watering during early years and severe drought
        heat_reduction_index_per_unit=0.045,
        runoff_reduction_m3_per_unit_year=3.2,
        carbon_sequestration_kg_per_unit_year=22.5,
        implementation_time_months=6,
        expected_lifespan_years=50,
        data_source="USDA Forest Service i-Tree Eco Model & UK Forestry Commission",
        confidence_level="High",
        is_custom=False,
    ),
    InterventionDefinition(
        id="int-rainwater-harvesting",
        type=InterventionType.RAINWATER_HARVESTING,
        name="Modular Rainwater Harvesting & Retention Cistern",
        category="Water Resilience & Storage",
        description="Underground or building-coupled modular water retention cisterns equipped with smart filtration. Captures rooftop runoff, dampens sewer discharge peaks, and provides non-potable irrigation supply.",
        unit_label="m³ cistern capacity installed",
        capital_cost_per_unit=240.0,
        annual_maintenance_per_unit=12.0,
        space_type=SpaceRequirementType.ROOF,  # or basement/lot
        space_consumed_m2_per_unit=1.2,
        water_demand_m3_per_unit_year=-28.0,  # NEGATIVE water demand = NET WATER HARVESTED & SUPPLIED!
        heat_reduction_index_per_unit=0.0005,
        runoff_reduction_m3_per_unit_year=32.0,
        carbon_sequestration_kg_per_unit_year=0.5,
        implementation_time_months=3,
        expected_lifespan_years=30,
        data_source="American Rainwater Catchment Systems Association (ARCSA) & CIRIA SuDS Manual",
        confidence_level="High",
        is_custom=False,
    ),
    InterventionDefinition(
        id="int-suds-bioswale",
        type=InterventionType.SUDS_BIOSWALE,
        name="Engineered Bioswales & Bioretention Basins",
        category="Sustainable Urban Drainage (SuDS)",
        description="Vegetated drainage swales with engineered soil filtration media and gravel retention trenches. Diverts street runoff, traps heavy metals/suspended solids, and reduces localized street pooling.",
        unit_label="m² bioretention area",
        capital_cost_per_unit=85.0,
        annual_maintenance_per_unit=6.5,
        space_type=SpaceRequirementType.PUBLIC_LAND,
        space_consumed_m2_per_unit=1.0,
        water_demand_m3_per_unit_year=0.05,
        heat_reduction_index_per_unit=0.0018,
        runoff_reduction_m3_per_unit_year=1.85,
        carbon_sequestration_kg_per_unit_year=3.4,
        implementation_time_months=4,
        expected_lifespan_years=25,
        data_source="Federal Highway Administration (FHWA) Stormwater Best Management Practices",
        confidence_level="High",
        is_custom=False,
    ),
    InterventionDefinition(
        id="int-permeable-pavement",
        type=InterventionType.PERMEABLE_PAVEMENT,
        name="Permeable Interlocking Pavements & Green Corridors",
        category="Infiltration Surface",
        description="Porous pavers and crushed stone sub-bases installed along parking lanes, pedestrian plazas, and alleyways. Allows stormwater to infiltrate directly into local subsoil without entering storm sewers.",
        unit_label="m² permeable surface",
        capital_cost_per_unit=75.0,
        annual_maintenance_per_unit=3.8,
        space_type=SpaceRequirementType.ROAD_CORRIDOR,
        space_consumed_m2_per_unit=1.0,
        water_demand_m3_per_unit_year=0.0,
        heat_reduction_index_per_unit=0.0014,
        runoff_reduction_m3_per_unit_year=0.95,
        carbon_sequestration_kg_per_unit_year=0.2,
        implementation_time_months=3,
        expected_lifespan_years=20,
        data_source="Interlocking Concrete Pavement Institute (ICPI) Environmental Product Declarations",
        confidence_level="High",
        is_custom=False,
    ),
]

class InterventionService:
    def __init__(self):
        self._interventions: Dict[str, InterventionDefinition] = {
            item.id: item for item in DEFAULT_INTERVENTIONS
        }

    def list_interventions(self) -> List[InterventionDefinition]:
        return list(self._interventions.values())

    def get_intervention(self, intervention_id: str) -> Optional[InterventionDefinition]:
        return self._interventions.get(intervention_id)

    def upsert_intervention(self, intervention: InterventionDefinition) -> InterventionDefinition:
        self._interventions[intervention.id] = intervention
        return intervention

    def reset_defaults(self):
        self._interventions = {item.id: item for item in DEFAULT_INTERVENTIONS}

intervention_service = InterventionService()
