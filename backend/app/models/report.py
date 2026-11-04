from sqlalchemy import Column, String, DateTime, JSON, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base
from datetime import datetime


class Report(Base):
    __tablename__ = "reports"

    id = Column(String, primary_key=True, index=True)
    scan_id = Column(String, ForeignKey("scans.id"), nullable=False)
    report_type = Column(String, default="json")
    file_path = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    summary = Column(JSON, nullable=True)

    scan = relationship("Scan", back_populates="reports")

