import os
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, UploadFile, File, Query, Form

from ..models.evidence import (
    DataSourceRegistryItem,
    RealWorldEvidenceRecord,
    UploadedDocumentMetadata,
)
from ..services.evidence_source_service import evidence_source_service

router = APIRouter(prefix="/evidence", tags=["Evidence & Real-World Sources"])


@router.get("/sources", response_model=List[DataSourceRegistryItem])
def list_data_sources():
    """
    Returns the real-world evidence data source registry covering BBMP SWD Master Plan,
    Smart Cities Open Data, Karnataka Water Catalog, NWDP, and Kaun City Work Orders.
    """
    return evidence_source_service.list_sources()


@router.get("/sources/{source_id}", response_model=DataSourceRegistryItem)
def get_data_source(source_id: str):
    """
    Retrieves metadata, access mode, and manual import instructions for a specific source.
    """
    src = evidence_source_service.get_source(source_id)
    if not src:
        raise HTTPException(status_code=404, detail=f"Data source '{source_id}' not found.")
    return src


@router.get("/sources/{source_id}/test")
def test_source_connection(source_id: str):
    """
    Live ping / HTTP verification test of the source repository or CKAN download URL.
    Returns latency, HTTP status code, content-type, content-length, and active accessibility.
    """
    res = evidence_source_service.test_source_connectivity(source_id)
    if "error" in res and res.get("http_status") is None and not res.get("error"):
        raise HTTPException(status_code=404, detail=res["error"])
    return res


@router.get("/records", response_model=List[RealWorldEvidenceRecord])
def search_evidence_records(
    query: Optional[str] = Query(None, description="Keywords to match across project name, reference or field values"),
    category: Optional[str] = Query(None, description="Filter by infrastructure category"),
    location: Optional[str] = Query(None, description="Filter by ward, zone or valley location"),
    provenance_type: Optional[str] = Query(None, description="Filter by VERIFIED_SOURCE_FACT, ESTIMATE, etc."),
):
    """
    Search and filter curated and imported real-world civil engineering evidence records.
    Preserves document page numbers, citations, original units, and validation status.
    """
    return evidence_source_service.search_records(
        query=query, category=category, location=location, provenance_type=provenance_type
    )


@router.get("/records/{record_id}", response_model=RealWorldEvidenceRecord)
def get_evidence_record(record_id: str):
    """
    Retrieves a specific real-world evidence record by unique ID.
    """
    rec = evidence_source_service.get_record(record_id)
    if not rec:
        raise HTTPException(status_code=404, detail=f"Evidence record '{record_id}' not found.")
    return rec


@router.post("/upload", response_model=UploadedDocumentMetadata)
async def upload_project_evidence_document(file: UploadFile = File(...)):
    """
    Safely accepts and indexes user-provided DPRs, tender documents, CSV, Excel, GeoJSON,
    JSON, or PDF files up to 10MB.
    Extracts structured summary rows without executing code and registers evidence for planning.
    """
    filename = file.filename or "uploaded_file"
    ext = os.path.splitext(filename)[1].lower()
    allowed_exts = [".csv", ".json", ".geojson", ".pdf", ".txt", ".xlsx"]
    if ext not in allowed_exts:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file extension '{ext}'. Allowed types: {', '.join(allowed_exts)}",
        )

    try:
        content_bytes = await file.read()
        if len(content_bytes) > 10 * 1024 * 1024:
            raise HTTPException(status_code=413, detail="File size exceeds maximum 10MB limit.")
        meta = evidence_source_service.process_uploaded_document(
            filename=filename, content_bytes=content_bytes, file_type=ext.lstrip(".")
        )
        return meta
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process uploaded file: {str(e)}")


@router.get("/uploads", response_model=List[UploadedDocumentMetadata])
def list_uploaded_documents():
    """
    Lists all user-attached project reports, DPRs, and spreadsheets uploaded during this session.
    """
    return evidence_source_service.list_uploads()
