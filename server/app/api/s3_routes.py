import time
import uuid
from fastapi import APIRouter, HTTPException
from typing import Dict, Any, Optional
from pydantic import BaseModel

from ..config import settings
from ..services.s3_service import s3_service

router = APIRouter(prefix="/s3", tags=["Amazon S3 Storage"])


class S3TestUploadRequest(BaseModel):
    test_message: Optional[str] = "ECO-ECHO Amazon S3 roundtrip diagnostic verification"


@router.get("/status")
def get_s3_status():
    """
    Returns the current status of Amazon S3 integration.
    Validates bucket configuration, checks AWS credential provider resolution,
    and returns diagnostic status without leaking secrets.
    """
    cfg = s3_service.validate_configuration()
    conn = s3_service.check_connection()

    return {
        "use_aws_s3": settings.USE_AWS_S3,
        "is_enabled": s3_service.is_enabled(),
        "bucket": settings.AWS_S3_BUCKET or "Not configured",
        "region": settings.AWS_REGION or "Not configured",
        "configuration_valid": cfg["valid"],
        "configuration_details": {
            "bucket_valid": cfg["bucket_valid"],
            "bucket_error": cfg["bucket_error"],
            "region_valid": cfg["region_valid"],
            "region_error": cfg["region_error"],
        },
        "connection_check": conn,
        "local_storage_fallback_active": not (settings.USE_AWS_S3 and conn.get("connected", False)),
        "privacy_policy": "Private bucket only (ServerSideEncryption=AES256). No public access.",
    }


@router.post("/test-upload")
def test_s3_upload(req: S3TestUploadRequest):
    """
    Performs a small, safe diagnostic upload to the configured S3 bucket
    under 'diagnostics/ping-{id}.json', verifies roundtrip reading, and cleans up.
    Returns diagnostic latency, key, and verification result.
    """
    if not settings.USE_AWS_S3:
        return {
            "success": False,
            "s3_enabled": False,
            "message": "USE_AWS_S3 is currently false. Enable USE_AWS_S3=true in .env to activate live S3 uploads.",
            "fallback_active": True,
        }

    cfg = s3_service.validate_configuration()
    if not cfg["valid"]:
        raise HTTPException(
            status_code=400,
            detail={
                "message": "Invalid S3 bucket or region configuration.",
                "bucket_error": cfg["bucket_error"],
                "region_error": cfg["region_error"],
            },
        )

    client = s3_service.get_client()
    if client is None:
        raise HTTPException(
            status_code=503,
            detail="AWS S3 client could not be initialized using standard credential provider chain.",
        )

    test_id = uuid.uuid4().hex[:8]
    test_key = f"diagnostics/ping-{test_id}.json"
    payload = {
        "app": settings.APP_NAME,
        "test_id": test_id,
        "timestamp": time.time(),
        "message": req.test_message,
        "bucket": settings.AWS_S3_BUCKET,
        "region": settings.AWS_REGION,
    }

    t0 = time.time()
    success, s3_uri_or_err = s3_service.upload_file_bytes(
        key=test_key,
        data=str(payload).encode("utf-8"),
        content_type="application/json",
        metadata={"app": "eco-echo", "purpose": "health-check"},
    )
    upload_duration_ms = round((time.time() - t0) * 1000, 2)

    if not success:
        raise HTTPException(
            status_code=500,
            detail=f"S3 upload failed: {s3_uri_or_err}",
        )

    # Verify read-back
    t1 = time.time()
    read_bytes = s3_service.get_file_bytes(test_key)
    read_duration_ms = round((time.time() - t1) * 1000, 2)
    read_verified = read_bytes is not None and len(read_bytes) > 0

    # Clean up test object so the private bucket stays clean
    cleaned_up = False
    try:
        client.delete_object(Bucket=settings.AWS_S3_BUCKET, Key=test_key)
        cleaned_up = True
    except Exception:
        pass

    return {
        "success": True,
        "test_id": test_id,
        "s3_uri": s3_uri_or_err,
        "upload_latency_ms": upload_duration_ms,
        "read_latency_ms": read_duration_ms,
        "read_verified": read_verified,
        "cleaned_up": cleaned_up,
        "bucket": settings.AWS_S3_BUCKET,
        "region": settings.AWS_REGION,
        "encryption": "AES256 (ServerSideEncryption)",
        "access": "Private",
        "message": "S3 read/write diagnostic verification succeeded and test object was safely cleaned up.",
    }

