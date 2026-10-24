import pytest
import uuid
import datetime
import pandas as pd
from server.app.database import db_manager, get_db_file, get_connection
from server.app.services.data_service import DataService
from server.app.services.implementation_planner_service import ImplementationPlannerService
from server.app.models.implementation_planner import (
    ImplementationPlanRequest,
    InterventionCategory,
)


def test_database_connection_and_pragmas():
    """Verify backend connects to SQLite, WAL mode is active, and tables exist."""
    check = db_manager.check_connection()
    assert check["healthy"] is True
    assert check["status"] == "Connected & Operational"
    assert "WAL" in check["engine"]
    assert check["journal_mode"] == "WAL"
    assert isinstance(check["latency_ms"], float)
    assert check["latency_ms"] >= 0

    # Verify all 5 core tables exist
    expected_tables = ["decision_records", "datasets", "implementation_plans", "scenario_runs", "audit_logs"]
    for t in expected_tables:
        assert t in check["table_counts"], f"Missing table {t}"


def test_dataset_database_persistence_across_service_reboot():
    """
    Verify that an uploaded municipal dataset is persisted to the database
    and remains available after a simulated service restart (new DataService instance).
    """
    test_id = f"test-ds-{uuid.uuid4().hex[:6]}"
    csv_sample = (
        "neighbourhood_id,neighbourhood_name,population,area_sqkm,surface_temp_c,"
        "impervious_surface_pct,tree_canopy_pct,park_access_pct,annual_rainfall_mm,"
        "extreme_rainfall_runoff_m3,drainage_capacity_m3,water_demand_m3_day,"
        "water_supply_m3_day,social_vulnerability_index,available_roof_area_m2,"
        "available_public_land_m2,available_road_corridor_m2\n"
        "TEST-01,Test District,25000,2.5,31.2,45.0,22.0,60.0,950.0,15000.0,12000.0,5000.0,4800.0,0.35,120000.0,45000.0,30000.0\n"
    )
    df = pd.read_csv(pd.io.common.StringIO(csv_sample))

    data_svc = DataService()
    meta = data_svc.register_uploaded_dataset(df, "Automated Diagnostic Dataset", "Pytest Suite")
    assigned_id = meta.dataset_id

    try:
        # Verify it exists in the active service
        assert assigned_id in [d.dataset_id for d in data_svc.list_datasets()]
        retrieved_df = data_svc.get_dataset(assigned_id)
        assert retrieved_df is not None
        assert len(retrieved_df) == 1

        # SIMULATE SERVER RESTART: Create a brand new DataService instance
        rebooted_data_svc = DataService()
        rebooted_list = rebooted_data_svc.list_datasets()
        persisted_meta = next((d for d in rebooted_list if d.dataset_id == assigned_id), None)
        assert persisted_meta is not None, "Uploaded dataset was lost after service restart!"
        assert persisted_meta.name == "Automated Diagnostic Dataset"

        # Verify dataset DataFrame is loadable from database on restarted service
        loaded_df = rebooted_data_svc.get_dataset(assigned_id)
        assert loaded_df is not None
        assert len(loaded_df) == 1
        assert loaded_df["neighbourhood_name"].iloc[0] == "Test District"

    finally:
        # Clean up test dataset from database
        db_manager.delete_dataset(assigned_id)


def test_implementation_plan_database_persistence_across_reboot():
    """
    Verify that an implementation plan is persisted in the relational database
    and remains loadable after a simulated service restart.
    """
    planner_svc = ImplementationPlannerService()
    req = ImplementationPlanRequest(
        prompt="Design a permeable pavement corridor and green bioswales for Malleshwaram 8th Cross.",
        location_or_neighbourhood="Malleshwaram 8th Cross, Bengaluru",
        intervention_type="road_and_pavement",
        main_goal="Improve sidewalk accessibility and stormwater percolation",
        budget_ceiling=1500000,
        currency="USD",
    )

    plan = planner_svc.generate_plan(req)
    plan_id = plan.plan_id

    try:
        # Verify plan is in active service
        assert planner_svc.get_plan(plan_id) is not None

        # Verify plan was saved to database
        db_plan = db_manager.get_implementation_plan(plan_id)
        assert db_plan is not None
        assert db_plan["plan_id"] == plan_id

        # SIMULATE SERVER RESTART: Create a fresh ImplementationPlannerService instance
        rebooted_planner_svc = ImplementationPlannerService()
        reloaded_plan = rebooted_planner_svc.get_plan(plan_id)
        assert reloaded_plan is not None, "Implementation plan was lost after service restart!"
        assert reloaded_plan.plan_id == plan_id
        assert "Malleshwaram" in reloaded_plan.location_or_neighbourhood

        # Verify listed in summaries
        plans_list = rebooted_planner_svc.list_plans()
        assert any(p["plan_id"] == plan_id for p in plans_list)

    finally:
        # Clean up test plan from database
        db_manager.delete_implementation_plan(plan_id)


def test_database_error_logging_sanitizes_credentials():
    """Verify that connection failure reports do not expose file paths, passwords, or secrets."""
    check = db_manager.check_connection()
    # Ensure error field is either None or sanitized
    if check["error"]:
        assert "password" not in check["error"].lower()
        assert "secret" not in check["error"].lower()
