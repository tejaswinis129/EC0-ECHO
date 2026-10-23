from fastapi import APIRouter, HTTPException
from typing import List

from ..services.intervention_service import intervention_service
from ..models.intervention import InterventionDefinition

router = APIRouter(prefix="/interventions", tags=["Intervention Library"])

@router.get("", response_model=List[InterventionDefinition])
def list_interventions():
    return intervention_service.list_interventions()

@router.get("/{intervention_id}", response_model=InterventionDefinition)
def get_intervention(intervention_id: str):
    item = intervention_service.get_intervention(intervention_id)
    if not item:
        raise HTTPException(status_code=404, detail="Intervention not found")
    return item

@router.post("", response_model=InterventionDefinition)
def upsert_intervention(item: InterventionDefinition):
    item.is_custom = True
    return intervention_service.upsert_intervention(item)

@router.post("/reset", response_model=List[InterventionDefinition])
def reset_defaults():
    intervention_service.reset_defaults()
    return intervention_service.list_interventions()
