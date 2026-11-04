from typing import Dict

SECRET_RULE_CWE = {
    "aws": "CWE-798",
    "github": "CWE-798",
    "private-key": "CWE-321",
    "api-key": "CWE-798",
    "password": "CWE-259",
    "generic": "CWE-798",
}


def enrich_finding(finding: Dict) -> Dict:
    finding = finding.copy()

    if finding.get("category") == "secret" and not finding.get("cwe_id"):
        fp = (finding.get("fingerprint") or "").lower()
        title = (finding.get("title") or "").lower()
        for pattern, cwe in SECRET_RULE_CWE.items():
            if pattern in fp or pattern in title:
                finding["cwe_id"] = cwe
                break
        if not finding.get("cwe_id"):
            finding["cwe_id"] = "CWE-798"

    if not finding.get("reference_urls"):
        finding["reference_urls"] = []

    if finding.get("cve_id"):
        cve_url = f"https://nvd.nist.gov/vuln/detail/{finding['cve_id']}"
        urls = finding["reference_urls"] or []
        if cve_url not in urls:
            finding["reference_urls"] = [cve_url] + urls

    return finding

