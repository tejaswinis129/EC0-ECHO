import io
import json
import pytest
from unittest.mock import MagicMock, patch
from botocore.exceptions import ClientError, NoCredentialsError, EndpointConnectionError
from fastapi.testclient import TestClient

from server.app.main import app
from server.app.config import settings
from server.app.services.s3_service import (
    validate_bucket_name,
    validate_region_name,
    S3Service,
)

client = TestClient(app)


# ----------------------------------------------------------------------
# 1. Bucket and Region Validation Tests
# ----------------------------------------------------------------------

def test_validate_bucket_name_valid():
    valid_names = [
        "eco-echo-sustainability-data-2026",
        "my-urban-data-bucket",
        "sample.bucket.123",
        "test-1-2-3",
    ]
    for name in valid_names:
        is_valid, err = validate_bucket_name(name)
        assert is_valid is True, f"Failed for valid name '{name}': {err}"
        assert err is None


def test_validate_bucket_name_invalid():
    invalid_cases = [
        ("", "non-empty"),
        ("ab", "between 3 and 63"),
        ("A" * 64, "between 3 and 63"),
        ("UPPERCASE-BUCKET", "invalid characters"),
        ("-start-with-hyphen", "invalid characters"),
        ("end-with-hyphen-", "invalid characters"),
        ("consecutive..periods", "consecutive periods"),
        ("period.-hyphen", "adjacent to periods"),
        ("192.168.1.1", "IP address"),
    ]
    for name, reason in invalid_cases:
        is_valid, err = validate_bucket_name(name)
        assert is_valid is False, f"Expected invalid for '{name}'"
        assert reason.lower() in err.lower()


def test_validate_region_name():
    assert validate_region_name("ap-south-1")[0] is True
    assert validate_region_name("us-east-1")[0] is True
    assert validate_region_name("eu-central-1")[0] is True

    assert validate_region_name("")[0] is False
    assert validate_region_name("invalid_region")[0] is False
    assert validate_region_name("US-EAST-1")[0] is False


# ----------------------------------------------------------------------
# 2. Local Fallback When USE_AWS_S3 is False
# ----------------------------------------------------------------------

def test_s3_service_disabled_fallback():
    service = S3Service()
    with patch.object(settings, "USE_AWS_S3", False):
        assert service.is_enabled() is False

        # Upload dataset returns fallback without network call
        success, msg = service.upload_dataset("test-ds", "a,b,c\n1,2,3")
        assert success is False
        assert "disabled" in msg.lower()

        # Get dataset returns None
        assert service.get_dataset("test-ds") is None

        # Upload report returns fallback
        rep_res = service.upload_report("REC-123", {"test": True})
        assert rep_res["success"] is False
        assert "disabled" in rep_res["reason"].lower()

        # Get report returns None
        assert service.get_report("REC-123") is None


# ----------------------------------------------------------------------
# 3. S3 Dataset Operations with Mocks (No Real Network Calls)
# ----------------------------------------------------------------------

def test_upload_dataset_mocked_success():
    service = S3Service()
    mock_s3_client = MagicMock()

    with patch.object(settings, "USE_AWS_S3", True), \
         patch.object(settings, "AWS_S3_BUCKET", "eco-echo-sustainability-data-2026"), \
         patch.object(settings, "AWS_REGION", "ap-south-1"), \
         patch.object(service, "get_client", return_value=mock_s3_client):

        success, uri = service.upload_dataset(
            dataset_id="custom-test-01",
            csv_content="neighbourhood_id,population\nNB-01,50000",
            metadata={"row_count": 1, "name": "Test Dataset"}
        )

        assert success is True
        assert uri == "s3://eco-echo-sustainability-data-2026/datasets/custom-test-01.csv"
        assert mock_s3_client.put_object.call_count == 2  # CSV and metadata JSON

        # Verify encryption and private parameters
        csv_call_kwargs = mock_s3_client.put_object.call_args_list[0][1]
        assert csv_call_kwargs["Bucket"] == "eco-echo-sustainability-data-2026"
        assert csv_call_kwargs["Key"] == "datasets/custom-test-01.csv"
        assert csv_call_kwargs["ContentType"] == "text/csv"
        assert csv_call_kwargs["ServerSideEncryption"] == "AES256"


def test_get_dataset_mocked_success():
    service = S3Service()
    mock_s3_client = MagicMock()
    mock_body = MagicMock()
    mock_body.read.return_value = b"neighbourhood_id,population\nNB-01,50000"
    mock_s3_client.get_object.return_value = {"Body": mock_body}

    with patch.object(settings, "USE_AWS_S3", True), \
         patch.object(settings, "AWS_S3_BUCKET", "eco-echo-sustainability-data-2026"), \
         patch.object(settings, "AWS_REGION", "ap-south-1"), \
         patch.object(service, "get_client", return_value=mock_s3_client):

        content = service.get_dataset("custom-test-01")
        assert content is not None
        assert "neighbourhood_id,population" in content
        mock_s3_client.get_object.assert_called_once_with(
            Bucket="eco-echo-sustainability-data-2026",
            Key="datasets/custom-test-01.csv"
        )


def test_get_dataset_mocked_not_found():
    service = S3Service()
    mock_s3_client = MagicMock()
    mock_s3_client.get_object.side_effect = ClientError(
        {"Error": {"Code": "NoSuchKey", "Message": "The specified key does not exist."}},
        "GetObject"
    )

    with patch.object(settings, "USE_AWS_S3", True), \
         patch.object(settings, "AWS_S3_BUCKET", "eco-echo-sustainability-data-2026"), \
         patch.object(settings, "AWS_REGION", "ap-south-1"), \
         patch.object(service, "get_client", return_value=mock_s3_client):

        content = service.get_dataset("non-existent")
        assert content is None


# ----------------------------------------------------------------------
# 4. S3 Report Operations with Mocks
# ----------------------------------------------------------------------

def test_upload_report_mocked_success():
    service = S3Service()
    mock_s3_client = MagicMock()

    with patch.object(settings, "USE_AWS_S3", True), \
         patch.object(settings, "AWS_S3_BUCKET", "eco-echo-sustainability-data-2026"), \
         patch.object(settings, "AWS_REGION", "ap-south-1"), \
         patch.object(service, "get_client", return_value=mock_s3_client):

        report_payload = {
            "record_id": "REC-20261023-TEST01",
            "selected_strategy": "balanced",
            "total_capex": 1200000,
        }

        res = service.upload_report(
            record_id="REC-20261023-TEST01",
            report_data=report_payload,
            html_content="<html><body>Report</body></html>",
            csv_content="Strategy,Total Capex\nbalanced,1200000"
        )

        assert res["success"] is True
        assert len(res["keys"]) == 3  # json, html, csv
        assert "s3://eco-echo-sustainability-data-2026/reports/REC-20261023-TEST01.json" in res["keys"]["json"]
        assert "s3://eco-echo-sustainability-data-2026/reports/REC-20261023-TEST01.html" in res["keys"]["html"]
        assert "s3://eco-echo-sustainability-data-2026/reports/REC-20261023-TEST01.csv" in res["keys"]["csv"]

        assert mock_s3_client.put_object.call_count == 3
        for call_item in mock_s3_client.put_object.call_args_list:
            assert call_item[1]["ServerSideEncryption"] == "AES256"


def test_get_report_mocked_success():
    service = S3Service()
    mock_s3_client = MagicMock()
    mock_body = MagicMock()
    payload = {"record_id": "REC-TEST", "strategy": "balanced"}
    mock_body.read.return_value = json.dumps(payload).encode("utf-8")
    mock_s3_client.get_object.return_value = {"Body": mock_body}

    with patch.object(settings, "USE_AWS_S3", True), \
         patch.object(settings, "AWS_S3_BUCKET", "eco-echo-sustainability-data-2026"), \
         patch.object(settings, "AWS_REGION", "ap-south-1"), \
         patch.object(service, "get_client", return_value=mock_s3_client):

        res = service.get_report("REC-TEST")
        assert res is not None
        assert res["record_id"] == "REC-TEST"


# ----------------------------------------------------------------------
# 5. Connection Check & Diagnostics
# ----------------------------------------------------------------------

def test_check_connection_mocked_success():
    service = S3Service()
    mock_s3_client = MagicMock()
    mock_s3_client.head_bucket.return_value = {"BucketRegion": "ap-south-1"}

    with patch.object(settings, "AWS_S3_BUCKET", "eco-echo-sustainability-data-2026"), \
         patch.object(settings, "AWS_REGION", "ap-south-1"), \
         patch.object(service, "get_client", return_value=mock_s3_client):

        status = service.check_connection()
        assert status["configured"] is True
        assert status["connected"] is True
        assert status["bucket"] == "eco-echo-sustainability-data-2026"
        assert status["error"] is None


def test_check_connection_mocked_client_error():
    service = S3Service()
    mock_s3_client = MagicMock()
    mock_s3_client.head_bucket.side_effect = ClientError(
        {"Error": {"Code": "403", "Message": "Forbidden"}},
        "HeadBucket"
    )

    with patch.object(settings, "AWS_S3_BUCKET", "eco-echo-sustainability-data-2026"), \
         patch.object(settings, "AWS_REGION", "ap-south-1"), \
         patch.object(service, "get_client", return_value=mock_s3_client):

        status = service.check_connection()
        assert status["configured"] is True
        assert status["connected"] is False
        assert "403" in status["error"]
        assert status["fallback_active"] is True


def test_check_connection_network_failure():
    service = S3Service()
    mock_s3_client = MagicMock()
    mock_s3_client.head_bucket.side_effect = EndpointConnectionError(endpoint_url="https://s3.ap-south-1.amazonaws.com")

    with patch.object(settings, "AWS_S3_BUCKET", "eco-echo-sustainability-data-2026"), \
         patch.object(settings, "AWS_REGION", "ap-south-1"), \
         patch.object(service, "get_client", return_value=mock_s3_client):

        status = service.check_connection()
        assert status["connected"] is False
        assert "Network connection" in status["error"]
        assert status["fallback_active"] is True


# ----------------------------------------------------------------------
# 6. API Route Integration Tests (/api/s3/status & /api/settings/status)
# ----------------------------------------------------------------------

def test_api_s3_status_route():
    resp = client.get("/api/s3/status")
    assert resp.status_code == 200
    data = resp.json()
    assert "use_aws_s3" in data
    assert "bucket" in data
    assert "region" in data
    assert data["region"] == "ap-south-1"
    assert data["bucket"] == "eco-echo-sustainability-data-2026"
    assert "local_storage_fallback_active" in data
    assert "private bucket only" in data["privacy_policy"].lower()


def test_api_settings_status_includes_s3():
    resp = client.get("/api/settings/status")
    assert resp.status_code == 200
    data = resp.json()
    assert "aws_integrations" in data
    services = data["aws_integrations"]["services"]
    s3_info = next((s for s in services if s["service"] == "Amazon S3"), None)
    assert s3_info is not None
    assert s3_info["bucket"] == "eco-echo-sustainability-data-2026"
    assert s3_info["region"] == "ap-south-1"


def test_sanitize_key_component():
    from server.app.services.s3_service import sanitize_key_component
    assert sanitize_key_component("dataset-123") == "dataset-123"
    assert sanitize_key_component("../../../etc/passwd") == "etc_passwd"
    assert sanitize_key_component("custom file (1) !@#$%^&*") == "custom_file__1"
    assert sanitize_key_component("") == "unnamed"
    assert sanitize_key_component("...") == "item"


def test_api_test_upload_route_disabled_fallback():
    with patch.object(settings, "USE_AWS_S3", False):
        resp = client.post("/api/s3/test-upload", json={"test_message": "hello"})
        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is False
        assert data["s3_enabled"] is False
        assert data["fallback_active"] is True


def test_api_test_upload_route_mocked_success():
    mock_s3_client = MagicMock()
    mock_body = MagicMock()
    mock_body.read.return_value = b'{"test": "payload"}'
    mock_s3_client.get_object.return_value = {"Body": mock_body}

    with patch.object(settings, "USE_AWS_S3", True), \
         patch.object(settings, "AWS_S3_BUCKET", "eco-echo-sustainability-data-2026"), \
         patch.object(settings, "AWS_REGION", "ap-south-1"), \
         patch("server.app.services.s3_service.s3_service.get_client", return_value=mock_s3_client):

        resp = client.post("/api/s3/test-upload", json={"test_message": "unit test ping"})
        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is True
        assert data["read_verified"] is True
        assert data["cleaned_up"] is True
        assert data["bucket"] == "eco-echo-sustainability-data-2026"
        assert "diagnostics/ping-" in data["s3_uri"]
        mock_s3_client.delete_object.assert_called_once()

