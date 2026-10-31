export type FieldMetaStatus = "extracted" | "ai_suggested" | "reviewed" | "confirmed";

export type SeverityLevel = "Critical" | "Major" | "Minor" | "";

export type RootCauseCategory =
  | "man"
  | "machine"
  | "method"
  | "material"
  | "measurement"
  | "environment";

export type RootCauseStatus =
  | "hypothesis"
  | "under_investigation"
  | "evidence_supported"
  | "human_confirmed"
  | "rejected";

export type CapaType = "corrective" | "preventive";
export type CapaPriority = "high" | "medium" | "low";
export type CapaStatus = "proposed" | "accepted" | "rejected";

export interface InvestigationEvidence {
  id: string;
  kind: string;
  description: string;
  availability: "available" | "missing";
  why_needed: string;
  source_quote: string;
}

export interface InvestigationRootCause {
  id: string;
  category: RootCauseCategory;
  kind: "candidate" | "contributing_factor";
  statement: string;
  explanation: string;
  supporting_evidence: string[];
  contradicting_evidence: string[];
  missing_evidence: string[];
  verification_steps: string[];
  confidence: "low" | "medium" | "high";
  status: RootCauseStatus;
}

export interface InvestigationWhyStep {
  id: string;
  root_cause_id: string;
  step_no: number;
  question: string;
  answer: string;
}

export interface InvestigationCapa {
  id: string;
  type: CapaType;
  description: string;
  rationale: string;
  root_cause_id: string;
  department: string;
  priority: CapaPriority;
  target_date: string;
  effectiveness_check: string;
  status: CapaStatus;
}

export interface InvestigationDocument {
  id: string;
  filename: string;
  size: number;
  mime: string;
}

export interface Investigation {
  id: string | null;
  investigation_no: string;
  status: "draft" | "saved";
  incident: {
    title: string;
    description: string;
    source_reference: string;
    date_occurrence: string;
    date_discovery: string;
    department: string;
    facility: string;
    reported_by: string;
    category: string;
    detection_method: string;
    initial_severity: string;
  };
  product: {
    name: string;
    grade: string;
    batch_number: string;
    manufacturing_stage: string;
    manufacturing_date: string;
    equipment: string;
    affected_quantity: string;
    unit: string;
    production_details: string;
  };
  impact: {
    expected_condition: string;
    actual_condition: string;
    quality_impact: string;
    product_impact: string;
    patient_impact: string;
    containment_actions: string;
  };
  risk: {
    severity: SeverityLevel;
    containment_required: boolean | null;
    next_action: string;
    rationale: string;
    occurrence: string;
    detectability: string;
  };
  evidence: InvestigationEvidence[];
  investigation_method: "5_whys" | "fishbone" | "both" | null;
  root_causes: InvestigationRootCause[];
  why_steps: InvestigationWhyStep[];
  capa: InvestigationCapa[];
  documents: InvestigationDocument[];
  field_meta: Record<string, FieldMetaStatus>;
}

export interface ChangeLogItem {
  path: string;
  label: string;
  old: any;
  new: any;
  source: "extracted" | "ai_suggested" | "user";
}

export interface CopilotResponseContract {
  intent: string;
  assistant_message: string;
  investigation: Investigation;
  change_log: ChangeLogItem[];
  warnings: string[];
}

export interface InvestigationSummary {
  id: string;
  investigation_no: string;
  title: string;
  batch_number: string;
  severity: string;
  status: "draft" | "saved";
  updated_at: string;
}

/**
 * Creates a schema default Investigation object with empty strings, nulls and empty arrays.
 * This is a clean schema template, not dummy mock data.
 */
export function createEmptyInvestigation(): Investigation {
  return {
    id: null,
    investigation_no: "RCA-2026-0001",
    status: "draft",
    incident: {
      title: "",
      description: "",
      source_reference: "",
      date_occurrence: "",
      date_discovery: "",
      department: "",
      facility: "",
      reported_by: "",
      category: "",
      detection_method: "",
      initial_severity: ""
    },
    product: {
      name: "",
      grade: "",
      batch_number: "",
      manufacturing_stage: "",
      manufacturing_date: "",
      equipment: "",
      affected_quantity: "",
      unit: "",
      production_details: ""
    },
    impact: {
      expected_condition: "",
      actual_condition: "",
      quality_impact: "",
      product_impact: "",
      patient_impact: "",
      containment_actions: ""
    },
    risk: {
      severity: "",
      containment_required: null,
      next_action: "",
      rationale: "",
      occurrence: "",
      detectability: ""
    },
    evidence: [],
    investigation_method: "both",
    root_causes: [],
    why_steps: [],
    capa: [],
    documents: [],
    field_meta: {}
  };
}

export function normalizeInvestigation(raw: any): Investigation {
  const empty = createEmptyInvestigation();
  if (!raw || typeof raw !== 'object') {
    return empty;
  }

  // If raw has an inner investigation property
  const src = raw.investigation && typeof raw.investigation === 'object' ? raw.investigation : raw;

  return {
    id: src.id !== undefined ? src.id : empty.id,
    investigation_no: src.investigation_no || src.investigation_number || empty.investigation_no,
    status: src.status === 'saved' ? 'saved' : 'draft',
    incident: {
      title: src.incident?.title || src.title || '',
      description: src.incident?.description || src.description || '',
      source_reference: src.incident?.source_reference || src.source_reference || '',
      date_occurrence: src.incident?.date_occurrence || src.date_occurrence || '',
      date_discovery: src.incident?.date_discovery || src.date_discovery || '',
      department: src.incident?.department || src.department || '',
      facility: src.incident?.facility || src.facility || '',
      reported_by: src.incident?.reported_by || src.reported_by || '',
      category: src.incident?.category || src.category || '',
      detection_method: src.incident?.detection_method || src.detection_method || '',
      initial_severity: src.incident?.initial_severity || src.initial_severity || ''
    },
    product: {
      name: src.product?.name || src.product_name || '',
      grade: src.product?.grade || src.product_grade || '',
      batch_number: src.product?.batch_number || src.batch_number || '',
      manufacturing_stage: src.product?.manufacturing_stage || src.manufacturing_stage || '',
      manufacturing_date: src.product?.manufacturing_date || src.manufacturing_date || '',
      equipment: src.product?.equipment || src.equipment || '',
      affected_quantity: src.product?.affected_quantity ? String(src.product.affected_quantity) : '',
      unit: src.product?.unit || src.unit || '',
      production_details: src.product?.production_details || src.production_details || ''
    },
    impact: {
      expected_condition: src.impact?.expected_condition || src.expected_condition || '',
      actual_condition: src.impact?.actual_condition || src.actual_condition || '',
      quality_impact: src.impact?.quality_impact || src.quality_impact || '',
      product_impact: src.impact?.product_impact || src.product_impact || '',
      patient_impact: src.impact?.patient_impact || src.patient_impact || '',
      containment_actions: src.impact?.containment_actions || src.containment_actions || ''
    },
    risk: {
      severity: src.risk?.severity || src.impact_severity || '',
      containment_required:
        src.risk?.containment_required !== undefined ? src.risk.containment_required : null,
      next_action: src.risk?.next_action || '',
      rationale: src.risk?.rationale || '',
      occurrence: src.risk?.occurrence || '',
      detectability: src.risk?.detectability || ''
    },
    evidence: Array.isArray(src.evidence)
      ? src.evidence
      : Array.isArray(src.evidence_items)
        ? src.evidence_items
        : [],
    investigation_method: src.investigation_method || 'both',
    root_causes: Array.isArray(src.root_causes) ? src.root_causes : [],
    why_steps: Array.isArray(src.why_steps) ? src.why_steps : [],
    capa: Array.isArray(src.capa)
      ? src.capa
      : Array.isArray(src.capa_actions)
        ? src.capa_actions
        : [],
    documents: Array.isArray(src.documents) ? src.documents : [],
    field_meta:
      src.field_meta && typeof src.field_meta === 'object'
        ? src.field_meta
        : src.provenance_map || {}
  };
}

