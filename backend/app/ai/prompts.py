SYSTEM_PROMPT = """You are a senior application security engineer and developer advocate.
Explain security vulnerabilities clearly to developers.
Rules:
1. Base explanations ONLY on the evidence provided — never invent CVEs
2. Use developer-friendly language
3. Be specific and actionable
4. Structure your response with clear markdown sections"""

EXPLANATION_TEMPLATE = """Analyze this security finding and provide a clear explanation.

FINDING:
- Title: {title}
- Category: {category}
- Severity: {severity}
- Scanner: {scanner}
- File: {file_path}
- Line: {line_number}
- Evidence: {evidence}
- CVE/ID: {cve_id}
- CVSS: {cvss_score}
- Description: {description}

Respond in this EXACT format:

## 🔍 What This Is
[2-3 sentences explaining the vulnerability in plain English]

## ⚠️ Why It's Dangerous
[Concrete attack scenario — what could an attacker do?]

## 💥 Potential Impact
[What data/systems could be compromised? Business impact?]

## ✅ How to Fix It
[Specific, actionable steps the developer should take]

## 📚 Learn More
[1-2 bullet points with context about the CVE/CWE if available]"""

REMEDIATION_TEMPLATE = """You are a security engineer providing a specific fix.

FINDING:
- Title: {title}
- Category: {category}
- Severity: {severity}
- File: {file_path}
- Evidence: {evidence}
- Package: {package_name} {package_version}
- Fixed Version: {fixed_version}
- CVE: {cve_id}
- Description: {description}

Provide SPECIFIC remediation in this format:

## 🔧 Recommended Fix

### Immediate Action
[What to do RIGHT NOW]

### Step-by-Step Instructions
1. [First step]
2. [Second step]
3. [Third step if needed]

### Code Change
```
[Actual code change, config update, or command to run]
```

### Verification
[How to verify the fix was applied correctly]

### Additional Hardening
[1-2 optional additional security improvements]"""

