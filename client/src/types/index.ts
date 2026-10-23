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
