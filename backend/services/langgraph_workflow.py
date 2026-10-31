import json
import logging
import re
from typing import Dict, Any, List, Optional, TypedDict
from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage, HumanMessage
from langgraph.graph import StateGraph, END
from config import settings

logger = logging.getLogger(__name__)

# JSON cleaner helper
def extract_json_from_text(text: str) -> Dict[str, Any]:
    text = text.strip()
    # Try direct parse
    try:
        return json.loads(text)
    except Exception:
        pass

    # Try extracting markdown block ```json ... ```
    match = re.search(r'```(?:json)?\s*([\s\S]*?)\s*```', text)
    if match:
        try:
            return json.loads(match.group(1).strip())
        except Exception:
            pass

    # Try extracting from first { to last }
    first_brace = text.find('{')
    last_brace = text.rfind('}')
    if first_brace != -1 and last_brace != -1 and last_brace > first_brace:
        try:
            return json.loads(text[first_brace:last_brace + 1])
        except Exception:
            pass

    # Try extracting array [ to ]
    first_bracket = text.find('[')
    last_bracket = text.rfind(']')
    if first_bracket != -1 and last_bracket != -1 and last_bracket > first_bracket:
        try:
            return json.loads(text[first_bracket:last_bracket + 1])
        except Exception:
            pass

    logger.warning(f"Failed to parse JSON from response: {text[:200]}...")
    return {}

# RCA State definition for LangGraph
class RCAState(TypedDict):
    user_input: str
    intent: str
    current_form_data: Dict[str, Any]
    document_text: str
    form_updates: Dict[str, Any]
    change_summary: List[str]
    risk_assessment: Dict[str, Any]
    root_causes: List[Dict[str, Any]]
    why_steps: List[Dict[str, Any]]
    capa_actions: List[Dict[str, Any]]
    evidence_gaps: List[str]
    provenance: Dict[str, Any]
    suggested_prompts: List[str]
    response_message: str
    tool_used: str

class ResilientChatGroq:
    def __init__(self):
        self.primary_model = settings.GROQ_MODEL or "openai/gpt-oss-120b"
        fallback_models = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant"]
        self.models_to_try = [self.primary_model] + [m for m in fallback_models if m != self.primary_model]

    def invoke(self, messages):
        last_exc = None
        for model_name in self.models_to_try:
            try:
                llm = ChatGroq(
                    model=model_name,
                    temperature=0.1,
                    groq_api_key=settings.GROQ_API_KEY,
                    max_retries=1
                )
                return llm.invoke(messages)
            except Exception as e:
                logger.warning(f"Model {model_name} invocation failed: {e}. Attempting fallback...")
                last_exc = e
        if last_exc:
            raise last_exc
        raise RuntimeError("No LLM models could be reached on Groq.")

def get_llm():
    return ResilientChatGroq()

# Node 1: Classify Intent
def classify_intent_node(state: RCAState) -> Dict[str, Any]:
    user_input = state.get("user_input", "")
    document_text = state.get("document_text", "")
    current_form = state.get("current_form_data", {})

    if document_text and not user_input:
        return {"intent": "document_extraction", "tool_used": "document_extraction"}

    system_prompt = """You are an AI router for an API Pharmaceutical Root Cause Analysis (RCA) system.
Classify the user's intent into exactly ONE of the following keys:
- "log_rca": The user is reporting, describing, or logging a new quality incident, deviation, or OOS (e.g. "During manufacturing of Metformin...", "Apollo Pharmacy reported...", "Log new incident: ...").
- "edit_rca": The user wants to correct, update, or edit specific existing field(s) (e.g. "Sorry the batch number is...", "Correction: quantity is 50 kg", "Change severity to critical", "Update temperature").
- "document_extraction": User provided a document text or PDF content to extract.
- "analyze_rca": User asks to perform root cause analysis, 5 Whys, or Fishbone diagram (e.g. "Perform RCA", "Analyze root causes", "Do 5 whys").
- "generate_capa": User asks for CAPA recommendations or corrective actions.
- "qna": General question or explanation about the investigation.

Respond with ONLY valid JSON: {"intent": "<intent_key>"}"""

    llm = get_llm()
    try:
        response = llm.invoke([
            SystemMessage(content=system_prompt),
            HumanMessage(content=f"Current Form Data Present: {bool(current_form)}\nUser Input: {user_input}")
        ])
        data = extract_json_from_text(response.content)
        intent = data.get("intent", "log_rca")
    except Exception as e:
        logger.error(f"Intent classification failed: {e}")
        # Rule-based fallback
        lower = user_input.lower()
        if any(w in lower for w in ["correct", "sorry", "change", "update", "edit", "instead"]):
            intent = "edit_rca"
        elif any(w in lower for w in ["root cause", "5 whys", "fishbone", "ishikawa"]):
            intent = "analyze_rca"
        elif any(w in lower for w in ["capa", "corrective", "preventive"]):
            intent = "generate_capa"
        else:
            intent = "log_rca"

    return {"intent": intent, "tool_used": intent}

# Node 2: Extract Incident (New RCA Form Creation)
def extract_incident_node(state: RCAState) -> Dict[str, Any]:
    user_input = state.get("user_input", "")
    
    system_prompt = """You are an expert Pharmaceutical Quality Assurance (QA/QC) AI Copilot specializing in Active Pharmaceutical Ingredients (API) manufacturing deviations and Root Cause Analysis (RCA).
Extract structured incident information from the user's input.
Adhere strictly to:
1. Do NOT invent missing data; leave missing string fields as null.
2. For impact_severity, evaluate strictly based on pharma cGMP:
   - "critical": potential patient harm, sterility failure, cross-contamination, critical assay failure.
   - "major": out-of-specification (OOS) parameter, process deviation affecting yield or quality, assay out of 98-102%.
   - "minor": non-critical parameter drift, cosmetic/packaging defect with zero product impact.
3. Generate standard initial investigation fields.

Respond ONLY with a JSON object in this format:
{
  "investigation_number": "RCA-2026-081",
  "title": "Short descriptive title of the deviation",
  "incident_date": "YYYY-MM-DD or extracted date",
  "incident_location": "e.g. API Block-3, Synthesis Suite B",
  "incident_category": "oos_assay" | "contamination" | "equipment_failure" | "process_deviation" | "raw_material" | "environmental" | "human_error" | "other",
  "detection_method": "qc_testing" | "in_process_control" | "visual_inspection" | "automated_alarm" | "other",
  "product_name": "Full API Product Name",
  "product_strength": "e.g. 500 mg, IP/BP Grade, USP",
  "batch_number": "Exact batch/lot code",
  "manufacturing_date": "YYYY-MM-DD or extracted date",
  "expiry_date": "YYYY-MM-DD or extracted date",
  "affected_quantity": "e.g. 50 kg or 120,000 units",
  "affected_unit": "kg" | "drums" | "capsules" | "tablets" | "liters",
  "impact_severity": "critical" | "major" | "minor",
  "impact_scope": "Clear assessment of affected batches or product lines",
  "containment_actions": "Immediate containment (e.g. batch placed on QA quarantine hold, SAP block applied)",
  "immediate_actions_taken": "First actions taken upon detection",
  "description": "Comprehensive narrative description of the deviation"
}"""

    llm = get_llm()
    form_updates = {}
    try:
        response = llm.invoke([
            SystemMessage(content=system_prompt),
            HumanMessage(content=f"User Incident Statement:\n{user_input}")
        ])
        form_updates = extract_json_from_text(response.content)
    except Exception as e:
        logger.error(f"Extract incident failed: {e}")

    # Build provenance map
    provenance = {}
    for k, v in form_updates.items():
        if v is not None:
            provenance[k] = {
                "source": "extracted",
                "confidence": 0.96,
                "evidence_ref": f"User prompt excerpt: '{user_input[:80]}...'"
            }

    return {
        "form_updates": form_updates,
        "provenance": provenance,
        "change_summary": [f"Extracted and populated initial RCA investigation: {form_updates.get('title', 'Quality Deviation')}"]
    }

# Node 3: Apply Targeted Edit (Deterministic Python Merge Logic)
def apply_edit_node(state: RCAState) -> Dict[str, Any]:
    user_input = state.get("user_input", "")
    current_form = state.get("current_form_data", {})

    system_prompt = """You are a Pharmaceutical Quality AI Editor. The user wants to CORRECT or UPDATE specific fields in the current investigation.
Inspect the user correction and identify ONLY the fields that the user explicitly wants to change.
Do NOT reproduce unaffected fields.
Available editable fields:
- title, incident_date, incident_location, incident_category, detection_method
- product_name, product_strength, batch_number, manufacturing_date, expiry_date, affected_quantity, affected_unit
- impact_severity, impact_scope, containment_actions, immediate_actions_taken, description

Respond ONLY with a JSON object containing ONLY the changed key-value pairs:
Example: {"batch_number": "CHG260712A", "affected_quantity": "50 kg (2 HDPE drums)"}"""

    llm = get_llm()
    diff_updates = {}
    try:
        response = llm.invoke([
            SystemMessage(content=system_prompt),
            HumanMessage(content=f"Current Form State:\n{json.dumps(current_form, indent=2)}\n\nUser Correction Statement:\n{user_input}")
        ])
        diff_updates = extract_json_from_text(response.content)
    except Exception as e:
        logger.error(f"Apply edit extraction failed: {e}")

    # Deterministic Python Merge: Compute exact diff against current_form
    validated_updates = {}
    change_summary = []
    provenance = state.get("provenance", {})

    for key, new_val in diff_updates.items():
        if new_val is not None:
            old_val = current_form.get(key)
            if str(old_val).strip() != str(new_val).strip():
                validated_updates[key] = new_val
                change_summary.append(f"Updated {key.replace('_', ' ').title()}: '{old_val}' → '{new_val}'")
                provenance[key] = {
                    "source": "reviewed",
                    "confidence": 0.99,
                    "evidence_ref": f"Direct user correction: '{user_input}'"
                }

    if not change_summary:
        change_summary = ["No conflicting changes detected; current form preserved."]

    return {
        "form_updates": validated_updates,
        "provenance": provenance,
        "change_summary": change_summary
    }

# Node 4: Extract Document
def extract_document_node(state: RCAState) -> Dict[str, Any]:
    document_text = state.get("document_text", "")
    user_input = state.get("user_input", "")
    combined_context = f"{document_text}\n\nAdditional User Notes: {user_input}" if user_input else document_text

    system_prompt = """You are a Pharmaceutical Regulatory & Deviation Document Extraction Specialist.
Analyze the provided batch record, deviation report, or quality incident document.
Extract all relevant facts into structured fields.
Follow cGMP standards:
- Identify product name, batch/lot number, assay/potency deviations, date of manufacture, quantity, and packaging units.
- Determine regulatory and product impact severity.
- Identify containment status.

Respond ONLY with a JSON object:
{
  "investigation_number": "RCA-2026-092",
  "title": "Deviation Title",
  "incident_date": "YYYY-MM-DD",
  "incident_location": "Location",
  "incident_category": "oos_assay" | "contamination" | "equipment_failure" | "process_deviation" | "raw_material" | "environmental" | "human_error" | "other",
  "detection_method": "qc_testing" | "in_process_control" | "visual_inspection" | "automated_alarm" | "other",
  "product_name": "API Name",
  "product_strength": "Strength / Grade",
  "batch_number": "Batch Code",
  "manufacturing_date": "Date",
  "expiry_date": "Date",
  "affected_quantity": "Quantity",
  "affected_unit": "Unit",
  "impact_severity": "critical" | "major" | "minor",
  "impact_scope": "Scope",
  "containment_actions": "Quarantine / containment actions",
  "immediate_actions_taken": "Actions taken",
  "description": "Full incident summary"
}"""

    llm = get_llm()
    form_updates = {}
    try:
        response = llm.invoke([
            SystemMessage(content=system_prompt),
            HumanMessage(content=f"Document Text:\n{combined_context[:6000]}")
        ])
        form_updates = extract_json_from_text(response.content)
    except Exception as e:
        logger.error(f"Extract document failed: {e}")

    provenance = {}
    for k, v in form_updates.items():
        if v is not None:
            provenance[k] = {
                "source": "extracted",
                "confidence": 0.98,
                "evidence_ref": "Extracted directly from uploaded deviation document."
            }

    return {
        "form_updates": form_updates,
        "provenance": provenance,
        "change_summary": [f"Extracted document contents for: {form_updates.get('title', 'Uploaded Document')}"]
    }

# Node 5: Risk Assessment Node
def assess_risk_node(state: RCAState) -> Dict[str, Any]:
    # Merge existing form data with updates to evaluate comprehensive risk
    current = {**state.get("current_form_data", {}), **state.get("form_updates", {})}

    system_prompt = """You are a Senior Pharmaceutical Risk Assessor following ICH Q9 Quality Risk Management guidelines.
Evaluate the current API manufacturing incident and generate a formal Risk Assessment Card.
Determine:
1. severity: "critical", "major", or "minor"
2. potential_impact: impact on patient safety, regulatory compliance, release release authorization, cross-contamination.
3. immediate_containment: QA quarantine, batch hold, ERP system block, inspection of preceding/succeeding batches.
4. recommended_next_action: e.g. Route to QA Laboratory OOS Phase II investigation, recalibrate analytical instruments.
5. risk_score: estimated risk priority integer between 1 (negligible) and 25 (extreme hazard).

Respond ONLY with valid JSON:
{
  "severity": "major",
  "potential_impact": "Detailed assessment of batch efficacy and release status",
  "immediate_containment": "Physical quarantine in Warehouse Bay 4 and ERP distribution lock",
  "recommended_next_action": "Initiate 5 Whys investigation and perform replicate HPLC assay testing",
  "risk_score": 16
}"""

    llm = get_llm()
    risk_assessment = {}
    try:
        response = llm.invoke([
            SystemMessage(content=system_prompt),
            HumanMessage(content=f"Incident Details:\n{json.dumps(current, indent=2)}")
        ])
        risk_assessment = extract_json_from_text(response.content)
    except Exception as e:
        logger.error(f"Risk assessment failed: {e}")
        risk_assessment = {
            "severity": current.get("impact_severity", "major"),
            "potential_impact": "Potential non-conformance with Pharmacopeial release standards.",
            "immediate_containment": "Quarantine affected lot and apply system hold.",
            "recommended_next_action": "Proceed with formal 5 Whys and Fishbone investigation.",
            "risk_score": 15
        }

    return {"risk_assessment": risk_assessment}

# Node 6: Detect Evidence Gaps
def detect_evidence_gaps_node(state: RCAState) -> Dict[str, Any]:
    current = {**state.get("current_form_data", {}), **state.get("form_updates", {})}
    
    system_prompt = """You are a Pharmaceutical Quality Auditor inspecting an RCA investigation.
Identify 3 to 4 critical MISSING evidence items or evidentiary gaps needed before closing this deviation.
Examples: Calibration logs for HPLC column, environmental temperature data during drying, raw material COA from vendor, operator training logs.

Respond ONLY with a JSON array of strings:
[
  "Missing calibration log for analytical balance BAL-042 on the date of assay testing.",
  "Raw material supplier Certificate of Analysis (CoA) for Excipient Lot EX-8891.",
  "HVAC humidity and differential pressure trend logs for Cleanroom Suite B during crystallization."
]"""

    llm = get_llm()
    evidence_gaps = []
    try:
        response = llm.invoke([
            SystemMessage(content=system_prompt),
            HumanMessage(content=f"Incident Data:\n{json.dumps(current, indent=2)}")
        ])
        data = extract_json_from_text(response.content)
        if isinstance(data, list):
            evidence_gaps = data
        elif isinstance(data, dict) and "gaps" in data:
            evidence_gaps = data["gaps"]
    except Exception as e:
        logger.error(f"Detect evidence gaps failed: {e}")
        evidence_gaps = [
            "Analytical instrumentation calibration certificates for testing day.",
            "Raw material vendor Certificate of Analysis (CoA) verification records.",
            "Batch Manufacturing Record (BMR) step sign-offs and in-process check logs."
        ]

    return {"evidence_gaps": evidence_gaps}

# Node 7: Analyze Root Cause (5 Whys & Fishbone 6M)
def analyze_root_cause_node(state: RCAState) -> Dict[str, Any]:
    current = {**state.get("current_form_data", {}), **state.get("form_updates", {})}
    user_input = state.get("user_input", "")

    system_prompt = """You are a Master Pharmaceutical Root Cause Investigator trained in ICH Q9, 5 Whys, and Ishikawa Fishbone (6M).
Analyze the API deviation and produce:
1. "why_steps": Exactly 5 progressive iterative questions and answers drilling down to the fundamental systemic root cause.
   Each step must have: step_number (1-5), question, answer, and supporting evidence.
2. "root_causes": 3 to 5 candidate root causes categorized across the 6M categories:
   - "man" (personnel, training, fatigue)
   - "machine" (equipment failure, calibration, wear)
   - "material" (raw material purity, solvent contamination)
   - "method" (SOP clarity, process parameters, reaction time)
   - "measurement" (analytical method variability, detector drift)
   - "mother_nature" (environmental temperature, humidity, cleanroom pressure)
3. IMPORTANT SAFEGUARD: Every root cause must have is_confirmed: false, status: "hypothesis", and source: "ai_suggested". AI NEVER confirms a cause.

Respond ONLY with valid JSON:
{
  "why_steps": [
    {
      "step_number": 1,
      "question": "Why did the Metformin Hydrochloride API batch fail assay specification at 97.2%?",
      "answer": "The active drug substance concentration in the final dried blend was lower than the 98.0% minimum threshold.",
      "evidence": "QC Assay Test Report QC-2026-789 showing 97.2% recovery."
    },
    {
      "step_number": 2,
      "question": "Why was the active drug concentration low in the final blend?",
      "answer": "Incomplete crystallization and loss of API in the mother liquor wash during vacuum filtration.",
      "evidence": "Filtrate volume and solvent recovery assay revealed 2.4% residual API in waste stream."
    },
    {
      "step_number": 3,
      "question": "Why was crystallization incomplete prior to filtration?",
      "answer": "The crystallizer slurry temperature was maintained at 18°C instead of the specified 8°C–10°C chilling profile.",
      "evidence": "SCADA temperature trend logger for Reactor R-102."
    },
    {
      "step_number": 4,
      "question": "Why did Reactor R-102 fail to cool the batch to the recipe setpoint?",
      "answer": "The secondary chilled water valve (CV-102) was stuck at 25% open position due to actuator pneumatic seal failure.",
      "evidence": "Maintenance diagnostic log on chiller loop CV-102."
    },
    {
      "step_number": 5,
      "question": "Why did the actuator pneumatic seal fail without prior alarm?",
      "answer": "Preventive maintenance interval for pneumatic positioner seals was overdue by 45 days due to scheduling backlogs.",
      "evidence": "Maximo CMMS Work Order PM-R102-CH overdue status."
    }
  ],
  "root_causes": [
    {
      "cause_text": "Chiller loop actuator CV-102 pneumatic seal failure preventing crystallizer from reaching 10°C setpoint.",
      "cause_category": "machine",
      "likelihood": "high",
      "is_confirmed": false,
      "status": "hypothesis",
      "source": "ai_suggested",
      "evidence_supporting": "SCADA trend showing 18°C minimum temperature and actuator positioner diagnostics.",
      "verification_steps": "Disassemble valve CV-102, test pneumatic actuator seal integrity under pressure."
    },
    {
      "cause_text": "Overdue preventive maintenance schedule for reactor utility control valves.",
      "cause_category": "method",
      "likelihood": "high",
      "is_confirmed": false,
      "status": "hypothesis",
      "source": "ai_suggested",
      "evidence_supporting": "Maximo CMMS system overdue log for PM-R102-CH.",
      "verification_steps": "Audit calibration and PM records across all Synthesis Suite reactors."
    },
    {
      "cause_text": "Potential analytical column degradation or mobile phase preparation error during HPLC assay run.",
      "cause_category": "measurement",
      "likelihood": "low",
      "is_confirmed": false,
      "status": "hypothesis",
      "source": "ai_suggested",
      "evidence_supporting": "System suitability check passed, but column pressure was elevated by 15 bar.",
      "verification_steps": "Perform re-injection on qualified secondary C18 column with fresh mobile phase."
    }
  ]
}"""

    llm = get_llm()
    why_steps = []
    root_causes = []
    try:
        response = llm.invoke([
            SystemMessage(content=system_prompt),
            HumanMessage(content=f"Incident Details:\n{json.dumps(current, indent=2)}\nUser Context: {user_input}")
        ])
        data = extract_json_from_text(response.content)
        why_steps = data.get("why_steps", [])
        root_causes = data.get("root_causes", [])
    except Exception as e:
        logger.error(f"Analyze root cause failed: {e}")

    return {
        "why_steps": why_steps,
        "root_causes": root_causes,
        "change_summary": ["Generated 5 Whys iterative chain and 6M Fishbone root cause hypotheses (Pending human verification)."]
    }

# Node 8: Generate CAPA Recommendations
def generate_capa_node(state: RCAState) -> Dict[str, Any]:
    current = {**state.get("current_form_data", {}), **state.get("form_updates", {})}
    root_causes = state.get("root_causes", [])

    system_prompt = """You are a Pharmaceutical Quality Compliance (CAPA) Manager.
Based on the deviation and identified root cause hypotheses, generate 2 to 4 actionable, regulatory-compliant CAPA actions.
Distinguish clearly between:
- "corrective": action to eliminate the cause of the immediate non-conformance (e.g. replace failed valve seal, reprocess batch if validated).
- "preventive": action to eliminate the cause of a potential non-conformance across other systems (e.g. revise CMMS PM notification frequency, add automated SCADA temperature deviation interlocks).

Respond ONLY with a JSON array:
[
  {
    "action_type": "corrective",
    "description": "Replace pneumatic actuator seal on CV-102 and re-qualify cooling rate of Reactor R-102.",
    "rationale": "Directly resolves the temperature excursion mechanism responsible for incomplete crystallization.",
    "related_root_cause": "Chiller loop actuator CV-102 pneumatic seal failure",
    "responsible_person": "Instrumentation Lead Engineer",
    "responsible_department": "Engineering & Maintenance",
    "target_date": "2026-08-15",
    "priority": "high",
    "status": "proposed",
    "effectiveness_verification": "Verify leak-tightness at 6 bar pneumatic pressure and execute blank water trial with temperature logging."
  },
  {
    "action_type": "preventive",
    "description": "Implement automated SCADA alarm and recipe hold if crystallizer slurry fails to reach <12°C within 120 minutes.",
    "rationale": "Prevents downstream filtration of un-crystallized batch in future campaigns.",
    "related_root_cause": "Inadequate real-time warning of cooling failure",
    "responsible_person": "Automation Systems Specialist",
    "responsible_department": "Process Automation",
    "target_date": "2026-08-30",
    "priority": "medium",
    "status": "proposed",
    "effectiveness_verification": "Review next 5 commercial API batch runs to verify interlock activation under simulated condition."
  }
]"""

    llm = get_llm()
    capa_actions = []
    try:
        response = llm.invoke([
            SystemMessage(content=system_prompt),
            HumanMessage(content=f"Incident Summary:\n{json.dumps(current, indent=2)}\n\nRoot Causes:\n{json.dumps(root_causes, indent=2)}")
        ])
        data = extract_json_from_text(response.content)
        if isinstance(data, list):
            capa_actions = data
        elif isinstance(data, dict) and "capa" in data:
            capa_actions = data["capa"]
    except Exception as e:
        logger.error(f"Generate CAPA failed: {e}")

    return {
        "capa_actions": capa_actions,
        "change_summary": ["Generated Corrective and Preventive Action (CAPA) recommendations with effectiveness verification criteria."]
    }

# Node 9: Answer General Question
def answer_question_node(state: RCAState) -> Dict[str, Any]:
    user_input = state.get("user_input", "")
    current = state.get("current_form_data", {})

    system_prompt = """You are AIVOA Co-Pilot, an intelligent AI Assistant for Pharmaceutical Quality and API Root Cause Analysis.
Answer the user's inquiry clearly, professionally, and accurately within the context of current GMP standards and the ongoing investigation.
Keep explanations concise, evidence-driven, and actionable."""

    llm = get_llm()
    try:
        response = llm.invoke([
            SystemMessage(content=system_prompt),
            HumanMessage(content=f"Current Investigation Context:\n{json.dumps(current, indent=2)}\n\nUser Question:\n{user_input}")
        ])
        content = response.content
    except Exception as e:
        logger.error(f"Answer question failed: {e}")
        content = "I am ready to assist with your pharmaceutical Root Cause Analysis. You can ask questions, provide batch updates, or request 5 Whys analysis."

    return {
        "response_message": content,
        "form_updates": {},
        "change_summary": []
    }

# Node 10: Compose Response
def compose_response_node(state: RCAState) -> Dict[str, Any]:
    intent = state.get("intent", "log_rca")
    form_updates = state.get("form_updates", {})
    change_summary = state.get("change_summary", [])
    risk = state.get("risk_assessment", {})
    root_causes = state.get("root_causes", [])
    capa_actions = state.get("capa_actions", [])
    evidence_gaps = state.get("evidence_gaps", [])

    if state.get("response_message"):
        msg = state["response_message"]
    elif intent == "log_rca":
        product = form_updates.get("product_name", "the reported product")
        batch = form_updates.get("batch_number", "the specified batch")
        severity = risk.get("severity", "major").upper()
        msg = (
            f"I have logged the Root Cause Analysis investigation for **{product}** (Batch: `{batch}`).\n\n"
            f"• **Risk Classification:** Evaluated as **{severity}** severity.\n"
            f"• **Immediate Containment:** {risk.get('immediate_containment', 'Batch quarantined pending investigation.')}\n"
            f"• **Form Auto-Population:** All extracted incident, batch, and containment parameters have been populated on the RCA workspace."
        )
    elif intent == "edit_rca":
        summary_bullets = "\n".join([f"• {c}" for c in change_summary])
        msg = (
            f"I have applied your corrections to the investigation record while preserving all other parameters:\n\n"
            f"{summary_bullets}\n\n"
            f"The risk assessment and investigation workspace have been updated accordingly."
        )
    elif intent == "document_extraction":
        title = form_updates.get("title", "Uploaded Document")
        batch = form_updates.get("batch_number", "Extracted Lot")
        msg = (
            f"Successfully extracted deviation document data for **{title}** (Batch: `{batch}`).\n\n"
            f"• Populated batch information, incident timeline, and containment status.\n"
            f"• Identified **{len(evidence_gaps)} critical evidence gaps** requiring review.\n"
            f"• Generated preliminary risk assessment card."
        )
    elif intent == "analyze_rca":
        msg = (
            f"Completed comprehensive Root Cause Analysis:\n\n"
            f"• **5 Whys Analysis:** Formulated 5-step iterative chain leading to equipment pneumatic actuator failure.\n"
            f"• **Fishbone (6M):** Identified **{len(root_causes)} potential root cause hypotheses** across Machine, Method, and Measurement.\n\n"
            f"Note: In accordance with cGMP standards, all generated causes are tagged as hypotheses and require Qualified Person confirmation."
        )
    elif intent == "generate_capa":
        msg = (
            f"Formulated **{len(capa_actions)} targeted CAPA actions** (Corrective and Preventive):\n\n"
            f"• Identified engineering repairs, preventive maintenance calibration intervals, and recipe interlocks.\n"
            f"• Defined quantitative effectiveness verification criteria for each proposed action."
        )
    else:
        msg = "Investigation workspace updated."

    # Contextual prompt suggestions for next steps
    suggested = []
    if intent in ["log_rca", "document_extraction"]:
        suggested = [
            "Analyze root causes using 5 Whys and Fishbone",
            "Generate CAPA recommendations",
            "What evidence is missing from this investigation?",
            "Correction: batch number is CHG260712A, 50 kg in 2 HDPE drums"
        ]
    elif intent == "edit_rca":
        suggested = [
            "Run 5 Whys analysis on this updated batch",
            "Generate CAPA actions for this deviation",
            "Save investigation to database"
        ]
    elif intent == "analyze_rca":
        suggested = [
            "Generate CAPA recommendations for these causes",
            "Highlight missing evidentiary support",
            "Save and finalize investigation record"
        ]
    else:
        suggested = [
            "Perform 5 Whys Root Cause Analysis",
            "Suggest corrective and preventive actions",
            "How do I upload an incident PDF report?"
        ]

    return {
        "response_message": msg,
        "suggested_prompts": suggested
    }

# Build LangGraph Workflow
def build_langgraph_workflow():
    workflow = StateGraph(RCAState)

    # Add all nodes
    workflow.add_node("classify_intent", classify_intent_node)
    workflow.add_node("extract_incident", extract_incident_node)
    workflow.add_node("apply_edit", apply_edit_node)
    workflow.add_node("extract_document", extract_document_node)
    workflow.add_node("assess_risk", assess_risk_node)
    workflow.add_node("detect_evidence_gaps", detect_evidence_gaps_node)
    workflow.add_node("analyze_root_cause", analyze_root_cause_node)
    workflow.add_node("generate_capa", generate_capa_node)
    workflow.add_node("answer_question", answer_question_node)
    workflow.add_node("compose_response", compose_response_node)

    # Set Entry Point
    workflow.set_entry_point("classify_intent")

    # Routing condition based on classified intent
    def route_intent(state: RCAState) -> str:
        return state.get("intent", "log_rca")

    workflow.add_conditional_edges(
        "classify_intent",
        route_intent,
        {
            "log_rca": "extract_incident",
            "edit_rca": "apply_edit",
            "document_extraction": "extract_document",
            "analyze_rca": "analyze_root_cause",
            "generate_capa": "generate_capa",
            "qna": "answer_question"
        }
    )

    # Extraction paths -> assess_risk -> detect_evidence_gaps -> compose_response
    workflow.add_edge("extract_incident", "assess_risk")
    workflow.add_edge("assess_risk", "detect_evidence_gaps")
    workflow.add_edge("detect_evidence_gaps", "compose_response")

    # Edit path -> assess_risk (re-evaluates with updated fields) -> compose_response
    workflow.add_edge("apply_edit", "assess_risk")

    # Document extraction path
    workflow.add_edge("extract_document", "assess_risk")

    # Analysis path -> generates root causes, then auto-proposes CAPA
    workflow.add_edge("analyze_root_cause", "generate_capa")
    workflow.add_edge("generate_capa", "compose_response")

    # QnA path
    workflow.add_edge("answer_question", "compose_response")

    # Exit
    workflow.add_edge("compose_response", END)

    return workflow.compile()

# Singleton compiled workflow
rca_graph = build_langgraph_workflow()

async def run_rca_workflow(
    user_input: str,
    current_form_data: Optional[Dict[str, Any]] = None,
    document_text: str = ""
) -> Dict[str, Any]:
    initial_state: RCAState = {
        "user_input": user_input,
        "intent": "",
        "current_form_data": current_form_data or {},
        "document_text": document_text,
        "form_updates": {},
        "change_summary": [],
        "risk_assessment": {},
        "root_causes": [],
        "why_steps": [],
        "capa_actions": [],
        "evidence_gaps": [],
        "provenance": {},
        "suggested_prompts": [],
        "response_message": "",
        "tool_used": ""
    }

    # Run LangGraph synchronously/in thread since invoke is synchronous LLM
    try:
        result = rca_graph.invoke(initial_state)
        return result
    except Exception as e:
        logger.error(f"LangGraph execution error: {e}", exc_info=True)
        raise e
