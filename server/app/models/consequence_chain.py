from typing import List, Optional, Dict, Any
from enum import Enum
from pydantic import BaseModel, Field

class ConsequenceCategory(str, Enum):
    ROOT = "root_intervention"
    DIRECT = "direct_physical_effect"
    ENVIRONMENTAL = "environmental_benefit"
    WATER_RESOURCE = "water_consequence"
    FINANCIAL = "financial_consequence"
    SOCIAL_EQUITY = "social_equity_consequence"
    SCENARIO_RISK = "scenario_vulnerability"
    MITIGATION = "suggested_mitigation"

class ImpactDirection(str, Enum):
    POSITIVE = "positive"
    NEGATIVE = "negative"
    UNCERTAIN = "uncertain"

class ConfidenceLevel(str, Enum):
    MEASURED = "Measured / Empirical"
    MODEL_ESTIMATE = "Calculated Model Estimate"
    BENCHMARK_ASSUMPTION = "Literature Benchmark"
    ILLUSTRATIVE = "Illustrative Scenario"

class ConsequenceNode(BaseModel):
    id: str
    label: str
    category: ConsequenceCategory
    affected_metric: str
    direction: ImpactDirection
    magnitude_estimate: str
    source_or_calculation: str
    confidence: ConfidenceLevel
    suggested_mitigation: Optional[str] = None
    detailed_explanation: str
    depth_level: int = 0

class ConsequenceEdge(BaseModel):
    source_id: str
    target_id: str
    relationship_label: str

class ConsequenceChainGraph(BaseModel):
    portfolio_strategy: str
    intervention_id: str
    intervention_name: str
    neighbourhood_id: Optional[str] = None
    neighbourhood_name: Optional[str] = None
    units_deployed: float
    nodes: List[ConsequenceNode]
    edges: List[ConsequenceEdge]
    unintended_tradeoffs_summary: List[str]
    priority_mitigation_actions: List[str]
    active_scenario_impacts: Optional[str] = None
