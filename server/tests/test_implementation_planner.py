import pytest
from fastapi.testclient import TestClient
from server.app.main import app
from server.app.models.implementation_planner import (
    ImplementationPlanRequest,
    InterventionCategory,
    DataStatus,
)
from server.app.services.implementation_planner_service import implementation_planner_service

client = TestClient(app)

def test_classify_stormwater_drainage():
    req = ImplementationPlanRequest(
        prompt="Design a drainage system for this neighbourhood that reduces flooding without unnecessarily disturbing residents."
    )
    res = implementation_planner_service.classify_request(req)
    assert res.primary_category == InterventionCategory.STORMWATER_DRAINAGE
    assert res.is_weather_sensitive is True
    assert res.is_traffic_sensitive is True
    assert any("flooding" in g.lower() for g in res.detected_goals)

def test_classify_urban_forest_and_utilities():
    req = ImplementationPlanRequest(
        prompt="Create an urban forest plan that reduces heat without damaging underground utilities."
    )
    res = implementation_planner_service.classify_request(req)
    assert res.primary_category == InterventionCategory.URBAN_FOREST
    assert res.is_utility_sensitive is True
    assert any("heat" in g.lower() for g in res.detected_goals)

def test_classify_green_roofs():
    req = ImplementationPlanRequest(
        prompt="Plan green roofs for public buildings while considering structural safety, water leakage, and maintenance."
    )
    res = implementation_planner_service.classify_request(req)
    assert res.primary_category == InterventionCategory.GREEN_ROOFS

def test_classify_road_construction_with_hospital_access():
    req = ImplementationPlanRequest(
        prompt="Plan road construction while maintaining access to homes, shops, schools, and hospitals."
    )
    res = implementation_planner_service.classify_request(req)
    assert res.primary_category == InterventionCategory.ROAD_CONSTRUCTION
    assert res.is_traffic_sensitive is True
    assert any("disruption" in g.lower() or "traffic" in g.lower() for g in res.detected_goals)

def test_classify_multi_intervention_combined():
    req = ImplementationPlanRequest(
        prompt="Integrate street road resurfacing with bioretention storm drainage and native tree planting across the whole boulevard."
    )
    res = implementation_planner_service.classify_request(req)
    assert res.primary_category in [
        InterventionCategory.MULTI_INTERVENTION_INTEGRATED,
        InterventionCategory.STORMWATER_DRAINAGE,
        InterventionCategory.ROAD_CONSTRUCTION
    ]
    assert len(res.secondary_categories) >= 1

def test_generate_plan_full_sections():
    req = ImplementationPlanRequest(
        prompt="Build drainage in a residential neighbourhood without affecting locals and ensure it is prepared for rainy days.",
        location_or_neighbourhood="Downtown Core",
        budget_ceiling=2500000.0,
        currency="USD",
        nearby_critical_facilities=["City General Hospital", "St. Jude Primary School"]
    )
    plan = implementation_planner_service.generate_plan(req)

    # Core metadata
    assert plan.plan_id.startswith("PLAN-")
    assert plan.reproducibility_hash is not None
    assert len(plan.reproducibility_hash) == 64
    assert plan.data_completeness_pct >= 80.0

    # Section B: Site Investigations
    assert len(plan.site_investigations) >= 6
    assert any(item.importance == "Critical" for item in plan.site_investigations)
    assert any(item.status == DataStatus.MISSING for item in plan.site_investigations)

    # Section C: Design Alternatives
    assert plan.recommended_design is not None
    assert len(plan.design_alternatives) >= 2
    assert "When not to select" in plan.recommended_design.when_not_to_select or len(plan.recommended_design.when_not_to_select) > 5

    # Section D: Phased Construction
    assert len(plan.construction_phases) >= 5
    p1 = plan.construction_phases[0]
    assert p1.phase_number == 1
    assert len(p1.work_to_be_performed) >= 2
    assert len(p1.responsible_parties) >= 1

    # Section E: Community Protection
    assert len(plan.community_protection.disruptions) >= 4
    assert "hospital" in plan.community_protection.school_and_hospital_protocol.lower()
    assert "3.5" in plan.community_protection.emergency_vehicle_access_plan

    # Section F: Weather Protection
    assert plan.weather_protection.is_weather_sensitive is True
    assert len(plan.weather_protection.forecast_warning_monitoring_thresholds) >= 3
    assert len(plan.weather_protection.stop_work_and_site_evacuation_triggers) >= 2
    assert plan.weather_protection.drainage_system_distinctions is not None

    # Section G: Budget & Resource Plan
    assert plan.budget.total_estimated_capital_outlay > 0
    assert plan.budget.total_contingency_reserve > 0
    assert plan.budget.ten_year_lifecycle_estimate > plan.budget.total_estimated_capital_outlay
    assert plan.budget.fits_within_budget is True

    # Section H: Risk Register
    assert len(plan.risk_register) >= 5
    for r in plan.risk_register:
        assert r.likelihood in ["Low", "Medium", "High"]
        assert r.severity in ["Minor", "Moderate", "Major", "Critical"]
        assert r.responsible_party != ""

    # Section I: Consequences
    assert len(plan.consequences) >= 3

    # Section J & K: QA and Maintenance
    assert len(plan.quality_assurance) >= 5
    assert len(plan.maintenance_plan) >= 4

def test_api_classify_endpoint():
    res = client.post("/api/planner/classify", json={
        "prompt": "Construct a modular rainwater harvesting cistern in the central park"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["primary_category"] == "rainwater_harvesting"
    assert data["confidence_score"] > 0.5

def test_api_generate_and_get_plan():
    res = client.post("/api/planner/generate", json={
        "prompt": "Build green roofs on public municipal library buildings to reduce summer heat and roof stormwater runoff.",
        "location_or_neighbourhood": "West End District",
        "budget_ceiling": 1500000.0,
        "currency": "USD"
    })
    assert res.status_code == 200
    plan = res.json()
    plan_id = plan["plan_id"]
    assert plan_id.startswith("PLAN-")

    # Fetch back by ID
    get_res = client.get(f"/api/planner/plans/{plan_id}")
    assert get_res.status_code == 200
    assert get_res.json()["plan_id"] == plan_id

    # List plans
    list_res = client.get("/api/planner/plans")
    assert list_res.status_code == 200
    assert any(p["plan_id"] == plan_id for p in list_res.json())

def test_api_scenario_recalculation():
    # First generate a plan
    gen_res = client.post("/api/planner/generate", json={
        "prompt": "Design roadside permeable paving and bioswale drainage to stop street flooding.",
        "budget_ceiling": 2000000.0
    })
    assert gen_res.status_code == 200
    plan_id = gen_res.json()["plan_id"]

    # Recalculate under extreme rainfall shock
    scen_res = client.post(f"/api/planner/plans/{plan_id}/scenario", json={
        "scenario_type": "extreme_rainfall"
    })
    assert scen_res.status_code == 200
    scen_plan = scen_res.json()
    assert "STRESS-TEST" in scen_plan["weather_protection"]["seasonal_climate_assessment"]
    assert "Extreme Cloudburst" in scen_plan["budget"]["budget_explanation"]

def test_api_markdown_export():
    gen_res = client.post("/api/planner/generate", json={
        "prompt": "Create pedestrian walkways and tree canopy near primary schools.",
        "budget_ceiling": 1200000.0
    })
    plan_id = gen_res.json()["plan_id"]

    exp_res = client.get(f"/api/planner/plans/{plan_id}/export?format=markdown")
    assert exp_res.status_code == 200
    data = exp_res.json()
    assert data["format"] == "markdown"
    assert "ECO-ECHO URBAN ENGINEERING & IMPLEMENTATION PLAN" in data["content"]
    assert "COMMUNITY PROTECTION & DISRUPTION MITIGATION" in data["content"]
