import React, { useState } from "react";
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
  Droplet,
  ShieldAlert,
  Play,
  GitFork,
  CheckCircle2,
  AlertTriangle,
  Scale,
  Sparkles,
} from "lucide-react";

interface OptimisationPageProps {
  activeDatasetId: string;
  onNavigateToConsequences: (interventionId: string, units: number, neighbourhoodId?: string, strategy?: string) => void;
  onSaveRecord?: (portfolio: AlternativePortfolio) => void;
}

export const OptimisationPage: React.FC<OptimisationPageProps> = ({
  activeDatasetId,
  onNavigateToConsequences,
  onSaveRecord,
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
      setActiveStrategy(res.selected_strategy || "balanced");

      // Auto generate explanation for balanced strategy
      const selPort = res.alternatives.find((a) => a.strategy_id === res.selected_strategy) || res.alternatives[0];
      if (selPort) {
        generateExplanation(selPort, res.dataset_name);
      }
    } catch (err: any) {
      alert(`Optimisation error: ${err.message}`);
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

  const activePortfolio = result?.alternatives.find((a) => a.strategy_id === activeStrategy) || result?.alternatives[0];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Multi-Objective Optimisation Studio</h1>
          <p className="page-description">
            Mathematical decision engine powered by SciPy HiGHS simplex and interior-point linear programming.
            Calculates constraint-aware Pareto optimal allocations for urban heat, flooding, water, and equity.
          </p>
        </div>
      </div>

      {/* Constraints & Controls Studio */}
      <div className="card" style={{ marginBottom: "24px" }}>
        <div className="card-header">
          <div className="card-title">
            <Sliders size={18} color="var(--primary-700)" />
            <span>Budget & Resource Constraints</span>
          </div>
        </div>

        <div className="grid-2">
          <div>
            <div className="form-group">
              <div className="form-label" style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Total Capital Budget Ceiling</span>
                <span style={{ fontWeight: 800, color: "var(--primary-800)" }}>
                  ${budgetCap.toLocaleString()} USD
                </span>
              </div>
              <input
                type="range"
                min="500000"
                max="10000000"
                step="250000"
                value={budgetCap}
                onChange={(e) => setBudgetCap(parseInt(e.target.value))}
                className="range-slider"
                style={{ width: "100%" }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--slate-400)", marginTop: "4px" }}>
                <span>$500,000</span>
                <span>$5,000,000</span>
                <span>$10,000,000</span>
              </div>
            </div>

            <div className="form-group">
              <div className="form-label" style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Minimum Equity Investment Share (SVI &ge; 0.60)</span>
                <span style={{ fontWeight: 800, color: "var(--slate-800)" }}>
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
                className="range-slider"
                style={{ width: "100%" }}
              />
              <div style={{ fontSize: "11px", color: "var(--slate-500)", marginTop: "4px" }}>
                Guarantees that at least {(minEquityShare * 100).toFixed(0)}% of total capital is dedicated to historically disadvantaged frontline districts.
              </div>
            </div>
          </div>

          <div>
            <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--slate-800)", marginBottom: "12px" }}>
              Objective Priorities Weighting
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <div>
                <div style={{ fontSize: "11px", color: "var(--slate-600)", fontWeight: 600 }}>Heat Reduction</div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={heatWeight}
                  onChange={(e) => setHeatWeight(parseFloat(e.target.value))}
                  className="range-slider"
                  style={{ width: "100%" }}
                />
              </div>
              <div>
                <div style={{ fontSize: "11px", color: "var(--slate-600)", fontWeight: 600 }}>Stormwater Runoff</div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={floodWeight}
                  onChange={(e) => setFloodWeight(parseFloat(e.target.value))}
                  className="range-slider"
                  style={{ width: "100%" }}
                />
              </div>
              <div>
                <div style={{ fontSize: "11px", color: "var(--slate-600)", fontWeight: 600 }}>Water Resilience</div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={waterWeight}
                  onChange={(e) => setWaterWeight(parseFloat(e.target.value))}
                  className="range-slider"
                  style={{ width: "100%" }}
                />
              </div>
              <div>
                <div style={{ fontSize: "11px", color: "var(--slate-600)", fontWeight: 600 }}>Frontline Equity</div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={equityWeight}
                  onChange={(e) => setEquityWeight(parseFloat(e.target.value))}
                  className="range-slider"
                  style={{ width: "100%" }}
                />
              </div>
            </div>

            <div style={{ marginTop: "24px" }}>
              <button className="btn btn-primary" onClick={handleSolve} disabled={isLoading} style={{ width: "100%", padding: "12px" }}>
                <Play size={16} fill="currentColor" />
                <span>{isLoading ? "Solving Linear Program..." : "Compute Optimal Intervention Portfolios"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Infeasibility Report Alert */}
      {result && !result.is_feasible && result.infeasibility_report && (
        <div
          style={{
            background: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: "var(--radius-lg)",
            padding: "24px",
            marginBottom: "24px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#991b1b", fontWeight: 800, fontSize: "16px" }}>
            <AlertTriangle size={20} />
            <span>Optimization Infeasible</span>
          </div>
          <div style={{ fontSize: "13px", color: "#7f1d1d", marginTop: "8px", lineHeight: 1.6 }}>
            {result.infeasibility_report.explanation}
          </div>
          <div style={{ fontSize: "12px", color: "#991b1b", marginTop: "12px" }}>
            <strong>Suggested Remedy:</strong> {result.infeasibility_report.suggested_remedy}
          </div>
        </div>
      )}

      {/* Results Section */}
      {result && result.is_feasible && activePortfolio && (
        <div>
          {/* Strategy Tabs */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
            <div style={{ display: "flex", gap: "8px" }}>
              {result.alternatives.map((alt) => (
                <button
                  key={alt.strategy_id}
                  onClick={() => {
                    setActiveStrategy(alt.strategy_id);
                    generateExplanation(alt, result.dataset_name);
                  }}
                  className={`btn ${activeStrategy === alt.strategy_id ? "btn-primary" : "btn-secondary"}`}
                >
                  <Scale size={14} />
                  <span>{alt.strategy_label}</span>
                </button>
              ))}
            </div>

            <span className="badge badge-slate" style={{ fontSize: "12px" }}>
              Solver: {result.solver_engine} ({result.execution_time_ms} ms)
            </span>
          </div>

          {/* Strategy Rationale */}
          <div
            style={{
              background: "var(--white)",
              border: "1px solid var(--slate-200)",
              borderRadius: "var(--radius-md)",
              padding: "16px 20px",
              marginBottom: "20px",
              fontSize: "13px",
              color: "var(--slate-700)",
              lineHeight: 1.6,
            }}
          >
            <strong>Strategy Rationale:</strong> {activePortfolio.strategy_rationale}
          </div>

          {/* KPI Stat Cards */}
          <div className="kpi-grid">
            <MetricCard
              label="Capital Allocated"
              value={`$${activePortfolio.total_capital_cost.toLocaleString()}`}
              subtext={`${activePortfolio.budget_utilization_pct}% of budget cap used`}
              variant="primary"
            />
            <MetricCard
              label="Annual Maintenance"
              value={`$${activePortfolio.total_annual_maintenance.toLocaleString()}/yr`}
              subtext="Ongoing Operational Stewardship"
              variant="amber"
            />
            <MetricCard
              label="Stormwater Diverted"
              value={`${activePortfolio.total_stormwater_runoff_diverted_m3.toLocaleString()} m³`}
              subtext="Peak Runoff Absorbed / Retained"
              variant="sky"
            />
            <MetricCard
              label="Equity Score"
              value={`${activePortfolio.equity_score.toFixed(1)} / 100`}
              subtext={`${activePortfolio.vulnerable_area_investment_share_pct.toFixed(1)}% to Frontline SVI districts`}
              variant="primary"
            />
          </div>

          {/* Detailed Allocations Table */}
          <div className="card" style={{ marginBottom: "24px" }}>
            <div className="card-header">
              <div className="card-title">
                <span>Intervention Deployments: {activePortfolio.strategy_label}</span>
                <span className="badge badge-slate">{activePortfolio.allocations.length} allocations</span>
              </div>
            </div>

            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>District</th>
                    <th>Recommended Intervention</th>
                    <th>Scale Deployed</th>
                    <th>Capital Cost</th>
                    <th>Annual O&M</th>
                    <th>Runoff Diverted</th>
                    <th>Net Water Impact</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {activePortfolio.allocations.map((a, idx) => (
                    <tr key={idx}>
                      <td>
                        <strong>{a.neighbourhood_name}</strong>
                      </td>
                      <td>{a.intervention_name}</td>
                      <td>
                        {a.units_allocated.toLocaleString()} {a.unit_label}
                      </td>
                      <td>${a.capital_cost.toLocaleString()}</td>
                      <td>${a.annual_maintenance.toLocaleString()}</td>
                      <td>{a.estimated_runoff_reduction_m3.toLocaleString()} m³</td>
                      <td>
                        <span style={{ color: a.water_demand_impact_m3_year > 0 ? "var(--rose-600)" : "var(--primary-700)" }}>
                          {a.water_demand_impact_m3_year > 0 ? "+" : ""}
                          {a.water_demand_impact_m3_year.toLocaleString()} m³
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: "11px", padding: "4px 8px" }}
                          onClick={() =>
                            onNavigateToConsequences(
                              a.intervention_id,
                              a.units_allocated,
                              a.neighbourhood_id,
                              activePortfolio.strategy_id
                            )
                          }
                          title="Inspect in Consequence Chain"
                        >
                          <GitFork size={12} />
                          <span>Inspect Chain</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* AI Decision Explanation */}
          {explanation && (
            <div style={{ marginBottom: "24px" }}>
              <DecisionExplainer
                explanation={explanation}
                onRefresh={() => generateExplanation(activePortfolio, result.dataset_name)}
                isLoading={isExplaining}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
