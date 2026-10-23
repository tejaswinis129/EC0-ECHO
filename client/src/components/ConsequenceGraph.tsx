import React, { useState } from "react";
import { ConsequenceChainGraph, ConsequenceNode } from "../types";
import {
  ChevronRight,
  TrendingUp,
  TrendingDown,
  HelpCircle,
  ShieldCheck,
  CheckCircle2,
  Info,
  DollarSign,
  Droplet,
  Sun,
  Users,
  AlertTriangle,
  FileText,
} from "lucide-react";

interface ConsequenceGraphProps {
  graph: ConsequenceChainGraph;
}

export const ConsequenceGraph: React.FC<ConsequenceGraphProps> = ({ graph }) => {
  const [selectedNode, setSelectedNode] = useState<ConsequenceNode>(graph.nodes[0]);
  const [expandedNodeIds, setExpandedNodeIds] = useState<Set<string>>(new Set(["node-0-root", "node-3-water", "node-7-mitigation"]));

  const toggleExpand = (id: string) => {
    const next = new Set(expandedNodeIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setExpandedNodeIds(next);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "root_intervention":
        return <CheckCircle2 size={16} color="var(--primary-700)" />;
      case "environmental_benefit":
        return <Sun size={16} color="var(--amber-600)" />;
      case "water_consequence":
        return <Droplet size={16} color="var(--sky-600)" />;
      case "financial_consequence":
        return <DollarSign size={16} color="var(--slate-700)" />;
      case "social_equity_consequence":
        return <Users size={16} color="#7c3aed" />;
      case "scenario_vulnerability":
        return <AlertTriangle size={16} color="var(--amber-600)" />;
      case "suggested_mitigation":
        return <ShieldCheck size={16} color="var(--primary-600)" />;
      default:
        return <Info size={16} color="var(--slate-500)" />;
    }
  };

  const getDirectionBadge = (dir: string) => {
    if (dir === "positive") {
      return (
        <span className="badge badge-green">
          <TrendingUp size={11} />
          Positive Benefit
        </span>
      );
    }
    if (dir === "negative") {
      return (
        <span className="badge badge-red">
          <TrendingDown size={11} />
          Resource / Cost Burden
        </span>
      );
    }
    return (
      <span className="badge badge-amber">
        <HelpCircle size={11} />
        Uncertain / Contextual
      </span>
    );
  };

  return (
    <div>
      {/* Top Banner Overview */}
      <div
        style={{
          background: "linear-gradient(to right, #ecfdf5, #f0fdf4)",
          border: "1px solid #a7f3d0",
          borderRadius: "var(--radius-lg)",
          padding: "20px 24px",
          marginBottom: "24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <span className="badge badge-green" style={{ marginBottom: "6px" }}>
            ECO-ECHO Signature Feature
          </span>
          <h2 style={{ fontSize: "20px", fontWeight: 800, color: "var(--slate-900)" }}>
            Consequence Chain: {graph.intervention_name}
          </h2>
          <div style={{ fontSize: "13px", color: "var(--slate-600)", marginTop: "2px" }}>
            Tracing direct outcomes, water tradeoffs, lifecycle finances, equity dynamics, and scenario mitigations.
          </div>
        </div>

        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "11px", color: "var(--slate-500)", textTransform: "uppercase", fontWeight: 600 }}>
              Deployment Scale
            </div>
            <div style={{ fontSize: "18px", fontWeight: 800, color: "var(--primary-800)" }}>
              {graph.units_deployed.toLocaleString()} units
            </div>
          </div>
          {graph.active_scenario_impacts && (
            <span className="badge badge-amber" style={{ padding: "6px 12px" }}>
              Active Scenario: {graph.active_scenario_impacts.toUpperCase()}
            </span>
          )}
        </div>
      </div>

      <div className="grid-2" style={{ alignItems: "start" }}>
        {/* Left: Interactive Tree View */}
        <div className="consequence-tree-container">
          <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--slate-500)", marginBottom: "16px", textTransform: "uppercase" }}>
            Traceable Causal Sequence ({graph.nodes.length} Nodes)
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {graph.nodes.map((node) => {
              const isSelected = selectedNode.id === node.id;
              const isExpanded = expandedNodeIds.has(node.id);

              return (
                <div
                  key={node.id}
                  className={`chain-node ${node.category.split("_")[0]} ${isSelected ? "selected" : ""}`}
                  onClick={() => setSelectedNode(node)}
                  style={{
                    marginLeft: `${node.depth_level * 18}px`,
                    borderColor: isSelected ? "var(--primary-600)" : undefined,
                    boxShadow: isSelected ? "0 0 0 2px rgba(5, 150, 105, 0.2)" : undefined,
                    cursor: "pointer",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      {getCategoryIcon(node.category)}
                      <div>
                        <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--slate-500)", textTransform: "uppercase" }}>
                          {node.category.replace(/_/g, " ")}
                        </div>
                        <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--slate-900)" }}>
                          {node.label}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      {getDirectionBadge(node.direction)}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleExpand(node.id);
                        }}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "var(--slate-400)",
                        }}
                      >
                        <ChevronRight
                          size={16}
                          style={{
                            transform: isExpanded ? "rotate(90deg)" : "none",
                            transition: "transform 0.15s ease",
                          }}
                        />
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div
                      style={{
                        marginTop: "12px",
                        paddingTop: "12px",
                        borderTop: "1px solid var(--slate-100)",
                        fontSize: "12px",
                        color: "var(--slate-600)",
                        lineHeight: 1.6,
                      }}
                    >
                      <div style={{ marginBottom: "6px" }}>{node.detailed_explanation}</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", fontSize: "11px", color: "var(--slate-500)", marginTop: "8px" }}>
                        <span>
                          <strong>Metric:</strong> {node.affected_metric}
                        </span>
                        <span>
                          <strong>Magnitude:</strong> {node.magnitude_estimate}
                        </span>
                        <span>
                          <strong>Evidence Confidence:</strong> {node.confidence}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Deep Evidence & Mitigation Inspector */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {selectedNode && (
            <div className="card">
              <div className="card-header">
                <div>
                  <span className="badge badge-slate" style={{ textTransform: "uppercase", marginBottom: "4px" }}>
                    Node Inspector
                  </span>
                  <div className="card-title" style={{ fontSize: "18px" }}>
                    {selectedNode.label}
                  </div>
                </div>
                {getDirectionBadge(selectedNode.direction)}
              </div>

              <div style={{ fontSize: "13px", color: "var(--slate-700)", lineHeight: 1.7, marginBottom: "20px" }}>
                {selectedNode.detailed_explanation}
              </div>

              <div style={{ background: "var(--slate-50)", padding: "16px", borderRadius: "8px", border: "1px solid var(--slate-200)", marginBottom: "20px" }}>
                <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--slate-700)", marginBottom: "8px" }}>
                  EVIDENCE PROVENANCE & METHODOLOGY
                </div>
                <div style={{ fontSize: "12px", color: "var(--slate-600)", lineHeight: 1.6 }}>
                  <div>
                    <strong>Calculation / Method:</strong> {selectedNode.source_or_calculation}
                  </div>
                  <div style={{ marginTop: "4px" }}>
                    <strong>Scientific Confidence:</strong>{" "}
                    <span
                      style={{
                        fontWeight: 600,
                        color: selectedNode.confidence === "Measured / Empirical" ? "var(--primary-700)" : "var(--amber-600)",
                      }}
                    >
                      {selectedNode.confidence}
                    </span>
                  </div>
                  <div style={{ marginTop: "4px" }}>
                    <strong>Affected Indicator:</strong> {selectedNode.affected_metric}
                  </div>
                  <div style={{ marginTop: "4px" }}>
                    <strong>Estimated Magnitude:</strong> {selectedNode.magnitude_estimate}
                  </div>
                </div>
              </div>

              {selectedNode.suggested_mitigation && (
                <div
                  style={{
                    background: "#ecfdf5",
                    border: "1px solid #a7f3d0",
                    borderRadius: "8px",
                    padding: "16px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: 700, color: "var(--primary-800)" }}>
                    <ShieldCheck size={16} />
                    Recommended Engineering Mitigation
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--primary-900)", marginTop: "6px", lineHeight: 1.6 }}>
                    {selectedNode.suggested_mitigation}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Unintended Consequences & Trade-offs Summary */}
          <div className="card">
            <div className="card-title" style={{ color: "#b91c1c" }}>
              <AlertTriangle size={18} />
              <span>Unintended Trade-offs & Critical Vulnerabilities</span>
            </div>
            <ul style={{ paddingLeft: "20px", marginTop: "12px", fontSize: "13px", color: "var(--slate-700)", lineHeight: 1.6 }}>
              {graph.unintended_tradeoffs_summary.map((u, i) => (
                <li key={i} style={{ marginBottom: "6px" }}>
                  {u}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
