export type Currency = "USD" | "INR";

export const USD_TO_INR_RATE = 83.5;

export interface BudgetInterventionConfig {
  id: string;
  name: string;
  category: string;
  unit_label: string;
  capital_cost_usd: number;
  annual_maintenance_usd: number;
  space_consumed_m2: number;
  water_demand_m3_year: number;
  heat_reduction_index: number;
  runoff_reduction_m3_year: number;
  carbon_sequestration_kg_year: number;
  data_source: string;
  confidence_level: "High" | "Medium" | "Estimated";
  expected_lifespan_years: number;
}

export const DEFAULT_BUDGET_INTERVENTIONS: BudgetInterventionConfig[] = [
  {
    id: "int-urban-forest",
    name: "Urban Micro-Forest & Native Shade Trees",
    category: "Canopy Expansion",
    unit_label: "trees (approx 15m² canopy)",
    capital_cost_usd: 380,
    annual_maintenance_usd: 28,
    space_consumed_m2: 15,
    water_demand_m3_year: 1.65,
    heat_reduction_index: 0.045,
    runoff_reduction_m3_year: 3.2,
    carbon_sequestration_kg_year: 22.5,
    data_source: "USDA Forest Service i-Tree Model & UK Forestry Commission",
    confidence_level: "High",
    expected_lifespan_years: 50,
  },
  {
    id: "int-green-roof",
    name: "Extensive Sedum Green Roof",
    category: "Rooftop NBS",
    unit_label: "m² of roof",
    capital_cost_usd: 110,
    annual_maintenance_usd: 4.5,
    space_consumed_m2: 1,
    water_demand_m3_year: 0.08,
    heat_reduction_index: 0.0022,
    runoff_reduction_m3_year: 0.45,
    carbon_sequestration_kg_year: 1.8,
    data_source: "US EPA Heat Island Guidelines & European Green Roof Association",
    confidence_level: "High",
    expected_lifespan_years: 35,
  },
  {
    id: "int-rainwater-harvesting",
    name: "Modular Rainwater Harvesting Cisterns",
    category: "Water Storage",
    unit_label: "m³ storage capacity",
    capital_cost_usd: 240,
    annual_maintenance_usd: 12,
    space_consumed_m2: 1.2,
    water_demand_m3_year: -28.0, // Negative demand = Net water collected & supplied
    heat_reduction_index: 0.0005,
    runoff_reduction_m3_year: 32.0,
    carbon_sequestration_kg_year: 0.5,
    data_source: "American Rainwater Catchment Systems Association (ARCSA)",
    confidence_level: "High",
    expected_lifespan_years: 30,
  },
  {
    id: "int-suds-bioswale",
    name: "Engineered Bioswales & Bioretention",
    category: "Sustainable Drainage (SuDS)",
    unit_label: "m² bioretention area",
    capital_cost_usd: 85,
    annual_maintenance_usd: 6.5,
    space_consumed_m2: 1,
    water_demand_m3_year: 0.05,
    heat_reduction_index: 0.0018,
    runoff_reduction_m3_year: 1.85,
    carbon_sequestration_kg_year: 3.4,
    data_source: "FHWA Stormwater BMPs & CIRIA SuDS Manual",
    confidence_level: "High",
    expected_lifespan_years: 25,
  },
  {
    id: "int-permeable-pavement",
    name: "Permeable Pavement & Green Corridors",
    category: "Infiltration Surface",
    unit_label: "m² permeable paver",
    capital_cost_usd: 75,
    annual_maintenance_usd: 3.8,
    space_consumed_m2: 1,
    water_demand_m3_year: 0.0,
    heat_reduction_index: 0.0014,
    runoff_reduction_m3_year: 0.95,
    carbon_sequestration_kg_year: 0.2,
    data_source: "Interlocking Concrete Pavement Institute (ICPI)",
    confidence_level: "High",
    expected_lifespan_years: 20,
  },
];

export interface BudgetSetupParams {
  total_budget_cap: number; // in USD
  annual_maintenance_ceiling: number; // in USD
  project_duration_years: number;
  available_land_m2: number;
  water_availability_cap_m3: number;
  min_equity_share: number; // 0.1 to 0.8
  contingency_reserve_pct: number; // 0.0 to 0.25
  currency: Currency;
}

export type BudgetScenarioType =
  | "baseline"
  | "budget_cut_10"
  | "budget_cut_25"
  | "budget_cut_50"
  | "inflation_15"
  | "inflation_25"
  | "opex_escalation_25"
  | "drought_water_cap"
  | "contingency_15";

export interface BudgetScenarioDefinition {
  id: BudgetScenarioType;
  label: string;
  description: string;
  budgetMultiplier: number;
  capexMultiplier: number;
  opexMultiplier: number;
  waterRestriction: boolean;
  contingencyPct: number;
}

export const BUDGET_SCENARIOS: BudgetScenarioDefinition[] = [
  {
    id: "baseline",
    label: "Baseline Municipal Plan",
    description: "Standard budgetary conditions without external economic or climate shocks.",
    budgetMultiplier: 1.0,
    capexMultiplier: 1.0,
    opexMultiplier: 1.0,
    waterRestriction: false,
    contingencyPct: 0.05,
  },
  {
    id: "budget_cut_10",
    label: "10% Fiscal Austerity Cut",
    description: "Mild fiscal consolidation reducing capital ceiling by 10%.",
    budgetMultiplier: 0.9,
    capexMultiplier: 1.0,
    opexMultiplier: 1.0,
    waterRestriction: false,
    contingencyPct: 0.05,
  },
  {
    id: "budget_cut_25",
    label: "25% Budget Reduction",
    description: "Substantial city budget reduction requiring strategic reprioritisation.",
    budgetMultiplier: 0.75,
    capexMultiplier: 1.0,
    opexMultiplier: 1.0,
    waterRestriction: false,
    contingencyPct: 0.05,
  },
  {
    id: "budget_cut_50",
    label: "50% Emergency Budget Cut",
    description: "Severe fiscal crisis testing minimum core climate resilience capacity.",
    budgetMultiplier: 0.5,
    capexMultiplier: 1.0,
    opexMultiplier: 1.0,
    waterRestriction: false,
    contingencyPct: 0.05,
  },
  {
    id: "inflation_15",
    label: "Construction Inflation (+15%)",
    description: "Supply chain disruptions and material price escalation increasing unit capex by 15%.",
    budgetMultiplier: 1.0,
    capexMultiplier: 1.15,
    opexMultiplier: 1.0,
    waterRestriction: false,
    contingencyPct: 0.08,
  },
  {
    id: "inflation_25",
    label: "Severe Construction Inflation (+25%)",
    description: "Severe cost shock across concrete, trees, and earthworks increasing capex by 25%.",
    budgetMultiplier: 1.0,
    capexMultiplier: 1.25,
    opexMultiplier: 1.0,
    waterRestriction: false,
    contingencyPct: 0.1,
  },
  {
    id: "opex_escalation_25",
    label: "Maintenance Surge (+25% O&M)",
    description: "Higher labor, replacement, and arboricultural maintenance costs over the project lifecycle.",
    budgetMultiplier: 1.0,
    capexMultiplier: 1.0,
    opexMultiplier: 1.25,
    waterRestriction: false,
    contingencyPct: 0.05,
  },
  {
    id: "drought_water_cap",
    label: "Drought Water Restrictions (Zero Net Deficit)",
    description: "Severe drought prevents municipal water allocation; canopy irrigation must be 100% offset by rainwater harvesting.",
    budgetMultiplier: 1.0,
    capexMultiplier: 1.0,
    opexMultiplier: 1.0,
    waterRestriction: true,
    contingencyPct: 0.05,
  },
  {
    id: "contingency_15",
    label: "15% Mandatory Emergency Reserve",
    description: "Municipal financial regulation mandating a locked 15% liquid buffer for disaster contingency.",
    budgetMultiplier: 1.0,
    capexMultiplier: 1.0,
    opexMultiplier: 1.0,
    waterRestriction: false,
    contingencyPct: 0.15,
  },
];

export interface BudgetCalculationResult {
  currency: Currency;
  effective_budget_cap: number;
  contingency_reserve: number;
  usable_budget: number;
  total_planned_capex: number;
  remaining_budget: number;
  budget_utilization_pct: number;
  annual_maintenance_total: number;
  maintenance_ceiling: number;
  maintenance_utilization_pct: number;
  ten_year_lifecycle_cost: number;
  total_space_used_m2: number;
  land_utilization_pct: number;
  net_water_demand_m3_year: number;
  total_stormwater_runoff_diverted_m3: number;
  total_heat_cooling_score: number;
  total_carbon_sequestration_tco2: number;
  is_feasible: boolean;
  violations: string[];
  warnings: string[];
  trade_offs: string[];
}

export const formatCurrencyValue = (
  amountUsd: number,
  currency: Currency,
  compact = false
): string => {
  const isINR = currency === "INR";
  const val = isINR ? amountUsd * USD_TO_INR_RATE : amountUsd;
  const symbol = isINR ? "₹" : "$";

  if (compact) {
    if (isINR) {
      if (Math.abs(val) >= 10000000) {
        return `${symbol}${(val / 10000000).toFixed(2)} Cr`;
      }
      if (Math.abs(val) >= 100000) {
        return `${symbol}${(val / 100000).toFixed(1)} L`;
      }
      return `${symbol}${Math.round(val).toLocaleString("en-IN")}`;
    } else {
      if (Math.abs(val) >= 1000000) {
        return `${symbol}${(val / 1000000).toFixed(2)}M`;
      }
      if (Math.abs(val) >= 1000) {
        return `${symbol}${(val / 1000).toFixed(0)}k`;
      }
      return `${symbol}${Math.round(val).toLocaleString()}`;
    }
  }

  if (isINR) {
    return `${symbol}${Math.round(val).toLocaleString("en-IN")}`;
  }
  return `${symbol}${Math.round(val).toLocaleString("en-US")}`;
};

export const calculateBudgetPlan = (
  params: BudgetSetupParams,
  allocations: Record<string, number>, // interventionId -> units
  scenarioId: BudgetScenarioType = "baseline",
  interventions: BudgetInterventionConfig[] = DEFAULT_BUDGET_INTERVENTIONS
): BudgetCalculationResult => {
  const scenario =
    BUDGET_SCENARIOS.find((s) => s.id === scenarioId) || BUDGET_SCENARIOS[0];

  const effectiveBudget = params.total_budget_cap * scenario.budgetMultiplier;
  const contingencyReserve = effectiveBudget * scenario.contingencyPct;
  const usableBudget = effectiveBudget - contingencyReserve;

  let totalCapex = 0;
  let totalOpex = 0;
  let totalSpace = 0;
  let netWater = 0;
  let totalStormwater = 0;
  let totalHeat = 0;
  let totalCarbon = 0;

  for (const item of interventions) {
    const units = allocations[item.id] || 0;
    if (units <= 0) continue;

    const unitCapex = item.capital_cost_usd * scenario.capexMultiplier;
    const unitOpex = item.annual_maintenance_usd * scenario.opexMultiplier;

    totalCapex += units * unitCapex;
    totalOpex += units * unitOpex;
    totalSpace += units * item.space_consumed_m2;
    netWater += units * item.water_demand_m3_year;
    totalStormwater += units * item.runoff_reduction_m3_year;
    totalHeat += units * item.heat_reduction_index * 1000;
    totalCarbon += (units * item.carbon_sequestration_kg_year) / 1000;
  }

  const remainingBudget = usableBudget - totalCapex;
  const budgetUtilPct = usableBudget > 0 ? (totalCapex / usableBudget) * 100 : 0;
  const opexUtilPct =
    params.annual_maintenance_ceiling > 0
      ? (totalOpex / params.annual_maintenance_ceiling) * 100
      : 0;
  const landUtilPct =
    params.available_land_m2 > 0 ? (totalSpace / params.available_land_m2) * 100 : 0;

  // 10-year total cost of ownership = capex + (opex * 10)
  const tenYearTco = totalCapex + totalOpex * 10;

  const violations: string[] = [];
  const warnings: string[] = [];
  const trade_offs: string[] = [];

  // Feasibility constraints
  if (totalCapex > usableBudget) {
    violations.push(
      `Budget Overrun: Planned capital (${formatCurrencyValue(
        totalCapex,
        params.currency,
        true
      )}) exceeds usable ceiling (${formatCurrencyValue(
        usableBudget,
        params.currency,
        true
      )}) by ${formatCurrencyValue(Math.abs(remainingBudget), params.currency, true)}.`
    );
  }

  if (totalOpex > params.annual_maintenance_ceiling) {
    violations.push(
      `Maintenance Ceiling Exceeded: Annual O&M commitment (${formatCurrencyValue(
        totalOpex,
        params.currency,
        true
      )}/yr) exceeds annual limit (${formatCurrencyValue(
        params.annual_maintenance_ceiling,
        params.currency,
        true
      )}/yr).`
    );
  }

  if (totalSpace > params.available_land_m2) {
    violations.push(
      `Spatial Capacity Exceeded: Interventions demand ${Math.round(
        totalSpace
      ).toLocaleString()} m² but public land is limited to ${Math.round(
        params.available_land_m2
      ).toLocaleString()} m².`
    );
  }

  if (scenario.waterRestriction && netWater > 0) {
    violations.push(
      `Drought Water Cap Violation: Net additional water consumption is +${Math.round(
        netWater
      ).toLocaleString()} m³/year under drought restriction. Pair trees with rainwater cisterns to offset.`
    );
  } else if (netWater > params.water_availability_cap_m3) {
    violations.push(
      `Water Resource Limit Exceeded: Net demand (${Math.round(
        netWater
      ).toLocaleString()} m³/yr) exceeds water buffer cap (${Math.round(
        params.water_availability_cap_m3
      ).toLocaleString()} m³/yr).`
    );
  }

  // Warnings & Trade-offs
  if (budgetUtilPct > 90 && budgetUtilPct <= 100) {
    warnings.push(
      `Tight Budget Cushion: Capital allocation is at ${budgetUtilPct.toFixed(
        0
      )}% of usable capacity.`
    );
  }

  if (netWater < 0) {
    trade_offs.push(
      `Water Positive: Rainwater harvesting generates a net municipal water surplus of ${Math.round(
        Math.abs(netWater)
      ).toLocaleString()} m³/year.`
    );
  } else if (netWater > 1000) {
    trade_offs.push(
      `Canopy Irrigation Burden: Urban tree canopy introduces ongoing irrigation demand of ${Math.round(
        netWater
      ).toLocaleString()} m³/year.`
    );
  }

  if (totalStormwater > 50000) {
    trade_offs.push(
      `High Stormwater Retention: Sinks ${Math.round(
        totalStormwater
      ).toLocaleString()} m³ of cloudburst runoff, significantly shielding drainage networks.`
    );
  }

  const isFeasible = violations.length === 0;

  return {
    currency: params.currency,
    effective_budget_cap: effectiveBudget,
    contingency_reserve: contingencyReserve,
    usable_budget: usableBudget,
    total_planned_capex: totalCapex,
    remaining_budget: remainingBudget,
    budget_utilization_pct: budgetUtilPct,
    annual_maintenance_total: totalOpex,
    maintenance_ceiling: params.annual_maintenance_ceiling,
    maintenance_utilization_pct: opexUtilPct,
    ten_year_lifecycle_cost: tenYearTco,
    total_space_used_m2: totalSpace,
    land_utilization_pct: landUtilPct,
    net_water_demand_m3_year: netWater,
    total_stormwater_runoff_diverted_m3: totalStormwater,
    total_heat_cooling_score: totalHeat,
    total_carbon_sequestration_tco2: totalCarbon,
    is_feasible: isFeasible,
    violations,
    warnings,
    trade_offs,
  };
};
