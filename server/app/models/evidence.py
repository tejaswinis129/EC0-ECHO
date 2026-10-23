from enum import Enum
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class ProvenanceType(str, Enum):
    VERIFIED_SOURCE_FACT = "VERIFIED_SOURCE_FACT"
    DERIVED_VALUE = "DERIVED_VALUE"
    ESTIMATE = "ESTIMATE"
    SIMULATED = "SIMULATED"
    UNVERIFIED = "UNVERIFIED"
    MISSING = "MISSING"
    ILLUSTRATIVE = "ILLUSTRATIVE"


class AccessMode(str, Enum):
    API_CONNECTED = "API_CONNECTED"
    PORTAL_INDEXED = "PORTAL_INDEXED"
    MANUAL_IMPORT_REQUIRED = "MANUAL_IMPORT_REQUIRED"


class DataSourceRegistryItem(BaseModel):
    source_id: str
    name: str
    publisher: str
    category: str
    original_url: str
    active_resource_url: Optional[str] = None
    format: str
    geographic_scope: str
    license: str
    access_mode: AccessMode
    description: str
    coverage_period: str
    last_checked: str
    is_live: bool = True
    manual_import_instructions: Optional[str] = None


class RealWorldEvidenceRecord(BaseModel):
    record_id: str
    project_name: str
    source_id: str
    source_publisher: str
    source_url: str
    document_reference: str
    publication_date: str
    retrieval_timestamp: str
    location_name: str
    ward_number: Optional[int] = None
    zone_name: Optional[str] = None
    valley_basin: Optional[str] = None
    category: str
    provenance_type: ProvenanceType
    field_values: Dict[str, Any]
    units_and_currencies: Dict[str, str] = Field(default_factory=dict)
    formula_or_derivation: Optional[str] = None
    validation_status: str = "VERIFIED"
    missing_or_unverified_fields: List[str] = Field(default_factory=list)
    license: str = "Government Open Data / Public Domain"
    notes: str = ""


class UploadedDocumentMetadata(BaseModel):
    file_id: str
    filename: str
    file_type: str
    size_bytes: int
    uploaded_at: str
    extracted_records_count: int
    extracted_summary: str
    validation_status: str
    sample_records: List[Dict[str, Any]] = Field(default_factory=list)
