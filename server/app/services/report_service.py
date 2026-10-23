import json
import hashlib
import datetime
import io
import csv
from typing import Dict, Any, List, Optional

from ..models.decision_record import DecisionRecord
from ..models.optimisation import AlternativePortfolio, OptimisationRequest
from ..models.ai_explainer import DecisionExplanation
from .data_service import data_service

class ReportService:
    def create_decision_record(
        self,
        dataset_id: str,
        request: OptimisationRequest,
        baseline_risk: float,
        high_risk_count: int,
        selected_portfolio: AlternativePortfolio,
        other_alternatives: List[AlternativePortfolio],
        scenario_runs: List[Dict[str, Any]],
        consequences: List[str],
        unintended_tradeoffs: List[str],
        critical_mitigations: List[str],
        explanation: Optional[DecisionExplanation],
    ) -> DecisionRecord:
        meta = data_service.get_dataset_metadata(dataset_id)
        dataset_name = meta.name if meta else "Custom Urban Dataset"
        provenance = meta.provenance if meta else "User Upload"

        record_id = f"REC-{datetime.datetime.utcnow().strftime('%Y%m%d')}-{hashlib.md5(str(request.dict()).encode()).hexdigest()[:6].upper()}"
        created_at = datetime.datetime.utcnow().isoformat() + "Z"

        # Compute deterministic reproducibility hash
        hash_payload = json.dumps({
            "dataset_id": dataset_id,
            "request": request.dict(),
            "selected_strategy": selected_portfolio.strategy_id,
            "total_capex": selected_portfolio.total_capital_cost,
        }, sort_keys=True)
        reproducibility_hash = hashlib.sha256(hash_payload.encode()).hexdigest()

        limitations = [
            "Decision recommendations are generated via multi-objective linear programming heuristics.",
            "Hydrological and cooling outputs are district-aggregated model estimates based on EPA & CIRIA coefficients.",
            "Local site geotechnical, utilities, and structural load assessments are required prior to construction.",
            "Social Vulnerability Index indicates spatial priority and does not profile individual households."
        ]

        return DecisionRecord(
            record_id=record_id,
            created_at=created_at,
            reproducibility_hash=reproducibility_hash,
            dataset_id=dataset_id,
            dataset_name=dataset_name,
            dataset_provenance=provenance,
            optimisation_request=request,
            baseline_composite_risk=baseline_risk,
            high_risk_neighbourhood_count=high_risk_count,
            selected_strategy=selected_portfolio.strategy_id,
            recommended_portfolio=selected_portfolio,
            other_alternatives=other_alternatives,
            scenario_runs=scenario_runs,
            key_consequences_identified=consequences,
            unintended_tradeoffs=unintended_tradeoffs,
            critical_mitigations=critical_mitigations,
            explanation=explanation,
            data_limitations=limitations
        )

    def generate_csv_export(self, portfolio: AlternativePortfolio) -> str:
        """Generates downloadable CSV containing detailed intervention allocations."""
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Header info
        writer.writerow(["ECO-ECHO Urban Sustainability Allocation Report"])
        writer.writerow(["Strategy", portfolio.strategy_label])
        writer.writerow(["Total Capital Cost (USD)", portfolio.total_capital_cost])
        writer.writerow(["Total Annual Maintenance (USD/yr)", portfolio.total_annual_maintenance])
        writer.writerow(["Stormwater Runoff Diverted (m3/yr)", portfolio.total_stormwater_runoff_diverted_m3])
        writer.writerow(["Net Water Impact (m3/yr)", portfolio.net_annual_water_impact_m3])
        writer.writerow(["Equity Score (0-100)", portfolio.equity_score])
        writer.writerow([])
        
        # Allocations table
        writer.writerow([
            "Neighbourhood ID",
            "Neighbourhood Name",
            "Intervention Name",
            "Units Allocated",
            "Unit Label",
            "Capital Cost (USD)",
            "Annual Maintenance (USD)",
            "Space Used (m2)",
            "Water Impact (m3/yr)",
            "Runoff Reduction (m3/yr)",
            "Heat Reduction Index"
        ])

        for a in portfolio.allocations:
            writer.writerow([
                a.neighbourhood_id,
                a.neighbourhood_name,
                a.intervention_name,
                a.units_allocated,
                a.unit_label,
                a.capital_cost,
                a.annual_maintenance,
                a.space_used_m2,
                a.water_demand_impact_m3_year,
                a.estimated_runoff_reduction_m3,
                a.estimated_heat_reduction_deg_effect
            ])

        return output.getvalue()

    def generate_html_report(self, record: DecisionRecord) -> str:
        """Generates an executive-ready, print-formatted HTML audit document."""
        p = record.recommended_portfolio
        allocations_rows = "".join([
            f"<tr>"
            f"<td><b>{a.neighbourhood_name}</b> ({a.neighbourhood_id})</td>"
            f"<td>{a.intervention_name}</td>"
            f"<td>{a.units_allocated:,.1f} {a.unit_label}</td>"
            f"<td>${a.capital_cost:,.0f}</td>"
            f"<td>${a.annual_maintenance:,.0f}</td>"
            f"<td>{a.estimated_runoff_reduction_m3:,.0f} m³</td>"
            f"<td>{a.water_demand_impact_m3_year:+,.0f} m³</td>"
            f"</tr>"
            for a in p.allocations
        ])

        tradeoffs_html = "".join([f"<li>{t}</li>" for t in record.unintended_tradeoffs])
        mitigations_html = "".join([f"<li>{m}</li>" for m in record.critical_mitigations])
        constraints_html = "".join([f"<li>{c}</li>" for c in p.binding_constraints])

        ai_sec = ""
        if record.explanation:
            e = record.explanation
            ai_sec = f"""
            <div class="section">
                <h2>AI Decision Explanation ({e.provider})</h2>
                <p><strong>Executive Summary:</strong> {e.executive_summary}</p>
                <p><strong>Why this portfolio was selected:</strong> {e.why_selected}</p>
                <p><strong>Equity & Disinvestment Analysis:</strong> {e.neighbourhood_equity_analysis}</p>
                <p><strong>What Could Go Wrong:</strong> {e.what_could_go_wrong}</p>
            </div>
            """

        html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>ECO-ECHO Decision Record - {record.record_id}</title>
<style>
    body {{ font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; color: #1e293b; background: #f8fafc; padding: 40px; line-height: 1.6; max-width: 1000px; margin: auto; }}
    .header {{ border-bottom: 2px solid #0f766e; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-start; }}
    h1 {{ color: #0f766e; margin: 0 0 5px 0; font-size: 28px; }}
    .meta-tag {{ font-family: monospace; font-size: 13px; color: #64748b; background: #e2e8f0; padding: 4px 8px; border-radius: 4px; }}
    .kpi-grid {{ display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 30px; }}
    .kpi-card {{ background: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px; padding: 15px; text-align: center; }}
    .kpi-val {{ font-size: 22px; font-weight: bold; color: #0f766e; margin: 5px 0; }}
    .kpi-label {{ font-size: 12px; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px; }}
    .section {{ background: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px; padding: 25px; margin-bottom: 25px; }}
    h2 {{ color: #1e293b; font-size: 18px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-top: 0; }}
    table {{ width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 14px; }}
    th, td {{ padding: 10px 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }}
    th {{ background: #f1f5f9; color: #475569; font-weight: 600; }}
    ul {{ margin: 10px 0; padding-left: 20px; }}
    li {{ margin-bottom: 6px; }}
    .disclaimer {{ background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; padding: 15px; font-size: 13px; color: #991b1b; margin-top: 30px; }}
    @media print {{ body {{ padding: 0; background: #ffffff; }} .section, .kpi-card {{ border: 1px solid #ccc; }} }}
</style>
</head>
<body>
    <div class="header">
        <div>
            <h1>ECO-ECHO Urban Sustainability Decision Record</h1>
            <div style="color: #64748b; font-size: 14px;">AI-Driven Urban Resilience Portfolio & Scientific Audit</div>
        </div>
        <div style="text-align: right;">
            <div class="meta-tag">{record.record_id}</div>
            <div style="font-size: 12px; color: #64748b; margin-top: 5px;">Generated: {record.created_at}</div>
        </div>
    </div>

    <div class="kpi-grid">
        <div class="kpi-card">
            <div class="kpi-label">Capital Expenditure</div>
            <div class="kpi-val">${p.total_capital_cost:,.0f}</div>
            <div style="font-size: 11px; color: #64748b;">Budget Cap: ${record.optimisation_request.total_budget_cap:,.0f}</div>
        </div>
        <div class="kpi-card">
            <div class="kpi-label">Annual Maintenance</div>
            <div class="kpi-val">${p.total_annual_maintenance:,.0f}/yr</div>
            <div style="font-size: 11px; color: #64748b;">Ongoing Stewardship</div>
        </div>
        <div class="kpi-card">
            <div class="kpi-label">Stormwater Diverted</div>
            <div class="kpi-val">{p.total_stormwater_runoff_diverted_m3:,.0f} m³</div>
            <div style="font-size: 11px; color: #64748b;">Flood Risk Mitigation</div>
        </div>
        <div class="kpi-card">
            <div class="kpi-label">Equity Score</div>
            <div class="kpi-val">{p.equity_score:.1f} / 100</div>
            <div style="font-size: 11px; color: #64748b;">{p.vulnerable_area_investment_share_pct:.1f}% to Frontline Areas</div>
        </div>
    </div>

    <div class="section">
        <h2>Recommended Portfolio Allocations: {p.strategy_label}</h2>
        <p><em>{p.strategy_rationale}</em></p>
        <table>
            <thead>
                <tr>
                    <th>District</th>
                    <th>Intervention</th>
                    <th>Scale Deployed</th>
                    <th>Capital Cost</th>
                    <th>Annual O&M</th>
                    <th>Runoff Diverted</th>
                    <th>Water Impact</th>
                </tr>
            </thead>
            <tbody>
                {allocations_rows}
            </tbody>
        </table>
    </div>

    <div class="section">
        <h2>Signature Consequence Chain & Trade-off Analysis</h2>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            <div>
                <h3 style="font-size: 15px; color: #b91c1c; margin-top: 0;">Unintended Consequences & Trade-offs</h3>
                <ul>{tradeoffs_html}</ul>
                <h3 style="font-size: 15px; color: #334155; margin-top: 15px;">Active Binding Constraints</h3>
                <ul>{constraints_html}</ul>
            </div>
            <div>
                <h3 style="font-size: 15px; color: #047857; margin-top: 0;">Required Planning Mitigations</h3>
                <ul>{mitigations_html}</ul>
            </div>
        </div>
    </div>

    {ai_sec}

    <div class="section">
        <h2>Provenance & Reproducibility Audit</h2>
        <p><strong>Dataset Used:</strong> {record.dataset_name} ({record.dataset_provenance})</p>
        <p><strong>Cryptographic Audit Hash:</strong> <code style="font-size: 12px; background: #e2e8f0; padding: 2px 6px; border-radius: 4px;">{record.reproducibility_hash}</code></p>
        <p style="font-size: 13px; color: #64748b;">This record can be imported into ECO-ECHO to mathematically reproduce the exact identical decision portfolio under equivalent solver parameters.</p>
    </div>

    <div class="disclaimer">
        <strong>Statutory Planning Disclaimer:</strong> {record.disclaimer}
    </div>
</body>
</html>
        """
        return html_content

report_service = ReportService()
