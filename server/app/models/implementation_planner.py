from typing import List, Optional, Dict, Any, Union
from enum import Enum
from pydantic import BaseModel, Field
from .diagram_models import StructureDiagram
from .evidence import RealWorldEvidenceRecord

class InterventionCategory(str, Enum):
    STORMWATER_DRAINAGE = "stormwater_drainage"
    ROAD_CONSTRUCTION = "road_construction"
    FOOTPATHS_PEDESTRIAN = "footpaths_pedestrian"
    RAINWATER_HARVESTING = "rainwater_harvesting"
    WATER_SUPPLY = "water_supply"
    WASTEWATER_SEWAGE = "wastewater_sewage"
    URBAN_FOREST = "urban_forest"
    PARKS_BIODIVERSITY = "parks_biodiversity"
    GREEN_ROOFS = "green_roofs"
    HEAT_MITIGATION = "heat_mitigation"
    WASTE_MANAGEMENT = "waste_management"
    RENEWABLE_ENERGY = "renewable_energy"
    PUBLIC_TRANSPORT = "public_transport"
    EROSION_CONTROL = "erosion_control"
    MULTI_INTERVENTION_INTEGRATED = "multi_intervention_integrated"
    OTHER = "other"

class DataStatus(str, Enum):
    VERIFIED = "Provided and verified"
    UNVERIFIED = "Provided but unverified"
    ESTIMATED = "Estimated"
    MISSING = "Missing and required"
    NOT_APPLICABLE = "Not applicable"

class SiteInvestigationItem(BaseModel):
    category: str
    item_name: str
    status: DataStatus
    importance: str  # Critical, High, Moderate
    description: str
    recommended_survey_or_standard: str

class DesignAlternative(BaseModel):
    id: str
    name: str
    concept_summary: str
    how_it_works: str
    suitability: str
    required_space: str
    expected_benefits: List[str]
    construction_disruption_level: str  # Low, Moderate, High
    estimated_cost_level: str  # Low, Moderate, High
    maintenance_implications: str
    environmental_and_social_consequences: str
    key_limitations_and_risks: List[str]
    when_not_to_select: str

class ConstructionPhase(BaseModel):
    phase_number: int
    name: str
    purpose: str
    work_to_be_performed: List[str]
    dependencies: List[str]
    responsible_parties: List[str]
    materials_and_equipment: List[str]
    estimated_duration_range: str
    access_and_safety_requirements: List[str]
    required_inspections_or_approvals: List[str]
    completion_criteria: str
    main_risks_and_mitigation: List[str]

class CommunityDisruptionItem(BaseModel):
    disruption_type: str
    what_could_happen: str
    who_is_affected: List[str]
    preventive_mitigation: str
    alternative_access_or_service: str
    monitoring_responsible: str
    contingency_if_mitigation_fails: str
    residual_risk: str

class CommunityProtectionPlan(BaseModel):
    affected_stakeholder_groups: List[str]
    disruptions: List[CommunityDisruptionItem]
    school_and_hospital_protocol: str
    emergency_vehicle_access_plan: str
    noise_dust_vibration_controls: List[str]
    utility_protection_protocol: str
    advance_notice_and_communication_plan: str
    complaint_reporting_and_hotline: str
    restoration_of_roads_and_paths: str

class WeatherProtectionPlan(BaseModel):
    is_weather_sensitive: bool
    applicable_hazards: List[str]
    seasonal_climate_assessment: str
    forecast_warning_monitoring_thresholds: List[str]
    temporary_drainage_and_diversion_measures: List[str]
    excavation_and_trench_protection: str
    erosion_and_sediment_control: str
    stop_work_and_site_evacuation_triggers: List[str]
    emergency_contacts_and_escalation: List[str]
    safe_restart_criteria_after_severe_weather: str
    drainage_system_distinctions: Optional[Dict[str, str]] = None

class BudgetItem(BaseModel):
    category: str
    description: str
    amount: float
    currency: str = "USD"
    unit_quantity: Optional[str] = None
    status: str = "Estimated"
    assumptions: str
    cost_uncertainty_range: str

class ImplementationBudget(BaseModel):
    currency: str = "USD"
    items: List[BudgetItem]
    total_permanent_works_cost: float
    total_temporary_and_protective_cost: float
    total_traffic_and_community_cost: float
    total_contingency_reserve: float
    total_estimated_capital_outlay: float
    annual_maintenance_estimate: float
    ten_year_lifecycle_estimate: float
    budget_ceiling: Optional[float] = None
    fits_within_budget: bool
    budget_shortfall_or_cushion: float
    budget_explanation: str

class ImplementationRisk(BaseModel):
    risk_id: str
    title: str
    risk_description: str
    likelihood: str  # Low, Medium, High
    severity: str    # Minor, Moderate, Major, Critical
    affected_parties_or_assets: List[str]
    early_warning_signs: List[str]
    preventive_measures: List[str]
    contingency_actions: List[str]
    responsible_party: str
    residual_risk_level: str
    requires_licensed_engineer: bool = True

class ImplementationConsequence(BaseModel):
    id: str
    impact_type: str  # Positive Benefit, Adverse Trade-off, Neutral/Uncertain
    domain: str        # Flood, Heat, Water, Carbon, Livelihoods, Equity
    description: str
    magnitude_estimate: str
    who_benefits: str
    who_bears_costs: str
    equity_mitigation_measure: Optional[str] = None

class QualityAndTestingItem(BaseModel):
    test_number: int
    inspection_or_test_name: str
    timing: str
    testing_procedure: str
    acceptance_criteria: str
    responsible_inspector: str
    records_to_maintain: str
    corrective_action_if_failed: str

class MaintenancePlanItem(BaseModel):
    activity_name: str
    frequency_or_trigger: str
    responsible_party: str
    required_tools_and_materials: str
    annual_cost_estimate: str
    performance_indicators: List[str]
    warning_signs_of_failure: List[str]
    escalation_and_repair_protocol: str

class ImplementationPlanRequest(BaseModel):
    prompt: str = Field(..., description="Normal English description of the project or problem")
    location_or_neighbourhood: Optional[str] = None
    intervention_type: Optional[str] = None
    main_goal: Optional[str] = None
    budget_ceiling: Optional[float] = None
    currency: str = "USD"
    available_space_m2: Optional[float] = None
    start_date: Optional[str] = None
    target_completion_date: Optional[str] = None
    weather_constraints: Optional[str] = None
    existing_infrastructure_condition: Optional[str] = None
    nearby_critical_facilities: Optional[List[str]] = Field(default_factory=list)
    required_service_continuity: Optional[List[str]] = Field(default_factory=list)
    dataset_id: Optional[str] = None
    selected_strategy: Optional[str] = None
    attached_file_ids: Optional[List[str]] = Field(default_factory=list)
    source_ids: Optional[List[str]] = Field(default_factory=list)

class ClassificationResult(BaseModel):
    primary_category: InterventionCategory
    secondary_categories: List[InterventionCategory]
    confidence_score: float
    detected_goals: List[str]
    detected_constraints: List[str]
    is_weather_sensitive: bool
    is_traffic_sensitive: bool
    is_utility_sensitive: bool
    is_multidisciplinary: bool
    suggested_followups: List[str]

class ImplementationPlan(BaseModel):
    plan_id: str
    created_at: str
    reproducibility_hash: str
    project_name: str
    user_stated_problem: str
    main_objectives: List[str]
    location_or_neighbourhood: str
    dataset_id: Optional[str] = None
    classification: ClassificationResult
    summary_simple_english: str
    data_completeness_pct: float
    verified_facts: List[str]
    planning_assumptions: List[str]
    missing_critical_data: List[str]
    approval_and_licensing_requirements: List[str]
    site_investigations: List[SiteInvestigationItem]
    recommended_design: DesignAlternative
    design_alternatives: List[DesignAlternative]
    construction_phases: List[ConstructionPhase]
    community_protection: CommunityProtectionPlan
    weather_protection: WeatherProtectionPlan
    budget: ImplementationBudget
    risk_register: List[ImplementationRisk]
    consequences: List[ImplementationConsequence]
    quality_assurance: List[QualityAndTestingItem]
    maintenance_plan: List[MaintenancePlanItem]
    standards_and_guidance_citations: List[Dict[str, str]]
    professional_disclaimer: str
    structure_diagram: Optional[StructureDiagram] = None
    evidence_records: List[RealWorldEvidenceRecord] = Field(default_factory=list)
    uncertainty_labels: Dict[str, str] = Field(default_factory=dict)
