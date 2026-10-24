import os
import io
import csv
import uuid
import datetime
from pathlib import Path
from typing import List, Dict, Optional, Tuple, Any
import pandas as pd

from ..config import settings
from .s3_service import s3_service
from ..database import db_manager
from ..models.data_engine import (
    NeighbourhoodRecord,
    ValidationIssue,
    ValidationReport,
    DatasetMetadata,
    DatasetSummary,
)

REQUIRED_COLUMNS = [
    "neighbourhood_id",
    "neighbourhood_name",
    "population",
    "area_sqkm",
    "surface_temp_c",
    "impervious_surface_pct",
    "tree_canopy_pct",
    "park_access_pct",
    "annual_rainfall_mm",
    "extreme_rainfall_runoff_m3",
    "drainage_capacity_m3",
    "water_demand_m3_day",
    "water_supply_m3_day",
    "social_vulnerability_index",
    "available_roof_area_m2",
    "available_public_land_m2",
    "available_road_corridor_m2",
]

NUMERIC_COLUMNS_RANGES = {
    "population": (1, 10000000),
    "area_sqkm": (0.01, 1000.0),
    "surface_temp_c": (-10.0, 65.0),
    "impervious_surface_pct": (0.0, 100.0),
    "tree_canopy_pct": (0.0, 100.0),
    "park_access_pct": (0.0, 100.0),
    "annual_rainfall_mm": (0.0, 10000.0),
    "extreme_rainfall_runoff_m3": (0.0, 50000000.0),
    "drainage_capacity_m3": (0.0, 50000000.0),
    "water_demand_m3_day": (0.0, 5000000.0),
    "water_supply_m3_day": (0.0, 5000000.0),
    "social_vulnerability_index": (0.0, 1.0),
    "available_roof_area_m2": (0.0, 50000000.0),
    "available_public_land_m2": (0.0, 50000000.0),
    "available_road_corridor_m2": (0.0, 50000000.0),
}

class DataService:
    def __init__(self):
        self._datasets_cache: Dict[str, pd.DataFrame] = {}
        self._metadata_cache: Dict[str, DatasetMetadata] = {}
        self._init_sample_datasets()

    def _init_sample_datasets(self):
        """Loads default realistic sample datasets into memory."""
        # 1. Metro Verde Metropolitan Resilience Dataset
        metro_path = settings.DATA_DIR / "metro_verde_sample.csv"
        if metro_path.exists():
            df_metro = pd.read_csv(metro_path)
            metro_id = "sample-metro-verde"
            self._datasets_cache[metro_id] = df_metro
            self._metadata_cache[metro_id] = DatasetMetadata(
                dataset_id=metro_id,
                name="Metro Verde Urban Resilience Dataset",
                description="8-district metropolitan area with varying heat islands, flood zones, and socio-economic vulnerability.",
                provenance="Simulated Municipal Open Data (US EPA Heat Island & Stormwater Benchmarking Model 2024)",
                created_at="2024-10-01T08:00:00Z",
                row_count=len(df_metro),
                is_sample=True,
                file_size_bytes=os.path.getsize(metro_path),
            )

        # 2. Coastal Basin Flood & Surge Dataset
        coastal_path = settings.DATA_DIR / "coastal_basin_sample.csv"
        if coastal_path.exists():
            df_coastal = pd.read_csv(coastal_path)
            coastal_id = "sample-coastal-basin"
            self._datasets_cache[coastal_id] = df_coastal
            self._metadata_cache[coastal_id] = DatasetMetadata(
                dataset_id=coastal_id,
                name="Coastal Basin Stormwater & Surge Dataset",
                description="6-district maritime urban core with high sea-level exposure and extreme precipitation runoff pressure.",
                provenance="Simulated Coastal Climate Assessment (NOAA Atlas 14 Precipitation Frequency Heuristics)",
                created_at="2024-10-15T09:30:00Z",
                row_count=len(df_coastal),
                is_sample=True,
                file_size_bytes=os.path.getsize(coastal_path),
            )

        # 3. Load persistent user-uploaded datasets from database across restarts
        try:
            persisted_list = db_manager.list_datasets()
            for p in persisted_list:
                pid = p["dataset_id"]
                if pid not in self._metadata_cache:
                    self._metadata_cache[pid] = DatasetMetadata(
                        dataset_id=pid,
                        name=p["name"],
                        description=p["description"] or "Municipal urban sustainability dataset.",
                        provenance=p["provenance"],
                        created_at=p["created_at"],
                        row_count=p["row_count"],
                        is_sample=p["is_sample"],
                        file_size_bytes=p["file_size_bytes"],
                    )
        except Exception:
            pass

    def list_datasets(self) -> List[DatasetMetadata]:
        # Sync with database so all uvicorn workers see newly uploaded datasets immediately
        try:
            persisted_list = db_manager.list_datasets()
            for p in persisted_list:
                pid = p["dataset_id"]
                if pid not in self._metadata_cache:
                    self._metadata_cache[pid] = DatasetMetadata(
                        dataset_id=pid,
                        name=p["name"],
                        description=p.get("description") or "Municipal urban sustainability dataset.",
                        provenance=p.get("provenance") or "User uploaded dataset.",
                        created_at=p.get("created_at") or "",
                        row_count=p.get("row_count", 0),
                        is_sample=bool(p.get("is_sample", False)),
                        file_size_bytes=p.get("file_size_bytes", 0),
                    )
        except Exception:
            pass
        return list(self._metadata_cache.values())

    def get_dataset_metadata(self, dataset_id: str) -> Optional[DatasetMetadata]:
        meta = self._metadata_cache.get(dataset_id)
        if meta is not None:
            return meta
        # Check database across worker processes
        try:
            p = db_manager.get_dataset(dataset_id)
            if p:
                meta = DatasetMetadata(
                    dataset_id=p["dataset_id"],
                    name=p["name"],
                    description=p.get("description") or "Municipal urban sustainability dataset.",
                    provenance=p.get("provenance") or "User uploaded dataset.",
                    created_at=p.get("created_at") or "",
                    row_count=p.get("row_count", 0),
                    is_sample=bool(p.get("is_sample", False)),
                    file_size_bytes=p.get("file_size_bytes", 0),
                )
                self._metadata_cache[dataset_id] = meta
                return meta
        except Exception:
            pass
        return None

    def get_dataset(self, dataset_id: str) -> Optional[pd.DataFrame]:
        df = self._datasets_cache.get(dataset_id)
        if df is not None:
            return df

        # 1. Check persistent local database
        try:
            db_row = db_manager.get_dataset(dataset_id)
            if db_row and db_row.get("csv_content"):
                df_db = pd.read_csv(io.StringIO(db_row["csv_content"]))
                self._datasets_cache[dataset_id] = df_db
                return df_db
        except Exception:
            pass

        # 2. Check S3 if enabled
        if s3_service.is_enabled():
            try:
                csv_data = s3_service.get_dataset(dataset_id)
                if csv_data:
                    df_s3 = pd.read_csv(io.StringIO(csv_data))
                    self._datasets_cache[dataset_id] = df_s3
                    return df_s3
            except Exception:
                pass
        return None

    def validate_csv(self, file_content: str, filename: str = "upload.csv") -> Tuple[ValidationReport, Optional[pd.DataFrame]]:
        """Parses, validates, and cleans an uploaded CSV file."""
        issues: List[ValidationIssue] = []
        
        try:
            df = pd.read_csv(io.StringIO(file_content))
        except Exception as e:
            return ValidationReport(
                is_valid=False,
                total_rows=0,
                issues=[ValidationIssue(severity="error", message=f"CSV Parsing failure: {str(e)}")],
                columns_found=[],
                missing_required_columns=REQUIRED_COLUMNS,
                data_quality_score=0.0,
                summary="Failed to parse the file as a valid CSV document."
            ), None

        # Clean column names (strip whitespace, lowercase)
        df.columns = [str(c).strip().lower() for c in df.columns]
        columns_found = list(df.columns)
        
        # Check required columns
        missing_cols = [c for c in REQUIRED_COLUMNS if c not in columns_found]
        if missing_cols:
            for mc in missing_cols:
                issues.append(ValidationIssue(
                    severity="error",
                    column=mc,
                    message=f"Missing mandatory column: '{mc}'"
                ))
            return ValidationReport(
                is_valid=False,
                total_rows=len(df),
                issues=issues,
                columns_found=columns_found,
                missing_required_columns=missing_cols,
                data_quality_score=max(0.0, 100.0 - (len(missing_cols) * 15.0)),
                summary=f"Dataset lacks {len(missing_cols)} critical required column(s)."
            ), None

        # Validate rows
        total_rows = len(df)
        if total_rows == 0:
            issues.append(ValidationIssue(severity="error", message="The uploaded CSV contains 0 data rows."))
            return ValidationReport(
                is_valid=False,
                total_rows=0,
                issues=issues,
                columns_found=columns_found,
                missing_required_columns=[],
                data_quality_score=0.0,
                summary="Dataset is empty."
            ), None

        # Duplicate ID check
        if "neighbourhood_id" in df.columns:
            dups = df[df.duplicated(subset=["neighbourhood_id"], keep=False)]
            if not dups.empty:
                dup_ids = dups["neighbourhood_id"].unique().tolist()
                issues.append(ValidationIssue(
                    severity="error",
                    column="neighbourhood_id",
                    message=f"Duplicate neighbourhood IDs detected: {dup_ids}"
                ))

        # Check numeric types and ranges
        quality_deductions = 0.0
        for col, (min_val, max_val) in NUMERIC_COLUMNS_RANGES.items():
            if col in df.columns:
                # Check for nulls
                null_count = df[col].isnull().sum()
                if null_count > 0:
                    issues.append(ValidationIssue(
                        severity="warning",
                        column=col,
                        message=f"{null_count} missing value(s) in '{col}'. Missing values will be imputed with median."
                    ))
                    df[col] = df[col].fillna(df[col].median())
                    quality_deductions += null_count * 2.0

                # Check numeric conversion
                try:
                    df[col] = pd.to_numeric(df[col])
                except Exception:
                    issues.append(ValidationIssue(
                        severity="error",
                        column=col,
                        message=f"Column '{col}' contains non-numeric values."
                    ))
                    continue

                # Range checks
                out_of_bounds = df[(df[col] < min_val) | (df[col] > max_val)]
                if not out_of_bounds.empty:
                    issues.append(ValidationIssue(
                        severity="warning",
                        column=col,
                        message=f"{len(out_of_bounds)} row(s) have values outside standard scientific range [{min_val}, {max_val}]."
                    ))
                    quality_deductions += len(out_of_bounds) * 1.5

        # Optional columns defaults
        if "baseline_temp_c" not in df.columns:
            df["baseline_temp_c"] = 30.0
            issues.append(ValidationIssue(
                severity="info",
                column="baseline_temp_c",
                message="Column 'baseline_temp_c' was not provided. Defaulting to 30.0 °C ambient baseline."
            ))

        has_errors = any(i.severity == "error" for i in issues)
        data_quality_score = max(10.0, min(100.0, 100.0 - quality_deductions))

        report = ValidationReport(
            is_valid=not has_errors,
            total_rows=total_rows,
            issues=issues,
            columns_found=columns_found,
            missing_required_columns=[],
            data_quality_score=data_quality_score if not has_errors else 0.0,
            summary="Dataset successfully validated and cleaned." if not has_errors else "Validation failed with critical schema or data format errors."
        )

        return report, df if not has_errors else None

    def register_uploaded_dataset(self, df: pd.DataFrame, name: str, provenance: str) -> DatasetMetadata:
        dataset_id = f"custom-{uuid.uuid4().hex[:8]}"
        created_at = datetime.datetime.now(datetime.timezone.utc).isoformat()
        
        self._datasets_cache[dataset_id] = df
        csv_str = df.to_csv(index=False)
        meta = DatasetMetadata(
            dataset_id=dataset_id,
            name=name or f"User Dataset ({dataset_id})",
            description="User uploaded municipal urban sustainability dataset.",
            provenance=provenance or "User Uploaded CSV",
            created_at=created_at,
            row_count=len(df),
            is_sample=False,
            file_size_bytes=len(csv_str.encode("utf-8")),
        )
        self._metadata_cache[dataset_id] = meta

        # 1. Local relational database persistence (survives container/server reboots)
        try:
            db_manager.save_dataset(
                dataset_id=dataset_id,
                name=meta.name,
                description=meta.description,
                provenance=meta.provenance,
                created_at=meta.created_at,
                row_count=meta.row_count,
                is_sample=False,
                file_size_bytes=meta.file_size_bytes,
                csv_content=csv_str,
            )
        except Exception:
            pass

        # 2. Optional S3 Cloud Sync (always preserves local database fallback)
        if s3_service.is_enabled():
            try:
                meta_dict = meta.model_dump() if hasattr(meta, "model_dump") else meta.dict()
                s3_service.upload_dataset(
                    dataset_id=dataset_id,
                    csv_content=csv_str,
                    metadata=meta_dict,
                )
            except Exception:
                pass

        return meta

    def get_summary(self, dataset_id: str) -> Optional[DatasetSummary]:
        df = self.get_dataset(dataset_id)
        if df is None:
            return None

        total_demand = float(df["water_demand_m3_day"].sum())
        total_supply = float(df["water_supply_m3_day"].sum())
        stress_ratio = (total_demand / total_supply) if total_supply > 0 else 1.0

        return DatasetSummary(
            total_population=int(df["population"].sum()),
            total_area_sqkm=round(float(df["area_sqkm"].sum()), 2),
            avg_surface_temp_c=round(float(df["surface_temp_c"].mean()), 1),
            avg_tree_canopy_pct=round(float(df["tree_canopy_pct"].mean()), 1),
            avg_impervious_pct=round(float(df["impervious_surface_pct"].mean()), 1),
            avg_park_access_pct=round(float(df["park_access_pct"].mean()), 1),
            total_water_demand_m3_day=round(total_demand, 1),
            total_water_supply_m3_day=round(total_supply, 1),
            water_stress_ratio=round(stress_ratio, 2),
            avg_social_vulnerability=round(float(df["social_vulnerability_index"].mean()), 2),
            total_available_roof_m2=round(float(df["available_roof_area_m2"].sum()), 0),
            total_available_public_land_m2=round(float(df["available_public_land_m2"].sum()), 0),
            total_available_corridor_m2=round(float(df["available_road_corridor_m2"].sum()), 0),
            neighbourhood_count=len(df),
        )

data_service = DataService()
