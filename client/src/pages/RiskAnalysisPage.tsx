import React, { useState, useEffect } from "react";
import { RiskOverview, RiskWeightConfig } from "../types";
import { api } from "../api/client";
import { RiskMapFallback } from "../components/RiskMapFallback";
import { FormulaModal } from "../components/FormulaModal";
import {
  BarChart3,
  BookOpen,
  Sliders,
  Thermometer,
  Waves,
  Droplet,
  Trees,
  Users,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";

interface RiskAnalysisPageProps {
  activeDatasetId: string;
  riskOverview?: RiskOverview;
  onUpdateRiskOverview: (ro: RiskOverview) => void;
}

export const RiskAnalysisPage: React.FC<RiskAnalysisPageProps> = ({
  activeDatasetId,
  riskOverview,
  onUpdateRiskOverview,
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
      if (res.neighbourhood_scores.length > 0) {
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

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Sustainability & Multi-Hazard Risk Analysis</h1>
          <p className="page-description">
            Transparent district evaluation of urban heat islands, storm inundation overload, municipal water deficits, and social vulnerability.
          </p>
        </div>

        <button className="btn btn-secondary" onClick={() => setIsFormulaModalOpen(true)}>
          <BookOpen size={16} />
          <span>View Transparent Formulas & Citations</span>
        </button>
      </div>

      {/* Weights Tuning Panel */}
      <div className="card" style={{ marginBottom: "24px" }}>
        <div className="card-header">
          <div className="card-title">
            <Sliders size={18} color="var(--primary-700)" />
            <span>Hazard Priority Weights Configuration</span>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={resetWeights}>
            <RotateCcw size={12} />
            <span>Reset Weights</span>
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px" }}>
          <div>
            <div className="form-label" style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Heat Exposure Weight</span>
              <span>{(weights.heat_weight * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={weights.heat_weight}
              onChange={(e) => handleWeightChange("heat_weight", parseFloat(e.target.value))}
              className="range-slider"
              style={{ width: "100%" }}
            />
          </div>

          <div>
            <div className="form-label" style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Stormwater Flood Weight</span>
              <span>{(weights.flood_weight * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={weights.flood_weight}
              onChange={(e) => handleWeightChange("flood_weight", parseFloat(e.target.value))}
              className="range-slider"
              style={{ width: "100%" }}
            />
          </div>

          <div>
            <div className="form-label" style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Water Stress Weight</span>
              <span>{(weights.water_stress_weight * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={weights.water_stress_weight}
              onChange={(e) => handleWeightChange("water_stress_weight", parseFloat(e.target.value))}
              className="range-slider"
              style={{ width: "100%" }}
            />
          </div>

          <div>
            <div className="form-label" style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Green Canopy Gap</span>
              <span>{(weights.green_gap_weight * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={weights.green_gap_weight}
              onChange={(e) => handleWeightChange("green_gap_weight", parseFloat(e.target.value))}
              className="range-slider"
              style={{ width: "100%" }}
            />
          </div>

          <div>
            <div className="form-label" style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Social Vulnerability (SVI)</span>
              <span>{(weights.equity_weight * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={weights.equity_weight}
              onChange={(e) => handleWeightChange("equity_weight", parseFloat(e.target.value))}
              className="range-slider"
              style={{ width: "100%" }}
            />
          </div>
        </div>
      </div>

      {/* Spatial Map Fallback */}
      <div style={{ marginBottom: "24px" }}>
        <RiskMapFallback
          scores={scores}
          selectedId={selectedDistrictId}
          onSelectNeighbourhood={setSelectedDistrictId}
        />
      </div>

      {/* District Risk Ranking Table */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <BarChart3 size={18} color="var(--primary-700)" />
            <span>District Multi-Hazard Ranking & Indicators</span>
          </div>
          <span className="badge badge-slate">Sorted by Composite Score</span>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>District</th>
                <th>Surface Temp</th>
                <th>Heat Risk (0-100)</th>
                <th>Flood Risk (0-100)</th>
                <th>Water Stress (0-100)</th>
                <th>Social Vulnerability</th>
                <th>Composite Score</th>
                <th>Primary Hazard</th>
              </tr>
            </thead>
            <tbody>
              {scores.map((s) => (
                <tr
                  key={s.neighbourhood_id}
                  style={{
                    background: s.neighbourhood_id === selectedDistrictId ? "var(--primary-50)" : undefined,
                    cursor: "pointer",
                  }}
                  onClick={() => setSelectedDistrictId(s.neighbourhood_id)}
                >
                  <td>
                    <strong>{s.neighbourhood_name}</strong> ({s.neighbourhood_id})
                  </td>
                  <td>{s.surface_temp_c}°C</td>
                  <td>{s.heat_risk_score.toFixed(1)}</td>
                  <td>{s.flood_risk_score.toFixed(1)}</td>
                  <td>{s.water_stress_score.toFixed(1)}</td>
                  <td>{(s.social_vulnerability_index * 100).toFixed(0)}%</td>
                  <td>
                    <span
                      style={{
                        fontWeight: 800,
                        color:
                          s.composite_risk_score >= 70
                            ? "#e11d48"
                            : s.composite_risk_score >= 50
                            ? "#d97706"
                            : "#059669",
                      }}
                    >
                      {s.composite_risk_score.toFixed(1)}
                    </span>
                  </td>
                  <td>
                    <span className="badge badge-slate">{s.primary_risk_driver}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transparent Formulas Modal */}
      <FormulaModal
        isOpen={isFormulaModalOpen}
        onClose={() => setIsFormulaModalOpen(false)}
        formulas={riskOverview?.formulas_documentation || []}
        limitations={riskOverview?.limitations || []}
      />
    </div>
  );
};
