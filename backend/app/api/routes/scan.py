import os
import uuid
import asyncio
import shutil
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends, BackgroundTasks
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.core.database import get_db, SessionLocal
from app.core.config import settings
from app.models.scan import Scan, ScanStatus
from app.models.finding import Finding
from app.scanners.orchestrator import ScanOrchestrator
from app.processors.normalizer import normalize_findings
from app.processors.deduplicator import deduplicate_findings
from app.processors.redactor import redact_finding
from app.processors.enricher import enrich_finding
from app.risk.engine import prioritize_findings
from datetime import datetime
from typing import List
import logging
import json

router = APIRouter(prefix="/api/scans", tags=["scans"])
logger = logging.getLogger(__name__)

# In-memory progress tracker
scan_progress: dict = {}


@router.post("/upload")
async def upload_and_scan(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    project_name: str = Form(...),
    project_description: str = Form(None),
    db: Session = Depends(get_db),
):
    if not (file.filename or "").endswith(".zip"):
        raise HTTPException(400, "Only ZIP files are supported")

    content = await file.read()
    max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    if len(content) > max_bytes:
        raise HTTPException(413, f"File exceeds {settings.MAX_UPLOAD_SIZE_MB}MB limit")

    scan_id = str(uuid.uuid4())
    zip_path = os.path.join(settings.UPLOAD_DIR, f"{scan_id}.zip")
    with open(zip_path, "wb") as f:
        f.write(content)

    scan = Scan(
        id=scan_id,
        project_name=project_name,
        project_description=project_description,
        status=ScanStatus.PENDING,
        scan_type="initial",
    )
    db.add(scan)
    db.commit()
    db.refresh(scan)

    scan_progress[scan_id] = {
        "status": "pending",
        "progress": 0,
        "current_step": "Initializing...",
        "gitleaks_done": False,
        "trivy_done": False,
        "osv_done": False,
        "semgrep_done": False,
        "findings_count": 0,
    }

    background_tasks.add_task(run_scan_pipeline, scan_id, zip_path, db)

    return {
        "id": scan.id,
        "project_name": scan.project_name,
        "status": scan.status,
        "created_at": scan.created_at.isoformat(),
        "total_findings": 0,
        "critical_count": 0,
        "high_count": 0,
        "medium_count": 0,
        "low_count": 0,
        "scan_type": scan.scan_type,
        "parent_scan_id": scan.parent_scan_id,
        "error_message": None,
        "completed_at": None,
    }


@router.get("/")
async def list_scans(db: Session = Depends(get_db)):
    scans = db.query(Scan).order_by(Scan.created_at.desc()).limit(50).all()
    return [_serialize_scan(s) for s in scans]


@router.get("/overview/metrics")
async def get_overview_metrics(db: Session = Depends(get_db)):
    scans = db.query(Scan).order_by(Scan.created_at.desc()).all()
    findings = db.query(Finding).all()

    total_scans = len(scans)
    has_scans = total_scans > 0

    if not has_scans:
        return {
            "has_scans": False,
            "total_scans": 0,
            "repositories_count": 0,
            "open_findings": 0,
            "total_vulnerabilities": 0,
            "critical_issues": 0,
            "high_issues": 0,
            "medium_issues": 0,
            "low_issues": 0,
            "verified_fixes": 0,
            "unresolved_vulnerabilities": 0,
            "security_posture": 100,
            "security_posture_status": "No scans yet",
            "score_calculation": "Score = max(0, 100 - (15×Critical + 8×High + 3×Medium + 1×Low) + 3×Resolved)",
            "by_severity": {"critical": 0, "high": 0, "medium": 0, "low": 0},
            "by_category": {"Secrets": 0, "Dependencies": 0, "Insecure Code": 0, "Misconfigurations": 0},
            "posture_trend": [],
            "repositories": [],
            "priority_findings": [],
        }

    repos_set = set(s.project_name for s in scans if s.project_name)
    repos_count = len(repos_set)

    open_findings = sum(1 for f in findings if (f.verification_status or "unresolved") != "resolved")
    verified_fixes = sum(1 for f in findings if (f.verification_status or "") == "resolved" or f.status == "resolved")

    critical_count = sum(1 for f in findings if (f.severity or "").upper() == "CRITICAL" and (f.verification_status or "") != "resolved")
    high_count = sum(1 for f in findings if (f.severity or "").upper() == "HIGH" and (f.verification_status or "") != "resolved")
    medium_count = sum(1 for f in findings if (f.severity or "").upper() == "MEDIUM" and (f.verification_status or "") != "resolved")
    low_count = sum(1 for f in findings if (f.severity or "").upper() == "LOW" and (f.verification_status or "") != "resolved")

    # Documented transparent security posture score calculation:
    # Baseline: 100 points
    # Penalties: Critical: -15, High: -8, Medium: -3, Low: -1
    # Rewards: Verified remediation bonus: +3 per verified fix (up to +15)
    deductions = (critical_count * 15) + (high_count * 8) + (medium_count * 3) + (low_count * 1)
    bonus = min(15, verified_fixes * 3)
    posture_score = max(0, min(100, 100 - deductions + bonus))

    if posture_score >= 85:
        posture_status = "Good"
    elif posture_score >= 60:
        posture_status = "Needs attention"
    else:
        posture_status = "At risk"

    # Category distribution
    cat_counts = {
        "Secrets": sum(1 for f in findings if (f.category or "").lower() == "secret"),
        "Dependencies": sum(1 for f in findings if (f.category or "").lower() == "dependency"),
        "Insecure Code": sum(1 for f in findings if (f.category or "").lower() in ("sast", "code")),
        "Misconfigurations": sum(1 for f in findings if (f.category or "").lower() in ("misconfiguration", "iac")),
    }

    # Trend from chronological scans
    trend = []
    chronological_scans = list(reversed(scans))
    for i, s in enumerate(chronological_scans):
        label = s.project_name if len(chronological_scans) <= 3 else f"Scan {i+1}"
        trend.append({
            "name": label,
            "findings": s.total_findings or 0,
            "critical": s.critical_count or 0,
            "scan_id": s.id,
        })

    # Repositories list from real scans
    repositories_list = []
    repo_scans: dict = {}
    for s in scans:
        if s.project_name not in repo_scans:
            repo_scans[s.project_name] = s

    for name, s in repo_scans.items():
        total = s.total_findings or 0
        crit = s.critical_count or 0
        high = s.high_count or 0
        med = s.medium_count or 0
        repositories_list.append({
            "id": s.id,
            "name": name,
            "lang": "Polyglot",
            "branch": "main",
            "status": "At risk" if crit > 0 else ("Needs attention" if high > 0 else "Good"),
            "status_type": "critical" if crit > 0 else ("high" if high > 0 else "good"),
            "findings": total,
            "bar": {
                "crit": f"{int((crit / max(1, total)) * 100)}%",
                "high": f"{int((high / max(1, total)) * 100)}%",
                "med": f"{int((med / max(1, total)) * 100)}%",
            },
            "last_scan": s.created_at.strftime("%b %d, %H:%M") if s.created_at else "Recent",
        })

    # Top priority findings
    priority_findings = []
    top_findings = db.query(Finding).order_by(Finding.risk_score.desc()).limit(5).all()
    for f in top_findings:
        priority_findings.append({
            "id": f.id,
            "title": f.title,
            "category": f.category,
            "severity": f.severity,
            "file_path": f.file_path,
            "scanner": f.scanner,
            "cve_id": f.cve_id,
            "description": f.description,
            "fixed_version": f.fixed_version,
            "package_name": f.package_name,
            "package_version": f.package_version,
            "verification_status": f.verification_status,
        })

    return {
        "has_scans": True,
        "total_scans": total_scans,
        "repositories_count": repos_count,
        "open_findings": open_findings,
        "total_vulnerabilities": len(findings),
        "critical_issues": critical_count,
        "high_issues": high_count,
        "medium_issues": medium_count,
        "low_issues": low_count,
        "verified_fixes": verified_fixes,
        "unresolved_vulnerabilities": open_findings,
        "security_posture": posture_score,
        "security_posture_status": posture_status,
        "score_calculation": "Score = max(0, 100 - (15×Critical + 8×High + 3×Medium + 1×Low) + 3×Resolved)",
        "by_severity": {
            "critical": critical_count,
            "high": high_count,
            "medium": medium_count,
            "low": low_count,
        },
        "by_category": cat_counts,
        "posture_trend": trend,
        "repositories": repositories_list,
        "priority_findings": priority_findings,
    }




@router.get("/{scan_id}")
async def get_scan(scan_id: str, db: Session = Depends(get_db)):
    scan = db.query(Scan).filter(Scan.id == scan_id).first()
    if not scan:
        raise HTTPException(404, "Scan not found")
    return _serialize_scan(scan)


@router.get("/{scan_id}/progress")
async def get_progress(scan_id: str):
    async def event_generator():
        while True:
            progress = scan_progress.get(scan_id)

            # Check database for definitive state if progress is pending, missing, or to verify completion
            if not progress or progress.get("status") in ("pending", None):
                try:
                    with SessionLocal() as db:
                        scan = db.query(Scan).filter(Scan.id == scan_id).first()
                        if scan:
                            if scan.status == ScanStatus.COMPLETED or str(scan.status).lower().endswith("completed"):
                                progress = {
                                    "status": "completed",
                                    "progress": 100,
                                    "current_step": "Scan complete!",
                                    "gitleaks_done": True,
                                    "trivy_done": True,
                                    "osv_done": True,
                                    "semgrep_done": True,
                                    "findings_count": scan.total_findings or 0,
                                }
                                scan_progress[scan_id] = progress
                            elif scan.status == ScanStatus.FAILED or str(scan.status).lower().endswith("failed"):
                                progress = {
                                    "status": "failed",
                                    "progress": 0,
                                    "current_step": f"Scan failed: {scan.error_message or 'Unknown error'}",
                                    "error": scan.error_message or "Unknown error",
                                    "gitleaks_done": False,
                                    "trivy_done": False,
                                    "osv_done": False,
                                    "semgrep_done": False,
                                    "findings_count": 0,
                                }
                                scan_progress[scan_id] = progress
                except Exception as e:
                    logger.warning(f"Error checking DB in get_progress: {e}")

            if not progress:
                progress = {
                    "status": "pending",
                    "progress": 10,
                    "current_step": "Initializing scanners...",
                    "gitleaks_done": False,
                    "trivy_done": False,
                    "osv_done": False,
                    "semgrep_done": False,
                    "findings_count": 0,
                }

            yield f"data: {json.dumps(progress)}\n\n"
            if progress.get("status") in ("completed", "failed"):
                break
            await asyncio.sleep(0.5)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no", "Connection": "keep-alive"},
    )


def _serialize_scan(s: Scan) -> dict:
    return {
        "id": s.id,
        "project_name": s.project_name,
        "project_description": s.project_description,
        "status": s.status,
        "created_at": s.created_at.isoformat() if s.created_at else None,
        "completed_at": s.completed_at.isoformat() if s.completed_at else None,
        "total_findings": s.total_findings,
        "critical_count": s.critical_count,
        "high_count": s.high_count,
        "medium_count": s.medium_count,
        "low_count": s.low_count,
        "scan_type": s.scan_type,
        "parent_scan_id": s.parent_scan_id,
        "error_message": s.error_message,
        "scanner_errors": s.scanner_errors,
    }


async def run_scan_pipeline(scan_id: str, zip_path: str, db: Session = None):
    local_db = SessionLocal()
    orchestrator = ScanOrchestrator()
    project_path = None

    def upd(status, step, progress, **kw):
        if scan_id not in scan_progress:
            scan_progress[scan_id] = {}
        scan_progress[scan_id].update({"status": status, "current_step": step, "progress": progress, **kw})

    try:
        scan = local_db.query(Scan).filter(Scan.id == scan_id).first()
        if not scan:
            logger.error(f"Scan {scan_id} not found in DB")
            upd("failed", "Scan not found", 0, error="Scan not found")
            return

        scan.status = ScanStatus.SCANNING
        local_db.commit()

        upd("scanning", "Extracting project files...", 10)
        project_path = await orchestrator.extract_project(zip_path)

        upd("scanning", "Running security scanners in parallel...", 20)
        scanner_results = await orchestrator.run_all_scanners(project_path)

        scan_progress[scan_id]["gitleaks_done"] = getattr(scanner_results.get("gitleaks"), "success", False)
        scan_progress[scan_id]["trivy_done"] = getattr(scanner_results.get("trivy"), "success", False)
        scan_progress[scan_id]["osv_done"] = getattr(scanner_results.get("osv"), "success", False)
        scan_progress[scan_id]["semgrep_done"] = getattr(scanner_results.get("semgrep"), "success", False)

        upd("processing", "Normalizing and processing findings...", 60)

        normalized = normalize_findings(scanner_results, scan_id)
        unique = deduplicate_findings(normalized)
        enriched = [enrich_finding(f) for f in unique]
        redacted = [redact_finding(f) for f in enriched]
        prioritized = prioritize_findings(redacted)

        upd("processing", "Saving findings to database...", 80, findings_count=len(prioritized))

        for fd in prioritized:
            finding = Finding(
                id=fd["id"], scan_id=scan_id,
                category=fd["category"], scanner=fd["scanner"],
                title=fd["title"], description=fd.get("description"),
                severity=fd["severity"],
                file_path=fd.get("file_path"), line_number=fd.get("line_number"),
                evidence=fd.get("evidence"), evidence_redacted=fd.get("evidence_redacted", False),
                risk_score=fd.get("risk_score", 0), priority=fd.get("priority", "P4"),
                risk_factors=fd.get("risk_factors"),
                cve_id=fd.get("cve_id"), cwe_id=fd.get("cwe_id"),
                cvss_score=fd.get("cvss_score"),
                fix_available=fd.get("fix_available", False),
                fixed_version=fd.get("fixed_version"),
                reference_urls=fd.get("reference_urls"),
                package_name=fd.get("package_name"),
                package_version=fd.get("package_version"),
                ecosystem=fd.get("ecosystem"),
                fingerprint=fd.get("fingerprint"),
                status="open",
            )
            local_db.add(finding)

        by_sev: dict = {}
        for fd in prioritized:
            s = fd.get("severity", "LOW")
            by_sev[s] = by_sev.get(s, 0) + 1

        scan.status = ScanStatus.COMPLETED
        scan.completed_at = datetime.utcnow()
        scan.total_findings = len(prioritized)
        scan.critical_count = by_sev.get("CRITICAL", 0)
        scan.high_count = by_sev.get("HIGH", 0)
        scan.medium_count = by_sev.get("MEDIUM", 0)
        scan.low_count = by_sev.get("LOW", 0)

        errs = {n: r.error for n, r in scanner_results.items() if getattr(r, "error", None)}
        if errs:
            scan.scanner_errors = errs

        local_db.commit()
        upd("completed", "Scan complete!", 100, findings_count=len(prioritized))

        try:
            os.remove(zip_path)
        except Exception:
            pass

    except Exception as e:
        logger.error(f"Scan failed {scan_id}: {e}", exc_info=True)
        try:
            scan = local_db.query(Scan).filter(Scan.id == scan_id).first()
            if scan:
                scan.status = ScanStatus.FAILED
                scan.error_message = str(e)
                local_db.commit()
        except Exception:
            pass
        upd("failed", f"Scan failed: {e}", 0, error=str(e))
    finally:
        try:
            local_db.close()
        except Exception:
            pass
        if project_path and os.path.exists(project_path):
            orchestrator.cleanup_project(project_path)

