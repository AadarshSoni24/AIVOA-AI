import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    String,
    Text,
    Boolean,
    Integer,
    Float,
    DateTime,
    ForeignKey,
    JSON
)
from sqlalchemy.orm import relationship
from database import Base

def generate_uuid() -> str:
    return str(uuid.uuid4())

def get_utc_now() -> datetime:
    return datetime.now(timezone.utc)

class Investigation(Base):
    __tablename__ = "investigations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    investigation_number = Column(String(50), unique=True, index=True, nullable=False)
    title = Column(String(255), nullable=False)
    status = Column(String(50), default="draft")  # draft, in_progress, completed, closed
    description = Column(Text, nullable=True)
    source_type = Column(String(50), default="manual")  # manual, pdf, email, text

    # Incident Details
    incident_date = Column(String(50), nullable=True)
    incident_location = Column(String(100), nullable=True)
    incident_category = Column(String(100), nullable=True)
    detection_method = Column(String(100), nullable=True)

    # Product & Batch Details
    product_name = Column(String(150), nullable=True)
    product_strength = Column(String(50), nullable=True)
    batch_number = Column(String(50), nullable=True)
    manufacturing_date = Column(String(50), nullable=True)
    expiry_date = Column(String(50), nullable=True)
    affected_quantity = Column(String(50), nullable=True)
    affected_unit = Column(String(50), nullable=True)

    # Impact & Containment
    impact_severity = Column(String(50), default="major")  # critical, major, minor, cosmetic
    impact_scope = Column(Text, nullable=True)
    containment_actions = Column(Text, nullable=True)
    immediate_actions_taken = Column(Text, nullable=True)

    # Investigation Metadata
    investigator_name = Column(String(100), default="Quality Engineer")
    investigation_start_date = Column(String(50), nullable=True)
    investigation_method = Column(String(50), default="both")  # five_whys, fishbone, both

    # AI Reasoning & Copilot Output
    ai_risk_assessment = Column(JSON, default=dict)
    ai_summary = Column(Text, nullable=True)
    ai_confidence_score = Column(Float, default=0.0)
    provenance_map = Column(JSON, default=dict)  # field_name -> {source, confidence, evidence_ref}

    # Timestamps
    created_at = Column(DateTime, default=get_utc_now)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now)

    # Relationships
    root_causes = relationship("RootCause", back_populates="investigation", cascade="all, delete-orphan", lazy="selectin")
    why_steps = relationship("WhyStep", back_populates="investigation", cascade="all, delete-orphan", lazy="selectin")
    capa_actions = relationship("CAPAAction", back_populates="investigation", cascade="all, delete-orphan", lazy="selectin")
    evidence_items = relationship("EvidenceItem", back_populates="investigation", cascade="all, delete-orphan", lazy="selectin")
    documents = relationship("Document", back_populates="investigation", cascade="all, delete-orphan", lazy="selectin")
    audit_events = relationship("AuditEvent", back_populates="investigation", cascade="all, delete-orphan", lazy="selectin")


class RootCause(Base):
    __tablename__ = "root_causes"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    investigation_id = Column(String(36), ForeignKey("investigations.id", ondelete="CASCADE"), nullable=False)
    cause_text = Column(Text, nullable=False)
    cause_category = Column(String(50), default="method")  # man, machine, material, method, measurement, mother_nature
    likelihood = Column(String(50), default="medium")  # high, medium, low
    is_confirmed = Column(Boolean, default=False)
    confirmed_by = Column(String(100), nullable=True)
    evidence_supporting = Column(Text, nullable=True)
    evidence_contradicting = Column(Text, nullable=True)
    missing_evidence = Column(Text, nullable=True)
    verification_steps = Column(Text, nullable=True)
    status = Column(String(50), default="hypothesis")  # hypothesis, under_investigation, evidence_supported, human_confirmed, rejected
    source = Column(String(50), default="ai_suggested")  # ai_suggested, manual, extracted
    order_index = Column(Integer, default=0)

    investigation = relationship("Investigation", back_populates="root_causes")


class WhyStep(Base):
    __tablename__ = "why_steps"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    investigation_id = Column(String(36), ForeignKey("investigations.id", ondelete="CASCADE"), nullable=False)
    step_number = Column(Integer, nullable=False)  # 1 to 5
    question = Column(Text, nullable=False)
    answer = Column(Text, nullable=False)
    evidence = Column(Text, nullable=True)
    source = Column(String(50), default="ai_suggested")

    investigation = relationship("Investigation", back_populates="why_steps")


class CAPAAction(Base):
    __tablename__ = "capa_actions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    investigation_id = Column(String(36), ForeignKey("investigations.id", ondelete="CASCADE"), nullable=False)
    action_type = Column(String(50), default="corrective")  # corrective, preventive
    description = Column(Text, nullable=False)
    rationale = Column(Text, nullable=True)
    related_root_cause = Column(Text, nullable=True)
    responsible_person = Column(String(100), default="QA Manager")
    responsible_department = Column(String(100), default="Quality Assurance")
    target_date = Column(String(50), nullable=True)
    priority = Column(String(50), default="medium")  # high, medium, low
    status = Column(String(50), default="proposed")  # proposed, in_progress, completed, verified
    effectiveness_verification = Column(Text, nullable=True)
    source = Column(String(50), default="ai_suggested")

    investigation = relationship("Investigation", back_populates="capa_actions")


class EvidenceItem(Base):
    __tablename__ = "evidence_items"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    investigation_id = Column(String(36), ForeignKey("investigations.id", ondelete="CASCADE"), nullable=False)
    evidence_type = Column(String(50), default="observation")  # document, observation, test_result, interview, batch_record
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    relevance = Column(String(50), default="high")
    source_quote = Column(Text, nullable=True)
    source = Column(String(50), default="extracted")

    investigation = relationship("Investigation", back_populates="evidence_items")


class Document(Base):
    __tablename__ = "documents"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    investigation_id = Column(String(36), ForeignKey("investigations.id", ondelete="CASCADE"), nullable=False)
    filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=True)
    content_type = Column(String(100), default="application/pdf")
    extracted_text = Column(Text, nullable=True)
    uploaded_at = Column(DateTime, default=get_utc_now)

    investigation = relationship("Investigation", back_populates="documents")


class AuditEvent(Base):
    __tablename__ = "audit_events"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    investigation_id = Column(String(36), ForeignKey("investigations.id", ondelete="CASCADE"), nullable=False)
    event_type = Column(String(50), nullable=False)  # create, edit, confirm_cause, reject_cause, save
    field_name = Column(String(100), nullable=True)
    old_value = Column(Text, nullable=True)
    new_value = Column(Text, nullable=True)
    changed_by = Column(String(100), default="AI Co-Pilot")
    timestamp = Column(DateTime, default=get_utc_now)

    investigation = relationship("Investigation", back_populates="audit_events")

