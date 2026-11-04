#!/bin/bash
# Backend startup script for development

cd backend
pip install -r requirements.txt

# Check scanners
echo "Checking scanners..."
gitleaks version 2>/dev/null && echo "✓ Gitleaks installed" || echo "✗ Gitleaks not found - install from https://github.com/gitleaks/gitleaks"
trivy --version 2>/dev/null | head -1 && echo "✓ Trivy installed" || echo "✗ Trivy not found - install from https://aquasecurity.github.io/trivy"
osv-scanner --version 2>/dev/null && echo "✓ OSV-Scanner installed" || echo "✗ OSV-Scanner not found - install from https://github.com/google/osv-scanner"

# Start server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
