import pytest
from server.app.services.optimisation_engine import optimisation_engine
from server.app.models.optimisation import OptimisationRequest, OptimisationWeights

def test_optimisation_solve_feasible():
    req = OptimisationRequest(
        dataset_id="sample-metro-verde",
        total_budget_cap=2500000.0,  # 2.5 Million USD
        min_equity_investment_share=0.30,
        weights=OptimisationWeights(
            heat_reduction=0.30,
            flood_reduction=0.30,
            water_resilience=0.20,
            green_equity=0.20
        )
    )
    result = optimisation_engine.solve(req)
    assert result.is_feasible is True
    assert len(result.alternatives) == 3
    
    strategies = [a.strategy_id for a in result.alternatives]
    assert "cost_focused" in strategies
    assert "balanced" in strategies
    assert "equity_focused" in strategies

    balanced = next(a for a in result.alternatives if a.strategy_id == "balanced")
    assert balanced.total_capital_cost <= req.total_budget_cap
    assert len(balanced.allocations) > 0
    assert balanced.total_stormwater_runoff_diverted_m3 > 0
    assert balanced.equity_score > 0

def test_optimisation_infeasible_budget():
    req = OptimisationRequest(
        dataset_id="sample-metro-verde",
        total_budget_cap=50.0  # 50 USD cannot buy any unit of infrastructure
    )
    result = optimisation_engine.solve(req)
    assert result.is_feasible is False
    assert result.infeasibility_report is not None
    assert result.infeasibility_report.is_infeasible is True
    assert "budget" in result.infeasibility_report.primary_bottleneck.lower()

def test_equity_portfolio_prioritisation():
    req = OptimisationRequest(
        dataset_id="sample-metro-verde",
        total_budget_cap=3000000.0,
        min_equity_investment_share=0.25
    )
    result = optimisation_engine.solve(req)
    assert result.is_feasible is True

    balanced = next(a for a in result.alternatives if a.strategy_id == "balanced")
    equity_strat = next(a for a in result.alternatives if a.strategy_id == "equity_focused")

    # Equity strategy should have a higher vulnerable area investment share
    assert equity_strat.vulnerable_area_investment_share_pct >= balanced.vulnerable_area_investment_share_pct
