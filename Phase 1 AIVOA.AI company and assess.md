Phase 1: AIVOA.AI company and assessment analysis

Two limits on this analysis:

The AIVOA site is JavaScript-rendered, so my fetch returned only the page title and meta description. The site details below come from search snippets of the page, job listings, and third-party profiles. I did not see the full site visually.
The demo video is on Google Drive and I can’t open it. Please watch it and tell me the key interactions: where the AI panel sits, whether it is chat-style, and how fields get filled or highlighted. I’ll refine the UI plan from your description.
1. Company overview

Verified:

AIVOA’s site describes it as an AI-native Quality Management System (QMS) for life sciences. The pitch is that you describe an incident, and the system investigates the batch, cross-references GMP guidelines (ICH Q7, 21 CFR 211) against your SOPs, and surfaces related past incidents. 
aivoa
Its example is a reactor with a similar temperature issue six months earlier, traced to a faulty sensor, and it claims investigations drop from 3+ hours to 8 minutes. 
aivoa
It also advertises AI-drafted CAPA plans, with every AI decision logged, versioned, and attributed. 
aivoa
It is a small, young startup based in Bengaluru. Cutshort lists it as founded in 2025, bootstrapped, product-type, with 0–20 people. Other sites give different headcounts (2–10, 11–50), so treat size as uncertain. 
cutshort
Older job posts describe a different positioning. They call it an AI-native Supply Chain Operating System for API and FDF manufacturers. The company seems to have narrowed from supply chain to QMS. This is my inference from the dates, not a stated fact. 
unstop
Its jobs page lists a Full Stack AI Developer fresher role and several Tech Sales roles for QMS software aimed at pharma. The tech sales roles show it is in early go-to-market. 
bebee
Its Internshala profile lists an “AI Product Engineer (Fresher) – Python & React (Remote)” role at ₹8,000–12,000/month. This is likely what your assessment is for. 
internshala

Unverified marketing claims: “140+ QA leaders”, “<200ms investigation”, and the 3 hours to 8 minutes figure. Don’t repeat these as fact in an interview.

Assumptions (mine):

Customers: small and mid-size Indian API and formulation manufacturers, plus anyone who wants a cheaper, faster alternative to legacy QMS tools.
Business model: SaaS subscription, since the site has a pricing page and a “Book a Demo” call to action.
Differentiator: AI is built into the workflow rather than added on, and it is positioned against incumbents like Veeva Vault QMS, TrackWise, and Qualio. Competitors like Kalova already advertise AI 5-Whys and CAPA linkage, so “AI RCA” alone is not unique. I can’t verify how AIVOA differs in practice. 
kalova
Engineers likely do: FastAPI backends, React frontends, LLM-driven extraction, structured-output pipelines, and integrations with documents and databases. The Cutshort listing names React, FastAPI, open-source LLMs, and AI coding tools. 
cutshort
2. Product and business understanding

A QMS is the software pharma companies use to prove they run quality processes per regulation. The main modules are deviations, CAPA, change control, complaints, OOS (out-of-specification results), audits, document control, and training. AIVOA’s pitch is that a quality person types or speaks an incident, and the AI fills forms, finds history, and drafts the paperwork. The assessment tests whether you can build that pattern for the RCA step.

A useful hint: a third-party portfolio page describes an AIVOA complaint-module project. It extracts complainant, product, batch, date, quantity, source, and issue from natural language, supports AI editing of complaints, and has a dashboard on PostgreSQL or SQL Server. That likely mirrors the demo video’s pattern: describe in natural language, the AI fills the form, then conversationally edit. Don’t copy anyone’s work, but this confirms the expected interaction. 
contra

3. The assessment in simple language

The ask: build a mini QMS screen where a quality person pastes or uploads an incident report, an AI panel reads it and fills an RCA form, runs a 5 Whys and/or fishbone analysis, lists likely root causes, flags missing evidence, suggests CAPAs, and the user edits and saves it.

Why they assigned it: it is a miniature of their real product. They want to see whether you can research a domain, make product decisions, wire LangGraph and an LLM into a real UI, and explain it.

Deliverables:

Working application
Video 1: product demo, 5–8 min
Video 2: code walkthrough, 5–10 min
Submission form, within 48 hours
Requirement breakdown
#	Requirement	Type
1	Accept PDF, pasted text, or email	Mandatory
2	AI extracts info and populates the RCA form	Mandatory
3	5 Whys or fishbone (they say “such as”, so one is the minimum)	Mandatory
4	Identify root causes and contributing factors	Mandatory
5	Highlight missing evidence	Mandatory
6	CAPA recommendations with short explanations	Mandatory
7	User can review and edit before saving	Mandatory
8	React + Redux, FastAPI, LangGraph + Groq, Postgres/MySQL	Mandatory
9	Do NOT build Complaint, Deviation, or Change Control	Hard constraint
10	Do NOT put code, videos, or assignment files in public repos	Hard constraint
Hidden expectations and rejection risks
Primary workflow must be the AI panel. Manually typing into the form first fails the brief.
Treat AI causes as suggestions. Label them “AI-suggested”, show the supporting evidence, and require a person to confirm. This is stated and also a core pharma idea.
Don’t let AI invent facts. If a batch number isn’t in the text, leave it blank and flag it.
Don’t build the wrong module. Reproducing the complaint flow would be a mistake.
A public GitHub repo could get you disqualified. Use a private repo or none.
Both videos must work. A broken demo or a vague code walkthrough hurts more than a missing minor feature.
Standing out: evidence-linked causes with confidence levels, a “missing evidence” checklist, an audit trail, a polished review/edit flow, and honest handling of uncertainty.
4. Domain concepts to learn first

These matter as much as the tech:

Deviation: an unplanned departure from an approved procedure or specification, for example a reactor temperature out of range during a batch.
RCA: finding the underlying reason, not the symptom. “Operator error” is generally considered a weak conclusion, so investigators dig into why the process allowed it.
CAPA: Corrective fixes the current problem. Preventive stops recurrence elsewhere. Each has an owner, due date, and effectiveness check.
5 Whys: ask “why” repeatedly, usually five times. It is simple but can follow a single chain.
Fishbone (Ishikawa): group causes by category. In pharma the usual categories are Man, Machine, Material, Method, Measurement, and Environment (the 6Ms).
Regulatory context: GMP; ICH Q7 (GMP for APIs, the relevant one here); 21 CFR 211 (finished pharmaceuticals); 21 CFR Part 11 (electronic records and signatures, so audit trails); ICH Q9 (risk management); ICH Q10 (quality system). Also ALCOA+ data integrity: records should be attributable, legible, contemporaneous, original, and accurate.
API vs FDF: active ingredient manufacturing versus finished dosage form.

Please study these properly before building. In the interview they will test the domain, not only the code.

5. Technical concepts I must learn

(Simple first, then technical.)

Concept	Simple idea	Where used	Alternatives
React	UI built from components	Form, AI panel, review screens	Vue, Svelte
Redux (use Redux Toolkit)	One central store for app state	Holds form data, AI results, loading state, edit tracking	Context, Zustand (but Redux is mandatory)
FastAPI	Python web framework with auto validation and docs	Endpoints for extract, analyze, save	Flask, Django
Pydantic	Typed data models that validate input and output	Request and response schemas, LLM structured output	dataclasses
LangGraph	Define an AI workflow as a graph of steps with shared state	Orchestrates extract → analyze → CAPA	Plain function chain, LangChain agents
Groq + LLM	Very fast hosted inference for open models	The language model calls	OpenAI, Gemini
Structured output / JSON mode	Force the model to reply in a fixed JSON shape	Reliable form population	Prompt-only JSON plus parsing
PDF text extraction	Pull text out of PDF files (pypdf, pdfplumber)	PDF intake	OCR for scanned PDFs (optional)
PostgreSQL + SQLAlchemy	Relational database plus Python ORM	Persisting investigations	MySQL
JSONB	Postgres column for flexible JSON	Storing raw AI output	Separate tables
CORS, env vars	Browser permission rules; secrets outside code	Frontend↔backend, API keys	N/A

Optional but valuable: streaming responses (SSE) so the form fills visibly, Alembic migrations, an audit-log table.

Model note: the brief lists gemma2-9b-it, but I believe that model may be deprecated on Groq. Check Groq’s current model list. llama-3.3-70b-versatile is the safer pick if available.

6. Expected product

User flow:

User opens “New RCA”.
In the AI panel, they paste an incident description, upload a PDF, or paste an email.
They click Analyze and see progress.
The form populates: incident title, date, product, batch, equipment, location, description, immediate actions, and so on. AI-filled fields are visibly marked.
The AI proposes an investigation: 5 Whys chain and/or fishbone grouped factors.
It lists probable root causes and contributing factors, each with supporting evidence and confidence.
It lists missing evidence, such as calibration records, batch record pages, or operator statements.
It recommends CAPAs, each with type (corrective or preventive), a short rationale, and a suggested owner role.
The user edits anything, optionally via a chat command like “change the equipment to Reactor R-201”, then confirms root causes and saves.

Backend: receives input, extracts text, runs the LangGraph pipeline, validates the output against schemas, stores and retrieves investigations.

Edge cases: very short input, scanned PDFs with no text, conflicting facts in the document, missing batch number, the LLM returning broken JSON, rate limits, a user editing after AI re-analysis (don’t overwrite their edits), and unsupported guesses (no evidence means low confidence or “insufficient evidence”).

7. Recommended solution

Compare two approaches:

A. Single LLM call that returns everything as one JSON. It is quick to build but gives little control, is hard to validate, fails all at once, and shows weak LangGraph usage.
B. LangGraph pipeline with focused nodes. I recommend this one. It is easier to explain, can validate each step, and fits the mandatory stack.

Recommended LangGraph nodes (keep it to about five):

Intake/extract: clean text, extract form fields with null for unknowns.
Investigate: produce the 5 Whys chain and fishbone factors.
Root cause synthesis: probable causes and contributors, each tied to evidence quotes from the input.
Evidence gap: what is missing or needed.
CAPA: corrective and preventive actions with rationale.

State is a typed object passed between nodes. Add one validation/retry step for malformed JSON.

Stack: React + Redux Toolkit (Vite), FastAPI, SQLAlchemy, Postgres, Groq. Don’t add auth, queues, or Docker orchestration unless you have spare time. They weren’t asked for.

API sketch: POST /extract (text or file), POST /analyze, POST /investigations (save), GET/PUT /investigations/{id}, and optionally POST /ai-edit for the chat-style edits.

Data model idea: investigations (core fields), why_steps, fishbone_factors, root_causes (with confidence and confirmed flag), missing_evidence, capas, and an audit_log. Keep the raw AI response in a JSONB column for traceability.

Security/error handling: keep the Groq key server-side only, validate file type and size, return clear errors, and never expose model output unvalidated. Deployment isn’t required, so a local run is fine and the demo videos are the deliverable.

8. Challenges and edge cases
Making the LLM reliably return strict JSON.
Avoiding hallucinated root causes. Require evidence quotes and allow “not enough information”.
Keeping the form in sync with Redux when AI and user edits collide.
Scanned PDFs (text extraction returns nothing).
Time: 48 hours is tight and two videos also take time, so scope hard.
9. What the recruiter is evaluating
Domain understanding: do your fields, categories, and wording look like real pharma quality work?
AI judgment: suggestion versus confirmed cause, missing-evidence handling, human review.
Engineering: clean structure, validation, sensible schema.
UX: is the AI panel interaction smooth and clear?
Ownership and communication: demo clarity and ability to explain tradeoffs.
10. Likely interview questions
What is the difference between a deviation, an RCA, and a CAPA?
Why can’t the AI decide the root cause on its own? Where is human confirmation enforced?
How do you stop the LLM from hallucinating details missing from the document?
Why LangGraph? What is state, and how do nodes share it?
Walk me through one request from the upload to the saved record.
How do you force valid JSON from the model, and what happens if it fails?
How does Redux hold AI results versus user edits?
5 Whys versus fishbone: when is each better?
How would you handle scanned PDFs?
How would you add audit trails for 21 CFR Part 11?
How would you let the AI use past incidents from the database?
What would you change for production (auth, versioning, e-signatures, validation)?
Why Postgres and your table design? Why JSONB for some data?
How did you pick the model, and how would you evaluate output quality?
What did AI coding tools write, and what did you change or verify yourself?
11. Clarify before implementing
The demo video: please describe it, as above.
Standalone or linked: I’m assuming RCA is standalone with no deviation record linking. Does the video suggest otherwise?
5 Whys, fishbone, or both: I recommend both if time allows, with 5 Whys as the must-have.
Do you have a Groq API key and which models does your account show?
Sample incident: do you want me to create a realistic API-manufacturing incident text for testing, plus a PDF version?
Your hours: how many of the 48 hours can you actually work? That decides scope, since the videos need time too.


AIVOA RCA Module: Master Plan (no code yet)

Your five answers are locked in. The demo video’s transcript also settled a few things I’d been unsure about, and I’ve folded them in below.

One honesty note first. My sandbox can’t reach Groq’s API, so I can’t run LLM calls myself. I can write the code and test everything that doesn’t need the model (database, merge logic, PDF extraction, API shape). For anything that touches Groq, you’ll run my test scripts locally and paste the output back, and I’ll debug from the real errors.

1. My understanding of the assignment

From the transcript, the demo is a split screen:

Left: a form. You never fill it by hand.
Right: the “AIVOA co-pilot” chat. It also holds a risk assessment section (severity, next action, and so on) that the AI fills by reasoning.

Three mandatory tools:

Log: a natural-language prompt creates the record. The form fills, and the risk section fills from the AI’s reasoning.
Edit: a correction like “the batch number is X and quantity is Y” updates only those fields, and the risk section too, while everything else is preserved.
Document extraction: a PDF or email populates the form and risk section. Natural-language edits must still work afterward.

For our RCA version, the “complaint” becomes an incident, and the risk section stays in the co-pilot panel. Root causes, evidence gaps, and CAPA come from the same AI turn. The rules that matter most:

The primary workflow is AI-driven.
Edits never lose data.
AI causes are labeled hypotheses until a human confirms them.
Nothing is fabricated.
A visible banner says “Prototype, not a validated GxP system.”
2. Final product design

Layout:

Left (about 60%): the investigation workspace, in 5 tabs:
Incident & Batch
Impact & Containment
Evidence
Root Cause Analysis (5 Whys, cause cards, Fishbone view later)
CAPA
Right (about 40%):
The Risk Assessment card, pinned at top.
The chat thread.
The input bar with PDF attach, paste-email, and sample-prompt chips.

Decision on “don’t fill the form manually”: form fields are read-only by default. Each has a small pencil icon for review edits, because the assignment also requires “review and edit.” So the demo is 100% AI-driven, and review edits remain possible.

Field status badges: Extracted (blue), AI suggested (purple), Reviewed (grey), Confirmed (green).

Root cause statuses: Hypothesis → Under Investigation → Evidence Supported → Human Confirmed. Only a button click by the user can set Human Confirmed.

Save flow: a confirmation modal says, for example, “3 AI hypotheses and 5 proposed CAPAs are still unconfirmed.” The user can still save.

Domain nuance I’ll build in: a low assay result is technically an OOS (out-of-specification) result. In real GMP practice, the lab is usually checked for error before a manufacturing investigation. So the AI should list “rule out laboratory error” under missing evidence for the Metformin case. Please verify this point yourself before the interview, since it’s my domain understanding.

3. System architecture
┌─────────────────────────── Browser ────────────────────────────┐
│ React + Redux Toolkit                                           │
│  InvestigationForm (left) ◄── store ──► CopilotPanel (right)    │
└──────────────┬──────────────────────────────────────▲──────────┘
               │ POST /api/copilot/message (snapshot) │ merged state
               │ POST /api/copilot/upload  (PDF)      │ + change_log
┌──────────────▼──────────────────────────────────────┴──────────┐
│ FastAPI                                                         │
│  routers → Pydantic validation → services (pdf, merge, audit)   │
│                    │                                            │
│            LangGraph graph.invoke(state)                        │
│                    │                                            │
│              ChatGroq (llama-3.3-70b-versatile)                 │
└──────────────┬──────────────────────────────────────────────────┘
               │ SQLAlchemy (only on Save / Load / History)
        ┌──────▼──────┐
        │ PostgreSQL  │
        └─────────────┘

The key architecture decision (state ownership):

The browser holds the draft in Redux.
Each AI request sends the current snapshot plus the last few messages.
The backend is stateless per turn.
The database is written only on Save.

Why this is the best fit:

It’s simpler than LangGraph checkpointers, and easy to explain.
It means “retrieve existing state” in the graph is just validating the incoming snapshot.
The UI is locked while a request is running, so the server’s merged result can safely replace the draft. That avoids merge races.

How AI data reaches the form (the interview question):

The LLM never rewrites the whole record. It returns a patch containing only the fields it is confident about.
A deterministic Python merge function applies the patch to the snapshot. It ignores nulls, never overwrites with empty values, and appends or updates list items by id.
The merge produces a change_log: {path, old, new, source}.
FastAPI returns the full merged investigation plus the change_log.
The Redux reducer replaces the investigation, then highlights the changed fields from the change_log for a few seconds.

Because the merge is plain code, “never lose existing data” is enforced in code rather than hoped for from the model.

4. LangGraph workflow

Concepts you’ll need (short version):

A graph is a set of nodes (Python functions) connected by edges (what runs next).
A shared state object flows through. Each node reads it and returns updates.
A conditional edge is a function that looks at the state and picks the next node. That’s how we route.

State (TypedDict): input_type, user_message, document_text, history, investigation (snapshot), intent, patch, change_log, risk, evidence_gaps, rca, capa, assistant_message, errors.

Nodes (I merged some from your list because separate LLM calls add latency and rate-limit pressure):

Node	LLM?	Job
load_context	No	Validate snapshot, trim history
classify_intent	Small model	create / edit / rca / capa / question. Skipped for documents and for forced actions from UI buttons
extract_incident	Yes	New text or document → structured patch
apply_edit	Yes	Correction message → minimal patch
merge_state	No	Deterministic merge + change_log
assess	Yes	Preliminary risk plus missing-evidence list
root_cause	Yes	5 Whys, cause hypotheses with 6M category, verification steps
validate_causes	No	Checks that evidence quotes really appear in the source text. If not, status is downgraded to Hypothesis
capa	Yes	Corrective and preventive actions linked to causes
answer_question	Yes	Read-only Q&A about the current investigation
compose_response	No	Builds the chat message from the change_log (template-based, so it’s always accurate)

Routing:

START → load_context → classify_intent
  create / document → extract_incident → merge_state → assess → root_cause
                      → validate_causes → capa → compose_response
  edit              → apply_edit → merge_state → assess
                      → (if key facts changed) root_cause → validate_causes → capa
                      → compose_response
  rca               → root_cause → validate_causes → compose_response
  capa              → capa → compose_response
  question          → answer_question → compose_response

Error handling:

Every LLM node uses Pydantic structured output, with one retry on a schema failure.
Rate-limit (429) errors get backoff.
A failing node writes to errors and the graph still returns whatever completed, with a clear message. The frontend never half-applies a failed turn.

Prompt-injection defence: uploaded text is wrapped in delimiters, and the system prompt says it is data and never instructions. The output schema also restricts what the model can emit.

Model config: GROQ_MODEL and an optional GROQ_FAST_MODEL (for classify) in .env.

5. Database schema

I’m keeping the one-to-one form sections in a single wide table, because splitting incident and batch into separate tables adds joins with no benefit. Lists get child tables.

investigations 1──* evidence_items
      │       1──* root_causes 1──* why_steps
      │       1──* capa_actions   (optional FK → root_causes)
      │       1──* documents
      │       1──* audit_events
investigations: id (uuid), investigation_no (e.g. RCA-2026-0001), all incident, batch, and impact fields, investigation_method, status, field_meta (JSONB: per-field provenance status), risk_assessment (JSONB), created_at, updated_at.
evidence_items: kind (batch_record / lab_result / equipment_record / env_monitoring / operator_statement / other), description, availability (available | missing), why_needed, source_quote.
root_causes: category (man, machine, method, material, measurement, environment), kind (candidate / contributing_factor), statement, explanation, supporting_evidence, contradicting_evidence, missing_evidence, verification_steps, status, confirmed_by, confirmed_at.
why_steps: root_cause_id, step_no, question, answer.
capa_actions: type (corrective | preventive), description, rationale, root_cause_id, department, priority, target_date, effectiveness_check, status (proposed / accepted / rejected).
documents: filename, mime, size, sha256, extracted_text (I’m not storing the original file bytes).
audit_events: actor (ai | user), event_type, path, old_value, new_value, created_at.

Fishbone is not a separate table. It’s the root causes grouped by category, drawn by the frontend. That makes Fishbone cheap once 5 Whys works.

I’ll use SQLAlchemy 2.0 with create_all at startup. Alembic would be overengineering here.

6. API endpoints
Method	Path	Purpose
GET	/api/health	Liveness check
POST	/api/copilot/message	Body: message, input_type (text/email), investigation, history, optional force_action (rca / capa). Returns assistant_message, investigation, change_log, intent, warnings
POST	/api/copilot/upload	Multipart PDF plus the investigation snapshot. Validates type and size, extracts text, runs the graph. Same response shape
POST	/api/investigations	Save new
PUT	/api/investigations/{id}	Save update
GET	/api/investigations	History list
GET	/api/investigations/{id}	Load full investigation

The force_action parameter lets UI buttons like “Re-run root cause analysis” and “Generate CAPA” skip classification and go straight to the right route.

7. 48-hour roadmap (about 30 hours dev, with a buffer inside your 30–35)
Phase	Hours	Output	Done when
0. Setup and spike	1.5	Repo, .env, Postgres in Docker, Groq model check, one structured-output test call, sample text plus PDFs	A script prints a validated Pydantic object from Groq
1. Backend and DB	3	Models, schemas, save/get/list/update endpoints	Create, fetch, and update an investigation via curl
2. LangGraph core	5	State, classify, extract_incident, apply_edit, merge_state, compose_response	Scenarios 1 and 2 pass via curl, with no data loss
3. Frontend shell	4	Vite, Tailwind, Redux store, split layout, copilot chat updating the form, badges, highlights	Typed prompt → form fills in browser
4. Documents	3	PyMuPDF extraction, upload endpoint, upload UI, email paste	Sample PDF fills the form
5. Analysis	5	assess, root_cause, validate_causes, capa nodes plus Risk card, Evidence, 5 Whys, cause cards (confirm / reject), CAPA cards	Full AI turn yields risk, gaps, causes, CAPA
6. Save and history	3	Save modal, history page, load saved, audit events	Reload page → reopen saved investigation intact
7. Fishbone and polish	2.5	Fishbone view, loading and error states, responsive pass	Looks like a real B2B product
8. Testing	3	All 7 scenarios run end to end, bug fixing	Checklist all green

That totals about 30 hours. The remaining time covers videos (about 3 hours including retakes), final submission checks, and sleep.

Hard checkpoints:

By hour 12: text → form → saved to DB works end to end. That’s your P0 spine.
If you’re behind at hour 20, we cut Fishbone and advanced audit first, never P0.

Order I’ll follow: P0 → P1 → P2, exactly as in the phase table.

8. Highest-risk technical challenges
Structured output reliability from Llama on Groq. The schema may not always be respected. Mitigation: the Phase 0 spike tests it first, plus Pydantic validation and one retry.
Rate limits and latency. A full create turn uses 5 or so LLM calls, and the free tier is tight. Mitigation: send each node only the state slice it needs, use the fast model for classification, back off on 429, and I can merge nodes if needed.
Edit correctness. “Correction: batch number is X” must change the right field and nothing else. Mitigation: patch-only schema, a deterministic merge, and explicit edit test cases.
Hallucinated evidence. Mitigation: the validate_causes node checks quotes against the actual source text. The AI can never set Human Confirmed.
Scope creep on UI polish. Mitigation: the hour-12 checkpoint and the cut list above.
Learning LangGraph while building. Mitigation: each phase starts with a short concept explanation, and Video 2’s script is built from the same notes.
Redux and server state sync. Mitigation: the UI lock during requests, with the server’s merged state as the single result.
9. Progress tracker
Phase	Status
0. Setup and spike	Not started
1. Backend and DB	Not started
2. LangGraph core	Not started
3. Frontend shell	Not started
4. Documents	Not started
5. Analysis	Not started
6. Save and history	Not started
7. Fishbone and polish	Not started
8. Testing	Not started
Video 1 / Video 2 / Submission	Not started
What I need to start Phase 0

Reply “confirmed” if the plan is approved, along with:

Your Python version and Node version.
Whether Docker is running on your machine (I’ll use it for Postgres).
Confirmation that your Groq key is ready, or tell me when it is. I’ll start with the files that don’t need it.

Phase 0 will give you the folder structure, setup commands, the structured-output test script, and the sample incident text and PDF with consistent data.