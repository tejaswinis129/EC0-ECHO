import React, { useState, useEffect } from "react";
import {
  DataSourceRegistryItem,
  RealWorldEvidenceRecord,
  UploadedDocumentMetadata,
  ProvenanceType,
} from "../types";
import { api } from "../api/client";
import {
  Database,
  Search,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Info,
  ExternalLink,
  RefreshCw,
  FileText,
  FileSpreadsheet,
  MapPin,
  Sparkles,
  Link as LinkIcon,
  Clock,
  Layers,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface RealWorldEvidencePanelProps {
  onAttachFile?: (fileId: string) => void;
  attachedFileIds?: string[];
  activeCategory?: string;
  locationName?: string;
}

export const RealWorldEvidencePanel: React.FC<RealWorldEvidencePanelProps> = ({
  onAttachFile,
  attachedFileIds = [],
  activeCategory,
  locationName,
}) => {
  const [activeTab, setActiveTab] = useState<"sources" | "records" | "upload">("sources");
  const [sources, setSources] = useState<DataSourceRegistryItem[]>([]);
  const [records, setRecords] = useState<RealWorldEvidenceRecord[]>([]);
  const [uploads, setUploads] = useState<UploadedDocumentMetadata[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedProvenance, setSelectedProvenance] = useState<string>("");
  const [connectionTestResults, setConnectionTestResults] = useState<Record<string, any>>({});
  const [isTestingSource, setIsTestingSource] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  useEffect(() => {
    loadSources();
    loadRecords();
    loadUploads();
  }, []);

  const loadSources = async () => {
    try {
      const data = await api.listEvidenceSources();
      setSources(data);
    } catch (e) {
      console.warn("Could not load sources:", e);
    }
  };

  const loadRecords = async (query?: string, prov?: string) => {
    setIsLoading(true);
    try {
      const data = await api.searchEvidenceRecords({
        query: query !== undefined ? query : searchQuery,
        category: activeCategory,
        location: locationName,
        provenance_type: prov !== undefined ? prov : selectedProvenance,
      });
      setRecords(data);
    } catch (e) {
      console.warn("Could not search records:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUploads = async () => {
    try {
      const data = await api.listUploadedDocuments();
      setUploads(data);
    } catch (e) {
      console.warn("Could not load uploads:", e);
    }
  };

  const handleTestConnection = async (sourceId: string) => {
    setIsTestingSource(sourceId);
    try {
      const res = await api.testSourceConnection(sourceId);
      setConnectionTestResults((prev) => ({ ...prev, [sourceId]: res }));
    } catch (e: any) {
      setConnectionTestResults((prev) => ({
        ...prev,
        [sourceId]: { is_live: false, error: e.message || "Connection check failed" },
      }));
    } finally {
      setIsTestingSource(null);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setUploadSuccess(null);

    // Validate size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setUploadError(`File '${file.name}' exceeds the 10MB limit (${(file.size / (1024 * 1024)).toFixed(1)} MB).`);
      return;
    }

    // Validate extension
    const allowed = [".csv", ".json", ".geojson", ".pdf", ".txt", ".xlsx"];
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!allowed.includes(ext)) {
      setUploadError(`File extension '${ext}' is unsupported. Allowed: ${allowed.join(", ")}`);
      return;
    }

    setIsUploading(true);
    try {
      const meta = await api.uploadEvidenceDocument(file);
      setUploadSuccess(`Successfully uploaded '${file.name}' (${meta.extracted_summary}). Indexed as ${meta.file_id}.`);
      loadUploads();
      loadRecords();
      if (onAttachFile) {
        onAttachFile(meta.file_id);
      }
    } catch (err: any) {
      setUploadError(err.message || "Upload failed. Please check network and file format.");
    } finally {
      setIsUploading(false);
    }
  };

  const getProvenanceBadge = (prov: ProvenanceType) => {
    switch (prov) {
      case "VERIFIED_SOURCE_FACT":
        return { label: "VERIFIED SOURCE FACT", bg: "rgba(34, 197, 94, 0.15)", color: "#15803D" };
      case "DERIVED_VALUE":
        return { label: "DERIVED VALUE", bg: "rgba(6, 182, 212, 0.15)", color: "#0E7490" };
      case "ESTIMATE":
        return { label: "ESTIMATE", bg: "rgba(245, 158, 11, 0.15)", color: "#B45309" };
      case "SIMULATED":
        return { label: "SIMULATED", bg: "rgba(168, 85, 247, 0.15)", color: "#7E22CE" };
      case "UNVERIFIED":
        return { label: "UNVERIFIED", bg: "rgba(239, 68, 68, 0.15)", color: "#B91C1C" };
      case "MISSING":
        return { label: "MISSING", bg: "rgba(239, 68, 68, 0.2)", color: "#991B1B" };
      case "ILLUSTRATIVE":
      default:
        return { label: "ILLUSTRATIVE", bg: "rgba(100, 116, 139, 0.15)", color: "#475569" };
    }
  };

  return (
    <div className="card" style={{ marginBottom: "28px" }}>
      {/* 1. Header Toolbar */}
      <div
        className="card-header"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
          borderBottom: "1px solid var(--border-subtle)",
          paddingBottom: "14px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "8px",
              background: "var(--warm-ivory)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <Database size={20} color="var(--forest-green)" />
          </div>
          <div>
            <div style={{ fontSize: "16px", fontWeight: 800, color: "var(--text-primary)" }}>
              Real-World Evidence & Source Registry
            </div>
            <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "2px" }}>
              Traceable municipal master plans, Smart Cities open data, work orders, and user DPR uploads.
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div
          style={{
            display: "inline-flex",
            background: "var(--warm-ivory)",
            padding: "2px",
            borderRadius: "var(--radius-button)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab("sources")}
            style={{
              padding: "5px 14px",
              border: "none",
              borderRadius: "var(--radius-sm)",
              background: activeTab === "sources" ? "var(--forest-green)" : "transparent",
              color: activeTab === "sources" ? "#FFFFFF" : "var(--text-primary)",
              fontSize: "12px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Official Sources ({sources.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("records")}
            style={{
              padding: "5px 14px",
              border: "none",
              borderRadius: "var(--radius-sm)",
              background: activeTab === "records" ? "var(--forest-green)" : "transparent",
              color: activeTab === "records" ? "#FFFFFF" : "var(--text-primary)",
              fontSize: "12px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Extracted Records ({records.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("upload")}
            style={{
              padding: "5px 14px",
              border: "none",
              borderRadius: "var(--radius-sm)",
              background: activeTab === "upload" ? "var(--forest-green)" : "transparent",
              color: activeTab === "upload" ? "#FFFFFF" : "var(--text-primary)",
              fontSize: "12px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Attach DPR / Tender ({uploads.length})
          </button>
        </div>
      </div>

      {/* 2. Tab Contents */}
      <div style={{ padding: "18px 20px" }}>
        {/* TAB 1: DATA SOURCES */}
        {activeTab === "sources" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "16px" }}>
              {sources.map((src) => {
                const testRes = connectionTestResults[src.source_id];
                const isTesting = isTestingSource === src.source_id;

                return (
                  <div
                    key={src.source_id}
                    style={{
                      background: "var(--warm-ivory)",
                      borderRadius: "var(--radius-card)",
                      padding: "16px",
                      border: "1px solid var(--border-subtle)",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                    }}
                  >
                    <div>
                      {/* Top Badges */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                        <span className="badge badge-forest" style={{ fontSize: "11px" }}>
                          {src.category}
                        </span>
                        <span
                          style={{
                            fontSize: "11px",
                            fontWeight: 700,
                            padding: "2px 8px",
                            borderRadius: "var(--radius-full)",
                            background: src.access_mode === "API_CONNECTED" ? "rgba(34,197,94,0.15)" : "rgba(245,158,11,0.15)",
                            color: src.access_mode === "API_CONNECTED" ? "#15803D" : "#B45309",
                          }}
                        >
                          {src.access_mode === "API_CONNECTED" ? "Live API Download" : "Portal Indexed (Manual Fallback)"}
                        </span>
                      </div>

                      <div style={{ fontSize: "14px", fontWeight: 800, color: "var(--text-primary)", marginBottom: "4px" }}>
                        {src.name}
                      </div>
                      <div style={{ fontSize: "12px", color: "var(--forest-green)", fontWeight: 600, marginBottom: "8px" }}>
                        {src.publisher}
                      </div>

                      <p style={{ fontSize: "12.5px", color: "var(--text-secondary)", lineHeight: 1.45, margin: "0 0 10px 0" }}>
                        {src.description}
                      </p>

                      <div style={{ fontSize: "11.5px", color: "var(--text-secondary)", marginBottom: "12px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                        <div><strong>Scope:</strong> {src.geographic_scope}</div>
                        <div><strong>Coverage:</strong> {src.coverage_period}</div>
                        <div><strong>Format:</strong> {src.format}</div>
                        <div><strong>License:</strong> {src.license}</div>
                      </div>

                      {/* Manual Fallback Instructions */}
                      {src.manual_import_instructions && (
                        <div
                          style={{
                            background: "rgba(255,255,255,0.7)",
                            border: "1px dashed var(--border-subtle)",
                            borderRadius: "6px",
                            padding: "8px 10px",
                            fontSize: "11.5px",
                            color: "var(--text-secondary)",
                            marginBottom: "12px",
                          }}
                        >
                          <strong>Import Guidance:</strong> {src.manual_import_instructions}
                        </div>
                      )}
                    </div>

                    {/* Action & Test Bar */}
                    <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: "10px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <a
                          href={src.original_url}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            fontSize: "12px",
                            fontWeight: 700,
                            color: "var(--forest-green)",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            textDecoration: "none",
                          }}
                        >
                          <ExternalLink size={12} /> Portal Link
                        </a>
                        {src.active_resource_url && (
                          <a
                            href={src.active_resource_url}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              fontSize: "12px",
                              fontWeight: 700,
                              color: "#0369A1",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              textDecoration: "none",
                            }}
                          >
                            <ExternalLink size={12} /> Direct PDF
                          </a>
                        )}
                      </div>

                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleTestConnection(src.source_id)}
                        disabled={isTesting}
                        style={{ fontSize: "11px", padding: "4px 10px" }}
                      >
                        {isTesting ? (
                          <>
                            <RefreshCw className="animate-spin" size={12} />
                            <span>Checking...</span>
                          </>
                        ) : (
                          <>
                            <RefreshCw size={12} />
                            <span>Check Live Status</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Test Results Output */}
                    {testRes && (
                      <div
                        style={{
                          marginTop: "8px",
                          padding: "8px 10px",
                          borderRadius: "6px",
                          fontSize: "11.5px",
                          background: testRes.is_live ? "rgba(34, 197, 94, 0.15)" : "rgba(239, 68, 68, 0.15)",
                          color: testRes.is_live ? "#15803D" : "#B91C1C",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        {testRes.is_live ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />}
                        <span>
                          {testRes.summary || testRes.error || (testRes.is_live ? "Source reachable" : "Unreachable")}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: EXTRACTED EVIDENCE RECORDS */}
        {activeTab === "records" && (
          <div>
            {/* Search & Filter Toolbar */}
            <div style={{ display: "flex", gap: "10px", marginBottom: "16px", flexWrap: "wrap" }}>
              <div style={{ flex: "1 1 240px", position: "relative" }}>
                <Search size={15} style={{ position: "absolute", left: "10px", top: "10px", color: "var(--text-secondary)" }} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && loadRecords(searchQuery, selectedProvenance)}
                  placeholder="Search project names, citations, or engineering fields..."
                  style={{
                    width: "100%",
                    padding: "8px 10px 8px 32px",
                    fontSize: "13px",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--border-subtle)",
                  }}
                />
              </div>

              {/* Provenance Filter */}
              <select
                value={selectedProvenance}
                onChange={(e) => {
                  setSelectedProvenance(e.target.value);
                  loadRecords(searchQuery, e.target.value);
                }}
                style={{
                  padding: "8px 12px",
                  fontSize: "13px",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--border-subtle)",
                  background: "#FFFFFF",
                }}
              >
                <option value="">All Provenance Types</option>
                <option value="VERIFIED_SOURCE_FACT">Verified Source Facts</option>
                <option value="DERIVED_VALUE">Derived Values</option>
                <option value="ESTIMATE">Estimates</option>
                <option value="UNVERIFIED">Unverified / Missing</option>
                <option value="ILLUSTRATIVE">Illustrative Only</option>
              </select>

              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => loadRecords(searchQuery, selectedProvenance)}
              >
                Search Evidence
              </button>
            </div>

            {/* Records List */}
            {isLoading ? (
              <div style={{ textAlign: "center", padding: "30px", color: "var(--text-secondary)" }}>
                <RefreshCw className="animate-spin" size={24} style={{ marginBottom: "8px" }} />
                <div>Searching real-world evidence records...</div>
              </div>
            ) : records.length === 0 ? (
              <div style={{ textAlign: "center", padding: "30px", color: "var(--text-secondary)" }}>
                No records matched your search query. Try broadening your terms or upload a project DPR.
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "16px" }}>
                {records.map((r) => {
                  const pBadge = getProvenanceBadge(r.provenance_type);
                  return (
                    <div
                      key={r.record_id}
                      style={{
                        background: "#FFFFFF",
                        border: "1px solid var(--border-subtle)",
                        borderRadius: "var(--radius-card)",
                        padding: "16px",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
                        <span
                          style={{
                            fontSize: "10.5px",
                            fontWeight: 800,
                            padding: "2px 7px",
                            borderRadius: "var(--radius-full)",
                            background: pBadge.bg,
                            color: pBadge.color,
                          }}
                        >
                          {pBadge.label}
                        </span>
                        <span style={{ fontSize: "11px", color: "var(--text-secondary)", fontFamily: "monospace" }}>
                          {r.record_id}
                        </span>
                      </div>

                      <div style={{ fontSize: "14px", fontWeight: 800, color: "var(--text-primary)", marginBottom: "2px" }}>
                        {r.project_name}
                      </div>
                      <div style={{ fontSize: "12px", color: "var(--forest-green)", fontWeight: 600, marginBottom: "8px" }}>
                        {r.source_publisher} ({r.publication_date})
                      </div>

                      <div
                        style={{
                          background: "var(--warm-ivory)",
                          borderRadius: "4px",
                          padding: "6px 8px",
                          fontSize: "11.5px",
                          color: "var(--text-secondary)",
                          marginBottom: "10px",
                        }}
                      >
                        <strong>Ref:</strong> {r.document_reference}
                      </div>

                      {/* Field Values Table */}
                      <div style={{ marginBottom: "10px" }}>
                        <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", marginBottom: "4px" }}>
                          Verified Field Values:
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px", fontSize: "12px" }}>
                          {Object.entries(r.field_values).map(([k, v]) => (
                            <div key={k} style={{ background: "#F8FAFC", padding: "4px 6px", borderRadius: "4px", border: "1px solid #E2E8F0" }}>
                              <span style={{ color: "var(--text-secondary)" }}>{k.replace(/_/g, " ")}: </span>
                              <strong style={{ color: "var(--text-primary)" }}>{String(v)}</strong>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Missing or Unverified Fields */}
                      {r.missing_or_unverified_fields.length > 0 && (
                        <div style={{ fontSize: "11.5px", color: "#B91C1C", marginBottom: "8px" }}>
                          <strong>Missing Data:</strong> {r.missing_or_unverified_fields.join(", ")}
                        </div>
                      )}

                      {/* Notes */}
                      {r.notes && (
                        <div style={{ fontSize: "12px", color: "var(--text-secondary)", fontStyle: "italic", lineHeight: 1.4 }}>
                          "{r.notes}"
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: DPR & TENDER UPLOADER */}
        {activeTab === "upload" && (
          <div>
            <div
              style={{
                border: "2px dashed var(--forest-green)",
                borderRadius: "var(--radius-card)",
                padding: "28px",
                textAlign: "center",
                background: "rgba(184, 233, 134, 0.1)",
                marginBottom: "20px",
              }}
            >
              <Upload size={36} color="var(--forest-green)" style={{ marginBottom: "10px" }} />
              <div style={{ fontSize: "15px", fontWeight: 800, color: "var(--text-primary)" }}>
                Attach Municipal DPR, Tender Document, or Survey Spreadsheet
              </div>
              <p style={{ fontSize: "13px", color: "var(--text-secondary)", maxWidth: "520px", margin: "6px auto 16px", lineHeight: 1.5 }}>
                Attach project reports, DPRs, tender schedules, CSV work orders, GeoJSON spatial lines, or PDF drawings. Files are validated safely and bound to your implementation plan.
              </p>

              <label
                className="btn btn-primary"
                style={{ display: "inline-flex", alignItems: "center", gap: "6px", cursor: isUploading ? "wait" : "pointer" }}
              >
                <Upload size={14} />
                <span>{isUploading ? "Validating & Extracting..." : "Choose File to Upload"}</span>
                <input
                  type="file"
                  accept=".csv,.json,.geojson,.pdf,.txt,.xlsx"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                  style={{ display: "none" }}
                />
              </label>

              <div style={{ fontSize: "11.5px", color: "var(--text-secondary)", marginTop: "10px" }}>
                Supported formats: <strong>.csv, .json, .geojson, .pdf, .xlsx, .txt</strong> (Maximum 10 MB). Safe sandboxed parsing without script execution.
              </div>
            </div>

            {/* Status Messages */}
            {uploadError && (
              <div
                style={{
                  background: "rgba(239, 68, 68, 0.15)",
                  border: "1px solid #DC2626",
                  borderRadius: "6px",
                  padding: "10px 14px",
                  fontSize: "13px",
                  color: "#B91C1C",
                  marginBottom: "16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <AlertTriangle size={16} />
                <span>{uploadError}</span>
              </div>
            )}

            {uploadSuccess && (
              <div
                style={{
                  background: "rgba(34, 197, 94, 0.15)",
                  border: "1px solid #16A34A",
                  borderRadius: "6px",
                  padding: "10px 14px",
                  fontSize: "13px",
                  color: "#15803D",
                  marginBottom: "16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <CheckCircle2 size={16} />
                <span>{uploadSuccess}</span>
              </div>
            )}

            {/* List of Uploaded Documents */}
            <div>
              <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "10px" }}>
                Session Attached Documents ({uploads.length})
              </div>
              {uploads.length === 0 ? (
                <div style={{ fontSize: "13px", color: "var(--text-secondary)", fontStyle: "italic" }}>
                  No custom DPR or tender documents attached yet. You can attach files anytime to ground preliminary plans in real municipal documents.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {uploads.map((u) => {
                    const isAttached = attachedFileIds.includes(u.file_id);
                    return (
                      <div
                        key={u.file_id}
                        style={{
                          background: "#FFFFFF",
                          border: isAttached ? "2px solid var(--forest-green)" : "1px solid var(--border-subtle)",
                          borderRadius: "8px",
                          padding: "12px 16px",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          flexWrap: "wrap",
                          gap: "10px",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <FileText size={20} color="var(--forest-green)" />
                          <div>
                            <div style={{ fontSize: "13.5px", fontWeight: 700, color: "var(--text-primary)" }}>
                              {u.filename}
                            </div>
                            <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                              {u.extracted_summary} • {(u.size_bytes / 1024).toFixed(0)} KB • ID: <code>{u.file_id}</code>
                            </div>
                          </div>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span
                            className="badge badge-forest"
                            style={{ fontSize: "11px", display: "inline-flex", alignItems: "center", gap: "4px" }}
                          >
                            <CheckCircle2 size={12} /> Bound to Plan
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
