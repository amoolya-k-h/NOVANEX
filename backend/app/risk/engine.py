from typing import Dict, List

SEVERITY_SCORES = {"CRITICAL": 40, "HIGH": 30, "MEDIUM": 15, "LOW": 5, "INFO": 1}
CATEGORY_BONUS = {"secret": 20, "dependency": 10, "misconfiguration": 5}
FIX_MODIFIER = {True: 10, False: -5, None: 0}
CVSS_BONUS = [(9.0, 15), (7.0, 10), (5.0, 5), (0.0, 0)]
PRIORITY_THRESHOLDS = [(70, "P1"), (50, "P2"), (30, "P3"), (0, "P4")]


def calculate_risk_score(finding: Dict):
    score = 0
    factors = {}

    sev = finding.get("severity", "LOW")
    s = SEVERITY_SCORES.get(sev, 5)
    score += s
    factors["severity"] = {"value": sev, "score": s}

    cat = finding.get("category", "")
    c = CATEGORY_BONUS.get(cat, 0)
    score += c
    factors["category"] = {"value": cat, "score": c}

    cvss = finding.get("cvss_score")
    if cvss:
        cb = next((b for thresh, b in CVSS_BONUS if float(cvss) >= thresh), 0)
        score += cb
        factors["cvss"] = {"value": cvss, "score": cb}

    fix = finding.get("fix_available")
    fm = FIX_MODIFIER.get(fix, 0)
    score += fm
    factors["fix_available"] = {"value": fix, "score": fm}

    fp = (finding.get("file_path") or "").lower()
    if finding.get("category") == "secret" and any(k in fp for k in (".env", "config", "settings", "credential", "secret")):
        score += 10
        factors["sensitive_file"] = {"value": fp, "score": 10}

    priority = "P4"
    for thresh, p in PRIORITY_THRESHOLDS:
        if score >= thresh:
            priority = p
            break

    return score, priority, factors


def prioritize_findings(findings: List[Dict]) -> List[Dict]:
    for f in findings:
        score, priority, factors = calculate_risk_score(f)
        f["risk_score"] = score
        f["priority"] = priority
        f["risk_factors"] = factors

    porder = {"P1": 0, "P2": 1, "P3": 2, "P4": 3}
    return sorted(findings, key=lambda f: (porder.get(f["priority"], 4), -f["risk_score"]))

