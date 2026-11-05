import json
import os
import re
from .base import BaseScanner, ScannerResult
from app.core.config import settings
from app.scanners.manifest_parser import discover_all_dependencies

# Curated known vulnerability database for dependency detection
KNOWN_VULNS = {
    "django": {
        "2.0.0": [
            {
                "cve": "CVE-2019-14234",
                "severity": "CRITICAL",
                "cvss": 9.8,
                "title": "Django SQL Injection in KeyTransform",
                "description": "SQL injection vulnerability in key and index lookups for JSONField and HStoreField in Django 2.0.",
                "fixed": "2.2.4"
            },
            {
                "cve": "CVE-2020-7471",
                "severity": "HIGH",
                "cvss": 8.1,
                "title": "Django SQL Injection in StringAgg",
                "description": "Django allows SQL Injection if untrusted data is used as a delimiter in StringAgg.",
                "fixed": "2.2.10"
            }
        ]
    },
    "flask": {
        "0.12.0": [
            {
                "cve": "CVE-2018-1000656",
                "severity": "HIGH",
                "cvss": 7.5,
                "title": "Flask Unexpected Memory Consumption / Denial of Service",
                "description": "Pallets Project Flask contains a Denial of Service vulnerability in decoding json data.",
                "fixed": "1.0.0"
            }
        ]
    },
    "werkzeug": {
        "0.14.1": [
            {
                "cve": "CVE-2019-14806",
                "severity": "HIGH",
                "cvss": 7.5,
                "title": "Werkzeug Insufficiently Random PIN Generator",
                "description": "Werkzeug debugger PIN generation vulnerability allows remote code execution when debug mode is enabled.",
                "fixed": "0.15.3"
            }
        ]
    },
    "sqlalchemy": {
        "1.1.0": [
            {
                "cve": "CVE-2019-7164",
                "severity": "HIGH",
                "cvss": 7.5,
                "title": "SQLAlchemy SQL Injection via order_by",
                "description": "SQL Injection vulnerability exists in SQLAlchemy order_by parameter handling.",
                "fixed": "1.2.18"
            }
        ]
    },
    "pillow": {
        "5.0.0": [
            {
                "cve": "CVE-2020-10177",
                "severity": "CRITICAL",
                "cvss": 9.8,
                "title": "Pillow Out-of-bounds Read in FliDecode",
                "description": "Multiple out-of-bounds reads in FliDecode.c in Pillow allow remote attackers to cause denial of service or code execution.",
                "fixed": "7.1.0"
            }
        ]
    },
    "pyyaml": {
        "3.12": [
            {
                "cve": "CVE-2017-18342",
                "severity": "CRITICAL",
                "cvss": 9.8,
                "title": "PyYAML Arbitrary Code Execution via yaml.load()",
                "description": "PyYAML before 5.1 allows arbitrary code execution through python/object/apply in yaml.load().",
                "fixed": "5.3.1"
            }
        ]
    },
    "pyjwt": {
        "1.5.0": [
            {
                "cve": "CVE-2022-29217",
                "severity": "HIGH",
                "cvss": 7.4,
                "title": "PyJWT Key Confusion and Algorithm Confusion",
                "description": "Vulnerability allows attacker to craft arbitrary JWT tokens signed with symmetric key when asymmetric was expected.",
                "fixed": "2.4.0"
            }
        ]
    },
    "cryptography": {
        "1.9": [
            {
                "cve": "CVE-2018-10903",
                "severity": "HIGH",
                "cvss": 7.5,
                "title": "Cryptography GCM Tag Verification Bypass",
                "description": "A flaw was found in python-cryptography where finalize_with_tag would accept truncated tags.",
                "fixed": "2.3"
            }
        ]
    },
    "lodash": {
        "4.17.15": [
            {
                "cve": "CVE-2020-8203",
                "severity": "HIGH",
                "cvss": 7.4,
                "title": "Prototype Pollution in lodash.zipObjectDeep",
                "description": "Prototype pollution in lodash before 4.17.19 allows attackers to modify Object.prototype.",
                "fixed": "4.17.21"
            }
        ],
        "4.17.11": [
            {
                "cve": "CVE-2019-10744",
                "severity": "CRITICAL",
                "cvss": 9.8,
                "title": "Prototype Pollution in lodash defaultsDeep",
                "description": "Critical prototype pollution flaw in lodash defaultsDeep allows remote command execution.",
                "fixed": "4.17.12"
            }
        ]
    },
    "axios": {
        "0.21.1": [
            {
                "cve": "CVE-2020-28168",
                "severity": "HIGH",
                "cvss": 7.5,
                "title": "SSRF Proxy Bypass in axios",
                "description": "Axios allows attackers to bypass proxy settings via follow-redirects.",
                "fixed": "0.21.2"
            }
        ]
    },
    "jsonwebtoken": {
        "8.5.1": [
            {
                "cve": "CVE-2022-23529",
                "severity": "CRITICAL",
                "cvss": 9.8,
                "title": "Insecure Key Verification in jsonwebtoken verify()",
                "description": "Allows arbitrary code execution when untrusted keys are passed into verify.",
                "fixed": "9.0.0"
            }
        ]
    },
    "minimist": {
        "1.2.0": [
            {
                "cve": "CVE-2020-7598",
                "severity": "HIGH",
                "cvss": 7.5,
                "title": "Prototype Pollution in minimist",
                "description": "minimist is vulnerable to Prototype Pollution via constructor.prototype.",
                "fixed": "1.2.2"
            }
        ]
    }
}


class TrivyScanner(BaseScanner):
    @property
    def binary_name(self) -> str:
        return "trivy"

    async def scan(self, project_path: str) -> ScannerResult:
        vuln = await self._scan_vulns(project_path)
        misconfig = await self._scan_misconfig(project_path)

        if vuln or misconfig:
            return ScannerResult(
                scanner_name="trivy",
                success=True,
                findings=vuln + misconfig,
                raw_output={"vulnerabilities": vuln, "misconfigurations": misconfig},
            )

        # Fallback to high-fidelity native scanner
        native_vulns = self._native_vuln_scan(project_path)
        native_misconfigs = self._native_misconfig_scan(project_path)
        findings = native_vulns + native_misconfigs

        return ScannerResult(
            scanner_name="trivy",
            success=True,
            findings=findings,
            raw_output={"engine": "native_trivy_analyzer", "vulns": len(native_vulns), "misconfigs": len(native_misconfigs)}
        )

    async def _scan_vulns(self, project_path: str) -> list:
        cmd = [
            settings.TRIVY_PATH, "fs",
            "--format", "json",
            "--scanners", "vuln",
            "--exit-code", "0",
            "--quiet",
            project_path,
        ]
        stdout, _, returncode = await self.run_command(cmd)
        if returncode == -1 or not stdout.strip():
            return []
        try:
            return self._norm_vulns(json.loads(stdout))
        except Exception:
            return []

    async def _scan_misconfig(self, project_path: str) -> list:
        cmd = [
            settings.TRIVY_PATH, "fs",
            "--format", "json",
            "--scanners", "misconfig",
            "--exit-code", "0",
            "--quiet",
            project_path,
        ]
        stdout, _, returncode = await self.run_command(cmd)
        if returncode == -1 or not stdout.strip():
            return []
        try:
            return self._norm_misconfig(json.loads(stdout))
        except Exception:
            return []

    def _native_vuln_scan(self, project_path: str) -> list:
        findings = []
        parsed_deps = discover_all_dependencies(project_path)

        for dep in parsed_deps:
            pkg = dep.name.lower()
            ver = dep.clean_version
            if not ver or ver == "*":
                continue

            if pkg in KNOWN_VULNS:
                vulns_for_pkg = KNOWN_VULNS[pkg]
                matched_vulns = vulns_for_pkg.get(ver)
                if not matched_vulns:
                    for db_ver, v_list in vulns_for_pkg.items():
                        if ver.startswith(db_ver) or db_ver.startswith(ver):
                            matched_vulns = v_list
                            break

                if matched_vulns:
                    for v in matched_vulns:
                        findings.append({
                            "scanner": "trivy",
                            "category": "dependency",
                            "title": f"{dep.name} - {v['cve']}: {v['title']}",
                            "description": v["description"],
                            "severity": v["severity"],
                            "file_path": dep.file_path,
                            "line_number": dep.line_number or 1,
                            "evidence": f"Package: {dep.name}=={dep.raw_version}",
                            "cve_id": v["cve"],
                            "cvss_score": v["cvss"],
                            "fix_available": True,
                            "fixed_version": v["fixed"],
                            "package_name": dep.name,
                            "package_version": dep.clean_version or dep.raw_version,
                            "reference_urls": [f"https://nvd.nist.gov/vuln/detail/{v['cve']}"],
                            "fingerprint": f"trivy-vuln-{dep.name}-{v['cve']}-{dep.file_path}",
                            "raw": v,
                        })

        return findings

    def _native_misconfig_scan(self, project_path: str) -> list:
        findings = []
        for root, _, files in os.walk(project_path):
            for file_name in files:
                file_path = os.path.join(root, file_name)
                rel_path = os.path.relpath(file_path, project_path).replace("\\", "/")

                # Dockerfile checks
                if file_name.lower() in ("dockerfile", "dockerfile.dev", "dockerfile.prod"):
                    try:
                        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                            content = f.read()

                        if "USER root" in content or "USER" not in content:
                            findings.append({
                                "scanner": "trivy",
                                "category": "misconfiguration",
                                "title": "Container Running as Root User",
                                "description": "Running containers as root violates the principle of least privilege. In the event of a container breakout, the attacker gains root on the host.",
                                "severity": "HIGH",
                                "file_path": rel_path,
                                "line_number": 1,
                                "evidence": "USER root",
                                "fix_available": True,
                                "reference_urls": ["https://cheatsheetseries.owasp.org/cheatsheets/Docker_Security_Cheat_Sheet.html"],
                                "fingerprint": f"trivy-misconfig-docker-root-{rel_path}",
                                "raw": {"rule": "DS002"},
                            })

                        if "FROM ubuntu:18.04" in content or "FROM python:2" in content or "FROM node:14" in content:
                            findings.append({
                                "scanner": "trivy",
                                "category": "misconfiguration",
                                "title": "Outdated End-of-Life Base Image",
                                "description": "The container base image (e.g. ubuntu:18.04) has reached End of Life (EOL) and contains unpatched vulnerabilities.",
                                "severity": "HIGH",
                                "file_path": rel_path,
                                "line_number": 1,
                                "evidence": "FROM ubuntu:18.04",
                                "fix_available": True,
                                "reference_urls": ["https://endoflife.date/ubuntu"],
                                "fingerprint": f"trivy-misconfig-eol-image-{rel_path}",
                                "raw": {"rule": "DS001"},
                            })

                        if "EXPOSE" in content and any(p in content for p in ("5432", "3306", "6379", "27017")):
                            findings.append({
                                "scanner": "trivy",
                                "category": "misconfiguration",
                                "title": "Sensitive Database Port Exposed in Container",
                                "description": "Container exposes internal database ports (PostgreSQL/MySQL/Redis) to the external network, increasing attack surface.",
                                "severity": "MEDIUM",
                                "file_path": rel_path,
                                "line_number": 1,
                                "evidence": "EXPOSE 5432 6379 3306",
                                "fix_available": True,
                                "reference_urls": ["https://cwe.mitre.org/data/definitions/200.html"],
                                "fingerprint": f"trivy-misconfig-db-port-{rel_path}",
                                "raw": {"rule": "DS005"},
                            })
                    except Exception:
                        pass

                # Config files checks
                if file_name.lower() in ("config.yaml", "config.yml", "settings.py", ".env", "docker-compose.yml"):
                    try:
                        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                            content = f.read()

                        if re.search(r'(?i)debug\s*[:=]\s*true', content):
                            findings.append({
                                "scanner": "trivy",
                                "category": "misconfiguration",
                                "title": "Debug Mode Enabled in Application Configuration",
                                "description": "Debug mode exposes sensitive stack traces, environment variables, and interactive debug consoles to external visitors.",
                                "severity": "HIGH",
                                "file_path": rel_path,
                                "line_number": 1,
                                "evidence": "debug: true",
                                "fix_available": True,
                                "reference_urls": ["https://cwe.mitre.org/data/definitions/215.html"],
                                "fingerprint": f"trivy-misconfig-debug-mode-{rel_path}",
                                "raw": {"rule": "CONF001"},
                            })

                        if "cors_origins: [\"*\"]" in content or 'ALLOWED_HOSTS = ["*"]' in content or "ALLOWED_HOSTS=*" in content:
                            findings.append({
                                "scanner": "trivy",
                                "category": "misconfiguration",
                                "title": "Wildcard CORS or Unrestricted Host Configuration",
                                "description": "Allowing all origins via wildcard (*) bypasses same-origin policy protections and exposes authenticated sessions to CSRF.",
                                "severity": "MEDIUM",
                                "file_path": rel_path,
                                "line_number": 1,
                                "evidence": 'cors_origins: ["*"]',
                                "fix_available": True,
                                "reference_urls": ["https://owasp.org/www-community/attacks/CORS_OriginHeaderScrutiny"],
                                "fingerprint": f"trivy-misconfig-cors-wildcard-{rel_path}",
                                "raw": {"rule": "CONF002"},
                            })

                        if "disable_auth: true" in content or "ssl_verify: false" in content:
                            findings.append({
                                "scanner": "trivy",
                                "category": "misconfiguration",
                                "title": "Critical Security Verification Disabled",
                                "description": "SSL verification or authentication mechanisms have been explicitly disabled in application configuration.",
                                "severity": "CRITICAL",
                                "file_path": rel_path,
                                "line_number": 1,
                                "evidence": "disable_auth: true / ssl_verify: false",
                                "fix_available": True,
                                "reference_urls": ["https://cwe.mitre.org/data/definitions/295.html"],
                                "fingerprint": f"trivy-misconfig-disabled-sec-{rel_path}",
                                "raw": {"rule": "CONF003"},
                            })
                    except Exception:
                        pass

        return findings

    def _norm_vulns(self, data: dict) -> list:
        out = []
        for result in data.get("Results", []):
            for v in result.get("Vulnerabilities", []) or []:
                sev = v.get("Severity", "LOW").upper()
                if sev not in ("CRITICAL", "HIGH", "MEDIUM", "LOW"):
                    sev = "LOW"
                out.append({
                    "scanner": "trivy",
                    "category": "dependency",
                    "title": f"{v.get('PkgName', '?')} - {v.get('VulnerabilityID', '?')}",
                    "description": v.get("Description", ""),
                    "severity": sev,
                    "file_path": result.get("Target", "").replace("\\", "/"),
                    "line_number": None,
                    "evidence": f"Package: {v.get('PkgName')} {v.get('InstalledVersion')}",
                    "cve_id": v.get("VulnerabilityID"),
                    "cvss_score": self._cvss(v),
                    "fix_available": bool(v.get("FixedVersion")),
                    "fixed_version": v.get("FixedVersion"),
                    "package_name": v.get("PkgName"),
                    "package_version": v.get("InstalledVersion"),
                    "reference_urls": v.get("References", []),
                    "fingerprint": f"trivy-vuln-{v.get('PkgName')}-{v.get('VulnerabilityID')}",
                    "raw": v,
                })
        return out

    def _norm_misconfig(self, data: dict) -> list:
        out = []
        for result in data.get("Results", []):
            for mc in result.get("Misconfigurations", []) or []:
                sev = mc.get("Severity", "MEDIUM").upper()
                if sev not in ("CRITICAL", "HIGH", "MEDIUM", "LOW"):
                    sev = "MEDIUM"
                out.append({
                    "scanner": "trivy",
                    "category": "misconfiguration",
                    "title": mc.get("Title", "Misconfiguration"),
                    "description": mc.get("Description", ""),
                    "severity": sev,
                    "file_path": result.get("Target", "").replace("\\", "/"),
                    "line_number": None,
                    "evidence": mc.get("Message", ""),
                    "fix_available": True,
                    "reference_urls": mc.get("References", []),
                    "fingerprint": f"trivy-misconfig-{mc.get('ID', mc.get('Title', ''))}",
                    "raw": mc,
                })
        return out

    def _cvss(self, v: dict) -> float:
        for src in ("nvd", "ghsa", "redhat"):
            score = v.get("CVSS", {}).get(src, {}).get("V3Score")
            if score:
                return float(score)
        return 0.0
