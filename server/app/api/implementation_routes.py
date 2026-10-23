from fastapi import APIRouter, HTTPException, Query, Body
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

from ..models.implementation_planner import (
    ImplementationPlanRequest,
    ClassificationResult,
    ImplementationPlan,
)
from ..services.implementation_planner_service import implementation_planner_service

router = APIRouter(prefix="/planner", tags=["Implementation Planner"])

class ScenarioRecalcRequest(BaseModel):
    scenario_type: str = "extreme_rainfall"  # extreme_rainfall, budget_cut_25, inflation_20

@router.post("/classify", response_model=ClassificationResult)
def classify_implementation_request(request: ImplementationPlanRequest):
    """
    Classifies an urban sustainability / engineering request into 16+ categories
    and identifies goals, sensitivities, and missing information.
    """
    try:
        return implementation_planner_service.classify_request(request)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Classification failed: {str(e)}")

@router.post("/generate", response_model=ImplementationPlan)
def generate_implementation_plan(request: ImplementationPlanRequest):
    """
    Generates a full engineering implementation plan with 11 core sections:
    Project Overview, Site Investigations, Design Alternatives, Phased Construction,
    Community Protection, Extreme Weather Readiness, Budget, Risk Register,
    Consequences, Quality Assurance, and Lifelong Maintenance.
    """
    if not request.prompt or len(request.prompt.strip()) < 5:
        raise HTTPException(
            status_code=422,
            detail="Project description is too short. Please provide a clear statement of your urban problem or project."
        )
    try:
        return implementation_planner_service.generate_plan(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate implementation plan: {str(e)}")

@router.get("/plans", response_model=List[Dict[str, Any]])
def list_saved_plans():
    """
    Returns summary list of all generated and saved municipal implementation plans.
    """
    return implementation_planner_service.list_plans()

@router.get("/plans/{plan_id}", response_model=ImplementationPlan)
def get_implementation_plan(plan_id: str):
    """
    Retrieves a specific implementation plan by its unique ID.
    """
    plan = implementation_planner_service.get_plan(plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail=f"Implementation plan '{plan_id}' not found.")
    return plan

@router.post("/plans/{plan_id}/scenario", response_model=ImplementationPlan)
def recalculate_plan_scenario(plan_id: str, req: ScenarioRecalcRequest):
    """
    Recalculates an implementation plan under a specific climate or economic stress-test scenario.
    """
    plan = implementation_planner_service.recalculate_scenario(plan_id, req.scenario_type)
    if not plan:
        raise HTTPException(status_code=404, detail=f"Implementation plan '{plan_id}' not found.")
    return plan

@router.get("/plans/{plan_id}/export")
def export_plan_report(plan_id: str, format: str = Query("markdown", description="Export format: markdown or json")):
    """
    Exports a structured audit report of the implementation plan with SHA-256 reproducibility hash.
    """
    plan = implementation_planner_service.get_plan(plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail=f"Implementation plan '{plan_id}' not found.")

    if format == "json":
        return plan.dict()

    report_md = implementation_planner_service.export_markdown_report(plan_id)
    return {
        "plan_id": plan_id,
        "format": "markdown",
        "reproducibility_hash": plan.reproducibility_hash,
        "content": report_md
    }
