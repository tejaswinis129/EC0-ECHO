import React from "react";
import { FormulaDocumentation } from "../types";
import { X, BookOpen, AlertCircle } from "lucide-react";

interface FormulaModalProps {
  isOpen?: boolean;
  onClose: () => void;
  formulas?: FormulaDocumentation[];
  limitations?: string[];
}

const defaultFormulas: FormulaDocumentation[] = [
  {
    indicator_name: "Urban Heat Island Exposure Index (HII)",
    description: "Evaluates surface thermal anomaly scaled by lack of mitigating tree canopy and impervious cover fraction.",
    mathematical_formula: "HII = 0.5 * [(T_surface - T_baseline) / 10] + 0.3 * (Impervious% / 100) + 0.2 * (1 - Canopy% / 100)",
    inputs: ["surface_temp_c", "baseline_temp_c", "impervious_surface_pct", "tree_canopy_pct"],
    normalisation_method: "Min-Max linear normalization bounded to [0, 100]",
    scientific_limitations: "Assumes homogeneous ambient air-surface thermal coupling; does not account for wind ventilation corridors.",
  },
  {
    indicator_name: "Extreme Inundation Flood Risk (FRI)",
    description: "Calculates runoff surplus volume exceeding drainage capacity during a 24-hour design storm event.",
    mathematical_formula: "FRI = min(100, max(0, [(Runoff_m3 - DrainageCap_m3) / DrainageCap_m3] * 100))",
    inputs: ["extreme_rainfall_runoff_m3", "drainage_capacity_m3", "annual_rainfall_mm"],
    normalisation_method: "Capacity ratio thresholding with asymptotic curve",
    scientific_limitations: "Assumes steady-state peak runoff volume without modeling dynamic hydrodynamic backwater effects.",
  },
  {
    indicator_name: "Municipal Water Deficit Stress (WSI)",
    description: "Rationing stress metric evaluating utility water demand surplus relative to sustainable supply buffers.",
    mathematical_formula: "WSI = (WaterDemand_m3_day / WaterSupply_m3_day) * 50",
    inputs: ["water_demand_m3_day", "water_supply_m3_day"],
    normalisation_method: "1.0 ratio maps to baseline score of 50; ratios > 2.0 capped at 100",
    scientific_limitations: "Does not differentiate between potable domestic demand vs. industrial cooling demand.",
  },
  {
    indicator_name: "Social Vulnerability & Green Equity Gap (SVI)",
    description: "Aggregated vulnerability index identifying frontline communities with low park access and disproportionate elderly/infant population.",
    mathematical_formula: "SVI = 0.4 * (1 - ParkAccess% / 100) + 0.3 * (SocioeconomicDeprivation) + 0.3 * (AgeVulnerability%)",
    inputs: ["park_access_pct", "social_vulnerability_index"],
    normalisation_method: "Centile ranking against municipal baseline",
    scientific_limitations: "Relies on census tract boundaries that may not capture hyper-local street-level demographic micro-variations.",
  },
];

const defaultLimitations: string[] = [
  "Linear optimization models approximate real-world non-linear microclimate feedback loops.",
  "Calculations are intended for municipal master planning prioritization, not certified civil engineering structural sign-offs.",
  "Tree canopy cooling impacts require a 3–5 year post-planting establishment period before reaching full thermal ROI.",
];

export const FormulaModal: React.FC<FormulaModalProps> = ({
  isOpen = true,
  onClose,
  formulas = defaultFormulas,
  limitations = defaultLimitations,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ padding: "28px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <BookOpen size={20} color="var(--forest-green)" />
            <h2 style={{ fontSize: "18px", fontWeight: 800, color: "var(--text-primary)" }}>
              Transparent Scientific Formulas & Limitations
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--text-secondary)",
              padding: "4px",
            }}
          >
            <X size={20} />
          </button>
        </div>

        <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: "20px" }}>
          ECO-ECHO strictly adheres to transparent mathematical models. Composite scores are never black-boxed
          without full documentation of inputs, weights, and limitations.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {formulas.map((f, i) => (
            <div
              key={i}
              style={{
                background: "var(--warm-ivory)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-card)",
                padding: "16px",
              }}
            >
              <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "4px" }}>
                {f.indicator_name}
              </div>
              <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "10px" }}>
                {f.description}
              </div>

              <div
                style={{
                  background: "var(--deep-green)",
                  color: "var(--lime-accent)",
                  padding: "10px 12px",
                  borderRadius: "var(--radius-button)",
                  fontFamily: "var(--font-mono)",
                  fontSize: "11.5px",
                  overflowX: "auto",
                  marginBottom: "10px",
                }}
              >
                {f.mathematical_formula}
              </div>

              <div style={{ fontSize: "11.5px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                <div>
                  <strong>Input Variables:</strong> {f.inputs.join(", ")}
                </div>
                <div style={{ marginTop: "2px" }}>
                  <strong>Normalisation Method:</strong> {f.normalisation_method}
                </div>
                <div style={{ marginTop: "4px", color: "var(--risk-elevated)" }}>
                  <strong>Scientific Limitations:</strong> {f.scientific_limitations}
                </div>
              </div>
            </div>
          ))}
        </div>

        {limitations.length > 0 && (
          <div
            style={{
              marginTop: "20px",
              background: "var(--risk-elevated-bg)",
              border: "1px solid #ebd3c2",
              borderRadius: "var(--radius-button)",
              padding: "14px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12.5px", fontWeight: 700, color: "var(--risk-elevated)" }}>
              <AlertCircle size={15} />
              <span>General System Boundaries & Methodological Limitations</span>
            </div>
            <ul style={{ paddingLeft: "18px", marginTop: "6px", fontSize: "11.5px", color: "var(--text-primary)", lineHeight: 1.6 }}>
              {limitations.map((l, i) => (
                <li key={i}>{l}</li>
              ))}
            </ul>
          </div>
        )}

        <div style={{ marginTop: "20px", textAlign: "right" }}>
          <button className="btn btn-primary btn-sm" onClick={onClose}>
            Close Reference
          </button>
        </div>
      </div>
    </div>
  );
};
