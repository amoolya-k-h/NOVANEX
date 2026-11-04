import json
import logging
from typing import AsyncGenerator, Dict
import httpx
from app.core.config import settings
from app.ai.prompts import SYSTEM_PROMPT, EXPLANATION_TEMPLATE
from app.processors.redactor import redact_for_ai

logger = logging.getLogger(__name__)


class SecurityAnalyst:
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.model = settings.GEMINI_MODEL

    def _build_prompt(self, finding: Dict) -> str:
        safe = redact_for_ai(finding)
        return EXPLANATION_TEMPLATE.format(
            title=safe.get("title", "Unknown"),
            category=safe.get("category", "unknown"),
            severity=safe.get("severity", "UNKNOWN"),
            scanner=safe.get("scanner", "unknown"),
            file_path=safe.get("file_path", "N/A"),
            line_number=safe.get("line_number", "N/A"),
            evidence=safe.get("evidence", "N/A"),
            cve_id=safe.get("cve_id", "N/A"),
            cvss_score=safe.get("cvss_score", "N/A"),
            description=safe.get("description", "No description available"),
        )

    def _generate_fallback_explanation(self, finding: Dict) -> str:
        cat = finding.get("category", "vulnerability")
        sev = finding.get("severity", "MEDIUM")
        title = finding.get("title", "Security Finding")
        file_path = finding.get("file_path", "codebase")
        line = finding.get("line_number")
        cve = finding.get("cve_id")
        pkg = finding.get("package_name")
        ver = finding.get("package_version")
        fix = finding.get("fixed_version")
        evidence = finding.get("evidence", "")

        if cat == "secret":
            return f"""## 🔍 What This Is
This finding indicates that hardcoded sensitive credentials ({title}) were detected directly inside `{file_path}`{f' at line {line}' if line else ''}. Committing plaintext authentication tokens or passwords creates an immediate risk of credential theft.

## ⚠️ Why It's Dangerous
Attackers who gain read access to the source code (via public repos, compromised developer machines, backup leaks, or CI logs) can immediately extract `{evidence[:10]}...` and impersonate authorized services, pivot into production environments, or exfiltrate private databases without triggering brute-force alarms.

## 💥 Potential Impact
- Unauthorized administrative access to cloud or database resources
- Data exfiltration, data loss, or regulatory non-compliance (GDPR, PCI-DSS)
- Lateral movement through connected infrastructure using leaked keys

## ✅ How to Fix It
1. **Revoke and rotate** the leaked credential immediately in your cloud/provider dashboard.
2. Remove the sensitive string from `{file_path}`.
3. Migrate the secret to an environment variable or secrets manager (e.g. AWS Secrets Manager, HashiCorp Vault).
4. Ensure `{file_path}` (if `.env` or credential file) is added to `.gitignore`.

## 📚 Learn More
- Classified under **CWE-798: Use of Hard-coded Credentials**
- Review your git history using Gitleaks to ensure the secret is purged from previous commits."""

        elif cat == "dependency":
            return f"""## 🔍 What This Is
The project depends on `{pkg or 'package'} v{ver or 'unknown'}` in `{file_path}`, which contains a known public security vulnerability{f' tracked as **{cve}**' if cve else ''}.

## ⚠️ Why It's Dangerous
Known CVEs have public exploit proof-of-concepts cataloged by security researchers and automated botnets. An attacker targeting applications that expose endpoints utilizing this package can leverage known vulnerabilities to execute arbitrary code, bypass authorization checks, or trigger a Denial of Service.

## 💥 Potential Impact
- Remote Code Execution (RCE) or arbitrary file read
- Application crashes resulting in denial of service
- Compromise of application integrity and user session hijacking

## ✅ How to Fix It
1. Upgrade `{pkg or 'package'}` to a patched version{f' (**{fix}** or later)' if fix else ' (latest stable)'}.
2. Update your package manifest file (`{file_path}`).
3. Run your project test suite to verify no breaking API changes were introduced.
4. Rescan the project with RepoGuard AI to verify remediation.

## 📚 Learn More
- Security Advisory: {f'https://nvd.nist.gov/vuln/detail/{cve}' if cve else 'https://osv.dev'}
- Severity: **{sev}** | Evaluated via standard CVSS exploitability metrics"""

        else:
            return f"""## 🔍 What This Is
A security misconfiguration was detected in `{file_path}`: **{title}**. The configuration deviates from established DevSecOps hardening standards.

## ⚠️ Why It's Dangerous
Insecure defaults, unnecessary privileges (such as running containers as `root`), or disabling security mechanisms reduce the barrier for attackers who achieve initial footholds, making privilege escalation trivial.

## 💥 Potential Impact
- Container escape or elevated privilege execution on the host machine
- Unrestricted network access through unnecessarily exposed ports
- Exposure of debugging interfaces or sensitive stack traces in production

## ✅ How to Fix It
1. Review `{file_path}` and apply least-privilege configurations.
2. Create and run under a non-root dedicated service user.
3. Restrict exposed ports to only what is strictly required for the service.
4. Disable debug mode and wildcard CORS origins in production settings.

## 📚 Learn More
- Center for Internet Security (CIS) Benchmark best practices
- OWASP Security Misconfiguration (A05:2021)"""

    async def explain_finding(self, finding: Dict) -> str:
        prompt = self._build_prompt(finding)

        if not self.api_key or self.api_key.startswith("your_"):
            return self._generate_fallback_explanation(finding)

        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent?key={self.api_key}"
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "systemInstruction": {"parts": [{"text": SYSTEM_PROMPT}]},
        }

        timeout_cfg = httpx.Timeout(connect=4.0, read=12.0, write=5.0, pool=5.0)
        try:
            async with httpx.AsyncClient(timeout=timeout_cfg) as client:
                res = await client.post(url, json=payload)
                if res.status_code == 200:
                    data = res.json()
                    candidates = data.get("candidates", [])
                    if candidates:
                        parts = candidates[0].get("content", {}).get("parts", [])
                        if parts:
                            return parts[0].get("text", "")
                logger.warning(f"Gemini API returned status {res.status_code}, using grounded fallback: {res.text[:100]}")
        except Exception as e:
            logger.warning(f"Gemini request exception: {e}, using grounded fallback")

        return self._generate_fallback_explanation(finding)

    async def stream_explanation(self, finding: Dict) -> AsyncGenerator[str, None]:
        prompt = self._build_prompt(finding)

        if not self.api_key or self.api_key.startswith("your_"):
            full_text = self._generate_fallback_explanation(finding)
            # Yield in natural token-sized chunks
            words = full_text.split(" ")
            for i in range(0, len(words), 3):
                chunk = " ".join(words[i:i+3]) + " "
                yield chunk
            return

        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:streamGenerateContent?alt=sse&key={self.api_key}"
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "systemInstruction": {"parts": [{"text": SYSTEM_PROMPT}]},
        }

        timeout_cfg = httpx.Timeout(connect=4.0, read=12.0, write=5.0, pool=5.0)
        try:
            async with httpx.AsyncClient(timeout=timeout_cfg) as client:
                async with client.stream("POST", url, json=payload) as response:
                    if response.status_code == 200:
                        async for line in response.aiter_lines():
                            if line.startswith("data: "):
                                data_str = line[6:].strip()
                                if data_str:
                                    try:
                                        chunk_json = json.loads(data_str)
                                        candidates = chunk_json.get("candidates", [])
                                        if candidates:
                                            parts = candidates[0].get("content", {}).get("parts", [])
                                            for part in parts:
                                                text = part.get("text", "")
                                                if text:
                                                    yield text
                                    except Exception:
                                        pass
                        return
                    logger.warning(f"Gemini stream returned {response.status_code}, streaming fallback")
        except Exception as e:
            logger.warning(f"Gemini stream error: {e}, streaming fallback")

        # Fallback stream
        full_text = self._generate_fallback_explanation(finding)
        words = full_text.split(" ")
        for i in range(0, len(words), 3):
            yield " ".join(words[i:i+3]) + " "

    async def chat_about_finding(self, finding: Dict, user_message: str, history: list = None) -> str:
        safe = redact_for_ai(finding)
        title = safe.get("title", "Security Finding")
        file_path = safe.get("file_path", "unknown")
        category = safe.get("category", "vulnerability")
        cve = safe.get("cve_id", "")

        context_prompt = f"""You are RepoGuard AI, an expert security engineering copilot assisting a software engineer.
Context of Current Vulnerability:
- Finding: {title}
- Category: {category}
- File: {file_path}
- CVE/CWE: {cve}
- Evidence: {safe.get('evidence', 'N/A')}

Developer Question: {user_message}

Provide a direct, authoritative, developer-friendly response with concrete code examples, testing tips, or security best practices tailored directly to this vulnerability."""

        if self.api_key and not self.api_key.startswith("your_"):
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent?key={self.api_key}"
            payload = {
                "contents": [{"parts": [{"text": context_prompt}]}],
                "systemInstruction": {"parts": [{"text": SYSTEM_PROMPT}]},
            }
            timeout_cfg = httpx.Timeout(connect=3.0, read=10.0, write=5.0, pool=5.0)
            try:
                async with httpx.AsyncClient(timeout=timeout_cfg) as client:
                    res = await client.post(url, json=payload)
                    if res.status_code == 200:
                        candidates = res.json().get("candidates", [])
                        if candidates:
                            parts = candidates[0].get("content", {}).get("parts", [])
                            if parts:
                                return parts[0].get("text", "")
            except Exception as e:
                logger.warning(f"Gemini chat error: {e}, using contextual fallback")

        # Contextual grounded assistant response
        msg_lower = user_message.lower()
        if "test" in msg_lower:
            return f"To verify this fix in your local test suite, you can write a test case in `tests/test_security.py` that verifies {file_path} rejects unauthorized or malformed inputs without leaking credentials. You can also run `pytest` alongside RepoGuard AI's verification rescan."
        elif "revert" in msg_lower or "rollback" in msg_lower:
            return f"If you need to roll back, git will preserve your previous revision. However, keeping this {category} open in {file_path} exposes the application to immediate risks under {cve or 'known vulnerabilities'}."
        elif "ci" in msg_lower or "pipeline" in msg_lower:
            return f"You can integrate this verification into GitHub Actions or GitLab CI by adding `repoguard scan --fail-on-p1` before your merge step. This ensures no new {category} findings enter the main branch."
        else:
            return f"For `{title}` in `{file_path}`, the recommended approach is to isolate sensitive logic, use parameterized variables, and verify that all caller functions pass validated arguments. Let me know if you would like me to generate a unit test or tailor the configuration further!"

