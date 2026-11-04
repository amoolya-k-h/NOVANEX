from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional, List
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.finding import Finding
from app.ai.analyst import SecurityAnalyst
from app.ai.remediator import SecurityRemediator
from app.ai.diff_generator import generate_structured_diff
import json

router = APIRouter(prefix="/api/ai", tags=["ai"])
analyst = SecurityAnalyst()
remediator = SecurityRemediator()


class ChatRequest(BaseModel):
    finding_id: str
    message: str
    history: Optional[List[dict]] = None


def _to_dict(f: Finding) -> dict:
    return {
        "id": f.id, "title": f.title, "category": f.category,
        "severity": f.severity, "scanner": f.scanner,
        "file_path": f.file_path, "line_number": f.line_number,
        "evidence": f.evidence, "description": f.description,
        "cve_id": f.cve_id, "cvss_score": f.cvss_score,
        "package_name": f.package_name, "package_version": f.package_version,
        "fixed_version": f.fixed_version,
    }


@router.get("/explain/{finding_id}/stream")
async def stream_explanation(finding_id: str, db: Session = Depends(get_db)):
    f = db.query(Finding).filter(Finding.id == finding_id).first()
    if not f:
        raise HTTPException(404, "Finding not found")
    fd = _to_dict(f)

    async def gen():
        full = ""
        async for chunk in analyst.stream_explanation(fd):
            full += chunk
            yield f"data: {json.dumps({'chunk': chunk})}\n\n"
        f.ai_explanation = full
        db.commit()
        yield f"data: {json.dumps({'done': True})}\n\n"

    return StreamingResponse(gen(), media_type="text/event-stream",
                             headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})


@router.get("/remediate/{finding_id}/stream")
async def stream_remediation(finding_id: str, db: Session = Depends(get_db)):
    f = db.query(Finding).filter(Finding.id == finding_id).first()
    if not f:
        raise HTTPException(404, "Finding not found")
    fd = _to_dict(f)

    async def gen():
        full = ""
        async for chunk in remediator.stream_remediation(fd):
            full += chunk
            yield f"data: {json.dumps({'chunk': chunk})}\n\n"
        f.ai_remediation = full
        db.commit()
        yield f"data: {json.dumps({'done': True})}\n\n"

    return StreamingResponse(gen(), media_type="text/event-stream",
                             headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})


@router.get("/explain/{finding_id}")
async def get_explanation(finding_id: str, db: Session = Depends(get_db)):
    f = db.query(Finding).filter(Finding.id == finding_id).first()
    if not f:
        raise HTTPException(404, "Finding not found")
    if not f.ai_explanation:
        f.ai_explanation = await analyst.explain_finding(_to_dict(f))
        db.commit()
    return {"finding_id": finding_id, "explanation": f.ai_explanation}


@router.get("/remediate/{finding_id}")
async def get_remediation(finding_id: str, db: Session = Depends(get_db)):
    f = db.query(Finding).filter(Finding.id == finding_id).first()
    if not f:
        raise HTTPException(404, "Finding not found")
    if not f.ai_remediation:
        f.ai_remediation = await remediator.suggest_fix(_to_dict(f))
        db.commit()
    return {"finding_id": finding_id, "remediation": f.ai_remediation}


@router.get("/diff/{finding_id}")
async def get_diff(finding_id: str, db: Session = Depends(get_db)):
    f = db.query(Finding).filter(Finding.id == finding_id).first()
    if not f:
        raise HTTPException(404, "Finding not found")
    diff_data = generate_structured_diff(_to_dict(f))
    return diff_data


@router.post("/chat")
async def chat_with_ai(req: ChatRequest, db: Session = Depends(get_db)):
    f = db.query(Finding).filter(Finding.id == req.finding_id).first()
    if not f:
        raise HTTPException(404, "Finding not found")
    answer = await analyst.chat_about_finding(_to_dict(f), req.message, req.history)
    return {"finding_id": req.finding_id, "reply": answer}


