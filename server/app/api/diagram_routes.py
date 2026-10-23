from fastapi import APIRouter, HTTPException, Query, Body
from typing import Optional, Dict, Any

from ..models.diagram_models import (
    StructureDiagram,
    DiagramViewType,
)
from ..services.diagram_service import diagram_service

router = APIRouter(prefix="/diagrams", tags=["Construction Diagrams"])


@router.get("/{project_type}", response_model=StructureDiagram)
def get_structure_diagram(
    project_type: str,
    view: str = Query("cross_section", description="View type: cross_section, plan_view, construction_stages"),
    location: str = Query("Bengaluru Urban Corridor", description="Target location / corridor name"),
):
    """
    Returns an interactive SVG structural diagram and staged construction sequence
    for the selected urban infrastructure type (stormwater, roads, green roofs, water supply, etc.).
    """
    vtype = DiagramViewType.CROSS_SECTION
    if view == "plan_view":
        vtype = DiagramViewType.PLAN_VIEW
    elif view == "construction_stages":
        vtype = DiagramViewType.CONSTRUCTION_STAGES

    return diagram_service.get_diagram(
        project_type=project_type,
        view_type=vtype,
        location_name=location,
    )


@router.post("/custom", response_model=StructureDiagram)
def get_custom_structure_diagram(
    payload: Dict[str, Any] = Body(...)
):
    """
    Generates a tailored structure diagram based on user request prompt, location,
    and optional user dimension overrides.
    """
    ptype = payload.get("project_type", "stormwater_drainage")
    view_str = payload.get("view", "cross_section")
    location = payload.get("location_name", "Bengaluru Urban Corridor")
    custom_params = payload.get("custom_params", {})

    vtype = DiagramViewType.CROSS_SECTION
    if view_str == "plan_view":
        vtype = DiagramViewType.PLAN_VIEW
    elif view_str == "construction_stages":
        vtype = DiagramViewType.CONSTRUCTION_STAGES

    return diagram_service.get_diagram(
        project_type=ptype,
        view_type=vtype,
        location_name=location,
        custom_params=custom_params,
    )
