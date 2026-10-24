import React, { useState, useEffect } from "react";
import {
  DatasetMetadata,
  ValidationReport,
  DatasetSummary,
  S3ImageUploadResponse,
  S3ObjectVerificationResponse,
  S3ImageListItem,
} from "../types";
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
  Image as ImageIcon,
  Cloud,
  Lock,
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

  // Amazon S3 Image Upload & Live Demonstration State
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [imageDescription, setImageDescription] = useState<string>("");
  const [isUploadingImage, setIsUploadingImage] = useState<boolean>(false);
  const [imageUploadResult, setImageUploadResult] = useState<S3ImageUploadResponse | null>(null);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);
  const [isVerifyingS3, setIsVerifyingS3] = useState<boolean>(false);
  const [verifiedObjectData, setVerifiedObjectData] = useState<S3ObjectVerificationResponse | null>(null);
  const [s3ImagesList, setS3ImagesList] = useState<S3ImageListItem[]>([]);
  const [isLoadingS3Images, setIsLoadingS3Images] = useState<boolean>(false);

  useEffect(() => {
    loadDatasetList();
    loadS3ImagesList();
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

  const handleImageFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImageUploadError(null);
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (!ext || !["jpg", "jpeg", "png"].includes(ext)) {
        setImageUploadError("Unsupported format. Please select a JPG, JPEG, or PNG image.");
        setSelectedImageFile(null);
        setImagePreviewUrl(null);
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setImageUploadError(`File exceeds 10MB limit (${(file.size / (1024 * 1024)).toFixed(2)} MB).`);
        setSelectedImageFile(null);
        setImagePreviewUrl(null);
        return;
      }
      setSelectedImageFile(file);
      setImagePreviewUrl(URL.createObjectURL(file));
      setImageUploadResult(null);
      setVerifiedObjectData(null);
    }
  };

  const resetImageSelection = () => {
    setSelectedImageFile(null);
    setImagePreviewUrl(null);
    setImageDescription("");
    setImageUploadError(null);
    setImageUploadResult(null);
    setVerifiedObjectData(null);
  };

  const handleImageUploadSubmit = async () => {
    if (!selectedImageFile) return;
    setIsUploadingImage(true);
    setImageUploadError(null);
    try {
      const res = await api.uploadImageToS3(selectedImageFile, imageDescription);
      setImageUploadResult(res);
      await loadS3ImagesList();
    } catch (err: any) {
      setImageUploadError(err.message || "Failed to upload image to Amazon S3.");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleVerifyObjectInS3 = async (key: string) => {
    setIsVerifyingS3(true);
    try {
      const res = await api.verifyS3Object(key);
      setVerifiedObjectData(res);
    } catch (err: any) {
      setImageUploadError(err.message || "Failed to verify object in Amazon S3.");
    } finally {
      setIsVerifyingS3(false);
    }
  };

  const loadS3ImagesList = async () => {
    setIsLoadingS3Images(true);
    try {
      const res = await api.listS3Images(25);
      setS3ImagesList(res.images || []);
    } catch {
      // S3 images list optional silently falls back
    } finally {
      setIsLoadingS3Images(false);
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

      {/* Amazon S3 Image Upload & Live Demonstration Section */}
      <div
        className="card"
        style={{
          marginBottom: "24px",
          border: "1px solid #c2decb",
          background: "linear-gradient(180deg, #fdfbf7 0%, #ffffff 100%)",
        }}
      >
        <div className="card-header">
          <div className="card-title-group">
            <ImageIcon size={20} color="var(--forest-green)" />
            <div>
              <div className="card-title" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span>Upload Image to Amazon S3</span>
                <span className="badge badge-green" style={{ fontSize: "11px", fontWeight: 600 }}>
                  Live AWS Demonstration
                </span>
              </div>
              <div className="card-subtitle">
                Direct multipart upload of site photos & visual evidence to Amazon S3 (<code>eco-echo-sustainability-data-2026</code>) with empirical object verification.
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
            <span className="badge badge-neutral" style={{ fontSize: "11px" }}>
              <Lock size={11} style={{ marginRight: "4px", verticalAlign: "middle" }} />
              Private • AES256
            </span>
            <span className="badge badge-neutral" style={{ fontSize: "11px" }}>
              Region: ap-south-1
            </span>
          </div>
        </div>

        <div className="grid-split-2-1" style={{ alignItems: "start", marginBottom: 0 }}>
          {/* Left Column: Upload Controls */}
          <div>
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600 }}>
                Select Image File (JPG, JPEG, or PNG)
              </label>
              <input
                type="file"
                accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                onChange={handleImageFileSelect}
                className="form-control"
                style={{ padding: "8px 10px", background: "var(--white)" }}
              />
              <div style={{ fontSize: "11.5px", color: "var(--text-secondary)", marginTop: "4px" }}>
                Accepted extensions: <strong>.jpg, .jpeg, .png</strong> • Max size: <strong>10 MB</strong> • Private bucket encrypted with AES256.
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: "16px" }}>
              <label className="form-label">Photo Description / Evidence Note (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Koramangala SWD concrete retaining wall inspection photo"
                value={imageDescription}
                onChange={(e) => setImageDescription(e.target.value)}
                className="form-control"
              />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
              <button
                className="btn btn-primary"
                onClick={handleImageUploadSubmit}
                disabled={!selectedImageFile || isUploadingImage}
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
              >
                <Cloud size={15} />
                <span>{isUploadingImage ? "Uploading to Amazon S3..." : "Upload Image to S3"}</span>
              </button>

              {selectedImageFile && (
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={resetImageSelection}
                  disabled={isUploadingImage}
                >
                  Clear Selection
                </button>
              )}
            </div>

            {/* Error Message */}
            {imageUploadError && (
              <div
                style={{
                  marginTop: "14px",
                  padding: "12px 14px",
                  borderRadius: "var(--radius-button)",
                  background: "var(--risk-severe-bg)",
                  border: "1px solid #f3cbc8",
                  color: "var(--risk-severe)",
                  fontSize: "12.5px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <AlertTriangle size={16} />
                <span>{imageUploadError}</span>
              </div>
            )}

            {/* Success Upload Card */}
            {imageUploadResult && (
              <div
                style={{
                  marginTop: "16px",
                  padding: "16px",
                  borderRadius: "var(--radius-card)",
                  background: "var(--risk-moderate-bg)",
                  border: "1px solid #c2decb",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                  <CheckCircle2 size={18} color="var(--risk-moderate)" />
                  <strong style={{ color: "var(--risk-moderate)", fontSize: "14px" }}>
                    Uploaded & Verified in Amazon S3
                  </strong>
                </div>

                <div style={{ fontSize: "12px", color: "var(--text-primary)", display: "flex", flexDirection: "column", gap: "6px" }}>
                  <div>
                    <strong>S3 Object Key:</strong>{" "}
                    <code style={{ background: "rgba(255,255,255,0.8)", padding: "2px 6px", borderRadius: "4px" }}>
                      {imageUploadResult.s3_key}
                    </code>
                  </div>
                  <div>
                    <strong>S3 URI:</strong>{" "}
                    <code style={{ background: "rgba(255,255,255,0.8)", padding: "2px 6px", borderRadius: "4px" }}>
                      {imageUploadResult.s3_uri}
                    </code>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", marginTop: "4px" }}>
                    <div><strong>Bucket:</strong> {imageUploadResult.bucket}</div>
                    <div><strong>Region:</strong> {imageUploadResult.region}</div>
                    <div><strong>File Size:</strong> {imageUploadResult.size_kb} KB ({imageUploadResult.size_bytes.toLocaleString()} bytes)</div>
                    <div><strong>Content-Type:</strong> {imageUploadResult.content_type}</div>
                    <div><strong>ETag (MD5):</strong> <code>{imageUploadResult.etag}</code></div>
                    <div><strong>Encryption:</strong> {imageUploadResult.server_side_encryption}</div>
                  </div>
                </div>

                <div style={{ marginTop: "12px", display: "flex", gap: "8px" }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleVerifyObjectInS3(imageUploadResult.s3_key)}
                    disabled={isVerifyingS3}
                  >
                    <ShieldCheck size={13} />
                    <span>{isVerifyingS3 ? "Querying S3..." : "Verify Object Directly in S3 (head_object)"}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Live Image Preview & Direct S3 Verification Details */}
          <div>
            {imageUploadResult ? (
              <div
                style={{
                  background: "var(--white)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-card)",
                  padding: "16px",
                  textAlign: "center",
                }}
              >
                <div style={{ fontWeight: 600, fontSize: "13px", marginBottom: "8px", color: "var(--text-primary)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>S3 Image Stream</span>
                  <span className="badge badge-water" style={{ fontSize: "10.5px" }}>Streamed from Private S3</span>
                </div>
                <div style={{ maxHeight: "200px", overflow: "hidden", borderRadius: "6px", border: "1px solid var(--border-subtle)", background: "#f8f9fa", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <img
                    src={api.getS3ImageStreamUrl(imageUploadResult.s3_key)}
                    alt={imageUploadResult.filename}
                    style={{ maxWidth: "100%", maxHeight: "200px", objectFit: "contain" }}
                  />
                </div>
                <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "6px" }}>
                  File: {imageUploadResult.filename} • Upload latency: {imageUploadResult.upload_latency_ms} ms
                </div>

                {verifiedObjectData && (
                  <div
                    style={{
                      marginTop: "12px",
                      textAlign: "left",
                      padding: "10px 12px",
                      background: "var(--warm-ivory)",
                      borderRadius: "6px",
                      border: "1px solid var(--border-subtle)",
                      fontSize: "11px",
                    }}
                  >
                    <div style={{ fontWeight: 700, color: "var(--forest-green)", marginBottom: "4px", display: "flex", alignItems: "center", gap: "4px" }}>
                      <CheckCircle2 size={13} /> S3 Object Confirmed Active (HTTP 200 head_object)
                    </div>
                    <div><strong>Last Modified:</strong> {verifiedObjectData.last_modified}</div>
                    <div><strong>Storage Class:</strong> {verifiedObjectData.storage_class}</div>
                    <div><strong>ETag Checksum:</strong> <code>{verifiedObjectData.etag}</code></div>
                  </div>
                )}
              </div>
            ) : imagePreviewUrl ? (
              <div
                style={{
                  background: "var(--white)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-card)",
                  padding: "16px",
                  textAlign: "center",
                }}
              >
                <div style={{ fontWeight: 600, fontSize: "13px", marginBottom: "8px", color: "var(--text-primary)" }}>
                  Local Preview (Ready to Upload)
                </div>
                <div style={{ maxHeight: "180px", overflow: "hidden", borderRadius: "6px", border: "1px solid var(--border-subtle)", background: "#f8f9fa", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <img
                    src={imagePreviewUrl}
                    alt="Preview"
                    style={{ maxWidth: "100%", maxHeight: "180px", objectFit: "contain" }}
                  />
                </div>
                <div style={{ fontSize: "11.5px", color: "var(--text-secondary)", marginTop: "6px" }}>
                  {selectedImageFile?.name} ({(selectedImageFile ? selectedImageFile.size / 1024 : 0).toFixed(1)} KB)
                </div>
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
                <div style={{ fontWeight: 700, color: "var(--text-primary)", marginBottom: "6px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <ShieldCheck size={16} color="var(--forest-green)" />
                  Amazon S3 Integration Architecture:
                </div>
                <ul style={{ margin: 0, paddingLeft: "16px", display: "flex", flexDirection: "column", gap: "4px" }}>
                  <li>Direct authenticated upload to AWS S3 bucket in <code>ap-south-1</code>.</li>
                  <li>AES256 server-side encryption enforced on all objects.</li>
                  <li>Private ACL with zero public bucket exposure.</li>
                  <li>Real-time S3 <code>head_object</code> roundtrip verification proving physical S3 existence.</li>
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Recent S3 Uploaded Images List for Demo */}
        {s3ImagesList.length > 0 && (
          <div style={{ marginTop: "16px", paddingTop: "14px", borderTop: "1px solid var(--border-subtle)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-primary)" }}>
                Recent Images in S3 Bucket (<code>evidence_images/</code>):
              </div>
              <button
                className="btn btn-secondary btn-sm"
                onClick={loadS3ImagesList}
                disabled={isLoadingS3Images}
                style={{ fontSize: "11px", padding: "3px 8px" }}
              >
                <RefreshCw size={11} />
                <span>Refresh S3 Objects</span>
              </button>
            </div>
            <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "6px" }}>
              {s3ImagesList.slice(0, 6).map((img, idx) => (
                <div
                  key={idx}
                  onClick={() => handleVerifyObjectInS3(img.key)}
                  style={{
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "6px",
                    padding: "6px 10px",
                    background: "var(--white)",
                    fontSize: "11px",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                  }}
                  title="Click to verify in S3"
                >
                  <div style={{ fontWeight: 600, color: "var(--forest-green)" }}>
                    {img.key.replace("evidence_images/", "")}
                  </div>
                  <div style={{ color: "var(--text-secondary)", fontSize: "10px" }}>
                    {img.size_kb} KB • {img.last_modified.split("T")[0]}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
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
