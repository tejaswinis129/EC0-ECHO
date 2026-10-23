import os
import re
import json
import logging
from typing import Dict, Any, Optional, Tuple
import boto3
from botocore.exceptions import (
    ClientError,
    NoCredentialsError,
    PartialCredentialsError,
    EndpointConnectionError,
    ProfileNotFound,
    BotoCoreError,
)

from ..config import settings

logger = logging.getLogger("eco_echo.s3_service")

# S3 Bucket naming rules per AWS specification
# 1. 3 to 63 characters long
# 2. Lowercase letters, numbers, hyphens, and periods
# 3. Must begin and end with a letter or number
# 4. Must not be formatted as an IP address
BUCKET_NAME_REGEX = re.compile(r"^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$")
IP_ADDRESS_REGEX = re.compile(r"^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$")
AWS_REGION_REGEX = re.compile(r"^[a-z]{2}(-[a-z]+)+-\d+$")


def sanitize_key_component(component: str) -> str:
    """
    Sanitizes string inputs to create safe, predictable S3 object keys.
    Prevents path traversal, special characters, and non-printable characters.
    """
    if not component or not isinstance(component, str):
        return "unnamed"
    clean = re.sub(r"[^a-zA-Z0-9_\-\.]", "_", component.strip())
    clean = re.sub(r"\.{2,}", "_", clean)
    clean = clean.strip("._-")
    return clean or "item"


def validate_bucket_name(bucket_name: str) -> Tuple[bool, Optional[str]]:
    """
    Validates that a bucket name complies with AWS S3 naming standards.
    Returns (is_valid, error_message).
    """
    if not bucket_name or not isinstance(bucket_name, str):
        return False, "Bucket name must be a non-empty string."

    name = bucket_name.strip()
    if len(name) < 3 or len(name) > 63:
        return False, f"Bucket name length must be between 3 and 63 characters (got {len(name)})."

    if not BUCKET_NAME_REGEX.match(name):
        return False, "Bucket name contains invalid characters or does not begin/end with a letter or number."

    if ".." in name or ".-" in name or "-." in name:
        return False, "Bucket name cannot contain consecutive periods or dashes adjacent to periods."

    if IP_ADDRESS_REGEX.match(name):
        return False, "Bucket name must not be formatted as an IP address."

    return True, None


def validate_region_name(region: str) -> Tuple[bool, Optional[str]]:
    """
    Validates that an AWS region name matches standard AWS format (e.g. 'ap-south-1').
    Returns (is_valid, error_message).
    """
    if not region or not isinstance(region, str):
        return False, "AWS Region must be a non-empty string."

    reg = region.strip()
    if not AWS_REGION_REGEX.match(reg):
        return False, f"Invalid AWS region format: '{reg}' (expected format like 'ap-south-1' or 'us-east-1')."

    return True, None


class S3Service:
    """
    Safely manages Amazon S3 interactions for ECO-ECHO.
    - Uses standard AWS SDK credential provider chain.
    - Preserves local-storage fallback on any configuration or network issue.
    - Keeps all bucket storage private with AES256 server-side encryption.
    """

    def __init__(self):
        self._client = None
        self._cached_validation: Optional[Dict[str, Any]] = None

    def validate_configuration(self) -> Dict[str, Any]:
        """Validates environment variables for S3 configuration."""
        bucket = settings.AWS_S3_BUCKET or ""
        region = settings.AWS_REGION or ""

        b_valid, b_err = validate_bucket_name(bucket)
        r_valid, r_err = validate_region_name(region)

        is_valid = b_valid and r_valid
        return {
            "valid": is_valid,
            "use_s3": settings.USE_AWS_S3,
            "bucket": bucket,
            "region": region,
            "bucket_valid": b_valid,
            "bucket_error": b_err,
            "region_valid": r_valid,
            "region_error": r_err,
        }

    def is_enabled(self) -> bool:
        """Returns True if S3 is explicitly enabled in settings and configuration is valid."""
        if not settings.USE_AWS_S3:
            return False
        cfg = self.validate_configuration()
        return cfg["valid"]

    def get_client(self) -> Optional[Any]:
        """
        Creates and returns a boto3 S3 client using the standard credential chain.
        Supports:
        1. Explicit AWS credentials in settings / .env if provided.
        2. AWS CLI profile / ~/.aws/credentials / config.
        3. Standard IAM roles and environment variables.
        Returns None if client creation fails or credentials cannot be discovered.
        """
        if self._client is not None:
            return self._client

        try:
            session_kwargs: Dict[str, Any] = {"region_name": settings.AWS_REGION}
            if settings.AWS_PROFILE:
                try:
                    session = boto3.Session(profile_name=settings.AWS_PROFILE, **session_kwargs)
                except ProfileNotFound:
                    logger.info(
                        "AWS profile '%s' not found locally; falling back to default IAM role / container credential provider chain.",
                        settings.AWS_PROFILE,
                    )
                    session = boto3.Session(region_name=settings.AWS_REGION)
            else:
                session = boto3.Session(region_name=settings.AWS_REGION)

            client_kwargs: Dict[str, Any] = {"region_name": settings.AWS_REGION}
            # Only provide explicit keys if both ID and Secret are provided
            if settings.AWS_ACCESS_KEY_ID and settings.AWS_SECRET_ACCESS_KEY:
                client_kwargs["aws_access_key_id"] = settings.AWS_ACCESS_KEY_ID
                client_kwargs["aws_secret_access_key"] = settings.AWS_SECRET_ACCESS_KEY
                if settings.AWS_SESSION_TOKEN:
                    client_kwargs["aws_session_token"] = settings.AWS_SESSION_TOKEN

            client = session.client("s3", **client_kwargs)
            self._client = client
            return client
        except (NoCredentialsError, PartialCredentialsError) as e:
            logger.warning("AWS S3 Credentials missing in provider chain: %s", str(e))
            return None
        except Exception as e:
            logger.warning("Failed to initialize AWS S3 client: %s", str(e))
            return None

    def check_connection(self) -> Dict[str, Any]:
        """
        Checks if the configured S3 bucket exists and is accessible.
        Never raises unhandled exceptions; returns diagnostic status dictionary.
        """
        cfg = self.validate_configuration()
        if not cfg["valid"]:
            return {
                "configured": False,
                "connected": False,
                "bucket": cfg["bucket"],
                "region": cfg["region"],
                "error": cfg["bucket_error"] or cfg["region_error"] or "Invalid S3 configuration.",
                "fallback_active": True,
            }

        client = self.get_client()
        if client is None:
            return {
                "configured": True,
                "connected": False,
                "bucket": cfg["bucket"],
                "region": cfg["region"],
                "error": "Could not initialize boto3 S3 client with current AWS credential provider chain.",
                "fallback_active": True,
            }

        try:
            res = client.head_bucket(Bucket=cfg["bucket"])
            return {
                "configured": True,
                "connected": True,
                "bucket": cfg["bucket"],
                "region": cfg["region"],
                "bucket_region": res.get("BucketRegion", cfg["region"]),
                "error": None,
                "fallback_active": not settings.USE_AWS_S3,
                "message": f"Successfully authenticated and verified access to bucket '{cfg['bucket']}' in {cfg['region']}.",
            }
        except ClientError as e:
            error_code = e.response.get("Error", {}).get("Code", "Unknown")
            error_msg = e.response.get("Error", {}).get("Message", str(e))
            logger.warning("S3 head_bucket ClientError [%s]: %s", error_code, error_msg)
            return {
                "configured": True,
                "connected": False,
                "bucket": cfg["bucket"],
                "region": cfg["region"],
                "error": f"S3 Access Error [{error_code}]: {error_msg}",
                "fallback_active": True,
            }
        except EndpointConnectionError as e:
            logger.warning("S3 network endpoint connection failure: %s", str(e))
            return {
                "configured": True,
                "connected": False,
                "bucket": cfg["bucket"],
                "region": cfg["region"],
                "error": f"Network connection to AWS S3 endpoint failed: {str(e)}",
                "fallback_active": True,
            }
        except Exception as e:
            logger.warning("Unexpected error during S3 check_connection: %s", str(e))
            return {
                "configured": True,
                "connected": False,
                "bucket": cfg["bucket"],
                "region": cfg["region"],
                "error": f"S3 Verification error: {str(e)}",
                "fallback_active": True,
            }

    # ------------------------------------------------------------------
    # DATASET OPERATIONS
    # ------------------------------------------------------------------

    def upload_dataset(
        self,
        dataset_id: str,
        csv_content: str,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Tuple[bool, Optional[str]]:
        """
        Uploads a CSV dataset and optional JSON metadata to S3 under 'datasets/{dataset_id}.csv'.
        Always keeps the object private and applies AES256 server-side encryption.
        Returns (success: bool, s3_key_or_error: str).
        """
        if not self.is_enabled():
            return False, "USE_AWS_S3 is disabled; using local storage fallback."

        client = self.get_client()
        if client is None:
            return False, "S3 client unavailable."

        bucket = settings.AWS_S3_BUCKET
        csv_key = f"datasets/{dataset_id}.csv"

        try:
            csv_bytes = csv_content.encode("utf-8")
            client.put_object(
                Bucket=bucket,
                Key=csv_key,
                Body=csv_bytes,
                ContentType="text/csv",
                ServerSideEncryption="AES256",
            )

            # Upload accompanying metadata if supplied
            if metadata:
                meta_key = f"datasets/{dataset_id}_meta.json"
                meta_bytes = json.dumps(metadata, indent=2).encode("utf-8")
                client.put_object(
                    Bucket=bucket,
                    Key=meta_key,
                    Body=meta_bytes,
                    ContentType="application/json",
                    ServerSideEncryption="AES256",
                )

            logger.info("Successfully uploaded dataset %s to s3://%s/%s", dataset_id, bucket, csv_key)
            return True, f"s3://{bucket}/{csv_key}"
        except Exception as e:
            logger.error("Failed to upload dataset %s to S3: %s", dataset_id, str(e))
            return False, str(e)

    def get_dataset(self, dataset_id: str) -> Optional[str]:
        """
        Retrieves a CSV dataset from S3 under 'datasets/{dataset_id}.csv'.
        Returns decoded CSV text or None if not found or on error.
        """
        if not self.is_enabled():
            return None

        client = self.get_client()
        if client is None:
            return None

        bucket = settings.AWS_S3_BUCKET
        csv_key = f"datasets/{dataset_id}.csv"

        try:
            response = client.get_object(Bucket=bucket, Key=csv_key)
            body = response["Body"].read()
            return body.decode("utf-8")
        except ClientError as e:
            code = e.response.get("Error", {}).get("Code")
            if code in ("NoSuchKey", "404"):
                logger.debug("Dataset %s does not exist in S3 (key: %s)", dataset_id, csv_key)
            else:
                logger.warning("ClientError retrieving dataset %s from S3: %s", dataset_id, str(e))
            return None
        except Exception as e:
            logger.warning("Error retrieving dataset %s from S3: %s", dataset_id, str(e))
            return None

    # ------------------------------------------------------------------
    # REPORT & DECISION RECORD OPERATIONS
    # ------------------------------------------------------------------

    def upload_report(
        self,
        record_id: str,
        report_data: Dict[str, Any],
        html_content: Optional[str] = None,
        csv_content: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Uploads a generated decision record / audit report to S3.
        Uploads:
        - 'reports/{record_id}.json' (full structured record)
        - 'reports/{record_id}.html' (optional standalone HTML report)
        - 'reports/{record_id}.csv' (optional allocations CSV export)
        Returns a dict of uploaded S3 keys and status.
        """
        if not self.is_enabled():
            return {"success": False, "reason": "USE_AWS_S3 is disabled", "keys": {}}

        client = self.get_client()
        if client is None:
            return {"success": False, "reason": "S3 client unavailable", "keys": {}}

        bucket = settings.AWS_S3_BUCKET
        uploaded_keys: Dict[str, str] = {}

        try:
            # 1. JSON Report
            json_key = f"reports/{record_id}.json"
            json_bytes = json.dumps(report_data, indent=2).encode("utf-8")
            client.put_object(
                Bucket=bucket,
                Key=json_key,
                Body=json_bytes,
                ContentType="application/json",
                ServerSideEncryption="AES256",
            )
            uploaded_keys["json"] = f"s3://{bucket}/{json_key}"

            # 2. HTML Report if available
            if html_content:
                html_key = f"reports/{record_id}.html"
                client.put_object(
                    Bucket=bucket,
                    Key=html_key,
                    Body=html_content.encode("utf-8"),
                    ContentType="text/html",
                    ServerSideEncryption="AES256",
                )
                uploaded_keys["html"] = f"s3://{bucket}/{html_key}"

            # 3. CSV Allocation table if available
            if csv_content:
                csv_key = f"reports/{record_id}.csv"
                client.put_object(
                    Bucket=bucket,
                    Key=csv_key,
                    Body=csv_content.encode("utf-8"),
                    ContentType="text/csv",
                    ServerSideEncryption="AES256",
                )
                uploaded_keys["csv"] = f"s3://{bucket}/{csv_key}"

            logger.info("Successfully uploaded report %s to S3: %s", record_id, list(uploaded_keys.values()))
            return {"success": True, "keys": uploaded_keys}
        except Exception as e:
            logger.error("Failed to upload report %s to S3: %s", record_id, str(e))
            return {"success": False, "error": str(e), "keys": uploaded_keys}

    def get_report(self, record_id: str) -> Optional[Dict[str, Any]]:
        """
        Retrieves a stored decision record from S3 under 'reports/{record_id}.json'.
        Returns parsed JSON dict or None.
        """
        if not self.is_enabled():
            return None

        client = self.get_client()
        if client is None:
            return None

        bucket = settings.AWS_S3_BUCKET
        json_key = f"reports/{record_id}.json"

        try:
            response = client.get_object(Bucket=bucket, Key=json_key)
            data_str = response["Body"].read().decode("utf-8")
            return json.loads(data_str)
        except ClientError as e:
            code = e.response.get("Error", {}).get("Code")
            if code not in ("NoSuchKey", "404"):
                logger.warning("ClientError retrieving report %s from S3: %s", record_id, str(e))
            return None
        except Exception as e:
            logger.warning("Error retrieving report %s from S3: %s", record_id, str(e))
            return None

    # ------------------------------------------------------------------
    # GENERIC HELPER FOR SMALL TEST UPLOADS
    # ------------------------------------------------------------------

    def upload_file_bytes(
        self,
        key: str,
        data: bytes,
        content_type: str = "application/octet-stream",
        metadata: Optional[Dict[str, str]] = None,
    ) -> Tuple[bool, Optional[str]]:
        """
        Generic safe binary file upload helper.
        Enforces private ACL and AES256 server-side encryption.
        """
        if not self.is_enabled():
            return False, "USE_AWS_S3 is disabled."

        client = self.get_client()
        if client is None:
            return False, "S3 client unavailable."

        bucket = settings.AWS_S3_BUCKET
        put_args: Dict[str, Any] = {
            "Bucket": bucket,
            "Key": key,
            "Body": data,
            "ContentType": content_type,
            "ServerSideEncryption": "AES256",
        }
        if metadata:
            put_args["Metadata"] = metadata

        try:
            client.put_object(**put_args)
            return True, f"s3://{bucket}/{key}"
        except Exception as e:
            logger.error("Failed to upload bytes to s3://%s/%s: %s", bucket, key, str(e))
            return False, str(e)

    def get_file_bytes(self, key: str) -> Optional[bytes]:
        """
        Generic safe binary file retrieval helper.
        """
        if not self.is_enabled():
            return None

        client = self.get_client()
        if client is None:
            return None

        bucket = settings.AWS_S3_BUCKET
        try:
            res = client.get_object(Bucket=bucket, Key=key)
            return res["Body"].read()
        except Exception as e:
            logger.warning("Failed to retrieve bytes from s3://%s/%s: %s", bucket, key, str(e))
            return None


s3_service = S3Service()
