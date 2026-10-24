# ECO-ECHO API Reference Documentation

- **Production HTTPS Base URL:** `https://3.110.42.213.sslip.io/api`
- **Production HTTP Fallback:** `http://3.110.42.213/api`
- **Local Development Base URL:** `http://localhost:8000/api`

---

## 1. System Endpoints

### `GET /health`
Returns system status, active version, and timestamp.
```json
{
  "status": "healthy",
  "app": "ECO-ECHO",
  "version": "1.0.0",
  "timestamp": 1792738399.79
}
```

### `GET /settings/status`
Returns database connection status and AWS service integration configurations.

---

## 2. Data Engine Endpoints

### `GET /data/datasets`
Returns metadata list of available municipal datasets (built-in samples and custom uploads).

### `GET /data/datasets/{id}`
Returns district records, columns, and metadata for a specific dataset.

### `GET /data/datasets/{id}/summary`
Returns aggregate indicators (total population, average surface temp, water stress ratio).

### `POST /data/validate`
Validates an uploaded CSV without registering it. Returns schema check, quality score (0-100), and missing columns.
- **Request:** `multipart/form-data` with `file: File`
- **Response:** `ValidationReport`

### `POST /data/upload`
Uploads, validates, and persists a new municipal dataset in the local store.
- **Request:** `multipart/form-data` with `file: File`, `name: string`, `provenance: string`

---

## 3. Sustainability Risk Endpoints

### `POST /risk/calculate`
Calculates district-level risk indicators and transparent formula documentation.
- **Request:**
  ```json
  {
    "dataset_id": "sample-metro-verde",
    "weights": {
      "heat_weight": 0.25,
      "flood_weight": 0.25,
      "water_stress_weight": 0.20,
      "green_gap_weight": 0.15,
      "equity_weight": 0.15
    }
  }
  ```
- **Response:** `RiskOverview` containing `neighbourhood_scores`, `city_composite_risk`, `formulas_documentation`, and `limitations`.

---

## 4. Multi-Objective Optimisation Endpoints

### `POST /optimise/solve`
Executes the SciPy HiGHS linear programming solver to generate 3 Pareto-optimal alternatives.
- **Request:**
  ```json
  {
    "dataset_id": "sample-metro-verde",
    "total_budget_cap": 2500000.0,
    "min_equity_investment_share": 0.30,
    "weights": {
      "heat_reduction": 0.25,
      "flood_reduction": 0.25,
      "water_resilience": 0.20,
      "green_equity": 0.20,
      "cost_efficiency": 0.10
    }
  }
  ```
- **Response:** `OptimisationResult` with 3 alternative portfolios (`balanced`, `cost_focused`, `equity_focused`) and binding constraint diagnostics.

---

## 5. Consequence Chain Endpoints

### `GET /consequences/chain`
Generates a dynamic multi-tier directed causal graph based on the selected intervention, units, and active climate scenario.
- **Query Parameters:**
  - `intervention_id`: string (e.g. `int-urban-forest`)
  - `units_deployed`: float (e.g. `500.0`)
  - `neighbourhood_id`: optional string
  - `active_scenario`: optional string (`drought`, `extreme_rainfall`, `budget_cut`)
- **Response:** `ConsequenceChainGraph` containing `nodes`, `edges`, `unintended_tradeoffs_summary`, and `priority_mitigation_actions`.

---

## 6. Climate Scenario Simulator Endpoints

### `POST /scenarios/simulate`
Recalculates the full optimization model under simulated climate stress.
- **Request:**
  ```json
  {
    "scenario_type": "drought",
    "water_supply_change_pct": -50.0,
    "extreme_rainfall_surge_pct": 0.0,
    "budget_cut_pct": 0.0,
    "temperature_anomaly_c": 2.2,
    "base_optimisation_request": { ... }
  }
  ```
- **Response:** `ScenarioSimulationResult` with baseline vs scenario portfolio deltas, contracted vs prioritized interventions, and mitigations.

---

## 7. Reports & Decision Records Endpoints

### `POST /reports/save`
Persists a reproducible Decision Record in SQLite with a cryptographic SHA-256 hash.

### `GET /reports/list`
Lists previously archived decision records.

### `POST /reports/export/csv`
Downloads portfolio allocations as a CSV file.

### `POST /reports/export/html`
Generates an executive, print-formatted HTML audit document.
