from typing import Optional, List, Dict, Any, Literal
from datetime import datetime
from pydantic import BaseModel, Field

class FieldProvenance(BaseModel):
    field_name: str
    source: Literal["extracted", "ai_suggested", "reviewed", "confirmed"] = "ai_suggested"
    confidence: float = 0.95
    evidence_ref: Optional[str] = None
    last_updated: Optional[str] = None

class WhyStepBase(BaseModel):
    step_number: int
    question: str
    answer: str
    evidence: Optional[str] = None
    source: str = "ai_suggested"

class WhyStepCreate(WhyStepBase):
    pass

class WhyStepResponse(WhyStepBase):
    id: str
    investigation_id: str

    class Config:
        from_attributes = True

class RootCauseBase(BaseModel):
    cause_text: str
    cause_category: str = "method"  # man, machine, material, method, measurement, mother_nature
    likelihood: str = "medium"  # high, medium, low
    is_confirmed: bool = False
    confirmed_by: Optional[str] = None
    evidence_supporting: Optional[str] = None
    evidence_contradicting: Optional[str] = None
    missing_evidence: Optional[str] = None
    verification_steps: Optional[str] = None
    status: str = "hypothesis"  # hypothesis, under_investigation, evidence_supported, human_confirmed, rejected
    source: str = "ai_suggested"
    order_index: int = 0

class RootCauseCreate(RootCauseBase):
    pass

class RootCauseResponse(RootCauseBase):
    id: str
    investigation_id: str

    class Config:
        from_attributes = True

class CAPABase(BaseModel):
    action_type: str = "corrective"  # corrective, preventive
    description: str
    rationale: Optional[str] = None
    related_root_cause: Optional[str] = None
    responsible_person: Optional[str] = "QA Manager"
    responsible_department: Optional[str] = "Quality Assurance"
    target_date: Optional[str] = None
    priority: str = "medium"  # high, medium, low
    status: str = "proposed"  # proposed, in_progress, completed, verified
    effectiveness_verification: Optional[str] = None
    source: str = "ai_suggested"

class CAPACreate(CAPABase):
    pass

class CAPAResponse(CAPABase):
    id: str
    investigation_id: str

    class Config:
        from_attributes = True

class EvidenceItemBase(BaseModel):
    evidence_type: str = "observation"
    title: str
    description: Optional[str] = None
    relevance: str = "high"
    source_quote: Optional[str] = None
    source: str = "extracted"

class EvidenceItemCreate(EvidenceItemBase):
    pass

class EvidenceItemResponse(EvidenceItemBase):
    id: str
    investigation_id: str

    class Config:
        from_attributes = True

class DocumentResponse(BaseModel):
    id: str
    investigation_id: str
    filename: str
    content_type: str
    uploaded_at: datetime

    class Config:
        from_attributes = True

class AuditEventResponse(BaseModel):
    id: str
    investigation_id: str
    event_type: str
    field_name: Optional[str] = None
    old_value: Optional[str] = None
    new_value: Optional[str] = None
    changed_by: str
    timestamp: datetime

    class Config:
        from_attributes = True

class RiskAssessment(BaseModel):
    severity: str = "major"  # critical, major, minor, cosmetic
    potential_impact: Optional[str] = None
    immediate_containment: Optional[str] = None
    recommended_next_action: Optional[str] = None
    missing_information: Optional[List[str]] = Field(default_factory=list)
    risk_score: Optional[int] = 12  # 1 to 25

class InvestigationBase(BaseModel):
    investigation_number: str
    title: str
    status: str = "draft"
    description: Optional[str] = None
    source_type: str = "manual"

    incident_date: Optional[str] = None
    incident_location: Optional[str] = None
    incident_category: Optional[str] = None
    detection_method: Optional[str] = None

    product_name: Optional[str] = None
    product_strength: Optional[str] = None
    batch_number: Optional[str] = None
    manufacturing_date: Optional[str] = None
    expiry_date: Optional[str] = None
    affected_quantity: Optional[str] = None
    affected_unit: Optional[str] = None

    impact_severity: str = "major"
    impact_scope: Optional[str] = None
    containment_actions: Optional[str] = None
    immediate_actions_taken: Optional[str] = None

    investigator_name: Optional[str] = "Quality Engineer"
    investigation_start_date: Optional[str] = None
    investigation_method: str = "both"

    ai_risk_assessment: Optional[Dict[str, Any]] = Field(default_factory=dict)
    ai_summary: Optional[str] = None
    ai_confidence_score: float = 0.0
    provenance_map: Optional[Dict[str, Any]] = Field(default_factory=dict)

class InvestigationCreate(InvestigationBase):
    pass

class InvestigationUpdate(BaseModel):
    title: Optional[str] = None
    status: Optional[str] = None
    description: Optional[str] = None

    incident_date: Optional[str] = None
    incident_location: Optional[str] = None
    incident_category: Optional[str] = None
    detection_method: Optional[str] = None

    product_name: Optional[str] = None
    product_strength: Optional[str] = None
    batch_number: Optional[str] = None
    manufacturing_date: Optional[str] = None
    expiry_date: Optional[str] = None
    affected_quantity: Optional[str] = None
    affected_unit: Optional[str] = None

    impact_severity: Optional[str] = None
    impact_scope: Optional[str] = None
    containment_actions: Optional[str] = None
    immediate_actions_taken: Optional[str] = None

    investigator_name: Optional[str] = None
    investigation_method: Optional[str] = None

    ai_risk_assessment: Optional[Dict[str, Any]] = None
    ai_summary: Optional[str] = None
    ai_confidence_score: Optional[float] = None
    provenance_map: Optional[Dict[str, Any]] = None

class InvestigationResponse(InvestigationBase):
    id: str
    created_at: datetime
    updated_at: datetime
    root_causes: List[RootCauseResponse] = Field(default_factory=list)
    why_steps: List[WhyStepResponse] = Field(default_factory=list)
    capa_actions: List[CAPAResponse] = Field(default_factory=list)
    evidence_items: List[EvidenceItemResponse] = Field(default_factory=list)
    documents: List[DocumentResponse] = Field(default_factory=list)

    class Config:
        from_attributes = True

class InvestigationListItem(BaseModel):
    id: str
    investigation_number: str
    title: str
    status: str
    product_name: Optional[str] = None
    batch_number: Optional[str] = None
    impact_severity: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class CopilotMessage(BaseModel):
    role: Literal["user", "assistant", "system"]
    content: str
    tool_used: Optional[str] = None
    form_updates: Optional[Dict[str, Any]] = None
    change_summary: Optional[List[str]] = None
    timestamp: Optional[str] = None

class CopilotRequest(BaseModel):
    message: str
    investigation_id: Optional[str] = None
    current_form_data: Optional[Dict[str, Any]] = None

class CopilotResponse(BaseModel):
    message: str
    tool_used: str  # log_rca, edit_rca, document_extraction, analyze_rca, generate_capa, qna
    form_updates: Dict[str, Any]
    change_summary: List[str] = Field(default_factory=list)
    suggested_prompts: List[str] = Field(default_factory=list)
    evidence_gaps: List[str] = Field(default_factory=list)
    risk_assessment: Dict[str, Any] = Field(default_factory=dict)
    root_causes: List[Dict[str, Any]] = Field(default_factory=list)
    why_steps: List[Dict[str, Any]] = Field(default_factory=list)
    capa_actions: List[Dict[str, Any]] = Field(default_factory=list)
    provenance: Dict[str, Any] = Field(default_factory=dict)


# =====================================================================
# EXACT FRONTEND CONTRACT SCHEMAS
# =====================================================================

class InvestigationIncident(BaseModel):
    title: str = ""
    description: str = ""
    source_reference: str = ""
    date_occurrence: str = ""
    date_discovery: str = ""
    department: str = ""
    facility: str = ""
    reported_by: str = ""
    category: str = ""
    detection_method: str = ""
    initial_severity: str = ""

class InvestigationProduct(BaseModel):
    name: str = ""
    grade: str = ""
    batch_number: str = ""
    manufacturing_stage: str = ""
    manufacturing_date: str = ""
    equipment: str = ""
    affected_quantity: str = ""
    unit: str = ""
    production_details: str = ""

class InvestigationImpact(BaseModel):
    expected_condition: str = ""
    actual_condition: str = ""
    quality_impact: str = ""
    product_impact: str = ""
    patient_impact: str = ""
    containment_actions: str = ""

class InvestigationRisk(BaseModel):
    severity: str = ""  # Critical, Major, Minor, ""
    containment_required: Optional[bool] = None
    next_action: str = ""
    rationale: str = ""
    occurrence: str = ""
    detectability: str = ""

class EvidenceContract(BaseModel):
    id: str
    kind: str = "observation"
    description: str = ""
    availability: str = "available"  # available, missing
    why_needed: str = ""
    source_quote: str = ""

class RootCauseContract(BaseModel):
    id: str
    category: str = "method"  # man, machine, method, material, measurement, environment
    kind: str = "candidate"   # candidate, contributing_factor
    statement: str = ""
    explanation: str = ""
    supporting_evidence: List[str] = Field(default_factory=list)
    contradicting_evidence: List[str] = Field(default_factory=list)
    missing_evidence: List[str] = Field(default_factory=list)
    verification_steps: List[str] = Field(default_factory=list)
    confidence: str = "medium"  # low, medium, high
    status: str = "hypothesis"  # hypothesis, under_investigation, evidence_supported, human_confirmed, rejected

class WhyStepContract(BaseModel):
    id: str
    root_cause_id: str = ""
    step_no: int = 1
    question: str = ""
    answer: str = ""

class CapaContract(BaseModel):
    id: str
    type: str = "corrective"  # corrective, preventive
    description: str = ""
    rationale: str = ""
    root_cause_id: str = ""
    department: str = ""
    priority: str = "medium"  # high, medium, low
    target_date: str = ""
    effectiveness_check: str = ""
    status: str = "proposed"  # proposed, accepted, rejected

class DocumentContract(BaseModel):
    id: str
    filename: str
    size: int = 0
    mime: str = "application/pdf"

class InvestigationContract(BaseModel):
    id: Optional[str] = None
    investigation_no: str = "RCA-2026-0001"
    status: str = "draft"
    incident: InvestigationIncident = Field(default_factory=InvestigationIncident)
    product: InvestigationProduct = Field(default_factory=InvestigationProduct)
    impact: InvestigationImpact = Field(default_factory=InvestigationImpact)
    risk: InvestigationRisk = Field(default_factory=InvestigationRisk)
    evidence: List[EvidenceContract] = Field(default_factory=list)
    investigation_method: Optional[str] = "both"
    root_causes: List[RootCauseContract] = Field(default_factory=list)
    why_steps: List[WhyStepContract] = Field(default_factory=list)
    capa: List[CapaContract] = Field(default_factory=list)
    documents: List[DocumentContract] = Field(default_factory=list)
    field_meta: Dict[str, str] = Field(default_factory=dict)

class ChangeLogEntry(BaseModel):
    path: str
    label: str
    old: Any = None
    new: Any = None
    source: str = "ai_suggested"

class CopilotResponseContract(BaseModel):
    intent: str
    assistant_message: str
    investigation: InvestigationContract
    change_log: List[ChangeLogEntry] = Field(default_factory=list)
    warnings: List[str] = Field(default_factory=list)

class CopilotMessageRequest(BaseModel):
    message: str
    input_type: Optional[str] = "text"
    investigation: Optional[Dict[str, Any]] = None
    history: Optional[List[Dict[str, Any]]] = None
    force_action: Optional[str] = None


