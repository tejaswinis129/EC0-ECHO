export interface DatasetMetadata {
  dataset_id: string;
  name: string;
  description: string;
  provenance: string;
  created_at: string;
  row_count: number;
  is_sample: boolean;
  file_size_bytes: number;
}

export interface ValidationIssue {
  severity: "error" | "warning" | "info";
  column?: string;
  row?: number;
  message: string;
}

export interface ValidationReport {
  is_valid: boolean;
  total_rows: number;
  issues: ValidationIssue[];
  columns_found: string[];
  missing_required_columns: string[];
  data_quality_score: number;
  summary: string;
}

export interface DatasetSummary {
  total_population: number;
  total_area_sqkm: number;
  avg_surface_temp_c: number;
  avg_tree_canopy_pct: number;
  avg_impervious_pct: number;
  avg_park_access_pct: number;
  total_water_demand_m3_day: number;
  total_water_supply_m3_day: number;
  water_stress_ratio: number;
  avg_social_vulnerability: number;
  total_available_roof_m2: number;
  total_available_public_land_m2: number;
  total_available_corridor_m2: number;
  neighbourhood_count: number;
}

export interface RiskWeightConfig {
  heat_weight: number;
  flood_weight: number;
  water_stress_weight: number;
  green_gap_weight: number;
  equity_weight: number;
}

export interface NeighbourhoodRiskScore {
  neighbourhood_id: string;
  neighbourhood_name: string;
  population: number;
  surface_temp_c: number;
  heat_risk_score: number;
  flood_risk_score: number;
  water_stress_score: number;
  green_gap_score: number;
  social_vulnerability_index: number;
  composite_risk_score: number;
  carbon_tco2_per_capita?: number;
  primary_risk_driver: string;
  data_quality_label: string;
  warnings_or_caveats: string[];
}

export interface FormulaDocumentation {
  indicator_name: string;
  mathematical_formula: string;
  description: string;
  inputs: string[];
  normalisation_method: string;
  scientific_limitations: string;
}

export interface RiskOverview {
  dataset_id: string;
  dataset_name: string;
  city_composite_risk: number;
  highest_risk_neighbourhood: string;
  lowest_risk_neighbourhood: string;
  weights_applied: RiskWeightConfig;
  neighbourhood_scores: NeighbourhoodRiskScore[];
  formulas_documentation: FormulaDocumentation[];
  limitations: string[];
}

export interface InterventionDefinition {
  id: string;
  type: string;
  name: string;
  category: string;
  description: string;
  unit_label: string;
  capital_cost_per_unit: number;
  annual_maintenance_per_unit: number;
  space_type: string;
  space_consumed_m2_per_unit: number;
  water_demand_m3_per_unit_year: number;
  heat_reduction_index_per_unit: number;
  runoff_reduction_m3_per_unit_year: number;
  carbon_sequestration_kg_per_unit_year?: number;
  implementation_time_months: number;
  expected_lifespan_years: number;
  data_source: string;
  confidence_level: string;
  is_custom: boolean;
}

export interface InterventionAllocation {
  intervention_id: string;
  intervention_name: string;
  neighbourhood_id: string;
  neighbourhood_name: string;
  units_allocated: number;
  unit_label: string;
  capital_cost: number;
  annual_maintenance: number;
  space_used_m2: number;
  water_demand_impact_m3_year: number;
  estimated_heat_reduction_deg_effect: number;
  estimated_runoff_reduction_m3: number;
}

export interface NeighbourhoodAllocationSummary {
  neighbourhood_id: string;
  neighbourhood_name: string;
  population: number;
  social_vulnerability_index: number;
  capital_allocated: number;
  annual_maintenance_allocated: number;
  heat_risk_reduction_pct: number;
  flood_runoff_reduction_pct: number;
  net_water_impact_m3_year: number;
  interventions_count: number;
}

export interface AlternativePortfolio {
  strategy_id: "cost_focused" | "balanced" | "equity_focused";
  strategy_label: string;
  strategy_rationale: string;
  total_capital_cost: number;
  total_annual_maintenance: number;
  budget_utilization_pct: number;
  net_annual_water_impact_m3: number;
  total_stormwater_runoff_diverted_m3: number;
  estimated_city_heat_reduction_score: number;
  total_carbon_sequestration_tco2_year: number;
  equity_score: number;
  vulnerable_area_investment_share_pct: number;
  allocations: InterventionAllocation[];
  neighbourhood_summaries: NeighbourhoodAllocationSummary[];
  binding_constraints: string[];
  trade_off_summary: string[];
  solver_status: string;
}

export interface InfeasibilityReport {
  is_infeasible: boolean;
  explanation: string;
  primary_bottleneck: string;
  suggested_remedy: string;
  conflicting_constraints: string[];
}

export interface OptimisationResult {
  dataset_id: string;
  dataset_name: string;
  is_feasible: boolean;
  selected_strategy: string;
  alternatives: AlternativePortfolio[];
  infeasibility_report?: InfeasibilityReport;
  solver_engine: string;
  execution_time_ms: number;
}

export interface OptimisationRequest {
  dataset_id: string;
  total_budget_cap: number;
  max_annual_maintenance_budget?: number;
  max_additional_water_demand_m3_year?: number;
  min_equity_investment_share: number;
  target_neighbourhood_ids?: string[];
  weights?: {
    heat_reduction: number;
    flood_reduction: number;
    water_resilience: number;
    green_equity: number;
    cost_efficiency: number;
  };
}

export interface ConsequenceNode {
  id: string;
  label: string;
  category: "root_intervention" | "direct_physical_effect" | "environmental_benefit" | "water_consequence" | "financial_consequence" | "social_equity_consequence" | "scenario_vulnerability" | "suggested_mitigation";
  affected_metric: string;
  direction: "positive" | "negative" | "uncertain";
  magnitude_estimate: string;
  source_or_calculation: string;
  confidence: "Measured / Empirical" | "Calculated Model Estimate" | "Literature Benchmark" | "Illustrative Scenario";
  suggested_mitigation?: string;
  detailed_explanation: string;
  depth_level: number;
}

export interface ConsequenceEdge {
  source_id: string;
  target_id: string;
  relationship_label: string;
}

export interface ConsequenceChainGraph {
  portfolio_strategy: string;
  intervention_id: string;
  intervention_name: string;
  neighbourhood_id?: string;
  neighbourhood_name?: string;
  units_deployed: number;
  nodes: ConsequenceNode[];
  edges: ConsequenceEdge[];
  unintended_tradeoffs_summary: string[];
  priority_mitigation_actions: string[];
  active_scenario_impacts?: string;
}

export interface ScenarioParams {
  scenario_type: "drought" | "extreme_rainfall" | "budget_cut" | "combined_shock" | "custom";
  scenario_name?: string;
  water_supply_change_pct: number;
  extreme_rainfall_surge_pct: number;
  budget_cut_pct: number;
  temperature_anomaly_c: number;
  base_optimisation_request: OptimisationRequest;
}

export interface ScenarioSimulationResult {
  scenario_type: string;
  scenario_name: string;
  scenario_narrative: string;
  applied_parameters: Record<string, any>;
  baseline_portfolio: AlternativePortfolio;
  scenario_portfolio: AlternativePortfolio;
  deltas: {
    capital_cost_difference: number;
    water_impact_difference_m3: number;
    runoff_reduction_difference_m3: number;
    heat_score_difference: number;
    equity_score_difference: number;
    abandoned_or_reduced_interventions: string[];
    newly_prioritised_interventions: string[];
  };
  new_vulnerabilities_introduced: string[];
  unintended_consequences: string[];
  recommended_mitigations: string[];
  uncertainty_level: string;
  disclaimer: string;
}

export interface DecisionExplanation {
  executive_summary: string;
  why_selected: string;
  binding_constraints_analysis: string;
  alternatives_comparison: string;
  neighbourhood_equity_analysis: string;
  tradeoffs_and_risks: string;
  what_could_go_wrong: string;
  uncertain_assumptions: string;
  priority_investigations_before_build: string[];
  provider: string;
  model_id?: string;
  is_fallback: boolean;
  generated_at: string;
}

export interface DecisionRecord {
  record_id: string;
  created_at: string;
  reproducibility_hash: string;
  dataset_id: string;
  dataset_name: string;
  dataset_provenance: string;
  optimisation_request: OptimisationRequest;
  baseline_composite_risk: number;
  high_risk_neighbourhood_count: number;
  selected_strategy: string;
  recommended_portfolio: AlternativePortfolio;
  other_alternatives: AlternativePortfolio[];
  scenario_runs: any[];
  key_consequences_identified: string[];
  unintended_tradeoffs: string[];
  critical_mitigations: string[];
  explanation?: DecisionExplanation;
  data_limitations: string[];
  disclaimer: string;
}

export interface SystemStatus {
  app_name: string;
  version: string;
  environment: string;
  database: {
    type: string;
    path: string;
    status: string;
  };
  aws_integrations: {
    credentials_detected: boolean;
    aws_region: string;
    services: Array<{
      service: string;
      role: string;
      configured: boolean;
      model_id?: string;
      bucket?: string;
      status: string;
      optional: boolean;
    }>;
    governance_note: string;
  };
}

// ============================================================================
// Implementation Planner Types
// ============================================================================

export type InterventionCategoryType =
  | "stormwater_drainage"
  | "road_construction"
  | "footpaths_pedestrian"
  | "rainwater_harvesting"
  | "water_supply"
  | "wastewater_sewage"
  | "urban_forest"
  | "parks_biodiversity"
  | "green_roofs"
  | "heat_mitigation"
  | "waste_management"
  | "renewable_energy"
  | "public_transport"
  | "erosion_control"
  | "multi_intervention_integrated"
  | "other";

export interface SiteInvestigationItem {
  category: string;
  item_name: string;
  status: "Provided and verified" | "Provided but unverified" | "Estimated" | "Missing and required" | "Not applicable";
  importance: "Critical" | "High" | "Moderate";
  description: string;
  recommended_survey_or_standard: string;
}

export interface DesignAlternative {
  id: string;
  name: string;
  concept_summary: string;
  how_it_works: string;
  suitability: string;
  required_space: string;
  expected_benefits: string[];
  construction_disruption_level: "Low" | "Moderate" | "High";
  estimated_cost_level: "Low" | "Moderate" | "High";
  maintenance_implications: string;
  environmental_and_social_consequences: string;
  key_limitations_and_risks: string[];
  when_not_to_select: string;
}

export interface ConstructionPhase {
  phase_number: number;
  name: string;
  purpose: string;
  work_to_be_performed: string[];
  dependencies: string[];
  responsible_parties: string[];
  materials_and_equipment: string[];
  estimated_duration_range: string;
  access_and_safety_requirements: string[];
  required_inspections_or_approvals: string[];
  completion_criteria: string;
  main_risks_and_mitigation: string[];
}

export interface CommunityDisruptionItem {
  disruption_type: string;
  what_could_happen: string;
  who_is_affected: string[];
  preventive_mitigation: string;
  alternative_access_or_service: string;
  monitoring_responsible: string;
  contingency_if_mitigation_fails: string;
  residual_risk: string;
}

export interface CommunityProtectionPlan {
  affected_stakeholder_groups: string[];
  disruptions: CommunityDisruptionItem[];
  school_and_hospital_protocol: string;
  emergency_vehicle_access_plan: string;
  noise_dust_vibration_controls: string[];
  utility_protection_protocol: string;
  advance_notice_and_communication_plan: string;
  complaint_reporting_and_hotline: string;
  restoration_of_roads_and_paths: string;
}

export interface WeatherProtectionPlan {
  is_weather_sensitive: boolean;
  applicable_hazards: string[];
  seasonal_climate_assessment: string;
  forecast_warning_monitoring_thresholds: string[];
  temporary_drainage_and_diversion_measures: string[];
  excavation_and_trench_protection: string;
  erosion_and_sediment_control: string;
  stop_work_and_site_evacuation_triggers: string[];
  emergency_contacts_and_escalation: string[];
  safe_restart_criteria_after_severe_weather: string;
  drainage_system_distinctions?: Record<string, string>;
}

export interface BudgetItem {
  category: string;
  description: string;
  amount: number;
  currency: string;
  unit_quantity?: string;
  status: string;
  assumptions: string;
  cost_uncertainty_range: string;
}

export interface ImplementationBudget {
  currency: string;
  items: BudgetItem[];
  total_permanent_works_cost: number;
  total_temporary_and_protective_cost: number;
  total_traffic_and_community_cost: number;
  total_contingency_reserve: number;
  total_estimated_capital_outlay: number;
  annual_maintenance_estimate: number;
  ten_year_lifecycle_estimate: number;
  budget_ceiling?: number;
  fits_within_budget: boolean;
  budget_shortfall_or_cushion: number;
  budget_explanation: string;
}

export interface ImplementationRisk {
  risk_id: string;
  title: string;
  risk_description: string;
  likelihood: "Low" | "Medium" | "High";
  severity: "Minor" | "Moderate" | "Major" | "Critical";
  affected_parties_or_assets: string[];
  early_warning_signs: string[];
  preventive_measures: string[];
  contingency_actions: string[];
  responsible_party: string;
  residual_risk_level: string;
  requires_licensed_engineer: boolean;
}

export interface ImplementationConsequence {
  id: string;
  impact_type: string;
  domain: string;
  description: string;
  magnitude_estimate: string;
  who_benefits: string;
  who_bears_costs: string;
  equity_mitigation_measure?: string;
}

export interface QualityAndTestingItem {
  test_number: number;
  inspection_or_test_name: string;
  timing: string;
  testing_procedure: string;
  acceptance_criteria: string;
  responsible_inspector: string;
  records_to_maintain: string;
  corrective_action_if_failed: string;
}

export interface MaintenancePlanItem {
  activity_name: string;
  frequency_or_trigger: string;
  responsible_party: string;
  required_tools_and_materials: string;
  annual_cost_estimate: string;
  performance_indicators: string[];
  warning_signs_of_failure: string[];
  escalation_and_repair_protocol: string;
}

export interface ImplementationPlanRequest {
  prompt: string;
  location_or_neighbourhood?: string;
  intervention_type?: string;
  main_goal?: string;
  budget_ceiling?: number;
  currency?: string;
  available_space_m2?: number;
  start_date?: string;
  target_completion_date?: string;
  weather_constraints?: string;
  existing_infrastructure_condition?: string;
  nearby_critical_facilities?: string[];
  required_service_continuity?: string[];
  dataset_id?: string;
  selected_strategy?: string;
  attached_file_ids?: string[];
  source_ids?: string[];
}

export interface ClassificationResult {
  primary_category: InterventionCategoryType;
  secondary_categories: InterventionCategoryType[];
  confidence_score: number;
  detected_goals: string[];
  detected_constraints: string[];
  is_weather_sensitive: boolean;
  is_traffic_sensitive: boolean;
  is_utility_sensitive: boolean;
  is_multidisciplinary: boolean;
  suggested_followups: string[];
}

export interface ImplementationPlan {
  plan_id: string;
  created_at: string;
  reproducibility_hash: string;
  project_name: string;
  user_stated_problem: string;
  main_objectives: string[];
  location_or_neighbourhood: string;
  dataset_id?: string;
  classification: ClassificationResult;
  summary_simple_english: string;
  data_completeness_pct: number;
  verified_facts: string[];
  planning_assumptions: string[];
  missing_critical_data: string[];
  approval_and_licensing_requirements: string[];
  site_investigations: SiteInvestigationItem[];
  recommended_design: DesignAlternative;
  design_alternatives: DesignAlternative[];
  construction_phases: ConstructionPhase[];
  community_protection: CommunityProtectionPlan;
  weather_protection: WeatherProtectionPlan;
  budget: ImplementationBudget;
  risk_register: ImplementationRisk[];
  consequences: ImplementationConsequence[];
  quality_assurance: QualityAndTestingItem[];
  maintenance_plan: MaintenancePlanItem[];
  standards_and_guidance_citations: Array<{ standard: string; relevance: string }>;
  professional_disclaimer: string;
  structure_diagram?: StructureDiagram;
  evidence_records?: RealWorldEvidenceRecord[];
  uncertainty_labels?: Record<string, string>;
}

export interface PlanSummaryItem {
  plan_id: string;
  project_name: string;
  created_at: string;
  primary_category: InterventionCategoryType;
  location: string;
  total_cost: number;
  currency: string;
  completeness_pct: number;
  fits_budget: boolean;
}

// ============================================================================
// Real-World Evidence & Source Registry Types
// ============================================================================

export type ProvenanceType =
  | "VERIFIED_SOURCE_FACT"
  | "DERIVED_VALUE"
  | "ESTIMATE"
  | "SIMULATED"
  | "UNVERIFIED"
  | "MISSING"
  | "ILLUSTRATIVE";

export type AccessMode = "API_CONNECTED" | "PORTAL_INDEXED" | "MANUAL_IMPORT_REQUIRED";

export interface DataSourceRegistryItem {
  source_id: string;
  name: string;
  publisher: string;
  category: string;
  original_url: string;
  active_resource_url?: string | null;
  format: string;
  geographic_scope: string;
  license: string;
  access_mode: AccessMode;
  description: string;
  coverage_period: string;
  last_checked: string;
  is_live: boolean;
  manual_import_instructions?: string | null;
}

export interface RealWorldEvidenceRecord {
  record_id: string;
  project_name: string;
  source_id: string;
  source_publisher: string;
  source_url: string;
  document_reference: string;
  publication_date: string;
  retrieval_timestamp: string;
  location_name: string;
  ward_number?: number | null;
  zone_name?: string | null;
  valley_basin?: string | null;
  category: string;
  provenance_type: ProvenanceType;
  field_values: Record<string, any>;
  units_and_currencies: Record<string, string>;
  formula_or_derivation?: string | null;
  validation_status: string;
  missing_or_unverified_fields: string[];
  license: string;
  notes: string;
}

export interface UploadedDocumentMetadata {
  file_id: string;
  filename: string;
  file_type: string;
  size_bytes: number;
  uploaded_at: string;
  extracted_records_count: number;
  extracted_summary: string;
  validation_status: string;
  sample_records: Array<Record<string, any>>;
}

// ============================================================================
// Construction Structure Visualizer & Diagram Types
// ============================================================================

export type DiagramViewType = "cross_section" | "plan_view" | "construction_stages";

export interface DiagramComponent {
  id: string;
  name: string;
  category: string;
  description: string;
  provenance: ProvenanceType;
  evidence_ref?: string | null;
  assumptions: string[];
  risks: string[];
  construction_stage: string;
  is_verified: boolean;
  dimensions_label?: string | null;
  svg_element: string;
  svg_props: Record<string, any>;
}

export interface DiagramDimensionLine {
  id: string;
  label: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  text_x: number;
  text_y: number;
  is_illustrative: boolean;
  citation?: string | null;
}

export interface ConstructionStageVisual {
  stage_number: number;
  stage_name: string;
  duration_estimate: string;
  description: string;
  key_actions: string[];
  safety_measures: string[];
  active_component_ids: string[];
  inspection_checkpoint: string;
}

export interface StructureDiagram {
  diagram_id: string;
  project_type: string;
  project_name: string;
  location_name: string;
  view_type: DiagramViewType;
  title: string;
  subtitle: string;
  viewbox: string;
  components: DiagramComponent[];
  dimension_lines: DiagramDimensionLine[];
  stages: ConstructionStageVisual[];
  disclaimer: string;
  evidence_citations: string[];
  generated_at: string;
}

