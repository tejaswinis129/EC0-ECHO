import React from "react";
import { ShieldCheck, Lock, Database, EyeOff } from "lucide-react";

export const PrivacyPage: React.FC = () => {
  return (
    <div style={{ maxWidth: "800px", margin: "0 auto" }}>
      <div className="page-header" style={{ marginBottom: "24px" }}>
        <div>
          <h1 className="page-title">Privacy Policy</h1>
          <p className="page-description">
            Commitment to local-first processing, transparent data handling, and absence of user surveillance.
          </p>
        </div>
      </div>

      <div className="card" style={{ display: "flex", flexDirection: "column", gap: "20px", fontSize: "14px", lineHeight: 1.7, color: "var(--slate-700)" }}>
        <div>
          <h2 style={{ fontSize: "16px", fontWeight: 700, color: "var(--slate-900)", marginBottom: "6px" }}>
            1. Overview & Data Ownership
          </h2>
          <p>
            ECO-ECHO is an open-source urban sustainability decision engine designed for municipal planners, researchers, and public-sector teams.
            All datasets uploaded to the application remain the exclusive property of the user or publishing municipal agency.
          </p>
        </div>

        <div>
          <h2 style={{ fontSize: "16px", fontWeight: 700, color: "var(--slate-900)", marginBottom: "6px" }}>
            2. Local-First Processing
          </h2>
          <p>
            By default, ECO-ECHO executes entirely on the local server without transmitting uploaded municipal datasets or calculations
            to third-party services. All optimization routines, risk scores, and consequence chain graphs are synthesized in-memory and stored
            in a local relational SQLite database.
          </p>
        </div>

        <div>
          <h2 style={{ fontSize: "16px", fontWeight: 700, color: "var(--slate-900)", marginBottom: "6px" }}>
            3. Optional Cloud & AI Integrations
          </h2>
          <p>
            If a user explicitly provides AWS credentials in the configuration file, ECO-ECHO can optionally query Amazon Bedrock for natural
            language explanations. Only structured, non-identifiable numerical summaries (budget caps, runoff diverted, district counts) are
            transmitted to the model. ECO-ECHO does not transmit personally identifiable information (PII).
          </p>
        </div>

        <div>
          <h2 style={{ fontSize: "16px", fontWeight: 700, color: "var(--slate-900)", marginBottom: "6px" }}>
            4. No Tracking & No Advertising
          </h2>
          <p>
            ECO-ECHO contains zero third-party advertising trackers, cross-site cookies, or surveillance telemetry scripts.
          </p>
        </div>

        <div>
          <h2 style={{ fontSize: "16px", fontWeight: 700, color: "var(--slate-900)", marginBottom: "6px" }}>
            5. Data Retention & Deletion
          </h2>
          <p>
            Decision records and custom datasets are retained in the local SQLite database until deleted by the user.
            To remove all saved data, simply delete the local <code>eco_echo.db</code> file.
          </p>
        </div>
      </div>
    </div>
  );
};
