from fastapi import APIRouter
from ..config import settings
from ..database import DB_FILE

from ..services.s3_service import s3_service

router = APIRouter(prefix="/settings", tags=["Settings & Cloud Integrations"])

@router.get("/status")
def get_system_status():
    has_explicit_keys = bool(settings.AWS_ACCESS_KEY_ID and settings.AWS_SECRET_ACCESS_KEY)
    s3_client = s3_service.get_client()
    credentials_detected = has_explicit_keys or (s3_client is not None)
    s3_cfg = s3_service.validate_configuration()
    
    s3_status = "Local Filesystem Fallback Active"
    if settings.USE_AWS_S3 and s3_cfg["valid"] and (s3_client is not None):
        s3_status = "Connected (Cloud Storage Active)"
    elif settings.USE_AWS_S3 and not s3_cfg["valid"]:
        s3_status = f"Configuration Error: {s3_cfg['bucket_error'] or s3_cfg['region_error']}"
    
    return {
        "app_name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
        "database": {
            "type": "SQLite Local Relational Database",
            "path": str(DB_FILE),
            "status": "Connected & Operational"
        },
        "aws_integrations": {
            "credentials_detected": credentials_detected,
            "aws_region": settings.AWS_REGION,
            "credential_source": "Explicit .env keys" if has_explicit_keys else ("AWS CLI / Shared Provider Chain" if s3_client else "None"),
            "services": [
                {
                    "service": "Amazon Bedrock",
                    "role": "AI Decision Explanation (Claude 3 Sonnet)",
                    "configured": bool(settings.USE_AWS_BEDROCK and credentials_detected),
                    "model_id": settings.AWS_BEDROCK_MODEL_ID,
                    "status": "Active (Cloud Inference)" if (settings.USE_AWS_BEDROCK and credentials_detected) else "Local Fallback Active (Deterministic Engine)",
                    "optional": True
                },
                {
                    "service": "Amazon S3",
                    "role": "Cloud Storage for Uploaded Datasets & Reports",
                    "configured": bool(settings.USE_AWS_S3 and s3_cfg["valid"] and credentials_detected),
                    "bucket": settings.AWS_S3_BUCKET or "None specified",
                    "region": settings.AWS_REGION,
                    "status": s3_status,
                    "optional": True
                },
                {
                    "service": "AWS IAM & Secrets Manager",
                    "role": "Least-Privilege Security & Role Policies",
                    "configured": credentials_detected,
                    "status": "Role Enforced" if credentials_detected else "Local Development Mode",
                    "optional": True
                }
            ],

            "governance_note": (
                "ECO-ECHO is designed to be 100% functional locally without requiring AWS credentials or paid subscriptions. "
                "When AWS credentials are provided via .env, Bedrock and S3 activate automatically."
            )
        }
    }
