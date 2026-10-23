import pytest
from server.app.services.ai_explainer import ai_explainer_service
from server.app.services.report_service import report_service
from server.app.models.ai_explainer import ExplanationRequest
from server.app.models.optimisation import OptimisationRequest
from server.app.services.optimisation_engine import optimisation_engine
from server.app.database import db_manager

def test_ai_deterministic_explainer():
    req = ExplanationRequest(
        portfolio_strategy="balanced",
        dataset_name="Metro Verde Urban Resilience",
        total_budget_cap=2000000.0,
        total_capital_allocated=1980000.0,
        budget_utilization_pct=99.0,
        heat_reduction_score=1.45,
        stormwater_diverted_m3=45000.0,
        net_water_impact_m3=-1200.0,
        equity_score=68.5,
        vulnerable_investment_pct=42.0,
        binding_constraints=["Capital budget cap reached"],
        trade_offs=["Net water surplus due to cisterns"],
        key_neighbourhoods=[]
    )
    explanation = ai_explainer_service.explain(req)
    assert explanation is not None
    assert explanation.executive_summary != ""
    assert explanation.why_selected != ""
    assert len(explanation.priority_investigations_before_build) >= 3
    assert explanation.is_fallback is True

def test_report_generation_and_hash():
    opt_req = OptimisationRequest(
        dataset_id="sample-metro-verde",
        total_budget_cap=1500000.0
    )
    res = optimisation_engine.solve(opt_req)
    portfolio = res.alternatives[0]

    record = report_service.create_decision_record(
        dataset_id="sample-metro-verde",
        request=opt_req,
        baseline_risk=58.2,
        high_risk_count=3,
        selected_portfolio=portfolio,
        other_alternatives=res.alternatives[1:],
        scenario_runs=[],
        consequences=["Cooling achieved"],
        unintended_tradeoffs=["Water usage"],
        critical_mitigations=["Sensor irrigation"],
        explanation=None
    )
    assert record.record_id.startswith("REC-")
    assert len(record.reproducibility_hash) == 64  # SHA-256

    # Test CSV generation
    csv_out = report_service.generate_csv_export(portfolio)
    assert "ECO-ECHO Urban Sustainability Allocation Report" in csv_out
    assert "Capital Cost" in csv_out

    # Test HTML generation
    html_out = report_service.generate_html_report(record)
    assert "ECO-ECHO Urban Sustainability Decision Record" in html_out
    assert record.record_id in html_out
