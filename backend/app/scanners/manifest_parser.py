import os
import re
import json
from typing import List, Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)

# Pattern to clean version prefixes and constraints
VERSION_CLEAN_RE = re.compile(r'^[vV~^>=<\s]+')
OPERATOR_SPLIT_RE = re.compile(r'(==|>=|<=|~=|!=|>|<)')


class ParsedDependency:
    def __init__(
        self,
        name: str,
        version: str,
        file_path: str,
        ecosystem: str,
        line_number: Optional[int] = None,
        is_lockfile: bool = False,
    ):
        self.name = name.strip()
        self.raw_version = version.strip()
        self.clean_version = self._sanitize_version(self.raw_version)
        self.file_path = file_path.replace("\\", "/")
        self.ecosystem = ecosystem
        self.line_number = line_number
        self.is_lockfile = is_lockfile

    @staticmethod
    def _sanitize_version(v: str) -> str:
        if not v:
            return ""
        # Strip comments
        v = v.split("#")[0].strip()
        # Handle semver ranges like "^4.17.15" -> "4.17.15"
        v = VERSION_CLEAN_RE.sub("", v).strip()
        # If multiple comma constraints like ">=1.0.0, <2.0.0", take the first segment
        if "," in v:
            v = v.split(",")[0].strip()
            v = VERSION_CLEAN_RE.sub("", v).strip()
        # Cut off any trailing non-version junk or quotes
        v = v.strip("\"' \t\r\n")
        return v

    def to_dict(self) -> Dict[str, Any]:
        return {
            "name": self.name,
            "raw_version": self.raw_version,
            "version": self.clean_version,
            "file_path": self.file_path,
            "ecosystem": self.ecosystem,
            "line_number": self.line_number,
            "is_lockfile": self.is_lockfile,
        }


def parse_requirements_txt(content: str, rel_path: str) -> List[ParsedDependency]:
    deps: List[ParsedDependency] = []
    lines = content.splitlines()

    for idx, raw_line in enumerate(lines, start=1):
        line = raw_line.strip()
        if not line or line.startswith("#") or line.startswith("-") or line.startswith("--"):
            continue

        # Strip inline comments and environment markers (; python_version >= '3.8')
        line = line.split("#")[0].split(";")[0].strip()
        if not line:
            continue

        # Check for comparison operators: ==, >=, ~=, <=, etc.
        match = OPERATOR_SPLIT_RE.search(line)
        if match:
            op = match.group(1)
            parts = line.split(op, 1)
            pkg_name = parts[0].strip()
            ver = parts[1].strip()
            if pkg_name:
                deps.append(
                    ParsedDependency(
                        name=pkg_name,
                        version=ver,
                        file_path=rel_path,
                        ecosystem="PyPI",
                        line_number=idx,
                        is_lockfile=False,
                    )
                )
        else:
            # Unpinned package name without explicit operator
            pkg_name = line.strip()
            if pkg_name and re.match(r'^[a-zA-Z0-9_\-\.]+$', pkg_name):
                deps.append(
                    ParsedDependency(
                        name=pkg_name,
                        version="*",
                        file_path=rel_path,
                        ecosystem="PyPI",
                        line_number=idx,
                        is_lockfile=False,
                    )
                )

    return deps


def parse_package_json(content: str, rel_path: str) -> List[ParsedDependency]:
    deps: List[ParsedDependency] = []
    try:
        data = json.loads(content)
        sections = ["dependencies", "devDependencies", "peerDependencies", "optionalDependencies"]
        for sec in sections:
            sec_dict = data.get(sec, {})
            if isinstance(sec_dict, dict):
                for pkg_name, ver_spec in sec_dict.items():
                    if isinstance(ver_spec, str):
                        # Filter out git/file links
                        if any(ver_spec.startswith(p) for p in ("git+", "git://", "http://", "https://", "file:", "link:")):
                            continue
                        deps.append(
                            ParsedDependency(
                                name=pkg_name,
                                version=ver_spec,
                                file_path=rel_path,
                                ecosystem="npm",
                                line_number=None,
                                is_lockfile=False,
                            )
                        )
    except Exception as e:
        logger.debug(f"Failed to parse package.json at {rel_path}: {e}")
    return deps


def parse_package_lock_json(content: str, rel_path: str) -> List[ParsedDependency]:
    deps: List[ParsedDependency] = []
    try:
        data = json.loads(content)
        # npm lockfile v2/v3 has "packages"
        if "packages" in data and isinstance(data["packages"], dict):
            for path_key, meta in data["packages"].items():
                if not path_key:
                    continue  # root package
                # node_modules/packageName or node_modules/@scope/packageName
                if "node_modules/" in path_key and isinstance(meta, dict):
                    pkg_name = path_key.split("node_modules/")[-1]
                    ver = meta.get("version")
                    if pkg_name and ver:
                        deps.append(
                            ParsedDependency(
                                name=pkg_name,
                                version=ver,
                                file_path=rel_path,
                                ecosystem="npm",
                                is_lockfile=True,
                            )
                        )

        # npm lockfile v1 has "dependencies"
        if "dependencies" in data and isinstance(data["dependencies"], dict):
            for pkg_name, meta in data["dependencies"].items():
                if isinstance(meta, dict) and "version" in meta:
                    ver = meta["version"]
                    deps.append(
                        ParsedDependency(
                            name=pkg_name,
                            version=ver,
                            file_path=rel_path,
                            ecosystem="npm",
                            is_lockfile=True,
                        )
                    )
    except Exception as e:
        logger.debug(f"Failed to parse package-lock.json at {rel_path}: {e}")
    return deps


def parse_pipfile(content: str, rel_path: str) -> List[ParsedDependency]:
    deps: List[ParsedDependency] = []
    current_sec = None
    for idx, line in enumerate(content.splitlines(), start=1):
        s = line.strip()
        if s.startswith("[") and s.endswith("]"):
            current_sec = s[1:-1].lower()
            continue
        if current_sec in ("packages", "dev-packages") and "=" in s and not s.startswith("#"):
            parts = s.split("=", 1)
            name = parts[0].strip().strip('"\'')
            val = parts[1].strip().strip('"\'')
            if name:
                deps.append(
                    ParsedDependency(
                        name=name,
                        version=val,
                        file_path=rel_path,
                        ecosystem="PyPI",
                        line_number=idx,
                        is_lockfile=False,
                    )
                )
    return deps


def parse_pipfile_lock(content: str, rel_path: str) -> List[ParsedDependency]:
    deps: List[ParsedDependency] = []
    try:
        data = json.loads(content)
        for sec in ("default", "develop"):
            sec_dict = data.get(sec, {})
            if isinstance(sec_dict, dict):
                for name, meta in sec_dict.items():
                    if isinstance(meta, dict):
                        ver = meta.get("version", "")
                        deps.append(
                            ParsedDependency(
                                name=name,
                                version=ver,
                                file_path=rel_path,
                                ecosystem="PyPI",
                                is_lockfile=True,
                            )
                        )
    except Exception:
        pass
    return deps


def parse_poetry_lock(content: str, rel_path: str) -> List[ParsedDependency]:
    deps: List[ParsedDependency] = []
    name = None
    version = None
    for line in content.splitlines():
        s = line.strip()
        if s.startswith("[[package]]"):
            if name and version:
                deps.append(
                    ParsedDependency(
                        name=name,
                        version=version,
                        file_path=rel_path,
                        ecosystem="PyPI",
                        is_lockfile=True,
                    )
                )
            name, version = None, None
        elif s.startswith("name ="):
            name = s.split("=", 1)[1].strip().strip('"\'')
        elif s.startswith("version ="):
            version = s.split("=", 1)[1].strip().strip('"\'')

    if name and version:
        deps.append(
            ParsedDependency(
                name=name,
                version=version,
                file_path=rel_path,
                ecosystem="PyPI",
                is_lockfile=True,
            )
        )
    return deps


def parse_go_mod(content: str, rel_path: str) -> List[ParsedDependency]:
    deps: List[ParsedDependency] = []
    in_require = False
    for idx, line in enumerate(content.splitlines(), start=1):
        s = line.strip()
        if s.startswith("require ("):
            in_require = True
            continue
        if in_require and s == ")":
            in_require = False
            continue
        if in_require or s.startswith("require "):
            target = s.replace("require ", "").strip()
            parts = target.split()
            if len(parts) >= 2:
                name, ver = parts[0], parts[1]
                deps.append(
                    ParsedDependency(
                        name=name,
                        version=ver,
                        file_path=rel_path,
                        ecosystem="Go",
                        line_number=idx,
                    )
                )
    return deps


def discover_all_dependencies(project_path: str) -> List[ParsedDependency]:
    """
    Crawls project repository and parses all manifests and lockfiles.
    Supports:
    - requirements.txt, requirements-*.txt, Pipfile, Pipfile.lock, poetry.lock, pyproject.toml
    - package.json, package-lock.json, yarn.lock, pnpm-lock.yaml
    - go.mod
    """
    all_deps: List[ParsedDependency] = []
    seen = set()

    for root, dirs, files in os.walk(project_path):
        # Ignore common non-source directories
        dirs[:] = [d for d in dirs if d not in {".git", "node_modules", "venv", ".venv", "__pycache__", "dist", "build", ".next", ".cache"}]
        for file_name in files:
            full_path = os.path.join(root, file_name)
            rel_path = os.path.relpath(full_path, project_path).replace("\\", "/")
            fn_lower = file_name.lower()

            try:
                # 1. Python requirements
                if fn_lower == "requirements.txt" or (fn_lower.startswith("requirements") and fn_lower.endswith(".txt")):
                    with open(full_path, "r", encoding="utf-8", errors="ignore") as fp:
                        parsed = parse_requirements_txt(fp.read(), rel_path)
                        for d in parsed:
                            key = (d.name.lower(), d.clean_version, d.file_path)
                            if key not in seen:
                                seen.add(key)
                                all_deps.append(d)

                # 2. Node.js package.json (manifest)
                elif fn_lower == "package.json":
                    with open(full_path, "r", encoding="utf-8", errors="ignore") as fp:
                        parsed = parse_package_json(fp.read(), rel_path)
                        for d in parsed:
                            key = (d.name.lower(), d.clean_version, d.file_path)
                            if key not in seen:
                                seen.add(key)
                                all_deps.append(d)

                # 3. Node.js package-lock.json (lockfile)
                elif fn_lower == "package-lock.json":
                    with open(full_path, "r", encoding="utf-8", errors="ignore") as fp:
                        parsed = parse_package_lock_json(fp.read(), rel_path)
                        for d in parsed:
                            key = (d.name.lower(), d.clean_version, d.file_path)
                            if key not in seen:
                                seen.add(key)
                                all_deps.append(d)

                # 4. Pipfile & Pipfile.lock
                elif fn_lower == "pipfile":
                    with open(full_path, "r", encoding="utf-8", errors="ignore") as fp:
                        for d in parse_pipfile(fp.read(), rel_path):
                            all_deps.append(d)
                elif fn_lower == "pipfile.lock":
                    with open(full_path, "r", encoding="utf-8", errors="ignore") as fp:
                        for d in parse_pipfile_lock(fp.read(), rel_path):
                            all_deps.append(d)

                # 5. Poetry lock
                elif fn_lower == "poetry.lock":
                    with open(full_path, "r", encoding="utf-8", errors="ignore") as fp:
                        for d in parse_poetry_lock(fp.read(), rel_path):
                            all_deps.append(d)

                # 6. Go mod
                elif fn_lower == "go.mod":
                    with open(full_path, "r", encoding="utf-8", errors="ignore") as fp:
                        for d in parse_go_mod(fp.read(), rel_path):
                            all_deps.append(d)

            except Exception as e:
                logger.warning(f"Error reading dependency file {rel_path}: {e}")

    return all_deps
