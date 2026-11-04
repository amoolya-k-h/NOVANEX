from abc import ABC, abstractmethod
from typing import List, Optional
import asyncio
import shutil


class ScannerResult:
    def __init__(
        self,
        scanner_name: str,
        success: bool,
        findings: List[dict],
        raw_output=None,
        error: Optional[str] = None,
    ):
        self.scanner_name = scanner_name
        self.success = success
        self.findings = findings
        self.raw_output = raw_output
        self.error = error


class BaseScanner(ABC):
    def __init__(self, timeout: int = 300):
        self.timeout = timeout

    @abstractmethod
    async def scan(self, project_path: str) -> ScannerResult:
        pass

    async def run_command(self, cmd: List[str], cwd: Optional[str] = None):
        binary = cmd[0]
        # Fast pre-check: if binary does not exist on PATH, return immediately
        if not shutil.which(binary):
            return "", f"Scanner binary not found: {binary}", -1

        try:
            proc = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                cwd=cwd,
            )
            try:
                stdout, stderr = await asyncio.wait_for(
                    proc.communicate(), timeout=self.timeout
                )
                return (
                    stdout.decode("utf-8", errors="replace"),
                    stderr.decode("utf-8", errors="replace"),
                    proc.returncode,
                )
            except asyncio.TimeoutError:
                proc.kill()
                return "", f"Scanner timed out after {self.timeout}s", -1
        except FileNotFoundError as e:
            return "", f"Scanner binary not found: {e}", -1
        except Exception as e:
            return "", f"Scanner error: {e}", -1

    @property
    @abstractmethod
    def binary_name(self) -> str:
        pass
