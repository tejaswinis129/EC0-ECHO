# ECO-ECHO System Architecture & Methodology

## 1. System Overview

ECO-ECHO is an AI-driven urban sustainability decision engine architected around 5 core computational pillars:

1. **Data Engine**: Municipal schema validation, unit normalisation, quality scoring, and dual sample dataset loading.
2. **Sustainability Risk Engine**: Multi-hazard indices (Urban Heat Island, Stormwater Runoff Inundation, Municipal Water Deficit, Green Canopy Gap, and Social Vulnerability) computed via transparent, documented formulas.
3. **Multi-Objective Optimisation Engine**: Real mathematical optimization using SciPy's HiGHS dual simplex and interior-point linear programming solver. Formulates Pareto-optimal portfolios under hard capital, maintenance, space, and water boundaries with soft frontline equity balancing.
4. **Climate Scenario Simulator**: Dynamic stress-testing under prolonged droughts (-50% water), 100-year cloudbursts (+45% runoff), and fiscal budget shocks (-35%).
5. **Decision Explainer with Consequence Chain**: The signature causal graph mapping direct effects, environmental gains, water/resource trade-offs, financial lifecycles, frontline equity dynamics, scenario vulnerabilities, and engineering mitigations.

```
┌────────────────────────────────────────────────────────────────────────┐
│                          ECO-ECHO ARCHITECTURE                         │
└────────────────────────────────────────────────────────────────────────┘

 [ React + TypeScript + Vite Frontend ]
      │  ▲
      │  │  Typed REST API (JSON / Multipart)
      ▼  │
 [ FastAPI Server (Python 3.14) ]
   ├── Middleware: CORS, Security Headers (nosniff, DENY), Rate Limiting, 10MB Sizing
   │
   ├── Module A: Data Service ────► CSV Ingestion, Unit Normalisation, Schema Validation
   │
   ├── Module B: Risk Engine ─────► Transparent Mathematical Hazard Formulation
   │
   ├── Module C: Library Service ─► Technical Catalog (Green Roofs, Forests, Cisterns, SUDS)
   │
   ├── Module D: Optimiser ───────► SciPy HiGHS Solver (Cost, Balanced, Equity Strategies)
   │
   ├── Module E: Consequence Engine► Dynamic Directed Causal Graph & Evidence Synthesis
   │
   ├── Module F: Scenario Lab ────► Recalculates Portfolios under Drought, Flood, Austerity
   │
   ├── Module G: AI Explainer ────► Amazon Bedrock (Claude 3) + Deterministic Fallback Engine
   │
   ├── Module H: Reports Service ─► CSV Exports, Print HTML Summaries, SHA-256 Decision Records
   │
   └── Persistence: SQLite Relational Database (eco_echo.db) + Optional Amazon S3
```

---

## 2. Mathematical Optimisation Formulation

The optimization problem is formulated as a bounded multi-objective linear program solved via `scipy.optimize.linprog(method='highs')`:

### Decision Variables
Let $x_{i, n} \ge 0$ denote the continuous scale of intervention $i \in I$ allocated to district $n \in N$.

### Multi-Attribute Objective Function
$$\max_{x} \sum_{i \in I} \sum_{n \in N} x_{i, n} \cdot \left[ \Big( w_h \cdot \Delta H_{i, n} + w_f \cdot \Delta F_{i, n} + w_w \cdot \Delta W_{i, n} \Big) \cdot \Big(1 + \lambda_{eq} \cdot \text{SVI}_n \Big) - w_c \cdot \frac{C_i}{100} \right]$$

Where:
- $\Delta H_{i, n}$: Cooling benefit scaled by district temperature deficit
- $\Delta F_{i, n}$: Stormwater runoff diverted scaled by drainage surcharge ratio
- $\Delta W_{i, n}$: Net water resilience (positive for cisterns, negative for trees)
- $\text{SVI}_n$: Social Vulnerability Index of district $n$ ($0.0 \le \text{SVI}_n \le 1.0$)
- $\lambda_{eq}$: Equity priority multiplier (1.0 for Cost-Focused, 1.5 for Balanced, 3.5 for Equity-Focused)
- $C_i$: Unit capital cost in USD

### Boundary Constraints
1. **Capital Budget Limit:**
   $$\sum_{i \in I} \sum_{n \in N} x_{i, n} \cdot C_i \le B_{\text{cap}}$$
2. **Annual Maintenance Ceiling (Optional):**
   $$\sum_{i \in I} \sum_{n \in N} x_{i, n} \cdot M_i \le M_{\text{cap}}$$
3. **District Surface Space Ceilings:**
   $$\sum_{i \in \text{Roof}} x_{i, n} \cdot S_i \le 0.70 \cdot \text{RoofArea}_n \quad \forall n \in N$$
   $$\sum_{i \in \text{Public}} x_{i, n} \cdot S_i \le 0.75 \cdot \text{PublicLand}_n \quad \forall n \in N$$
   $$\sum_{i \in \text{Road}} x_{i, n} \cdot S_i \le 0.80 \cdot \text{CorridorArea}_n \quad \forall n \in N$$
4. **Frontline Equity Floor Constraint:**
   $$\sum_{n \in N_{\text{vuln}}} \sum_{i \in I} x_{i, n} \cdot C_i \ge \theta_{\text{min}} \cdot \sum_{n \in N} \sum_{i \in I} x_{i, n} \cdot C_i$$
   Where $N_{\text{vuln}} = \{n \in N \mid \text{SVI}_n \ge 0.60\}$ and $\theta_{\text{min}} \ge 0.30$ (or $\ge 0.55$ for Equity strategy).

---

## 3. Signature Innovation: Consequence Chain

For every recommended project, ECO-ECHO generates a multi-tier directed causal graph:
- **Root Node**: Intervention selection and scale commitment
- **Tier 1 (Direct Footprint)**: Physical land/roof surface transformed
- **Tier 2 (Environmental)**: Microclimate cooling and stormwater diverted
- **Tier 2 (Resource Trade-off)**: Net municipal water consumption or non-potable harvest
- **Tier 3 (Lifecycle Financial)**: Upfront capex + 25-year operational maintenance burden
- **Tier 3 (Social Equity)**: Environmental justice gains vs green gentrification risks
- **Tier 4 (Scenario Vulnerability)**: Sapling desiccation in drought / siltation surcharge in cloudburst
- **Tier 4 (Engineering Mitigation)**: Concrete technical protocols (sensor drip irrigation, anti-displacement covenants)

---

## 4. AWS Integration Architecture

| Service | Architecture Role | Production Cloud | Local Development Fallback |
|---|---|---|---|
| **Amazon Bedrock** | AI Decision Explanation (Claude 3 Sonnet) | Direct boto3 invocation | Deterministic Scientific Engine (No API key needed) |
| **Amazon S3** | Ingested CSV & PDF audit storage | S3 bucket upload | Local filesystem (`app/data/`) |
| **AWS IAM** | Least-privilege API credentials | IAM roles & policies | Local environment `.env` |
