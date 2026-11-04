import asyncio
import sys
import os

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.scanners.orchestrator import ScanOrchestrator
from app.processors.normalizer import normalize_findings
from app.processors.deduplicator import deduplicate_findings
from app.processors.enricher import enrich_finding
from app.processors.redactor import redact_finding
from app.risk.engine import prioritize_findings
from app.verification.comparator import compare_scans
from app.reporting.html_report import generate_html_report
from app.reporting.json_report import generate_json_report


async def run_pipeline_test():
    test_repo = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "test-vulnerable-repo"))
    print(f"Testing Scan Pipeline on: {test_repo}", flush=True)

    orchestrator = ScanOrchestrator()
    results = await orchestrator.run_all_scanners(test_repo)

    print("\n--- Scanner Results ---", flush=True)
    for name, r in results.items():
        print(f"Scanner {name}: success={r.success}, findings_count={len(r.findings)}", flush=True)

    scan_id = "test-scan-001"
    normalized = normalize_findings(results, scan_id)
    deduped = deduplicate_findings(normalized)
    enriched = [enrich_finding(f) for f in deduped]
    redacted = [redact_finding(f) for f in enriched]
    prioritized = prioritize_findings(redacted)

    print(f"\nTotal Processed Findings: {len(prioritized)}", flush=True)
    for f in prioritized[:10]:
        print(f"  [{f['priority']}] [{f['severity']}] {f['category'].upper()}: {f['title']} (Score: {f['risk_score']})", flush=True)

    # Test Reports
    scan_meta = {"id": scan_id, "project_name": "Test Vulnerable Repo"}
    json_rep = generate_json_report(scan_meta, prioritized)
    html_rep = generate_html_report(scan_meta, prioritized)

    assert len(json_rep["findings"]) == len(prioritized), "JSON report findings count mismatch"
    assert "RepoGuard" in html_rep, "HTML report missing header"

    print("\n--- Reports Verified ---", flush=True)
    print(f"JSON Report findings: {len(json_rep['findings'])}", flush=True)
    print(f"HTML Report size: {len(html_rep)} chars", flush=True)

    # Test Verification Comparator
    fixed_findings = [f for f in prioritized if f['category'] != 'secret']
    comparison = compare_scans(prioritized, fixed_findings)
    print(f"\n--- Verification Comparison ---", flush=True)
    print(f"Resolved: {comparison['summary']['resolved_count']}", flush=True)
    print(f"Unresolved: {comparison['summary']['unresolved_count']}", flush=True)
    print(f"Resolution Rate: {comparison['summary']['resolution_rate']}%", flush=True)

    print("\n>>> ALL PIPELINE TESTS PASSED SUCCESSFULLY! <<<", flush=True)


if __name__ == "__main__":
    asyncio.run(run_pipeline_test())
