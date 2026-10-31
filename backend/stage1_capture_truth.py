import json
import os
import sys
from fastapi.testclient import TestClient

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from main import app

client = TestClient(app)

empty_investigation = {
    "id": None,
    "investigation_no": "RCA-2026-001",
    "status": "draft",
    "incident": {
        "title": "",
        "description": "",
        "source_reference": "",
        "date_occurrence": "",
        "date_discovery": "",
        "department": "",
        "facility": "",
        "reported_by": "",
        "category": "",
        "detection_method": "",
        "initial_severity": ""
    },
    "product": {
        "name": "",
        "grade": "",
        "batch_number": "",
        "manufacturing_stage": "",
        "manufacturing_date": "",
        "equipment": "",
        "affected_quantity": "",
        "unit": "",
        "production_details": ""
    },
    "impact": {
        "expected_condition": "",
        "actual_condition": "",
        "quality_impact": "",
        "product_impact": "",
        "patient_impact": "",
        "containment_actions": ""
    },
    "risk": {
        "severity": "",
        "containment_required": None,
        "next_action": "",
        "rationale": "",
        "occurrence": "",
        "detectability": ""
    },
    "evidence": [],
    "investigation_method": None,
    "root_causes": [],
    "why_steps": [],
    "capa": [],
    "documents": [],
    "field_meta": {}
}

print("=" * 80)
print("STAGE 1: CAPTURE THE TRUTH (CURRENT BACKEND IMPLEMENTATION)")
print("=" * 80)

# ----------------------------------------------------
# (a) POST /api/copilot/message
# ----------------------------------------------------
msg_payload = {
    "message": "Log deviation: Metformin Hydrochloride API batch MFH260712A reported assay of 97.2%",
    "input_type": "text",
    "investigation": empty_investigation,
    "history": [],
    "force_action": None
}

print("\n--- (a) TEXT MESSAGE REQUEST ---")
print("Request URL: http://localhost:8000/api/copilot/message")
print("Method: POST")
print("Payload:")
print(json.dumps(msg_payload, indent=2))

res_msg = client.post("/api/copilot/message", json=msg_payload)
print(f"\nStatus Code: {res_msg.status_code}")
print("FULL JSON Response:")
try:
    print(json.dumps(res_msg.json(), indent=2))
except Exception:
    print(res_msg.text)

# ----------------------------------------------------
# (b) POST /api/copilot/upload
# ----------------------------------------------------
sample_pdf_path = os.path.join(os.path.dirname(__file__), "sample_data", "sample_incident.pdf")
print("\n--- (b) PDF UPLOAD REQUEST ---")
print("Request URL: http://localhost:8000/api/copilot/upload")
print("Method: POST")
print(f"File Path: {sample_pdf_path}")
print("Form Fields:")
print(f"  - investigation: {json.dumps(empty_investigation)[:80]}...")
print("  - history: []")

with open(sample_pdf_path, "rb") as f:
    files = {"file": ("sample_incident.pdf", f, "application/pdf")}
    data = {
        "investigation": json.dumps(empty_investigation),
        "history": "[]"
    }
    res_upload = client.post("/api/copilot/upload", files=files, data=data)

print(f"\nStatus Code: {res_upload.status_code}")
print("FULL JSON Response:")
try:
    print(json.dumps(res_upload.json(), indent=2))
except Exception:
    print(res_upload.text)

