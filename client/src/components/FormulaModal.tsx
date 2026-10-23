import React from "react";
import { FormulaDocumentation } from "../types";
import { X, BookOpen, AlertCircle } from "lucide-react";

interface FormulaModalProps {
  isOpen: boolean;
  onClose: () => void;
  formulas: FormulaDocumentation[];
  limitations: string[];
}

export const FormulaModal: React.FC<FormulaModalProps> = ({
  isOpen,
  onClose,
  formulas,
  limitations,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <BookOpen size={20} color="var(--primary-700)" />
            <h2 style={{ fontSize: "20px", fontWeight: 800, color: "var(--slate-900)" }}>
              Transparent Scientific Formulas & Limitations
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--slate-400)",
              padding: "4px",
            }}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ fontSize: "13px", color: "var(--slate-600)", lineHeight: 1.6, marginBottom: "24px" }}>
          ECO-ECHO strictly adheres to transparent mathematical formulas and scientific benchmarking.
          Composite scores are never aggregated blindly without explicit documentation of inputs, weights, and normalisation methods.
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {formulas.map((f, i) => (
            <div
              key={i}
              style={{
                background: "var(--slate-50)",
                border: "1px solid var(--slate-200)",
                borderRadius: "var(--radius-md)",
                padding: "18px",
              }}
            >
              <div style={{ fontSize: "15px", fontWeight: 700, color: "var(--slate-900)", marginBottom: "4px" }}>
                {f.indicator_name}
              </div>
              <div style={{ fontSize: "12px", color: "var(--slate-600)", marginBottom: "12px" }}>
                {f.description}
              </div>

              <div
                style={{
                  background: "var(--slate-900)",
                  color: "#34d399",
                  padding: "10px 14px",
                  borderRadius: "6px",
                  fontFamily: "var(--font-mono)",
                  fontSize: "12px",
                  overflowX: "auto",
                  marginBottom: "12px",
                }}
              >
                {f.mathematical_formula}
              </div>

              <div style={{ fontSize: "12px", color: "var(--slate-700)", lineHeight: 1.6 }}>
                <div>
                  <strong>Input Data Variables:</strong> {f.inputs.join(", ")}
                </div>
                <div style={{ marginTop: "2px" }}>
                  <strong>Normalisation Method:</strong> {f.normalisation_method}
                </div>
                <div style={{ marginTop: "6px", color: "var(--amber-600)" }}>
                  <strong>Scientific Limitations:</strong> {f.scientific_limitations}
                </div>
              </div>
            </div>
          ))}
        </div>

        {limitations.length > 0 && (
          <div
            style={{
              marginTop: "24px",
              background: "#fffbeb",
              border: "1px solid #fde68a",
              borderRadius: "var(--radius-md)",
              padding: "16px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: 700, color: "#92400e" }}>
              <AlertCircle size={16} />
              General System Boundaries & Methodological Limitations
            </div>
            <ul style={{ paddingLeft: "20px", marginTop: "8px", fontSize: "12px", color: "#78350f", lineHeight: 1.6 }}>
              {limitations.map((l, i) => (
                <li key={i}>{l}</li>
              ))}
            </ul>
          </div>
        )}

        <div style={{ marginTop: "24px", textAlign: "right" }}>
          <button className="btn btn-primary" onClick={onClose}>
            Close Formula Reference
          </button>
        </div>
      </div>
    </div>
  );
};
