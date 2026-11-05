import sys
import os
import io
import asyncio

if sys.platform == "win32":
    import codecs
    sys.stdout = codecs.getwriter("utf-8")(sys.stdout.buffer, "replace")
    sys.stderr = codecs.getwriter("utf-8")(sys.stderr.buffer, "replace")

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from starlette.testclient import TestClient
from app.main import app
from app.core.database import SessionLocal
from app.models.scan import Scan
from app.models.finding import Finding
from app.scanners.manifest_parser import (
    parse_package_json,
    parse_requirements_txt,
    parse_package_lock_json,
    discover_all_dependencies,
)
from app.scanners.osv_scanner import OSVScanner
from app.scanners.trivy import TrivyScanner

client = TestClient(app)


def test_manifest_parsers():
    print("Testing manifest parsers...")

    # 1. Test package.json parsing
    pkg_json = """
    {
      "name": "sample-node-app",
      "dependencies": {
        "lodash": "^4.17.15",
        "axios": "~0.21.1",
        "express": ">=4.16.0",
        "jsonwebtoken": "8.5.1"
      },
      "devDependencies": {
        "minimist": "^1.2.0"
      }
    }
    """
    node_deps = parse_package_json(pkg_json, "frontend/package.json")
    assert len(node_deps) == 5, f"Expected 5 deps, got {len(node_deps)}"
    lodash = next(d for d in node_deps if d.name == "lodash")
    assert lodash.clean_version == "4.17.15", f"Expected 4.17.15, got {lodash.clean_version}"
    print(f"  [✓] package.json parsed: {len(node_deps)} dependencies correctly sanitized (e.g. ^4.17.15 -> {lodash.clean_version})")

    # 2. Test requirements.txt parsing with comments & operators
    reqs_txt = """
    # Security test requirements
    django==2.0.0
    flask>=0.12.0 ; python_version > '3.7'
    requests~=2.18.0 # comment
    pyyaml<=3.12
    --index-url https://pypi.org/simple
    unpinned-package
    """
    py_deps = parse_requirements_txt(reqs_txt, "backend/requirements.txt")
    assert len(py_deps) >= 4, f"Expected >= 4 deps, got {len(py_deps)}"
    django = next(d for d in py_deps if d.name == "django")
    assert django.clean_version == "2.0.0"
    print(f"  [✓] requirements.txt parsed: {len(py_deps)} dependencies correctly extracted with operators and comments stripped")


def test_osv_and_trivy_engines():
    print("Testing OSV-Scanner and Trivy engines...")
    repo_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "test-vulnerable-repo"))

    osv = OSVScanner()
    res = asyncio.run(osv.scan(repo_dir))
    assert res.success is True
    assert len(res.findings) > 0
    print(f"  [✓] OSV-Scanner found {len(res.findings)} dependency vulnerabilities in test repo")

    trivy = TrivyScanner()
    t_res = asyncio.run(trivy.scan(repo_dir))
    assert t_res.success is True
    assert len(t_res.findings) > 0
    print(f"  [✓] Trivy found {len(t_res.findings)} issues (vulns + misconfigs) in test repo")


def test_github_integration_endpoint():
    print("Testing GitHub Integration API...")
    # Find a finding in DB
    db = SessionLocal()
    try:
        f = db.query(Finding).first()
        assert f is not None, "No findings in database for testing"
        finding_id = f.id

        payload = {
            "repo_url_or_name": "acme-corp/sec-sample-repo",
            "finding_id": finding_id,
            "dry_run": True,
        }
        res = client.post("/api/github/create-pr", json=payload)
        assert res.status_code == 200, f"Error: {res.text}"
        data = res.json()
        assert data["success"] is True
        assert "pull" in data["pr_url"]
        assert "repoguard" in data["branch"]
        print(f"  [✓] GitHub PR simulation endpoint works: created {data['pr_url']} on branch {data['branch']}")
    finally:
        db.close()


if __name__ == "__main__":
    test_manifest_parsers()
    test_osv_and_trivy_engines()
    test_github_integration_endpoint()
    print("=" * 70)
    print("🏆 ALL NEW FEATURE TESTS PASSED SUCCESSFULLY!")
    print("=" * 70)
