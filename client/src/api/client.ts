import {
  DatasetMetadata,
  ValidationReport,
  DatasetSummary,
  RiskOverview,
  RiskWeightConfig,
  InterventionDefinition,
  OptimisationRequest,
  OptimisationResult,
  ScenarioParams,
  ScenarioSimulationResult,
  ConsequenceChainGraph,
  DecisionExplanation,
  DecisionRecord,
  SystemStatus,
  ImplementationPlanRequest,
  ClassificationResult,
  ImplementationPlan,
  PlanSummaryItem,
  DataSourceRegistryItem,
  RealWorldEvidenceRecord,
  UploadedDocumentMetadata,
  StructureDiagram,
  S3ImageUploadResponse,
  S3ObjectVerificationResponse,
  S3ImagesResponse,
} from "../types";

const rawApiBase = (import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE || "").trim();

function resolveApiBase(): string {
  if (!rawApiBase) {
    return import.meta.env.PROD || (typeof window !== "undefined" && window.location.port !== "5173")
      ? "/api"
      : "http://localhost:8000/api";
  }
  let base = rawApiBase;
  if (!base.startsWith("http://") && !base.startsWith("https://") && !base.startsWith("/")) {
    base = `https://${base}`;
  }
  return base.endsWith("/api") ? base : `${base.replace(/\/$/, "")}/api`;
}

const API_BASE = resolveApiBase();

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options?.headers || {}),
      },
    });

    if (!res.ok) {
      let errorMsg = `Server responded with ${res.status}: ${res.statusText}`;
      try {
        const errorData = await res.json();
        if (errorData.detail) {
          if (typeof errorData.detail === "string") {
            errorMsg = errorData.detail;
          } else if (errorData.detail.message) {
            errorMsg = errorData.detail.message;
          } else {
            errorMsg = JSON.stringify(errorData.detail);
          }
        }
      } catch {
        // ignore json parse failure on error response
      }
      throw new Error(errorMsg);
    }

    return (await res.json()) as T;
  } catch (err: any) {
    console.error(`API Error on ${url}:`, err);
    throw err;
  }
}

export const api = {
  // 1. Data Engine
  listDatasets: () => request<DatasetMetadata[]>("/data/datasets"),
  getDataset: (id: string, limit = 50) =>
    request<{ metadata: DatasetMetadata; records: any[]; columns: string[]; total_rows: number }>(
      `/data/datasets/${id}?limit=${limit}`
    ),
  getDatasetSummary: (id: string) => request<DatasetSummary>(`/data/datasets/${id}/summary`),
  validateCsv: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`${API_BASE}/data/validate`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Validation failed");
    }
    return (await res.json()) as { report: ValidationReport; sample_preview: any[] };
  },
  uploadDataset: async (file: File, name: string, provenance: string) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("name", name);
    formData.append("provenance", provenance);
    const res = await fetch(`${API_BASE}/data/upload`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail?.message || err.detail || "Upload failed");
    }
    return (await res.json()) as { message: string; metadata: DatasetMetadata; validation_report: ValidationReport };
  },

  // 2. Risk Analysis
  calculateRisk: (dataset_id: string, weights?: RiskWeightConfig) =>
    request<RiskOverview>("/risk/calculate", {
      method: "POST",
      body: JSON.stringify({ dataset_id, weights }),
    }),

  // 3. Intervention Library
  listInterventions: () => request<InterventionDefinition[]>("/interventions"),
  getIntervention: (id: string) => request<InterventionDefinition>(`/interventions/${id}`),
  upsertIntervention: (item: InterventionDefinition) =>
    request<InterventionDefinition>("/interventions", {
      method: "POST",
      body: JSON.stringify(item),
    }),
  resetInterventions: () =>
    request<InterventionDefinition[]>("/interventions/reset", {
      method: "POST",
    }),

  // 4. Optimisation Engine
  solveOptimisation: (req: OptimisationRequest) =>
    request<OptimisationResult>("/optimise/solve", {
      method: "POST",
      body: JSON.stringify(req),
    }),

  // 5. Scenario Simulator
  simulateScenario: (params: ScenarioParams) =>
    request<ScenarioSimulationResult>("/scenarios/simulate", {
      method: "POST",
      body: JSON.stringify(params),
    }),

  // 6. Consequence Chain
  getConsequenceChain: (params: {
    intervention_id: string;
    units_deployed?: number;
    neighbourhood_id?: string;
    neighbourhood_name?: string;
    strategy?: string;
    active_scenario?: string;
  }) => {
    const query = new URLSearchParams();
    query.set("intervention_id", params.intervention_id);
    if (params.units_deployed) query.set("units_deployed", params.units_deployed.toString());
    if (params.neighbourhood_id) query.set("neighbourhood_id", params.neighbourhood_id);
    if (params.neighbourhood_name) query.set("neighbourhood_name", params.neighbourhood_name);
    if (params.strategy) query.set("strategy", params.strategy);
    if (params.active_scenario) query.set("active_scenario", params.active_scenario);

    return request<ConsequenceChainGraph>(`/consequences/chain?${query.toString()}`);
  },

  // 7. AI Decision Explainer
  explainDecision: (data: any) =>
    request<DecisionExplanation>("/explain", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // 8. Reports & Decision Records
  saveDecisionRecord: (data: any) =>
    request<DecisionRecord>("/reports/save", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  listDecisionRecords: () =>
    request<Array<{ record_id: string; created_at: string; dataset_name: string; strategy: string; reproducibility_hash: string }>>(
      "/reports/list"
    ),
  getDecisionRecord: (recordId: string) => request<DecisionRecord>(`/reports/${recordId}`),
  exportAllocationsCsvUrl: `${API_BASE}/reports/export/csv`,
  exportHtmlReportUrl: `${API_BASE}/reports/export/html`,

  // 9. Settings & System Status
  getSystemStatus: () => request<SystemStatus>("/settings/status"),
  checkHealth: () => request<{ status: string; app: string; version: string }>("/health"),

  // 10. AI Urban Engineering & Implementation Planner
  classifyPlanRequest: (data: ImplementationPlanRequest) =>
    request<ClassificationResult>("/planner/classify", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  generateImplementationPlan: (data: ImplementationPlanRequest) =>
    request<ImplementationPlan>("/planner/generate", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getImplementationPlan: (planId: string) =>
    request<ImplementationPlan>(`/planner/plans/${planId}`),
  listImplementationPlans: () =>
    request<PlanSummaryItem[]>("/planner/plans"),
  recalculatePlanScenario: (planId: string, scenarioType: string) =>
    request<ImplementationPlan>(`/planner/plans/${planId}/scenario`, {
      method: "POST",
      body: JSON.stringify({ scenario_type: scenarioType }),
    }),
  exportPlanReport: (planId: string, format = "markdown") =>
    request<{ plan_id: string; format: string; reproducibility_hash: string; content: string }>(
      `/planner/plans/${planId}/export?format=${format}`
    ),

  // 11. Real-World Evidence & Data Source Registry
  listEvidenceSources: () =>
    request<DataSourceRegistryItem[]>("/evidence/sources"),
  getEvidenceSource: (sourceId: string) =>
    request<DataSourceRegistryItem>(`/evidence/sources/${sourceId}`),
  testSourceConnection: (sourceId: string) =>
    request<any>(`/evidence/sources/${sourceId}/test`),
  searchEvidenceRecords: (params?: {
    query?: string;
    category?: string;
    location?: string;
    provenance_type?: string;
  }) => {
    const sp = new URLSearchParams();
    if (params?.query) sp.append("query", params.query);
    if (params?.category) sp.append("category", params.category);
    if (params?.location) sp.append("location", params.location);
    if (params?.provenance_type) sp.append("provenance_type", params.provenance_type);
    const qs = sp.toString() ? `?${sp.toString()}` : "";
    return request<RealWorldEvidenceRecord[]>(`/evidence/records${qs}`);
  },
  getEvidenceRecord: (recordId: string) =>
    request<RealWorldEvidenceRecord>(`/evidence/records/${recordId}`),
  uploadEvidenceDocument: async (file: File): Promise<UploadedDocumentMetadata> => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`${API_BASE}/evidence/upload`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) {
      let errMsg = `Upload failed (${res.status})`;
      try {
        const d = await res.json();
        errMsg = d.detail || errMsg;
      } catch {}
      throw new Error(errMsg);
    }
    return res.json();
  },
  listUploadedDocuments: () =>
    request<UploadedDocumentMetadata[]>("/evidence/uploads"),

  // 12. Construction Structure Visualizer & Staged Diagrams
  getStructureDiagram: (projectType: string, view = "cross_section", location = "Bengaluru") =>
    request<StructureDiagram>(
      `/diagrams/${projectType}?view=${view}&location=${encodeURIComponent(location)}`
    ),
  getCustomStructureDiagram: (payload: {
    project_type: string;
    view?: string;
    location_name?: string;
    custom_params?: Record<string, any>;
  }) =>
    request<StructureDiagram>("/diagrams/custom", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  // 13. Amazon S3 Live Demonstration
  uploadImageToS3: async (file: File, description?: string): Promise<S3ImageUploadResponse> => {
    const formData = new FormData();
    formData.append("file", file);
    if (description) formData.append("description", description);
    const res = await fetch(`${API_BASE}/s3/upload-image`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) {
      let errMsg = `Image upload failed (${res.status})`;
      try {
        const err = await res.json();
        errMsg = err.detail || errMsg;
      } catch {}
      throw new Error(errMsg);
    }
    return (await res.json()) as S3ImageUploadResponse;
  },

  verifyS3Object: async (key: string): Promise<S3ObjectVerificationResponse> => {
    const res = await fetch(`${API_BASE}/s3/verify-object?key=${encodeURIComponent(key)}`);
    if (!res.ok) {
      let errMsg = `S3 verification failed (${res.status})`;
      try {
        const err = await res.json();
        errMsg = err.detail || errMsg;
      } catch {}
      throw new Error(errMsg);
    }
    return (await res.json()) as S3ObjectVerificationResponse;
  },

  listS3Images: (limit = 25): Promise<S3ImagesResponse> =>
    request<S3ImagesResponse>(`/s3/images?limit=${limit}`),

  getS3ImageStreamUrl: (key: string): string =>
    `${API_BASE}/s3/image-stream?key=${encodeURIComponent(key)}`,
};

