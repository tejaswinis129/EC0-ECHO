import React from "react";
import { DecisionExplanation } from "../types";
import { Sparkles, CheckCircle, AlertTriangle, ClipboardList, Shield } from "lucide-react";

interface DecisionExplainerProps {
  explanation: DecisionExplanation;
  onRefresh?: () => void;
  isLoading?: boolean;
}

export const DecisionExplainer: React.FC<DecisionExplainerProps> = ({
  explanation,
  onRefresh,
  isLoading,
}) => {
  return (
    <div className="card" style={{ borderLeft: "4px solid var(--forest-green)" }}>
      <div className="card-header">
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "var(--radius-button)",
              background: "var(--warm-ivory)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--forest-green)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <Sparkles size={16} />
          </div>
          <div>
            <div className="card-title">Decision Rationale & Trade-off Explainer</div>
            <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
              Provider: {explanation.provider} {explanation.is_fallback ? "(Deterministic Reasoning Engine)" : "(LLM Cloud Engine)"}
            </div>
          </div>
        </div>

        {onRefresh && (
          <button className="btn btn-secondary btn-sm" onClick={onRefresh} disabled={isLoading}>
            {isLoading ? "Generating..." : "Re-explain"}
          </button>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {/* Executive Summary */}
        <div
          style={{
            background: "var(--warm-ivory)",
            padding: "16px",
            borderRadius: "var(--radius-button)",
            border: "1px solid var(--border-subtle)",
            fontSize: "13px",
            color: "var(--text-primary)",
            lineHeight: 1.6,
          }}
        >
          <div style={{ fontWeight: 700, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--forest-green)", marginBottom: "4px" }}>
            Executive Synthesis
          </div>
          {explanation.executive_summary}
        </div>

        <div className="grid-cols-2" style={{ marginBottom: 0 }}>
          {/* Why Selected & Constraints */}
          <div>
            <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "6px", display: "flex", alignItems: "center", gap: "6px" }}>
              <CheckCircle size={15} color="var(--risk-moderate)" />
              Rationale & Constraints
            </div>
            <div style={{ fontSize: "12.5px", color: "var(--text-secondary)", lineHeight: 1.6, whiteSpace: "pre-line" }}>
              {explanation.why_selected}
            </div>

            <div
              style={{
                marginTop: "12px",
                fontSize: "12px",
                color: "var(--text-secondary)",
                background: "var(--warm-ivory)",
                padding: "12px",
                borderRadius: "var(--radius-button)",
                border: "1px solid var(--border-subtle)",
                whiteSpace: "pre-line",
              }}
            >
              <strong>Binding Bottlenecks:</strong>
              {"\n" + explanation.binding_constraints_analysis}
            </div>
          </div>

          {/* Equity & Vulnerabilities */}
          <div>
            <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "6px", display: "flex", alignItems: "center", gap: "6px" }}>
              <Shield size={15} color="var(--forest-green)" />
              Frontline District Equity
            </div>
            <div style={{ fontSize: "12.5px", color: "var(--text-secondary)", lineHeight: 1.6, whiteSpace: "pre-line" }}>
              {explanation.neighbourhood_equity_analysis}
            </div>

            <div
              style={{
                marginTop: "12px",
                fontSize: "12px",
                color: "var(--risk-severe)",
                background: "var(--risk-severe-bg)",
                padding: "12px",
                borderRadius: "var(--radius-button)",
                border: "1px solid #f3cbc8",
                whiteSpace: "pre-line",
              }}
            >
              <strong style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <AlertTriangle size={13} /> Critical Vulnerabilities:
              </strong>
              {"\n" + explanation.what_could_go_wrong}
            </div>
          </div>
        </div>

        {/* Pre-construction Inquiries */}
        {explanation.priority_investigations_before_build.length > 0 && (
          <div
            style={{
              background: "var(--risk-moderate-bg)",
              border: "1px solid #c2decb",
              borderRadius: "var(--radius-button)",
              padding: "16px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12.5px", fontWeight: 700, color: "var(--forest-green)", marginBottom: "8px" }}>
              <ClipboardList size={16} />
              Recommended Planning & Engineering Inquiries Prior to Groundbreaking
            </div>
            <ul style={{ paddingLeft: "20px", fontSize: "12px", color: "var(--forest-green)", lineHeight: 1.6 }}>
              {explanation.priority_investigations_before_build.map((item, idx) => (
                <li key={idx} style={{ marginBottom: "4px" }}>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
