import React, { useState, useEffect } from "react";
import { SystemStatus } from "../types";
import { api } from "../api/client";
import {
  Settings,
  ShieldCheck,
  Cloud,
  Database,
  Lock,
  CheckCircle2,
  AlertCircle,
  Cpu,
  RefreshCw,
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
      <div className="page-header">
        <div>
          <h1 className="page-title">System Architecture & Cloud Settings</h1>
          <p className="page-description">
            Inspect active persistence layers, cloud integration statuses (Amazon Bedrock, Amazon S3), and security audit posture.
          </p>
        </div>

        <button className="btn btn-secondary" onClick={loadStatus} disabled={isLoading}>
          <RefreshCw size={14} />
          <span>Refresh Status</span>
        </button>
      </div>

      <div className="grid-2">
        {/* Persistence & Architecture */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Database size={18} color="var(--primary-700)" />
              <span>Data Persistence Architecture</span>
            </div>
          </div>

          <div style={{ fontSize: "13px", color: "var(--slate-700)", lineHeight: 1.6 }}>
            <div style={{ marginBottom: "12px" }}>
              <strong>Database Engine:</strong> {status?.database.type || "SQLite Relational Database"}
            </div>
            <div style={{ marginBottom: "12px" }}>
              <strong>Operational Status:</strong>{" "}
              <span className="badge badge-green">
                <CheckCircle2 size={12} />
                {status?.database.status || "Operational"}
              </span>
            </div>
            <div style={{ marginBottom: "12px", wordBreak: "break-all" }}>
              <strong>Storage Path:</strong>{" "}
              <code style={{ fontSize: "11px", background: "var(--slate-100)", padding: "2px 6px", borderRadius: "4px" }}>
                {status?.database.path || "eco_echo.db"}
              </code>
            </div>
            <div style={{ fontSize: "12px", color: "var(--slate-500)", borderTop: "1px solid var(--slate-200)", paddingTop: "12px" }}>
              Stores uploaded municipal datasets, parameter configurations, stress test scenarios, and reproducible audit records with cryptographic SHA-256 hashes.
            </div>
          </div>
        </div>

        {/* Security & Access Posture */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <ShieldCheck size={18} color="var(--primary-700)" />
              <span>Security & Access Posture</span>
            </div>
            <span className="badge badge-green">Hardened</span>
          </div>

          <div style={{ fontSize: "13px", color: "var(--slate-700)", lineHeight: 1.7 }}>
            <div>• <strong>No Hardcoded Secrets:</strong> Checked Git history and configuration files. Zero credential leaks.</div>
            <div>• <strong>Defensive Headers:</strong> Content-Type-Options (nosniff), Frame-Options (DENY), XSS Protection enabled.</div>
            <div>• <strong>Request Size Boundaries:</strong> Enforced 10 MB upload ceiling with automatic 413 rejection.</div>
            <div>• <strong>Rate Limiting:</strong> In-memory sliding window rate-limiting applied on all API endpoints.</div>
            <div>• <strong>Input Sanitisation:</strong> Strict Pydantic models validate every request payload server-side.</div>
          </div>
        </div>
      </div>

      {/* AWS Cloud Integrations Review */}
      <div className="card" style={{ marginTop: "24px" }}>
        <div className="card-header">
          <div className="card-title">
            <Cloud size={18} color="var(--primary-700)" />
            <span>AWS Cloud Service Integrations & Local Fallbacks</span>
          </div>
          <span className="badge badge-slate">
            Region: {status?.aws_integrations.aws_region || "us-east-1"}
          </span>
        </div>

        <div style={{ fontSize: "13px", color: "var(--slate-600)", marginBottom: "18px", lineHeight: 1.6 }}>
          {status?.aws_integrations.governance_note ||
            "ECO-ECHO is designed to be 100% functional locally without requiring AWS credentials or paid subscriptions."}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "16px" }}>
          {status?.aws_integrations.services.map((s, idx) => (
            <div
              key={idx}
              style={{
                border: "1px solid var(--slate-200)",
                borderRadius: "var(--radius-md)",
                padding: "16px",
                background: s.configured ? "var(--primary-50)" : "var(--slate-50)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <div style={{ fontWeight: 700, fontSize: "14px", color: "var(--slate-900)" }}>{s.service}</div>
                <span className={`badge ${s.configured ? "badge-green" : "badge-slate"}`}>
                  {s.status}
                </span>
              </div>
              <div style={{ fontSize: "12px", color: "var(--slate-600)", marginBottom: "8px" }}>
                <strong>Role:</strong> {s.role}
              </div>
              {s.model_id && (
                <div style={{ fontSize: "11px", color: "var(--slate-500)" }}>
                  <strong>Model ID:</strong> {s.model_id}
                </div>
              )}
              {s.bucket && (
                <div style={{ fontSize: "11px", color: "var(--slate-500)" }}>
                  <strong>Bucket:</strong> {s.bucket}
                </div>
              )}
            </div>
          ))}
        </div>

        <div
          style={{
            marginTop: "20px",
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: "6px",
            padding: "16px",
            fontSize: "12px",
            color: "var(--slate-700)",
            lineHeight: 1.6,
          }}
        >
          <strong>To enable AWS Bedrock or Amazon S3:</strong>
          <br />
          Create a <code>.env</code> file in the repository root or configure your environment variables:
          <pre
            style={{
              background: "var(--slate-900)",
              color: "#34d399",
              padding: "10px 12px",
              borderRadius: "4px",
              marginTop: "8px",
              fontFamily: "var(--font-mono)",
            }}
          >
{`AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
USE_AWS_BEDROCK=true
AWS_BEDROCK_MODEL_ID=anthropic.claude-3-sonnet-20240229-v1:0
USE_AWS_S3=false`}
          </pre>
        </div>
      </div>
    </div>
  );
};
