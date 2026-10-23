from fastapi import APIRouter, HTTPException
from typing import Optional
from pydantic import BaseModel

from ..services.risk_service import risk_service
from ..models.risk import RiskOverview, RiskWeightConfig

router = APIRouter(prefix="/risk", tags=["Risk Analysis"])

class RiskCalculationRequest(BaseModel):
    dataset_id: str
    weights: Optional[RiskWeightConfig] = None

@router.post("/calculate", response_model=RiskOverview)
def calculate_risk(req: RiskCalculationRequest):
    overview = risk_service.calculate_risk(req.dataset_id, req.weights)
    if overview is None:
        raise HTTPException(status_code=404, detail="Dataset not found or could not calculate risk indicators.")
    return overview
