import json
import os
import re
from pathlib import Path
from .base import BaseScanner, ScannerResult
from app.core.config import settings

# Native secret detection regex rules (matching Gitleaks rule specs)
SECRET_RULES = [
    {
        "id": "aws-access-key",
        "description": "Identified AWS Access Key ID, which can grant unauthorized AWS API access.",
        "regex": re.compile(r'(?:A3T[A-Z0-9]|AKIA|AGPA|AIDA|AROA|AIPA|ANPA|ANVA|ASIA)[A-Z0-9]{16}'),
        "severity": "CRITICAL"
    },
    {
        "id": "aws-secret-key",
        "description": "Identified AWS Secret Access Key, granting full IAM account control.",
        "regex": re.compile(r'(?i)aws_secret_access_key\s*=\s*([a-zA-Z0-9/+=]{40})'),
        "severity": "CRITICAL"
    },
    {
        "id": "github-pat",
        "description": "GitHub Personal Access Token detected.",
        "regex": re.compile(r'ghp_[0-9a-zA-Z]{36}|github_pat_[0-9a-zA-Z_]{82}'),
        "severity": "CRITICAL"
    },
    {
        "id": "stripe-api-key",
        "description": "Stripe live Secret Key exposed, allowing payment manipulation.",
        "regex": re.compile(r'sk_live_[0-9a-zA-Z]{24,}'),
        "severity": "CRITICAL"
    },
    {
        "id": "sendgrid-api-key",
        "description": "SendGrid API Key exposed.",
        "regex": re.compile(r'SG\.[a-zA-Z0-9_\-\.]{22,}\.[a-zA-Z0-9_\-\.]{43,}'),
        "severity": "HIGH"
    },
    {
        "id": "slack-webhook",
        "description": "Slack incoming webhook URL exposed.",
        "regex": re.compile(r'https://hooks\.slack\.com/services/T[a-zA-Z0-9_]+/B[a-zA-Z0-9_]+/[a-zA-Z0-9_]+'),
        "severity": "HIGH"
    },
    {
        "id": "database-password-url",
        "description": "Database connection string with embedded password.",
        "regex": re.compile(r'(?:postgres|postgresql|mysql|mongodb)://[^:]+:([^@]+)@'),
        "severity": "CRITICAL"
    },
    {
        "id": "hardcoded-database-password",
        "description": "Hardcoded database or service password.",
        "regex": re.compile(r'(?i)(?:password|passwd|db_pass|database_password)\s*[:=]\s*["\']([^"\']{6,})["\']'),
        "severity": "HIGH"
    },
    {
        "id": "private-key",
        "description": "Asymmetric private cryptographic key exposed.",
        "regex": re.compile(r'-----BEGIN (?:RSA|OPENSSH|DSA|EC|PGP) PRIVATE KEY-----'),
        "severity": "CRITICAL"
    },
    {
        "id": "generic-api-key",
        "description": "Generic hardcoded API secret key or admin token.",
        "regex": re.compile(r'(?i)(?:admin_token|payment_api_key|secret_key|jwt_secret)\s*[:=]\s*["\']([a-zA-Z0-9_\-]{16,})["\']'),
        "severity": "HIGH"
    }
]

IGNORE_DIRS = {".git", "node_modules", "venv", ".venv", "__pycache__", "dist", "build", ".next"}


class GitleaksScanner(BaseScanner):
    @property
    def binary_name(self) -> str:
        return "gitleaks"

    async def scan(self, project_path: str) -> ScannerResult:
        output_file = os.path.join(project_path, ".gitleaks_report.json")

        cmd = [
            settings.GITLEAKS_PATH,
            "detect",
            "--source", project_path,
            "--report-format", "json",
            "--report-path", output_file,
            "--no-git",
            "--exit-code", "0",
            "-v",
        ]

        stdout, stderr, returncode = await self.run_command(cmd)

        if returncode != -1:
            try:
                if os.path.exists(output_file):
                    with open(output_file, "r", encoding="utf-8", errors="replace") as f:
                        content = f.read().strip()
                        if content and content != "null":
                            raw_output = json.loads(content)
                            if isinstance(raw_output, list):
                                findings = self._normalize(raw_output)
                                try:
                                    os.remove(output_file)
                                except Exception:
                                    pass
                                return ScannerResult("gitleaks", True, findings, raw_output=raw_output)
            except Exception:
                pass

        # Native high-precision fallback secret scanning
        findings = self._native_scan(project_path)
        return ScannerResult("gitleaks", True, findings, raw_output={"engine": "native_gitleaks_rules", "count": len(findings)})

    def _native_scan(self, project_path: str) -> list:
        findings = []
        for root, dirs, files in os.walk(project_path):
            dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]
            for file_name in files:
                if file_name.endswith((".zip", ".tar", ".gz", ".png", ".jpg", ".ico", ".db", ".sqlite")):
                    continue
                file_path = os.path.join(root, file_name)
                rel_path = os.path.relpath(file_path, project_path)
                try:
                    with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                        lines = f.readlines()
                    for line_idx, line in enumerate(lines, start=1):
                        for rule in SECRET_RULES:
                            match = rule["regex"].search(line)
                            if match:
                                secret_val = match.group(0)
                                findings.append({
                                    "scanner": "gitleaks",
                                    "category": "secret",
                                    "title": f"Exposed Secret: {rule['id']}",
                                    "description": rule["description"],
                                    "severity": rule["severity"],
                                    "file_path": rel_path.replace("\\", "/"),
                                    "line_number": line_idx,
                                    "evidence": secret_val.strip(),
                                    "fingerprint": f"gitleaks-{rule['id']}-{rel_path}-{line_idx}",
                                    "raw": {"rule": rule["id"], "file": rel_path, "line": line_idx},
                                })
                except Exception:
                    continue
        return findings

    def _normalize(self, raw: list) -> list:
        out = []
        for item in raw:
            out.append({
                "scanner": "gitleaks",
                "category": "secret",
                "title": f"Exposed Secret: {item.get('RuleID', 'Unknown')}",
                "description": item.get("Description", ""),
                "severity": "CRITICAL",
                "file_path": item.get("File", "").replace("\\", "/"),
                "line_number": item.get("StartLine", 0),
                "evidence": item.get("Secret", ""),
                "fingerprint": item.get("Fingerprint", ""),
                "raw": item,
            })
        return out
