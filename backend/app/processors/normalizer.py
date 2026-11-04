import uuid
import hashlib
from typing import List, Dict
from datetime import datetime


def normalize_findings(scanner_results: dict, scan_id: str) -> List[Dict]:
    all_findings = []
    for scanner_name, result in scanner_results.items():
        if result.success and result.findings:
            for raw in result.findings:
                all_findings.append(_normalize_single(raw, scan_id, scanner_name))
    return all_findings


def _normalize_single(raw: dict, scan_id: str, scanner_name: str) -> dict:
    return {
        "id": str(uuid.uuid4()),
        "scan_id": scan_id,
        "scanner": scanner_name,
        "category": raw.get("category", "unknown"),
        "title": raw.get("title", "Unknown Finding"),
        "description": raw.get("description", ""),
        "severity": raw.get("severity", "MEDIUM"),
        "file_path": raw.get("file_path"),
        "line_number": raw.get("line_number"),
        "evidence": raw.get("evidence"),
        "evidence_redacted": False,
        "cve_id": raw.get("cve_id"),
        "cwe_id": raw.get("cwe_id"),
        "cvss_score": raw.get("cvss_score"),
        "fix_available": raw.get("fix_available", False),
        "fixed_version": raw.get("fixed_version"),
        "reference_urls": raw.get("reference_urls", []),
        "package_name": raw.get("package_name"),
        "package_version": raw.get("package_version"),
        "ecosystem": raw.get("ecosystem"),
        "fingerprint": raw.get("fingerprint") or _fingerprint(raw),
        "risk_score": 0.0,
        "priority": "P4",
        "risk_factors": {},
        "status": "open",
        "created_at": datetime.utcnow().isoformat(),
    }


def _fingerprint(raw: dict) -> str:
    key = f"{raw.get('scanner')}-{raw.get('category')}-{raw.get('title')}-{raw.get('file_path')}-{raw.get('line_number')}"
    return hashlib.md5(key.encode()).hexdigest()

