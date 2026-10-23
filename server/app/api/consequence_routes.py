from fastapi import APIRouter, Query, HTTPException
from typing import Optional

from ..services.consequence_engine import consequence_engine
from ..models.consequence_chain import ConsequenceChainGraph

router = APIRouter(prefix="/consequences", tags=["Consequence Chain"])

@router.get("/chain", response_model=ConsequenceChainGraph)
def get_consequence_chain(
    intervention_id: str = Query(..., description="ID of the intervention"),
    units_deployed: float = Query(default=100.0, gt=0, description="Scale of deployment"),
    neighbourhood_id: Optional[str] = Query(default=None),
    neighbourhood_name: Optional[str] = Query(default=None),
    strategy: str = Query(default="balanced"),
    active_scenario: Optional[str] = Query(default=None),
):
    try:
        return consequence_engine.generate_chain(
            intervention_id=intervention_id,
            units_deployed=units_deployed,
            neighbourhood_id=neighbourhood_id,
            neighbourhood_name=neighbourhood_name,
            strategy=strategy,
            active_scenario=active_scenario
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate consequence chain: {str(e)}")
