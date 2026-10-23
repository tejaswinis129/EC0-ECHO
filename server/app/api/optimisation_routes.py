from fastapi import APIRouter, HTTPException

from ..services.optimisation_engine import optimisation_engine
from ..models.optimisation import OptimisationRequest, OptimisationResult

router = APIRouter(prefix="/optimise", tags=["Optimisation Engine"])

@router.post("/solve", response_model=OptimisationResult)
def solve_optimisation(request: OptimisationRequest):
    return optimisation_engine.solve(request)
