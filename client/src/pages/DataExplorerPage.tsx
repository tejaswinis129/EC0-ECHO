import React, { useState, useEffect } from "react";
import { DatasetMetadata, ValidationReport, DatasetSummary } from "../types";
import { api } from "../api/client";
import {
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Database,
  FileSpreadsheet,
  RefreshCw,
  Info,
  ShieldCheck,
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
  const [uploadStatus, setUploadStatus] = useState<{ type: "info" | "success" | "error"; message: string } | null>(null);

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
      setUploadStatus({ type: "info", message: "Inspecting CSV schema & column types..." });
      try {
        const valRes = await api.validateCsv(file);
        setValidationReport(valRes.report);
        if (valRes.report.is_valid) {
          setUploadStatus({ type: "success", message: "Schema verified! File is ready for registration." });
        } else {
          setUploadStatus({ type: "error", message: "Schema validation issues detected. Review report." });
        }
      } catch (err: any) {
        setUploadStatus({ type: "error", message: `Validation failed: ${err.message}` });
      }
    }
  };

  const handleUploadSubmit = async () => {
    if (!uploadFile) return;
    setIsLoading(true);
    setUploadStatus({ type: "info", message: "Ingesting and registering dataset into municipal repository..." });
    try {
      const res = await api.uploadDataset(uploadFile, datasetName || uploadFile.name, provenance || "Custom City Data Ingestion");
      setUploadStatus({ type: "success", message: "Dataset registered successfully!" });
      await loadDatasetList();
      onSelectDataset(res.metadata.dataset_id);
      setUploadFile(null);
      setValidationReport(null);
      setDatasetName("");
      setProvenance("");
    } catch (err: any) {
      setUploadStatus({ type: "error", message: `Registration failed: ${err.message}` });
    } finally {
      setIsLoading(false);
    }
  };

  const currentMeta = datasets.find((d) => d.dataset_id === activeDatasetId);

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-text">
          <h1>Urban Data Explorer & Ingestion</h1>
          <p>
            Manage municipal spatial datasets, inspect schema quality, validate units, and explore district climate
            measurements. Note: Pre-loaded datasets are calibrated synthetic urban archetypes for research simulation.
          </p>
        </div>

        <button className="btn btn-secondary btn-sm" onClick={loadDatasetList}>
          <RefreshCw size={13} />
          <span>Refresh Datasets</span>
        </button>
      </div>

      {/* Dataset Selection: Balanced Cards */}
      <div className="card" style={{ marginBottom: "24px" }}>
        <div className="card-header">
          <div className="card-title-group">
            <Database size={18} color="var(--forest-green)" />
            <div>
              <div className="card-title">Registered Urban Datasets</div>
              <div className="card-subtitle">Select a dataset to activate it across all decision modules.</div>
            </div>
          </div>
          <span className="badge badge-neutral">{datasets.length} Datasets Active</span>
        </div>

        <div className="grid-cols-2" style={{ marginBottom: 0 }}>
          {datasets.map((d) => {
            const isSelected = d.dataset_id === activeDatasetId;
            return (
              <div
                key={d.dataset_id}
                onClick={() => onSelectDataset(d.dataset_id)}
                style={{
                  border: `1px solid ${isSelected ? "var(--forest-green)" : "var(--border-subtle)"}`,
                  backgroundColor: isSelected ? "var(--warm-ivory)" : "var(--white)",
                  borderRadius: "var(--radius-card)",
                  padding: "16px 20px",
                  cursor: "pointer",
                  transition: "all var(--transition-fast)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  boxShadow: isSelected ? "var(--shadow-subtle)" : "none",
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
                    <div style={{ fontWeight: 700, fontSize: "15px", color: "var(--text-primary)" }}>{d.name}</div>
                    <div style={{ display: "flex", gap: "6px" }}>
                      {isSelected && <span className="badge badge-lime">Active Target</span>}
                      {d.is_sample ? (
                        <span className="badge badge-neutral">Synthetic Archetype</span>
                      ) : (
                        <span className="badge badge-water">User Dataset</span>
                      )}
                    </div>
                  </div>

                  <p style={{ fontSize: "12.5px", color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: "12px" }}>
                    {d.description}
                  </p>
                </div>

                <div
                  style={{
                    fontSize: "11.5px",
                    color: "var(--text-secondary)",
                    borderTop: "1px solid var(--border-subtle)",
                    paddingTop: "8px",
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <span>
                    <strong>Records:</strong> {d.row_count} Districts
                  </span>
                  <span>
                    <strong>Source:</strong> {d.provenance}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CSV Ingestion & Validation Panel */}
      <div className="card" style={{ marginBottom: "24px" }}>
        <div className="card-header">
          <div className="card-title-group">
            <UploadCloud size={18} color="var(--forest-green)" />
            <div>
              <div className="card-title">Upload Municipal CSV Dataset</div>
              <div className="card-subtitle">
                Automatic schema verification, duplicate detection, and missing-value validation.
              </div>
            </div>
          </div>
        </div>

        <div className="grid-split-2-1" style={{ alignItems: "start", marginBottom: 0 }}>
          {/* Form Fields */}
          <div>
            <div className="form-group">
              <label className="form-label">Select CSV File</label>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="form-control"
                style={{ padding: "8px 10px" }}
              />
            </div>

            <div className="grid-cols-2" style={{ marginBottom: "16px" }}>
              <div>
                <label className="form-label">Dataset Name (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Metro Resilience 2026"
                  value={datasetName}
                  onChange={(e) => setDatasetName(e.target.value)}
                  className="form-control"
                />
              </div>

              <div>
                <label className="form-label">Provenance / Source (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. City GIS Department"
                  value={provenance}
                  onChange={(e) => setProvenance(e.target.value)}
                  className="form-control"
                />
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <button
                className="btn btn-primary"
                onClick={handleUploadSubmit}
                disabled={!uploadFile || (validationReport && !validationReport.is_valid) || isLoading}
              >
                {isLoading ? "Validating & Ingesting..." : "Validate & Register Dataset"}
              </button>

              {uploadStatus && (
                <div
                  style={{
                    fontSize: "12.5px",
                    fontWeight: 500,
                    color:
                      uploadStatus.type === "success"
                        ? "var(--risk-moderate)"
                        : uploadStatus.type === "error"
                        ? "var(--risk-severe)"
                        : "var(--text-secondary)",
                  }}
                >
                  {uploadStatus.message}
                </div>
              )}
            </div>
          </div>

          {/* Validation Feedback Card */}
          <div>
            {validationReport ? (
              <div
                style={{
                  background: validationReport.is_valid ? "var(--risk-moderate-bg)" : "var(--risk-severe-bg)",
                  border: `1px solid ${validationReport.is_valid ? "#c2decb" : "#f3cbc8"}`,
                  borderRadius: "var(--radius-button)",
                  padding: "16px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 700, fontSize: "13.5px" }}>
                    {validationReport.is_valid ? (
                      <CheckCircle2 size={16} color="var(--risk-moderate)" />
                    ) : (
                      <XCircle size={16} color="var(--risk-severe)" />
                    )}
                    <span style={{ color: validationReport.is_valid ? "var(--risk-moderate)" : "var(--risk-severe)" }}>
                      {validationReport.is_valid ? "Schema Validated" : "Validation Issues"}
                    </span>
                  </div>
                  <span className="badge badge-neutral">
                    Quality: {validationReport.data_quality_score.toFixed(0)}%
                  </span>
                </div>

                <div style={{ fontSize: "12px", color: "var(--text-primary)", marginBottom: "8px" }}>
                  {validationReport.summary}
                </div>

                {validationReport.issues.length > 0 && (
                  <div style={{ maxHeight: "140px", overflowY: "auto", fontSize: "11.5px", color: "var(--text-secondary)" }}>
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
                  background: "var(--warm-ivory)",
                  border: "1px dashed var(--border-strong)",
                  borderRadius: "var(--radius-button)",
                  padding: "20px",
                  fontSize: "12px",
                  color: "var(--text-secondary)",
                  lineHeight: 1.5,
                }}
              >
                <div style={{ fontWeight: 700, color: "var(--text-primary)", marginBottom: "4px" }}>
                  CSV Requirements:
                </div>
                <div>Must include <code>neighbourhood_id</code>, <code>population</code>, <code>surface_temp_c</code>, <code>impervious_surface_pct</code>, <code>tree_canopy_pct</code>.</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabular Data Preview */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Dataset Tabular Inspection: {currentMeta?.name || "Active Dataset"}</div>
            <div className="card-subtitle">
              Raw measurements across {records.length} records • {columns.length} columns.
            </div>
          </div>
          <span className="badge badge-neutral">{records.length} Rows</span>
        </div>

        <div className="table-wrapper" style={{ maxHeight: "420px" }}>
          <table className="eco-table">
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
                    <td key={col} className={typeof row[col] === "number" ? "table-cell-num" : ""}>
                      {row[col] !== undefined ? String(row[col]) : "-"}
                    </td>
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
