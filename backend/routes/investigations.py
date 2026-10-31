import logging
import uuid
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, delete
from sqlalchemy.orm import selectinload
from database import get_db
from models.investigation import (
    Investigation,
    RootCause,
    WhyStep,
    CAPAAction,
    EvidenceItem,
    Document,
    AuditEvent
)
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
    RootCauseResponse
)
from services.contract_transformer import map_severity_title

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Investigations"])

def db_to_contract(db_inv: Investigation) -> InvestigationContract:
    incident = InvestigationIncident(
        title=db_inv.title or "",
        description=db_inv.description or "",
        source_reference="",
        date_occurrence=db_inv.incident_date or "",
        date_discovery=db_inv.incident_date or "",
        department="",
        facility=db_inv.incident_location or "",
        reported_by=db_inv.investigator_name or "",
        category=db_inv.incident_category or "",
        detection_method=db_inv.detection_method or "",
        initial_severity=map_severity_title(db_inv.impact_severity or "major")
    )
    product = InvestigationProduct(
        name=db_inv.product_name or "",
        grade=db_inv.product_strength or "",
        batch_number=db_inv.batch_number or "",
        manufacturing_stage="",
        manufacturing_date=db_inv.manufacturing_date or "",
        equipment="",
        affected_quantity=db_inv.affected_quantity or "",
        unit=db_inv.affected_unit or "",
        production_details=""
    )
    impact = InvestigationImpact(
        expected_condition="",
        actual_condition="",
        quality_impact="",
        product_impact=db_inv.impact_scope or "",
        patient_impact=(db_inv.ai_risk_assessment or {}).get("potential_impact", "") if isinstance(db_inv.ai_risk_assessment, dict) else "",
        containment_actions=db_inv.containment_actions or ""
    )
    risk = InvestigationRisk(
        severity=map_severity_title(db_inv.impact_severity or "major"),
        containment_required=True,
        next_action=(db_inv.ai_risk_assessment or {}).get("recommended_next_action", db_inv.immediate_actions_taken or "") if isinstance(db_inv.ai_risk_assessment, dict) else (db_inv.immediate_actions_taken or ""),
        rationale="",
        occurrence="",
        detectability=""
    )

    root_causes: List[RootCauseContract] = []
    for rc in (db_inv.root_causes or []):
        root_causes.append(RootCauseContract(
            id=str(rc.id),
            category=rc.cause_category or "method",
            kind="candidate",
            statement=rc.cause_text or "",
            explanation="",
            supporting_evidence=[rc.evidence_supporting] if rc.evidence_supporting else [],
            contradicting_evidence=[rc.evidence_contradicting] if rc.evidence_contradicting else [],
            missing_evidence=[rc.missing_evidence] if rc.missing_evidence else [],
            verification_steps=[rc.verification_steps] if rc.verification_steps else [],
            confidence=rc.likelihood or "medium",
            status="human_confirmed" if rc.is_confirmed else (rc.status or "hypothesis")
        ))

    why_steps: List[WhyStepContract] = []
    for ws in (db_inv.why_steps or []):
        why_steps.append(WhyStepContract(
            id=str(ws.id),
            root_cause_id=root_causes[0].id if root_causes else "",
            step_no=ws.step_number or 1,
            question=ws.question or "",
            answer=ws.answer or ""
        ))

    capa: List[CapaContract] = []
    for ca in (db_inv.capa_actions or []):
        capa.append(CapaContract(
            id=str(ca.id),
            type=ca.action_type or "corrective",
            description=ca.description or "",
            rationale=ca.rationale or "",
            root_cause_id=ca.related_root_cause or "",
            department=ca.responsible_department or "Quality Assurance",
            priority=ca.priority or "medium",
            target_date=ca.target_date or "",
            effectiveness_check=ca.effectiveness_verification or "",
            status=ca.status or "proposed"
        ))

    evidence: List[EvidenceContract] = []
    for ev in (db_inv.evidence_items or []):
        evidence.append(EvidenceContract(
            id=str(ev.id),
            kind=ev.evidence_type or "observation",
            description=ev.description or ev.title or "",
            availability="available",
            why_needed="",
            source_quote=ev.source_quote or ""
        ))

    documents: List[DocumentContract] = []
    for doc in (db_inv.documents or []):
        documents.append(DocumentContract(
            id=str(doc.id),
            filename=doc.filename,
            size=0,
            mime=doc.content_type or "application/pdf"
        ))

    field_meta = db_inv.provenance_map if isinstance(db_inv.provenance_map, dict) else {}

    return InvestigationContract(
        id=str(db_inv.id),
        investigation_no=db_inv.investigation_number or "RCA-2026-0001",
        status=db_inv.status or "saved",
        incident=incident,
        product=product,
        impact=impact,
        risk=risk,
        evidence=evidence,
        investigation_method=db_inv.investigation_method or "both",
        root_causes=root_causes,
        why_steps=why_steps,
        capa=capa,
        documents=documents,
        field_meta=field_meta
    )

@router.get("")
async def list_investigations(
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db)
):
    stmt = (
        select(Investigation)
        .order_by(desc(Investigation.created_at))
        .offset(skip)
        .limit(limit)
    )
    result = await db.execute(stmt)
    investigations = result.scalars().all()
    
    return [
        {
            "id": str(inv.id),
            "investigation_no": inv.investigation_number,
            "title": inv.title or "Quality Deviation Investigation",
            "batch_number": inv.batch_number or "-",
            "severity": map_severity_title(inv.impact_severity or "major"),
            "status": inv.status or "saved",
            "updated_at": inv.updated_at.isoformat() if inv.updated_at else datetime.now(timezone.utc).isoformat()
        }
        for inv in investigations
    ]

@router.post("", response_model=InvestigationContract, status_code=status.HTTP_201_CREATED)
async def create_or_save_investigation(
    payload: Dict[str, Any],
    db: AsyncSession = Depends(get_db)
):
    try:
        existing_id = payload.get("id")
        investigation = None
        if existing_id:
            stmt = (
                select(Investigation)
                .where(Investigation.id == existing_id)
                .options(
                    selectinload(Investigation.root_causes),
                    selectinload(Investigation.why_steps),
                    selectinload(Investigation.capa_actions),
                    selectinload(Investigation.evidence_items),
                    selectinload(Investigation.documents)
                )
            )
            res = await db.execute(stmt)
            investigation = res.scalar_one_or_none()

        # Extract values supporting both nested and flat shapes
        incident_data = payload.get("incident") if isinstance(payload.get("incident"), dict) else {}
        product_data = payload.get("product") if isinstance(payload.get("product"), dict) else {}
        impact_data = payload.get("impact") if isinstance(payload.get("impact"), dict) else {}
        risk_data = payload.get("risk") if isinstance(payload.get("risk"), dict) else {}

        title = incident_data.get("title") or payload.get("title") or "New Quality Deviation"
        description = incident_data.get("description") or payload.get("description")
        incident_date = incident_data.get("date_occurrence") or payload.get("incident_date")
        incident_category = incident_data.get("category") or payload.get("incident_category")
        detection_method = incident_data.get("detection_method") or payload.get("detection_method")
        incident_location = incident_data.get("facility") or payload.get("incident_location")
        
        product_name = product_data.get("name") or payload.get("product_name")
        product_strength = product_data.get("grade") or payload.get("product_strength")
        batch_number = product_data.get("batch_number") or payload.get("batch_number")
        manufacturing_date = product_data.get("manufacturing_date") or payload.get("manufacturing_date")
        affected_quantity = product_data.get("affected_quantity") or payload.get("affected_quantity")
        affected_unit = product_data.get("unit") or payload.get("affected_unit")
        
        impact_scope = impact_data.get("product_impact") or payload.get("impact_scope")
        containment_actions = impact_data.get("containment_actions") or payload.get("containment_actions")
        
        sev = risk_data.get("severity") or incident_data.get("initial_severity") or payload.get("impact_severity") or "major"
        impact_severity = map_severity_title(str(sev)).lower()
        immediate_actions_taken = risk_data.get("next_action") or payload.get("immediate_actions_taken")
        
        inv_num = payload.get("investigation_no") or payload.get("investigation_number") or f"RCA-2026-{uuid.uuid4().hex[:4].upper()}"
        field_meta = payload.get("field_meta") or {}

        if not investigation:
            # Check unique constraint on investigation_number
            check_stmt = select(Investigation).where(Investigation.investigation_number == inv_num)
            check_res = await db.execute(check_stmt)
            if check_res.scalar_one_or_none():
                import random
                inv_num = f"{inv_num}-{random.randint(100, 999)}"

            investigation = Investigation(
                investigation_number=inv_num,
                title=title,
                status="saved",
                description=description,
                source_type="manual",
                incident_date=incident_date,
                incident_location=incident_location,
                incident_category=incident_category,
                detection_method=detection_method,
                product_name=product_name,
                product_strength=product_strength,
                batch_number=batch_number,
                manufacturing_date=manufacturing_date,
                affected_quantity=affected_quantity,
                affected_unit=affected_unit,
                impact_severity=impact_severity,
                impact_scope=impact_scope,
                containment_actions=containment_actions,
                immediate_actions_taken=immediate_actions_taken,
                investigator_name=incident_data.get("reported_by") or "Quality Engineer",
                investigation_method=payload.get("investigation_method") or "both",
                ai_risk_assessment={"potential_impact": impact_data.get("patient_impact", ""), "recommended_next_action": immediate_actions_taken},
                ai_confidence_score=0.98,
                provenance_map=field_meta
            )
            db.add(investigation)
            await db.flush()
        else:
            investigation.title = title
            investigation.status = "saved"
            investigation.description = description
            investigation.incident_date = incident_date
            investigation.incident_location = incident_location
            investigation.incident_category = incident_category
            investigation.detection_method = detection_method
            investigation.product_name = product_name
            investigation.product_strength = product_strength
            investigation.batch_number = batch_number
            investigation.manufacturing_date = manufacturing_date
            investigation.affected_quantity = affected_quantity
            investigation.affected_unit = affected_unit
            investigation.impact_severity = impact_severity
            investigation.impact_scope = impact_scope
            investigation.containment_actions = containment_actions
            investigation.immediate_actions_taken = immediate_actions_taken
            investigation.provenance_map = field_meta

        # Delete existing child items
        await db.execute(delete(RootCause).where(RootCause.investigation_id == investigation.id))
        await db.execute(delete(WhyStep).where(WhyStep.investigation_id == investigation.id))
        await db.execute(delete(CAPAAction).where(CAPAAction.investigation_id == investigation.id))
        await db.execute(delete(EvidenceItem).where(EvidenceItem.investigation_id == investigation.id))
        await db.flush()

        # Insert root causes
        root_causes_input = payload.get("root_causes") or []
        for i, rc_data in enumerate(root_causes_input):
            statement = rc_data.get("statement") or rc_data.get("cause_text") or ""
            if statement:
                db.add(RootCause(
                    investigation_id=investigation.id,
                    cause_text=statement,
                    cause_category=rc_data.get("category") or rc_data.get("cause_category") or "method",
                    likelihood=rc_data.get("confidence") or rc_data.get("likelihood") or "medium",
                    is_confirmed=rc_data.get("status") == "human_confirmed" or rc_data.get("is_confirmed", False),
                    evidence_supporting=", ".join(rc_data.get("supporting_evidence", [])) if isinstance(rc_data.get("supporting_evidence"), list) else rc_data.get("supporting_evidence"),
                    status=rc_data.get("status") or "hypothesis",
                    source="ai_suggested",
                    order_index=i
                ))

        # Insert why steps
        why_steps_input = payload.get("why_steps") or []
        for ws_data in why_steps_input:
            q = ws_data.get("question") or ""
            if q:
                db.add(WhyStep(
                    investigation_id=investigation.id,
                    step_number=ws_data.get("step_no") or ws_data.get("step_number") or 1,
                    question=q,
                    answer=ws_data.get("answer") or "",
                    source="ai_suggested"
                ))

        # Insert capa
        capa_input = payload.get("capa") or payload.get("capa_actions") or []
        for ca_data in capa_input:
            desc = ca_data.get("description") or ""
            if desc:
                db.add(CAPAAction(
                    investigation_id=investigation.id,
                    action_type=ca_data.get("type") or ca_data.get("action_type") or "corrective",
                    description=desc,
                    rationale=ca_data.get("rationale"),
                    related_root_cause=ca_data.get("root_cause_id") or ca_data.get("related_root_cause"),
                    responsible_department=ca_data.get("department") or ca_data.get("responsible_department") or "Quality Assurance",
                    target_date=ca_data.get("target_date"),
                    priority=ca_data.get("priority") or "medium",
                    status=ca_data.get("status") or "proposed",
                    effectiveness_verification=ca_data.get("effectiveness_check") or ca_data.get("effectiveness_verification"),
                    source="ai_suggested"
                ))

        # Insert evidence
        evidence_input = payload.get("evidence") or []
        for ev in evidence_input:
            edesc = ev.get("description") or ""
            if edesc:
                db.add(EvidenceItem(
                    investigation_id=investigation.id,
                    evidence_type=ev.get("kind") or "observation",
                    title=edesc[:100],
                    description=edesc,
                    relevance="high",
                    source_quote=ev.get("source_quote") or ""
                ))

        # Insert documents
        docs_input = payload.get("documents") or []
        for d in docs_input:
            fn = d.get("filename") or ""
            if fn:
                check_doc = select(Document).where(Document.investigation_id == investigation.id, Document.filename == fn)
                doc_res = await db.execute(check_doc)
                if not doc_res.scalar_one_or_none():
                    db.add(Document(
                        investigation_id=investigation.id,
                        filename=fn,
                        content_type=d.get("mime") or "application/pdf"
                    ))

        audit = AuditEvent(
            investigation_id=investigation.id,
            event_type="save",
            field_name="all",
            new_value=f"Saved investigation {investigation.investigation_number}",
            changed_by="User"
        )
        db.add(audit)

        await db.commit()

        # Reload with all relationships
        reload_stmt = (
            select(Investigation)
            .where(Investigation.id == investigation.id)
            .options(
                selectinload(Investigation.root_causes),
                selectinload(Investigation.why_steps),
                selectinload(Investigation.capa_actions),
                selectinload(Investigation.evidence_items),
                selectinload(Investigation.documents)
            )
        )
        reload_res = await db.execute(reload_stmt)
        saved_db_inv = reload_res.scalar_one()
        return db_to_contract(saved_db_inv)
    except Exception as e:
        await db.rollback()
        logger.error(f"Failed to create/save investigation: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{id}", response_model=InvestigationContract)
async def get_investigation(
    id: str,
    db: AsyncSession = Depends(get_db)
):
    stmt = (
        select(Investigation)
        .where(Investigation.id == id)
        .options(
            selectinload(Investigation.root_causes),
            selectinload(Investigation.why_steps),
            selectinload(Investigation.capa_actions),
            selectinload(Investigation.evidence_items),
            selectinload(Investigation.documents)
        )
    )
    res = await db.execute(stmt)
    inv = res.scalar_one_or_none()
    if not inv:
        raise HTTPException(status_code=404, detail="Investigation not found")
    return db_to_contract(inv)

@router.put("/{id}", response_model=InvestigationContract)
async def update_investigation(
    id: str,
    payload: Dict[str, Any],
    db: AsyncSession = Depends(get_db)
):
    payload["id"] = id
    return await create_or_save_investigation(payload, db)

@router.delete("/{id}")
async def delete_investigation(
    id: str,
    db: AsyncSession = Depends(get_db)
):
    stmt = (
        select(Investigation)
        .where(Investigation.id == id)
    )
    res = await db.execute(stmt)
    inv = res.scalar_one_or_none()
    if not inv:
        raise HTTPException(status_code=404, detail="Investigation not found")
    await db.delete(inv)
    await db.commit()
    return {"message": "Investigation deleted successfully", "id": id}

@router.post("/{id}/root-causes/{cause_id}/confirm", response_model=RootCauseResponse)
async def confirm_root_cause(
    id: str,
    cause_id: str,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(RootCause).where(RootCause.id == cause_id, RootCause.investigation_id == id)
    res = await db.execute(stmt)
    cause = res.scalar_one_or_none()
    if not cause:
        raise HTTPException(status_code=404, detail="Root cause not found")

    cause.is_confirmed = True
    cause.status = "human_confirmed"
    cause.confirmed_by = "Qualified Person (QP)"

    audit = AuditEvent(
        investigation_id=id,
        event_type="confirm_cause",
        field_name=f"root_cause:{cause_id}",
        new_value="Confirmed by Qualified Person",
        changed_by="Qualified Person"
    )
    db.add(audit)

    await db.commit()
    await db.refresh(cause)
    return cause

@router.post("/{id}/root-causes/{cause_id}/reject", response_model=RootCauseResponse)
async def reject_root_cause(
    id: str,
    cause_id: str,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(RootCause).where(RootCause.id == cause_id, RootCause.investigation_id == id)
    res = await db.execute(stmt)
    cause = res.scalar_one_or_none()
    if not cause:
        raise HTTPException(status_code=404, detail="Root cause not found")

    cause.is_confirmed = False
    cause.status = "rejected"

    audit = AuditEvent(
        investigation_id=id,
        event_type="reject_cause",
        field_name=f"root_cause:{cause_id}",
        new_value="Rejected by Qualified Person",
        changed_by="Qualified Person"
    )
    db.add(audit)

    await db.commit()
    await db.refresh(cause)
    return cause
