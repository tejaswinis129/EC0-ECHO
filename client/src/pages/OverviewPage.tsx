import React from "react";
import { DatasetMetadata, DatasetSummary, RiskOverview } from "../types";
import { MetricCard } from "../components/MetricCard";
import {
  Compass,
  Sliders,
  CloudRain,
  GitFork,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  TrendingDown,
  Droplet,
  Thermometer,
  Trees,
  Database,
  BarChart2,
  Sparkles,
  Info,
} from "lucide-react";

interface OverviewPageProps {
  metadata?: DatasetMetadata;
  summary?: DatasetSummary;
  riskOverview?: RiskOverview;
  onNavigate: (tab: string) => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({
  metadata,
  summary,
  riskOverview,
  onNavigate,
}) => {
  const scores = riskOverview?.neighbourhood_scores || [];
  const topRisks = scores.slice(0, 4);

  return (
    <div>
      {/* Editorial Page Header */}
      <div className="page-header">
        <div className="page-header-text">
          <h1>Urban Intelligence Overview</h1>
          <p>
            Understand the consequences. Optimise for a sustainable future. Unified multi-hazard climate risk
            surveillance, constrained intervention optimization, and causal trade-off tracing.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <button className="btn btn-secondary btn-sm" onClick={() => onNavigate("data")}>
            <Database size={13} />
            <span>Dataset Ingestion</span>
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => onNavigate("optimise")}>
            <Sliders size={13} />
            <span>Launch Optimisation</span>
          </button>
        </div>
      </div>

      {/* Dataset Provenance & Data Freshness Banner */}
      <div
        className="card"
        style={{
          padding: "14px 20px",
          marginBottom: "24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
          background: "var(--white)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Database size={16} color="var(--forest-green)" />
          <div>
            <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>
              {metadata?.name || "Metro Verde Urban Resilience"}
            </span>
            <span style={{ fontSize: "12px", color: "var(--text-secondary)", marginLeft: "8px" }}>
              • {summary?.neighbourhood_count || 8} Spatial Districts
            </span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span className="badge badge-neutral">Calibrated Synthetic Archetype</span>
          <span className="badge badge-green">Validated Provenance</span>
        </div>
      </div>

      {/* 5 Carefully Selected Key Indicators */}
      <div className="grid-cols-4">
        <MetricCard
          label="Composite Climate Risk"
          value={riskOverview ? `${riskOverview.city_composite_risk.toFixed(1)} / 100` : "58.4 / 100"}
          subtext={`Highest Exposure: ${riskOverview?.highest_risk_neighbourhood || "Industrial Harbor"}`}
          variant="forest"
          badge="Multi-Hazard"
          icon={ShieldCheck}
        />
        <MetricCard
          label="Summer Heat Anomaly"
          value={summary ? `${summary.avg_surface_temp_c}°C` : "35.2°C"}
          subtext="Ambient Urban Heat Island"
          variant="heat"
          icon={Thermometer}
        />
        <MetricCard
          label="Water Stress Deficit"
          value={summary ? `${summary.water_stress_ratio}x` : "1.12x"}
          subtext={summary && summary.water_stress_ratio > 1.0 ? "Demand exceeds utility supply" : "Within supply buffer"}
          variant="water"
          icon={Droplet}
        />
        <MetricCard
          label="Average Tree Canopy"
          value={summary ? `${summary.avg_tree_canopy_pct}%` : "18.5%"}
          subtext="Municipal Target: 30.0%"
          variant="primary"
          icon={Trees}
        />
      </div>

      {/* Main 2-Column Section */}
      <div className="grid-split-2-1" style={{ alignItems: "start" }}>
        {/* Left: Top Neighbourhood Risks & Portfolio Recommendations */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Top District Vulnerabilities */}
          <div className="card">
            <div className="card-header">
              <div className="card-title-group">
                <BarChart2 size={18} color="var(--forest-green)" />
                <div className="card-title">Highest-Priority Neighbourhood Risks</div>
              </div>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => onNavigate("risk")}
                style={{ fontSize: "11.5px" }}
              >
                <span>Full Risk Analysis</span>
                <ArrowRight size={12} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {topRisks.length > 0 ? (
                topRisks.map((d) => (
                  <div
                    key={d.neighbourhood_id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "10px 14px",
                      background: "var(--warm-ivory)",
                      borderRadius: "var(--radius-button)",
                      border: "1px solid var(--border-subtle)",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "13.5px", color: "var(--text-primary)" }}>
                        {d.neighbourhood_name}
                      </div>
                      <div style={{ fontSize: "11.5px", color: "var(--text-secondary)" }}>
                        District ID: {d.neighbourhood_id} • Heat: {d.heat_risk_score.toFixed(0)} • Flood: {d.flood_risk_score.toFixed(0)}
                      </div>
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <span
                        className={`badge ${
                          d.composite_risk_score >= 70
                            ? "badge-adverse"
                            : d.composite_risk_score >= 50
                            ? "badge-heat"
                            : "badge-water"
                        }`}
                      >
                        {d.composite_risk_score.toFixed(1)} / 100
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ color: "var(--text-secondary)", fontSize: "13px" }}>Loading district scores...</div>
              )}
            </div>
          </div>

          {/* Optimisation Portfolio Snapshot */}
          <div className="card">
            <div className="card-header">
              <div className="card-title-group">
                <Sliders size={18} color="var(--forest-green)" />
                <div className="card-title">Recommended Intervention Allocation (Balanced Portfolio)</div>
              </div>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => onNavigate("optimise")}
                style={{ fontSize: "11.5px" }}
              >
                <span>Tune Optimisation</span>
                <ArrowRight size={12} />
              </button>
            </div>

            <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: "16px" }}>
              The mathematical optimizer selects a balanced package prioritizing high-ROI nature-based solutions,
              ensuring at least 30% of total capital is dedicated to historically disadvantaged frontline districts.
            </p>

            <div className="grid-cols-3" style={{ marginBottom: 0 }}>
              <div style={{ background: "var(--warm-ivory)", padding: "12px 14px", borderRadius: "var(--radius-button)" }}>
                <div style={{ fontSize: "11px", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: 600 }}>
                  Capital Budget Used
                </div>
                <div style={{ fontSize: "18px", fontWeight: 800, color: "var(--text-primary)" }} className="tabular-nums">
                  $2.42M / $2.50M
                </div>
                <div style={{ fontSize: "11px", color: "var(--forest-green)", marginTop: "2px" }}>
                  96.8% Budget Utilisation
                </div>
              </div>

              <div style={{ background: "var(--warm-ivory)", padding: "12px 14px", borderRadius: "var(--radius-button)" }}>
                <div style={{ fontSize: "11px", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: 600 }}>
                  Stormwater Diverted
                </div>
                <div style={{ fontSize: "18px", fontWeight: 800, color: "var(--text-primary)" }} className="tabular-nums">
                  84,500 m³
                </div>
                <div style={{ fontSize: "11px", color: "var(--info-blue)", marginTop: "2px" }}>
                  Peak Flood Runoff Absorbed
                </div>
              </div>

              <div style={{ background: "var(--warm-ivory)", padding: "12px 14px", borderRadius: "var(--radius-button)" }}>
                <div style={{ fontSize: "11px", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: 600 }}>
                  Frontline Equity Share
                </div>
                <div style={{ fontSize: "18px", fontWeight: 800, color: "var(--text-primary)" }} className="tabular-nums">
                  38.5%
                </div>
                <div style={{ fontSize: "11px", color: "var(--forest-green)", marginTop: "2px" }}>
                  Exceeds 30% Mandate
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Signature Consequence Chain & Climate Scenario Previews */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Consequence Chain Feature Card */}
          <div
            className="card"
            style={{
              background: "var(--forest-green)",
              color: "#FFFFFF",
              border: "1px solid var(--forest-green)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
              <span className="badge badge-lime">Signature Feature</span>
            </div>

            <div style={{ fontSize: "17px", fontWeight: 800, marginBottom: "8px" }}>
              The Consequence Chain
            </div>

            <p style={{ fontSize: "12.5px", color: "rgba(255, 255, 255, 0.78)", lineHeight: 1.6, marginBottom: "16px" }}>
              Every urban intervention triggers ripples: planting trees cools ambient heat, but requires dry-season water
              irrigation; stormwater bioswales prevent street inundation, but create ongoing maintenance requirements.
            </p>

            <button
              className="btn btn-accent"
              onClick={() => onNavigate("consequences")}
              style={{ width: "100%" }}
            >
              <GitFork size={15} />
              <span>Explore Consequence Chain</span>
            </button>
          </div>

          {/* Scenario Stress-Testing Card */}
          <div className="card">
            <div className="card-header">
              <div className="card-title-group">
                <CloudRain size={18} color="var(--forest-green)" />
                <div className="card-title">Climate Stress-Testing</div>
              </div>
            </div>

            <p style={{ fontSize: "12.5px", color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: "14px" }}>
              Evaluate portfolio resilience against severe prolonged droughts (-50% water), 100-year cloudbursts (+45% runoff),
              and municipal fiscal austerity (-35% budget cuts).
            </p>

            <button
              className="btn btn-secondary"
              onClick={() => onNavigate("scenarios")}
              style={{ width: "100%" }}
            >
              <Compass size={14} />
              <span>Open Scenario Lab</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
