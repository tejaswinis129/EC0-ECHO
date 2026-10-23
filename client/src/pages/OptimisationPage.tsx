import React, { useState, useEffect } from "react";
import {
  OptimisationRequest,
  OptimisationResult,
  AlternativePortfolio,
  DecisionExplanation,
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
  TrendingDown,
  Droplet,
  ShieldCheck,
} from "lucide-react";

interface OptimisationPageProps {
  activeDatasetId: string;
  onNavigateToConsequences: (interventionId: string, units: number, neighbourhoodId?: string, strategy?: string) => void;
}

export const OptimisationPage: React.FC<OptimisationPageProps> = ({
  activeDatasetId,
  onNavigateToConsequences,
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

      const selPort = res.alternatives.find((a) => a.strategy_id === initialStrategy) || res.alternatives[0];
      if (selPort) {
        generateExplanation(selPort, res.dataset_name);
      }
    } catch (err: any) {
      console.error("Optimisation error", err);
    } finally {
      setIsLoading(false);
    }
  };

  const generateExplanation = async (portfolio: AlternativePortfolio, datasetName: string) => {
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

  const activePortfolio =
    result?.alternatives.find((a) => a.strategy_id === activeStrategy) || result?.alternatives[0];

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-text">
          <h1>Multi-Objective Optimisation Studio</h1>
          <p>
            Constraint-aware decision engine powered by SciPy HiGHS mixed-integer and linear programming.
            Balances capital budget ceilings, spatial density caps, and frontline equity requirements.
          </p>
        </div>
      </div>

      {/* 2-Column Desktop Decision Workspace */}
      <div className="grid-split-1-2" style={{ alignItems: "start" }}>
        {/* Left Column: Constraints, Objectives & Controls */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Budget & Equity Constraints */}
          <div className="card">
            <div className="card-header">
              <div className="card-title-group">
                <Sliders size={18} color="var(--forest-green)" />
                <div className="card-title">Constraints & Parameters</div>
              </div>
            </div>

            <div className="form-group">
              <div className="form-label-row">
                <span>Capital Budget Ceiling</span>
                <span className="tabular-nums" style={{ fontWeight: 800, color: "var(--forest-green)" }}>
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
              />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--text-secondary)", marginTop: "4px" }}>
                <span>$0.5M</span>
                <span>$5.0M</span>
                <span>$10.0M</span>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <div className="form-label-row">
                <span>Min Frontline Equity Share</span>
                <span className="tabular-nums" style={{ fontWeight: 800, color: "var(--forest-green)" }}>
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
              />
              <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "4px" }}>
                Guarantees capital dedication to vulnerable districts (SVI &ge; 0.60).
              </div>
            </div>
          </div>

          {/* Objective Priorities Weighting */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">Objective Weights</div>
              <span className="badge badge-neutral">Normalized</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <div className="form-label-row">
                  <span>Heat Island Mitigation</span>
                  <span className="tabular-nums">{(heatWeight * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="0.8"
                  step="0.05"
                  value={heatWeight}
                  onChange={(e) => setHeatWeight(parseFloat(e.target.value))}
                  className="eco-slider"
                />
              </div>

              <div>
                <div className="form-label-row">
                  <span>Stormwater Runoff Absorption</span>
                  <span className="tabular-nums">{(floodWeight * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="0.8"
                  step="0.05"
                  value={floodWeight}
                  onChange={(e) => setFloodWeight(parseFloat(e.target.value))}
                  className="eco-slider"
                />
              </div>

              <div>
                <div className="form-label-row">
                  <span>Water Resource Buffer</span>
                  <span className="tabular-nums">{(waterWeight * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="0.8"
                  step="0.05"
                  value={waterWeight}
                  onChange={(e) => setWaterWeight(parseFloat(e.target.value))}
                  className="eco-slider"
                />
              </div>

              <div>
                <div className="form-label-row">
                  <span>Spatial Equity Priority</span>
                  <span className="tabular-nums">{(equityWeight * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="0.8"
                  step="0.05"
                  value={equityWeight}
                  onChange={(e) => setEquityWeight(parseFloat(e.target.value))}
                  className="eco-slider"
                />
              </div>
            </div>

            <div style={{ marginTop: "24px" }}>
              <button
                className="btn btn-primary"
                onClick={handleSolve}
                disabled={isLoading}
                style={{ width: "100%", padding: "12px" }}
              >
                <Play size={16} fill="currentColor" />
                <span>{isLoading ? "Solving SciPy Linear Program..." : "Run Optimization Solver"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Optimisation Results & Portfolio Comparison */}
        <div>
          {/* Infeasibility Alert if Solver fails */}
          {result && !result.is_feasible && result.infeasibility_report && (
            <div
              style={{
                background: "var(--risk-severe-bg)",
                border: "1px solid #f3cbc8",
                borderRadius: "var(--radius-card)",
                padding: "20px",
                marginBottom: "20px",
                color: "var(--risk-severe)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 800, fontSize: "15px" }}>
                <AlertTriangle size={18} />
                <span>Optimization Problem Infeasible Under Current Constraints</span>
              </div>
              <p style={{ fontSize: "13px", marginTop: "8px", lineHeight: 1.5 }}>
                {result.infeasibility_report.explanation}
              </p>
              <div style={{ fontSize: "12px", marginTop: "10px", fontWeight: 600 }}>
                Remedy: {result.infeasibility_report.suggested_remedy}
              </div>
            </div>
          )}

          {/* Strategy Alternative Selector Cards */}
          {result && result.is_feasible && (
            <div style={{ marginBottom: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)" }}>
                  Pareto-Alternative Strategic Portfolios
                </div>
                <span className="badge badge-neutral">
                  Solver: {result.solver_engine} ({result.execution_time_ms} ms)
                </span>
              </div>

              <div className="grid-cols-3" style={{ marginBottom: 0 }}>
                {result.alternatives.map((alt) => {
                  const isSelected = activeStrategy === alt.strategy_id;
                  return (
                    <div
                      key={alt.strategy_id}
                      onClick={() => {
                        setActiveStrategy(alt.strategy_id);
                        generateExplanation(alt, result.dataset_name);
                      }}
                      style={{
                        backgroundColor: isSelected ? "var(--warm-ivory)" : "var(--white)",
                        border: `1px solid ${isSelected ? "var(--forest-green)" : "var(--border-subtle)"}`,
                        borderRadius: "var(--radius-card)",
                        padding: "16px 18px",
                        cursor: "pointer",
                        transition: "all var(--transition-fast)",
                        boxShadow: isSelected ? "var(--shadow-subtle)" : "none",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                        <span style={{ fontWeight: 700, fontSize: "13.5px", color: "var(--text-primary)" }}>
                          {alt.strategy_label}
                        </span>
                        {isSelected && <span className="badge badge-lime">Selected</span>}
                      </div>

                      <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginBottom: "12px", lineHeight: 1.4 }}>
                        {alt.strategy_rationale}
                      </div>

                      <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: "10px", display: "flex", flexDirection: "column", gap: "6px", fontSize: "11.5px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span style={{ color: "var(--text-secondary)" }}>Capital:</span>
                          <span className="tabular-nums" style={{ fontWeight: 700 }}>${(alt.total_capital_cost / 1000).toFixed(0)}k</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span style={{ color: "var(--text-secondary)" }}>O&M / yr:</span>
                          <span className="tabular-nums" style={{ fontWeight: 600 }}>${(alt.total_annual_maintenance / 1000).toFixed(0)}k</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span style={{ color: "var(--text-secondary)" }}>Frontline Equity:</span>
                          <span className="tabular-nums" style={{ fontWeight: 700, color: "var(--forest-green)" }}>
                            {alt.vulnerable_area_investment_share_pct.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Active Portfolio KPI Highlights */}
          {activePortfolio && (
            <>
              <div className="grid-cols-4" style={{ marginBottom: "24px" }}>
                <MetricCard
                  label="Capital Allocated"
                  value={`$${(activePortfolio.total_capital_cost / 1000).toFixed(0)}k`}
                  subtext={`${activePortfolio.budget_utilization_pct}% of budget ceiling`}
                  variant="forest"
                />
                <MetricCard
                  label="Annual O&M"
                  value={`$${(activePortfolio.total_annual_maintenance / 1000).toFixed(0)}k/yr`}
                  subtext="Ongoing stewardship cost"
                  variant="heat"
                />
                <MetricCard
                  label="Stormwater Diverted"
                  value={`${activePortfolio.total_stormwater_runoff_diverted_m3.toLocaleString()} m³`}
                  subtext="Peak cloudburst capacity"
                  variant="water"
                />
                <MetricCard
                  label="Equity Share"
                  value={`${activePortfolio.vulnerable_area_investment_share_pct.toFixed(1)}%`}
                  subtext="Dedicated to frontline districts"
                  variant="primary"
                />
              </div>

              {/* Allocations Table */}
              <div className="card" style={{ marginBottom: "24px" }}>
                <div className="card-header">
                  <div className="card-title">
                    <span>District Deployments: {activePortfolio.strategy_label}</span>
                  </div>
                  <span className="badge badge-neutral">{activePortfolio.allocations.length} Allocations</span>
                </div>

                <div className="table-wrapper">
                  <table className="eco-table">
                    <thead>
                      <tr>
                        <th>District</th>
                        <th>Recommended Intervention</th>
                        <th>Scale</th>
                        <th>Capital Cost</th>
                        <th>Annual O&M</th>
                        <th>Runoff Diverted</th>
                        <th>Net Water</th>
                        <th>Action</th>
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
                          <td className="table-cell-num">${a.annual_maintenance.toLocaleString()}</td>
                          <td className="table-cell-num">{a.estimated_runoff_reduction_m3.toLocaleString()} m³</td>
                          <td className="table-cell-num">
                            <span
                              style={{
                                color: a.water_demand_impact_m3_year > 0 ? "var(--risk-severe)" : "var(--risk-moderate)",
                              }}
                            >
                              {a.water_demand_impact_m3_year > 0 ? "+" : ""}
                              {a.water_demand_impact_m3_year.toLocaleString()} m³
                            </span>
                          </td>
                          <td>
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

              {/* Decision Explainer */}
              {explanation && (
                <DecisionExplainer
                  explanation={explanation}
                  onRefresh={() => generateExplanation(activePortfolio, result?.dataset_name || "Active City")}
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
