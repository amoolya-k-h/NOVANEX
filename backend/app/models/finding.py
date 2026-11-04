from sqlalchemy import Column, String, Integer, Float, DateTime, JSON, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.core.database import Base
from datetime import datetime


class Finding(Base):
    __tablename__ = "findings"

    id = Column(String, primary_key=True, index=True)
    scan_id = Column(String, ForeignKey("scans.id"), nullable=False)

    category = Column(String, nullable=False)
    scanner = Column(String, nullable=False)

    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    severity = Column(String, nullable=False)

    file_path = Column(String, nullable=True)
    line_number = Column(Integer, nullable=True)

    evidence = Column(String, nullable=True)
    evidence_redacted = Column(Boolean, default=False)

    risk_score = Column(Float, default=0.0)
    priority = Column(String, default="P4")
    risk_factors = Column(JSON, nullable=True)

    cve_id = Column(String, nullable=True)
    cwe_id = Column(String, nullable=True)
    cvss_score = Column(Float, nullable=True)
    fix_available = Column(Boolean, default=False)
    fixed_version = Column(String, nullable=True)
    reference_urls = Column(JSON, nullable=True)

    package_name = Column(String, nullable=True)
    package_version = Column(String, nullable=True)
    ecosystem = Column(String, nullable=True)

    ai_explanation = Column(String, nullable=True)
    ai_remediation = Column(String, nullable=True)
    ai_code_patch = Column(String, nullable=True)

    status = Column(String, default="open")
    verification_status = Column(String, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    fingerprint = Column(String, nullable=True, index=True)

    scan = relationship("Scan", back_populates="findings")

