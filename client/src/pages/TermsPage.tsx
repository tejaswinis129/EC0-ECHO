import React from "react";
import { AlertCircle, FileCheck, Scale } from "lucide-react";

export const TermsPage: React.FC = () => {
  return (
    <div style={{ maxWidth: "800px", margin: "0 auto" }}>
      <div className="page-header" style={{ marginBottom: "24px" }}>
        <div>
          <h1 className="page-title">Terms of Use & Planning Disclaimer</h1>
          <p className="page-description">
            Advisory nature of computational recommendations and engineering review requirements.
          </p>
        </div>
      </div>

      <div className="card" style={{ display: "flex", flexDirection: "column", gap: "20px", fontSize: "14px", lineHeight: 1.7, color: "var(--slate-700)" }}>
        <div
          style={{
            background: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: "var(--radius-md)",
            padding: "16px",
            color: "#991b1b",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 700, marginBottom: "4px" }}>
            <AlertCircle size={16} />
            CRITICAL PLANNING DISCLAIMER
          </div>
          <div>
            ECO-ECHO recommendations are heuristic computational decision-support outputs designed to aid preliminary urban planning.
            They do not constitute certified civil, structural, geotechnical, or hydrological engineering designs. Formal licensed professional
            review and environmental impact assessments are mandatory prior to physical construction or public capital appropriation.
          </div>
        </div>

        <div>
          <h2 style={{ fontSize: "16px", fontWeight: 700, color: "var(--slate-900)", marginBottom: "6px" }}>
            1. Scope of Use
          </h2>
          <p>
            ECO-ECHO is intended for municipal planning agencies, academic researchers, sustainability advocates, and engineering students
            to explore multi-objective trade-offs between climate hazards (heat, flooding, water scarcity) and intervention costs.
          </p>
        </div>

        <div>
          <h2 style={{ fontSize: "16px", fontWeight: 700, color: "var(--slate-900)", marginBottom: "6px" }}>
            2. Heuristic Models & Simplifications
          </h2>
          <p>
            The risk indices, linear optimization models, and consequence chains rely on documented scientific benchmarks (e.g. EPA, CIRIA, USDA Forest Service).
            These models simplify complex environmental phenomena and should be calibrated against local field monitoring data whenever available.
          </p>
        </div>

        <div>
          <h2 style={{ fontSize: "16px", fontWeight: 700, color: "var(--slate-900)", marginBottom: "6px" }}>
            3. Social Equity Metrics
          </h2>
          <p>
            The Social Vulnerability Index (SVI) is an aggregate spatial screening indicator. It is provided strictly to guide equitable public
            resource allocation and must never be utilized to infer sensitive personal characteristics or profile individual households.
          </p>
        </div>

        <div>
          <h2 style={{ fontSize: "16px", fontWeight: 700, color: "var(--slate-900)", marginBottom: "6px" }}>
            4. Limitation of Liability
          </h2>
          <p>
            The developers and contributors of ECO-ECHO accept no liability for municipal fiscal commitments, construction failures,
            drainage overtopping, or unforeseen environmental consequences arising from decisions made in connection with this tool.
          </p>
        </div>
      </div>
    </div>
  );
};
