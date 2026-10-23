from enum import Enum
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from .evidence import ProvenanceType


class DiagramViewType(str, Enum):
    CROSS_SECTION = "cross_section"
    PLAN_VIEW = "plan_view"
    CONSTRUCTION_STAGES = "construction_stages"


class DiagramComponent(BaseModel):
    id: str
    name: str
    category: str  # structural, soil_subgrade, waterproofing, utilities, safety_protection, hydraulics, vegetation
    description: str
    provenance: ProvenanceType = ProvenanceType.ILLUSTRATIVE
    evidence_ref: Optional[str] = None
    assumptions: List[str] = Field(default_factory=list)
    risks: List[str] = Field(default_factory=list)
    construction_stage: str
    is_verified: bool = False
    dimensions_label: Optional[str] = None
    svg_element: str  # rect, path, polygon, circle, line, text, group
    svg_props: Dict[str, Any] = Field(default_factory=dict)


class DiagramDimensionLine(BaseModel):
    id: str
    label: str
    x1: float
    y1: float
    x2: float
    y2: float
    text_x: float
    text_y: float
    is_illustrative: bool = True
    citation: Optional[str] = None


class ConstructionStageVisual(BaseModel):
    stage_number: int
    stage_name: str
    duration_estimate: str
    description: str
    key_actions: List[str] = Field(default_factory=list)
    safety_measures: List[str] = Field(default_factory=list)
    active_component_ids: List[str] = Field(default_factory=list)
    inspection_checkpoint: str = ""


class StructureDiagram(BaseModel):
    diagram_id: str
    project_type: str
    project_name: str
    location_name: str
    view_type: DiagramViewType
    title: str
    subtitle: str
    viewbox: str = "0 0 920 540"
    components: List[DiagramComponent] = Field(default_factory=list)
    dimension_lines: List[DiagramDimensionLine] = Field(default_factory=list)
    stages: List[ConstructionStageVisual] = Field(default_factory=list)
    disclaimer: str = (
        "⚠️ Conceptual Diagram — Illustrative only. Not for construction. "
        "All structural reinforcement, soil bearing capacities, pipe slopes, and trench dimensions "
        "must be determined by verified site investigations and sealed by a licensed Professional Engineer (PE)."
    )
    evidence_citations: List[str] = Field(default_factory=list)
    generated_at: str
