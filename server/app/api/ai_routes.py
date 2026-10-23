from fastapi import APIRouter, HTTPException

from ..services.ai_explainer import ai_explainer_service
from ..models.ai_explainer import ExplanationRequest, DecisionExplanation

router = APIRouter(prefix="/explain", tags=["AI Decision Explainer"])

@router.post("", response_model=DecisionExplanation)
def explain_decision(req: ExplanationRequest):
    try:
        return ai_explainer_service.explain(req)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate explanation: {str(e)}")
