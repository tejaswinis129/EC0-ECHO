import React, { useState, useEffect } from "react";
import { DecisionRecord, AlternativePortfolio, OptimisationRequest } from "../types";
import { api } from "../api/client";
import {
  FileText,
  Download,
  Save,
  CheckCircle2,
  Database,
  Hash,
  Printer,
  FileSpreadsheet,
  ShieldCheck,
  Calendar,
} from "lucide-react";

interface ReportsPageProps {
  activeDatasetId: string;
}

export const ReportsPage: React.FC<ReportsPageProps> = ({ activeDatasetId }) => {
  const [savedRecords, setSavedRecords] = useState<any[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<DecisionRecord | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  useEffect(() => {
    loadSavedRecords();
  }, []);

  const loadSavedRecords = async () => {
    try {
      const list = await api.listDecisionRecords();
      setSavedRecords(list);
      if (list.length > 0 && !selectedRecord) {
        loadRecordDetail(list[0].record_id);
      }
    } catch (err) {
      console.error("Failed to load decision records", err);
    }
  };

  const handleSaveCurrentAudit = async () => {
    setIsLoading(true);
    setSaveStatus("Computing optimization and generating audit record...");
    try {
      const optReq: OptimisationRequest = {
        dataset_id: activeDatasetId,
        total_budget_cap: 2500000,
        min_equity_investment_share: 0.30,
      };

      const optRes = await api.solveOptimisation(optReq);
      const balanced = optRes.alternatives.find((a) => a.strategy_id === "balanced") || optRes.alternatives[0];

      const record = await api.saveDecisionRecord({
        dataset_id: activeDatasetId,
        request: optReq,
        baseline_risk: 58.4,
        high_risk_count: 3,
        selected_portfolio: balanced,
        other_alternatives: optRes.alternatives.filter((a) => a.strategy_id !== balanced.strategy_id),
        consequences: ["Local thermal cooling index improved", "Stormwater peak runoff reduced"],
        unintended_tradeoffs: ["Tree irrigation requires dry-season water allocation", "O&M recurring budget required"],
        critical_mitigations: ["Deploy rainwater retention cisterns alongside urban canopies", "Contracted sensor telemetry"],
      });

      setSaveStatus(`Decision record ${record.record_id} saved successfully!`);
      setSelectedRecord(record);
      await loadSavedRecords();
    } catch (err: any) {
      setSaveStatus(`Failed to save record: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadCsv = async () => {
    if (!selectedRecord) return;
    try {
      const res = await fetch(api.exportAllocationsCsvUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(selectedRecord.recommended_portfolio),
      });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `eco_echo_${selectedRecord.record_id}_allocations.csv`;
      a.click();
    } catch (err) {
      alert("Failed to export CSV");
    }
  };

  const handleDownloadHtml = async () => {
    if (!selectedRecord) return;
    try {
      const res = await fetch(api.exportHtmlReportUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(selectedRecord),
      });
      const htmlText = await res.text();
      const newWin = window.open("", "_blank");
      if (newWin) {
        newWin.document.write(htmlText);
        newWin.document.close();
      }
    } catch (err) {
      alert("Failed to generate HTML report");
    }
  };

  const loadRecordDetail = async (id: string) => {
    setIsLoading(true);
    try {
      const rec = await api.getDecisionRecord(id);
      setSelectedRecord(rec);
    } catch (err) {
      console.error("Failed to load record details", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-text">
          <h1>Reports & Decision Audits</h1>
          <p>
            Immutable decision archive with cryptographic SHA-256 validation, CSV allocation exports, and printable
            executive audit reports for municipal council review.
          </p>
        </div>

        <button className="btn btn-primary" onClick={handleSaveCurrentAudit} disabled={isLoading}>
          <Save size={15} />
          <span>{isLoading ? "Generating..." : "Archive Current Decision Record"}</span>
        </button>
      </div>

      {saveStatus && (
        <div
          style={{
            background: "var(--risk-moderate-bg)",
            border: "1px solid #c2decb",
            borderRadius: "var(--radius-button)",
            padding: "12px 16px",
            marginBottom: "20px",
            fontSize: "13px",
            color: "var(--forest-green)",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <CheckCircle2 size={16} />
          <span>{saveStatus}</span>
        </div>
      )}

      {/* Main 2-Column Section */}
      <div className="grid-split-1-2" style={{ alignItems: "start" }}>
        {/* Left: Saved Records Archive */}
        <div className="card">
          <div className="card-header">
            <div className="card-title-group">
              <Database size={18} color="var(--forest-green)" />
              <div className="card-title">Decision Records</div>
            </div>
            <span className="badge badge-neutral">{savedRecords.length} Saved</span>
          </div>

          {savedRecords.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 10px", color: "var(--text-secondary)", fontSize: "13px" }}>
              <FileText size={28} style={{ margin: "0 auto 8px auto", opacity: 0.4 }} />
              <div>No decision records saved yet. Click "Archive Current Decision Record" to create an audit record.</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {savedRecords.map((r) => {
                const isSelected = selectedRecord?.record_id === r.record_id;
                return (
                  <div
                    key={r.record_id}
                    onClick={() => loadRecordDetail(r.record_id)}
                    style={{
                      backgroundColor: isSelected ? "var(--warm-ivory)" : "var(--white)",
                      border: `1px solid ${isSelected ? "var(--forest-green)" : "var(--border-subtle)"}`,
                      borderRadius: "var(--radius-button)",
                      padding: "12px 14px",
                      cursor: "pointer",
                      transition: "all var(--transition-fast)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                      <span style={{ fontWeight: 700, fontSize: "13px", color: "var(--text-primary)" }}>
                        {r.record_id}
                      </span>
                      <span className="badge badge-green" style={{ textTransform: "capitalize" }}>
                        {r.strategy.replace("_", " ")}
                      </span>
                    </div>

                    <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                      Dataset: {r.dataset_name}
                    </div>

                    <div style={{ fontSize: "11px", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "4px", marginTop: "6px" }}>
                      <Hash size={11} />
                      <span style={{ fontFamily: "var(--font-mono)" }}>{r.reproducibility_hash.substring(0, 14)}...</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Record Details & Export Tools */}
        <div>
          {selectedRecord ? (
            <div className="card">
              <div className="card-header">
                <div>
                  <span className="badge badge-neutral" style={{ marginBottom: "4px" }}>
                    Record Detail
                  </span>
                  <div className="card-title" style={{ fontSize: "18px" }}>
                    {selectedRecord.record_id}
                  </div>
                  <div className="card-subtitle">
                    Created: {new Date(selectedRecord.created_at).toLocaleString()}
                  </div>
                </div>

                <div style={{ display: "flex", gap: "8px" }}>
                  <button className="btn btn-secondary btn-sm" onClick={handleDownloadCsv}>
                    <FileSpreadsheet size={14} />
                    <span>Export CSV</span>
                  </button>
                  <button className="btn btn-primary btn-sm" onClick={handleDownloadHtml}>
                    <Printer size={14} />
                    <span>View Print Report</span>
                  </button>
                </div>
              </div>

              {/* Summary Stats */}
              <div className="grid-cols-4" style={{ marginBottom: "18px" }}>
                <div style={{ background: "var(--warm-ivory)", padding: "12px", borderRadius: "var(--radius-button)" }}>
                  <div style={{ fontSize: "11px", color: "var(--text-secondary)", textTransform: "uppercase" }}>Strategy</div>
                  <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--forest-green)", marginTop: "2px", textTransform: "capitalize" }}>
                    {selectedRecord.selected_strategy.replace(/_/g, " ")}
                  </div>
                </div>

                <div style={{ background: "var(--warm-ivory)", padding: "12px", borderRadius: "var(--radius-button)" }}>
                  <div style={{ fontSize: "11px", color: "var(--text-secondary)", textTransform: "uppercase" }}>Capital Cost</div>
                  <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", marginTop: "2px" }} className="tabular-nums">
                    ${(selectedRecord.recommended_portfolio.total_capital_cost / 1000).toFixed(0)}k
                  </div>
                </div>

                <div style={{ background: "var(--warm-ivory)", padding: "12px", borderRadius: "var(--radius-button)" }}>
                  <div style={{ fontSize: "11px", color: "var(--text-secondary)", textTransform: "uppercase" }}>Annual O&M</div>
                  <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", marginTop: "2px" }} className="tabular-nums">
                    ${(selectedRecord.recommended_portfolio.total_annual_maintenance / 1000).toFixed(0)}k/yr
                  </div>
                </div>

                <div style={{ background: "var(--warm-ivory)", padding: "12px", borderRadius: "var(--radius-button)" }}>
                  <div style={{ fontSize: "11px", color: "var(--text-secondary)", textTransform: "uppercase" }}>Equity Score</div>
                  <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--forest-green)", marginTop: "2px" }}>
                    {selectedRecord.recommended_portfolio.equity_score.toFixed(1)} / 100
                  </div>
                </div>
              </div>

              {/* SHA-256 Reproducibility Block */}
              <div
                style={{
                  background: "var(--deep-green)",
                  color: "var(--lime-accent)",
                  padding: "14px 16px",
                  borderRadius: "var(--radius-button)",
                  fontFamily: "var(--font-mono)",
                  fontSize: "11.5px",
                  wordBreak: "break-all",
                  marginBottom: "18px",
                  border: "1px solid rgba(184, 233, 134, 0.25)",
                }}
              >
                <div style={{ color: "rgba(255, 255, 255, 0.65)", fontSize: "10.5px", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Cryptographic SHA-256 Reproducibility Audit Hash:
                </div>
                {selectedRecord.reproducibility_hash}
              </div>

              {/* Consequences & Mitigations List */}
              <div style={{ marginBottom: "18px" }}>
                <div style={{ fontWeight: 700, fontSize: "13px", color: "var(--text-primary)", marginBottom: "6px" }}>
                  Identified Key Consequences & Mitigations:
                </div>
                <ul style={{ paddingLeft: "18px", fontSize: "12.5px", color: "var(--text-secondary)", lineHeight: 1.6 }}>
                  {selectedRecord.key_consequences_identified.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </div>

              {/* Disclaimer */}
              <div
                style={{
                  padding: "12px 14px",
                  background: "var(--warm-ivory)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-button)",
                  fontSize: "11.5px",
                  color: "var(--text-secondary)",
                  lineHeight: 1.5,
                }}
              >
                <strong>Municipal Planning Disclaimer:</strong> {selectedRecord.disclaimer}
              </div>
            </div>
          ) : (
            <div
              className="card"
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "60px 20px",
                color: "var(--text-secondary)",
              }}
            >
              <Download size={36} style={{ marginBottom: "12px", opacity: 0.4 }} />
              <div style={{ fontSize: "14px", fontWeight: 600 }}>Select a decision record on the left</div>
              <div style={{ fontSize: "12px", marginTop: "4px" }}>
                Inspect cryptographic audit hashes, download CSV allocations, or open formatted print summaries.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
