import pytest
from server.app.services.scenario_simulator import scenario_simulator
from server.app.models.scenario import ScenarioParams, ScenarioType
from server.app.models.optimisation import OptimisationRequest

@pytest.fixture
def base_request():
    return OptimisationRequest(
        dataset_id="sample-metro-verde",
        total_budget_cap=2000000.0,
        min_equity_investment_share=0.30
    )

def test_drought_scenario(base_request):
    params = ScenarioParams(
        scenario_type=ScenarioType.DROUGHT,
        base_optimisation_request=base_request
    )
    result = scenario_simulator.simulate(params)
    assert result.scenario_type == ScenarioType.DROUGHT
    assert result.deltas is not None
    assert len(result.new_vulnerabilities_introduced) > 0
    assert len(result.recommended_mitigations) > 0

def test_extreme_rainfall_scenario(base_request):
    params = ScenarioParams(
        scenario_type=ScenarioType.EXTREME_RAINFALL,
        extreme_rainfall_surge_pct=50.0,
        base_optimisation_request=base_request
    )
    result = scenario_simulator.simulate(params)
    assert result.scenario_type == ScenarioType.EXTREME_RAINFALL
    assert result.scenario_portfolio is not None

def test_budget_cut_scenario(base_request):
    params = ScenarioParams(
        scenario_type=ScenarioType.BUDGET_CUT,
        budget_cut_pct=40.0,
        base_optimisation_request=base_request
    )
    result = scenario_simulator.simulate(params)
    assert result.scenario_portfolio.total_capital_cost < result.baseline_portfolio.total_capital_cost
    assert result.deltas.capital_cost_difference < 0

def test_combined_shock_scenario(base_request):
    params = ScenarioParams(
        scenario_type=ScenarioType.COMBINED_SHOCK,
        base_optimisation_request=base_request
    )
    result = scenario_simulator.simulate(params)
    assert len(result.unintended_consequences) > 0
