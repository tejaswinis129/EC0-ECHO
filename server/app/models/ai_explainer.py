from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class ExplanationRequest(BaseModel):
    portfolio_strategy: str = "balanced"
    dataset_name: str
    total_budget_cap: float
    total_capital_allocated: float
    budget_utilization_pct: float
    heat_reduction_score: float
    stormwater_diverted_m3: float
    net_water_impact_m3: float
    equity_score: float
    vulnerable_investment_pct: float
    binding_constraints: List[str]
    trade_offs: List[str]
    key_neighbourhoods: List[Dict[str, Any]]
    active_scenario: Optional[str] = None

class DecisionExplanation(BaseModel):
    executive_summary: str
    why_selected: str
    binding_constraints_analysis: str
    alternatives_comparison: str
    neighbourhood_equity_analysis: str
    tradeoffs_and_risks: str
    what_could_go_wrong: str
    uncertain_assumptions: str
    priority_investigations_before_build: List[str]
    provider: str = Field(..., description="'AWS Bedrock (Claude 3 Sonnet)' or 'Deterministic Scientific Engine'")
    model_id: Optional[str] = None
    is_fallback: bool = False
    generated_at: str
