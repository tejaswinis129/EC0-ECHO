from fastapi import APIRouter, HTTPException

from ..services.scenario_simulator import scenario_simulator
from ..models.scenario import ScenarioParams, ScenarioSimulationResult

router = APIRouter(prefix="/scenarios", tags=["Scenario Simulator"])

@router.post("/simulate", response_model=ScenarioSimulationResult)
def run_scenario(params: ScenarioParams):
    try:
        return scenario_simulator.simulate(params)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Simulation error: {str(e)}")
