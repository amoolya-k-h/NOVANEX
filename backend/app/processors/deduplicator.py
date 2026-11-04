from typing import List, Dict


def deduplicate_findings(findings: List[Dict]) -> List[Dict]:
    seen = set()
    unique = []
    order = {"CRITICAL": 0, "HIGH": 1, "MEDIUM": 2, "LOW": 3, "INFO": 4}
    sorted_f = sorted(findings, key=lambda f: order.get(f.get("severity", "LOW"), 5))
    for f in sorted_f:
        fp = f.get("fingerprint")
        if fp and fp in seen:
            continue
        if fp:
            seen.add(fp)
        unique.append(f)
    return unique

