import json
import logging
from typing import AsyncGenerator, Dict
import httpx
from app.core.config import settings
from app.ai.prompts import SYSTEM_PROMPT, REMEDIATION_TEMPLATE
from app.processors.redactor import redact_for_ai

logger = logging.getLogger(__name__)


class SecurityRemediator:
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.model = settings.GEMINI_MODEL

    def _build_prompt(self, finding: Dict) -> str:
        safe = redact_for_ai(finding)
        return REMEDIATION_TEMPLATE.format(
            title=safe.get("title", "Unknown"),
            category=safe.get("category", "unknown"),
            severity=safe.get("severity", "UNKNOWN"),
            file_path=safe.get("file_path", "N/A"),
            evidence=safe.get("evidence", "N/A"),
            package_name=safe.get("package_name", "N/A"),
            package_version=safe.get("package_version", "N/A"),
            fixed_version=safe.get("fixed_version", "N/A"),
            cve_id=safe.get("cve_id", "N/A"),
            description=safe.get("description", "No description"),
        )

    def _generate_fallback_remediation(self, finding: Dict) -> str:
        cat = finding.get("category", "vulnerability")
        title = finding.get("title", "Issue")
        file_path = finding.get("file_path", "file")
        pkg = finding.get("package_name")
        ver = finding.get("package_version")
        fix = finding.get("fixed_version")
        evidence = finding.get("evidence", "")

        if cat == "secret":
            return f"""## 🔧 Recommended Fix

### Immediate Action
Revoke this secret immediately at the service provider portal to render the leaked token inactive.

### Step-by-Step Instructions
1. Navigate to the cloud or service management console associated with `{title}`.
2. Generate a new secret key / API token with minimal required scopes.
3. Replace the hardcoded secret in `{file_path}` with an environment variable reference.
4. Add `{file_path}` (if `.env` or secrets file) to `.gitignore`.

### Code Change
```python
# BEFORE (insecure hardcoded secret):
# {evidence[:16]}...

# AFTER (secure environment variable lookup):
import os

SECRET_KEY = os.environ.get("APP_SECRET_KEY")
if not SECRET_KEY:
    raise ValueError("APP_SECRET_KEY environment variable is required")
```

### Verification
Run `gitleaks detect --source .` or trigger a RepoGuard AI Verification Scan to verify no secrets remain in the repository.

### Additional Hardening
- Implement pre-commit hooks (`pre-commit install`) with Gitleaks to block future commits of secrets.
- Utilize a centralized secrets management service (e.g. AWS Secrets Manager or GCP Secret Manager)."""

        elif cat == "dependency":
            return f"""## 🔧 Recommended Fix

### Immediate Action
Upgrade `{pkg or 'package'}` from `{ver or 'current version'}` to `{fix or 'latest safe version'}` in `{file_path}`.

### Step-by-Step Instructions
1. Open `{file_path}` in your editor.
2. Locate the line declaring `{pkg or 'package'}=={ver or '...'}`.
3. Update the version constraint to the secure version.
4. Reinstall dependencies in your virtual environment and run automated tests.

### Code Change
```diff
# In {file_path}:
- {pkg or 'package'}=={ver or '1.0.0'}
+ {pkg or 'package'}=={fix or 'latest'}
```

### Verification
Run `pip install -r {file_path}` and trigger a RepoGuard AI Verification Rescan to confirm the vulnerability is resolved.

### Additional Hardening
- Enable automated dependency vulnerability scanning in your CI/CD pipeline.
- Pin sub-dependencies using a lockfile (`pip-compile` or `poetry.lock`)."""

        else:
            return f"""## 🔧 Recommended Fix

### Immediate Action
Modify `{file_path}` to enforce principle of least privilege and secure default configurations.

### Step-by-Step Instructions
1. Open `{file_path}`.
2. Apply the recommended hardening changes below.
3. Test local startup to ensure standard operations continue smoothly.
4. Rescan with RepoGuard AI to verify compliance.

### Code Change
```dockerfile
# Secure container configuration in {file_path}:
FROM python:3.11-slim

# Create and use non-root user
RUN groupadd -r appuser && useradd -r -g appuser appuser

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
RUN chown -R appuser:appuser /app
USER appuser

EXPOSE 8000
CMD ["python", "src/app.py"]
```

### Verification
Build and inspect the container:
```bash
docker build -t test-app .
docker run --rm test-app whoami
# Output should be: appuser (not root)
```

### Additional Hardening
- Add a `HEALTHCHECK` instruction to the Dockerfile.
- Drop all unnecessary Linux capabilities in container deployment configs."""

    async def suggest_fix(self, finding: Dict) -> str:
        prompt = self._build_prompt(finding)

        if not self.api_key or self.api_key.startswith("your_"):
            return self._generate_fallback_remediation(finding)

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
                logger.warning(f"Gemini API returned status {res.status_code}, using grounded fallback")
        except Exception as e:
            logger.warning(f"Gemini remediation error: {e}, using grounded fallback")

        return self._generate_fallback_remediation(finding)

    async def stream_remediation(self, finding: Dict) -> AsyncGenerator[str, None]:
        prompt = self._build_prompt(finding)

        if not self.api_key or self.api_key.startswith("your_"):
            full_text = self._generate_fallback_remediation(finding)
            words = full_text.split(" ")
            for i in range(0, len(words), 3):
                yield " ".join(words[i:i+3]) + " "
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
            logger.warning(f"Gemini stream remediation error: {e}, streaming fallback")

        full_text = self._generate_fallback_remediation(finding)
        words = full_text.split(" ")
        for i in range(0, len(words), 3):
            yield " ".join(words[i:i+3]) + " "
