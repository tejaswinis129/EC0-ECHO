from fastapi import APIRouter
from ..config import settings
from ..database import DB_FILE

router = APIRouter(prefix="/settings", tags=["Settings & Cloud Integrations"])

@router.get("/status")
def get_system_status():
    has_aws_creds = bool(settings.AWS_ACCESS_KEY_ID and settings.AWS_SECRET_ACCESS_KEY)
    
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
            "credentials_detected": has_aws_creds,
            "aws_region": settings.AWS_REGION,
            "services": [
                {
                    "service": "Amazon Bedrock",
                    "role": "AI Decision Explanation (Claude 3 Sonnet)",
                    "configured": bool(settings.USE_AWS_BEDROCK and has_aws_creds),
                    "model_id": settings.AWS_BEDROCK_MODEL_ID,
                    "status": "Active (Cloud Inference)" if (settings.USE_AWS_BEDROCK and has_aws_creds) else "Local Fallback Active (Deterministic Engine)",
                    "optional": True
                },
                {
                    "service": "Amazon S3",
                    "role": "Cloud Storage for Uploaded Datasets & Reports",
                    "configured": bool(settings.USE_AWS_S3 and has_aws_creds and settings.AWS_S3_BUCKET),
                    "bucket": settings.AWS_S3_BUCKET or "None specified",
                    "status": "Connected" if (settings.USE_AWS_S3 and has_aws_creds and settings.AWS_S3_BUCKET) else "Local Filesystem Fallback Active",
                    "optional": True
                },
                {
                    "service": "AWS IAM & Secrets Manager",
                    "role": "Least-Privilege Security & Role Policies",
                    "configured": has_aws_creds,
                    "status": "Role Enforced" if has_aws_creds else "Local Development Mode",
                    "optional": True
                }
            ],
            "governance_note": (
                "ECO-ECHO is designed to be 100% functional locally without requiring AWS credentials or paid subscriptions. "
                "When AWS credentials are provided via .env, Bedrock and S3 activate automatically."
            )
        }
    }
