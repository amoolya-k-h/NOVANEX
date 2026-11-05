import os
import uuid
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, BackgroundTasks
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.scan import Scan, ScanStatus
from app.models.finding import Finding
from app.api.routes.scan import run_scan_pipeline, scan_progress
from app.verification.comparator import compare_scans
from app.api.routes.findings import _serialize
from app.core.config import settings

router = APIRouter(prefix="/api/verify", tags=["verification"])


@router.post("/{original_scan_id}")
async def start_verification(
    original_scan_id: str,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    orig = db.query(Scan).filter(Scan.id == original_scan_id).first()
    if not orig:
        raise HTTPException(404, "Original scan not found")

    if not (file.filename or "").endswith(".zip"):
        raise HTTPException(400, "Only ZIP files are supported for verification")

    content = await file.read()
    scan_id = str(uuid.uuid4())
    zip_path = os.path.join(settings.UPLOAD_DIR, f"{scan_id}.zip")
    with open(zip_path, "wb") as f:
        f.write(content)

    scan = Scan(
        id=scan_id,
        project_name=f"{orig.project_name} (Verification)",
        project_description=orig.project_description,
        status=ScanStatus.PENDING,
        scan_type="verification",
        parent_scan_id=original_scan_id,
    )
    db.add(scan)
    db.commit()

    scan_progress[scan_id] = {
        "status": "pending",
        "progress": 0,
        "current_step": "Starting verification scan...",
        "gitleaks_done": False,
        "trivy_done": False,
        "osv_done": False,
        "semgrep_done": False,
        "findings_count": 0,
    }

    background_tasks.add_task(run_scan_pipeline, scan_id, zip_path)
    return {"verification_scan_id": scan_id, "original_scan_id": original_scan_id}


@router.get("/{original_scan_id}/compare/{verification_scan_id}")
async def compare(original_scan_id: str, verification_scan_id: str, db: Session = Depends(get_db)):
    orig_scan = db.query(Scan).filter(Scan.id == original_scan_id).first()
    verif_scan = db.query(Scan).filter(Scan.id == verification_scan_id).first()
    if not orig_scan:
        raise HTTPException(404, "Original baseline scan not found")
    if not verif_scan:
        raise HTTPException(404, "Verification scan not found")

    orig_models = db.query(Finding).filter(Finding.scan_id == original_scan_id).all()
    new_models = db.query(Finding).filter(Finding.scan_id == verification_scan_id).all()

    result = compare_scans([_serialize(f) for f in orig_models], [_serialize(f) for f in new_models])

    # Synchronize verification status to database for original findings
    resolved_fps = {f["fingerprint"] for f in result.get("resolved", []) if f.get("fingerprint")}
    if resolved_fps:
        for fm in orig_models:
            if fm.fingerprint in resolved_fps:
                fm.verification_status = "resolved"
                fm.status = "resolved"
        db.commit()

    return result

