import React, { useState } from "react";
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
  ArrowRight,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
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

  const scenarioDescriptions = {
    drought: {
      title: "Severe Prolonged Drought",
      icon: Sun,
      color: "var(--amber-600)",
      desc: "Simulates a 50% collapse in municipal utility water availability and a +2.2°C summer heat anomaly. Evaluates tree mortality risks and promotes modular rainwater retention.",
    },
    extreme_rainfall: {
      title: "100-Year Cloudburst & Inundation",
      icon: CloudRain,
      color: "var(--sky-600)",
      desc: "Simulates a +45% surge in peak storm precipitation runoff, testing sewer surcharge limits and triggering drainage bioswales and permeable pavement capacity.",
    },
    budget_cut: {
      title: "Sudden Fiscal Austerity (-35% Budget Cut)",
      icon: DollarSign,
      color: "var(--rose-600)",
      desc: "Simulates an abrupt 35% capital reduction. Traces which interventions the linear optimizer de-scopes while protecting frontline vulnerable communities.",
    },
    combined_shock: {
      title: "Compounding Climate Shock",
      icon: Zap,
      color: "#7c3aed",
      desc: "Simulates compound hazards: dry-season water stress (-40%), cloudburst surges (+35%), and a simultaneous 25% fiscal budget contraction.",
    },
    custom: {
      title: "Custom Scenario Parameters",
      icon: Sliders,
      color: "var(--primary-700)",
      desc: "Configure individual sliders for precipitation surges, drought supply deficits, and budget shocks to evaluate custom urban stress tests.",
    },
  };

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
      alert(`Simulation error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Climate Scenario Simulator</h1>
          <p className="page-description">
            Stress-test urban sustainability recommendations under changing climate conditions. Recalculates the mathematical optimization model dynamically.
          </p>
        </div>
      </div>

      {/* Scenario Selection Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        {Object.entries(scenarioDescriptions).map(([key, item]) => {
          const isSelected = selectedScenarioType === key;
          const Icon = item.icon;
          return (
            <div
              key={key}
              onClick={() => {
                setSelectedScenarioType(key as any);
                runSimulation(key as any);
              }}
              style={{
                background: isSelected ? "var(--white)" : "var(--white)",
                border: isSelected ? `2.5px solid ${item.color}` : "1px solid var(--slate-200)",
                borderRadius: "var(--radius-md)",
                padding: "18px",
                cursor: "pointer",
                boxShadow: isSelected ? "var(--shadow-md)" : "var(--shadow-sm)",
                transition: "all 0.15s ease",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                <div
                  style={{
                    padding: "6px",
                    borderRadius: "6px",
                    background: isSelected ? "var(--primary-100)" : "var(--slate-100)",
                    color: item.color,
                  }}
                >
                  <Icon size={18} />
                </div>
                <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--slate-900)" }}>
                  {item.title}
                </div>
              </div>
              <div style={{ fontSize: "12px", color: "var(--slate-600)", lineHeight: 1.5 }}>
                {item.desc}
              </div>
            </div>
          );
        })}
      </div>

      {/* Custom Sliders if Custom selected */}
      {selectedScenarioType === "custom" && (
        <div className="card" style={{ marginBottom: "24px" }}>
          <div className="card-title" style={{ marginBottom: "16px" }}>
            Custom Scenario Controls
          </div>
          <div className="grid-2">
            <div>
              <div className="form-group">
                <div className="form-label" style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Water Supply Shift</span>
                  <span>{waterChange}%</span>
                </div>
                <input
                  type="range"
                  min="-70"
                  max="30"
                  step="5"
                  value={waterChange}
                  onChange={(e) => setWaterChange(parseInt(e.target.value))}
                  className="range-slider"
                  style={{ width: "100%" }}
                />
              </div>

              <div className="form-group">
                <div className="form-label" style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Peak Rainfall Runoff Surge</span>
                  <span>+{rainSurge}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="80"
                  step="5"
                  value={rainSurge}
                  onChange={(e) => setRainSurge(parseInt(e.target.value))}
                  className="range-slider"
                  style={{ width: "100%" }}
                />
              </div>
            </div>

            <div>
              <div className="form-group">
                <div className="form-label" style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Budget Cut Percentage</span>
                  <span>{budgetCvt}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="70"
                  step="5"
                  value={budgetCvt}
                  onChange={(e) => setBudgetCvt(parseInt(e.target.value))}
                  className="range-slider"
                  style={{ width: "100%" }}
                />
              </div>

              <div className="form-group">
                <div className="form-label" style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Temperature Heatwave Anomaly</span>
                  <span>+{tempAnomaly}°C</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="6"
                  step="0.5"
                  value={tempAnomaly}
                  onChange={(e) => setTempAnomaly(parseFloat(e.target.value))}
                  className="range-slider"
                  style={{ width: "100%" }}
                />
              </div>

              <button className="btn btn-primary" onClick={() => runSimulation("custom")} disabled={isLoading}>
                <Play size={14} fill="currentColor" />
                <span>Rerun Custom Simulation</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Simulation Results & Deltas */}
      {simulationResult && (
        <div>
          {/* Narrative Overview */}
          <div
            style={{
              background: "var(--white)",
              border: "1px solid var(--slate-200)",
              borderRadius: "var(--radius-lg)",
              padding: "20px 24px",
              marginBottom: "24px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
              <div>
                <span className="badge badge-amber" style={{ marginBottom: "6px" }}>
                  Simulated Stress Test
                </span>
                <h2 style={{ fontSize: "18px", fontWeight: 800, color: "var(--slate-900)" }}>
                  {simulationResult.scenario_name}
                </h2>
              </div>
              <span className="badge badge-slate">Confidence: {simulationResult.uncertainty_level}</span>
            </div>
            <div style={{ fontSize: "13px", color: "var(--slate-700)", lineHeight: 1.6 }}>
              {simulationResult.scenario_narrative}
            </div>
          </div>

          {/* Baseline vs Scenario Deltas Grid */}
          <div className="kpi-grid">
            <MetricCard
              label="Capital Budget Shift"
              value={`$${simulationResult.scenario_portfolio.total_capital_cost.toLocaleString()}`}
              subtext={`Delta: ${simulationResult.deltas.capital_cost_difference >= 0 ? "+" : ""}$${simulationResult.deltas.capital_cost_difference.toLocaleString()}`}
              variant="amber"
            />
            <MetricCard
              label="Stormwater Retention Delta"
              value={`${simulationResult.scenario_portfolio.total_stormwater_runoff_diverted_m3.toLocaleString()} m³`}
              subtext={`Delta: ${simulationResult.deltas.runoff_reduction_difference_m3 >= 0 ? "+" : ""}${simulationResult.deltas.runoff_reduction_difference_m3.toLocaleString()} m³`}
              variant="sky"
            />
            <MetricCard
              label="Net Water Impact Delta"
              value={`${simulationResult.scenario_portfolio.net_annual_water_impact_m3.toLocaleString()} m³`}
              subtext={`Delta: ${simulationResult.deltas.water_impact_difference_m3 >= 0 ? "+" : ""}${simulationResult.deltas.water_impact_difference_m3.toLocaleString()} m³/yr`}
              variant="primary"
            />
            <MetricCard
              label="Frontline Equity Shift"
              value={`${simulationResult.scenario_portfolio.equity_score.toFixed(1)} / 100`}
              subtext={`Delta: ${simulationResult.deltas.equity_score_difference >= 0 ? "+" : ""}${simulationResult.deltas.equity_score_difference.toFixed(1)} pts`}
              variant="primary"
            />
          </div>

          {/* Strategic Shifts & Mitigations */}
          <div className="grid-2" style={{ marginBottom: "24px" }}>
            <div className="card">
              <div className="card-title" style={{ color: "var(--slate-900)", marginBottom: "14px" }}>
                <span>Interventions Reduced or Prioritized</span>
              </div>

              {simulationResult.deltas.abandoned_or_reduced_interventions.length > 0 && (
                <div style={{ marginBottom: "14px" }}>
                  <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--rose-600)", marginBottom: "6px" }}>
                    DE-SCOPED OR CONTRACTED ASSETS:
                  </div>
                  <ul style={{ paddingLeft: "18px", fontSize: "12px", color: "var(--slate-700)", lineHeight: 1.6 }}>
                    {simulationResult.deltas.abandoned_or_reduced_interventions.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {simulationResult.deltas.newly_prioritised_interventions.length > 0 && (
                <div>
                  <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--primary-700)", marginBottom: "6px" }}>
                    SCALED UP FOR RESILIENCE:
                  </div>
                  <ul style={{ paddingLeft: "18px", fontSize: "12px", color: "var(--slate-700)", lineHeight: 1.6 }}>
                    {simulationResult.deltas.newly_prioritised_interventions.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {simulationResult.deltas.abandoned_or_reduced_interventions.length === 0 &&
                simulationResult.deltas.newly_prioritised_interventions.length === 0 && (
                  <div style={{ fontSize: "12px", color: "var(--slate-500)" }}>
                    Portfolio remained stable under tested bounds with minor internal geographic re-balancing.
                  </div>
                )}
            </div>

            <div className="card">
              <div className="card-title" style={{ color: "var(--primary-800)", marginBottom: "14px" }}>
                <ShieldCheck size={18} />
                <span>Recommended Scenario Mitigations</span>
              </div>
              <ul style={{ paddingLeft: "18px", fontSize: "12px", color: "var(--slate-700)", lineHeight: 1.7 }}>
                {simulationResult.recommended_mitigations.map((m, idx) => (
                  <li key={idx} style={{ marginBottom: "6px" }}>
                    {m}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
