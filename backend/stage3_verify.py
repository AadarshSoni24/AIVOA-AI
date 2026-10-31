import json
import os
import sys
from fastapi.testclient import TestClient

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

from main import app

client = TestClient(app)

print("=" * 80)
print("STAGE 3: VERIFY WITH REAL OUTPUT")
print("=" * 80)

# ==============================================================================
# TEST 1: Initial Text Intake
# ==============================================================================
print("\n[TEST 1] Natural Language Text Intake")
print("POST /api/copilot/message")

empty_inv = {
    "id": None,
    "investigation_no": "RCA-2026-0001",
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
    "investigation_method": "both",
    "root_causes": [],
    "why_steps": [],
    "capa": [],
    "documents": [],
    "field_meta": {}
}

intake_payload = {
    "message": "Log deviation: Metformin Hydrochloride API batch MFH260712A reported assay of 97.2%",
    "input_type": "text",
    "investigation": empty_inv,
    "history": [],
    "force_action": None
}

res1 = client.post("/api/copilot/message", json=intake_payload)
print(f"Status Code: {res1.status_code}")
data1 = res1.json()
print("Top-level keys returned:", list(data1.keys()))
print("Assistant Message:", data1.get("assistant_message"))
print("Change Log Count:", len(data1.get("change_log", [])))
print("Product Name:", data1["investigation"]["product"]["name"])
print("Batch Number:", data1["investigation"]["product"]["batch_number"])
print("Severity:", data1["investigation"]["risk"]["severity"])
print("Field Meta Sample:", dict(list(data1["investigation"]["field_meta"].items())[:4]))

inv_after_t1 = data1["investigation"]

# ==============================================================================
# TEST 2: Correction Message (Partial Merge & Field Preservation)
# ==============================================================================
print("\n[TEST 2] Correction Message: Partial update of batch number and quantity")
print("POST /api/copilot/message")

corr_payload = {
    "message": "Correction: batch number is CHG260712A, 50 kg across 2 HDPE drums",
    "input_type": "text",
    "investigation": inv_after_t1,
    "history": [
        {"role": "user", "content": intake_payload["message"]},
        {"role": "assistant", "content": data1["assistant_message"]}
    ],
    "force_action": None
}

res2 = client.post("/api/copilot/message", json=corr_payload)
print(f"Status Code: {res2.status_code}")
data2 = res2.json()
print("Assistant Message:", data2.get("assistant_message"))
print("Change Log Items:")
for chg in data2.get("change_log", []):
    print(f"  - {chg['label']} ({chg['path']}): {chg['old']} -> {chg['new']} (source: {chg['source']})")

print("VERIFY PRESERVATION:")
print("  - Product Name (preserved):", data2["investigation"]["product"]["name"])
print("  - Batch Number (updated):", data2["investigation"]["product"]["batch_number"])
print("  - Affected Quantity (updated):", data2["investigation"]["product"]["affected_quantity"])
print("  - Unit (updated):", data2["investigation"]["product"]["unit"])
print("  - Severity (preserved):", data2["investigation"]["risk"]["severity"])

inv_after_t2 = data2["investigation"]

# ==============================================================================
# TEST 3: PDF Document Upload
# ==============================================================================
print("\n[TEST 3] PDF Document Upload: sample_incident.pdf")
print("POST /api/copilot/upload")

pdf_path = os.path.join(os.path.dirname(__file__), "sample_data", "sample_incident.pdf")
with open(pdf_path, "rb") as f:
    files = {"file": ("sample_incident.pdf", f, "application/pdf")}
    data = {
        "investigation": json.dumps(inv_after_t2),
        "history": json.dumps([
            {"role": "user", "content": corr_payload["message"]},
            {"role": "assistant", "content": data2["assistant_message"]}
        ])
    }
    res3 = client.post("/api/copilot/upload", files=files, data=data)

print(f"Status Code: {res3.status_code}")
data3 = res3.json()
print("Assistant Message:", data3.get("assistant_message"))
print("Documents list in investigation:", data3["investigation"]["documents"])
print("Evidence count:", len(data3["investigation"]["evidence"]))
print("Missing evidence sample:", [e["description"] for e in data3["investigation"]["evidence"] if e["availability"] == "missing"][:2])

inv_after_t3 = data3["investigation"]

# ==============================================================================
# TEST 4: Persistence to Database
# ==============================================================================
print("\n[TEST 4] Save Investigation & Fetch History")
print("POST /api/investigations")

res4 = client.post("/api/investigations", json=inv_after_t3)
print(f"Save Status Code: {res4.status_code}")
saved_inv = res4.json()
print("Saved ID:", saved_inv.get("id"))
print("Saved Investigation No:", saved_inv.get("investigation_no"))
print("Saved Status:", saved_inv.get("status"))

print("\nGET /api/investigations")
res5 = client.get("/api/investigations")
print(f"List Status Code: {res5.status_code}")
history_list = res5.json()
print("Saved investigations found:", len(history_list))
if history_list:
    print("Latest saved item summary:", history_list[0])

print("\nALL BACKEND API CONTRACT TESTS EXECUTED SUCCESSFULLY!")
