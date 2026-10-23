# ECO-ECHO: AI-Driven Urban Sustainability Decision Engine

[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](LICENSE)
[![Python: 3.14](https://img.shields.io/badge/Python-3.14-blue.svg)](https://www.python.org/)
[![React: 19](https://img.shields.io/badge/React-19-cyan.svg)](https://react.dev/)
[![Solver: SciPy HiGHS](https://img.shields.io/badge/Solver-SciPy_HiGHS-047857.svg)](https://scipy.org/)
[![Audit: Verified](https://img.shields.io/badge/Security_Audit-Passed-059669.svg)](SECURITY_AUDIT.md)

**GitHub Repository:** [https://github.com/tejaswinis129/EC0-ECHO](https://github.com/tejaswinis129/EC0-ECHO)

---

## 1. Project Vision & Problem Statement

Cities face interconnected, compounding climate and environmental challenges:
- **Urban Heat Islands** and rising summer peak temperatures.
- **Extreme Rainfall Inundation** and drainage sewer surcharges.
- **Water Scarcity & Drought** stressing municipal utilities.
- **Unequal Green Cover Access** in historically disinvested districts.
- **Intervention Trade-offs**: Planting trees reduces heat but consumes scarce water during droughts; drainage improvements reduce flooding but incur high maintenance costs; greening without equity safeguards risks driving rent increases and displacement ("green gentrification").

**ECO-ECHO's Core Promise:** Don't just recommend a sustainability project. Explain what it improves, what it costs, who benefits, what unintended risks it introduces, and how recommendations pivot under future climate shocks.

---

## 2. Signature Innovation: The Consequence Chain

ECO-ECHO’s signature innovation is the **Consequence Chain**—a dynamic, traceable causal graph generated for every recommended intervention:

```
[ Root: Deploy Urban Shade Trees ]
       │
       ▼
 [ Direct Physical Footprint: 6,750 m² Transformed ]
       ├──► [ Microclimate Cooling: -1.2°C Thermal Anomaly ] (Model Estimate)
       │         │
       │         └──► [ Equity: Reduces Canopy Deficits in SVI >= 0.60 Areas ]
       │
       ├──► [ Stormwater Intercepted: 1,440 m³/yr Diverted ] (Empirical Model)
       │
       ├──► [ Water Trade-off: +742 m³/yr Consumption ] (Resource Burden)
       │         │
       │         └──► [ Scenario Vulnerability: Sapling Desiccation in Drought ]
       │
       └──► [ Fiscal Commitment: $171,000 Upfront + $12,600/yr O&M ]
                 │
                 └──► [ Mandatory Mitigation: Drip Irrigation & Soil Moisture Sensors ]
```

Each node explicitly displays:
- **Affected Sustainability Indicator** (Heat, Runoff, Water, Equity, Budget)
- **Impact Direction** (Positive Benefit, Resource Burden, Uncertain/Contextual)
- **Estimated Magnitude & Scientific Confidence Level** (Measured Empirical vs Calculated Model Estimate vs Benchmark Assumption)
- **Concrete Engineering & Social Mitigations** (e.g. drip irrigation, porous sub-bases, anti-displacement covenants)

---

## 3. Five Core Application Capabilities

1. **Data Engine**:
   - CSV upload with instant schema validation, range checks, null imputation, and duplicate detection.
   - Pre-loaded sample datasets: **Metro Verde Urban Resilience** (8 diverse districts) and **Coastal Basin Stormwater & Surge** (6 maritime districts).
2. **Sustainability Risk Engine**:
   - Transparent, documented formulas for Urban Heat Risk (UHRI), Stormwater Runoff Inundation (SRIRI), Municipal Water Stress (MWSI), Green Canopy Gap (GCAG), and Composite Vulnerability.
   - Interactive spatial choropleth/grid map fallback with district drill-downs.
3. **Multi-Objective AI Optimisation Engine**:
   - Built on native **SciPy HiGHS** dual simplex and interior-point linear programming.
   - Formulates Pareto trade-offs under budget, maintenance, space, and water boundaries with soft frontline equity balancing.
   - Generates 3 distinct alternatives: **Cost-Focused**, **Balanced**, and **Equity-Focused**.
4. **Climate Scenario Simulator**:
   - Dynamic recalculation under **Severe Drought** (-50% water), **100-Year Cloudburst** (+45% runoff), **Fiscal Austerity** (-35% budget), and **Compound Climate Shocks**.
   - Displays exact deltas: capital diff, water diff, runoff diff, equity shift, and list of de-scoped vs prioritized assets.
5. **Decision Explainer & Immutable Audit Records**:
   - AI Decision Explanation powered by **Amazon Bedrock (Claude 3 Sonnet)** with an automated, 100% operational **Deterministic Scientific Analytics Engine** fallback.
   - Cryptographic SHA-256 reproducibility hashes, downloadable CSV allocations, and print-ready executive HTML audit summaries.

---

## 4. Technology Architecture

- **Backend**: Python 3.14, FastAPI, Pydantic v2, SciPy (HiGHS solver), Pandas, SQLite, Boto3.
- **Frontend**: React 19, TypeScript, Vite, bespoke CSS design system (forest green & charcoal palette), Lucide icons.
- **Testing**: Pytest test suite covering all data, risk, optimization, scenario, and security endpoints (`server/tests/`).
- **Cloud & Persistence**: SQLite relational store (`eco_echo.db`) with optional AWS Bedrock and Amazon S3 connectors.

---

## 5. Quick Start Instructions (Local Development)

### Prerequisites
- Python 3.10+ (tested on Python 3.14.0 Windows 11)
- Node.js 18+ and npm (tested on Node v24.11.0, npm 11.6.1)

### Step 1: Clone Repository
```bash
git clone https://github.com/tejaswinis129/EC0-ECHO.git
cd EC0-ECHO
```

### Step 2: Backend Setup
```bash
# Create and activate Python virtual environment
python -m venv venv
.\venv\Scripts\Activate.ps1    # On Windows PowerShell
# source venv/bin/activate     # On Linux / macOS

# Install dependencies
pip install -r server/requirements.txt

# Run backend test suite (23 automated tests)
pytest server/tests/ -v

# Start FastAPI backend server
python -m uvicorn server.app.main:app --host 127.0.0.1 --port 8000 --reload
```
*Backend API will be running at:* `http://127.0.0.1:8000`  
*API Documentation (Swagger UI):* `http://127.0.0.1:8000/docs`

### Step 3: Frontend Setup (in a separate terminal)
```bash
cd client

# Install packages
npm install

# Build production bundle
npm run build

# Start Vite dev server
npm run dev -- --host 127.0.0.1 --port 5173
```
*Frontend Application will be running at:* `http://127.0.0.1:5173`

---

## 6. End-to-End Demonstration Workflow

Follow these steps during a live demonstration or hackathon judging review:

1. **Open Application**: Navigate to `http://127.0.0.1:5173/`. Verify the active **Metro Verde Urban Resilience** dataset and the **Engine Ready** status indicator.
2. **Review Baseline Risk**: Inspect the 4 KPI cards on the **Overview** page (City Climate Risk: 64.2/100, Surface Temp: 35.5°C, Water Stress: 1.13x).
3. **Explore Data & Provenance**: Click the **Data Explorer** tab. Inspect the dataset cards, data dictionary, quality score (100%), and tabular preview.
4. **Inspect Transparent Formulas**: Click **Risk Analysis**. Observe the interactive spatial district risk map. Click **View Transparent Formulas & Citations** to review the exact mathematical formulas for UHRI, SRIRI, MWSI, and GCAG.
5. **Run Multi-Objective Optimisation**: Click **Optimisation Studio**. Set the capital budget slider to `$2,500,000` and minimum equity floor to `30%`. Click **Compute Optimal Intervention Portfolios**.
6. **Compare 3 Pareto Strategies**: Switch between **Multi-Objective Balanced**, **Cost-Focused Allocation**, and **Equity & Frontline Climate Protection**. Note how the equity strategy channels 100% of investments to high-SVI districts like Industrial Harbor and East Riverside.
7. **Inspect Consequence Chain**: In the allocations table, click **Inspect Chain** on any intervention row. Observe the multi-tier causal graph tracing direct surface modification, thermal cooling, stormwater diversion, water demand burden, and 25-year lifecycle opex.
8. **Simulate Drought Stress Test**: Navigate to **Scenario Lab**. Click on **Severe Prolonged Drought (-50% Water)**. Note the dynamic deltas and how the engine contracts water-dependent street trees while scaling modular cisterns.
9. **Simulate Cloudburst Inundation**: Click **100-Year Cloudburst & Inundation (+45% Runoff)** to observe how the portfolio pivots toward bioswales and permeable pavement corridors.
10. **Archive Decision Record**: Go to **Reports & Audits**. Click **Archive Current Decision Record**. Inspect the generated record ID and cryptographic SHA-256 audit hash.
11. **Export Reports**: Click **Export CSV** to download the allocation spreadsheet, or click **View Print Audit** to generate the executive HTML audit report.
12. **Check Cloud & Security Settings**: Navigate to **Settings & Cloud** to inspect the active SQLite database path, security posture, and optional Amazon Bedrock status.

---

## 7. Security Hardening & Privacy Posture

- **Zero Secret Leaks**: Codebase, Git tree, and environment configurations audited.
- **Defensive Headers**: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `X-XSS-Protection: 1; mode=block`.
- **Request Boundary Limits**: 10 MB payload ceiling with automated HTTP 413 rejection.
- **Rate Limiting**: Sliding window rate-limiting middleware (120 req/min per IP) returning HTTP 429.
- **Audit Report**: Full details available in [`SECURITY_AUDIT.md`](SECURITY_AUDIT.md).

---

## 8. Statutory Planning Disclaimer

ECO-ECHO recommendations are heuristic computational decision-support outputs designed to assist municipal planners and engineers during preliminary master planning. They do not substitute for formal geotechnical, structural, hydrological, or environmental impact assessments by licensed professional engineers.
