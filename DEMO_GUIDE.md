# AIVOA.AI — Demo Recording Scripts & Submission Guide

This document provides exact, timed speaking points and step-by-step click paths for recording the two mandatory submission videos.

---

## Quick Launch Instructions
To run the full stack:
Double click **`start_app.bat`** in this folder, OR run:
```powershell
powershell -ExecutionPolicy Bypass -File .\run_app.ps1
```
- **Frontend App:** http://localhost:5173
- **Backend API Docs:** http://localhost:8000/docs
- **Sample Incident PDF:** `backend\sample_data\sample_incident.pdf`

---

## VIDEO 1: Product Demonstration (5–8 Minutes)
**Focus:** User experience, AI-assisted form filling (no manual entry), investigation drill-down, human verification.

### Timeline & Step-by-Step Script

#### 1. Introduction (0:00 – 1:00)
- **Visual:** Open browser to `http://localhost:5173`.
- **Speaking Points:**
  > *"Hello, this is my submission for the AIVOA.AI Root Cause Analysis (RCA) challenge for Active Pharmaceutical Ingredients (API) manufacturing.*
  > *In cGMP pharmaceutical manufacturing, quality deviations must follow a disciplined workflow: Deviation Identification → Root Cause Analysis (5 Whys and Fishbone) → Corrective and Preventive Actions (CAPA).*
  > *Notice the split-screen interface: on the left is our RCA Investigation Workspace, and on the right is the AIVOA Co-Pilot AI Assistant. Per the challenge requirements, we do not manually fill the form; the AI assistant is the primary driver of all data entry, analysis, and updates."*

#### 2. Test Scenario 1: Natural-Language Incident Intake (1:00 – 2:30)
- **Action:** In the AIVOA Co-Pilot chat input on the right, paste:
  ```text
  During manufacturing of Metformin Hydrochloride API batch MFH260712A, QC reported an assay result of 97.2%, below the required specification of 98.0–102.0%. The batch was manufactured on 12 July 2026 and is currently on hold.
  ```
  Click **Send**.
- **Visual to point out:**
  - Processing indicator: *"Extracting incident data and assessing initial risk..."*
  - Left panel immediately flashes with the teal highlight glow (`ai-updated-glow`).
  - Fields auto-populated: Product Name, Batch Number (`MFH260712A`), Manufacturing Date, Severity (`MAJOR`), Incident Category (`OOS - Assay`), Detection Method (`QC Testing`), and Quarantine Containment.
  - Point to the **Field Provenance Badges**: show the blue *"Extracted (96% conf)"* badge with evidence quotation.
  - Point to the **Risk Assessment Card** on the right: Severity classified as **MAJOR**, immediate containment defined, and critical missing evidence gaps displayed in amber.

#### 3. Test Scenario 2: AI-Powered Field Correction & Partial Merge (2:30 – 3:45)
- **Action:** In the Co-Pilot chat, paste:
  ```text
  Sorry, the batch number is CHG260712A and affected quantity is 50 kg across two HDPE drums.
  ```
  Click **Send**.
- **Visual to point out:**
  - AI identifies the `edit_rca` intent.
  - Left panel highlights: Batch Number updates to `CHG260712A`, Affected Quantity updates to `50 kg`, Packaging Units updates to `2 HDPE Drums`.
  - **Emphasize Field Preservation:** Show that all other previously extracted fields (Product Name, Description, Dates, Containment) remained completely intact without being overwritten.
  - Show the provenance badge on Batch Number now says *"Reviewed (99% conf)"*.

#### 4. Test Scenario 3: PDF Document Extraction (3:45 – 5:00)
- **Action:** Click the paperclip icon in the Co-Pilot chat and select `backend/sample_data/sample_incident.pdf` (or use drag-and-drop). Click **Send**.
- **Visual to point out:**
  - PyMuPDF parses the multi-page internal deviation report.
  - Automatically extracts: Fluidized Bed Dryer (FBD-301) temperature excursion (spiked to 74°C), Impurity B level, Lead Investigator Dr. Arvind Sharma, and quarantine location.
  - Show the updated **Missing Evidence Callouts**: e.g. missing analytical balance calibration BAL-042, missing raw material CoA.

#### 5. Test Scenario 4: 5 Whys & Fishbone Root Cause Analysis (5:00 – 6:30)
- **Action:** Click the suggested prompt chip or type:
  ```text
  Perform root cause analysis using 5 Whys and 6M Fishbone for this temperature excursion.
  ```
- **Visual to point out:**
  - Scroll down to Section 4: **Root Cause Analysis**.
  - Show the **5 Whys Visual Step Ladder**:
    - Why 1: Low assay -> Why 2: Mother liquor API loss -> Why 3: Crystallization incomplete at 18°C -> Why 4: Chilled water valve CV-102 pneumatic seal failure -> Why 5: Overdue preventive maintenance.
  - Toggle the tab to **Ishikawa 6M Fishbone**: show causes mapped under Machine, Method, Measurement, Man, and Mother Nature.
  - **Critical Safeguard:** Point out that all AI causes are marked as `Hypothesis (Unconfirmed)` with amber badges.
  - **Action:** Click **"Confirm"** on the primary machine cause. Watch it turn into a green **"QP Confirmed"** badge with Qualified Person verification.
  - Click **"Reject"** on the secondary hypothesis to demonstrate human oversight.

#### 6. Test Scenario 5: CAPA Recommendations & Database Persistence (6:30 – 7:45)
- **Action:** Click the suggested prompt:
  ```text
  Generate CAPA actions for this deviation
  ```
- **Visual to point out:**
  - Scroll to Section 5: **Corrective & Preventive Actions (CAPA)**.
  - Highlight the distinction between **Corrective Actions** (immediate valve seal replacement, pressure test at 6 bar) and **Preventive Actions** (automated SCADA recipe hold interlock, revised Maximo PM frequency).
  - Note the quantitative effectiveness verification metrics.
- **Action:** Click the **"Save Investigation"** button in the header.
  - Show the green checkmark and toast notification: *"Investigation persisted to database"*.
- **Action:** Click **"Saved Investigations"** modal in the header, click the saved record, and demonstrate full retrieval from the database.
- **Closing:** Thank the evaluators.

---

## VIDEO 2: Technical Walkthrough (5–10 Minutes)
**Focus:** Architectural design, LangGraph StateGraph, deterministic merge logic, SQLAlchemy models, and Redux Toolkit store.

### Timeline & Code Inspection Path

#### 1. System Architecture Overview (0:00 – 1:30)
- Open the workspace in VS Code / IDE.
- Show project tree:
  - `backend/`: FastAPI, LangGraph workflow, SQLAlchemy 2.0 models, Pydantic schemas, PyMuPDF extractor.
  - `frontend/`: React 18, Redux Toolkit, Tailwind CSS v4, Vite.
- Point to `run_app.ps1` / `start_app.bat` for one-click launching.

#### 2. LangGraph StateGraph & Groq LLM Engine (1:30 – 4:00)
- Open `backend/services/langgraph_workflow.py`.
- **Walk through the StateGraph:**
  - Explain `RCAState` TypedDict.
  - Show node architecture: `classify_intent` → conditional routing:
    - `log_rca` → `extract_incident` → `assess_risk` → `detect_evidence_gaps` → `compose_response`
    - `edit_rca` → `apply_edit` → `assess_risk` → `compose_response`
    - `document_extraction` → `extract_document` → `assess_risk`
    - `analyze_rca` → `analyze_root_cause` → `generate_capa`
- **Highlight Deterministic Python Merge Logic:**
  - Show `apply_edit_node`: explain how the LLM generates only targeted diff updates, and Python deterministically merges the fields into the existing form, ensuring unmodified fields can never be overwritten.
- **Highlight Safeguards:**
  - Show `analyze_root_cause_node`: hardcoded `is_confirmed: False` and `status: 'hypothesis'`.

#### 3. PyMuPDF Document Extractor & APIs (4:00 – 6:00)
- Open `backend/services/document_extractor.py`:
  - Show `fitz.open()` text stream extraction, section normalization, and header/footer cleanup.
- Open `backend/routes/copilot.py`:
  - Show `/api/copilot/message` and `/api/copilot/upload`.
- Open `backend/routes/investigations.py`:
  - Show full CRUD, `/confirm` and `/reject` human sign-off endpoints.
  - Show `selectinload` relationship eager-loading preventing asyncio lazy-load errors.

#### 4. SQLAlchemy 2.0 Database Models (6:00 – 7:30)
- Open `backend/models/investigation.py`:
  - Show tables: `investigations`, `root_causes`, `why_steps`, `capa_actions`, `evidence_items`, `documents`, `audit_events`.
  - Explain how `provenance_map` and `ai_risk_assessment` are stored as JSON for auditability.
  - Show cascading deletes and foreign keys.

#### 5. Frontend & Redux Toolkit Architecture (7:30 – 9:00)
- Open `frontend/src/store/slices/investigationSlice.ts`:
  - Show `applyAIUpdates` reducer: merges AI updates, tracks `recentlyUpdatedFields` for glow animation.
  - Show `confirmRootCauseLocal` and `rejectRootCauseLocal`.
- Open `frontend/src/components/form/FormField.tsx`:
  - Show read-only by default state, pencil lock toggle, `ProvenanceBadge` integration, and `.ai-updated-glow` animation.
- Open `frontend/src/components/analysis/FiveWhysAnalysis.tsx` and `FishboneChart.tsx`:
  - Show visual timeline and 6M category grouping.

#### 6. Summary & Verification Matrix (9:00 – 10:00)
- Show `backend/test_all_scenarios.py`:
  - Mention that all 10 scenarios pass automated verification with 100% pass rate.
  - Reiterate compliance with all assignment guidelines (no public repo upload, mandatory stack used).

