from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.finding import Finding
from typing import Optional

router = APIRouter(prefix="/api/findings", tags=["findings"])


def _serialize(f: Finding) -> dict:
    return {
        "id": f.id, "scan_id": f.scan_id,
        "category": f.category, "scanner": f.scanner,
        "title": f.title, "description": f.description,
        "severity": f.severity,
        "file_path": f.file_path, "line_number": f.line_number,
        "evidence": f.evidence, "evidence_redacted": f.evidence_redacted,
        "risk_score": f.risk_score, "priority": f.priority,
        "risk_factors": f.risk_factors,
        "cve_id": f.cve_id, "cwe_id": f.cwe_id, "cvss_score": f.cvss_score,
        "fix_available": f.fix_available, "fixed_version": f.fixed_version,
        "reference_urls": f.reference_urls,
        "package_name": f.package_name, "package_version": f.package_version,
        "ecosystem": f.ecosystem,
        "ai_explanation": f.ai_explanation,
        "ai_remediation": f.ai_remediation,
        "ai_code_patch": f.ai_code_patch,
        "status": f.status, "verification_status": f.verification_status,
        "fingerprint": f.fingerprint,
        "created_at": f.created_at.isoformat() if f.created_at else None,
    }


@router.get("/scan/{scan_id}")
async def get_findings(
    scan_id: str,
    category: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    q = db.query(Finding).filter(Finding.scan_id == scan_id)
    if category:
        if category in ("sast", "code"):
            q = q.filter(Finding.category.in_(["sast", "code"]))
        elif category in ("misconfiguration", "misconfig", "iac"):
            q = q.filter(Finding.category.in_(["misconfiguration", "iac"]))
        else:
            q = q.filter(Finding.category == category)
    if severity:
        q = q.filter(Finding.severity == severity.upper())
    if priority:
        q = q.filter(Finding.priority == priority.upper())
    if status:
        if status == "resolved":
            q = q.filter((Finding.status == "resolved") | (Finding.verification_status == "resolved"))
        elif status == "open":
            q = q.filter(
                (Finding.status != "resolved")
                & ((Finding.verification_status != "resolved") | (Finding.verification_status == None))
            )

    findings = q.order_by(Finding.risk_score.desc()).all()
    all_f = db.query(Finding).filter(Finding.scan_id == scan_id).all()

    by_sev, by_cat, by_pri = {}, {}, {}
    for f in all_f:
        s_key = f.severity or "UNKNOWN"
        c_key = f.category or "uncategorized"
        p_key = f.priority or "P4"
        by_sev[s_key] = by_sev.get(s_key, 0) + 1
        by_cat[c_key] = by_cat.get(c_key, 0) + 1
        by_pri[p_key] = by_pri.get(p_key, 0) + 1

    return {
        "findings": [_serialize(f) for f in findings],
        "total": len(all_f),
        "by_severity": by_sev,
        "by_category": by_cat,
        "by_priority": by_pri,
    }


@router.get("/{finding_id}")
async def get_finding(finding_id: str, db: Session = Depends(get_db)):
    f = db.query(Finding).filter(Finding.id == finding_id).first()
    if not f:
        raise HTTPException(404, "Finding not found")
    return _serialize(f)


@router.post("/{finding_id}/resolve")
async def resolve_finding(finding_id: str, db: Session = Depends(get_db)):
    f = db.query(Finding).filter(Finding.id == finding_id).first()
    if not f:
        raise HTTPException(404, "Finding not found")
    f.verification_status = "resolved"
    f.status = "resolved"
    db.commit()
    return {"success": True, "finding_id": finding_id, "verification_status": "resolved"}


