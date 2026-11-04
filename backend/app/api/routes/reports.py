import os
import uuid
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse, JSONResponse
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.scan import Scan
from app.models.finding import Finding
from app.reporting.json_report import generate_json_report
from app.reporting.html_report import generate_html_report
from app.api.routes.findings import _serialize
from app.core.config import settings

router = APIRouter(prefix="/api/reports", tags=["reports"])


@router.get("/{scan_id}/json")
async def download_json(scan_id: str, db: Session = Depends(get_db)):
    scan = db.query(Scan).filter(Scan.id == scan_id).first()
    if not scan:
        raise HTTPException(404, "Scan not found")

    findings = db.query(Finding).filter(Finding.scan_id == scan_id).all()
    scan_dict = {
        "id": scan.id,
        "project_name": scan.project_name,
        "project_description": scan.project_description,
        "created_at": scan.created_at.isoformat() if scan.created_at else None,
    }
    report = generate_json_report(scan_dict, [_serialize(f) for f in findings])
    name = scan.project_name.replace(" ", "-")
    return JSONResponse(content=report, headers={
        "Content-Disposition": f"attachment; filename=repoguard-{name}-{scan_id[:8]}.json"
    })


@router.get("/{scan_id}/html")
async def download_html(scan_id: str, db: Session = Depends(get_db)):
    scan = db.query(Scan).filter(Scan.id == scan_id).first()
    if not scan:
        raise HTTPException(404, "Scan not found")

    findings = db.query(Finding).filter(Finding.scan_id == scan_id).all()
    scan_dict = {"id": scan.id, "project_name": scan.project_name, "project_description": scan.project_description}
    html = generate_html_report(scan_dict, [_serialize(f) for f in findings])

    report_dir = os.path.join(settings.UPLOAD_DIR, "reports")
    os.makedirs(report_dir, exist_ok=True)
    name = scan.project_name.replace(" ", "-")
    filename = f"repoguard-{name}-{scan_id[:8]}.html"
    filepath = os.path.join(report_dir, filename)

    with open(filepath, "w", encoding="utf-8") as fp:
        fp.write(html)

    return FileResponse(filepath, media_type="text/html", filename=filename)

