from sqlalchemy import Column, String, Integer, DateTime, JSON, Enum as SAEnum
from sqlalchemy.orm import relationship
from app.core.database import Base
from datetime import datetime
import enum


class ScanStatus(str, enum.Enum):
    PENDING = "pending"
    SCANNING = "scanning"
    PROCESSING = "processing"
    AI_ANALYSIS = "ai_analysis"
    COMPLETED = "completed"
    FAILED = "failed"


class Scan(Base):
    __tablename__ = "scans"

    id = Column(String, primary_key=True, index=True)
    project_name = Column(String, nullable=False)
    project_description = Column(String, nullable=True)
    status = Column(SAEnum(ScanStatus), default=ScanStatus.PENDING)
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    scan_type = Column(String, default="initial")
    parent_scan_id = Column(String, nullable=True)

    gitleaks_output = Column(JSON, nullable=True)
    trivy_output = Column(JSON, nullable=True)
    osv_output = Column(JSON, nullable=True)

    total_findings = Column(Integer, default=0)
    critical_count = Column(Integer, default=0)
    high_count = Column(Integer, default=0)
    medium_count = Column(Integer, default=0)
    low_count = Column(Integer, default=0)

    error_message = Column(String, nullable=True)
    scanner_errors = Column(JSON, nullable=True)

    findings = relationship("Finding", back_populates="scan")
    reports = relationship("Report", back_populates="scan")

