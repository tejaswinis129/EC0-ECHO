from fastapi import APIRouter, HTTPException, Response
from typing import Dict, Any, List
from pydantic import BaseModel

from ..services.report_service import report_service
from ..services.s3_service import s3_service
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
    
    rec_dict = record.model_dump() if hasattr(record, "model_dump") else record.dict()
    
    # 1. Local Database Persistence
    db_manager.save_decision_record(
        record_id=record.record_id,
        dataset_id=record.dataset_id,
        dataset_name=record.dataset_name,
        strategy=record.selected_strategy,
        hash_val=record.reproducibility_hash,
        data=rec_dict
    )
    
    # 2. S3 Cloud Storage Backup (if enabled, fallback safe)
    if s3_service.is_enabled():
        try:
            s3_service.upload_report(
                record_id=record.record_id,
                report_data=rec_dict
            )
        except Exception:
            pass

    return record

@router.get("")
@router.get("/")
@router.get("/list")
def list_decision_records():
    return db_manager.list_decision_records()

@router.get("/{record_id}")
def get_decision_record(record_id: str):
    rec = db_manager.get_decision_record(record_id)
    if not rec and s3_service.is_enabled():
        try:
            rec = s3_service.get_report(record_id)
        except Exception:
            rec = None

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
