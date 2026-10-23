import React, { useState, useEffect, useMemo } from "react";
import {
  Currency,
  BudgetSetupParams,
  BudgetScenarioType,
  BUDGET_SCENARIOS,
  DEFAULT_BUDGET_INTERVENTIONS,
  calculateBudgetPlan,
  formatCurrencyValue,
  BudgetInterventionConfig,
} from "../utils/budgetCalculator";
import { api } from "../api/client";
import {
  Wallet,
  Play,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  Download,
  Printer,
  Sparkles,
  TreePine,
  Shield,
  Layers,
  MapPin,
  TrendingUp,
  Droplet,
  Info,
  DollarSign,
  Scale,
  Sliders,
  ChevronDown,
  ChevronUp,
  Building,
  Waves,
  Footprints,
  ExternalLink,
  RefreshCw,
  Check,
  ArrowRight,
  HardHat,
} from "lucide-react";

interface BudgetPlannerPageProps {
  activeDatasetId: string;
  onNavigateToMap: (neighbourhoodId?: string) => void;
  onNavigateToTransformation: (interventionId?: string, neighbourhoodId?: string) => void;
  onNavigateToConsequences: (
    interventionId: string,
    units: number,
    neighbourhoodId?: string,
    strategy?: string
  ) => void;
  preselectedNeighbourhoodId?: string;
  onSelectDataset?: (id: string) => void;
  availableDatasets?: Array<{ dataset_id: string; name: string }>;
  onNavigateToPlanner?: (prompt: string, budget?: number, location?: string) => void;
}

export const BudgetPlannerPage: React.FC<BudgetPlannerPageProps> = ({
  activeDatasetId,
  onNavigateToMap,
  onNavigateToTransformation,
  onNavigateToConsequences,
  preselectedNeighbourhoodId,
  onSelectDataset,
  availableDatasets = [],
  onNavigateToPlanner,
}) => {
  const [currency, setCurrency] = useState<Currency>("USD");
  const [activeScenario, setActiveScenario] = useState<BudgetScenarioType>("baseline");
  const [isSolving, setIsSolving] = useState(false);
  const [optimiserNotice, setOptimiserNotice] = useState<string | null>(null);
  const [expandedDetails, setExpandedDetails] = useState<Record<string, boolean>>({});

  // Fallback dataset list if not passed from parent
  const [internalDatasets, setInternalDatasets] = useState<Array<{ dataset_id: string; name: string }>>([]);

  useEffect(() => {
    if (!availableDatasets || availableDatasets.length === 0) {
      api.listDatasets()
        .then((list) => {
          setInternalDatasets(list.map((d) => ({ dataset_id: d.dataset_id, name: d.name })));
        })
        .catch((err) => {
          console.warn("Could not fetch datasets in BudgetPlannerPage:", err);
        });
    }
  }, [availableDatasets]);

  const effectiveDatasetList = useMemo(() => {
    if (availableDatasets && availableDatasets.length > 0) {
      return availableDatasets;
    }
    if (internalDatasets.length > 0) {
      return internalDatasets;
    }
    return [
      { dataset_id: "sample-metro-verde", name: "Metro Verde (High Density)" },
      { dataset_id: "coastal_basin_sample", name: "Coastal Basin (Flood Prone)" },
      { dataset_id: "inland_district_sample", name: "Inland District (Heat Prone)" },
    ];
  }, [availableDatasets, internalDatasets]);

  // Budget setup configuration state
  const [params, setParams] = useState<BudgetSetupParams>({
    total_budget_cap: 2500000,
    annual_maintenance_ceiling: 180000,
    project_duration_years: 10,
    available_land_m2: 250000,
    water_availability_cap_m3: 40000,
    min_equity_share: 0.3,
    contingency_reserve_pct: 0.05,
    currency: "USD",
  });

  // Allocations state: interventionId -> units
  const [allocations, setAllocations] = useState<Record<string, number>>({
    "int-urban-forest": 1200,
    "int-green-roof": 4500,
    "int-rainwater-harvesting": 850,
    "int-suds-bioswale": 3200,
    "int-permeable-pavement": 2800,
  });

  // Synchronise currency
  useEffect(() => {
    setParams((p) => ({ ...p, currency }));
  }, [currency]);

  // Live calculation of current plan
  const budgetPlan = useMemo(() => {
    return calculateBudgetPlan(
      params,
      allocations,
      activeScenario,
      DEFAULT_BUDGET_INTERVENTIONS
    );
  }, [params, allocations, activeScenario]);

  // Baseline comparison plan for stress scenario variance
  const baselinePlan = useMemo(() => {
    return calculateBudgetPlan(
      params,
      allocations,
      "baseline",
      DEFAULT_BUDGET_INTERVENTIONS
    );
  }, [params, allocations]);

  const handleUnitChange = (id: string, units: number) => {
    const validUnits = Math.max(0, isNaN(units) ? 0 : Math.round(units));
    setAllocations((prev) => ({
      ...prev,
      [id]: validUnits,
    }));
  };

  const toggleDetails = (id: string) => {
    setExpandedDetails((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleResetAllocations = () => {
    setAllocations({
      "int-urban-forest": 0,
      "int-green-roof": 0,
      "int-rainwater-harvesting": 0,
      "int-suds-bioswale": 0,
      "int-permeable-pavement": 0,
    });
    setOptimiserNotice("All manual allocations cleared to zero. You can input custom units for each intervention.");
  };

  // Run SciPy HiGHS optimisation to populate smart recommendations
  const handleApplyOptimiser = async (strategy: "balanced" | "cost_focused" | "equity_focused") => {
    setIsSolving(true);
    setOptimiserNotice(null);
    try {
      const res = await api.solveOptimisation({
        dataset_id: activeDatasetId,
        total_budget_cap: params.total_budget_cap,
        min_equity_investment_share: params.min_equity_share,
        weights: {
          heat_reduction: strategy === "cost_focused" ? 0.15 : 0.3,
          flood_reduction: strategy === "cost_focused" ? 0.2 : 0.3,
          water_resilience: 0.2,
          green_equity: strategy === "equity_focused" ? 0.5 : 0.2,
          cost_efficiency: strategy === "cost_focused" ? 0.45 : 0.1,
        },
      });

      const alt = res.alternatives.find((a) => a.strategy_id === strategy) || res.alternatives[0];
      if (alt && alt.allocations) {
        const newAlloc: Record<string, number> = {
          "int-urban-forest": 0,
          "int-green-roof": 0,
          "int-rainwater-harvesting": 0,
          "int-suds-bioswale": 0,
          "int-permeable-pavement": 0,
        };

        for (const alloc of alt.allocations) {
          if (newAlloc[alloc.intervention_id] !== undefined) {
            newAlloc[alloc.intervention_id] += Math.round(alloc.units_allocated);
          }
        }

        setAllocations(newAlloc);
        setOptimiserNotice(
          `Applied Pareto-optimal plan from SciPy HiGHS solver (${res.execution_time_ms} ms). Strategy: ${alt.strategy_label}.`
        );
      }
    } catch (err: any) {
      console.error("Optimiser fetch error", err);
      setOptimiserNotice("Could not connect to solver. Please ensure the backend is online.");
    } finally {
      setIsSolving(false);
    }
  };

  const downloadCsv = () => {
    let csv = "ECO-ECHO Urban Sustainability Budget Plan\n";
    csv += `Dataset,${activeDatasetId}\n`;
    csv += `Generated Date,${new Date().toISOString()}\n`;
    csv += `Currency,${currency}\n`;
    csv += `Active Scenario,${activeScenario}\n`;
    csv += `Total Budget Cap,${params.total_budget_cap}\n`;
    csv += `Total Planned Capex,${budgetPlan.total_planned_capex}\n`;
    csv += `Remaining Usable Budget,${budgetPlan.remaining_budget}\n`;
    csv += `Contingency Reserve,${budgetPlan.contingency_reserve}\n`;
    csv += `Annual Maintenance Total,${budgetPlan.annual_maintenance_total}\n`;
    csv += `Feasible,${budgetPlan.is_feasible ? "YES" : "NO"}\n\n`;

    csv += "Intervention ID,Intervention Name,Category,Units,Unit Capex (USD),Total Capex (USD),Annual O&M (USD),Land Area (m2),Net Water (m3/yr),Stormwater Diverted (m3),Carbon (tCO2/yr)\n";
    for (const item of DEFAULT_BUDGET_INTERVENTIONS) {
      const units = allocations[item.id] || 0;
      const capex = units * item.capital_cost_usd;
      const opex = units * item.annual_maintenance_usd;
      const space = units * item.space_consumed_m2;
      const water = units * item.water_demand_m3_year;
      const runoff = units * item.runoff_reduction_m3_year;
      const carbon = (units * item.carbon_sequestration_kg_year) / 1000;
      csv += `"${item.id}","${item.name}","${item.category}",${units},${item.capital_cost_usd},${capex},${opex},${space},${water},${runoff},${carbon}\n`;
    }

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `eco_echo_budget_plan_${activeDatasetId}_${activeScenario}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  const getInterventionIcon = (id: string) => {
    switch (id) {
      case "int-urban-forest":
        return <TreePine size={20} color="var(--forest-green)" />;
      case "int-green-roof":
        return <Building size={20} color="#205446" />;
      case "int-rainwater-harvesting":
        return <Droplet size={20} color="var(--info-blue)" />;
      case "int-suds-bioswale":
        return <Waves size={20} color="var(--risk-moderate)" />;
      case "int-permeable-pavement":
        return <Footprints size={20} color="#4A6055" />;
      default:
        return <Layers size={20} color="var(--forest-green)" />;
    }
  };

  const getInterventionSummary = (id: string) => {
    switch (id) {
      case "int-urban-forest":
        return "Cools neighbourhoods, captures stormwater in tree canopies, and absorbs atmospheric carbon.";
      case "int-green-roof":
        return "Insulates building rooftops, reduces rooftop urban heat islands, and absorbs rain before street runoff.";
      case "int-rainwater-harvesting":
        return "Captures and stores rainwater runoff for non-potable reuse and dry-season municipal water security.";
      case "int-suds-bioswale":
        return "Vegetated roadside drainage channels that filter runoff, prevent road pooling, and recharge aquifers.";
      case "int-permeable-pavement":
        return "Porous pavement surfaces allowing rainwater to soak naturally into ground rather than flooding streets.";
      default:
        return "Nature-based urban infrastructure solution for climate resilience.";
    }
  };

  // Plain language violation explanations
  const formatViolationMessage = (v: string): string => {
    if (v.includes("Budget Overrun")) {
      const overrun = Math.abs(budgetPlan.remaining_budget);
      return `This plan exceeds the available budget by ${formatCurrencyValue(overrun, currency, true)}. Reduce intervention quantities or raise the budget ceiling.`;
    }
    if (v.includes("Maintenance Ceiling")) {
      return `The yearly maintenance cost (${formatCurrencyValue(budgetPlan.annual_maintenance_total, currency, true)}/yr) is above the ${formatCurrencyValue(budgetPlan.maintenance_ceiling, currency, true)}/yr limit.`;
    }
    if (v.includes("Land Cap Exceeded")) {
      return `The proposed improvements need ${Math.round(budgetPlan.total_space_used_m2).toLocaleString()} m², which is more land than the ${Math.round(params.available_land_m2).toLocaleString()} m² available.`;
    }
    if (v.includes("Drought Water Cap")) {
      return `Drought water cap violated: net water demand exceeds limits. Increase Rainwater Harvesting cisterns to provide offsetting water surplus.`;
    }
    return v;
  };

  return (
    <div style={{ width: "100%", minWidth: 0 }}>
      {/* 1. Page Header & Responsive Toolbar */}
      <div
        className="page-header"
        style={{
          borderBottom: "1px solid var(--border-subtle)",
          paddingBottom: "20px",
          marginBottom: "24px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: "16px",
            width: "100%",
          }}
        >
          {/* Header Title & Subtitle */}
          <div style={{ flex: "1 1 420px", minWidth: 0 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                flexWrap: "wrap",
                marginBottom: "6px",
              }}
            >
              <h1
                style={{
                  margin: 0,
                  fontSize: "26px",
                  fontWeight: 800,
                  color: "var(--text-primary)",
                  letterSpacing: "-0.5px",
                }}
              >
                Budget Planner
              </h1>
              <span
                className="badge badge-forest"
                style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}
              >
                <Wallet size={12} /> Climate Finance Engine
              </span>
              {preselectedNeighbourhoodId && (
                <span className="badge badge-lime">Focus: {preselectedNeighbourhoodId}</span>
              )}
            </div>
            <p
              style={{
                margin: 0,
                fontSize: "14px",
                color: "var(--text-secondary)",
                lineHeight: 1.5,
                maxWidth: "760px",
              }}
            >
              Plan sustainability investments within your city&apos;s financial limits.
            </p>
          </div>

          {/* Header Toolbar */}
          <div className="budget-toolbar">
            {/* Dataset Selector */}
            <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 600 }}>
                City:
              </span>
              <select
                className="budget-select"
                value={activeDatasetId}
                onChange={(e) => {
                  if (onSelectDataset) {
                    onSelectDataset(e.target.value);
                  }
                }}
                aria-label="Select City Dataset"
              >
                {effectiveDatasetList.map((d) => (
                  <option key={d.dataset_id} value={d.dataset_id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Currency Selector (USD / INR) */}
            <div
              style={{
                display: "inline-flex",
                background: "var(--warm-ivory)",
                borderRadius: "var(--radius-button)",
                padding: "3px",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <button
                type="button"
                onClick={() => setCurrency("USD")}
                style={{
                  padding: "6px 12px",
                  border: "none",
                  borderRadius: "var(--radius-sm)",
                  background: currency === "USD" ? "var(--forest-green)" : "transparent",
                  color: currency === "USD" ? "#FFFFFF" : "var(--text-primary)",
                  fontSize: "12px",
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all var(--transition-fast)",
                }}
                title="Switch display to US Dollars ($)"
              >
                USD ($)
              </button>
              <button
                type="button"
                onClick={() => setCurrency("INR")}
                style={{
                  padding: "6px 12px",
                  border: "none",
                  borderRadius: "var(--radius-sm)",
                  background: currency === "INR" ? "var(--forest-green)" : "transparent",
                  color: currency === "INR" ? "#FFFFFF" : "var(--text-primary)",
                  fontSize: "12px",
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all var(--transition-fast)",
                }}
                title="Switch display to Indian Rupees (₹) at ₹83.5/USD"
              >
                INR (₹)
              </button>
            </div>

            {/* Feasibility Status Badge */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 14px",
                borderRadius: "var(--radius-full)",
                background: budgetPlan.is_feasible
                  ? "rgba(184, 233, 134, 0.25)"
                  : "var(--risk-severe-bg)",
                border: `1px solid ${
                  budgetPlan.is_feasible ? "rgba(23, 63, 53, 0.2)" : "rgba(185, 75, 66, 0.3)"
                }`,
                fontSize: "12px",
                fontWeight: 700,
                color: budgetPlan.is_feasible ? "var(--forest-green)" : "var(--risk-severe)",
              }}
            >
              {budgetPlan.is_feasible ? (
                <>
                  <CheckCircle2 size={14} color="var(--forest-green)" />
                  <span>Feasible Plan</span>
                </>
              ) : (
                <>
                  <AlertTriangle size={14} color="var(--risk-severe)" />
                  <span>Constraint Alert ({budgetPlan.violations.length})</span>
                </>
              )}
            </div>

            {/* Quick Export Actions */}
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={downloadCsv}
              title="Download municipal budget plan as CSV"
            >
              <Download size={14} />
              <span>Export CSV</span>
            </button>

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handlePrint}
              title="Printable municipal plan summary"
            >
              <Printer size={14} />
              <span>Print Plan</span>
            </button>

            {onNavigateToPlanner && (
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => {
                  const deployed = DEFAULT_BUDGET_INTERVENTIONS
                    .filter((cfg) => (allocations[cfg.id] || 0) > 0)
                    .map((cfg) => `${allocations[cfg.id]} ${cfg.unit_label} of ${cfg.name}`)
                    .slice(0, 3)
                    .join(", ");
                  const prompt = `Implement the budgeted urban sustainability interventions (${deployed || "city sustainability works"}) within an estimated capital budget of ${formatCurrencyValue(budgetPlan.total_planned_capex, currency, true)}. Ensure minimal disruption to local residents, emergency corridor continuity, and seasonal storm protection.`;
                  onNavigateToPlanner(prompt, budgetPlan.total_planned_capex, preselectedNeighbourhoodId || "Municipal District");
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  background: "#173F35",
                  color: "#B8E986",
                  border: "none",
                  fontWeight: 700,
                }}
                title="Open Implementation Planner with this budget"
              >
                <HardHat size={14} />
                <span>Plan Implementation</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Dismissible Optimiser Feedback Banner */}
      {optimiserNotice && (
        <div
          style={{
            background: "rgba(184, 233, 134, 0.2)",
            border: "1px solid rgba(23, 63, 53, 0.2)",
            borderRadius: "var(--radius-card)",
            padding: "12px 18px",
            marginBottom: "20px",
            fontSize: "13px",
            color: "var(--forest-green)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Sparkles size={16} />
            <span style={{ fontWeight: 600 }}>{optimiserNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setOptimiserNotice(null)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: "15px",
              fontWeight: 700,
              color: "var(--forest-green)",
              padding: "4px",
            }}
            aria-label="Dismiss message"
          >
            ✕
          </button>
        </div>
      )}

      {/* 2. Top 4 Aligned KPI Financial Cards */}
      <div className="kpi-grid" style={{ marginBottom: "28px" }}>
        {/* KPI 1: Total Investment */}
        <div
          className={`budget-kpi-card ${
            budgetPlan.total_planned_capex > budgetPlan.usable_budget ? "danger" : "forest"
          }`}
        >
          <div>
            <div className="kpi-label">
              <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <DollarSign size={14} />
                <span>Total Investment</span>
              </span>
              <span className="badge badge-neutral">Capital Capex</span>
            </div>
            <div className="kpi-value tabular-nums">
              {formatCurrencyValue(budgetPlan.total_planned_capex, currency, true)}
            </div>
            <div className="kpi-subtext">
              {budgetPlan.budget_utilization_pct.toFixed(0)}% of usable cap (
              {formatCurrencyValue(budgetPlan.usable_budget, currency, true)})
            </div>
          </div>
          <div className="budget-progress-track">
            <div
              className="budget-progress-fill"
              style={{
                width: `${Math.min(100, budgetPlan.budget_utilization_pct)}%`,
                background:
                  budgetPlan.total_planned_capex > budgetPlan.usable_budget
                    ? "var(--risk-severe)"
                    : "var(--forest-green)",
              }}
            />
          </div>
        </div>

        {/* KPI 2: Budget Remaining */}
        <div
          className={`budget-kpi-card ${
            budgetPlan.remaining_budget >= 0 ? "positive" : "danger"
          }`}
        >
          <div>
            <div className="kpi-label">
              <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <Wallet size={14} />
                <span>{budgetPlan.remaining_budget >= 0 ? "Budget Remaining" : "Budget Overrun"}</span>
              </span>
              <span
                className={`badge ${
                  budgetPlan.remaining_budget >= 0 ? "badge-lime" : "badge-neutral"
                }`}
              >
                {budgetPlan.remaining_budget >= 0 ? "Available" : "Deficit"}
              </span>
            </div>
            <div
              className="kpi-value tabular-nums"
              style={{
                color:
                  budgetPlan.remaining_budget >= 0
                    ? "var(--text-primary)"
                    : "var(--risk-severe)",
              }}
            >
              {budgetPlan.remaining_budget < 0 && "-"}
              {formatCurrencyValue(Math.abs(budgetPlan.remaining_budget), currency, true)}
            </div>
            <div className="kpi-subtext">
              {budgetPlan.remaining_budget >= 0
                ? "Unallocated capital cushion for this fiscal period"
                : "Deficit exceeds capital ceiling!"}
            </div>
          </div>
          <div
            style={{
              marginTop: "8px",
              fontSize: "11.5px",
              color: "var(--text-secondary)",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <span>Reserved buffer:</span>
            <strong style={{ color: "var(--forest-green)" }}>
              {formatCurrencyValue(budgetPlan.contingency_reserve, currency, true)}
            </strong>
          </div>
        </div>

        {/* KPI 3: Yearly Maintenance */}
        <div
          className={`budget-kpi-card ${
            budgetPlan.maintenance_utilization_pct > 100 ? "danger" : "warning"
          }`}
        >
          <div>
            <div className="kpi-label">
              <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <TrendingUp size={14} />
                <span>Yearly Maintenance</span>
              </span>
              <span className="badge badge-neutral">Annual O&M</span>
            </div>
            <div className="kpi-value tabular-nums">
              {formatCurrencyValue(budgetPlan.annual_maintenance_total, currency, true)}/yr
            </div>
            <div className="kpi-subtext">
              {budgetPlan.maintenance_utilization_pct.toFixed(0)}% of{" "}
              {formatCurrencyValue(budgetPlan.maintenance_ceiling, currency, true)}/yr ceiling
            </div>
          </div>
          <div className="budget-progress-track">
            <div
              className="budget-progress-fill"
              style={{
                width: `${Math.min(100, budgetPlan.maintenance_utilization_pct)}%`,
                background:
                  budgetPlan.maintenance_utilization_pct > 100
                    ? "var(--risk-severe)"
                    : "var(--risk-elevated)",
              }}
            />
          </div>
        </div>

        {/* KPI 4: Long-Term Cost */}
        <div className="budget-kpi-card info">
          <div>
            <div className="kpi-label">
              <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <Scale size={14} />
                <span>Long-Term Cost</span>
              </span>
              <span className="badge badge-neutral">10-Year Lifecycle</span>
            </div>
            <div className="kpi-value tabular-nums">
              {formatCurrencyValue(budgetPlan.ten_year_lifecycle_cost, currency, true)}
            </div>
            <div className="kpi-subtext">
              Total 10-year municipal lifecycle commitment
            </div>
          </div>
          <div
            style={{
              marginTop: "8px",
              fontSize: "11px",
              color: "var(--text-secondary)",
              background: "var(--warm-ivory)",
              padding: "4px 8px",
              borderRadius: "var(--radius-sm)",
            }}
          >
            Capex + (10 × Annual Maintenance)
          </div>
        </div>
      </div>

      {/* 3. Main Workspace: Two-Column Desktop Layout */}
      <div className="budget-planner-layout" style={{ marginBottom: "32px" }}>
        {/* =========================================================================
            LEFT COLUMN: Planning Controls & Scenarios
            ========================================================================= */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Controls Card 1: Budget Setup & Financial Limits */}
          <div className="card">
            <div className="card-header">
              <div className="card-title-group">
                <Sliders size={18} color="var(--forest-green)" />
                <div>
                  <div className="card-title">Planning Controls & Limits</div>
                  <div className="card-subtitle">Set physical and financial boundaries</div>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Total Capital Budget Slider */}
              <div>
                <div className="form-label-row" style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <span style={{ fontSize: "13px", fontWeight: 600 }}>Total Capital Budget</span>
                  <span className="tabular-nums" style={{ fontSize: "13px", fontWeight: 800, color: "var(--forest-green)" }}>
                    {formatCurrencyValue(params.total_budget_cap, currency, true)}
                  </span>
                </div>
                <input
                  type="range"
                  min="500000"
                  max="10000000"
                  step="250000"
                  value={params.total_budget_cap}
                  onChange={(e) =>
                    setParams({ ...params, total_budget_cap: parseInt(e.target.value) || 500000 })
                  }
                  className="eco-slider"
                  aria-label="Total Capital Budget Slider"
                />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--text-secondary)", marginTop: "3px" }}>
                  <span>{formatCurrencyValue(500000, currency, true)}</span>
                  <span>{formatCurrencyValue(5000000, currency, true)}</span>
                  <span>{formatCurrencyValue(10000000, currency, true)}</span>
                </div>
              </div>

              {/* Annual Maintenance Ceiling Slider */}
              <div>
                <div className="form-label-row" style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <span style={{ fontSize: "13px", fontWeight: 600 }}>Annual Maintenance Limit</span>
                  <span className="tabular-nums" style={{ fontSize: "13px", fontWeight: 700 }}>
                    {formatCurrencyValue(params.annual_maintenance_ceiling, currency, true)}/yr
                  </span>
                </div>
                <input
                  type="range"
                  min="50000"
                  max="500000"
                  step="10000"
                  value={params.annual_maintenance_ceiling}
                  onChange={(e) =>
                    setParams({
                      ...params,
                      annual_maintenance_ceiling: parseInt(e.target.value) || 50000,
                    })
                  }
                  className="eco-slider"
                  aria-label="Annual Maintenance Ceiling Slider"
                />
              </div>

              {/* Available Public Land Slider */}
              <div>
                <div className="form-label-row" style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <span style={{ fontSize: "13px", fontWeight: 600 }}>Available Public Land</span>
                  <span className="tabular-nums" style={{ fontSize: "13px", fontWeight: 700 }}>
                    {Math.round(params.available_land_m2).toLocaleString()} m²
                  </span>
                </div>
                <input
                  type="range"
                  min="50000"
                  max="500000"
                  step="25000"
                  value={params.available_land_m2}
                  onChange={(e) =>
                    setParams({ ...params, available_land_m2: parseInt(e.target.value) || 50000 })
                  }
                  className="eco-slider"
                  aria-label="Available Public Land Slider"
                />
              </div>

              {/* Minimum Frontline Equity Slider */}
              <div>
                <div className="form-label-row" style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <span style={{ fontSize: "13px", fontWeight: 600 }}>Min Frontline Equity Share</span>
                  <span className="tabular-nums" style={{ fontSize: "13px", fontWeight: 700 }}>
                    {(params.min_equity_share * 100).toFixed(0)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="0.8"
                  step="0.05"
                  value={params.min_equity_share}
                  onChange={(e) =>
                    setParams({ ...params, min_equity_share: parseFloat(e.target.value) })
                  }
                  className="eco-slider"
                  aria-label="Minimum Frontline Equity Slider"
                />
                <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "2px" }}>
                  Guarantees targeted funding to vulnerable neighbourhoods.
                </div>
              </div>

              {/* Emergency Contingency Reserve Slider */}
              <div>
                <div className="form-label-row" style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <span style={{ fontSize: "13px", fontWeight: 600 }}>Emergency Contingency</span>
                  <span className="tabular-nums" style={{ fontSize: "13px", fontWeight: 700 }}>
                    {(params.contingency_reserve_pct * 100).toFixed(0)}% (
                    {formatCurrencyValue(budgetPlan.contingency_reserve, currency, true)})
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="0.25"
                  step="0.05"
                  value={params.contingency_reserve_pct}
                  onChange={(e) =>
                    setParams({
                      ...params,
                      contingency_reserve_pct: parseFloat(e.target.value),
                    })
                  }
                  className="eco-slider"
                  aria-label="Emergency Contingency Reserve Slider"
                />
                <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "2px" }}>
                  Protected cash buffer against unforeseen cost escalations.
                </div>
              </div>
            </div>
          </div>

          {/* Controls Card 2: Stress-Test Scenarios */}
          <div className="card">
            <div className="card-header">
              <div className="card-title-group">
                <Shield size={18} color="var(--forest-green)" />
                <div>
                  <div className="card-title">Stress-Test Scenarios</div>
                  <div className="card-subtitle">Test resilience against economic & climate shocks</div>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {BUDGET_SCENARIOS.map((scen) => {
                const isSelected = activeScenario === scen.id;
                return (
                  <button
                    key={scen.id}
                    type="button"
                    className={`scenario-card-btn ${isSelected ? "active" : ""}`}
                    onClick={() => setActiveScenario(scen.id)}
                    role="radio"
                    aria-checked={isSelected}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "13px",
                          fontWeight: 700,
                          color: isSelected ? "var(--forest-green)" : "var(--text-primary)",
                        }}
                      >
                        {scen.label}
                      </span>
                      {isSelected ? (
                        <span className="badge badge-lime">Active</span>
                      ) : (
                        <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Select</span>
                      )}
                    </div>
                    <div
                      style={{
                        fontSize: "11.5px",
                        color: "var(--text-secondary)",
                        lineHeight: 1.4,
                      }}
                    >
                      {scen.description}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Controls Card 3: HiGHS Optimiser Presets */}
          <div className="card">
            <div className="card-header">
              <div className="card-title-group">
                <Sparkles size={18} color="var(--forest-green)" />
                <div>
                  <div className="card-title">HiGHS Solver Presets</div>
                  <div className="card-subtitle">Automated linear programming optimisation</div>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => handleApplyOptimiser("balanced")}
                disabled={isSolving}
                style={{ justifyContent: "flex-start", padding: "10px 14px" }}
              >
                <Play size={13} fill="currentColor" />
                <span>Apply Balanced Portfolio</span>
              </button>

              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => handleApplyOptimiser("cost_focused")}
                disabled={isSolving}
                style={{ justifyContent: "flex-start", padding: "10px 14px" }}
              >
                <Play size={13} fill="currentColor" />
                <span>Apply Cost-Efficiency Focus</span>
              </button>

              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => handleApplyOptimiser("equity_focused")}
                disabled={isSolving}
                style={{ justifyContent: "flex-start", padding: "10px 14px" }}
              >
                <Play size={13} fill="currentColor" />
                <span>Apply Frontline Equity Focus</span>
              </button>

              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleResetAllocations}
                style={{ justifyContent: "flex-start", padding: "10px 14px", marginTop: "2px" }}
              >
                <RotateCcw size={13} />
                <span>Clear Allocations (Manual Entry)</span>
              </button>
            </div>
          </div>
        </div>

        {/* =========================================================================
            RIGHT COLUMN: Investment Portfolio & Environmental Outcomes
            ========================================================================= */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px", minWidth: 0 }}>
          {/* Section Heading */}
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: "20px",
                fontWeight: 800,
                color: "var(--text-primary)",
                letterSpacing: "-0.3px",
              }}
            >
              Choose Where to Invest
            </h2>
            <p
              style={{
                margin: "4px 0 0 0",
                fontSize: "13.5px",
                color: "var(--text-secondary)",
              }}
            >
              Adjust the amount of each improvement and compare its cost and benefits.
            </p>
          </div>

          {/* Budget-Utilisation Indicator & Feasibility Status */}
          <div
            className="card"
            style={{
              background: budgetPlan.is_feasible ? "var(--white)" : "var(--risk-severe-bg)",
              borderColor: budgetPlan.is_feasible ? "var(--border-subtle)" : "#f3cbc8",
            }}
          >
            {/* Header info */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "10px",
                marginBottom: "12px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Wallet size={16} color="var(--forest-green)" />
                <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)" }}>
                  Capital Budget Allocation Status
                </span>
              </div>
              <span
                className={`badge ${budgetPlan.is_feasible ? "badge-lime" : "badge-neutral"}`}
              >
                {budgetPlan.budget_utilization_pct.toFixed(0)}% Utilized
              </span>
            </div>

            {/* Multi-segment budget progress bar */}
            <div
              style={{
                width: "100%",
                height: "10px",
                background: "var(--warm-ivory)",
                borderRadius: "var(--radius-full)",
                overflow: "hidden",
                display: "flex",
                marginBottom: "12px",
              }}
            >
              {/* Allocated Capex */}
              <div
                style={{
                  width: `${Math.min(100, (budgetPlan.total_planned_capex / budgetPlan.effective_budget_cap) * 100)}%`,
                  background:
                    budgetPlan.total_planned_capex > budgetPlan.usable_budget
                      ? "var(--risk-severe)"
                      : "var(--forest-green)",
                  transition: "width 0.3s ease",
                }}
                title={`Allocated: ${formatCurrencyValue(budgetPlan.total_planned_capex, currency, true)}`}
              />
              {/* Contingency Buffer */}
              <div
                style={{
                  width: `${(budgetPlan.contingency_reserve / budgetPlan.effective_budget_cap) * 100}%`,
                  background: "var(--lime-accent)",
                  transition: "width 0.3s ease",
                }}
                title={`Contingency Buffer: ${formatCurrencyValue(budgetPlan.contingency_reserve, currency, true)}`}
              />
            </div>

            {/* Budget metrics row */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
                gap: "10px",
                fontSize: "12px",
                marginBottom: "14px",
              }}
            >
              <div>
                <span style={{ color: "var(--text-secondary)" }}>Usable Budget:</span>
                <div style={{ fontWeight: 700 }}>
                  {formatCurrencyValue(budgetPlan.usable_budget, currency, true)}
                </div>
              </div>
              <div>
                <span style={{ color: "var(--text-secondary)" }}>Planned Capex:</span>
                <div
                  style={{
                    fontWeight: 700,
                    color:
                      budgetPlan.total_planned_capex > budgetPlan.usable_budget
                        ? "var(--risk-severe)"
                        : "var(--forest-green)",
                  }}
                >
                  {formatCurrencyValue(budgetPlan.total_planned_capex, currency, true)}
                </div>
              </div>
              <div>
                <span style={{ color: "var(--text-secondary)" }}>Contingency Buffer:</span>
                <div style={{ fontWeight: 700, color: "var(--forest-green)" }}>
                  {formatCurrencyValue(budgetPlan.contingency_reserve, currency, true)}
                </div>
              </div>
              <div>
                <span style={{ color: "var(--text-secondary)" }}>Remaining Cushion:</span>
                <div
                  style={{
                    fontWeight: 700,
                    color:
                      budgetPlan.remaining_budget < 0
                        ? "var(--risk-severe)"
                        : "var(--text-primary)",
                  }}
                >
                  {formatCurrencyValue(budgetPlan.remaining_budget, currency, true)}
                </div>
              </div>
            </div>

            {/* Plain-Language Feasibility Banner */}
            {budgetPlan.is_feasible ? (
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: "var(--radius-button)",
                  background: "rgba(184, 233, 134, 0.2)",
                  border: "1px solid rgba(23, 63, 53, 0.2)",
                  fontSize: "12.5px",
                  color: "var(--forest-green)",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontWeight: 600,
                }}
              >
                <CheckCircle2 size={16} />
                <span>
                  Feasible Plan: All investments fit within your capital budget, annual maintenance ceiling, and land availability.
                </span>
              </div>
            ) : (
              <div
                style={{
                  padding: "12px 14px",
                  borderRadius: "var(--radius-button)",
                  background: "var(--white)",
                  border: "1px solid rgba(185, 75, 66, 0.3)",
                  fontSize: "12.5px",
                  color: "var(--risk-severe)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    fontWeight: 700,
                    marginBottom: "6px",
                  }}
                >
                  <AlertTriangle size={16} />
                  <span>Feasibility Alert: This plan cannot proceed without adjustments:</span>
                </div>
                <ul style={{ margin: "4px 0 0 20px", padding: 0, lineHeight: 1.6 }}>
                  {budgetPlan.violations.map((v, i) => (
                    <li key={i}>{formatViolationMessage(v)}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Scenario Delta Variance Banner (when non-baseline) */}
          {activeScenario !== "baseline" && (
            <div
              className="card"
              style={{
                background: "var(--warm-ivory)",
                border: "1px solid var(--border-subtle)",
                padding: "16px 20px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                <Shield size={16} color="var(--forest-green)" />
                <span style={{ fontWeight: 700, fontSize: "13.5px", color: "var(--text-primary)" }}>
                  Scenario Impact vs Baseline Plan (
                  {BUDGET_SCENARIOS.find((s) => s.id === activeScenario)?.label})
                </span>
              </div>
              <p style={{ margin: "0 0 10px 0", fontSize: "12px", color: "var(--text-secondary)" }}>
                {BUDGET_SCENARIOS.find((s) => s.id === activeScenario)?.description}
              </p>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                  gap: "12px",
                }}
              >
                <div>
                  <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>Capex Delta:</span>
                  <div
                    style={{
                      fontWeight: 700,
                      color:
                        budgetPlan.total_planned_capex > baselinePlan.total_planned_capex
                          ? "var(--risk-severe)"
                          : "var(--forest-green)",
                    }}
                  >
                    {budgetPlan.total_planned_capex >= baselinePlan.total_planned_capex ? "+" : ""}
                    {formatCurrencyValue(
                      budgetPlan.total_planned_capex - baselinePlan.total_planned_capex,
                      currency,
                      true
                    )}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>O&M Delta:</span>
                  <div style={{ fontWeight: 700 }}>
                    {budgetPlan.annual_maintenance_total >= baselinePlan.annual_maintenance_total
                      ? "+"
                      : ""}
                    {formatCurrencyValue(
                      budgetPlan.annual_maintenance_total - baselinePlan.annual_maintenance_total,
                      currency,
                      true
                    )}
                    /yr
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>Remaining Cushion:</span>
                  <div
                    style={{
                      fontWeight: 700,
                      color:
                        budgetPlan.remaining_budget < 0
                          ? "var(--risk-severe)"
                          : "var(--text-primary)",
                    }}
                  >
                    {formatCurrencyValue(budgetPlan.remaining_budget, currency, true)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Intervention Cards List */}
          <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            {DEFAULT_BUDGET_INTERVENTIONS.map((item: BudgetInterventionConfig) => {
              const units = allocations[item.id] || 0;
              const capex = units * item.capital_cost_usd;
              const opex = units * item.annual_maintenance_usd;
              const stormwater = units * item.runoff_reduction_m3_year;
              const water = units * item.water_demand_m3_year;
              const isExpanded = !!expandedDetails[item.id];
              const maxScale = item.id === "int-urban-forest" ? 5000 : 15000;
              const stepScale = item.id === "int-urban-forest" ? 50 : 100;

              return (
                <div key={item.id} className="intervention-card-premium">
                  {/* Card Header Row */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      flexWrap: "wrap",
                      gap: "12px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                      <div
                        style={{
                          width: "40px",
                          height: "40px",
                          borderRadius: "var(--radius-button)",
                          background: "var(--warm-ivory)",
                          border: "1px solid var(--border-subtle)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        {getInterventionIcon(item.id)}
                      </div>
                      <div>
                        <div
                          style={{
                            fontSize: "16px",
                            fontWeight: 700,
                            color: "var(--text-primary)",
                            lineHeight: 1.3,
                          }}
                        >
                          {item.name}
                        </div>
                        <div
                          style={{
                            fontSize: "12px",
                            color: "var(--text-secondary)",
                            marginTop: "3px",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            flexWrap: "wrap",
                          }}
                        >
                          <span className="badge badge-neutral">{item.category}</span>
                          <span>
                            Unit Cost:{" "}
                            <strong>
                              {formatCurrencyValue(item.capital_cost_usd, currency, true)}
                            </strong>
                          </span>
                          <span>•</span>
                          <span>
                            Annual O&M:{" "}
                            <strong>
                              {formatCurrencyValue(item.annual_maintenance_usd, currency, true)}/yr
                            </strong>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Before & After Visuals Button */}
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() =>
                        onNavigateToTransformation(item.id, preselectedNeighbourhoodId)
                      }
                      title="View Before & After Sustainability Visual"
                      style={{ flexShrink: 0 }}
                    >
                      <Layers size={13} />
                      <span>Visuals</span>
                    </button>
                  </div>

                  {/* One-Sentence Plain English Explanation */}
                  <div
                    style={{
                      fontSize: "13px",
                      color: "var(--text-secondary)",
                      lineHeight: 1.45,
                    }}
                  >
                    {getInterventionSummary(item.id)}
                  </div>

                  {/* Quantity Controls (Range Slider + Number Input directly below title & explanation) */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 180px",
                      gap: "16px",
                      alignItems: "center",
                      background: "var(--warm-ivory)",
                      padding: "12px 16px",
                      borderRadius: "var(--radius-button)",
                      border: "1px solid var(--border-subtle)",
                    }}
                  >
                    {/* Range Slider */}
                    <div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: "11px",
                          color: "var(--text-secondary)",
                          marginBottom: "4px",
                        }}
                      >
                        <span>Scale allocation</span>
                        <span>Max {maxScale.toLocaleString()}</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max={maxScale}
                        step={stepScale}
                        value={units}
                        onChange={(e) => handleUnitChange(item.id, parseInt(e.target.value) || 0)}
                        className="eco-slider"
                        aria-label={`Scale allocation for ${item.name}`}
                      />
                    </div>

                    {/* Numeric Input with Unit Badge & Step Buttons */}
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <button
                        type="button"
                        onClick={() => handleUnitChange(item.id, units - stepScale)}
                        disabled={units <= 0}
                        style={{
                          width: "28px",
                          height: "32px",
                          borderRadius: "var(--radius-sm)",
                          border: "1px solid var(--border-subtle)",
                          background: "var(--white)",
                          cursor: units <= 0 ? "not-allowed" : "pointer",
                          fontWeight: 700,
                          color: "var(--text-primary)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                        aria-label="Decrease quantity"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="0"
                        max="50000"
                        value={units}
                        onChange={(e) => handleUnitChange(item.id, parseInt(e.target.value) || 0)}
                        style={{
                          width: "80px",
                          height: "32px",
                          padding: "4px 8px",
                          fontSize: "13px",
                          fontWeight: 700,
                          borderRadius: "var(--radius-sm)",
                          border: "1px solid var(--border-subtle)",
                          textAlign: "right",
                          background: "var(--white)",
                          color: "var(--text-primary)",
                        }}
                        aria-label={`Exact units for ${item.name}`}
                      />
                      <button
                        type="button"
                        onClick={() => handleUnitChange(item.id, units + stepScale)}
                        style={{
                          width: "28px",
                          height: "32px",
                          borderRadius: "var(--radius-sm)",
                          border: "1px solid var(--border-subtle)",
                          background: "var(--white)",
                          cursor: "pointer",
                          fontWeight: 700,
                          color: "var(--text-primary)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                      <span
                        style={{
                          fontSize: "11px",
                          color: "var(--text-secondary)",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {item.id === "int-urban-forest" ? "trees" : "m²"}
                      </span>
                    </div>
                  </div>

                  {/* Impact Metrics Row (4 Metrics) */}
                  <div className="metrics-row-container">
                    <div>
                      <span style={{ color: "var(--text-secondary)", fontSize: "11px", display: "block" }}>
                        Capital Allocation
                      </span>
                      <div
                        className="tabular-nums"
                        style={{ fontSize: "15px", fontWeight: 800, color: "var(--forest-green)" }}
                      >
                        {formatCurrencyValue(capex, currency, true)}
                      </div>
                    </div>

                    <div>
                      <span style={{ color: "var(--text-secondary)", fontSize: "11px", display: "block" }}>
                        Yearly Maintenance
                      </span>
                      <div
                        className="tabular-nums"
                        style={{ fontSize: "15px", fontWeight: 700, color: "var(--text-primary)" }}
                      >
                        {formatCurrencyValue(opex, currency, true)}/yr
                      </div>
                    </div>

                    <div>
                      <span style={{ color: "var(--text-secondary)", fontSize: "11px", display: "block" }}>
                        Rainwater Diverted
                      </span>
                      <div
                        className="tabular-nums"
                        style={{ fontSize: "15px", fontWeight: 700, color: "var(--info-blue)" }}
                      >
                        {Math.round(stormwater).toLocaleString()} m³/yr
                      </div>
                    </div>

                    <div>
                      <span style={{ color: "var(--text-secondary)", fontSize: "11px", display: "block" }}>
                        {item.id === "int-rainwater-harvesting" ? "Net Water Supply" : "Cooling Benefit"}
                      </span>
                      <div
                        className="tabular-nums"
                        style={{
                          fontSize: "15px",
                          fontWeight: 700,
                          color:
                            water < 0
                              ? "var(--forest-green)"
                              : "var(--risk-moderate)",
                        }}
                      >
                        {item.id === "int-rainwater-harvesting"
                          ? `+${Math.round(Math.abs(water)).toLocaleString()} m³ surplus`
                          : `+${(units * item.heat_reduction_index).toFixed(2)} pts cooling`}
                      </div>
                    </div>
                  </div>

                  {/* Expandable "Details" Disclosure */}
                  <div>
                    <button
                      type="button"
                      onClick={() => toggleDetails(item.id)}
                      style={{
                        background: "none",
                        border: "none",
                        padding: "4px 0",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        fontSize: "12px",
                        fontWeight: 600,
                        color: "var(--text-secondary)",
                        cursor: "pointer",
                      }}
                      aria-expanded={isExpanded}
                    >
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      <span>{isExpanded ? "Hide technical details" : "Show technical details"}</span>
                    </button>

                    {isExpanded && (
                      <div
                        style={{
                          marginTop: "8px",
                          padding: "12px 14px",
                          background: "var(--warm-ivory)",
                          borderRadius: "var(--radius-button)",
                          border: "1px solid var(--border-subtle)",
                          fontSize: "12px",
                          display: "grid",
                          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                          gap: "10px",
                        }}
                      >
                        <div>
                          <span style={{ color: "var(--text-secondary)", display: "block" }}>Expected Lifespan:</span>
                          <strong>{item.expected_lifespan_years} years</strong>
                        </div>
                        <div>
                          <span style={{ color: "var(--text-secondary)", display: "block" }}>Land Footprint:</span>
                          <strong>{item.space_consumed_m2} m² per unit</strong>
                        </div>
                        <div>
                          <span style={{ color: "var(--text-secondary)", display: "block" }}>Carbon Sequestration:</span>
                          <strong>
                            {((units * item.carbon_sequestration_kg_year) / 1000).toFixed(2)} tCO₂/yr
                          </strong>
                        </div>
                        <div>
                          <span style={{ color: "var(--text-secondary)", display: "block" }}>Model Source:</span>
                          <span style={{ color: "var(--text-secondary)" }}>{item.data_source}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Cumulative Environmental Outcomes & Actions */}
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">Cumulative Environmental Outcomes</div>
                <div className="card-subtitle">Aggregated benefits across all planned investments</div>
              </div>
              <span className="badge badge-forest">Modeled Impact</span>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: "16px",
              }}
            >
              {/* Stormwater Diverted */}
              <div
                style={{
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-button)",
                  padding: "16px",
                  background: "var(--white)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    color: "var(--info-blue)",
                    marginBottom: "6px",
                  }}
                >
                  <Droplet size={18} />
                  <span style={{ fontWeight: 700, fontSize: "13px" }}>Stormwater Diverted</span>
                </div>
                <div
                  style={{
                    fontSize: "24px",
                    fontWeight: 800,
                    color: "var(--text-primary)",
                  }}
                  className="tabular-nums"
                >
                  {Math.round(budgetPlan.total_stormwater_runoff_diverted_m3).toLocaleString()} m³
                </div>
                <div style={{ fontSize: "11.5px", color: "var(--text-secondary)", marginTop: "4px" }}>
                  Peak cloudburst absorption capacity per rainstorm event
                </div>
              </div>

              {/* Annual Carbon Sink */}
              <div
                style={{
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-button)",
                  padding: "16px",
                  background: "var(--white)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    color: "var(--forest-green)",
                    marginBottom: "6px",
                  }}
                >
                  <TreePine size={18} />
                  <span style={{ fontWeight: 700, fontSize: "13px" }}>Annual Carbon Sink</span>
                </div>
                <div
                  style={{
                    fontSize: "24px",
                    fontWeight: 800,
                    color: "var(--text-primary)",
                  }}
                  className="tabular-nums"
                >
                  {budgetPlan.total_carbon_sequestration_tco2.toFixed(1)} tCO₂
                </div>
                <div style={{ fontSize: "11.5px", color: "var(--text-secondary)", marginTop: "4px" }}>
                  Annual biomass absorption across urban canopy & vegetation
                </div>
              </div>

              {/* Heat Mitigation Index */}
              <div
                style={{
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-button)",
                  padding: "16px",
                  background: "var(--white)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    color: "var(--risk-moderate)",
                    marginBottom: "6px",
                  }}
                >
                  <TrendingUp size={18} />
                  <span style={{ fontWeight: 700, fontSize: "13px" }}>Heat Mitigation Index</span>
                </div>
                <div
                  style={{
                    fontSize: "24px",
                    fontWeight: 800,
                    color: "var(--text-primary)",
                  }}
                  className="tabular-nums"
                >
                  +{budgetPlan.total_heat_cooling_score.toFixed(1)} pts
                </div>
                <div style={{ fontSize: "11.5px", color: "var(--text-secondary)", marginTop: "4px" }}>
                  Microclimate cooling impact across targeted neighbourhoods
                </div>
              </div>
            </div>

            {/* Quick Navigation Footnote */}
            <div
              style={{
                marginTop: "20px",
                paddingTop: "16px",
                borderTop: "1px solid var(--border-subtle)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "12px",
              }}
            >
              <div style={{ fontSize: "12.5px", color: "var(--text-secondary)" }}>
                Connect this budget allocation to geographic city maps and downstream causal chains:
              </div>
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => onNavigateToMap(preselectedNeighbourhoodId)}
                >
                  <MapPin size={13} />
                  <span>View District Map</span>
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() =>
                    onNavigateToTransformation("int-urban-forest", preselectedNeighbourhoodId)
                  }
                >
                  <Layers size={13} />
                  <span>Visual Comparison</span>
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() =>
                    onNavigateToConsequences(
                      "int-urban-forest",
                      allocations["int-urban-forest"] || 500,
                      preselectedNeighbourhoodId
                    )
                  }
                >
                  <ArrowRight size={13} />
                  <span>Inspect Consequences</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
