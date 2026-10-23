import React, { useState, useEffect } from "react";
import {
  OptimisationRequest,
  OptimisationResult,
  AlternativePortfolio,
  DecisionExplanation,
  DatasetMetadata,
} from "../types";
import { api } from "../api/client";
import { MetricCard } from "../components/MetricCard";
import { DecisionExplainer } from "../components/DecisionExplainer";
import {
  Sliders,
  DollarSign,
  Play,
  GitFork,
  CheckCircle2,
  AlertTriangle,
  Scale,
  Sparkles,
  RefreshCw,
  Droplet,
  ShieldCheck,
  Building2,
} from "lucide-react";

interface OptimisationPageProps {
  activeDatasetId: string;
  onNavigateToConsequences: (
    interventionId: string,
    units: number,
    neighbourhoodId?: string,
    strategy?: string
  ) => void;
  onSelectDataset?: (id: string) => void;
  availableDatasets?: Array<{ dataset_id: string; name: string }>;
}

export const OptimisationPage: React.FC<OptimisationPageProps> = ({
  activeDatasetId,
  onNavigateToConsequences,
  onSelectDataset,
  availableDatasets,
}) => {
  const [budgetCap, setBudgetCap] = useState<number>(2500000);
  const [minEquityShare, setMinEquityShare] = useState<number>(0.30);
  const [heatWeight, setHeatWeight] = useState<number>(0.25);
  const [floodWeight, setFloodWeight] = useState<number>(0.25);
  const [waterWeight, setWaterWeight] = useState<number>(0.20);
  const [equityWeight, setEquityWeight] = useState<number>(0.20);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<OptimisationResult | null>(null);
  const [activeStrategy, setActiveStrategy] = useState<string>("balanced");
  const [explanation, setExplanation] = useState<DecisionExplanation | null>(null);
  const [isExplaining, setIsExplaining] = useState<boolean>(false);

  useEffect(() => {
    if (activeDatasetId) {
      handleSolve();
    }
  }, [activeDatasetId]);

  const handleSolve = async () => {
    setIsLoading(true);
    try {
      const req: OptimisationRequest = {
        dataset_id: activeDatasetId,
        total_budget_cap: budgetCap,
        min_equity_investment_share: minEquityShare,
        weights: {
          heat_reduction: heatWeight,
          flood_reduction: floodWeight,
          water_resilience: waterWeight,
          green_equity: equityWeight,
          cost_efficiency: 0.10,
        },
      };

      const res = await api.solveOptimisation(req);
      setResult(res);
      const initialStrategy = res.selected_strategy || "balanced";
      setActiveStrategy(initialStrategy);

      const selPort =
        res.alternatives.find((a) => a.strategy_id === initialStrategy) ||
        res.alternatives[0];
      if (selPort) {
        generateExplanation(selPort, res.dataset_name);
      }
    } catch (err: any) {
      console.error("Optimisation error", err);
    } finally {
      setIsLoading(false);
    }
  };

  const generateExplanation = async (
    portfolio: AlternativePortfolio,
    datasetName: string
  ) => {
    setIsExplaining(true);
    try {
      const exp = await api.explainDecision({
        portfolio_strategy: portfolio.strategy_id,
        dataset_name: datasetName,
        total_budget_cap: budgetCap,
        total_capital_allocated: portfolio.total_capital_cost,
        budget_utilization_pct: portfolio.budget_utilization_pct,
        heat_reduction_score: portfolio.estimated_city_heat_reduction_score,
        stormwater_diverted_m3: portfolio.total_stormwater_runoff_diverted_m3,
        net_water_impact_m3: portfolio.net_annual_water_impact_m3,
        equity_score: portfolio.equity_score,
        vulnerable_investment_pct: portfolio.vulnerable_area_investment_share_pct,
        binding_constraints: portfolio.binding_constraints,
        trade_offs: portfolio.trade_off_summary,
        key_neighbourhoods: portfolio.neighbourhood_summaries,
      });
      setExplanation(exp);
    } catch (err) {
      console.error("AI explanation error", err);
    } finally {
      setIsExplaining(false);
    }
  };

  const handleSelectStrategy = (alt: AlternativePortfolio) => {
    setActiveStrategy(alt.strategy_id);
    if (result) {
      generateExplanation(alt, result.dataset_name);
    }
  };

  const activePortfolio =
    result?.alternatives.find((a) => a.strategy_id === activeStrategy) ||
    result?.alternatives[0];

  const formatCurrency = (val: number) => {
    if (val >= 1000000) {
      return `$${(val / 1000000).toFixed(2)}M`;
    }
    return `$${(val / 1000).toFixed(0)}k`;
  };

  return (
    <div style={{ width: "100%", minWidth: 0 }}>
      {/* Section A: Page Header */}
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
                Multi-Objective Optimisation Studio
              </h1>
              <span
                className="badge badge-forest"
                style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}
              >
                <Sparkles size={11} /> SciPy HiGHS Solver
              </span>
            </div>
            <p
              style={{
                margin: 0,
                fontSize: "13.5px",
                color: "var(--text-secondary)",
                lineHeight: 1.5,
                maxWidth: "760px",
              }}
            >
              Constraint-aware decision engine powered by SciPy HiGHS mixed-integer and linear
              programming. Balances environmental impact, capital budget ceilings, and frontline
              spatial equity.
            </p>
          </div>

          {/* Compact Dataset Selector & Solver Status */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "12px",
            }}
          >
            {availableDatasets && availableDatasets.length > 0 && onSelectDataset && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  background: "var(--white)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-button)",
                  padding: "6px 10px",
                  boxShadow: "var(--shadow-subtle)",
                }}
              >
                <Building2 size={13} color="var(--forest-green)" />
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    color: "var(--text-secondary)",
                  }}
                >
                  Dataset:
                </span>
                <select
                  value={activeDatasetId}
                  onChange={(e) => onSelectDataset(e.target.value)}
                  style={{
                    border: "none",
                    outline: "none",
                    background: "transparent",
                    fontSize: "12.5px",
                    fontWeight: 600,
                    color: "var(--text-primary)",
                    cursor: "pointer",
                    padding: 0,
                  }}
                >
                  {availableDatasets.map((d) => (
                    <option key={d.dataset_id} value={d.dataset_id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Solver Status Indicator */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "6px 14px",
                borderRadius: "var(--radius-full)",
                background: result?.is_feasible
                  ? "rgba(184, 233, 134, 0.2)"
                  : "rgba(29, 41, 37, 0.05)",
                border: `1px solid ${
                  result?.is_feasible ? "rgba(23, 63, 53, 0.2)" : "var(--border-subtle)"
                }`,
                fontSize: "12px",
                fontWeight: 600,
                color: "var(--text-primary)",
              }}
            >
              <span
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: isLoading
                    ? "#f59e0b"
                    : result?.is_feasible
                    ? "#10b981"
                    : "#ef4444",
                  boxShadow: result?.is_feasible ? "0 0 6px #10b981" : "none",
                }}
              />
              <span>
                {isLoading
                  ? "Solving HiGHS LP..."
                  : result?.is_feasible
                  ? `SciPy HiGHS: Feasible (${result.execution_time_ms} ms)`
                  : "Solver Standby"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Section B: Optimisation Workspace (2-Column Desktop Grid) */}
      <div className="optimisation-layout">
        {/* Left Column: Constraints & Objective Weights */}
        <div className="optimisation-controls">
          {/* Panel 1: Constraints & Parameters */}
          <div className="card">
            <div className="card-header">
              <div className="card-title-group">
                <Sliders size={18} color="var(--forest-green)" />
                <div>
                  <div className="card-title">Constraints & Parameters</div>
                  <div className="card-subtitle">Boundary ceilings & equity floors</div>
                </div>
              </div>
            </div>

            <div className="form-group">
              <div className="form-label-row">
                <span>Capital Budget Ceiling</span>
                <span
                  className="tabular-nums"
                  style={{ fontWeight: 800, color: "var(--forest-green)" }}
                >
                  ${(budgetCap / 1000000).toFixed(2)}M USD
                </span>
              </div>
              <input
                type="range"
                min="500000"
                max="10000000"
                step="250000"
                value={budgetCap}
                onChange={(e) => setBudgetCap(parseInt(e.target.value))}
                className="eco-slider"
                aria-label="Capital Budget Ceiling"
              />
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "11px",
                  color: "var(--text-secondary)",
                  marginTop: "3px",
                }}
              >
                <span>$0.5M</span>
                <span>$5.0M</span>
                <span>$10.0M</span>
              </div>
              <div
                style={{
                  fontSize: "11px",
                  color: "var(--text-secondary)",
                  marginTop: "6px",
                  lineHeight: 1.35,
                }}
              >
                Sets total municipal capital investment ceiling across all districts.
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <div className="form-label-row">
                <span>Min Frontline Equity Share</span>
                <span
                  className="tabular-nums"
                  style={{ fontWeight: 800, color: "var(--forest-green)" }}
                >
                  {(minEquityShare * 100).toFixed(0)}%
                </span>
              </div>
              <input
                type="range"
                min="0.10"
                max="0.80"
                step="0.05"
                value={minEquityShare}
                onChange={(e) => setMinEquityShare(parseFloat(e.target.value))}
                className="eco-slider"
                aria-label="Minimum Frontline Equity Share"
              />
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "11px",
                  color: "var(--text-secondary)",
                  marginTop: "3px",
                }}
              >
                <span>10%</span>
                <span>45%</span>
                <span>80%</span>
              </div>
              <div
                style={{
                  fontSize: "11px",
                  color: "var(--text-secondary)",
                  marginTop: "6px",
                  lineHeight: 1.35,
                }}
              >
                Guarantees dedicated capital allocation to vulnerable tracts (SVI &ge; 0.60).
              </div>
            </div>
          </div>

          {/* Panel 2: Objective Weights */}
          <div className="card">
            <div className="card-header">
              <div className="card-title-group">
                <Scale size={18} color="var(--forest-green)" />
                <div>
                  <div className="card-title">Objective Weights</div>
                  <div className="card-subtitle">Multi-objective preference vector</div>
                </div>
              </div>
              <span className="badge badge-neutral">Normalized</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <div className="form-label-row">
                  <span>Heat Island Mitigation</span>
                  <span className="tabular-nums" style={{ fontWeight: 700 }}>
                    {(heatWeight * 100).toFixed(0)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="0.8"
                  step="0.05"
                  value={heatWeight}
                  onChange={(e) => setHeatWeight(parseFloat(e.target.value))}
                  className="eco-slider"
                  aria-label="Heat Island Mitigation Weight"
                />
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "10.5px",
                    color: "var(--text-secondary)",
                  }}
                >
                  <span>0%</span>
                  <span>40%</span>
                  <span>80%</span>
                </div>
                <div
                  style={{
                    fontSize: "11px",
                    color: "var(--text-secondary)",
                    marginTop: "4px",
                    lineHeight: 1.35,
                  }}
                >
                  Prioritizes high canopy shade and reflective cooling in dense heat islands.
                </div>
              </div>

              <div>
                <div className="form-label-row">
                  <span>Stormwater Absorption</span>
                  <span className="tabular-nums" style={{ fontWeight: 700 }}>
                    {(floodWeight * 100).toFixed(0)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="0.8"
                  step="0.05"
                  value={floodWeight}
                  onChange={(e) => setFloodWeight(parseFloat(e.target.value))}
                  className="eco-slider"
                  aria-label="Stormwater Runoff Absorption Weight"
                />
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "10.5px",
                    color: "var(--text-secondary)",
                  }}
                >
                  <span>0%</span>
                  <span>40%</span>
                  <span>80%</span>
                </div>
                <div
                  style={{
                    fontSize: "11px",
                    color: "var(--text-secondary)",
                    marginTop: "4px",
                    lineHeight: 1.35,
                  }}
                >
                  Prioritizes bio-retention swales and permeable surfaces in flood plains.
                </div>
              </div>

              <div>
                <div className="form-label-row">
                  <span>Water Resource Buffer</span>
                  <span className="tabular-nums" style={{ fontWeight: 700 }}>
                    {(waterWeight * 100).toFixed(0)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="0.8"
                  step="0.05"
                  value={waterWeight}
                  onChange={(e) => setWaterWeight(parseFloat(e.target.value))}
                  className="eco-slider"
                  aria-label="Water Resource Buffer Weight"
                />
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "10.5px",
                    color: "var(--text-secondary)",
                  }}
                >
                  <span>0%</span>
                  <span>40%</span>
                  <span>80%</span>
                </div>
                <div
                  style={{
                    fontSize: "11px",
                    color: "var(--text-secondary)",
                    marginTop: "4px",
                    lineHeight: 1.35,
                  }}
                >
                  Disincentivizes excessive irrigation; credits rainwater harvesting.
                </div>
              </div>

              <div>
                <div className="form-label-row">
                  <span>Spatial Equity Priority</span>
                  <span className="tabular-nums" style={{ fontWeight: 700 }}>
                    {(equityWeight * 100).toFixed(0)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="0.8"
                  step="0.05"
                  value={equityWeight}
                  onChange={(e) => setEquityWeight(parseFloat(e.target.value))}
                  className="eco-slider"
                  aria-label="Spatial Equity Priority Weight"
                />
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "10.5px",
                    color: "var(--text-secondary)",
                  }}
                >
                  <span>0%</span>
                  <span>40%</span>
                  <span>80%</span>
                </div>
                <div
                  style={{
                    fontSize: "11px",
                    color: "var(--text-secondary)",
                    marginTop: "4px",
                    lineHeight: 1.35,
                  }}
                >
                  Channels capital to frontline tracts with historical underinvestment.
                </div>
              </div>
            </div>

            <div style={{ marginTop: "20px" }}>
              <button
                className="btn btn-primary"
                onClick={handleSolve}
                disabled={isLoading}
                style={{ width: "100%", padding: "12px", fontWeight: 700 }}
              >
                {isLoading ? (
                  <>
                    <RefreshCw size={15} className="spin" />
                    <span>Solving SciPy Linear Program...</span>
                  </>
                ) : (
                  <>
                    <Play size={15} fill="currentColor" />
                    <span>Run Optimization Solver</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Portfolio Comparison & Results */}
        <div className="optimisation-results">
          {/* Infeasibility Alert if Solver fails */}
          {result && !result.is_feasible && result.infeasibility_report && (
            <div
              style={{
                background: "var(--risk-severe-bg)",
                border: "1px solid #f3cbc8",
                borderRadius: "var(--radius-card)",
                padding: "20px",
                color: "var(--risk-severe)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontWeight: 800,
                  fontSize: "15px",
                }}
              >
                <AlertTriangle size={18} />
                <span>Optimization Problem Infeasible Under Current Constraints</span>
              </div>
              <p style={{ fontSize: "13px", marginTop: "8px", lineHeight: 1.5 }}>
                {result.infeasibility_report.explanation}
              </p>
              <div style={{ fontSize: "12px", marginTop: "10px", fontWeight: 600 }}>
                Suggested Remedy: {result.infeasibility_report.suggested_remedy}
              </div>
            </div>
          )}

          {/* Section C: Portfolio Comparison */}
          {result && result.is_feasible && (
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-end",
                  marginBottom: "14px",
                  flexWrap: "wrap",
                  gap: "8px",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: "15px",
                      fontWeight: 700,
                      color: "var(--text-primary)",
                      letterSpacing: "-0.2px",
                    }}
                  >
                    Pareto-Alternative Strategic Portfolios
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "2px" }}>
                    Select a portfolio to inspect district-level allocations and AI decision rationale
                  </div>
                </div>
                <span className="badge badge-neutral">
                  Solver: {result.solver_engine} ({result.execution_time_ms} ms)
                </span>
              </div>

              <div className="portfolio-grid">
                {result.alternatives.map((alt) => {
                  const isSelected = activeStrategy === alt.strategy_id;
                  return (
                    <div
                      key={alt.strategy_id}
                      role="button"
                      tabIndex={0}
                      aria-pressed={isSelected}
                      onClick={() => handleSelectStrategy(alt)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleSelectStrategy(alt);
                        }
                      }}
                      className={`portfolio-card ${isSelected ? "selected" : ""}`}
                    >
                      <div>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            gap: "8px",
                            marginBottom: "8px",
                          }}
                        >
                          <span
                            style={{
                              fontWeight: 700,
                              fontSize: "13.5px",
                              color: "var(--text-primary)",
                              lineHeight: 1.3,
                            }}
                          >
                            {alt.strategy_label}
                          </span>
                          {isSelected ? (
                            <span
                              className="badge badge-lime"
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                flexShrink: 0,
                                fontWeight: 700,
                              }}
                            >
                              <CheckCircle2 size={11} /> Selected
                            </span>
                          ) : (
                            <span
                              className="badge badge-neutral"
                              style={{ flexShrink: 0 }}
                            >
                              Alternative
                            </span>
                          )}
                        </div>

                        <div
                          style={{
                            fontSize: "11.5px",
                            color: "var(--text-secondary)",
                            marginBottom: "14px",
                            lineHeight: 1.45,
                          }}
                        >
                          {alt.strategy_rationale}
                        </div>
                      </div>

                      <div
                        style={{
                          borderTop: "1px solid var(--border-subtle)",
                          paddingTop: "12px",
                          display: "flex",
                          flexDirection: "column",
                          gap: "8px",
                          fontSize: "12px",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span style={{ color: "var(--text-secondary)" }}>Capital Cost:</span>
                          <span className="tabular-nums" style={{ fontWeight: 700 }}>
                            {formatCurrency(alt.total_capital_cost)}
                          </span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span style={{ color: "var(--text-secondary)" }}>Annual O&M:</span>
                          <span className="tabular-nums" style={{ fontWeight: 600 }}>
                            ${(alt.total_annual_maintenance / 1000).toFixed(0)}k/yr
                          </span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span style={{ color: "var(--text-secondary)" }}>Frontline Equity:</span>
                          <span
                            className="tabular-nums"
                            style={{ fontWeight: 700, color: "var(--forest-green)" }}
                          >
                            {alt.vulnerable_area_investment_share_pct.toFixed(0)}%
                          </span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span style={{ color: "var(--text-secondary)" }}>Key Benefit:</span>
                          <span className="tabular-nums" style={{ fontWeight: 600 }}>
                            {Math.round(alt.total_stormwater_runoff_diverted_m3).toLocaleString()} m³
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Active Portfolio Results (KPIs, Table, Explainer) */}
          {activePortfolio && (
            <>
              {/* Section D: KPI Summary */}
              <div className="kpi-grid">
                <MetricCard
                  label="Capital Allocated"
                  value={formatCurrency(activePortfolio.total_capital_cost)}
                  subtext={`${activePortfolio.budget_utilization_pct.toFixed(0)}% of $${(budgetCap / 1000000).toFixed(1)}M ceiling`}
                  variant="forest"
                  icon={DollarSign}
                />
                <MetricCard
                  label="Annual O&M"
                  value={`$${(activePortfolio.total_annual_maintenance / 1000).toFixed(0)}k/yr`}
                  subtext="Ongoing municipal stewardship"
                  variant="heat"
                  icon={RefreshCw}
                />
                <MetricCard
                  label="Stormwater Diverted"
                  value={`${Math.round(activePortfolio.total_stormwater_runoff_diverted_m3).toLocaleString()} m³`}
                  subtext="Peak cloudburst retention volume"
                  variant="water"
                  icon={Droplet}
                />
                <MetricCard
                  label="Frontline Equity Share"
                  value={`${activePortfolio.vulnerable_area_investment_share_pct.toFixed(1)}%`}
                  subtext="Dedicated to vulnerable tracts (SVI ≥ 0.60)"
                  variant="primary"
                  icon={ShieldCheck}
                />
              </div>

              {/* Section E: District Deployments Table */}
              <div className="card">
                <div className="card-header">
                  <div>
                    <div className="card-title">
                      District Deployments: {activePortfolio.strategy_label}
                    </div>
                    <div className="card-subtitle">
                      Recommended spatial interventions balancing physical land, costs, and risk reduction
                    </div>
                  </div>
                  <span className="badge badge-neutral">
                    {activePortfolio.allocations.length} Allocations
                  </span>
                </div>

                <div className="deployment-table-container">
                  <table className="eco-table">
                    <thead>
                      <tr>
                        <th>District</th>
                        <th>Recommended Intervention</th>
                        <th className="table-cell-num">Scale</th>
                        <th className="table-cell-num">Capital Cost</th>
                        <th className="table-cell-num">Annual O&M</th>
                        <th className="table-cell-num">Runoff Diverted</th>
                        <th className="table-cell-num">Net Water Demand</th>
                        <th style={{ textAlign: "center" }}>Causal Chain</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activePortfolio.allocations.map((a, idx) => (
                        <tr key={idx}>
                          <td style={{ fontWeight: 600 }}>{a.neighbourhood_name}</td>
                          <td>{a.intervention_name}</td>
                          <td className="table-cell-num">
                            {a.units_allocated.toLocaleString()} {a.unit_label}
                          </td>
                          <td className="table-cell-num">${a.capital_cost.toLocaleString()}</td>
                          <td className="table-cell-num">
                            ${a.annual_maintenance.toLocaleString()}
                          </td>
                          <td className="table-cell-num">
                            {a.estimated_runoff_reduction_m3.toLocaleString()} m³
                          </td>
                          <td className="table-cell-num">
                            <span
                              style={{
                                color:
                                  a.water_demand_impact_m3_year > 0
                                    ? "var(--risk-severe)"
                                    : "var(--risk-moderate)",
                                fontWeight: 500,
                              }}
                            >
                              {a.water_demand_impact_m3_year > 0 ? "+" : ""}
                              {a.water_demand_impact_m3_year.toLocaleString()} m³
                            </span>
                          </td>
                          <td style={{ textAlign: "center" }}>
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() =>
                                onNavigateToConsequences(
                                  a.intervention_id,
                                  a.units_allocated,
                                  a.neighbourhood_id,
                                  activePortfolio.strategy_id
                                )
                              }
                              title="Inspect Causal Downstream Chain"
                            >
                              <GitFork size={12} />
                              <span>Chain</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Section F: Decision Explainer */}
              {explanation && (
                <DecisionExplainer
                  explanation={explanation}
                  onRefresh={() =>
                    generateExplanation(
                      activePortfolio,
                      result?.dataset_name || "Active City"
                    )
                  }
                  isLoading={isExplaining}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
