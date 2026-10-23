import React, { useState, useEffect } from "react";
import { ScenarioParams, ScenarioSimulationResult } from "../types";
import { api } from "../api/client";
import { MetricCard } from "../components/MetricCard";
import {
  CloudRain,
  Sun,
  DollarSign,
  Zap,
  Sliders,
  Play,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";

interface ScenarioLabPageProps {
  activeDatasetId: string;
}

export const ScenarioLabPage: React.FC<ScenarioLabPageProps> = ({ activeDatasetId }) => {
  const [selectedScenarioType, setSelectedScenarioType] = useState<
    "drought" | "extreme_rainfall" | "budget_cut" | "combined_shock" | "custom"
  >("drought");

  const [waterChange, setWaterChange] = useState<number>(-50);
  const [rainSurge, setRainSurge] = useState<number>(45);
  const [budgetCvt, setBudgetCvt] = useState<number>(35);
  const [tempAnomaly, setTempAnomaly] = useState<number>(2.0);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [simulationResult, setSimulationResult] = useState<ScenarioSimulationResult | null>(null);

  const scenarioPresets = {
    drought: {
      title: "Severe Prolonged Drought",
      icon: Sun,
      color: "var(--risk-elevated)",
      summary: "-50% utility water availability & +2.2°C summer heat anomaly.",
      detail: "Evaluates tree mortality, limits high-water plantings, and prioritises rainwater cisterns.",
    },
    extreme_rainfall: {
      title: "100-Year Cloudburst Storm",
      icon: CloudRain,
      color: "var(--info-blue)",
      summary: "+45% peak storm precipitation runoff surge.",
      detail: "Tests storm sewer surcharge thresholds and scales permeable pavement & bioswales.",
    },
    budget_cut: {
      title: "Fiscal Austerity Shock",
      icon: DollarSign,
      color: "var(--risk-severe)",
      summary: "-35% capital budget reduction.",
      detail: "De-scopes high-capex assets while maintaining frontline vulnerable community protections.",
    },
    combined_shock: {
      title: "Combined Climate Shock",
      icon: Zap,
      color: "var(--forest-green)",
      summary: "Compound dry stress (-40%), flood surge (+35%), & budget cut (-25%).",
      detail: "Stress-tests dual environmental extremes alongside municipal fiscal pressure.",
    },
    custom: {
      title: "Custom Scenario Parameters",
      icon: Sliders,
      color: "var(--forest-green)",
      summary: "Tailored multi-hazard climate shock configuration.",
      detail: "Adjust individual sliders for drought deficit, rainfall surge, budget, and heat.",
    },
  };

  useEffect(() => {
    if (activeDatasetId) {
      runSimulation("drought");
    }
  }, [activeDatasetId]);

  const runSimulation = async (stype = selectedScenarioType) => {
    setIsLoading(true);
    try {
      const params: ScenarioParams = {
        scenario_type: stype,
        water_supply_change_pct: stype === "drought" ? -50 : stype === "combined_shock" ? -40 : stype === "custom" ? waterChange : 0,
        extreme_rainfall_surge_pct: stype === "extreme_rainfall" ? 45 : stype === "combined_shock" ? 35 : stype === "custom" ? rainSurge : 0,
        budget_cut_pct: stype === "budget_cut" ? 35 : stype === "combined_shock" ? 25 : stype === "custom" ? budgetCvt : 0,
        temperature_anomaly_c: stype === "drought" ? 2.2 : stype === "custom" ? tempAnomaly : 0,
        base_optimisation_request: {
          dataset_id: activeDatasetId,
          total_budget_cap: 2500000,
          min_equity_investment_share: 0.30,
        },
      };

      const res = await api.simulateScenario(params);
      setSimulationResult(res);
    } catch (err: any) {
      console.error("Simulation error", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-text">
          <h1>Climate Scenario Stress Simulator</h1>
          <p>
            Stress-test urban sustainability allocations under extreme meteorological shocks and fiscal contractions.
            Dynamically executes mathematical re-optimisation against baseline allocations.
          </p>
        </div>
      </div>

      {/* Scenario Selection Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        {Object.entries(scenarioPresets).map(([key, item]) => {
          const isSelected = selectedScenarioType === key;
          const Icon = item.icon;
          return (
            <div
              key={key}
              onClick={() => {
                setSelectedScenarioType(key as any);
                if (key !== "custom") {
                  runSimulation(key as any);
                }
              }}
              style={{
                backgroundColor: isSelected ? "var(--warm-ivory)" : "var(--white)",
                border: `1px solid ${isSelected ? "var(--forest-green)" : "var(--border-subtle)"}`,
                borderRadius: "var(--radius-card)",
                padding: "16px 18px",
                cursor: "pointer",
                transition: "all var(--transition-fast)",
                boxShadow: isSelected ? "var(--shadow-subtle)" : "none",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div
                      style={{
                        padding: "6px",
                        borderRadius: "var(--radius-button)",
                        background: isSelected ? "var(--forest-green)" : "var(--warm-ivory)",
                        color: isSelected ? "#FFFFFF" : item.color,
                      }}
                    >
                      <Icon size={16} />
                    </div>
                    <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)" }}>
                      {item.title}
                    </span>
                  </div>
                  {isSelected && <span className="badge badge-lime">Active</span>}
                </div>

                <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "4px" }}>
                  {item.summary}
                </div>
                <div style={{ fontSize: "11.5px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                  {item.detail}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Custom Scenario Sliders Panel */}
      {selectedScenarioType === "custom" && (
        <div className="card" style={{ marginBottom: "24px" }}>
          <div className="card-header">
            <div className="card-title">Custom Scenario Boundary Controls</div>
            <span className="badge badge-neutral">User-Defined Shock</span>
          </div>

          <div className="grid-cols-4" style={{ marginBottom: "16px" }}>
            <div>
              <div className="form-label-row">
                <span>Water Supply Deficit</span>
                <span className="tabular-nums">{waterChange}%</span>
              </div>
              <input
                type="range"
                min="-70"
                max="30"
                step="5"
                value={waterChange}
                onChange={(e) => setWaterChange(parseInt(e.target.value))}
                className="eco-slider"
              />
            </div>

            <div>
              <div className="form-label-row">
                <span>Rainfall Runoff Surge</span>
                <span className="tabular-nums">+{rainSurge}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="80"
                step="5"
                value={rainSurge}
                onChange={(e) => setRainSurge(parseInt(e.target.value))}
                className="eco-slider"
              />
            </div>

            <div>
              <div className="form-label-row">
                <span>Budget Cut Shock</span>
                <span className="tabular-nums">{budgetCvt}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="70"
                step="5"
                value={budgetCvt}
                onChange={(e) => setBudgetCvt(parseInt(e.target.value))}
                className="eco-slider"
              />
            </div>

            <div>
              <div className="form-label-row">
                <span>Heat Anomaly</span>
                <span className="tabular-nums">+{tempAnomaly}°C</span>
              </div>
              <input
                type="range"
                min="0"
                max="6"
                step="0.5"
                value={tempAnomaly}
                onChange={(e) => setTempAnomaly(parseFloat(e.target.value))}
                className="eco-slider"
              />
            </div>
          </div>

          <button className="btn btn-primary" onClick={() => runSimulation("custom")} disabled={isLoading}>
            <Play size={14} fill="currentColor" />
            <span>{isLoading ? "Simulating..." : "Run Custom Climate Simulation"}</span>
          </button>
        </div>
      )}

      {/* Simulation Results & Deltas */}
      {simulationResult ? (
        <div>
          {/* Narrative Summary Card */}
          <div className="card" style={{ marginBottom: "24px", borderLeft: "4px solid var(--forest-green)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
              <div>
                <span className="badge badge-neutral" style={{ marginBottom: "6px" }}>
                  Simulation Outcome
                </span>
                <h2 style={{ fontSize: "18px", fontWeight: 800, color: "var(--text-primary)" }}>
                  {simulationResult.scenario_name}
                </h2>
              </div>
              <span className="badge badge-green">
                Model Confidence: {simulationResult.uncertainty_level}
              </span>
            </div>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.6 }}>
              {simulationResult.scenario_narrative}
            </p>
          </div>

          {/* Baseline vs Scenario Deltas Grid */}
          <div className="grid-cols-4">
            <MetricCard
              label="Capital Budget Shift"
              value={`$${(simulationResult.scenario_portfolio.total_capital_cost / 1000).toFixed(0)}k`}
              subtext={`Delta: ${simulationResult.deltas.capital_cost_difference >= 0 ? "+" : ""}$${(simulationResult.deltas.capital_cost_difference / 1000).toFixed(0)}k`}
              variant="heat"
            />
            <MetricCard
              label="Stormwater Retention"
              value={`${simulationResult.scenario_portfolio.total_stormwater_runoff_diverted_m3.toLocaleString()} m³`}
              subtext={`Delta: ${simulationResult.deltas.runoff_reduction_difference_m3 >= 0 ? "+" : ""}${simulationResult.deltas.runoff_reduction_difference_m3.toLocaleString()} m³`}
              variant="water"
            />
            <MetricCard
              label="Net Water Impact"
              value={`${simulationResult.scenario_portfolio.net_annual_water_impact_m3.toLocaleString()} m³`}
              subtext={`Delta: ${simulationResult.deltas.water_impact_difference_m3 >= 0 ? "+" : ""}${simulationResult.deltas.water_impact_difference_m3.toLocaleString()} m³/yr`}
              variant="primary"
            />
            <MetricCard
              label="Frontline Equity Score"
              value={`${simulationResult.scenario_portfolio.equity_score.toFixed(1)} / 100`}
              subtext={`Delta: ${simulationResult.deltas.equity_score_difference >= 0 ? "+" : ""}${simulationResult.deltas.equity_score_difference.toFixed(1)} pts`}
              variant="forest"
            />
          </div>

          {/* Asset Pivot & Recommended Mitigations */}
          <div className="grid-cols-2">
            <div className="card">
              <div className="card-header">
                <div className="card-title">Intervention Rebalancing Shifts</div>
                <span className="badge badge-neutral">Portfolio Deltas</span>
              </div>

              {simulationResult.deltas.abandoned_or_reduced_interventions.length > 0 && (
                <div style={{ marginBottom: "14px" }}>
                  <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--risk-severe)", marginBottom: "6px" }}>
                    DE-SCOPED OR CONTRACTED ASSETS:
                  </div>
                  <ul style={{ paddingLeft: "18px", fontSize: "12.5px", color: "var(--text-secondary)", lineHeight: 1.6 }}>
                    {simulationResult.deltas.abandoned_or_reduced_interventions.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {simulationResult.deltas.newly_prioritised_interventions.length > 0 && (
                <div>
                  <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--forest-green)", marginBottom: "6px" }}>
                    SCALED UP FOR RESILIENCE:
                  </div>
                  <ul style={{ paddingLeft: "18px", fontSize: "12.5px", color: "var(--text-secondary)", lineHeight: 1.6 }}>
                    {simulationResult.deltas.newly_prioritised_interventions.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {simulationResult.deltas.abandoned_or_reduced_interventions.length === 0 &&
                simulationResult.deltas.newly_prioritised_interventions.length === 0 && (
                  <div style={{ fontSize: "12.5px", color: "var(--text-secondary)" }}>
                    Portfolio remained stable under tested bounds with minor internal geographic re-balancing.
                  </div>
                )}
            </div>

            <div className="card">
              <div className="card-header">
                <div className="card-title-group">
                  <ShieldCheck size={18} color="var(--forest-green)" />
                  <div className="card-title">Recommended Climate Shock Mitigations</div>
                </div>
              </div>
              <ul style={{ paddingLeft: "18px", fontSize: "12.5px", color: "var(--text-secondary)", lineHeight: 1.7 }}>
                {simulationResult.recommended_mitigations.map((m, idx) => (
                  <li key={idx} style={{ marginBottom: "8px" }}>
                    {m}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ) : (
        <div className="card" style={{ padding: "60px 20px", textAlign: "center", color: "var(--text-secondary)" }}>
          <RefreshCw size={24} style={{ margin: "0 auto 12px auto", animation: "spin 1s linear infinite" }} />
          <div>Computing scenario simulation...</div>
        </div>
      )}
    </div>
  );
};
