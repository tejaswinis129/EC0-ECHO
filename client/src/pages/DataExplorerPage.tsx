import React, { useState, useEffect } from "react";
import { DatasetMetadata, ValidationReport, DatasetSummary } from "../types";
import { api } from "../api/client";
import {
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Database,
  Info,
  FileSpreadsheet,
  RefreshCw,
} from "lucide-react";

interface DataExplorerPageProps {
  activeDatasetId: string;
  onSelectDataset: (id: string) => void;
}

export const DataExplorerPage: React.FC<DataExplorerPageProps> = ({
  activeDatasetId,
  onSelectDataset,
}) => {
  const [datasets, setDatasets] = useState<DatasetMetadata[]>([]);
  const [records, setRecords] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [summary, setSummary] = useState<DatasetSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [datasetName, setDatasetName] = useState<string>("");
  const [provenance, setProvenance] = useState<string>("");
  const [validationReport, setValidationReport] = useState<ValidationReport | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

  useEffect(() => {
    loadDatasetList();
  }, []);

  useEffect(() => {
    if (activeDatasetId) {
      loadDatasetDetails(activeDatasetId);
    }
  }, [activeDatasetId]);

  const loadDatasetList = async () => {
    try {
      const list = await api.listDatasets();
      setDatasets(list);
    } catch (err) {
      console.error("Failed to load dataset list", err);
    }
  };

  const loadDatasetDetails = async (id: string) => {
    setIsLoading(true);
    try {
      const data = await api.getDataset(id);
      setRecords(data.records);
      setColumns(data.columns);
      const sum = await api.getDatasetSummary(id);
      setSummary(sum);
    } catch (err) {
      console.error("Failed to load dataset details", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadFile(file);
      setUploadStatus("Validating CSV schema...");
      try {
        const valRes = await api.validateCsv(file);
        setValidationReport(valRes.report);
        setUploadStatus(valRes.report.is_valid ? "Validation successful! Ready to register." : "Validation errors detected.");
      } catch (err: any) {
        setUploadStatus(`Validation failed: ${err.message}`);
      }
    }
  };

  const handleUploadSubmit = async () => {
    if (!uploadFile) return;
    setIsLoading(true);
    setUploadStatus("Uploading and registering dataset...");
    try {
      const res = await api.uploadDataset(uploadFile, datasetName || uploadFile.name, provenance || "User Uploaded CSV");
      setUploadStatus("Dataset registered successfully!");
      await loadDatasetList();
      onSelectDataset(res.metadata.dataset_id);
      setUploadFile(null);
      setValidationReport(null);
    } catch (err: any) {
      setUploadStatus(`Upload failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const currentMeta = datasets.find((d) => d.dataset_id === activeDatasetId);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Urban Data Explorer & Ingestion Layer</h1>
          <p className="page-description">
            Manage municipal urban resilience datasets, inspect schema quality, validate units, and explore district climate attributes.
          </p>
        </div>
      </div>

      {/* Dataset Selection Tabs */}
      <div className="card" style={{ marginBottom: "24px" }}>
        <div className="card-header">
          <div className="card-title">
            <Database size={18} color="var(--primary-700)" />
            <span>Select Active Analysis Dataset</span>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={loadDatasetList}>
            <RefreshCw size={13} />
            <span>Refresh</span>
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "16px" }}>
          {datasets.map((d) => {
            const isSelected = d.dataset_id === activeDatasetId;
            return (
              <div
                key={d.dataset_id}
                onClick={() => onSelectDataset(d.dataset_id)}
                style={{
                  border: isSelected ? "2px solid var(--primary-600)" : "1px solid var(--slate-200)",
                  background: isSelected ? "var(--primary-50)" : "var(--white)",
                  borderRadius: "var(--radius-md)",
                  padding: "16px",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
                  <div style={{ fontWeight: 700, fontSize: "14px", color: "var(--slate-900)" }}>{d.name}</div>
                  {d.is_sample ? (
                    <span className="badge badge-green">Sample City</span>
                  ) : (
                    <span className="badge badge-sky">Custom Upload</span>
                  )}
                </div>
                <div style={{ fontSize: "12px", color: "var(--slate-600)", marginBottom: "10px", lineHeight: 1.5 }}>
                  {d.description}
                </div>
                <div style={{ fontSize: "11px", color: "var(--slate-500)", borderTop: "1px solid rgba(0,0,0,0.06)", paddingTop: "8px" }}>
                  <strong>Provenance:</strong> {d.provenance}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CSV Ingestion & Validation Section */}
      <div className="card" style={{ marginBottom: "24px" }}>
        <div className="card-title" style={{ marginBottom: "14px" }}>
          <UploadCloud size={18} color="var(--primary-700)" />
          <span>Upload New Municipal Dataset (CSV)</span>
        </div>

        <div className="grid-2">
          <div>
            <div className="form-group">
              <label className="form-label">Select CSV File</label>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="form-input"
                style={{ padding: "7px 10px" }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Dataset Name (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Metro Resilience 2025"
                value={datasetName}
                onChange={(e) => setDatasetName(e.target.value)}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Data Provenance & Source (Optional)</label>
              <input
                type="text"
                placeholder="e.g. City GIS Portal / NOAA Atlas 14"
                value={provenance}
                onChange={(e) => setProvenance(e.target.value)}
                className="form-input"
              />
            </div>

            <button
              className="btn btn-primary"
              onClick={handleUploadSubmit}
              disabled={!uploadFile || (validationReport && !validationReport.is_valid) || isLoading}
            >
              {isLoading ? "Processing..." : "Validate & Register Dataset"}
            </button>

            {uploadStatus && (
              <div style={{ marginTop: "12px", fontSize: "12px", color: "var(--slate-700)" }}>
                {uploadStatus}
              </div>
            )}
          </div>

          {/* Real-time Validation Report Viewer */}
          <div>
            {validationReport ? (
              <div
                style={{
                  background: validationReport.is_valid ? "#f0fdf4" : "#fef2f2",
                  border: `1px solid ${validationReport.is_valid ? "#a7f3d0" : "#fecaca"}`,
                  borderRadius: "var(--radius-md)",
                  padding: "16px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 700, fontSize: "14px" }}>
                    {validationReport.is_valid ? (
                      <CheckCircle2 size={18} color="var(--primary-700)" />
                    ) : (
                      <XCircle size={18} color="var(--rose-600)" />
                    )}
                    <span>{validationReport.is_valid ? "Schema Validated" : "Validation Errors"}</span>
                  </div>
                  <span className="badge badge-slate">
                    Quality: {validationReport.data_quality_score.toFixed(0)}%
                  </span>
                </div>

                <div style={{ fontSize: "12px", color: "var(--slate-700)", marginBottom: "8px" }}>
                  {validationReport.summary}
                </div>

                {validationReport.issues.length > 0 && (
                  <div style={{ maxHeight: "160px", overflowY: "auto", fontSize: "11px", color: "var(--slate-600)" }}>
                    {validationReport.issues.map((iss, idx) => (
                      <div key={idx} style={{ marginTop: "4px" }}>
                        • <strong>[{iss.severity.toUpperCase()}]</strong> {iss.message}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div
                style={{
                  border: "2px dashed var(--slate-300)",
                  borderRadius: "var(--radius-md)",
                  padding: "36px 20px",
                  textAlign: "center",
                  color: "var(--slate-500)",
                  fontSize: "13px",
                }}
              >
                <FileSpreadsheet size={32} style={{ margin: "0 auto 8px auto", opacity: 0.5 }} />
                <div>Upload a CSV to run automatic unit normalization, range validation, and duplicate detection.</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Live Data Preview Table */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <span>Tabular Preview: {currentMeta?.name || "Active Dataset"}</span>
            <span className="badge badge-slate">{records.length} records shown</span>
          </div>
        </div>

        <div className="table-container" style={{ maxHeight: "400px" }}>
          <table className="data-table">
            <thead>
              <tr>
                {columns.map((col) => (
                  <th key={col}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {records.map((row, rIdx) => (
                <tr key={rIdx}>
                  {columns.map((col) => (
                    <td key={col}>{row[col] !== undefined ? String(row[col]) : "-"}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
