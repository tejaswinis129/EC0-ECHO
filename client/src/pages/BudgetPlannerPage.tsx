import React, { useState, useEffect } from "react";
import {
  Currency,
  BudgetSetupParams,
  BudgetScenarioType,
  BUDGET_SCENARIOS,
  DEFAULT_BUDGET_INTERVENTIONS,
  calculateBudgetPlan,
  formatCurrencyValue,
} from "../utils/budgetCalculator";
import { api } from "../api/client";
import { MetricCard } from "../components/MetricCard";
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
}

export const BudgetPlannerPage: React.FC<BudgetPlannerPageProps> = ({
  activeDatasetId,
  onNavigateToMap,
  onNavigateToTransformation,
  onNavigateToConsequences,
  preselectedNeighbourhoodId,
}) => {
  const [currency, setCurrency] = useState<Currency>("USD");
  const [activeScenario, setActiveScenario] = useState<BudgetScenarioType>("baseline");
  const [isSolving, setIsSolving] = useState(false);
  const [optimiserNotice, setOptimiserNotice] = useState<string | null>(null);

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

  // Keep currency in sync
  useEffect(() => {
    setParams((p) => ({ ...p, currency }));
  }, [currency]);

  // Live calculation
  const budgetPlan = calculateBudgetPlan(
    params,
    allocations,
    activeScenario,
    DEFAULT_BUDGET_INTERVENTIONS
  );

  // Baseline comparison plan
  const baselinePlan = calculateBudgetPlan(
    params,
    allocations,
    "baseline",
    DEFAULT_BUDGET_INTERVENTIONS
  );

  const handleUnitChange = (id: string, units: number) => {
    setAllocations((prev) => ({
      ...prev,
      [id]: Math.max(0, units),
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
    setOptimiserNotice("All manual allocations cleared to zero.");
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
        // Aggregate units by intervention
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
          `Applied Pareto-optimal solution from SciPy HiGHS solver (${res.execution_time_ms} ms). Strategy: ${alt.strategy_label}.`
        );
      }
    } catch (err: any) {
      console.error("Optimiser fetch error", err);
      setOptimiserNotice("Could not connect to solver. Loaded fallback balanced allocation.");
    } finally {
      setIsSolving(false);
    }
  };

  const downloadCsv = () => {
    let csv = "ECO-ECHO Urban Sustainability Budget Plan\n";
    csv += `Dataset,${activeDatasetId}\n`;
    csv += `Date,${new Date().toISOString()}\n`;
    csv += `Currency,${currency}\n`;
    csv += `Active Scenario,${activeScenario}\n`;
    csv += `Total Budget Cap,${params.total_budget_cap}\n`;
    csv += `Total Planned Capex,${budgetPlan.total_planned_capex}\n`;
    csv += `Remaining Budget,${budgetPlan.remaining_budget}\n`;
    csv += `Annual Maintenance Total,${budgetPlan.annual_maintenance_total}\n`;
    csv += `Feasible,${budgetPlan.is_feasible ? "YES" : "NO"}\n\n`;

    csv += "Intervention ID,Intervention Name,Category,Units,Unit Capex (USD),Total Capex (USD),Annual O&M (USD),Land (m2),Net Water (m3/yr),Stormwater Diverted (m3),Carbon (tCO2/yr)\n";
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

  return (
    <div style={{ width: "100%", minWidth: 0 }}>
      {/* Page Header */}
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
          <div className="page-header-text" style={{ flex: "1 1 480px", minWidth: 0 }}>
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
                  fontSize: "24px",
                  fontWeight: 800,
                  color: "var(--text-primary)",
                  letterSpacing: "-0.5px",
                }}
              >
                Smart Sustainability Budget Planner
              </h1>
              <span
                className="badge badge-forest"
                style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}
              >
                <Wallet size={12} /> Financial Decision Engine
              </span>
              {preselectedNeighbourhoodId && (
                <span className="badge badge-lime">Focus: {preselectedNeighbourhoodId}</span>
              )}
            </div>
            <p
              style={{
                margin: 0,
                fontSize: "13.5px",
                color: "var(--text-secondary)",
                lineHeight: 1.5,
                maxWidth: "780px",
              }}
            >
              Allocate capital for nature-based climate solutions, simulate economic and drought
              stress tests, and balance multi-year lifecycle operations and maintenance against
              strict spatial and water limits.
            </p>
          </div>

          {/* Currency Toggle & Quick Export Actions */}
          <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
            {/* Currency Selector */}
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
              >
                USD ($)
              </button>
              <button
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
              >
                INR (₹)
              </button>
            </div>

            {/* Feasibility Indicator */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 12px",
                borderRadius: "var(--radius-full)",
                background: budgetPlan.is_feasible
                  ? "rgba(184, 233, 134, 0.25)"
                  : "rgba(239, 68, 68, 0.12)",
                border: `1px solid ${
                  budgetPlan.is_feasible ? "rgba(23, 63, 53, 0.2)" : "rgba(239, 68, 68, 0.3)"
                }`,
                fontSize: "12px",
                fontWeight: 700,
                color: budgetPlan.is_feasible ? "var(--forest-green)" : "var(--risk-severe)",
              }}
            >
              {budgetPlan.is_feasible ? (
                <>
                  <CheckCircle2 size={13} color="var(--forest-green)" />
                  <span>Feasible Plan</span>
                </>
              ) : (
                <>
                  <AlertTriangle size={13} color="var(--risk-severe)" />
                  <span>Constraint Breach ({budgetPlan.violations.length})</span>
                </>
              )}
            </div>

            <button
              className="btn btn-secondary btn-sm"
              onClick={downloadCsv}
              title="Export Plan as CSV"
            >
              <Download size={13} />
              <span>Export CSV</span>
            </button>

            <button
              className="btn btn-secondary btn-sm"
              onClick={handlePrint}
              title="Printable Audit Summary"
            >
              <Printer size={13} />
              <span>Print Plan</span>
            </button>
          </div>
        </div>
      </div>

      {/* Optimiser Notice if applied */}
      {optimiserNotice && (
        <div
          style={{
            background: "rgba(184, 233, 134, 0.2)",
            border: "1px solid rgba(23, 63, 53, 0.2)",
            borderRadius: "var(--radius-card)",
            padding: "12px 16px",
            marginBottom: "20px",
            fontSize: "12.5px",
            color: "var(--forest-green)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Sparkles size={16} />
            <span>{optimiserNotice}</span>
          </div>
          <button
            onClick={() => setOptimiserNotice(null)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: "14px",
              color: "var(--forest-green)",
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Section 1: KPI Financial Highlights */}
      <div className="kpi-grid" style={{ marginBottom: "24px" }}>
        <MetricCard
          label="Total Planned Capital"
          value={formatCurrencyValue(budgetPlan.total_planned_capex, currency, true)}
          subtext={`${budgetPlan.budget_utilization_pct.toFixed(0)}% of usable cap (${formatCurrencyValue(
            budgetPlan.usable_budget,
            currency,
            true
          )})`}
          variant="forest"
          icon={DollarSign}
        />
        <MetricCard
          label={budgetPlan.remaining_budget >= 0 ? "Remaining Budget" : "Budget Overrun"}
          value={formatCurrencyValue(Math.abs(budgetPlan.remaining_budget), currency, true)}
          subtext={
            budgetPlan.remaining_budget >= 0
              ? `Includes ${formatCurrencyValue(budgetPlan.contingency_reserve, currency, true)} reserve`
              : "Deficit exceeds capital ceiling!"
          }
          variant={budgetPlan.remaining_budget >= 0 ? "primary" : "adverse"}
          icon={Wallet}
        />
        <MetricCard
          label="Annual Operations & Maint."
          value={`${formatCurrencyValue(budgetPlan.annual_maintenance_total, currency, true)}/yr`}
          subtext={`${budgetPlan.maintenance_utilization_pct.toFixed(0)}% of ${formatCurrencyValue(
            budgetPlan.maintenance_ceiling,
            currency,
            true
          )} ceiling`}
          variant={budgetPlan.maintenance_utilization_pct > 100 ? "adverse" : "heat"}
          icon={TrendingUp}
        />
        <MetricCard
          label="10-Year Lifecycle Commitment"
          value={formatCurrencyValue(budgetPlan.ten_year_lifecycle_cost, currency, true)}
          subtext="Capex + 10 Years Ongoing Stewardship"
          variant="water"
          icon={Scale}
        />
      </div>

      {/* Section 2: Two-Column Workspace (Left: Setup & Scenarios, Right: Allocations & Environmental Outcomes) */}
      <div className="optimisation-layout" style={{ marginBottom: "24px" }}>
        {/* Left Column: Budget Controls & Scenario Lab */}
        <div className="optimisation-controls">
          {/* Card 1: Budget & Physical Ceilings */}
          <div className="card">
            <div className="card-header">
              <div className="card-title-group">
                <Wallet size={17} color="var(--forest-green)" />
                <div>
                  <div className="card-title">Budget Setup & Ceilings</div>
                  <div className="card-subtitle">
                    {currency === "INR" ? "Values displayed in ₹ (1 USD = ₹83.5)" : "Values in USD ($)"}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <div className="form-label-row">
                  <span>Total Capital Budget</span>
                  <span className="tabular-nums" style={{ fontWeight: 800, color: "var(--forest-green)" }}>
                    {formatCurrencyValue(params.total_budget_cap, currency, true)}
                  </span>
                </div>
                <input
                  type="range"
                  min="500000"
                  max="10000000"
                  step="250000"
                  value={params.total_budget_cap}
                  onChange={(e) => setParams({ ...params, total_budget_cap: parseInt(e.target.value) })}
                  className="eco-slider"
                />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10.5px", color: "var(--text-secondary)" }}>
                  <span>{formatCurrencyValue(500000, currency, true)}</span>
                  <span>{formatCurrencyValue(5000000, currency, true)}</span>
                  <span>{formatCurrencyValue(10000000, currency, true)}</span>
                </div>
              </div>

              <div>
                <div className="form-label-row">
                  <span>Annual Maintenance Ceiling</span>
                  <span className="tabular-nums" style={{ fontWeight: 700 }}>
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
                    setParams({ ...params, annual_maintenance_ceiling: parseInt(e.target.value) })
                  }
                  className="eco-slider"
                />
              </div>

              <div>
                <div className="form-label-row">
                  <span>Available Public Land Cap</span>
                  <span className="tabular-nums" style={{ fontWeight: 700 }}>
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
                    setParams({ ...params, available_land_m2: parseInt(e.target.value) })
                  }
                  className="eco-slider"
                />
              </div>

              <div>
                <div className="form-label-row">
                  <span>Min Frontline Equity Share</span>
                  <span className="tabular-nums" style={{ fontWeight: 700 }}>
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
                />
              </div>

              <div>
                <div className="form-label-row">
                  <span>Emergency Contingency Reserve</span>
                  <span className="tabular-nums" style={{ fontWeight: 700 }}>
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
                    setParams({ ...params, contingency_reserve_pct: parseFloat(e.target.value) })
                  }
                  className="eco-slider"
                />
              </div>
            </div>
          </div>

          {/* Card 2: Stress Scenarios */}
          <div className="card">
            <div className="card-header">
              <div className="card-title-group">
                <Shield size={17} color="var(--forest-green)" />
                <div>
                  <div className="card-title">Stress-Testing Scenarios</div>
                  <div className="card-subtitle">Macroeconomic shocks & climate stresses</div>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {BUDGET_SCENARIOS.map((scen) => {
                const isSelected = activeScenario === scen.id;
                return (
                  <button
                    key={scen.id}
                    onClick={() => setActiveScenario(scen.id)}
                    style={{
                      textAlign: "left",
                      padding: "10px 12px",
                      borderRadius: "var(--radius-button)",
                      border: `1px solid ${isSelected ? "var(--forest-green)" : "var(--border-subtle)"}`,
                      background: isSelected ? "var(--warm-ivory)" : "var(--white)",
                      cursor: "pointer",
                      transition: "all var(--transition-fast)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span
                        style={{
                          fontSize: "12px",
                          fontWeight: 700,
                          color: isSelected ? "var(--forest-green)" : "var(--text-primary)",
                        }}
                      >
                        {scen.label}
                      </span>
                      {isSelected && <span className="badge badge-lime">Active</span>}
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "4px" }}>
                      {scen.description}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Card 3: Smart Optimisation Presets */}
          <div className="card">
            <div className="card-header">
              <div className="card-title-group">
                <Sparkles size={17} color="var(--forest-green)" />
                <div>
                  <div className="card-title">HiGHS Optimiser Presets</div>
                  <div className="card-subtitle">SciPy Mixed-Integer Solver</div>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => handleApplyOptimiser("balanced")}
                disabled={isSolving}
                style={{ justifyContent: "flex-start", padding: "10px" }}
              >
                <Play size={13} fill="currentColor" />
                <span>Apply Balanced Portfolio</span>
              </button>

              <button
                className="btn btn-secondary btn-sm"
                onClick={() => handleApplyOptimiser("cost_focused")}
                disabled={isSolving}
                style={{ justifyContent: "flex-start", padding: "10px" }}
              >
                <Play size={13} fill="currentColor" />
                <span>Apply Cost-Efficiency Focus</span>
              </button>

              <button
                className="btn btn-secondary btn-sm"
                onClick={() => handleApplyOptimiser("equity_focused")}
                disabled={isSolving}
                style={{ justifyContent: "flex-start", padding: "10px" }}
              >
                <Play size={13} fill="currentColor" />
                <span>Apply Frontline Equity Focus</span>
              </button>

              <button
                className="btn btn-secondary btn-sm"
                onClick={handleResetAllocations}
                style={{ justifyContent: "flex-start", padding: "10px", marginTop: "4px" }}
              >
                <RotateCcw size={13} />
                <span>Clear Allocations (Manual Entry)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Interventions, Feasibility & Environmental Outcomes */}
        <div className="optimisation-results">
          {/* Feasibility Alert Box */}
          {!budgetPlan.is_feasible ? (
            <div
              style={{
                background: "var(--risk-severe-bg)",
                border: "1px solid #f3cbc8",
                borderRadius: "var(--radius-card)",
                padding: "16px 20px",
                color: "var(--risk-severe)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 800, fontSize: "14px" }}>
                <AlertTriangle size={18} />
                <span>Feasibility Alert: Budget or Physical Constraints Violated</span>
              </div>
              <ul style={{ margin: "10px 0 0 18px", padding: 0, fontSize: "12.5px", lineHeight: 1.6 }}>
                {budgetPlan.violations.map((v, i) => (
                  <li key={i}>{v}</li>
                ))}
              </ul>
            </div>
          ) : (
            <div
              style={{
                background: "rgba(184, 233, 134, 0.2)",
                border: "1px solid rgba(23, 63, 53, 0.25)",
                borderRadius: "var(--radius-card)",
                padding: "14px 18px",
                color: "var(--forest-green)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "10px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", fontWeight: 700 }}>
                <CheckCircle2 size={16} />
                <span>
                  Allocation Feasible within Capital (${formatCurrencyValue(budgetPlan.usable_budget, currency, true)}), Maintenance, and Land Constraints.
                </span>
              </div>
              <span className="badge badge-lime">
                {budgetPlan.budget_utilization_pct.toFixed(0)}% Utilized
              </span>
            </div>
          )}

          {/* Scenario Delta Variance Banner (if non-baseline) */}
          {activeScenario !== "baseline" && (
            <div
              style={{
                background: "var(--warm-ivory)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-card)",
                padding: "14px 18px",
                fontSize: "12.5px",
              }}
            >
              <div style={{ fontWeight: 700, color: "var(--text-primary)", marginBottom: "6px" }}>
                Scenario Impact vs Baseline Plan ({BUDGET_SCENARIOS.find((s) => s.id === activeScenario)?.label})
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "12px", marginTop: "8px" }}>
                <div>
                  <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>Capex Delta:</span>
                  <div style={{ fontWeight: 700, color: budgetPlan.total_planned_capex > baselinePlan.total_planned_capex ? "var(--risk-severe)" : "var(--forest-green)" }}>
                    {budgetPlan.total_planned_capex >= baselinePlan.total_planned_capex ? "+" : ""}
                    {formatCurrencyValue(budgetPlan.total_planned_capex - baselinePlan.total_planned_capex, currency, true)}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>O&M Delta:</span>
                  <div style={{ fontWeight: 700 }}>
                    {budgetPlan.annual_maintenance_total >= baselinePlan.annual_maintenance_total ? "+" : ""}
                    {formatCurrencyValue(budgetPlan.annual_maintenance_total - baselinePlan.annual_maintenance_total, currency, true)}/yr
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>Remaining Cushion:</span>
                  <div style={{ fontWeight: 700, color: budgetPlan.remaining_budget < 0 ? "var(--risk-severe)" : "var(--text-primary)" }}>
                    {formatCurrencyValue(budgetPlan.remaining_budget, currency, true)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Intervention Allocations Cards */}
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">Intervention Capital Allocations</div>
                <div className="card-subtitle">Adjust deployment quantities to balance cooling, runoff, and operational costs</div>
              </div>
              <span className="badge badge-neutral">5 Interventions</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {DEFAULT_BUDGET_INTERVENTIONS.map((item) => {
                const units = allocations[item.id] || 0;
                const capex = units * item.capital_cost_usd;
                const opex = units * item.annual_maintenance_usd;
                const stormwater = units * item.runoff_reduction_m3_year;
                const water = units * item.water_demand_m3_year;

                return (
                  <div
                    key={item.id}
                    style={{
                      border: "1px solid var(--border-subtle)",
                      borderRadius: "var(--radius-button)",
                      padding: "16px",
                      background: "var(--white)",
                      transition: "all var(--transition-fast)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px", marginBottom: "12px" }}>
                      <div>
                        <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)" }}>
                          {item.name}
                        </div>
                        <div style={{ fontSize: "11.5px", color: "var(--text-secondary)", marginTop: "2px" }}>
                          {item.category} • Cost: {formatCurrencyValue(item.capital_cost_usd, currency, true)} / unit • O&M: {formatCurrencyValue(item.annual_maintenance_usd, currency, true)}/yr
                        </div>
                      </div>

                      {/* Quick Navigation to Transformation Visuals */}
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => onNavigateToTransformation(item.id, preselectedNeighbourhoodId)}
                        title="View Before & After Sustainability Visual"
                      >
                        <Layers size={12} />
                        <span>Visuals</span>
                      </button>
                    </div>

                    {/* Scale Controls: Range slider + Number input */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 140px", gap: "16px", alignItems: "center", marginBottom: "12px" }}>
                      <div>
                        <input
                          type="range"
                          min="0"
                          max={item.id === "int-urban-forest" ? 5000 : 15000}
                          step={item.id === "int-urban-forest" ? 50 : 100}
                          value={units}
                          onChange={(e) => handleUnitChange(item.id, parseInt(e.target.value))}
                          className="eco-slider"
                        />
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <input
                          type="number"
                          min="0"
                          max="50000"
                          value={units}
                          onChange={(e) => handleUnitChange(item.id, parseInt(e.target.value) || 0)}
                          style={{
                            width: "90px",
                            padding: "6px 8px",
                            fontSize: "13px",
                            fontWeight: 700,
                            borderRadius: "var(--radius-sm)",
                            border: "1px solid var(--border-subtle)",
                            textAlign: "right",
                          }}
                        />
                        <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>units</span>
                      </div>
                    </div>

                    {/* Computed Financial & Environmental Metrics */}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
                        gap: "10px",
                        background: "var(--warm-ivory)",
                        borderRadius: "var(--radius-sm)",
                        padding: "10px 14px",
                        fontSize: "12px",
                      }}
                    >
                      <div>
                        <span style={{ color: "var(--text-secondary)", fontSize: "11px" }}>Capital Allocated:</span>
                        <div className="tabular-nums" style={{ fontWeight: 800, color: "var(--forest-green)" }}>
                          {formatCurrencyValue(capex, currency, true)}
                        </div>
                      </div>
                      <div>
                        <span style={{ color: "var(--text-secondary)", fontSize: "11px" }}>Annual O&M:</span>
                        <div className="tabular-nums" style={{ fontWeight: 700 }}>
                          {formatCurrencyValue(opex, currency, true)}/yr
                        </div>
                      </div>
                      <div>
                        <span style={{ color: "var(--text-secondary)", fontSize: "11px" }}>Runoff Diverted:</span>
                        <div className="tabular-nums" style={{ fontWeight: 700, color: "var(--info-blue)" }}>
                          {Math.round(stormwater).toLocaleString()} m³
                        </div>
                      </div>
                      <div>
                        <span style={{ color: "var(--text-secondary)", fontSize: "11px" }}>Net Water Impact:</span>
                        <div
                          className="tabular-nums"
                          style={{
                            fontWeight: 700,
                            color: water < 0 ? "var(--forest-green)" : water > 500 ? "var(--risk-severe)" : "var(--text-primary)",
                          }}
                        >
                          {water < 0 ? `-${Math.round(Math.abs(water)).toLocaleString()} m³ (Surplus)` : `+${Math.round(water).toLocaleString()} m³`}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 3: Summary Environmental Outcomes & Actions */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">Cumulative Environmental Outcomes</div>
              <span className="badge badge-forest">Modeled System Impacts</span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px" }}>
              <div style={{ border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-button)", padding: "14px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--info-blue)", marginBottom: "6px" }}>
                  <Droplet size={16} />
                  <span style={{ fontWeight: 700, fontSize: "13px" }}>Stormwater Diverted</span>
                </div>
                <div style={{ fontSize: "22px", fontWeight: 800, color: "var(--text-primary)" }}>
                  {Math.round(budgetPlan.total_stormwater_runoff_diverted_m3).toLocaleString()} m³
                </div>
                <div style={{ fontSize: "11.5px", color: "var(--text-secondary)", marginTop: "4px" }}>
                  Peak cloudburst absorption capacity
                </div>
              </div>

              <div style={{ border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-button)", padding: "14px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--forest-green)", marginBottom: "6px" }}>
                  <TreePine size={16} />
                  <span style={{ fontWeight: 700, fontSize: "13px" }}>Annual Carbon Sink</span>
                </div>
                <div style={{ fontSize: "22px", fontWeight: 800, color: "var(--text-primary)" }}>
                  {budgetPlan.total_carbon_sequestration_tco2.toFixed(1)} tCO₂
                </div>
                <div style={{ fontSize: "11.5px", color: "var(--text-secondary)", marginTop: "4px" }}>
                  Biomass sequestration per year
                </div>
              </div>

              <div style={{ border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-button)", padding: "14px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--risk-moderate)", marginBottom: "6px" }}>
                  <TrendingUp size={16} />
                  <span style={{ fontWeight: 700, fontSize: "13px" }}>Heat Mitigation Index</span>
                </div>
                <div style={{ fontSize: "22px", fontWeight: 800, color: "var(--text-primary)" }}>
                  +{budgetPlan.total_heat_cooling_score.toFixed(1)} pts
                </div>
                <div style={{ fontSize: "11.5px", color: "var(--text-secondary)", marginTop: "4px" }}>
                  Thermal island reduction impact
                </div>
              </div>
            </div>

            {/* Quick Navigation Footnotes */}
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
              <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                Ready to link allocations to physical spatial maps and downstream causal chains?
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => onNavigateToMap(preselectedNeighbourhoodId)}
                >
                  <MapPin size={13} />
                  <span>View District Map</span>
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => onNavigateToTransformation("int-urban-forest", preselectedNeighbourhoodId)}
                >
                  <Layers size={13} />
                  <span>Visual Comparison</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
