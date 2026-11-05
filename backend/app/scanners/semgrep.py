import json
import os
import re
import ast
from .base import BaseScanner, ScannerResult
from app.core.config import settings

# Common SAST insecure pattern rules (aligned with Semgrep community rules)
SEMGRAP_CODE_RULES = [
    {
        "id": "python-sql-injection",
        "title": "SQL Injection via String Formatting",
        "description": "Constructing SQL queries using string formatting, concatenation, or f-strings allows attackers to execute arbitrary SQL commands.",
        "severity": "CRITICAL",
        "cve_id": "CWE-89",
        "cwe_id": "CWE-89",
        "cvss": 9.8,
        "regex": re.compile(r'(?i)(?:execute|cursor\.execute)\s*\(\s*(?:f["\'].*SELECT.*\{.*\}|["\'].*SELECT.*%s|.*SELECT.*\+\s*\w+)', re.DOTALL),
        "file_types": [".py", ".js", ".ts", ".php"],
        "fix_recommendation": "Use parameterized queries with placeholders (? or %s) and pass parameters as a tuple."
    },
    {
        "id": "python-command-injection",
        "title": "Command Injection via Unsanitized System Call",
        "description": "Passing untrusted input to system shells (subprocess.run with shell=True, os.system, or popen) allows arbitrary remote command execution.",
        "severity": "CRITICAL",
        "cve_id": "CWE-78",
        "cwe_id": "CWE-78",
        "cvss": 9.8,
        "regex": re.compile(r'(?i)(?:subprocess\.(?:run|call|Popen)\s*\(.*shell\s*=\s*True|os\.system\s*\(|os\.popen\s*\()'),
        "file_types": [".py"],
        "fix_recommendation": "Set shell=False and pass command arguments as a list of strings without shell interpolation."
    },
    {
        "id": "python-path-traversal",
        "title": "Path Traversal in File Operations",
        "description": "Accessing files using unsanitized user-controlled paths allows attackers to read or write arbitrary files on the server file system.",
        "severity": "HIGH",
        "cve_id": "CWE-22",
        "cwe_id": "CWE-22",
        "cvss": 7.5,
        "regex": re.compile(r'(?i)open\s*\(\s*(?:f["\'].*\{.*\}|.*\+\s*\w+)\s*,?\s*["\']?[rwab]*["\']?\s*\)'),
        "file_types": [".py", ".js", ".ts"],
        "fix_recommendation": "Use os.path.basename() and validate paths against a strict allowlist using os.path.abspath()."
    },
    {
        "id": "python-weak-cryptography-md5",
        "title": "Weak Cryptographic Hash (MD5 / SHA1) for Passwords",
        "description": "MD5 and SHA-1 are cryptographically broken and vulnerable to collision and pre-image attacks. They must never be used for password hashing.",
        "severity": "HIGH",
        "cve_id": "CWE-328",
        "cwe_id": "CWE-328",
        "cvss": 7.5,
        "regex": re.compile(r'(?i)hashlib\.(?:md5|sha1)\s*\('),
        "file_types": [".py"],
        "fix_recommendation": "Use slow, adaptive password hashing algorithms like bcrypt, Argon2, or PBKDF2."
    },
    {
        "id": "python-empty-exception-handler",
        "title": "Suppressed Security Exception (Empty catch / except)",
        "description": "Catching generic exceptions and silently continuing (swallowing errors) obscures authentication or authorization failures.",
        "severity": "LOW",
        "cve_id": "CWE-391",
        "cwe_id": "CWE-391",
        "cvss": 3.5,
        "regex": re.compile(r'except(?:\s+Exception)?\s*:\s*(?:pass|return\s+False)'),
        "file_types": [".py"],
        "fix_recommendation": "Handle specific expected exceptions, log the stack trace, and fail closed."
    }
]

IGNORE_DIRS = {".git", "node_modules", "venv", ".venv", "__pycache__", "dist", "build", ".next"}


class SemgrepScanner(BaseScanner):
    @property
    def binary_name(self) -> str:
        return "semgrep"

    async def scan(self, project_path: str) -> ScannerResult:
        # 1. Attempt official Semgrep CLI if installed
        cmd = [
            "semgrep",
            "scan",
            "--config", "auto",
            "--json",
            "--quiet",
            project_path
        ]
        stdout, stderr, returncode = await self.run_command(cmd)

        if returncode == 0 and stdout.strip():
            try:
                data = json.loads(stdout)
                findings = self._normalize(data, project_path)
                if findings:
                    return ScannerResult("semgrep", True, findings, raw_output=data)
            except Exception:
                pass

        # 2. Native SAST static code analysis engine
        findings = self._native_sast_scan(project_path)
        return ScannerResult(
            "semgrep",
            True,
            findings,
            raw_output={"engine": "native_semgrep_sast", "count": len(findings)}
        )

    def _native_sast_scan(self, project_path: str) -> list:
        findings = []

        for root, dirs, files in os.walk(project_path):
            dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]
            for file_name in files:
                ext = os.path.splitext(file_name)[1].lower()
                for rule in SEMGRAP_CODE_RULES:
                    if ext in rule["file_types"]:
                        file_path = os.path.join(root, file_name)
                        rel_path = os.path.relpath(file_path, project_path).replace("\\", "/")
                        try:
                            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                                lines = f.readlines()

                            for line_idx, line in enumerate(lines, start=1):
                                if rule["regex"].search(line):
                                    findings.append({
                                        "scanner": "semgrep",
                                        "category": "sast",
                                        "title": f"Insecure Code: {rule['title']}",
                                        "description": rule["description"],
                                        "severity": rule["severity"],
                                        "file_path": rel_path,
                                        "line_number": line_idx,
                                        "evidence": line.strip(),
                                        "cve_id": rule.get("cve_id"),
                                        "cwe_id": rule.get("cwe_id"),
                                        "cvss_score": rule.get("cvss"),
                                        "fix_available": True,
                                        "reference_urls": [
                                            f"https://cwe.mitre.org/data/definitions/{rule['cwe_id'].replace('CWE-', '')}.html"
                                        ],
                                        "fingerprint": f"semgrep-{rule['id']}-{rel_path}-{line_idx}",
                                        "raw": {
                                            "rule": rule["id"],
                                            "file": rel_path,
                                            "line": line_idx,
                                            "recommendation": rule["fix_recommendation"]
                                        }
                                    })
                        except Exception:
                            continue

        return findings

    def _normalize(self, data: dict, project_path: str) -> list:
        out = []
        for result in data.get("results", []):
            path = result.get("path", "")
            if os.path.isabs(path):
                path = os.path.relpath(path, project_path).replace("\\", "/")

            extra = result.get("extra", {})
            meta = extra.get("metadata", {})
            cwe = meta.get("cwe", [""])[0] if isinstance(meta.get("cwe"), list) else meta.get("cwe", "")
            
            sev_raw = extra.get("severity", "WARNING").upper()
            sev_map = {"ERROR": "CRITICAL", "WARNING": "HIGH", "INFO": "LOW"}
            severity = sev_map.get(sev_raw, "MEDIUM")

            out.append({
                "scanner": "semgrep",
                "category": "sast",
                "title": extra.get("message", "Insecure code pattern detected").split("\n")[0],
                "description": extra.get("message", ""),
                "severity": severity,
                "file_path": path,
                "line_number": result.get("start", {}).get("line"),
                "evidence": extra.get("lines", "").strip(),
                "cve_id": cwe or "CWE-Insecure-Code",
                "cwe_id": cwe,
                "fix_available": True,
                "reference_urls": meta.get("references", []),
                "fingerprint": f"semgrep-{result.get('check_id')}-{path}-{result.get('start', {}).get('line')}",
                "raw": result,
            })
        return out
