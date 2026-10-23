import React from "react";
import { DecisionExplanation } from "../types";
import { Bot, CheckCircle, AlertTriangle, HelpCircle, ClipboardList, Shield } from "lucide-react";

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
    <div className="card" style={{ borderLeft: "5px solid var(--primary-600)" }}>
      <div className="card-header">
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              background: "var(--primary-100)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--primary-800)",
            }}
          >
            <Bot size={18} />
          </div>
          <div>
            <div className="card-title">AI Decision Explainer</div>
            <div style={{ fontSize: "11px", color: "var(--slate-500)" }}>
              Provider: {explanation.provider} {explanation.is_fallback ? "(Deterministic Fallback Engine)" : "(Cloud Inference)"}
            </div>
          </div>
        </div>

        {onRefresh && (
          <button className="btn btn-secondary btn-sm" onClick={onRefresh} disabled={isLoading}>
            {isLoading ? "Generating..." : "Re-explain"}
          </button>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
        {/* Executive Summary */}
        <div
          style={{
            background: "var(--slate-50)",
            padding: "16px",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--slate-200)",
            fontSize: "13px",
            color: "var(--slate-800)",
            lineHeight: 1.7,
          }}
        >
          <div style={{ fontWeight: 700, color: "var(--slate-900)", marginBottom: "4px" }}>
            EXECUTIVE SYNTHESIS
          </div>
          {explanation.executive_summary}
        </div>

        <div className="grid-2">
          {/* Why Selected & Constraints */}
          <div>
            <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--slate-900)", marginBottom: "6px", display: "flex", alignItems: "center", gap: "6px" }}>
              <CheckCircle size={15} color="var(--primary-600)" />
              Rationale & Constraint Dynamics
            </div>
            <div style={{ fontSize: "12px", color: "var(--slate-700)", lineHeight: 1.6, whiteSpace: "pre-line" }}>
              {explanation.why_selected}
            </div>

            <div style={{ marginTop: "12px", fontSize: "12px", color: "var(--slate-600)", background: "#f8fafc", padding: "12px", borderRadius: "6px", border: "1px solid #e2e8f0", whiteSpace: "pre-line" }}>
              <strong>Binding Bottlenecks:</strong>
              {"\n" + explanation.binding_constraints_analysis}
            </div>
          </div>

          {/* Equity & Vulnerabilities */}
          <div>
            <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--slate-900)", marginBottom: "6px", display: "flex", alignItems: "center", gap: "6px" }}>
              <Shield size={15} color="#7c3aed" />
              Frontline District Equity
            </div>
            <div style={{ fontSize: "12px", color: "var(--slate-700)", lineHeight: 1.6, whiteSpace: "pre-line" }}>
              {explanation.neighbourhood_equity_analysis}
            </div>

            <div style={{ marginTop: "12px", fontSize: "12px", color: "#991b1b", background: "#fef2f2", padding: "12px", borderRadius: "6px", border: "1px solid #fecaca", whiteSpace: "pre-line" }}>
              <strong style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <AlertTriangle size={13} /> Critical Vulnerabilities:
              </strong>
              {"\n" + explanation.what_could_go_wrong}
            </div>
          </div>
        </div>

        {/* Pre-construction Checklist */}
        {explanation.priority_investigations_before_build.length > 0 && (
          <div
            style={{
              background: "#ecfdf5",
              border: "1px solid #a7f3d0",
              borderRadius: "var(--radius-md)",
              padding: "16px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: 700, color: "var(--primary-800)", marginBottom: "8px" }}>
              <ClipboardList size={16} />
              Recommended Planning & Engineering Inquiries Prior to Groundbreaking
            </div>
            <ul style={{ paddingLeft: "20px", fontSize: "12px", color: "var(--primary-900)", lineHeight: 1.6 }}>
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
