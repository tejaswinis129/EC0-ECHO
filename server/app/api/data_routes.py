from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import List, Optional
import json

from ..services.data_service import data_service
from ..models.data_engine import DatasetMetadata, ValidationReport, DatasetSummary

router = APIRouter(prefix="/data", tags=["Data Engine"])

@router.get("/datasets", response_model=List[DatasetMetadata])
def list_datasets():
    return data_service.list_datasets()

@router.get("/datasets/{dataset_id}")
def get_dataset(dataset_id: str, limit: int = 50):
    meta = data_service.get_dataset_metadata(dataset_id)
    df = data_service.get_dataset(dataset_id)
    if meta is None or df is None:
        raise HTTPException(status_code=404, detail="Dataset not found")
    
    records = df.head(limit).to_dict(orient="records")
    return {
        "metadata": meta,
        "records": records,
        "columns": list(df.columns),
        "total_rows": len(df)
    }

@router.get("/datasets/{dataset_id}/summary", response_model=DatasetSummary)
def get_dataset_summary(dataset_id: str):
    summary = data_service.get_summary(dataset_id)
    if summary is None:
        raise HTTPException(status_code=404, detail="Dataset not found")
    return summary

@router.post("/validate")
async def validate_csv_upload(file: UploadFile = File(...)):
    contents = await file.read()
    try:
        decoded = contents.decode("utf-8")
    except UnicodeDecodeError:
        try:
            decoded = contents.decode("latin-1")
        except Exception:
            raise HTTPException(status_code=400, detail="Could not decode file as UTF-8 or Latin-1 text.")

    report, df = data_service.validate_csv(decoded, file.filename or "upload.csv")
    return {
        "report": report,
        "sample_preview": df.head(5).to_dict(orient="records") if df is not None else []
    }

@router.post("/upload")
async def upload_and_register_dataset(
    file: UploadFile = File(...),
    name: str = Form(""),
    provenance: str = Form(""),
):
    contents = await file.read()
    decoded = contents.decode("utf-8", errors="replace")
    
    report, df = data_service.validate_csv(decoded, file.filename or "upload.csv")
    if not report.is_valid or df is None:
        raise HTTPException(
            status_code=400,
            detail={"message": "Dataset validation failed", "report": report.dict()}
        )

    meta = data_service.register_uploaded_dataset(df, name or file.filename or "Custom Dataset", provenance)
    return {
        "message": "Dataset successfully uploaded and registered",
        "metadata": meta,
        "validation_report": report
    }
