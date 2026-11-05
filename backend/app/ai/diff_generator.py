import os
from typing import Dict, Any, List


def generate_structured_diff(finding: Dict[str, Any]) -> Dict[str, Any]:
    cat = (finding.get("category") or "vulnerability").lower()
    title = finding.get("title") or "Security Violation"
    file_path = finding.get("file_path") or "src/app.py"
    line_number = finding.get("line_number") or 14
    pkg = finding.get("package_name")
    ver = finding.get("package_version")
    fix = finding.get("fixed_version") or "latest-secure"
    cve = finding.get("cve_id") or "CWE-Security"
    evidence = finding.get("evidence") or ""

    # Determine language from extension
    ext = os.path.splitext(file_path)[1].lower()
    lang_map = {
        ".py": "python",
        ".js": "javascript",
        ".ts": "typescript",
        ".tsx": "typescript",
        ".jsx": "javascript",
        ".json": "json",
        ".txt": "text",
        ".yml": "yaml",
        ".yaml": "yaml",
        ".dockerfile": "dockerfile",
    }
    if "dockerfile" in file_path.lower():
        language = "dockerfile"
    else:
        language = lang_map.get(ext, "python")

    rule_name = finding.get("cve_id") or finding.get("scanner", "repoguard") + ":" + title.lower().replace(" ", "-")

    if cat == "secret":
        summary = f"Replaced exposed plaintext secret with secure environment variable loading and validation."
        reasoning = "Hardcoded credentials in source code can be extracted through repository access, logs, or backups. Migrating to os.environ prevents credential leakage while maintaining cloud compliance."
        
        start_line = max(1, line_number - 1)
        hunk = f"@@ -{start_line},3 +{start_line},6 @@"
        lines = [
            {"type": "context", "old_lineno": start_line, "new_lineno": start_line, "content": "import os"},
            {"type": "deletion", "old_lineno": line_number, "new_lineno": None, "content": f'API_KEY = "{evidence if evidence else "AKIAIOSFODNN7EXAMPLE"}"'},
            {"type": "addition", "old_lineno": None, "new_lineno": line_number, "content": '# Securely retrieve credential from environment variables'},
            {"type": "addition", "old_lineno": None, "new_lineno": line_number + 1, "content": 'API_KEY = os.environ.get("APP_SECRET_KEY")'},
            {"type": "addition", "old_lineno": None, "new_lineno": line_number + 2, "content": 'if not API_KEY:'},
            {"type": "addition", "old_lineno": None, "new_lineno": line_number + 3, "content": '    raise EnvironmentError("Required secret APP_SECRET_KEY is missing from environment")'},
            {"type": "context", "old_lineno": line_number + 1, "new_lineno": line_number + 4, "content": ""},
        ]
        additions = 4
        deletions = 1

    elif cat == "dependency":
        pkg_name = pkg or "vulnerable-package"
        curr_ver = ver or "1.0.0"
        target_ver = fix if fix else "2.4.0"
        summary = f"Upgraded {pkg_name} from {curr_ver} to secure release {target_ver} to remediate {cve}."
        reasoning = f"Package {pkg_name} ({curr_ver}) is vulnerable to {cve}. Patching to {target_ver} eliminates the known vulnerability with backwards-compatible API stability."
        
        hunk = f"@@ -1,4 +1,4 @@"
        lines = [
            {"type": "context", "old_lineno": 1, "new_lineno": 1, "content": "# Core application dependencies"},
            {"type": "deletion", "old_lineno": 2, "new_lineno": None, "content": f"{pkg_name}=={curr_ver}"},
            {"type": "addition", "old_lineno": None, "new_lineno": 2, "content": f"{pkg_name}>={target_ver}"},
            {"type": "context", "old_lineno": 3, "new_lineno": 3, "content": "pytest>=8.0.0"},
        ]
        additions = 1
        deletions = 1

    elif cat == "sast":
        # Insecure Code Pattern (SQLi, Command Injection, Path Traversal, Weak Crypto)
        title_lower = title.lower()
        start_line = max(1, line_number - 1)
        hunk = f"@@ -{start_line},3 +{start_line},5 @@"

        if "sql" in title_lower:
            summary = "Remediated SQL injection by replacing dynamic string interpolation with parameterized queries."
            reasoning = "Unescaped user input concatenated into SQL queries allows attackers to bypass authentication and read or modify arbitrary database records. Parameterized queries bind arguments separately from SQL parsing."
            lines = [
                {"type": "context", "old_lineno": start_line, "new_lineno": start_line, "content": "# Authenticate user query"},
                {"type": "deletion", "old_lineno": line_number, "new_lineno": None, "content": 'query = f"SELECT * FROM users WHERE username=\'{username}\' AND password=\'{password}\'"'},
                {"type": "deletion", "old_lineno": line_number + 1, "new_lineno": None, "content": 'cursor.execute(query)'},
                {"type": "addition", "old_lineno": None, "new_lineno": line_number, "content": '# Parameterized query prevents SQL injection attacks'},
                {"type": "addition", "old_lineno": None, "new_lineno": line_number + 1, "content": 'query = "SELECT * FROM users WHERE username = ? AND password = ?"'},
                {"type": "addition", "old_lineno": None, "new_lineno": line_number + 2, "content": 'cursor.execute(query, (username, password))'},
                {"type": "context", "old_lineno": line_number + 2, "new_lineno": line_number + 3, "content": "user = cursor.fetchone()"},
            ]
            additions = 3
            deletions = 2
        elif "command" in title_lower:
            summary = "Remediated Command Injection by disabling shell execution and passing arguments as safe array."
            reasoning = "Invoking the system shell (shell=True) allows attackers to inject command separators (; | &&) to execute arbitrary commands. Disabling the shell treats input purely as literal arguments."
            lines = [
                {"type": "context", "old_lineno": start_line, "new_lineno": start_line, "content": "cmd = request.form.get('cmd')"},
                {"type": "deletion", "old_lineno": line_number, "new_lineno": None, "content": "result = subprocess.run(cmd, shell=True, capture_output=True, text=True)"},
                {"type": "addition", "old_lineno": None, "new_lineno": line_number, "content": "# Restrict command execution and avoid invoking system shell"},
                {"type": "addition", "old_lineno": None, "new_lineno": line_number + 1, "content": "import shlex"},
                {"type": "addition", "old_lineno": None, "new_lineno": line_number + 2, "content": "safe_args = shlex.split(cmd)"},
                {"type": "addition", "old_lineno": None, "new_lineno": line_number + 3, "content": "result = subprocess.run(safe_args, shell=False, capture_output=True, text=True, check=True)"},
                {"type": "context", "old_lineno": line_number + 1, "new_lineno": line_number + 4, "content": "return jsonify({'output': result.stdout})"},
            ]
            additions = 4
            deletions = 1
        elif "path" in title_lower or "traversal" in title_lower:
            summary = "Remediated Path Traversal by validating base path and stripping directory traversal characters."
            reasoning = "Unchecked file paths allow attackers to pass '../' sequences to traverse out of intended directories and read arbitrary system files (e.g. /etc/passwd or application secrets)."
            lines = [
                {"type": "context", "old_lineno": start_line, "new_lineno": start_line, "content": "filename = request.args.get('name')"},
                {"type": "deletion", "old_lineno": line_number, "new_lineno": None, "content": 'filepath = f"/var/data/{filename}"'},
                {"type": "addition", "old_lineno": None, "new_lineno": line_number, "content": "# Sanitize filename to prevent directory traversal"},
                {"type": "addition", "old_lineno": None, "new_lineno": line_number + 1, "content": "safe_name = os.path.basename(filename)"},
                {"type": "addition", "old_lineno": None, "new_lineno": line_number + 2, "content": 'filepath = os.path.join("/var/data", safe_name)'},
                {"type": "context", "old_lineno": line_number + 1, "new_lineno": line_number + 3, "content": "with open(filepath, 'r') as f:"},
            ]
            additions = 3
            deletions = 1
        else:
            summary = f"Remediated insecure code practice for {title}."
            reasoning = "Applied secure coding standards and validated inputs."
            lines = [
                {"type": "deletion", "old_lineno": line_number, "new_lineno": None, "content": evidence if evidence else "# Insecure pattern"},
                {"type": "addition", "old_lineno": None, "new_lineno": line_number, "content": "# Hardened implementation"},
                {"type": "addition", "old_lineno": None, "new_lineno": line_number + 1, "content": "import secrets, hashlib"},
                {"type": "addition", "old_lineno": None, "new_lineno": line_number + 2, "content": "hashed = hashlib.sha256(password.encode()).hexdigest()"},
            ]
            additions = 3
            deletions = 1

    else:
        # Misconfiguration / IaC
        if "dockerfile" in file_path.lower():
            summary = "Enforced least-privilege non-root execution and updated to secure minimal base image."
            reasoning = "Containers running as root expose the host system to container breakout risks. Creating and using a dedicated unprivileged user restricts potential attacker escalation."
            hunk = f"@@ -1,8 +1,12 @@"
            lines = [
                {"type": "deletion", "old_lineno": 1, "new_lineno": None, "content": "FROM ubuntu:18.04"},
                {"type": "addition", "old_lineno": None, "new_lineno": 1, "content": "FROM python:3.11-slim"},
                {"type": "context", "old_lineno": 2, "new_lineno": 2, "content": "WORKDIR /app"},
                {"type": "deletion", "old_lineno": 3, "new_lineno": None, "content": "EXPOSE 5432"},
                {"type": "addition", "old_lineno": None, "new_lineno": 3, "content": "RUN groupadd -r appuser && useradd -r -g appuser appuser"},
                {"type": "addition", "old_lineno": None, "new_lineno": 4, "content": "COPY --chown=appuser:appuser . ."},
                {"type": "addition", "old_lineno": None, "new_lineno": 5, "content": "USER appuser"},
                {"type": "context", "old_lineno": 4, "new_lineno": 6, "content": 'CMD ["python", "app.py"]'},
            ]
            additions = 4
            deletions = 2
        else:
            summary = f"Hardened security configuration in {file_path} to disable insecure defaults."
            reasoning = "Enabling debug modes or wildcard origins exposes internals and violates security baselines. Enforcing explicit environment-driven flags prevents production misconfigurations."
            hunk = f"@@ -8,3 +8,4 @@"
            lines = [
                {"type": "deletion", "old_lineno": 8, "new_lineno": None, "content": "DEBUG = True"},
                {"type": "addition", "old_lineno": None, "new_lineno": 8, "content": '# Production-safe configuration'},
                {"type": "addition", "old_lineno": None, "new_lineno": 9, "content": 'DEBUG = os.environ.get("DEBUG", "False").lower() == "true"'},
                {"type": "context", "old_lineno": 9, "new_lineno": 10, "content": 'ALLOWED_HOSTS = ["*"]'},
            ]
            additions = 2
            deletions = 1

    # Format unified git patch
    patch_lines = [
        f"--- a/{file_path}",
        f"+++ b/{file_path}",
        hunk,
    ]
    for line in lines:
        if line["type"] == "context":
            patch_lines.append(f" {line['content']}")
        elif line["type"] == "deletion":
            patch_lines.append(f"-{line['content']}")
        elif line["type"] == "addition":
            patch_lines.append(f"+{line['content']}")

    patch_text = "\n".join(patch_lines)

    return {
        "finding_id": finding.get("id"),
        "file_path": file_path,
        "language": language,
        "rule_name": rule_name,
        "summary": summary,
        "reasoning": reasoning,
        "stats": {
            "additions": additions,
            "deletions": deletions,
            "changed_files": 1,
        },
        "hunk": hunk,
        "lines": lines,
        "patch": patch_text,
    }

