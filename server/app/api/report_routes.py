from fastapi import APIRouter, HTTPException, Response
from typing import Dict, Any, List
from pydantic import BaseModel

from ..services.report_service import report_service
from ..database import db_manager
from ..models.decision_record import DecisionRecord
from ..models.optimisation import AlternativePortfolio, OptimisationRequest
from ..models.ai_explainer import DecisionExplanation

router = APIRouter(prefix="/reports", tags=["Reports & Decision Records"])

class SaveRecordRequest(BaseModel):
    dataset_id: str
    request: OptimisationRequest
    baseline_risk: float
    high_risk_count: int
    selected_portfolio: AlternativePortfolio
    other_alternatives: List[AlternativePortfolio]
    scenario_runs: List[Dict[str, Any]] = []
    consequences: List[str] = []
    unintended_tradeoffs: List[str] = []
    critical_mitigations: List[str] = []
    explanation: DecisionExplanation = None

@router.post("/save", response_model=DecisionRecord)
def save_decision_record(req: SaveRecordRequest):
    record = report_service.create_decision_record(
        dataset_id=req.dataset_id,
        request=req.request,
        baseline_risk=req.baseline_risk,
        high_risk_count=req.high_risk_count,
        selected_portfolio=req.selected_portfolio,
        other_alternatives=req.other_alternatives,
        scenario_runs=req.scenario_runs,
        consequences=req.consequences,
        unintended_tradeoffs=req.unintended_tradeoffs,
        critical_mitigations=req.critical_mitigations,
        explanation=req.explanation
    )
    
    db_manager.save_decision_record(
        record_id=record.record_id,
        dataset_id=record.dataset_id,
        dataset_name=record.dataset_name,
        strategy=record.selected_strategy,
        hash_val=record.reproducibility_hash,
        data=record.dict()
    )
    return record

@router.get("/list")
def list_decision_records():
    return db_manager.list_decision_records()

@router.get("/{record_id}")
def get_decision_record(record_id: str):
    rec = db_manager.get_decision_record(record_id)
    if not rec:
        raise HTTPException(status_code=404, detail="Decision record not found")
    return rec

@router.post("/export/csv")
def export_allocations_csv(portfolio: AlternativePortfolio):
    csv_str = report_service.generate_csv_export(portfolio)
    return Response(
        content=csv_str,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=eco_echo_{portfolio.strategy_id}_allocations.csv"}
    )

@router.post("/export/html")
def export_html_report(record: DecisionRecord):
    html_str = report_service.generate_html_report(record)
    return Response(
        content=html_str,
        media_type="text/html",
        headers={"Content-Disposition": f"attachment; filename=eco_echo_{record.record_id}.html"}
    )
