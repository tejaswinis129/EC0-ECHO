import pytest
from fastapi.testclient import TestClient
from server.app.main import app

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["app"] == "ECO-ECHO"

def test_security_headers_present():
    response = client.get("/api/health")
    headers = response.headers
    assert headers.get("X-Content-Type-Options") == "nosniff"
    assert headers.get("X-Frame-Options") == "DENY"
    assert headers.get("X-XSS-Protection") == "1; mode=block"
    assert headers.get("Referrer-Policy") == "strict-origin-when-cross-origin"

def test_invalid_optimisation_payload():
    # Negative budget should trigger 422 Unprocessable Entity
    bad_payload = {
        "dataset_id": "sample-metro-verde",
        "total_budget_cap": -5000.0
    }
    response = client.post("/api/optimise/solve", json=bad_payload)
    assert response.status_code == 422

def test_missing_dataset_404():
    response = client.get("/api/data/datasets/non-existent-id")
    assert response.status_code == 404

def test_oversized_payload_rejection():
    # Send content-length header larger than MAX_UPLOAD_SIZE_BYTES
    response = client.post(
        "/api/data/upload",
        headers={"Content-Length": "20000000"}  # 20MB
    )
    assert response.status_code == 413
