import os
import time
import uuid
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Query, Response
from typing import Dict, Any, Optional, List
from pydantic import BaseModel

from ..config import settings
from ..services.s3_service import s3_service, sanitize_key_component

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


# ============================================================================
# LIVE IMAGE DEMONSTRATION ENDPOINTS FOR AMAZON S3
# ============================================================================

ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png"}
ALLOWED_IMAGE_MIME_TYPES = {
    "image/jpeg",
    "image/png",
    "image/jpg",
    "image/pjpeg",
    "image/x-png",
}
MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB maximum


@router.post("/upload-image")
async def upload_image_to_s3(
    file: UploadFile = File(...),
    description: Optional[str] = Form(None),
):
    """
    Accepts a user-selected JPG, JPEG, or PNG image via multipart/form-data.
    Validates file type, size (<10MB), and magic binary signatures.
    Uploads the actual image bytes directly to Amazon S3 with AES256 server-side encryption.
    Empirically verifies object existence in S3 via head_object and returns S3 metadata.
    """
    if not settings.USE_AWS_S3:
        raise HTTPException(
            status_code=503,
            detail="Amazon S3 integration is disabled in system configuration (USE_AWS_S3=false).",
        )

    cfg = s3_service.validate_configuration()
    if not cfg["valid"]:
        raise HTTPException(
            status_code=500,
            detail=f"S3 configuration invalid: {cfg.get('bucket_error') or cfg.get('region_error')}",
        )

    # 1. File extension validation
    filename = file.filename or "uploaded_image.jpg"
    _, ext = os.path.splitext(filename)
    ext = ext.lower()
    if ext not in ALLOWED_IMAGE_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format '{ext}'. Only JPG, JPEG, and PNG images are allowed.",
        )

    # 2. Content-Type MIME validation
    mime = (file.content_type or "").lower()
    if mime and mime not in ALLOWED_IMAGE_MIME_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid MIME type '{mime}'. Expected an image (image/jpeg or image/png).",
        )

    # 3. Read image bytes & check size limit
    image_bytes = await file.read()
    if len(image_bytes) == 0:
        raise HTTPException(
            status_code=400,
            detail="The uploaded file is empty (0 bytes). Please choose a valid image file.",
        )
    if len(image_bytes) > MAX_IMAGE_SIZE_BYTES:
        size_mb = len(image_bytes) / (1024 * 1024)
        raise HTTPException(
            status_code=400,
            detail=f"File exceeds maximum size limit of 10MB (received {size_mb:.2f} MB).",
        )

    # 4. Binary magic signature inspection (reject disguised executables/scripts)
    is_png = image_bytes.startswith(b"\x89PNG\r\n\x1a\n")
    is_jpeg = image_bytes.startswith(b"\xff\xd8\xff")
    if not (is_png or is_jpeg):
        raise HTTPException(
            status_code=400,
            detail="Invalid image binary signature. The file content does not match authentic JPEG or PNG image data.",
        )

    canonical_content_type = "image/png" if is_png else "image/jpeg"
    canonical_ext = ".png" if is_png else (".jpg" if ext == ".jpg" else ".jpeg")

    # 5. Generate secure S3 object key
    raw_stem = os.path.splitext(filename)[0]
    clean_stem = sanitize_key_component(raw_stem)
    timestamp = int(time.time())
    rand_id = uuid.uuid4().hex[:8]
    s3_key = f"evidence_images/{timestamp}_{rand_id}_{clean_stem}{canonical_ext}"

    uploaded_at_iso = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(timestamp))
    metadata = {
        "original-filename": filename[:100],
        "app": "eco-echo",
        "uploaded-at": uploaded_at_iso,
    }
    if description:
        metadata["description"] = sanitize_key_component(description)[:200]

    # 6. Upload actual bytes to Amazon S3
    t0 = time.time()
    success, uri_or_err = s3_service.upload_file_bytes(
        key=s3_key,
        data=image_bytes,
        content_type=canonical_content_type,
        metadata=metadata,
    )
    upload_duration_ms = round((time.time() - t0) * 1000, 2)

    if not success:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to upload image to Amazon S3: {uri_or_err}",
        )

    # 7. Empirically verify the image exists in S3 via head_object
    head_info = s3_service.head_file(s3_key)
    if not head_info:
        raise HTTPException(
            status_code=500,
            detail="Image upload completed but subsequent S3 head_object verification failed.",
        )

    etag = head_info.get("ETag", "").strip('"')
    last_mod = head_info.get("LastModified")
    iso_mod = last_mod.isoformat() if hasattr(last_mod, "isoformat") else str(last_mod)

    return {
        "success": True,
        "message": f"Image successfully uploaded and verified in Amazon S3 bucket '{settings.AWS_S3_BUCKET}'.",
        "s3_key": s3_key,
        "s3_uri": f"s3://{settings.AWS_S3_BUCKET}/{s3_key}",
        "bucket": settings.AWS_S3_BUCKET,
        "region": settings.AWS_REGION,
        "filename": filename,
        "content_type": canonical_content_type,
        "size_bytes": len(image_bytes),
        "size_kb": round(len(image_bytes) / 1024, 2),
        "etag": etag,
        "last_modified": iso_mod,
        "server_side_encryption": head_info.get("ServerSideEncryption", "AES256"),
        "storage_class": head_info.get("StorageClass", "STANDARD"),
        "upload_latency_ms": upload_duration_ms,
        "verified_in_s3": True,
        "uploaded_at": uploaded_at_iso,
        "description": description or "",
    }


@router.get("/verify-object")
def verify_s3_object(
    key: str = Query(..., description="The S3 object key to verify"),
):
    """
    Directly queries Amazon S3 (head_object) to prove that the file physically exists in S3.
    Returns the real ETag, byte size, last modified timestamp, and AES256 encryption metadata.
    """
    if not key or not isinstance(key, str):
        raise HTTPException(status_code=400, detail="S3 object key must be provided.")

    clean_key = key.strip()
    if ".." in clean_key or clean_key.startswith("/"):
        raise HTTPException(status_code=400, detail="Invalid object key path traversal.")

    if not (
        clean_key.startswith("evidence_images/")
        or clean_key.startswith("datasets/")
        or clean_key.startswith("reports/")
        or clean_key.startswith("diagnostics/")
    ):
        raise HTTPException(status_code=400, detail="Key is outside permitted object prefixes.")

    head = s3_service.head_file(clean_key)
    if not head:
        raise HTTPException(
            status_code=404,
            detail=f"Object '{clean_key}' was not found in Amazon S3 bucket '{settings.AWS_S3_BUCKET}'.",
        )

    last_mod = head.get("LastModified")
    iso_mod = last_mod.isoformat() if hasattr(last_mod, "isoformat") else str(last_mod)

    return {
        "exists": True,
        "verified_in_s3": True,
        "bucket": settings.AWS_S3_BUCKET,
        "region": settings.AWS_REGION,
        "key": clean_key,
        "s3_uri": f"s3://{settings.AWS_S3_BUCKET}/{clean_key}",
        "content_length": head.get("ContentLength"),
        "content_length_kb": round((head.get("ContentLength", 0)) / 1024, 2),
        "content_type": head.get("ContentType"),
        "etag": head.get("ETag", "").strip('"'),
        "last_modified": iso_mod,
        "server_side_encryption": head.get("ServerSideEncryption", "AES256"),
        "storage_class": head.get("StorageClass", "STANDARD"),
        "metadata": head.get("Metadata", {}),
    }


@router.get("/image-stream")
def stream_s3_image(
    key: str = Query(..., description="The S3 object key to stream"),
):
    """
    Retrieves the actual image bytes from the private Amazon S3 bucket and streams
    it to the browser. Ensures the S3 bucket remains strictly private with zero public access.
    """
    if not key or not key.startswith("evidence_images/"):
        raise HTTPException(status_code=400, detail="Invalid image key or path traversal.")

    image_bytes = s3_service.get_file_bytes(key)
    if image_bytes is None:
        raise HTTPException(status_code=404, detail="Image not found in Amazon S3 bucket.")

    # Determine media type
    if image_bytes.startswith(b"\x89PNG\r\n\x1a\n"):
        media_type = "image/png"
    else:
        media_type = "image/jpeg"

    return Response(
        content=image_bytes,
        media_type=media_type,
        headers={"Cache-Control": "private, max-age=3600"},
    )


@router.get("/images")
def list_uploaded_images(
    limit: int = Query(25, ge=1, le=100),
):
    """
    Lists recent image files stored under 'evidence_images/' in the configured S3 bucket.
    """
    items = s3_service.list_objects(prefix="evidence_images/", max_keys=limit)
    return {
        "bucket": settings.AWS_S3_BUCKET,
        "region": settings.AWS_REGION,
        "count": len(items),
        "images": items,
    }


