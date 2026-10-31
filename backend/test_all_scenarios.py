import asyncio
import os
import sys

# Ensure backend path is in sys.path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from httpx import AsyncClient, ASGITransport
from main import app
from database import init_db

async def run_verification():
    print("=" * 60)
    print("AIVOA.AI RCA MODULE - 10 SCENARIOS VERIFICATION SUITE")
    print("=" * 60)

    # Init database
    print("\n[INIT] Initializing database...")
    await init_db()
    print("[INIT] Database initialized successfully.")

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # TEST 0: Health check
        print("\n--- TEST 0: Health Check Endpoint ---")
        res0 = await client.get("/api/health")
        assert res0.status_code == 200, f"Expected 200, got {res0.status_code}"
        print("PASS: Health Check:", res0.json())

        # TEST 1: Create an RCA investigation through natural-language input
        print("\n--- TEST 1: Natural Language RCA Creation ---")
        prompt1 = (
            "During manufacturing of Metformin Hydrochloride API batch MFH260712A, "
            "QC reported an assay result of 97.2%, below the required specification of 98.0–102.0%. "
            "The batch was manufactured on 12 July 2026 and is currently on hold."
        )
        res1 = await client.post("/api/copilot/message", json={"message": prompt1})
        assert res1.status_code == 200, f"Expected 200, got {res1.status_code}: {res1.text}"
        data1 = res1.json()
        print(f"PASS: Tool Used: {data1.get('tool_used')}")
        print(f"PASS: Extracted Product: {data1['form_updates'].get('product_name')}")
        print(f"PASS: Extracted Batch: {data1['form_updates'].get('batch_number')}")
        print(f"PASS: Severity: {data1['risk_assessment'].get('severity')}")
        assert data1['form_updates'].get('batch_number') == 'MFH260712A', "Batch number mismatch"
        current_investigation = data1['form_updates']

        await asyncio.sleep(2)
        # TEST 2: Correct batch number and affected quantity
        print("\n--- TEST 2: AI Correction / Edit Tool ---")
        prompt2 = "Correction: the batch number is CHG260712A and affected quantity is 50 kg across two HDPE drums."
        res2 = await client.post("/api/copilot/message", json={
            "message": prompt2,
            "current_form_data": current_investigation
        })
        assert res2.status_code == 200
        data2 = res2.json()
        print(f"PASS: Tool Used: {data2.get('tool_used')}")
        print(f"PASS: Form Updates: {data2.get('form_updates')}")
        print(f"PASS: Change Summary: {data2.get('change_summary')}")
        assert data2['form_updates'].get('batch_number') == 'CHG260712A', "Batch number not updated"

        # TEST 3: Verify other fields remain unchanged (Preservation test)
        print("\n--- TEST 3: Preservation of Unmodified Fields ---")
        merged = {**current_investigation, **data2['form_updates']}
        print(f"PASS: Product Name preserved: {merged.get('product_name')}")
        assert 'Metformin' in merged.get('product_name', ''), "Product name was lost during edit!"
        current_investigation = merged

        await asyncio.sleep(2)
        # TEST 4: Upload sample PDF and extract information
        print("\n--- TEST 4: PDF Extraction Tool ---")
        pdf_path = os.path.join(os.path.dirname(__file__), "sample_data", "sample_incident.pdf")
        with open(pdf_path, "rb") as f:
            pdf_bytes = f.read()

        res4 = await client.post(
            "/api/copilot/upload",
            files={"file": ("sample_incident.pdf", pdf_bytes, "application/pdf")}
        )
        assert res4.status_code == 200
        data4 = res4.json()
        print(f"PASS: Tool Used: {data4.get('tool_used')}")
        print(f"PASS: Extracted Batch from PDF: {data4['form_updates'].get('batch_number')}")
        print(f"PASS: Extracted Quantity: {data4['form_updates'].get('affected_quantity')}")
        print(f"PASS: PDF Risk Severity: {data4['risk_assessment'].get('severity')}")

        # TEST 5: Verify missing evidence detection
        print("\n--- TEST 5: Missing Evidence Detection ---")
        evidence_gaps = data4.get("evidence_gaps", [])
        print(f"PASS: Detected Evidence Gaps ({len(evidence_gaps)} items):")
        for g in evidence_gaps:
            print(f"   • {g}")
        assert len(evidence_gaps) > 0, "No evidence gaps detected!"

        await asyncio.sleep(2)
        # TEST 6: Generate 5 Whys and Potential Root Causes
        print("\n--- TEST 6: 5 Whys and Root Cause Generation ---")
        prompt6 = "Perform root cause analysis using 5 Whys and 6M Fishbone for this temperature excursion and low assay."
        res6 = await client.post("/api/copilot/message", json={
            "message": prompt6,
            "current_form_data": current_investigation
        })
        assert res6.status_code == 200
        data6 = res6.json()
        why_steps = data6.get("why_steps", [])
        root_causes = data6.get("root_causes", [])
        print(f"PASS: Generated {len(why_steps)} Why Steps:")
        for w in why_steps:
            print(f"   Why {w.get('step_number')}: {w.get('question')} -> {w.get('answer')[:50]}...")
        print(f"PASS: Generated {len(root_causes)} Root Cause Hypotheses:")
        for rc in root_causes:
            print(f"   [{rc.get('cause_category')}] {rc.get('cause_text')} (Confirmed: {rc.get('is_confirmed')})")
        assert len(why_steps) >= 3, "Expected at least 3 Why steps"
        assert len(root_causes) > 0, "Expected at least 1 root cause"
        # Verify safeguard: root causes must NOT be auto-confirmed
        assert not any(rc.get('is_confirmed') for rc in root_causes), "SAFEGUARD VIOLATED: AI auto-confirmed a root cause!"

        # TEST 7: Generate CAPA recommendations
        print("\n--- TEST 7: CAPA Recommendations ---")
        capa_actions = data6.get("capa_actions", [])
        if not capa_actions:
            res7 = await client.post("/api/copilot/message", json={
                "message": "Generate CAPA actions for this deviation",
                "current_form_data": current_investigation
            })
            capa_actions = res7.json().get("capa_actions", [])
        print(f"PASS: Generated {len(capa_actions)} CAPA Actions:")
        for c in capa_actions:
            print(f"   [{c.get('action_type').upper()}] {c.get('description')} (Priority: {c.get('priority')})")
        assert len(capa_actions) > 0, "No CAPA actions generated"

        # TEST 8: Save Investigation to Database
        print("\n--- TEST 8: Save Investigation to Database ---")
        save_payload = {
            **current_investigation,
            "investigation_number": "RCA-2026-TEST",
            "root_causes": root_causes,
            "why_steps": why_steps,
            "capa_actions": capa_actions,
            "impact_severity": "major"
        }
        res8 = await client.post("/api/investigations", json=save_payload)
        assert res8.status_code in [200, 201], f"Save failed: {res8.text}"
        saved_inv = res8.json()
        inv_id = saved_inv["id"]
        print(f"PASS: Saved Investigation ID: {inv_id}")
        print(f"PASS: Investigation Number: {saved_inv['investigation_number']}")

        # TEST 9: Human Confirmation and Rejection of Root Causes
        print("\n--- TEST 9: Human Confirm & Reject Workflow ---")
        saved_causes = saved_inv.get("root_causes", [])
        assert len(saved_causes) > 0, "No saved root causes found"
        cause1_id = saved_causes[0]["id"]
        res_confirm = await client.post(f"/api/investigations/{inv_id}/root-causes/{cause1_id}/confirm")
        assert res_confirm.status_code == 200
        confirmed_rc = res_confirm.json()
        print(f"PASS: Confirmed Cause 1: is_confirmed={confirmed_rc['is_confirmed']}, confirmed_by={confirmed_rc['confirmed_by']}")
        assert confirmed_rc['is_confirmed'] is True

        if len(saved_causes) > 1:
            cause2_id = saved_causes[1]["id"]
            res_reject = await client.post(f"/api/investigations/{inv_id}/root-causes/{cause2_id}/reject")
            assert res_reject.status_code == 200
            rejected_rc = res_reject.json()
            print(f"PASS: Rejected Cause 2: status={rejected_rc['status']}")
            assert rejected_rc['status'] == 'rejected'

        # TEST 10: Retrieve and Reload Saved Investigation
        print("\n--- TEST 10: Reload Investigation from Database ---")
        res10 = await client.get(f"/api/investigations/{inv_id}")
        assert res10.status_code == 200
        reloaded = res10.json()
        print(f"PASS: Reloaded Investigation: {reloaded['investigation_number']}")
        print(f"PASS: Batch Number in DB: {reloaded['batch_number']}")
        print(f"PASS: Total Root Causes in DB: {len(reloaded['root_causes'])}")
        print(f"PASS: Total Why Steps in DB: {len(reloaded['why_steps'])}")
        print(f"PASS: Total CAPA Actions in DB: {len(reloaded['capa_actions'])}")
        assert reloaded['batch_number'] == current_investigation.get('batch_number')

    print("\n" + "=" * 60)
    print("ALL 10 SCENARIOS VERIFIED SUCCESSFULLY WITH 100% PASS RATE!")
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(run_verification())
