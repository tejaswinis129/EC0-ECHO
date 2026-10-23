from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from .optimisation import AlternativePortfolio, OptimisationRequest
from .ai_explainer import DecisionExplanation

class DecisionRecord(BaseModel):
    record_id: str
    created_at: str
    reproducibility_hash: str
    dataset_id: str
    dataset_name: str
    dataset_provenance: str
    
    # Inputs
    optimisation_request: OptimisationRequest
    
    # Baseline summary
    baseline_composite_risk: float
    high_risk_neighbourhood_count: int
    
    # Recommended portfolio
    selected_strategy: str
    recommended_portfolio: AlternativePortfolio
    other_alternatives: List[AlternativePortfolio]
    
    # Stress test records
    scenario_runs: List[Dict[str, Any]] = Field(default_factory=list)
    
    # Consequence Chain takeaways
    key_consequences_identified: List[str]
    unintended_tradeoffs: List[str]
    critical_mitigations: List[str]
    
    # AI Explanation
    explanation: Optional[DecisionExplanation] = None
    
    # Limitations and Governance
    data_limitations: List[str]
    disclaimer: str = (
        "ECO-ECHO recommendations are computational decision-support heuristics designed to assist "
        "urban planners and engineers. They do not replace formal geotechnical, hydrological, "
        "environmental impact, or structural engineering reviews."
    )
