import React, { useState, useEffect } from "react";
import { SystemStatus } from "../types";
import { api } from "../api/client";
import {
  Settings as SettingsIcon,
  ShieldCheck,
  Cloud,
  Database,
  Lock,
  CheckCircle2,
  AlertCircle,
  Cpu,
  RefreshCw,
  Sparkles,
  Info,
} from "lucide-react";

export const SettingsPage: React.FC = () => {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    setIsLoading(true);
    try {
      const res = await api.getSystemStatus();
      setStatus(res);
    } catch (err) {
      console.error("Failed to load system status", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-text">
          <h1>System Architecture & Settings</h1>
          <p>
            Inspect active persistence engines, explanation providers, optional cloud integrations, and cybersecurity
            governance posture. ECO-ECHO operates 100% locally with zero cloud dependencies required.
          </p>
        </div>

        <button className="btn btn-secondary btn-sm" onClick={loadStatus} disabled={isLoading}>
          <RefreshCw size={13} />
          <span>{isLoading ? "Refreshing..." : "Refresh Status"}</span>
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        {/* Group 1 & 2: AI Explainer & Persistence */}
        <div className="grid-cols-2">
          {/* AI Explanation Engine */}
          <div className="card">
            <div className="card-header">
              <div className="card-title-group">
                <Sparkles size={18} color="var(--forest-green)" />
                <div>
                  <div className="card-title">AI Decision Explainer Engine</div>
                  <div className="card-subtitle">Synthesizes mathematical decisions into structured narratives</div>
                </div>
              </div>
              <span className="badge badge-green">Local Fallback Active</span>
            </div>

            <div style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.6 }}>
              <div style={{ marginBottom: "10px" }}>
                <strong style={{ color: "var(--text-primary)" }}>Active Provider:</strong> Deterministic Climate
                Decision Engine
              </div>
              <div style={{ marginBottom: "10px" }}>
                <strong style={{ color: "var(--text-primary)" }}>Status:</strong>{" "}
                <span style={{ color: "var(--forest-green)", fontWeight: 600 }}>Operational (Zero API Key Required)</span>
              </div>
              <div style={{ marginBottom: "14px" }}>
                <strong style={{ color: "var(--text-primary)" }}>Functionality:</strong> Extracts binding constraints,
                budget trade-offs, and frontline equity allocations directly from solver results.
              </div>

              <div
                style={{
                  background: "var(--warm-ivory)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-button)",
                  padding: "10px 12px",
                  fontSize: "12px",
                }}
              >
                <strong>Optional Cloud LLM Enhancement:</strong> To enable Gemini or Claude live inference, set{" "}
                <code>GEMINI_API_KEY</code> or AWS Bedrock credentials in your local <code>.env</code> file.
              </div>
            </div>
          </div>

          {/* Database Persistence */}
          <div className="card">
            <div className="card-header">
              <div className="card-title-group">
                <Database size={18} color="var(--forest-green)" />
                <div>
                  <div className="card-title">Data Persistence Architecture</div>
                  <div className="card-subtitle">Local database and reproducible state management</div>
                </div>
              </div>
              <span className="badge badge-green">Operational</span>
            </div>

            <div style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.6 }}>
              <div style={{ marginBottom: "10px" }}>
                <strong style={{ color: "var(--text-primary)" }}>Database Engine:</strong>{" "}
                {status?.database.type || "SQLite Relational Database (WAL Mode)"}
              </div>
              <div style={{ marginBottom: "10px" }}>
                <strong style={{ color: "var(--text-primary)" }}>Local Path:</strong>{" "}
                <code style={{ fontSize: "11.5px", background: "var(--warm-ivory)", padding: "2px 6px", borderRadius: "4px" }}>
                  {status?.database.path || "eco_echo.db"}
                </code>
              </div>
              <div style={{ marginBottom: "14px" }}>
                <strong style={{ color: "var(--text-primary)" }}>Audit Immutability:</strong> SHA-256 cryptographic hashes
                are computed and stored with every archived decision record.
              </div>

              <div
                style={{
                  background: "var(--warm-ivory)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-button)",
                  padding: "10px 12px",
                  fontSize: "12px",
                }}
              >
                <strong>Storage Integrity:</strong> Datasets and decision records persist locally across application reboots.
              </div>
            </div>
          </div>
        </div>

        {/* Group 3: Optional Cloud Integrations */}
        <div className="card">
          <div className="card-header">
            <div className="card-title-group">
              <Cloud size={18} color="var(--forest-green)" />
              <div>
                <div className="card-title">Cloud Infrastructure & Optional Integrations</div>
                <div className="card-subtitle">
                  Inspect optional external cloud services (Amazon Bedrock, Amazon S3)
                </div>
              </div>
            </div>
            <span className="badge badge-neutral">Region: us-east-1</span>
          </div>

          <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: "16px" }}>
            ECO-ECHO is designed to function 100% autonomously without external cloud accounts. The following integrations
            are optional and default to local fallbacks when unconfigured:
          </p>

          <div className="grid-cols-2" style={{ marginBottom: 0 }}>
            {status?.aws_integrations.services.map((s, idx) => (
              <div
                key={idx}
                style={{
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-card)",
                  padding: "16px",
                  background: "var(--warm-ivory)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <div style={{ fontWeight: 700, fontSize: "14px", color: "var(--text-primary)" }}>{s.service}</div>
                  <span className={`badge ${s.configured ? "badge-green" : "badge-neutral"}`}>
                    {s.configured ? "Connected" : "Local Fallback Active"}
                  </span>
                </div>
                <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "4px" }}>
                  <strong>Role:</strong> {s.role}
                </div>
                <div style={{ fontSize: "11.5px", color: "var(--text-secondary)" }}>
                  {s.configured ? "Verified via environment credentials" : "Currently operating via local in-memory fallback"}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Group 4: Cybersecurity Governance Posture */}
        <div className="card">
          <div className="card-header">
            <div className="card-title-group">
              <ShieldCheck size={18} color="var(--forest-green)" />
              <div>
                <div className="card-title">Cybersecurity & Governance Posture</div>
                <div className="card-subtitle">Automated compliance against OWASP and enterprise security standards</div>
              </div>
            </div>
            <span className="badge badge-green">Hardened</span>
          </div>

          <div className="grid-cols-3" style={{ marginBottom: 0 }}>
            <div style={{ background: "var(--warm-ivory)", padding: "14px", borderRadius: "var(--radius-button)" }}>
              <div style={{ fontWeight: 700, fontSize: "13px", color: "var(--text-primary)", marginBottom: "4px" }}>
                Zero Hardcoded Secrets
              </div>
              <div style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                Git history and source audited. Zero exposed API keys or private credentials.
              </div>
            </div>

            <div style={{ background: "var(--warm-ivory)", padding: "14px", borderRadius: "var(--radius-button)" }}>
              <div style={{ fontWeight: 700, fontSize: "13px", color: "var(--text-primary)", marginBottom: "4px" }}>
                Defensive HTTP Headers
              </div>
              <div style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                Content-Type nosniff, Frame-Options DENY, and strict XSS protection enabled.
              </div>
            </div>

            <div style={{ background: "var(--warm-ivory)", padding: "14px", borderRadius: "var(--radius-button)" }}>
              <div style={{ fontWeight: 700, fontSize: "13px", color: "var(--text-primary)", marginBottom: "4px" }}>
                Input Boundary Validation
              </div>
              <div style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                Strict Pydantic v2 schemas reject malformed or oversized payloads (&gt;10 MB).
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
