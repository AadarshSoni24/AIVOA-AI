# AIVOA RCA Studio — AI-Powered Root Cause Analysis for API Manufacturing

AIVOA RCA Studio is an AI-assisted Root Cause Analysis (RCA) and Corrective & Preventive Action (CAPA) workspace designed for Active Pharmaceutical Ingredient (API) manufacturers adhering to cGMP, 21 CFR Part 211, and ICH Q9/Q10 quality guidelines.

---

## Architecture Overview

```
                      +---------------------------------------+
                      |       React 19 Frontend (Vite)        |
                      |   Redux Toolkit Store + Tailwind CSS  |
                      +-------------------+-------------------+
                                          |
                                          | HTTP (REST API)
                                          v
                      +---------------------------------------+
                      |         FastAPI Python Backend        |
                      |   Pydantic v2 Contract Validation     |
                      +-------------------+-------------------+
                                          |
                         +----------------+----------------+
                         |                                 |
                         v                                 v
        +---------------------------------+   +-------------------------+
        |     LangGraph Orchestrator      |   |   SQLAlchemy (Async)    |
        |   Multi-Node StateGraph via     |   |   SQLite Database       |
        |      Groq (gpt-oss-120b)        |   |   Audit & Investigations|
        +---------------------------------+   +-------------------------+
```

### Key Technical Capabilities:
- **No Manual Data Entry by Default:** AI Co-Pilot extracts and maps parameters from natural language prompts, emails, and multi-page deviation PDFs.
- **Form Provenance & Audit Trails:** Every field displays confidence provenance badges (`extracted`, `ai_suggested`, `reviewed`, `confirmed`) with lock-to-edit review capability.
- **Deterministic Partial Merge:** Correction prompts (e.g., *"Correction: batch number is..."*) update only specific target fields, preserving all prior extracted findings without overwriting.
- **5 Whys & Ishikawa (6M) Fishbone:** Automated causal drill-down linking direct root causes to proposed CAPA actions with Qualified Person (QP) human-in-the-loop confirmation.

---

## Getting Started

### Prerequisites
- Node.js 18+ & npm
- Python 3.10+
- Free Groq API Key (from [console.groq.com](https://console.groq.com))

### Quick Start (Single Launcher)
```bash
# Windows Batch
start_app.bat

# Or PowerShell
powershell -ExecutionPolicy Bypass -File .\run_app.ps1
```

- **Frontend App:** [http://localhost:5173](http://localhost:5173)
- **Backend API Docs (Swagger):** [http://localhost:8000/docs](http://localhost:8000/docs)
- **Sample Incident PDF:** `backend/sample_data/sample_incident.pdf`

---

## Manual Setup

### 1. Backend Setup
```bash
cd backend
python -m venv venv
venv\Scripts\activate   # On Linux/macOS: source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env    # Configure your GROQ_API_KEY
uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

---

## Quality & Verification
- **Frontend Build & Linter:** `npm run build && npm run lint` passes with 0 errors and 0 warnings.
- **Contract Verification:** Automated regression test suite in `backend/stage3_verify.py`.
