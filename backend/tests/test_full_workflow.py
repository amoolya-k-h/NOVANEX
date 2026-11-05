import sys
import os
import io
import time
import asyncio

if sys.platform == "win32":
    import codecs
    sys.stdout = codecs.getwriter("utf-8")(sys.stdout.buffer, "replace")
    sys.stderr = codecs.getwriter("utf-8")(sys.stderr.buffer, "replace")

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from starlette.testclient import TestClient
from app.main import app
from app.core.database import SessionLocal
from app.models.scan import Scan, ScanStatus
from app.models.finding import Finding
from app.api.routes.scan import run_scan_pipeline

client = TestClient(app)

def run_tests():
    print("=" * 70)
    print("🛡️ REPO GUARD AI — END-TO-END VERIFICATION SUITE")
    print("=" * 70)

    # 1. Health check
    res = client.get("/api/health")
    assert res.status_code == 200
    print(f"[✓] Step 1: Health check passed -> {res.json()['status']}")

    # 2. Upload vulnerable project
    vuln_zip = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "test-vulnerable-repo.zip"))
    assert os.path.exists(vuln_zip), f"Missing {vuln_zip}"
    with open(vuln_zip, "rb") as f:
        bytes_data = f.read()

    files = {"file": ("test-vulnerable-repo.zip", io.BytesIO(bytes_data), "application/zip")}
    data = {"project_name": "Demo Vulnerable App", "project_description": "Live Hackathon Demonstration Repo"}
    res = client.post("/api/scans/upload", files=files, data=data)
    assert res.status_code == 200, f"Upload failed: {res.text}"
    scan_id = res.json()["id"]
    print(f"[✓] Step 2: Uploaded ZIP -> Created Scan ID: {scan_id}")

    # Synchronously execute pipeline for deterministic test verification
    db = SessionLocal()
    try:
        temp_zip = os.path.join("uploads", f"{scan_id}.zip")
        with open(temp_zip, "wb") as f:
            f.write(bytes_data)
        asyncio.run(run_scan_pipeline(scan_id, temp_zip, db))
    finally:
        db.close()

    # 3. Verify scan findings
    res = client.get(f"/api/findings/scan/{scan_id}")
    assert res.status_code == 200
    findings_data = res.json()
    total_findings = findings_data["total"]
    findings_list = findings_data["findings"]
    print(f"[✓] Step 3: Scan completed -> Detected {total_findings} findings across scanners")
    print(f"    Severities: {findings_data.get('by_severity')}")
    print(f"    Categories: {findings_data.get('by_category')}")
    assert total_findings > 25, f"Expected > 25 findings, got {total_findings}"

    # Pick an exposed secret finding and an insecure code finding
    secret_finding = next((f for f in findings_list if f["category"] == "secret"), findings_list[0])
    sast_finding = next((f for f in findings_list if f["category"] == "sast"), None)

    # 4. Test AI Explanation
    res = client.get(f"/api/ai/explain/{secret_finding['id']}")
    assert res.status_code == 200
    expl = res.json().get("explanation", "")
    assert len(expl) > 50
    print(f"[✓] Step 4: AI Explanation generated for '{secret_finding['title']}':")
    print(f"    Sample: {expl[:120].strip()}...")

    # 5. Test AI Diff / Remediation Patch Generation
    res = client.get(f"/api/ai/diff/{secret_finding['id']}")
    assert res.status_code == 200
    diff_data = res.json()
    assert "patch" in diff_data and len(diff_data["lines"]) > 0
    print(f"[✓] Step 5: AI Remediation patch generated -> {diff_data['summary']}")

    if sast_finding:
        res_sast = client.get(f"/api/ai/diff/{sast_finding['id']}")
        assert res_sast.status_code == 200
        print(f"[✓] Step 5b: SAST Remediation patch generated -> {res_sast.json()['summary']}")

    # 6. Test Apply Fix Endpoint with Developer Approval
    res = client.post("/api/ai/apply-fix", json={"finding_id": secret_finding["id"], "approved": True})
    assert res.status_code == 200
    assert res.json()["success"] is True
    print(f"[✓] Step 6: Fix applied with developer approval -> Status: {res.json()['status']}")

    # 7. Test Verification Rescan with Fixed Project
    fixed_zip = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "test-vulnerable-repo-fixed.zip"))
    assert os.path.exists(fixed_zip), f"Missing {fixed_zip}"
    with open(fixed_zip, "rb") as f:
        fixed_bytes = f.read()

    files = {"file": ("test-vulnerable-repo-fixed.zip", io.BytesIO(fixed_bytes), "application/zip")}
    res = client.post(f"/api/verify/{scan_id}", files=files)
    assert res.status_code == 200
    verif_scan_id = res.json()["verification_scan_id"]
    print(f"[✓] Step 7: Triggered verification scan -> ID: {verif_scan_id}")

    # Synchronously run verification pipeline
    db2 = SessionLocal()
    try:
        temp_verif_zip = os.path.join("uploads", f"{verif_scan_id}.zip")
        with open(temp_verif_zip, "wb") as f:
            f.write(fixed_bytes)
        asyncio.run(run_scan_pipeline(verif_scan_id, temp_verif_zip, db2))
    finally:
        db2.close()

    # 8. Compare original vs. verification scan
    res = client.get(f"/api/verify/{scan_id}/compare/{verif_scan_id}")
    assert res.status_code == 200
    comp = res.json()
    summary = comp["summary"]
    resolved_count = summary["resolved_count"]
    unresolved_count = summary["unresolved_count"]
    new_count = summary["new_count"]
    rate = summary["resolution_rate"]
    print(f"[✓] Step 8: Verification Comparison Completed:")
    print(f"    • Resolved Findings: {resolved_count}")
    print(f"    • Remaining Findings: {unresolved_count}")
    print(f"    • Newly Introduced: {new_count}")
    print(f"    • Resolution Rate: {rate}%")
    assert resolved_count > 25, f"Expected > 25 resolved issues, got {resolved_count}"

    # 9. Test Report Generation (HTML and JSON)
    res_html = client.get(f"/api/reports/{scan_id}/html")
    assert res_html.status_code == 200
    assert "RepoGuard AI" in res_html.text
    print(f"[✓] Step 9: HTML Report generated ({len(res_html.text)} bytes)")

    res_json = client.get(f"/api/reports/{scan_id}/json")
    assert res_json.status_code == 200
    print(f"[✓] Step 10: JSON Report export generated ({len(res_json.text)} bytes)")

    # 10. Test Overview Metrics
    res_metrics = client.get("/api/scans/overview/metrics")
    assert res_metrics.status_code == 200
    metrics = res_metrics.json()
    print(f"[✓] Step 11: Real Dashboard Metrics verified:")
    print(f"    • Total Scans: {metrics['total_scans']}")
    print(f"    • Total Vulnerabilities: {metrics['total_vulnerabilities']}")
    print(f"    • Security Posture Score: {metrics['security_posture']}/100 ({metrics['security_posture_status']})")
    print(f"    • Calculation Model: {metrics['score_calculation']}")

    print("=" * 70)
    print("🏆 ALL 11 END-TO-END VERIFICATION STEPS PASSED WITH 100% SUCCESS!")
    print("=" * 70)

if __name__ == "__main__":
    run_tests()
