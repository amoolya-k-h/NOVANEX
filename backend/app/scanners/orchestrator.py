import asyncio
import os
import uuid
import zipfile
import shutil
from typing import Dict, Callable, Optional
from .gitleaks import GitleaksScanner
from .trivy import TrivyScanner
from .osv_scanner import OSVScanner
from .semgrep import SemgrepScanner
from .base import ScannerResult
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)


class ScanOrchestrator:
    def __init__(self):
        self.gitleaks = GitleaksScanner(timeout=settings.SCAN_TIMEOUT)
        self.trivy = TrivyScanner(timeout=settings.SCAN_TIMEOUT)
        self.osv = OSVScanner(timeout=settings.SCAN_TIMEOUT)
        self.semgrep = SemgrepScanner(timeout=settings.SCAN_TIMEOUT)

    async def extract_project(self, zip_path: str) -> str:
        extract_dir = os.path.join(settings.UPLOAD_DIR, f"extracted_{uuid.uuid4().hex}")
        os.makedirs(extract_dir, exist_ok=True)

        try:
            with zipfile.ZipFile(zip_path, "r") as zf:
                total_size = 0
                for info in zf.infolist():
                    if ".." in info.filename or info.filename.startswith("/"):
                        raise ValueError(f"Unsafe path in ZIP: {info.filename}")
                    total_size += info.file_size
                    if total_size > 100 * 1024 * 1024:
                        raise ValueError("ZIP contents exceed 100MB limit")
                zf.extractall(extract_dir)
        except zipfile.BadZipFile:
            shutil.rmtree(extract_dir, ignore_errors=True)
            raise ValueError("Invalid ZIP file")

        return extract_dir

    async def run_all_scanners(
        self,
        project_path: str,
        progress_callback: Optional[Callable] = None,
    ) -> Dict[str, ScannerResult]:
        async def run(scanner, key):
            result = await scanner.scan(project_path)
            if progress_callback:
                await progress_callback(key, "done", 100)
            return result

        results = await asyncio.gather(
            run(self.gitleaks, "gitleaks"),
            run(self.trivy, "trivy"),
            run(self.osv, "osv"),
            run(self.semgrep, "semgrep"),
            return_exceptions=True,
        )

        out = {}
        for i, (name, result) in enumerate(zip(["gitleaks", "trivy", "osv", "semgrep"], results)):
            if isinstance(result, Exception):
                out[name] = ScannerResult(name, False, [], error=str(result))
            else:
                out[name] = result
        return out

    def cleanup_project(self, project_path: str):
        try:
            shutil.rmtree(project_path, ignore_errors=True)
        except Exception as e:
            logger.warning(f"Cleanup failed for {project_path}: {e}")

