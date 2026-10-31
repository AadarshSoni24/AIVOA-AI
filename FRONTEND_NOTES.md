# AIVOA RCA Studio - Frontend Architecture & Implementation Notes

## 1. Project Overview
AIVOA RCA Studio is an AI-powered Root Cause Analysis workspace designed for pharmaceutical Active Pharmaceutical Ingredient (API) manufacturers investigating quality deviations (such as Out-of-Specification assay results) in compliance with GxP and ICH Q10 quality standards.

The application has been converted from a Figma Make exported design into a fully wired, production-grade React application powered by Redux Toolkit (`@reduxjs/toolkit`, `react-redux`) and `axios`.

---

## 2. Folder Structure
The codebase follows a feature-sliced modular architecture aligned with standard Redux patterns:

```
frontend/src/
├── api/
│   ├── client.ts             # Axios client with env configuration & central error handler
│   └── mockAdapter.ts        # Dev-only mock API (active ONLY when VITE_USE_MOCK_API=true)
├── app/
│   └── store.ts              # Central Redux store configuration & typed hooks
├── components/
│   ├── AIField.tsx           # Reusable connected field with read-only/pencil edit & highlight
│   ├── Icon.tsx              # Crisp SVG icon component library (zero emojis)
│   ├── UI.tsx                # Design system primitives: Badge, Button, CopilotMark, SectionHeading
│   ├── case/
│   │   ├── CaseCanvas.tsx    # Dynamic investigation workspace, stage router & empty canvas
│   │   ├── CaseHeader.tsx    # Investigation number, severity, batch, and assay notes
│   │   └── RiskSnapshot.tsx  # Severity, containment hold, next action & missing evidence gaps
│   ├── common/
│   │   └── Modal.tsx         # Accessible dialog component with focus trapping
│   ├── layout/
│   │   ├── Sidebar.tsx       # 6-step investigation stepper, source documents & QA profile
│   │   └── Topbar.tsx        # Brand, status pill, GxP notice, save & history triggers
│   └── modals/
│       ├── DocumentModal.tsx # Document inspection modal
│       ├── EmailModal.tsx    # Deviation email/text paste modal
│       ├── HelpModal.tsx     # GxP 4-step workflow guidance modal
│       ├── NewCaseModal.tsx  # Reset investigation confirmation modal
│       ├── SaveModal.tsx     # Save confirmation dialog with unconfirmed counts
│       └── UploadModal.tsx   # PDF upload dialog (Max 10 MB)
├── features/
│   ├── capa/
│   │   ├── CapaCard.tsx      # Corrective & Preventive action card with Accept/Reject
│   │   └── CapaStage.tsx     # 2-column CAPA plan view & "Generate CAPA" trigger
│   ├── copilot/
│   │   ├── CopilotPanel.tsx  # Message thread, change list, quick prompts & composer
│   │   └── copilotSlice.ts   # Chat state, async thunks (sendMessage, uploadDocument, runAction)
│   ├── history/
│   │   ├── historySlice.ts   # Saved investigations state, fetchHistory, loadInvestigation, save
│   │   └── HistoryView.tsx   # Saved investigations table with status badges & reload
│   ├── investigation/
│   │   ├── EvidenceStage.tsx # Evidence checklist with Available/Missing badges & why_needed
│   │   ├── ImpactStage.tsx   # Impact on batch, potency, patient safety & containment
│   │   ├── IncidentStage.tsx # Incident title, date, reported by, suite, category & narrative
│   │   ├── investigationSlice.ts # Single source of truth for Investigation object
│   │   ├── ProductStage.tsx  # API product, batch number, stage, equipment & quantity
│   │   ├── selectors.ts      # Selectors: fields, stage completion, 6M fishbone, unconfirmed counts, status pill
│   │   └── types.ts          # TypeScript interfaces for Investigation, Evidence, RCA, CAPA
│   ├── rca/
│   │   ├── CauseCard.tsx     # Root cause card with 4-stage stepper, confidence & Confirm/Reject
│   │   ├── Fishbone.tsx      # Ishikawa 6M diagram (Man, Machine, Method, Material, Measurement, Environment)
│   │   ├── FiveWhys.tsx      # Causal 5 Whys drill-down timeline
│   │   └── RcaStage.tsx      # Tabbed container (Hypotheses, 5 Whys, Fishbone) & Re-run action
│   └── ui/
│       └── uiSlice.ts        # UI state: view, activeStage, activeRcaTab, modals, copilotCollapsed, toast
├── App.tsx                   # Top-level shell wiring Topbar, Sidebar, Canvas, Copilot, Modals & Toast
├── index.css                 # Figma Make design system styling & CSS variables
└── main.tsx                  # Root entry point with Redux Provider
```

---

## 3. Redux Architecture & Data Flow

### The Primary Workflow:
The user does not manually fill in the forms. The primary workflow is conversational and document-driven:
1. **User Action**: The user chats with the Copilot, pastes an email, or uploads a deviation PDF report.
2. **Async Thunk**: `sendMessage` or `uploadDocument` thunk in `copilotSlice` is dispatched.
3. **API Dispatch**: `client.ts` transmits the prompt or multipart form data to `/api/copilot/message` or `/api/copilot/upload`.
4. **Backend Response**: The server returns `{ intent, assistant_message, investigation, change_log, warnings }`.
5. **Reducer State Update**:
   - `setInvestigation(response.investigation)` updates the entire investigation object without fragile client-side merges.
   - The assistant message is appended to the chat thread.
   - If `change_log` contains modified fields, a structured "WHAT I UPDATED" change bubble is appended to the thread.
   - `highlightedPaths` are populated with the modified paths, triggering the CSS `@keyframes field-highlight` pulse on affected fields.
6. **Auto-Clear Animation**: After 4 seconds, `highlightedPaths` are cleared so future edits replay the highlight animation smoothly.
7. **Human-in-the-Loop Review**:
   - Fields render in read-only mode with a small pencil edit button (`<AIField />`).
   - Clicking the pencil allows a Qualified Person (QP) to adjust any field. Saving dispatches `updateField({ path, value })`, marking `field_meta[path] = 'reviewed'`.
   - Root causes start as hypotheses (dashed purple badge). The investigator clicks **Confirm** (marking `status: 'human_confirmed'` with solid green) or **Reject** (marking `status: 'rejected'`).
   - CAPA actions start as proposed and can be **Accepted** or **Rejected**.

```
[ User Input / PDF Upload ]
           │
           ▼
   [ Async Thunk ]
 (sendMessage / uploadDocument)
           │
           ▼
     [ API Client ]  ── (VITE_USE_MOCK_API ? mockAdapter : FastAPI)
           │
           ▼
[ Redux setInvestigation ] ──> Replaces Investigation Object
           │
           ├──> Appends Assistant Message + Change List
           ├──> Sets highlightedPaths for 4-second animation
           └──> Updates Stepper Checkmarks & Derived Status Pill
```

---

## 4. `field_meta` & Provenance Status Badging

Form fields in `Incident`, `Product & Batch`, and `Impact` are rendered by the reusable `<AIField path={...} label={...} />` component.
The status badge displayed next to the label reflects the exact provenance audit trail stored in `investigation.field_meta[path]`:

| `field_meta[path]` | Display Label | Badge Tone | Icon | Meaning |
| :--- | :--- | :--- | :--- | :--- |
| `extracted` | `Extracted` | Blue | None | Extracted directly by AI from document/text intake. |
| `ai_suggested` | `AI suggested` | Purple | `sparkles` | Inferred or suggested by AI model (e.g. initial severity). |
| `reviewed` | `Reviewed` | Slate | `check` | Edited or reviewed manually by the user via the pencil icon. |
| `confirmed` | `Confirmed` | Green | `check-circle` | Formally confirmed by Quality Assurance. |

---

## 5. UI Locking Rule
While `copilot.status === "loading"`:
- The Copilot message composer is disabled.
- The drag-and-drop PDF zone and upload buttons are disabled.
- Pencil edit buttons on all `<AIField />` components are disabled.
- The typing indicator displays with the message *"Reviewing the evidence…"*.
- The header status pill switches to `"AI Processing"` with an active pulsing indicator.

---

## 6. Derived Status Pill Logic
The topbar status pill is dynamically computed via `selectDerivedStatusPill(state)`:
- **`AI Processing`** (`tone: 'purple'`): Active when `copilot.status === 'loading'`.
- **`Draft`** (`tone: 'slate'`): Active when no incident title has been entered or extracted yet.
- **`Needs Review`** (`tone: 'slate'`): Active when any root cause remains in `hypothesis` / `under_investigation`, or any CAPA item remains `proposed`.
- **`Ready to Save`** (`tone: 'green'`): Active when all root causes and CAPA actions have been formally reviewed and confirmed/accepted.

---

## 7. How to Run

### Mode A: Running with Dev-Only Mock Adapter (`VITE_USE_MOCK_API=true`)
In mock mode, the app requires no backend server or external API keys. It runs entirely in-browser against the GxP Metformin HCl OOS contract fixture:

1. Create or edit `frontend/.env`:
   ```bash
   VITE_USE_MOCK_API=true
   VITE_API_BASE_URL=http://localhost:8000
   ```
2. Start the Vite dev server:
   ```bash
   npm --prefix frontend run dev
   ```
3. Open `http://localhost:5173`.
4. Test the workflow:
   - Click **"Explore an example investigation"** or type *"Investigate OOS Metformin batch MFH260712A"*.
   - Watch the fields populate with the highlight pulse animation.
   - Click the pencil icon on any field to review and modify it.
   - Navigate to **Root Cause Analysis** -> review hypotheses -> click **Confirm** on `RC-01`.
   - Navigate to **CAPA** -> click **Accept action** on the proposed CAPA actions.
   - Click **Save Investigation** -> review the unconfirmed counts modal -> confirm save.
   - Click **Saved Investigations** -> view the stored cases in the historical table.

### Mode B: Running with Live FastAPI Backend
1. In `frontend/.env`:
   ```bash
   VITE_USE_MOCK_API=false
   VITE_API_BASE_URL=http://localhost:8000
   ```
2. Run `start_app.bat` or run backend and frontend concurrently:
   ```bash
   # Terminal 1: Backend
   cd backend
   .\venv\Scripts\python.exe -m uvicorn main:app --host 0.0.0.0 --port 8000

   # Terminal 2: Frontend
   cd frontend
   npm run dev
   ```
3. Open `http://localhost:5173`.

