from typing import Dict


def redact_finding(finding: Dict) -> Dict:
    if finding.get("category") != "secret":
        return finding
    finding = finding.copy()
    ev = finding.get("evidence", "")
    if ev and len(ev) > 8:
        finding["evidence"] = ev[:4] + "***REDACTED***" + ev[-4:]
    elif ev:
        finding["evidence"] = "***REDACTED***"
    finding["evidence_redacted"] = True
    return finding


def redact_for_ai(finding: Dict) -> Dict:
    finding = redact_finding(finding.copy())
    if finding.get("category") == "secret":
        finding["evidence"] = "***REDACTED FOR AI PROCESSING***"
    return finding

