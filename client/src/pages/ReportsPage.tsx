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
  ExternalLink,
  Printer,
  FileSpreadsheet,
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
      <div className="page-header">
        <div>
          <h1 className="page-title">Reports & Immutable Decision Records</h1>
          <p className="page-description">
            Archive reproducible sustainability decisions, export CSV allocations, and generate executive print-ready audit reports.
          </p>
        </div>

        <button className="btn btn-primary" onClick={handleSaveCurrentAudit} disabled={isLoading}>
          <Save size={16} />
          <span>{isLoading ? "Saving Record..." : "Archive Current Decision Record"}</span>
        </button>
      </div>

      {saveStatus && (
        <div
          style={{
            background: "#f0fdf4",
            border: "1px solid #a7f3d0",
            borderRadius: "var(--radius-md)",
            padding: "12px 16px",
            marginBottom: "20px",
            fontSize: "13px",
            color: "var(--primary-800)",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <CheckCircle2 size={16} />
          <span>{saveStatus}</span>
        </div>
      )}

      <div className="grid-2">
        {/* Left: Saved Records Archive */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Database size={18} color="var(--primary-700)" />
              <span>Persistent Decision Archive (SQLite)</span>
            </div>
            <span className="badge badge-slate">{savedRecords.length} records</span>
          </div>

          {savedRecords.length === 0 ? (
            <div style={{ textAlign: "center", padding: "30px 10px", color: "var(--slate-500)", fontSize: "13px" }}>
              <FileText size={28} style={{ margin: "0 auto 8px auto", opacity: 0.4 }} />
              <div>No decision records saved yet. Click "Archive Current Decision Record" above to persist an analysis snapshot.</div>
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
                      background: isSelected ? "var(--primary-50)" : "var(--white)",
                      border: isSelected ? "1.5px solid var(--primary-600)" : "1px solid var(--slate-200)",
                      borderRadius: "var(--radius-md)",
                      padding: "14px",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                      <div style={{ fontWeight: 700, fontSize: "13px", color: "var(--slate-900)" }}>
                        {r.record_id}
                      </div>
                      <span className="badge badge-green" style={{ textTransform: "capitalize" }}>
                        {r.strategy.replace("_", " ")}
                      </span>
                    </div>

                    <div style={{ fontSize: "12px", color: "var(--slate-600)" }}>
                      Dataset: {r.dataset_name}
                    </div>

                    <div style={{ fontSize: "11px", color: "var(--slate-500)", display: "flex", alignItems: "center", gap: "6px", marginTop: "6px" }}>
                      <Hash size={12} />
                      <span style={{ fontFamily: "var(--font-mono)" }}>{r.reproducibility_hash.substring(0, 16)}...</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Record Details & Export Tools */}
        {selectedRecord ? (
          <div className="card">
            <div className="card-header">
              <div>
                <span className="badge badge-slate" style={{ marginBottom: "4px" }}>
                  Active Record Inspector
                </span>
                <div className="card-title" style={{ fontSize: "18px" }}>
                  {selectedRecord.record_id}
                </div>
              </div>

              <div style={{ display: "flex", gap: "8px" }}>
                <button className="btn btn-secondary btn-sm" onClick={handleDownloadCsv}>
                  <FileSpreadsheet size={14} />
                  <span>Export CSV</span>
                </button>
                <button className="btn btn-primary btn-sm" onClick={handleDownloadHtml}>
                  <Printer size={14} />
                  <span>View Print Audit</span>
                </button>
              </div>
            </div>

            <div style={{ fontSize: "13px", color: "var(--slate-700)", lineHeight: 1.6, marginBottom: "16px" }}>
              <div>
                <strong>Dataset:</strong> {selectedRecord.dataset_name} ({selectedRecord.dataset_provenance})
              </div>
              <div>
                <strong>Strategy:</strong> {selectedRecord.selected_strategy.replace("_", " ").toUpperCase()}
              </div>
              <div>
                <strong>Capital Committed:</strong> ${selectedRecord.recommended_portfolio.total_capital_cost.toLocaleString()} USD
              </div>
              <div>
                <strong>Annual Maintenance:</strong> ${selectedRecord.recommended_portfolio.total_annual_maintenance.toLocaleString()} USD/yr
              </div>
            </div>

            <div
              style={{
                background: "var(--slate-900)",
                color: "#34d399",
                padding: "12px 14px",
                borderRadius: "6px",
                fontFamily: "var(--font-mono)",
                fontSize: "11px",
                wordBreak: "break-all",
                marginBottom: "16px",
              }}
            >
              <div style={{ color: "var(--slate-400)", marginBottom: "4px" }}>SHA-256 REPRODUCIBILITY AUDIT HASH:</div>
              {selectedRecord.reproducibility_hash}
            </div>

            <div style={{ fontSize: "12px", color: "var(--slate-600)", lineHeight: 1.6 }}>
              <div style={{ fontWeight: 700, color: "var(--slate-800)", marginBottom: "4px" }}>
                Identified Key Consequences & Mitigations:
              </div>
              <ul style={{ paddingLeft: "18px" }}>
                {selectedRecord.key_consequences_identified.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>

            <div
              style={{
                marginTop: "20px",
                padding: "12px",
                background: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: "6px",
                fontSize: "11px",
                color: "#991b1b",
              }}
            >
              <strong>Disclaimer:</strong> {selectedRecord.disclaimer}
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
              color: "var(--slate-400)",
            }}
          >
            <Download size={36} style={{ marginBottom: "12px", opacity: 0.5 }} />
            <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--slate-600)" }}>
              Select a decision record on the left
            </div>
            <div style={{ fontSize: "12px", marginTop: "4px" }}>
              View cryptographic audit hashes, download CSV allocations, or open formatted executive HTML summaries.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
