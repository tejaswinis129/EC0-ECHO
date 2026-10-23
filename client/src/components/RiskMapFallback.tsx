import React, { useState } from "react";
import { NeighbourhoodRiskScore } from "../types";
import { Thermometer, Waves, Droplet, Users, AlertTriangle } from "lucide-react";

interface RiskMapFallbackProps {
  scores: NeighbourhoodRiskScore[];
  selectedId?: string;
  onSelectNeighbourhood: (id: string) => void;
}

export const RiskMapFallback: React.FC<RiskMapFallbackProps> = ({
  scores,
  selectedId,
  onSelectNeighbourhood,
}) => {
  const [metricView, setMetricView] = useState<"composite" | "heat" | "flood" | "water">("composite");

  const getColor = (score: number) => {
    if (score >= 70) return "var(--risk-severe)"; // severe (#B94B42)
    if (score >= 50) return "var(--risk-elevated)"; // elevated (#B66A36)
    if (score >= 35) return "var(--info-blue)"; // moderate (#397C9B)
    return "var(--risk-moderate)"; // low (#2F7D55)
  };

  const selectedScore = scores.find((s) => s.neighbourhood_id === selectedId) || scores[0];

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <div className="card-title">
            <span>District Spatial Vulnerability & Risk Map</span>
          </div>
          <div style={{ fontSize: "12px", color: "var(--slate-500)", marginTop: "2px" }}>
            Interactive geometric district layout showing comparative hazard exposure across the urban basin.
          </div>
        </div>

        <div style={{ display: "flex", gap: "6px" }}>
          <button
            className={`btn btn-sm ${metricView === "composite" ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setMetricView("composite")}
          >
            Composite
          </button>
          <button
            className={`btn btn-sm ${metricView === "heat" ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setMetricView("heat")}
          >
            Heat Island
          </button>
          <button
            className={`btn btn-sm ${metricView === "flood" ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setMetricView("flood")}
          >
            Flood Runoff
          </button>
          <button
            className={`btn btn-sm ${metricView === "water" ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setMetricView("water")}
          >
            Water Stress
          </button>
        </div>
      </div>

      <div className="grid-2" style={{ alignItems: "start" }}>
        {/* SVG Spatial Grid */}
        <div
          style={{
            background: "var(--slate-100)",
            borderRadius: "var(--radius-md)",
            padding: "20px",
            border: "1px solid var(--slate-200)",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "11px", color: "var(--slate-500)", marginBottom: "12px", fontWeight: 600 }}>
            CLICK A DISTRICT TO INSPECT HAZARD DRIVERS
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
              gap: "12px",
            }}
          >
            {scores.map((n) => {
              const val =
                metricView === "composite"
                  ? n.composite_risk_score
                  : metricView === "heat"
                  ? n.heat_risk_score
                  : metricView === "flood"
                  ? n.flood_risk_score
                  : n.water_stress_score;

              const isSelected = n.neighbourhood_id === selectedId;
              const col = getColor(val);

              return (
                <div
                  key={n.neighbourhood_id}
                  onClick={() => onSelectNeighbourhood(n.neighbourhood_id)}
                  style={{
                    background: isSelected ? "var(--white)" : "rgba(255, 255, 255, 0.85)",
                    border: isSelected ? `2.5px solid ${col}` : "1px solid var(--slate-300)",
                    borderRadius: "8px",
                    padding: "12px 10px",
                    cursor: "pointer",
                    textAlign: "center",
                    boxShadow: isSelected ? "0 4px 12px rgba(0,0,0,0.12)" : "none",
                    transform: isSelected ? "scale(1.03)" : "none",
                    transition: "all 0.15s ease",
                  }}
                >
                  <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--slate-500)" }}>
                    {n.neighbourhood_id}
                  </div>
                  <div
                    style={{
                      fontSize: "12px",
                      fontWeight: 700,
                      color: "var(--slate-900)",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      marginTop: "2px",
                    }}
                    title={n.neighbourhood_name}
                  >
                    {n.neighbourhood_name}
                  </div>
                  <div
                    style={{
                      fontSize: "18px",
                      fontWeight: 800,
                      color: col,
                      margin: "4px 0",
                    }}
                  >
                    {val.toFixed(1)}
                  </div>
                  <div
                    style={{
                      height: "4px",
                      borderRadius: "2px",
                      background: "var(--slate-200)",
                      overflow: "hidden",
                    }}
                  >
                    <div style={{ width: `${Math.min(100, val)}%`, height: "100%", background: col }} />
                  </div>
                </div>
              );
            })}
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "16px",
              marginTop: "18px",
              fontSize: "11px",
              fontWeight: 600,
              color: "var(--slate-600)",
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <span style={{ width: "10px", height: "10px", borderRadius: "2px", background: "#059669" }} />
              Low (&lt;30)
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <span style={{ width: "10px", height: "10px", borderRadius: "2px", background: "#0284c7" }} />
              Moderate (30-50)
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <span style={{ width: "10px", height: "10px", borderRadius: "2px", background: "#d97706" }} />
              Elevated (50-75)
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <span style={{ width: "10px", height: "10px", borderRadius: "2px", background: "#e11d48" }} />
              Severe (&gt;75)
            </span>
          </div>
        </div>

        {/* Selected District Details */}
        {selectedScore && (
          <div
            style={{
              background: "var(--white)",
              border: "1px solid var(--slate-200)",
              borderRadius: "var(--radius-md)",
              padding: "20px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <div>
                <span className="badge badge-slate" style={{ marginBottom: "4px" }}>
                  {selectedScore.neighbourhood_id}
                </span>
                <h3 style={{ fontSize: "18px", fontWeight: 800, color: "var(--slate-900)" }}>
                  {selectedScore.neighbourhood_name}
                </h3>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "11px", color: "var(--slate-500)", textTransform: "uppercase" }}>
                  Composite Risk
                </div>
                <div
                  style={{
                    fontSize: "24px",
                    fontWeight: 800,
                    color: getColor(selectedScore.composite_risk_score),
                  }}
                >
                  {selectedScore.composite_risk_score.toFixed(1)}
                  <span style={{ fontSize: "12px", color: "var(--slate-400)" }}>/100</span>
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", margin: "16px 0" }}>
              <div style={{ background: "var(--slate-50)", padding: "10px", borderRadius: "6px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "var(--slate-600)" }}>
                  <Thermometer size={13} color="var(--amber-600)" />
                  Heat Risk
                </div>
                <div style={{ fontSize: "16px", fontWeight: 700, color: getColor(selectedScore.heat_risk_score), marginTop: "2px" }}>
                  {selectedScore.heat_risk_score.toFixed(1)}
                </div>
                <div style={{ fontSize: "11px", color: "var(--slate-500)" }}>
                  Surface: {selectedScore.surface_temp_c}°C
                </div>
              </div>

              <div style={{ background: "var(--slate-50)", padding: "10px", borderRadius: "6px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "var(--slate-600)" }}>
                  <Waves size={13} color="var(--sky-600)" />
                  Flood Risk
                </div>
                <div style={{ fontSize: "16px", fontWeight: 700, color: getColor(selectedScore.flood_risk_score), marginTop: "2px" }}>
                  {selectedScore.flood_risk_score.toFixed(1)}
                </div>
                <div style={{ fontSize: "11px", color: "var(--slate-500)" }}>Overload Factor</div>
              </div>

              <div style={{ background: "var(--slate-50)", padding: "10px", borderRadius: "6px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "var(--slate-600)" }}>
                  <Droplet size={13} color="var(--rose-600)" />
                  Water Stress
                </div>
                <div style={{ fontSize: "16px", fontWeight: 700, color: getColor(selectedScore.water_stress_score), marginTop: "2px" }}>
                  {selectedScore.water_stress_score.toFixed(1)}
                </div>
                <div style={{ fontSize: "11px", color: "var(--slate-500)" }}>Supply / Demand Ratio</div>
              </div>

              <div style={{ background: "var(--slate-50)", padding: "10px", borderRadius: "6px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "var(--slate-600)" }}>
                  <Users size={13} color="var(--primary-700)" />
                  Social Vulnerability
                </div>
                <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--slate-900)", marginTop: "2px" }}>
                  {(selectedScore.social_vulnerability_index * 100).toFixed(0)}%
                </div>
                <div style={{ fontSize: "11px", color: "var(--slate-500)" }}>
                  Pop: {selectedScore.population.toLocaleString()}
                </div>
              </div>
            </div>

            <div style={{ fontSize: "12px", color: "var(--slate-700)", lineHeight: 1.6 }}>
              <div>
                <strong>Primary Driver:</strong> {selectedScore.primary_risk_driver}
              </div>
              {selectedScore.warnings_or_caveats.length > 0 && (
                <div style={{ marginTop: "10px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "var(--amber-600)", fontWeight: 600 }}>
                    <AlertTriangle size={13} />
                    Environmental Advisory:
                  </div>
                  <ul style={{ paddingLeft: "18px", marginTop: "4px", color: "var(--slate-600)" }}>
                    {selectedScore.warnings_or_caveats.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
