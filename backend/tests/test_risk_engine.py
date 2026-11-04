import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.risk.engine import calculate_risk_score, prioritize_findings


def test_critical_secret_gets_p1_or_p2():
    finding = {
        "severity": "CRITICAL",
        "category": "secret",
        "fix_available": True,
        "cvss_score": None,
        "file_path": ".env"
    }
    score, priority, factors = calculate_risk_score(finding)
    assert priority in ("P1", "P2"), f"Expected P1 or P2, got {priority}"
    assert score >= 60, f"Expected score >= 60, got {score}"
    print(f"[OK] test_critical_secret passed (score={score}, priority={priority})")


def test_low_misconfig_gets_p3_or_p4():
    finding = {
        "severity": "LOW",
        "category": "misconfiguration",
        "fix_available": False,
        "cvss_score": None,
        "file_path": "some_file.yaml"
    }
    score, priority, factors = calculate_risk_score(finding)
    assert priority in ("P3", "P4"), f"Expected P3 or P4, got {priority}"
    print(f"[OK] test_low_misconfig passed (score={score}, priority={priority})")


def test_prioritize_sorts_by_priority():
    findings = [
        {"severity": "LOW", "category": "misconfiguration", "fix_available": False, "cvss_score": None, "file_path": "f"},
        {"severity": "CRITICAL", "category": "secret", "fix_available": True, "cvss_score": 9.5, "file_path": ".env"},
    ]
    result = prioritize_findings(findings)
    assert result[0]["severity"] == "CRITICAL", "Highest severity should be first"
    assert result[0]["priority"] in ("P1", "P2"), "First priority should be P1/P2"
    print(f"[OK] test_prioritize passed (first={result[0]['priority']})")


if __name__ == "__main__":
    test_critical_secret_gets_p1_or_p2()
    test_low_misconfig_gets_p3_or_p4()
    test_prioritize_sorts_by_priority()
    print("ALL RISK ENGINE UNIT TESTS PASSED!")
