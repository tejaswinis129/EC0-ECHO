import os
from pathlib import Path
from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent
ROOT_DIR = BASE_DIR.parent

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(str(ROOT_DIR / ".env"), str(BASE_DIR / ".env"), ".env"),
        extra="ignore"
    )

    APP_NAME: str = "ECO-ECHO"
    APP_VERSION: str = "1.0.0"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    DEBUG: bool = os.getenv("DEBUG", "false").lower() in ("true", "1")
    
    PORT: int = int(os.getenv("PORT", "8000"))
    
    # Security & CORS
    CORS_ORIGINS: List[str] = (
        [orig.strip() for orig in os.getenv("CORS_ORIGINS", "").split(",") if orig.strip()]
        if os.getenv("CORS_ORIGINS")
        else [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://localhost:8000",
            "http://127.0.0.1:8000",
        ]
    )
    MAX_UPLOAD_SIZE_BYTES: int = 10 * 1024 * 1024  # 10 MB
    
    # Persistence
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        f"sqlite:///{'/tmp/eco_echo.db' if (os.getenv('VERCEL') or os.getenv('AWS_LAMBDA_FUNCTION_NAME')) else (BASE_DIR / 'eco_echo.db')}"
    )
    
    # AWS Integrations (All optional with automatic local fallbacks)
    AWS_REGION: str = os.getenv("AWS_REGION", "ap-south-1")
    AWS_ACCESS_KEY_ID: str = os.getenv("AWS_ACCESS_KEY_ID", "")
    AWS_SECRET_ACCESS_KEY: str = os.getenv("AWS_SECRET_ACCESS_KEY", "")
    AWS_SESSION_TOKEN: Optional[str] = os.getenv("AWS_SESSION_TOKEN", None)
    AWS_PROFILE: Optional[str] = os.getenv("AWS_PROFILE", "eco-echo")
    AWS_S3_BUCKET: str = os.getenv("AWS_S3_BUCKET", "eco-echo-sustainability-data-2026")
    AWS_BEDROCK_MODEL_ID: str = os.getenv("AWS_BEDROCK_MODEL_ID", "anthropic.claude-3-sonnet-20240229-v1:0")
    USE_AWS_BEDROCK: bool = os.getenv("USE_AWS_BEDROCK", "false").lower() in ("true", "1")
    USE_AWS_S3: bool = os.getenv("USE_AWS_S3", "false").lower() in ("true", "1")
    
    # Data paths
    DATA_DIR: Path = BASE_DIR / "app" / "data"

settings = Settings()

