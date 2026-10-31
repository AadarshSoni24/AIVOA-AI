import uuid
from typing import Dict, Any, List, Tuple
from schemas.investigation import (
    InvestigationContract,
    InvestigationIncident,
    InvestigationProduct,
    InvestigationImpact,
    InvestigationRisk,
    EvidenceContract,
    RootCauseContract,
    WhyStepContract,
    CapaContract,
    DocumentContract,
    ChangeLogEntry
)

FIELD_SPEC = [
    ("incident.title", "Deviation Title", "title"),
    ("incident.description", "Incident Description", "description"),
    ("incident.date_occurrence", "Occurrence Date", "incident_date"),
    ("incident.category", "Deviation Category", "incident_category"),
    ("incident.detection_method", "Detection Method", "detection_method"),
    ("incident.facility", "Manufacturing Facility", "incident_location"),
    ("product.name", "Product Name", "product_name"),
    ("product.grade", "Product Grade", "product_strength"),
    ("product.batch_number", "Batch Number", "batch_number"),
    ("product.manufacturing_date", "Manufacturing Date", "manufacturing_date"),
    ("product.affected_quantity", "Affected Quantity", "affected_quantity"),
    ("product.unit", "Unit", "affected_unit"),
    ("impact.product_impact", "Product Impact", "impact_scope"),
    ("impact.containment_actions", "Containment Actions", "containment_actions"),
    ("risk.next_action", "Next Action", "immediate_actions_taken"),
]

def get_nested_val(data: Dict[str, Any], path: str) -> Any:
    parts = path.split(".")
    curr = data
    for p in parts:
        if isinstance(curr, dict) and p in curr:
            curr = curr[p]
        else:
            return ""
    return curr

def set_nested_val(data: Dict[str, Any], path: str, val: Any) -> None:
    parts = path.split(".")
    curr = data
    for p in parts[:-1]:
        if p not in curr or not isinstance(curr[p], dict):
            curr[p] = {}
        curr = curr[p]
    curr[parts[-1]] = val

def flatten_investigation(inv: Dict[str, Any]) -> Dict[str, Any]:
    if not inv:
        return {}
    flat = {}
    for path, _, flat_key in FIELD_SPEC:
        val = get_nested_val(inv, path)
        if val:
            flat[flat_key] = val

    # Severity mapping
    risk_sev = get_nested_val(inv, "risk.severity") or get_nested_val(inv, "incident.initial_severity")
    if risk_sev:
        flat["impact_severity"] = str(risk_sev).lower()

    # Pass through root causes and capa if present
    if inv.get("root_causes"):
        flat["root_causes"] = inv["root_causes"]
    if inv.get("why_steps"):
        flat["why_steps"] = inv["why_steps"]
    if inv.get("capa"):
        flat["capa_actions"] = inv["capa"]

    return flat

def map_severity_title(sev: str) -> str:
    if not sev:
        return "Major"
    s = sev.lower().strip()
    if s == "critical":
        return "Critical"
    if s == "minor":
        return "Minor"
    return "Major"

def build_investigation_contract(
    prior_inv: Dict[str, Any],
    langgraph_result: Dict[str, Any],
    uploaded_doc: Dict[str, Any] = None
) -> Tuple[InvestigationContract, List[ChangeLogEntry]]:
    
    # Start with a deep copy of prior investigation or defaults
    new_data: Dict[str, Any] = {
        "id": prior_inv.get("id"),
        "investigation_no": prior_inv.get("investigation_no") or "RCA-2026-0001",
        "status": prior_inv.get("status") or "draft",
        "incident": dict(prior_inv.get("incident") or {}),
        "product": dict(prior_inv.get("product") or {}),
        "impact": dict(prior_inv.get("impact") or {}),
        "risk": dict(prior_inv.get("risk") or {}),
        "evidence": list(prior_inv.get("evidence") or []),
        "investigation_method": prior_inv.get("investigation_method") or "both",
        "root_causes": list(prior_inv.get("root_causes") or []),
        "why_steps": list(prior_inv.get("why_steps") or []),
        "capa": list(prior_inv.get("capa") or []),
        "documents": list(prior_inv.get("documents") or []),
        "field_meta": dict(prior_inv.get("field_meta") or {})
    }

    form_updates = langgraph_result.get("form_updates") or {}
    risk_assessment = langgraph_result.get("risk_assessment") or {}
    evidence_gaps = langgraph_result.get("evidence_gaps") or []
    provenance = langgraph_result.get("provenance") or {}
    tool_used = langgraph_result.get("tool_used") or "ai_suggested"
    default_source = "extracted" if "document" in tool_used else "ai_suggested"

    # Set investigation number if present in updates
    if form_updates.get("investigation_number"):
        new_data["investigation_no"] = form_updates["investigation_number"]

    # Map form updates to nested paths
    for path, label, flat_key in FIELD_SPEC:
        if flat_key in form_updates and form_updates[flat_key] is not None:
            new_val = str(form_updates[flat_key]).strip()
            if new_val:
                set_nested_val(new_data, path, new_val)
                # Field meta provenance
                prov_entry = provenance.get(flat_key, {})
                source = prov_entry.get("source", default_source)
                new_data["field_meta"][path] = source

    # Map Severity
    sev = form_updates.get("impact_severity") or risk_assessment.get("severity")
    if sev:
        formatted_sev = map_severity_title(sev)
        new_data["risk"]["severity"] = formatted_sev
        new_data["incident"]["initial_severity"] = formatted_sev
        new_data["risk"]["containment_required"] = True
        new_data["field_meta"]["risk.severity"] = default_source

    # Map Risk next action and potential impact
    if risk_assessment.get("recommended_next_action"):
        new_data["risk"]["next_action"] = risk_assessment["recommended_next_action"]
    if risk_assessment.get("potential_impact"):
        new_data["impact"]["patient_impact"] = risk_assessment["potential_impact"]
    if risk_assessment.get("immediate_containment"):
        new_data["impact"]["containment_actions"] = risk_assessment["immediate_containment"]

    # Append uploaded document
    if uploaded_doc:
        doc_exists = any(d.get("filename") == uploaded_doc["filename"] for d in new_data["documents"])
        if not doc_exists:
            new_data["documents"].append({
                "id": uploaded_doc.get("id") or f"doc-{uuid.uuid4().hex[:8]}",
                "filename": uploaded_doc["filename"],
                "size": uploaded_doc.get("size", 0),
                "mime": uploaded_doc.get("mime", "application/pdf")
            })

    # Evidence mapping
    if evidence_gaps:
        existing_gaps = {e.get("description") for e in new_data["evidence"]}
        for gap in evidence_gaps:
            if gap not in existing_gaps:
                new_data["evidence"].append({
                    "id": f"ev-{uuid.uuid4().hex[:8]}",
                    "kind": "Verification Document",
                    "description": gap,
                    "availability": "missing",
                    "why_needed": "Required for cGMP compliance and root cause verification",
                    "source_quote": ""
                })

    # Root causes mapping
    lg_root_causes = langgraph_result.get("root_causes") or []
    if lg_root_causes:
        mapped_causes = []
        for rc in lg_root_causes:
            mapped_causes.append({
                "id": rc.get("id") or f"rc-{uuid.uuid4().hex[:8]}",
                "category": rc.get("cause_category") or rc.get("category") or "method",
                "kind": "candidate",
                "statement": rc.get("cause_text") or rc.get("statement") or "",
                "explanation": rc.get("explanation") or "",
                "supporting_evidence": [rc.get("evidence_supporting")] if rc.get("evidence_supporting") else [],
                "contradicting_evidence": [rc.get("evidence_contradicting")] if rc.get("evidence_contradicting") else [],
                "missing_evidence": [rc.get("missing_evidence")] if rc.get("missing_evidence") else [],
                "verification_steps": [rc.get("verification_steps")] if rc.get("verification_steps") else [],
                "confidence": rc.get("likelihood") or rc.get("confidence") or "medium",
                "status": rc.get("status") or "hypothesis"
            })
        new_data["root_causes"] = mapped_causes

    # Why steps mapping
    lg_why_steps = langgraph_result.get("why_steps") or []
    if lg_why_steps:
        mapped_whys = []
        for w in lg_why_steps:
            mapped_whys.append({
                "id": w.get("id") or f"ws-{uuid.uuid4().hex[:8]}",
                "root_cause_id": w.get("root_cause_id") or (new_data["root_causes"][0]["id"] if new_data["root_causes"] else ""),
                "step_no": w.get("step_number") or w.get("step_no") or 1,
                "question": w.get("question") or "",
                "answer": w.get("answer") or ""
            })
        new_data["why_steps"] = mapped_whys

    # CAPA mapping
    lg_capas = langgraph_result.get("capa_actions") or []
    if lg_capas:
        mapped_capas = []
        for c in lg_capas:
            mapped_capas.append({
                "id": c.get("id") or f"capa-{uuid.uuid4().hex[:8]}",
                "type": c.get("action_type") or c.get("type") or "corrective",
                "description": c.get("description") or "",
                "rationale": c.get("rationale") or "",
                "root_cause_id": c.get("related_root_cause") or c.get("root_cause_id") or "",
                "department": c.get("responsible_department") or c.get("department") or "Quality Assurance",
                "priority": c.get("priority") or "medium",
                "target_date": c.get("target_date") or "",
                "effectiveness_check": c.get("effectiveness_verification") or c.get("effectiveness_check") or "",
                "status": c.get("status") or "proposed"
            })
        new_data["capa"] = mapped_capas

    # Compute Change Log
    change_log: List[ChangeLogEntry] = []
    for path, label, flat_key in FIELD_SPEC:
        old_val = get_nested_val(prior_inv, path) or ""
        curr_val = get_nested_val(new_data, path) or ""
        if curr_val and curr_val != old_val:
            source = new_data["field_meta"].get(path, default_source)
            change_log.append(ChangeLogEntry(
                path=path,
                label=label,
                old=old_val if old_val else None,
                new=curr_val,
                source=source
            ))

    # Also check severity change
    old_sev = get_nested_val(prior_inv, "risk.severity") or ""
    new_sev = get_nested_val(new_data, "risk.severity") or ""
    if new_sev and new_sev != old_sev:
        change_log.append(ChangeLogEntry(
            path="risk.severity",
            label="Risk Severity",
            old=old_sev if old_sev else None,
            new=new_sev,
            source=default_source
        ))

    # Also check uploaded documents
    if uploaded_doc and not any(d.get("filename") == uploaded_doc["filename"] for d in prior_inv.get("documents", [])):
        change_log.append(ChangeLogEntry(
            path="documents",
            label="Source Document",
            old=None,
            new=uploaded_doc["filename"],
            source="extracted"
        ))

    investigation_contract = InvestigationContract(**new_data)
    return investigation_contract, change_log

def generate_dynamic_assistant_message(
    intent: str,
    change_log: List[ChangeLogEntry],
    inv: InvestigationContract,
    raw_response: str = ""
) -> str:
    """
    Builds assistant text dynamically from the real change_log and findings.
    Never uses static canned strings.
    """
    if not change_log:
        if raw_response and len(raw_response.strip()) > 10:
            return raw_response.strip()
        return "I reviewed the investigation details. No additional field changes were required."

    updated_labels = [f"**{c.label}** ({c.new})" for c in change_log[:4]]
    count = len(change_log)
    changes_str = ", ".join(updated_labels)
    if count > 4:
        changes_str += f", and {count - 4} other fields"

    if intent == "edit_rca":
        msg = f"I have applied your correction. Updated {changes_str}."
    elif intent in ["document_extraction", "extract_document"]:
        doc_name = inv.documents[-1].filename if inv.documents else "document"
        msg = f"Extracted deviation data from **{doc_name}**. Populated {changes_str}."
    elif intent == "analyze_rca":
        cause_count = len(inv.root_causes)
        msg = f"Completed Root Cause Analysis: identified {cause_count} candidate causes and updated {changes_str}."
    elif intent == "generate_capa":
        capa_count = len(inv.capa)
        msg = f"Generated {capa_count} proposed CAPA actions. Updated {changes_str}."
    else:
        msg = f"Logged investigation details: populated {changes_str}."

    if inv.risk.severity:
        msg += f" Evaluated as **{inv.risk.severity}** severity."

    missing_count = sum(1 for e in inv.evidence if e.availability == "missing")
    if missing_count > 0:
        msg += f" Flagged {missing_count} critical missing evidence item{'s' if missing_count > 1 else ''} for compliance."

    return msg

