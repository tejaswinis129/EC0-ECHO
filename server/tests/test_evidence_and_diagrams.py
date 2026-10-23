import io
import pytest
from fastapi.testclient import TestClient

from server.app.main import app
from server.app.models.evidence import ProvenanceType, AccessMode
from server.app.services.evidence_source_service import evidence_source_service
from server.app.services.diagram_service import diagram_service

client = TestClient(app)


def test_list_evidence_sources():
    res = client.get("/api/evidence/sources")
    assert res.status_code == 200
    sources = res.json()
    assert len(sources) >= 5
    source_ids = [s["source_id"] for s in sources]
    assert "bbmp_swd_master_plan" in source_ids
    assert "smart_cities_mission" in source_ids
    assert "karnataka_water_ogd" in source_ids
    assert "nwdp_water_portal" in source_ids
    assert "kaun_city_work_orders" in source_ids


def test_get_single_evidence_source():
    res = client.get("/api/evidence/sources/bbmp_swd_master_plan")
    assert res.status_code == 200
    src = res.json()
    assert src["source_id"] == "bbmp_swd_master_plan"
    assert "BBMP" in src["publisher"] or "Bruhat" in src["publisher"]
    assert src["license"] != ""
    assert src["manual_import_instructions"] is not None


def test_test_source_connectivity():
    # Test BBMP live source check
    res = client.get("/api/evidence/sources/bbmp_swd_master_plan/test")
    assert res.status_code == 200
    data = res.json()
    assert data["source_id"] == "bbmp_swd_master_plan"
    assert data["is_live"] is True
    assert data["http_status"] == 200
    assert "latency_ms" in data


def test_search_evidence_records():
    res = client.get("/api/evidence/records?category=stormwater_drainage")
    assert res.status_code == 200
    records = res.json()
    assert len(records) >= 1
    rec = records[0]
    assert rec["provenance_type"] in [p.value for p in ProvenanceType]
    assert rec["document_reference"] != ""
    assert "catchment_area_sqkm" in rec["field_values"] or "trench_depth_m" in rec["field_values"]


def test_provenance_distinction_real_vs_simulated():
    records = evidence_source_service.search_records()
    real_facts = [r for r in records if r.provenance_type == ProvenanceType.VERIFIED_SOURCE_FACT]
    assert len(real_facts) >= 5
    for r in real_facts:
        assert r.source_url != ""
        assert r.document_reference != ""
        assert len(r.field_values) > 0


def test_safe_document_upload_csv():
    csv_content = b"ward_id,project_name,cost_inr,length_m\n151,Koramangala Culvert,1500000,120\n152,Ejipura Retaining Wall,2500000,200\n"
    res = client.post(
        "/api/evidence/upload",
        files={"file": ("test_dpr_work_orders.csv", io.BytesIO(csv_content), "text/csv")},
    )
    assert res.status_code == 200
    meta = res.json()
    assert meta["file_id"].startswith("UPL-")
    assert meta["extracted_records_count"] == 2
    assert meta["validation_status"] == "VALIDATED"
    assert len(meta["sample_records"]) == 2


def test_safe_document_upload_geojson():
    geojson_content = b'{"type":"FeatureCollection","features":[{"type":"Feature","properties":{"name":"Drain 1","length_km":2.5},"geometry":{"type":"LineString","coordinates":[[77.59,12.97],[77.60,12.98]]}}]}'
    res = client.post(
        "/api/evidence/upload",
        files={"file": ("koramangala_swd.geojson", io.BytesIO(geojson_content), "application/geo+json")},
    )
    assert res.status_code == 200
    meta = res.json()
    assert meta["extracted_records_count"] == 1
    assert "GeoJSON" in meta["extracted_summary"]


def test_safe_document_upload_reject_executable():
    exe_content = b"MZ\x90\x00\x03\x00\x00\x00"
    res = client.post(
        "/api/evidence/upload",
        files={"file": ("malware.exe", io.BytesIO(exe_content), "application/octet-stream")},
    )
    assert res.status_code == 400
    assert "Unsupported file extension" in res.json()["detail"]


def test_diagram_endpoint_stormwater():
    res = client.get("/api/diagrams/stormwater_drainage?view=cross_section&location=Koramangala")
    assert res.status_code == 200
    diag = res.json()
    assert diag["project_type"] == "stormwater_drainage"
    assert diag["view_type"] == "cross_section"
    assert len(diag["components"]) >= 6
    assert len(diag["dimension_lines"]) >= 2
    assert len(diag["stages"]) >= 4

    # Check unverified dimensions are marked illustrative
    assert any(dl["is_illustrative"] is True for dl in diag["dimension_lines"])
    # Check verified dimensions cite BBMP
    verified_dims = [dl for dl in diag["dimension_lines"] if not dl["is_illustrative"]]
    assert len(verified_dims) >= 1
    assert any("BBMP" in dl["citation"] for dl in verified_dims)


def test_diagram_endpoint_all_types():
    types_to_test = [
        "roads_and_footpaths",
        "green_roofs",
        "water_supply",
        "rainwater_harvesting",
        "urban_forest",
        "sewerage_and_wastewater",
        "solid_waste_facility",
        "renewable_energy",
        "public_transport",
    ]
    for ptype in types_to_test:
        res = client.get(f"/api/diagrams/{ptype}")
        assert res.status_code == 200
        diag = res.json()
        assert len(diag["components"]) >= 4
        assert len(diag["stages"]) >= 3
        assert "⚠️" in diag["disclaimer"] or "Illustrative" in diag["disclaimer"]


def test_implementation_planner_generates_with_diagram_and_evidence():
    res = client.post(
        "/api/planner/generate",
        json={
            "prompt": "Design a primary storm water drain (Rajakaluve) for Koramangala Valley to stop street waterlogging.",
            "location_or_neighbourhood": "Koramangala Valley, Bengaluru",
            "budget_ceiling": 3000000.0,
            "currency": "INR",
        },
    )
    assert res.status_code == 200
    plan = res.json()
    assert plan["plan_id"].startswith("PLAN-")
    assert plan["structure_diagram"] is not None
    assert len(plan["structure_diagram"]["components"]) >= 6
    assert len(plan["evidence_records"]) >= 1
    assert any("BBMP" in r["source_publisher"] or "OpenCity" in r["source_publisher"] for r in plan["evidence_records"])
    assert "hydraulic_capacity" in plan["uncertainty_labels"]

    # Verify markdown export includes evidence and diagrams
    exp_res = client.get(f"/api/planner/plans/{plan['plan_id']}/export?format=markdown")
    assert exp_res.status_code == 200
    md = exp_res.json()["content"]
    assert "REAL-WORLD EVIDENCE & PROVENANCE REGISTRY" in md
    assert "CONSTRUCTION STRUCTURE DIAGRAM & STAGE VISUALS" in md
    assert "Koramangala" in md
