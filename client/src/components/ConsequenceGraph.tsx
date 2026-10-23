import React, { useState } from "react";
import { ConsequenceChainGraph, ConsequenceNode } from "../types";
import {
  TrendingUp,
  TrendingDown,
  HelpCircle,
  ShieldCheck,
  CheckCircle2,
  DollarSign,
  Droplet,
  Sun,
  Users,
  AlertTriangle,
  Info,
  ChevronRight,
  Sparkles,
  ArrowRight,
  Filter,
} from "lucide-react";

interface ConsequenceGraphProps {
  graph: ConsequenceChainGraph;
}

export const ConsequenceGraph: React.FC<ConsequenceGraphProps> = ({ graph }) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string>(graph.nodes[0]?.id || "");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const selectedNode = graph.nodes.find((n) => n.id === selectedNodeId) || graph.nodes[0];

  const getCategoryTheme = (category: string) => {
    switch (category) {
      case "root_intervention":
        return {
          label: "Root Action",
          color: "var(--lime-accent)",
          bg: "rgba(184, 233, 134, 0.15)",
          icon: CheckCircle2,
        };
      case "environmental_benefit":
        return {
          label: "Environmental",
          color: "var(--lime-accent)",
          bg: "rgba(184, 233, 134, 0.15)",
          icon: Sun,
        };
      case "water_consequence":
        return {
          label: "Water Resource",
          color: "#7dd3fc",
          bg: "rgba(56, 189, 248, 0.15)",
          icon: Droplet,
        };
      case "financial_consequence":
        return {
          label: "Financial & O&M",
          color: "#fcd34d",
          bg: "rgba(251, 191, 36, 0.15)",
          icon: DollarSign,
        };
      case "social_equity_consequence":
        return {
          label: "Social Equity",
          color: "#c084fc",
          bg: "rgba(192, 132, 252, 0.15)",
          icon: Users,
        };
      case "scenario_vulnerability":
        return {
          label: "Climate Risk Shock",
          color: "#f87171",
          bg: "rgba(248, 113, 113, 0.15)",
          icon: AlertTriangle,
        };
      case "suggested_mitigation":
        return {
          label: "Mitigation Safeguard",
          color: "var(--lime-accent)",
          bg: "rgba(184, 233, 134, 0.2)",
          icon: ShieldCheck,
        };
      default:
        return {
          label: "Consequence",
          color: "#cbd5e1",
          bg: "rgba(255, 255, 255, 0.1)",
          icon: Info,
        };
    }
  };

  const getDirectionBadge = (dir: string) => {
    if (dir === "positive") {
      return (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
            fontSize: "11px",
            fontWeight: 700,
            color: "#6ee7b7",
            background: "rgba(16, 185, 129, 0.2)",
            padding: "2px 8px",
            borderRadius: "var(--radius-full)",
          }}
        >
          <TrendingUp size={11} />
          Positive Benefit
        </span>
      );
    }
    if (dir === "negative") {
      return (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
            fontSize: "11px",
            fontWeight: 700,
            color: "#fca5a5",
            background: "rgba(239, 68, 68, 0.2)",
            padding: "2px 8px",
            borderRadius: "var(--radius-full)",
          }}
        >
          <TrendingDown size={11} />
          Resource / Cost Burden
        </span>
      );
    }
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "4px",
          fontSize: "11px",
          fontWeight: 700,
          color: "#fde047",
          background: "rgba(234, 179, 8, 0.2)",
          padding: "2px 8px",
          borderRadius: "var(--radius-full)",
        }}
      >
        <HelpCircle size={11} />
        Contextual / Trade-off
      </span>
    );
  };

  // Group nodes by depth / causal stages
  const stageGroups: { [key: number]: ConsequenceNode[] } = {
    0: [],
    1: [],
    2: [],
    3: [],
  };

  graph.nodes.forEach((node) => {
    const stage = Math.min(3, Math.max(0, node.depth_level));
    stageGroups[stage].push(node);
  });

  const stageTitles: { [key: number]: string } = {
    0: "1. Direct Intervention",
    1: "2. Primary Physical Effects",
    2: "3. Secondary Ripple Trade-offs",
    3: "4. Equity Shifts & Safeguards",
  };

  const filteredNodes =
    categoryFilter === "all"
      ? graph.nodes
      : graph.nodes.filter((n) => n.category.includes(categoryFilter));

  return (
    <div>
      {/* Top Summary Banner */}
      <div
        className="card"
        style={{
          marginBottom: "24px",
          borderLeft: "4px solid var(--forest-green)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <span className="badge badge-lime">Signature Feature</span>
            {graph.active_scenario_impacts && (
              <span className="badge badge-heat">
                Active Climate Shock: {graph.active_scenario_impacts.toUpperCase()}
              </span>
            )}
          </div>
          <h2 style={{ fontSize: "20px", fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.4px" }}>
            Consequence Chain: {graph.intervention_name}
          </h2>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "2px" }}>
            Tracing 1st, 2nd, and 3rd order impacts across environmental, financial, water, and equity dimensions.
          </p>
        </div>

        <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "11px", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: 600 }}>
              Deployment Volume
            </div>
            <div style={{ fontSize: "18px", fontWeight: 800, color: "var(--forest-green)" }} className="tabular-nums">
              {graph.units_deployed.toLocaleString()} units
            </div>
          </div>

          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "11px", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: 600 }}>
              Causal Graph
            </div>
            <div style={{ fontSize: "18px", fontWeight: 800, color: "var(--text-primary)" }}>
              {graph.nodes.length} Nodes • {graph.edges.length} Edges
            </div>
          </div>
        </div>
      </div>

      {/* Main Graph Canvas & Inspector Layout */}
      <div className="grid-split-2-1" style={{ alignItems: "start" }}>
        {/* Left: Dark Forest Green Graph Canvas */}
        <div className="consequence-canvas-wrapper">
          <div className="consequence-canvas-header">
            <div className="consequence-canvas-title">
              <h3>
                <Sparkles size={16} color="var(--lime-accent)" />
                <span>Interactive Causal Dependency Graph</span>
              </h3>
              <p>Click any node to inspect calculated metrics, uncertainty, and suggested mitigation.</p>
            </div>

            {/* Category Filter Chips */}
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.6)", marginRight: "4px" }}>Filter:</span>
              {[
                { id: "all", label: "All Nodes" },
                { id: "environmental", label: "Environmental" },
                { id: "water", label: "Water" },
                { id: "financial", label: "Finance / O&M" },
                { id: "equity", label: "Social Equity" },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setCategoryFilter(f.id)}
                  style={{
                    background: categoryFilter === f.id ? "var(--lime-accent)" : "rgba(255,255,255,0.1)",
                    color: categoryFilter === f.id ? "var(--forest-green)" : "#FFFFFF",
                    border: "none",
                    borderRadius: "var(--radius-full)",
                    padding: "3px 10px",
                    fontSize: "11px",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all var(--transition-fast)",
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Color Semantic Legend */}
          <div className="canvas-legend-row" style={{ marginBottom: "20px" }}>
            <div className="legend-chip">
              <span className="legend-dot green" />
              <span>Environmental Benefit</span>
            </div>
            <div className="legend-chip">
              <span className="legend-dot amber" />
              <span>Capital & O&M Cost</span>
            </div>
            <div className="legend-chip">
              <span className="legend-dot red" />
              <span>Adverse Risk / Shock</span>
            </div>
            <div className="legend-chip">
              <span className="legend-dot blue" />
              <span>Water Trade-off</span>
            </div>
          </div>

          {/* Causal Stage Sequences (Clean, Consistent Widths, No Deep Indentation) */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {[0, 1, 2, 3].map((stageNum) => {
              const nodesInStage = stageGroups[stageNum]?.filter((n) =>
                categoryFilter === "all" ? true : n.category.includes(categoryFilter)
              );
              if (!nodesInStage || nodesInStage.length === 0) return null;

              return (
                <div key={stageNum}>
                  <div
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      color: "rgba(255, 255, 255, 0.65)",
                      textTransform: "uppercase",
                      letterSpacing: "0.6px",
                      marginBottom: "10px",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <span>{stageTitles[stageNum]}</span>
                    <span style={{ fontSize: "10px", opacity: 0.7 }}>({nodesInStage.length})</span>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "10px" }}>
                    {nodesInStage.map((node) => {
                      const theme = getCategoryTheme(node.category);
                      const Icon = theme.icon;
                      const isSelected = selectedNode?.id === node.id;

                      return (
                        <div
                          key={node.id}
                          className={`chain-node-box ${isSelected ? "selected" : ""}`}
                          onClick={() => setSelectedNodeId(node.id)}
                          style={{
                            borderLeft: `4px solid ${theme.color}`,
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              <Icon size={14} color={theme.color} />
                              <span style={{ fontSize: "10.5px", fontWeight: 700, color: theme.color, textTransform: "uppercase" }}>
                                {theme.label}
                              </span>
                            </div>
                            <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.5)" }}>
                              {node.confidence.split(" ")[0]}
                            </span>
                          </div>

                          <div style={{ fontSize: "13.5px", fontWeight: 700, color: "#FFFFFF", margin: "6px 0 4px 0", lineHeight: 1.35 }}>
                            {node.label}
                          </div>

                          <div
                            style={{
                              fontSize: "11.5px",
                              color: "rgba(255,255,255,0.75)",
                              lineHeight: 1.45,
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                            }}
                          >
                            {node.detailed_explanation}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Clean Node Detail Inspector Panel */}
        <div style={{ position: "sticky", top: "84px", maxHeight: "calc(100vh - 108px)", overflowY: "auto" }}>
          {selectedNode ? (
            <div className="card" style={{ boxShadow: "var(--shadow-elevated)" }}>
              <div className="card-header" style={{ alignItems: "flex-start", gap: "12px" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span className="badge badge-neutral" style={{ marginBottom: "6px" }}>
                    Node Inspector
                  </span>
                  <div className="card-title" style={{ fontSize: "16px", lineHeight: 1.35, wordBreak: "break-word" }}>
                    {selectedNode.label}
                  </div>
                  <div className="card-subtitle">
                    Category: {selectedNode.category.replace(/_/g, " ")}
                  </div>
                </div>
                {getDirectionBadge(selectedNode.direction)}
              </div>

              {/* Magnitude & Metric Highlight */}
              <div
                style={{
                  background: "var(--warm-ivory)",
                  borderRadius: "var(--radius-card)",
                  padding: "16px",
                  marginBottom: "18px",
                }}
              >
                <div style={{ fontSize: "11px", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: 600 }}>
                  Affected Metric & Magnitude
                </div>
                <div style={{ fontSize: "20px", fontWeight: 800, color: "var(--text-primary)", margin: "4px 0" }} className="tabular-nums">
                  {selectedNode.magnitude_estimate}
                </div>
                <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                  Primary Metric: <strong>{selectedNode.affected_metric}</strong>
                </div>
              </div>

              {/* Detailed Explanation */}
              <div style={{ marginBottom: "18px" }}>
                <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "6px" }}>
                  Causal Mechanism
                </div>
                <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.6 }}>
                  {selectedNode.detailed_explanation}
                </p>
              </div>

              {/* Evidence & Confidence Metadata */}
              <div
                style={{
                  borderTop: "1px solid var(--border-subtle)",
                  paddingTop: "14px",
                  marginBottom: "18px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                  fontSize: "12px",
                }}
              >
                <div>
                  <span style={{ color: "var(--text-secondary)" }}>Source / Calculation:</span>
                  <div style={{ fontWeight: 600, color: "var(--text-primary)", marginTop: "2px" }}>
                    {selectedNode.source_or_calculation}
                  </div>
                </div>

                <div>
                  <span style={{ color: "var(--text-secondary)" }}>Evidence Confidence:</span>
                  <div style={{ fontWeight: 600, color: "var(--forest-green)", marginTop: "2px" }}>
                    {selectedNode.confidence}
                  </div>
                </div>
              </div>

              {/* Recommended Mitigation Action */}
              {selectedNode.suggested_mitigation && (
                <div
                  style={{
                    background: "var(--risk-moderate-bg)",
                    border: "1px solid #c2decb",
                    borderRadius: "var(--radius-button)",
                    padding: "12px 14px",
                    fontSize: "12.5px",
                    color: "var(--forest-green)",
                  }}
                >
                  <div style={{ fontWeight: 700, marginBottom: "4px", display: "flex", alignItems: "center", gap: "6px" }}>
                    <ShieldCheck size={15} />
                    <span>Mitigation Safeguard</span>
                  </div>
                  <div>{selectedNode.suggested_mitigation}</div>
                </div>
              )}
            </div>
          ) : (
            <div className="card" style={{ textAlign: "center", padding: "40px 20px" }}>
              <div style={{ color: "var(--text-secondary)" }}>Select a node in the causal graph to inspect details.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
