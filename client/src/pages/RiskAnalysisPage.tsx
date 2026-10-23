import React, { useState, useEffect } from "react";
import { RiskOverview, RiskWeightConfig, NeighbourhoodRiskScore } from "../types";
import { api } from "../api/client";
import { FormulaModal } from "../components/FormulaModal";
import { MetricCard } from "../components/MetricCard";
import {
  BarChart2,
  BookOpen,
  Sliders,
  RotateCcw,
  AlertTriangle,
  ChevronRight,
  TrendingUp,
  Droplet,
  Thermometer,
  ShieldAlert,
  GitFork,
  Info,
} from "lucide-react";

interface RiskAnalysisPageProps {
  activeDatasetId: string;
  riskOverview?: RiskOverview;
  onUpdateRiskOverview: (ro: RiskOverview) => void;
  onNavigateToConsequences?: (interventionId: string, units: number, neighbourhoodId?: string) => void;
}

export const RiskAnalysisPage: React.FC<RiskAnalysisPageProps> = ({
  activeDatasetId,
  riskOverview,
  onUpdateRiskOverview,
  onNavigateToConsequences,
}) => {
  const [weights, setWeights] = useState<RiskWeightConfig>({
    heat_weight: 0.25,
    flood_weight: 0.25,
    water_stress_weight: 0.2,
    green_gap_weight: 0.15,
    equity_weight: 0.15,
  });

  const [selectedDistrictId, setSelectedDistrictId] = useState<string>("NB-02");
  const [isFormulaModalOpen, setIsFormulaModalOpen] = useState<boolean>(false);
  const [showWeightsPanel, setShowWeightsPanel] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (activeDatasetId) {
      calculateRisk(weights);
    }
  }, [activeDatasetId]);

  const calculateRisk = async (w: RiskWeightConfig) => {
    setIsLoading(true);
    try {
      const res = await api.calculateRisk(activeDatasetId, w);
      onUpdateRiskOverview(res);
      if (res.neighbourhood_scores.length > 0 && !res.neighbourhood_scores.some((s) => s.neighbourhood_id === selectedDistrictId)) {
        setSelectedDistrictId(res.neighbourhood_scores[0].neighbourhood_id);
      }
    } catch (err) {
      console.error("Failed to calculate risk", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWeightChange = (field: keyof RiskWeightConfig, val: number) => {
    const next = { ...weights, [field]: val };
    setWeights(next);
    calculateRisk(next);
  };

  const resetWeights = () => {
    const defaultW: RiskWeightConfig = {
      heat_weight: 0.25,
      flood_weight: 0.25,
      water_stress_weight: 0.2,
      green_gap_weight: 0.15,
      equity_weight: 0.15,
    };
    setWeights(defaultW);
    calculateRisk(defaultW);
  };

  const scores = riskOverview?.neighbourhood_scores || [];
  const selectedDistrict: NeighbourhoodRiskScore | undefined =
    scores.find((s) => s.neighbourhood_id === selectedDistrictId) || scores[0];

  const getRiskTier = (score: number) => {
    if (score >= 70) return { label: "Severe Exposure", color: "var(--risk-severe)", badge: "badge-adverse" };
    if (score >= 50) return { label: "Elevated Risk", color: "var(--risk-elevated)", badge: "badge-heat" };
    if (score >= 35) return { label: "Moderate Risk", color: "var(--info-blue)", badge: "badge-water" };
    return { label: "Resilient / Low", color: "var(--risk-moderate)", badge: "badge-green" };
  };

  const getPrimaryDriver = (item?: NeighbourhoodRiskScore) => {
    if (!item) return "N/A";
    const values = [
      { name: "Urban Heat Island", val: item.heat_risk_score },
      { name: "Stormwater Inundation", val: item.flood_risk_score },
      { name: "Water Supply Stress", val: item.water_stress_score },
      { name: "Green Canopy Deficit", val: item.green_gap_score },
      { name: "Social Vulnerability", val: item.social_vulnerability_index },
    ];
    values.sort((a, b) => b.val - a.val);
    return `${values[0].name} (${values[0].val.toFixed(1)}/100)`;
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-text">
          <h1>Multi-Hazard Climate Risk Analysis</h1>
          <p>
            Standardised spatial evaluation of urban heat islands, stormwater inundation, municipal water stress, and
            social vulnerability across urban districts.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <button
            className={`btn ${showWeightsPanel ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setShowWeightsPanel(!showWeightsPanel)}
          >
            <Sliders size={15} />
            <span>{showWeightsPanel ? "Hide Weights Config" : "Adjust Hazard Weights"}</span>
          </button>

          <button className="btn btn-secondary" onClick={() => setIsFormulaModalOpen(true)}>
            <BookOpen size={15} />
            <span>Formulas & Methodology</span>
          </button>
        </div>
      </div>

      {/* Aggregate KPI Summary Row */}
      <div className="grid-cols-4">
        <MetricCard
          label="City Composite Risk"
          value={riskOverview ? `${riskOverview.city_composite_risk.toFixed(1)} / 100` : "Loading..."}
          subtext="Normalized multi-hazard index"
          variant="forest"
          badge={riskOverview ? getRiskTier(riskOverview.city_composite_risk).label : "Computing"}
        />
        <MetricCard
          label="Highest-Risk District"
          value={riskOverview?.highest_risk_neighbourhood || "Evaluating..."}
          subtext={getPrimaryDriver(scores[0])}
          variant="adverse"
        />
        <MetricCard
          label="Districts Evaluated"
          value={scores.length > 0 ? `${scores.length} Districts` : "0 Districts"}
          subtext="Complete spatial coverage"
          variant="primary"
        />
        <MetricCard
          label="Calculation Status"
          value={isLoading ? "Updating..." : "Verified"}
          subtext="100% reproducible formulaic"
          variant="water"
        />
      </div>

      {/* Expandable Hazard Priority Weights Panel */}
      {showWeightsPanel && (
        <div className="card" style={{ marginBottom: "24px", borderLeft: "4px solid var(--forest-green)" }}>
          <div className="card-header">
            <div>
              <div className="card-title">Hazard Priority Weights Configuration</div>
              <div className="card-subtitle">
                Adjust the mathematical weighting applied to calculate each district's Composite Risk Index.
              </div>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={resetWeights}>
              <RotateCcw size={13} />
              <span>Reset to Defaults</span>
            </button>
          </div>

          <div className="grid-cols-3" style={{ marginBottom: 0 }}>
            <div>
              <div className="form-label-row">
                <span>Heat Exposure Weight</span>
                <span className="tabular-nums">{(weights.heat_weight * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="0.6"
                step="0.05"
                value={weights.heat_weight}
                onChange={(e) => handleWeightChange("heat_weight", parseFloat(e.target.value))}
                className="eco-slider"
              />
            </div>

            <div>
              <div className="form-label-row">
                <span>Stormwater Runoff Weight</span>
                <span className="tabular-nums">{(weights.flood_weight * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="0.6"
                step="0.05"
                value={weights.flood_weight}
                onChange={(e) => handleWeightChange("flood_weight", parseFloat(e.target.value))}
                className="eco-slider"
              />
            </div>

            <div>
              <div className="form-label-row">
                <span>Water Supply Stress Weight</span>
                <span className="tabular-nums">{(weights.water_stress_weight * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="0.6"
                step="0.05"
                value={weights.water_stress_weight}
                onChange={(e) => handleWeightChange("water_stress_weight", parseFloat(e.target.value))}
                className="eco-slider"
              />
            </div>

            <div>
              <div className="form-label-row">
                <span>Canopy Deficit Gap Weight</span>
                <span className="tabular-nums">{(weights.green_gap_weight * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="0.6"
                step="0.05"
                value={weights.green_gap_weight}
                onChange={(e) => handleWeightChange("green_gap_weight", parseFloat(e.target.value))}
                className="eco-slider"
              />
            </div>

            <div>
              <div className="form-label-row">
                <span>Social Vulnerability (SVI)</span>
                <span className="tabular-nums">{(weights.equity_weight * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="0.6"
                step="0.05"
                value={weights.equity_weight}
                onChange={(e) => handleWeightChange("equity_weight", parseFloat(e.target.value))}
                className="eco-slider"
              />
            </div>
          </div>
        </div>
      )}

      {/* 2-Column Split: District Comparative Ranking vs. Structured Detail Inspector */}
      <div className="grid-split-2-1">
        {/* Left: District Comparison Bar Chart & Table */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Horizontal Bar Chart Comparison */}
          <div className="card">
            <div className="card-header">
              <div className="card-title-group">
                <BarChart2 size={18} color="var(--forest-green)" />
                <div>
                  <div className="card-title">Comparative District Risk Ranking</div>
                  <div className="card-subtitle">
                    Select any district to inspect granular hazard drivers and advisories.
                  </div>
                </div>
              </div>
              <span className="badge badge-neutral">Ordered by Risk Severity</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {scores.map((item) => {
                const tier = getRiskTier(item.composite_risk_score);
                const isSelected = item.neighbourhood_id === selectedDistrictId;

                return (
                  <div
                    key={item.neighbourhood_id}
                    onClick={() => setSelectedDistrictId(item.neighbourhood_id)}
                    style={{
                      padding: "12px 16px",
                      borderRadius: "var(--radius-button)",
                      border: `1px solid ${isSelected ? "var(--forest-green)" : "var(--border-subtle)"}`,
                      backgroundColor: isSelected ? "var(--warm-ivory)" : "var(--white)",
                      cursor: "pointer",
                      transition: "all var(--transition-fast)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "12px", fontFamily: "var(--font-mono)", color: "var(--text-secondary)" }}>
                          {item.neighbourhood_id}
                        </span>
                        <span style={{ fontWeight: 700, fontSize: "14px", color: "var(--text-primary)" }}>
                          {item.neighbourhood_name}
                        </span>
                        <span className={`badge ${tier.badge}`}>{tier.label}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontWeight: 800, fontSize: "14px" }} className="tabular-nums">
                          {item.composite_risk_score.toFixed(1)} / 100
                        </span>
                        <ChevronRight size={16} color={isSelected ? "var(--forest-green)" : "var(--text-secondary)"} />
                      </div>
                    </div>

                    {/* Proportional Risk Bar */}
                    <div
                      style={{
                        height: "8px",
                        backgroundColor: "var(--warm-ivory-dark)",
                        borderRadius: "var(--radius-full)",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: `${Math.min(100, Math.max(5, item.composite_risk_score))}%`,
                          backgroundColor: tier.color,
                          borderRadius: "var(--radius-full)",
                          transition: "width 0.3s ease",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sorted Multi-Hazard Indicator Table */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">Granular Hazard Indicator Breakdown</div>
              <span className="badge badge-neutral">{scores.length} Districts Total</span>
            </div>

            <div className="table-wrapper">
              <table className="eco-table">
                <thead>
                  <tr>
                    <th>District</th>
                    <th>Composite</th>
                    <th>Heat Score</th>
                    <th>Flood Score</th>
                    <th>Water Deficit</th>
                    <th>Canopy Gap</th>
                    <th>SVI</th>
                  </tr>
                </thead>
                <tbody>
                  {scores.map((item) => (
                    <tr
                      key={item.neighbourhood_id}
                      onClick={() => setSelectedDistrictId(item.neighbourhood_id)}
                      style={{
                        cursor: "pointer",
                        backgroundColor: item.neighbourhood_id === selectedDistrictId ? "var(--warm-ivory)" : undefined,
                      }}
                    >
                      <td style={{ fontWeight: 600 }}>{item.neighbourhood_name}</td>
                      <td style={{ fontWeight: 700 }} className="table-cell-num">
                        {item.composite_risk_score.toFixed(1)}
                      </td>
                      <td className="table-cell-num">{item.heat_risk_score.toFixed(1)}</td>
                      <td className="table-cell-num">{item.flood_risk_score.toFixed(1)}</td>
                      <td className="table-cell-num">{item.water_stress_score.toFixed(1)}</td>
                      <td className="table-cell-num">{item.green_gap_score.toFixed(1)}</td>
                      <td className="table-cell-num">{item.social_vulnerability_index.toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right: Selected District Structured Detail Panel */}
        <div>
          {selectedDistrict ? (
            <div className="card" style={{ position: "sticky", top: "84px", maxHeight: "calc(100vh - 108px)", overflowY: "auto" }}>
              <div className="card-header">
                <div>
                  <span className="badge badge-neutral" style={{ marginBottom: "6px" }}>
                    District Inspector
                  </span>
                  <div className="card-title" style={{ fontSize: "18px" }}>
                    {selectedDistrict.neighbourhood_name}
                  </div>
                  <div className="card-subtitle">District ID: {selectedDistrict.neighbourhood_id}</div>
                </div>
                <span className={`badge ${getRiskTier(selectedDistrict.composite_risk_score).badge}`}>
                  {getRiskTier(selectedDistrict.composite_risk_score).label}
                </span>
              </div>

              {/* Composite Score Highlight */}
              <div
                style={{
                  background: "var(--warm-ivory)",
                  borderRadius: "var(--radius-card)",
                  padding: "16px",
                  marginBottom: "16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div style={{ fontSize: "11.5px", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: 600 }}>
                    Composite Vulnerability Index
                  </div>
                  <div style={{ fontSize: "28px", fontWeight: 800, color: "var(--text-primary)" }} className="tabular-nums">
                    {selectedDistrict.composite_risk_score.toFixed(1)}{" "}
                    <span style={{ fontSize: "14px", fontWeight: 500, color: "var(--text-secondary)" }}>/ 100</span>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>Rank in City</div>
                  <div style={{ fontSize: "18px", fontWeight: 700, color: "var(--forest-green)" }}>
                    #{scores.findIndex((s) => s.neighbourhood_id === selectedDistrict.neighbourhood_id) + 1} of {scores.length}
                  </div>
                </div>
              </div>

              {/* Sub-Hazard Progress Breakdown */}
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "16px" }}>
                <div>
                  <div className="form-label-row">
                    <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <Thermometer size={14} color="var(--risk-elevated)" />
                      <span>Heat Island Exposure</span>
                    </span>
                    <span className="tabular-nums">{selectedDistrict.heat_risk_score.toFixed(1)} / 100</span>
                  </div>
                  <div style={{ height: "6px", backgroundColor: "var(--warm-ivory-dark)", borderRadius: "3px" }}>
                    <div
                      style={{
                        height: "100%",
                        width: `${selectedDistrict.heat_risk_score}%`,
                        backgroundColor: "var(--risk-elevated)",
                        borderRadius: "3px",
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="form-label-row">
                    <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <AlertTriangle size={14} color="var(--info-blue)" />
                      <span>Stormwater Inundation</span>
                    </span>
                    <span className="tabular-nums">{selectedDistrict.flood_risk_score.toFixed(1)} / 100</span>
                  </div>
                  <div style={{ height: "6px", backgroundColor: "var(--warm-ivory-dark)", borderRadius: "3px" }}>
                    <div
                      style={{
                        height: "100%",
                        width: `${selectedDistrict.flood_risk_score}%`,
                        backgroundColor: "var(--info-blue)",
                        borderRadius: "3px",
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="form-label-row">
                    <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <Droplet size={14} color="var(--risk-severe)" />
                      <span>Water Supply Deficit</span>
                    </span>
                    <span className="tabular-nums">{selectedDistrict.water_stress_score.toFixed(1)} / 100</span>
                  </div>
                  <div style={{ height: "6px", backgroundColor: "var(--warm-ivory-dark)", borderRadius: "3px" }}>
                    <div
                      style={{
                        height: "100%",
                        width: `${selectedDistrict.water_stress_score}%`,
                        backgroundColor: "var(--risk-severe)",
                        borderRadius: "3px",
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="form-label-row">
                    <span>Green Canopy Gap</span>
                    <span className="tabular-nums">{selectedDistrict.green_gap_score.toFixed(1)} / 100</span>
                  </div>
                  <div style={{ height: "6px", backgroundColor: "var(--warm-ivory-dark)", borderRadius: "3px" }}>
                    <div
                      style={{
                        height: "100%",
                        width: `${selectedDistrict.green_gap_score}%`,
                        backgroundColor: "var(--risk-moderate)",
                        borderRadius: "3px",
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="form-label-row">
                    <span>Social Vulnerability (SVI)</span>
                    <span className="tabular-nums">{selectedDistrict.social_vulnerability_index.toFixed(1)} / 100</span>
                  </div>
                  <div style={{ height: "6px", backgroundColor: "var(--warm-ivory-dark)", borderRadius: "3px" }}>
                    <div
                      style={{
                        height: "100%",
                        width: `${selectedDistrict.social_vulnerability_index}%`,
                        backgroundColor: "#6366f1",
                        borderRadius: "3px",
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Primary Hazard Driver Note */}
              <div
                style={{
                  background: "var(--warm-ivory)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-button)",
                  padding: "12px 14px",
                  fontSize: "12.5px",
                  color: "var(--text-primary)",
                  marginBottom: "16px",
                  lineHeight: 1.5,
                }}
              >
                <div style={{ fontWeight: 700, marginBottom: "3px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <Info size={14} color="var(--forest-green)" />
                  <span>Primary Hazard Driver</span>
                </div>
                <div>{getPrimaryDriver(selectedDistrict)}</div>
              </div>

              {/* Action Button */}
              {onNavigateToConsequences && (
                <button
                  className="btn btn-primary"
                  style={{ width: "100%" }}
                  onClick={() =>
                    onNavigateToConsequences("int-urban-forest", 300, selectedDistrict.neighbourhood_id)
                  }
                >
                  <GitFork size={15} />
                  <span>Inspect Consequences for this District</span>
                </button>
              )}
            </div>
          ) : (
            <div className="card" style={{ textAlign: "center", padding: "40px 20px" }}>
              <div style={{ color: "var(--text-secondary)" }}>Select a district to view detailed hazard metrics.</div>
            </div>
          )}
        </div>
      </div>

      {/* Formula Transparency Modal */}
      {isFormulaModalOpen && <FormulaModal onClose={() => setIsFormulaModalOpen(false)} />}
    </div>
  );
};
