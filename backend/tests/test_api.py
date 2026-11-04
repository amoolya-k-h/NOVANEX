import sys
import os
import io

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from starlette.testclient import TestClient
from app.main import app

client = TestClient(app)

print("Starting API endpoint verification...", flush=True)

# 1. Health check
res = client.get("/api/health")
assert res.status_code == 200, f"Health check failed: {res.status_code}"
print(f"[OK] GET /api/health -> {res.json()}", flush=True)

# 2. List scans
res = client.get("/api/scans/")
assert res.status_code == 200, f"List scans failed: {res.status_code}"
print(f"[OK] GET /api/scans/ -> Found {len(res.json())} existing scans", flush=True)

# 3. Upload & scan test repository
zip_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "test-vulnerable-repo.zip"))
with open(zip_path, "rb") as f:
    zip_bytes = f.read()

files = {"file": ("test-vulnerable-repo.zip", io.BytesIO(zip_bytes), "application/zip")}
data = {"project_name": "Test Vulnerable Repo", "project_description": "Automated API Test Scan"}

res = client.post("/api/scans/upload", files=files, data=data)
assert res.status_code == 200, f"Upload scan failed: {res.status_code} - {res.text}"
scan_data = res.json()
scan_id = scan_data["id"]
print(f"[OK] POST /api/scans/upload -> Created Scan ID: {scan_id}", flush=True)

# 4. Check scan details
res = client.get(f"/api/scans/{scan_id}")
assert res.status_code == 200, f"Get scan failed: {res.status_code}"
print(f"[OK] GET /api/scans/{scan_id} -> Status: {res.json()['status']}", flush=True)

print("\n>>> ALL API ROUTE TESTS VERIFIED SUCCESSFULLY! <<<", flush=True)

