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
} from "../types";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000/api";

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
};
