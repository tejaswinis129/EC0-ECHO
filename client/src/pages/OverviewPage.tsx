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
  Waves,
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
  return (
    <div>
      {/* Hero Banner */}
      <div
        style={{
          background: "linear-gradient(135deg, var(--slate-900) 0%, #064e3b 100%)",
          color: "var(--white)",
          borderRadius: "var(--radius-lg)",
          padding: "36px 40px",
          marginBottom: "32px",
          boxShadow: "var(--shadow-lg)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ maxWidth: "800px", position: "relative", zIndex: 2 }}>
          <span
            style={{
              fontSize: "12px",
              fontWeight: 700,
              background: "rgba(16, 185, 129, 0.2)",
              color: "#6ee7b7",
              border: "1px solid rgba(16, 185, 129, 0.4)",
              padding: "4px 10px",
              borderRadius: "var(--radius-full)",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              marginBottom: "12px",
            }}
          >
            <ShieldCheck size={14} />
            AI-Driven Urban Sustainability Decision Engine
          </span>
          <h1 style={{ fontSize: "32px", fontWeight: 800, letterSpacing: "-1px", lineHeight: 1.2, marginBottom: "12px" }}>
            Transparent, Multi-Hazard Climate Planning for Cities
          </h1>
          <p style={{ fontSize: "15px", color: "var(--slate-300)", lineHeight: 1.6, marginBottom: "24px" }}>
            Urban heat, flooding, water scarcity, and equity are deeply intertwined. ECO-ECHO helps city planners
            evaluate multi-objective green infrastructure portfolios, uncover hidden trade-offs via the signature{" "}
            <strong style={{ color: "var(--white)" }}>Consequence Chain</strong>, and stress-test decisions under severe climate scenarios.
          </p>

          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <button className="btn btn-primary" onClick={() => onNavigate("optimise")}>
              <span>Launch Optimisation Studio</span>
              <ArrowRight size={15} />
            </button>
            <button
              className="btn"
              style={{ background: "rgba(255,255,255,0.12)", color: "#ffffff", border: "1px solid rgba(255,255,255,0.25)" }}
              onClick={() => onNavigate("consequences")}
            >
              <GitFork size={15} />
              <span>Explore Consequence Chain</span>
            </button>
            <button
              className="btn"
              style={{ background: "rgba(255,255,255,0.12)", color: "#ffffff", border: "1px solid rgba(255,255,255,0.25)" }}
              onClick={() => onNavigate("scenarios")}
            >
              <CloudRain size={15} />
              <span>Test Climate Scenarios</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Overview Grid */}
      <div className="page-header" style={{ marginBottom: "16px" }}>
        <div>
          <div className="page-title" style={{ fontSize: "18px" }}>
            Active Urban Baseline: {metadata?.name || "Metro Verde"}
          </div>
          <div className="page-description">
            Current aggregate environmental exposure and resource indicators across {summary?.neighbourhood_count || 8} districts.
          </div>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={() => onNavigate("data")}>
          Switch or Upload Dataset
        </button>
      </div>

      <div className="kpi-grid">
        <MetricCard
          label="City Climate Risk Index"
          value={riskOverview ? `${riskOverview.city_composite_risk.toFixed(1)} / 100` : "58.4 / 100"}
          subtext={`Highest Risk: ${riskOverview?.highest_risk_neighbourhood || "Industrial Harbor"}`}
          variant="amber"
          badge="Composite"
        />
        <MetricCard
          label="Avg Surface Temperature"
          value={summary ? `${summary.avg_surface_temp_c}°C` : "35.2°C"}
          subtext="Ambient Summer Heat Exposure"
          variant="amber"
        />
        <MetricCard
          label="Municipal Water Deficit Ratio"
          value={summary ? `${summary.water_stress_ratio}x` : "1.12x"}
          subtext={summary && summary.water_stress_ratio > 1.0 ? "Demand exceeds utility supply" : "Within supply buffer"}
          variant="rose"
        />
        <MetricCard
          label="Average Tree Canopy"
          value={summary ? `${summary.avg_tree_canopy_pct}%` : "18.5%"}
          subtext="Target Canopy Threshold: 30%"
          variant="primary"
        />
      </div>

      {/* 3 Pillars Overview */}
      <div className="grid-3" style={{ marginBottom: "32px" }}>
        <div className="card">
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <div style={{ padding: "8px", background: "var(--primary-100)", borderRadius: "8px", color: "var(--primary-800)" }}>
              <Sliders size={20} />
            </div>
            <div className="card-title" style={{ margin: 0 }}>
              Multi-Objective Optimisation
            </div>
          </div>
          <p style={{ fontSize: "13px", color: "var(--slate-600)", lineHeight: 1.6, marginBottom: "16px" }}>
            Linear and mixed-integer programming (SciPy HiGHS) calculates optimal intervention portfolios balancing heat, flood, water, equity, and expenditure.
          </p>
          <button className="btn btn-secondary btn-sm" onClick={() => onNavigate("optimise")}>
            Run Solver
          </button>
        </div>

        <div className="card">
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <div style={{ padding: "8px", background: "var(--sky-100)", borderRadius: "8px", color: "var(--sky-600)" }}>
              <GitFork size={20} />
            </div>
            <div className="card-title" style={{ margin: 0 }}>
              Signature Consequence Chain
            </div>
          </div>
          <p style={{ fontSize: "13px", color: "var(--slate-600)", lineHeight: 1.6, marginBottom: "16px" }}>
            Trace secondary and tertiary consequences: tree cooling vs. drought water demand, bioswales vs. maintenance opex, and green gentrification risks.
          </p>
          <button className="btn btn-secondary btn-sm" onClick={() => onNavigate("consequences")}>
            Inspect Causal Chains
          </button>
        </div>

        <div className="card">
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <div style={{ padding: "8px", background: "var(--amber-100)", borderRadius: "8px", color: "var(--amber-600)" }}>
              <CloudRain size={20} />
            </div>
            <div className="card-title" style={{ margin: 0 }}>
              Climate Scenario Stress Tests
            </div>
          </div>
          <p style={{ fontSize: "13px", color: "var(--slate-600)", lineHeight: 1.6, marginBottom: "16px" }}>
            Simulate drought (-50% water), extreme 100-year cloudbursts (+45% runoff), and sudden -35% budget cuts to see how recommendations pivot.
          </p>
          <button className="btn btn-secondary btn-sm" onClick={() => onNavigate("scenarios")}>
            Simulate Stress Tests
          </button>
        </div>
      </div>
    </div>
  );
};
