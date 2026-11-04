from typing import List, Dict


def compare_scans(original: List[Dict], new: List[Dict]) -> Dict:
    orig_fps = {f.get("fingerprint"): f for f in original if f.get("fingerprint")}
    new_fps = {f.get("fingerprint"): f for f in new if f.get("fingerprint")}

    resolved, unresolved, new_issues = [], [], []

    for fp, f in orig_fps.items():
        item = {**f, "verification_status": "unresolved" if fp in new_fps else "resolved"}
        (unresolved if fp in new_fps else resolved).append(item)

    for fp, f in new_fps.items():
        if fp not in orig_fps:
            new_issues.append({**f, "verification_status": "new"})

    total = len(original)
    resolved_count = len(resolved)
    return {
        "resolved": resolved,
        "unresolved": unresolved,
        "new": new_issues,
        "summary": {
            "total_original": total,
            "resolved_count": resolved_count,
            "unresolved_count": len(unresolved),
            "new_count": len(new_issues),
            "resolution_rate": round((resolved_count / total * 100) if total > 0 else 0, 1),
        },
    }

