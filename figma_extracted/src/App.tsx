import { useEffect, useRef, useState, type ReactNode } from "react"
import { Icon, type IconName } from "./components/Icon"
import {
  Badge,
  Button,
  CopilotMark,
  Field,
  SectionHeading,
} from "./components/UI"
import {
  evidenceItems,
  initialCapas,
  initialCauses,
  whys,
  type Cause,
} from "./data"

const stages: {
  name: string
  icon: IconName
  detail: string
}[] = [
  { name: "Incident", icon: "activity", detail: "Incident details captured" },
  { name: "Product & Batch", icon: "box", detail: "Product identified" },
  { name: "Impact", icon: "shield", detail: "Risk assessed" },
  { name: "Evidence", icon: "file", detail: "3 of 5 available" },
  {
    name: "Root Cause Analysis",
    icon: "network",
    detail: "3 hypotheses generated",
  },
  { name: "CAPA", icon: "target", detail: "4 actions proposed" },
]
type Message = {
  role: "user" | "ai"
  text: string
  changes?: {
    field: string
    from: string
    to: string
  }[]
  file?: string
}
const firstMessages: Message[] = [
  {
    role: "ai",
    text: "Hi, Ananya. I’m your investigation copilot. Share an incident or upload a document, and we’ll work through it together.",
  },
  {
    role: "user",
    text: "Investigate the OOS assay for Metformin HCl batch MFH260712A. I’ve attached the QC report.",
    file: "QC_Report_MFH260712A.pdf",
  },
  {
    role: "ai",
    text: "I’ve reviewed the report and built your case. The assay is below specification, and the batch is on hold.",
    changes: [
      { field: "Assay result", from: "Not set", to: "97.2% (OOS)" },
      { field: "Severity", from: "Not set", to: "Major" },
      { field: "Batch disposition", from: "Not set", to: "On hold" },
    ],
  },
  {
    role: "ai",
    text: "I’ve identified 3 potential root causes. Standard preparation is the strongest lead, but it needs an independent repeat assay to confirm.",
  },
]

function Sidebar({
  stage,
  setStage,
  empty,
  newCase,
  onDocument,
  onHelp,
}: {
  stage: string
  setStage: (s: string) => void
  empty: boolean
  newCase: () => void
  onDocument: (name: string) => void
  onHelp: () => void
}) {
  return (
    <aside className="sidebar">
      <div className="workspace-label">
        <span className="workspace-icon">
          <Icon name="flask" size={17} />
        </span>
        <div>
          Quality workspace<small>API Manufacturing</small>
        </div>
        <Icon name="chevron" size={13} />
      </div>
      <div className="sidebar-section-label">
        INVESTIGATION <span>01</span>
      </div>
      <nav className="stage-list" aria-label="Investigation stages">
        {stages.map((s, i) => (
          <button
            key={s.name}
            onClick={() => setStage(s.name)}
            className={`stage-button ${stage === s.name ? "active" : ""}`}
          >
            <span
              className={`stage-ring ${!empty && i < 3 ? "complete" : ""} ${
                stage === s.name ? "current" : ""
              }`}
            >
              {!empty && i < 3 ? (
                <Icon name="check" size={12} />
              ) : (
                <Icon name={s.icon} size={15} />
              )}
            </span>
            <span className="stage-name">
              {s.name}
              {stage === s.name && <small>In progress</small>}
            </span>
            {!empty && i === 3 && <span className="stage-fraction">3/5</span>}
            {stage === s.name && <span className="active-dot" />}
          </button>
        ))}
      </nav>
      <div className="sidebar-divider" />
      <div className="sidebar-section-label">
        SOURCE DOCUMENTS{" "}
        <button
          aria-label="Add source document"
          onClick={() => onDocument("upload")}
        >
          <Icon name="plus" size={15} />
        </button>
      </div>
      {!empty ? (
        <div className="source-files">
          {[
            "QC_Report_MFH260712A.pdf",
            "Batch_Record_MFH260712A.pdf",
            "SOP-QC-014_rev06.pdf",
          ].map((name, i) => (
            <button
              key={name}
              onClick={() => onDocument(name)}
              className="source-file"
            >
              <span className={`file-type ${i === 2 ? "slate-file" : ""}`}>
                <Icon name="file" size={16} />
              </span>
              <span>
                {
                  [
                    "QC analytical report",
                    "Batch manufacturing record",
                    "Standard preparation SOP",
                  ][i]
                }
                <small>
                  {["PDF · 2.4 MB", "PDF · 4.1 MB", "PDF · 840 KB"][i]}
                </small>
              </span>
              <Icon name="check-circle" size={12} className="file-check" />
            </button>
          ))}
          <div className="source-security">
            <Icon name="shield" size={12} />
            Only used for this investigation
          </div>
        </div>
      ) : (
        <div className="no-sources">Uploaded documents will appear here.</div>
      )}
      <div className="sidebar-bottom">
        <div className="ai-assistance">
          <span className="tiny-spark">
            <Icon name="sparkles" size={15} />
          </span>
          <strong>AI assists. You decide.</strong>
          <p>Every conclusion stays under your review and control.</p>
        </div>
        <button className="sidebar-utility" onClick={newCase}>
          <Icon name="plus" size={16} />
          New investigation
        </button>
        <button className="sidebar-utility" onClick={onHelp}>
          <Icon name="help" size={16} />
          Help & documentation
          <Icon name="external" size={12} />
        </button>
        <div className="profile">
          <span className="avatar">AS</span>
          <div>
            Ananya Sharma<small>Quality Assurance</small>
          </div>
          <span className="profile-status" />
        </div>
      </div>
    </aside>
  )
}

function RiskSnapshot({ onAction }: { onAction: () => void }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <section className="risk-snapshot">
      <div className="risk-heading">
        <div className="heading-group">
          <span className="risk-icon">
            <Icon name="sparkles" size={17} />
          </span>
          <h3>AI Risk Snapshot</h3>
          <span className="preliminary">AI suggestion · preliminary</span>
        </div>
        <button
          className="icon-button"
          aria-label={
            expanded ? "Hide risk rationale" : "Expand risk rationale"
          }
          onClick={() => setExpanded(!expanded)}
        >
          <Icon
            name="chevron"
            size={15}
            className={expanded ? "rotate-up" : "rotate-down"}
          />
        </button>
      </div>
      <div className="risk-columns">
        <div className="risk-item">
          <span className="eyebrow">SUGGESTED SEVERITY</span>
          <div>
            <span className="severity-dot" />
            <strong>Major</strong>
            <span className="risk-caption">Quality impact</span>
          </div>
        </div>
        <div className="risk-item">
          <span className="eyebrow">CONTAINMENT</span>
          <div>
            <Icon name="shield" size={16} className="teal" />
            <strong>Required</strong>
            <span className="risk-caption">Batch on hold</span>
          </div>
        </div>
        <div className="risk-item next-action">
          <span className="eyebrow">SUGGESTED NEXT ACTION</span>
          <button onClick={onAction}>
            Verify HPLC standard preparation
            <Icon name="arrow" size={15} />
          </button>
        </div>
      </div>
      <p className="risk-rationale">
        <Icon name="info" size={13} />
        Below-specification assay may impact potency. Rule out analytical error
        before evaluating process causes.
      </p>
      {expanded && (
        <div className="expanded-rationale animate-in">
          The 97.2% assay is 0.8 percentage points below the approved lower
          limit. Maintain the batch hold and follow the approved OOS procedure.
          This preliminary assessment does not authorize batch disposition.
        </div>
      )}
    </section>
  )
}

function CauseCard({
  cause,
  onStatus,
}: {
  cause: Cause
  onStatus: (id: string, status: Cause["status"]) => void
}) {
  const [expanded, setExpanded] = useState(cause.id === "RC-01")
  const confirmed = cause.status === "Human Confirmed"
  const rejected = cause.status === "Rejected"
  return (
    <article
      className={`cause-card ${
        confirmed ? "confirmed" : rejected ? "rejected" : ""
      }`}
    >
      <div className="cause-top">
        <span className="cause-id">{cause.id}</span>
        <Badge
          tone={confirmed ? "green" : rejected ? "slate" : "purple"}
          icon={confirmed ? "check-circle" : "sparkles"}
        >
          {confirmed
            ? "Human confirmed"
            : rejected
              ? "Rejected"
              : "AI hypothesis"}
        </Badge>
        <span className="confidence">
          <span
            className={
              cause.confidence.startsWith("High")
                ? "confidence-high"
                : "confidence-medium"
            }
          />
          {cause.confidence}
        </span>
      </div>
      <button
        className="cause-title"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
      >
        <h3>{cause.title}</h3>
        <Icon
          name="chevron"
          size={17}
          className={expanded ? "rotate-up" : "rotate-down"}
        />
      </button>
      <div className="cause-category">
        <Icon
          name={
            cause.category === "Measurement"
              ? "activity"
              : cause.category === "Material"
                ? "box"
                : "branch"
          }
          size={12}
        />
        {cause.category}
      </div>
      <p className="cause-description">{cause.description}</p>
      {expanded && (
        <div className="cause-details animate-in">
          <div className="evidence-row">
            <span className="evidence-symbol green">
              <Icon name="check-circle" size={14} />
            </span>
            <div>
              <strong>Supporting evidence</strong>
              <p>{cause.supporting}</p>
            </div>
          </div>
          <div className="evidence-row">
            <span className="evidence-symbol slate">
              <Icon name="activity" size={14} />
            </span>
            <div>
              <strong>Contradicting evidence</strong>
              <p>{cause.contradicting}</p>
            </div>
          </div>
          <div className="evidence-row">
            <span className="evidence-symbol amber">
              <Icon name="warning" size={14} />
            </span>
            <div>
              <strong>Missing evidence</strong>
              <p>{cause.missing}</p>
            </div>
          </div>
          <div className="verification">
            <Icon name="search" size={15} />
            <div>
              <strong>How to verify</strong>
              <p>{cause.verification}</p>
            </div>
          </div>
          <div className="cause-progress">
            {[
              "Hypothesis",
              "Under Investigation",
              "Evidence Supported",
              "Human Confirmed",
            ].map((s, i) => {
              const current = [
                "Hypothesis",
                "Under Investigation",
                "Evidence Supported",
                "Human Confirmed",
              ].indexOf(cause.status)
              return (
                <div
                  className={
                    i <= current
                      ? `reached ${confirmed ? "is-confirmed" : ""}`
                      : ""
                  }
                  key={s}
                >
                  <span>
                    {i < current || confirmed ? (
                      <Icon name="check" size={9} />
                    ) : (
                      ""
                    )}
                  </span>
                  <small>
                    {s === "Under Investigation"
                      ? "Investigating"
                      : s === "Evidence Supported"
                        ? "Evidence supported"
                        : s === "Human Confirmed"
                          ? "Human confirmed"
                          : s}
                  </small>
                </div>
              )
            })}
          </div>
        </div>
      )}
      <div className="cause-footer">
        <span>
          <Icon name={confirmed ? "check-circle" : "info"} size={12} />
          {confirmed
            ? "Confirmed by Ananya Sharma"
            : rejected
              ? "Excluded from investigation"
              : "Requires human confirmation"}
        </span>
        <div>
          {!confirmed && !rejected && (
            <>
              <button
                className="reject-button"
                onClick={() => onStatus(cause.id, "Rejected")}
              >
                Reject
              </button>
              <Button
                icon="check"
                variant="confirm"
                onClick={() => onStatus(cause.id, "Human Confirmed")}
              >
                Confirm
              </Button>
            </>
          )}
          {(confirmed || rejected) && (
            <button
              className="text-button"
              onClick={() => onStatus(cause.id, "Hypothesis")}
            >
              Undo
            </button>
          )}
        </div>
      </div>
    </article>
  )
}

function EvidenceChecklist({
  onRequest,
}: {
  onRequest: (title: string) => void
}) {
  return (
    <section className="card evidence-card">
      <SectionHeading icon="file" title="Evidence checklist" detail="3/5" />
      <p className="card-subtitle">
        A stronger case starts with the right evidence.
      </p>
      <div className="evidence-checklist">
        {evidenceItems.map((item) => (
          <button
            className="evidence-item"
            key={item.title}
            onClick={() => onRequest(item.title)}
          >
            <span className={`check-box ${item.available ? "checked" : ""}`}>
              {item.available && <Icon name="check" size={11} />}
            </span>
            <span>
              <strong>{item.title}</strong>
              <small>{item.detail}</small>
              <span
                className={`availability ${
                  item.available ? "available" : "missing"
                }`}
              >
                {item.available ? "Available" : "Missing"}
              </span>
            </span>
            {!item.available && <Icon name="plus" size={12} />}
          </button>
        ))}
      </div>
      <div className="evidence-note">
        <Icon name="info" size={13} />
        <span>Missing evidence may change the AI’s assessment.</span>
      </div>
    </section>
  )
}

function FiveWhys({ compact = false }: { compact?: boolean }) {
  return (
    <section className={`card whys-card ${compact ? "compact" : ""}`}>
      <SectionHeading icon="branch" title="5 Whys analysis">
        <Badge tone="purple" icon="sparkles">
          AI suggested
        </Badge>
      </SectionHeading>
      <p className="card-subtitle">
        Following the strongest lead to its source.
      </p>
      <div className="why-timeline">
        {whys.map((why, i) => (
          <div className="why-step" key={why.question}>
            <span className={`why-number ${i === 4 ? "last" : ""}`}>
              {String(i + 1).padStart(2, "0")}
            </span>
            <div>
              <h4>{why.question}</h4>
              <p>{why.answer}</p>
              <span className="why-source">
                <Icon name={i === 4 ? "sparkles" : "file"} size={11} />
                {why.evidence}
              </span>
            </div>
          </div>
        ))}
      </div>
      <div className="analysis-disclaimer">
        <Icon name="info" size={13} />A causal path, not a confirmed conclusion.
      </div>
    </section>
  )
}

function Fishbone({ onCause }: { onCause: (text: string) => void }) {
  const branches = [
    {
      name: "Man",
      icon: "help" as IconName,
      causes: ["Analyst technique", "Training gap"],
    },
    {
      name: "Machine",
      icon: "settings" as IconName,
      causes: ["HPLC calibration", "Column performance"],
    },
    {
      name: "Method",
      icon: "branch" as IconName,
      causes: ["Drying time", "Dilution procedure"],
      active: true,
    },
    {
      name: "Material",
      icon: "box" as IconName,
      causes: ["Incomplete reaction", "Impurity carryover"],
      active: true,
    },
    {
      name: "Measurement",
      icon: "activity" as IconName,
      causes: ["Standard preparation", "Weighing accuracy"],
      active: true,
    },
    {
      name: "Environment",
      icon: "flask" as IconName,
      causes: ["Room humidity", "Storage conditions"],
    },
  ]
  return (
    <section className="card fishbone-card">
      <SectionHeading icon="network" title="Cause & effect analysis">
        <Badge tone="purple" icon="sparkles">
          AI generated
        </Badge>
      </SectionHeading>
      <p className="card-subtitle">
        Explore potential contributors across the six investigation categories.
      </p>
      <div className="fishbone-diagram">
        <div className="fishbone-spine" />
        <div className="fishbone-branches">
          {branches.map((b, i) => (
            <div
              className={`fishbone-branch branch-${i} ${
                b.active ? "has-cause" : ""
              }`}
              key={b.name}
            >
              <div className="branch-heading">
                <Icon name={b.icon} size={15} />
                <strong>{b.name}</strong>
                {b.active && <span className="branch-dot" />}
              </div>
              {b.causes.map((c) => (
                <button key={c} onClick={() => onCause(c)}>
                  {c}
                </button>
              ))}
            </div>
          ))}
        </div>
        <div className="fish-head">
          <Icon name="target" size={22} />
          <strong>OOS Assay</strong>
          <span>97.2%</span>
          <small>MFH260712A</small>
        </div>
      </div>
      <div className="fishbone-legend">
        <span>
          <i />
          AI-identified candidate
        </span>
        <span>
          <i />
          Potential contributor
        </span>
        <span>Click a cause to investigate with Copilot</span>
      </div>
    </section>
  )
}

function CapaCard({
  capa,
  onStatus,
}: {
  capa: typeof initialCapas[number]
  onStatus: (id: string, status: string) => void
}) {
  return (
    <article
      className={`card capa-card ${
        capa.status === "Accepted" ? "accepted" : ""
      }`}
    >
      <div className="capa-card-top">
        <span className="cause-id">{capa.id}</span>
        <Badge
          tone={
            capa.status === "Accepted"
              ? "green"
              : capa.status === "Rejected"
                ? "slate"
                : "purple"
          }
          icon={capa.status === "Accepted" ? "check" : "sparkles"}
        >
          {capa.status}
        </Badge>
      </div>
      <h3>{capa.title}</h3>
      <p>{capa.rationale}</p>
      <span className="root-link">
        <Icon name="network" size={12} />
        Linked to {capa.root}
      </span>
      <div className="capa-fields">
        <div>
          <span>RESPONSIBLE DEPARTMENT</span>
          <strong>{capa.department}</strong>
        </div>
        <div>
          <span>PRIORITY</span>
          <Badge tone={capa.priority === "High" ? "amber" : "blue"}>
            {capa.priority}
          </Badge>
        </div>
        <div>
          <span>TARGET DATE</span>
          <strong>
            <Icon name="clock" size={12} />
            {capa.date}
          </strong>
        </div>
      </div>
      <div className="effectiveness">
        <Icon name="target" size={15} />
        <div>
          <strong>Effectiveness check</strong>
          <p>{capa.check}</p>
        </div>
      </div>
      <div className="capa-actions">
        {capa.status === "Proposed" ? (
          <>
            <button
              className="reject-button"
              onClick={() => onStatus(capa.id, "Rejected")}
            >
              Reject
            </button>
            <Button
              variant="confirm"
              icon="check"
              onClick={() => onStatus(capa.id, "Accepted")}
            >
              Accept action
            </Button>
          </>
        ) : (
          <>
            <span className="reviewed-by">Reviewed by Ananya Sharma</span>
            <button
              className="text-button"
              onClick={() => onStatus(capa.id, "Proposed")}
            >
              Undo
            </button>
          </>
        )}
      </div>
    </article>
  )
}

function Copilot({
  messages,
  loading,
  collapsed,
  onCollapse,
  onSend,
  onUpload,
  empty,
  onPaste,
}: {
  messages: Message[]
  loading: boolean
  collapsed: boolean
  onCollapse: () => void
  onSend: (text: string) => void
  onUpload: (file: File) => void
  empty: boolean
  onPaste: () => void
}) {
  const [input, setInput] = useState("")
  const [dragging, setDragging] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const endRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (messages.length > 4 || loading)
      endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" })
  }, [messages, loading])
  const submit = () => {
    if (input.trim() && !loading) {
      onSend(input.trim())
      setInput("")
    }
  }
  if (collapsed)
    return (
      <button className="collapsed-copilot" onClick={onCollapse}>
        <CopilotMark small />
        <span>AIVOA Copilot</span>
        <Icon name="panel" size={17} />
      </button>
    )
  return (
    <aside
      className={`copilot ${dragging ? "is-dragging" : ""}`}
      onDragOver={(e) => {
        e.preventDefault()
        setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragging(false)
        if (e.dataTransfer.files[0]) onUpload(e.dataTransfer.files[0])
      }}
    >
      <div className="copilot-header">
        <CopilotMark />
        <div>
          <h2>AIVOA Copilot</h2>
          <span>
            <i />
            {loading ? "Analyzing your case" : "Your investigation partner"}
          </span>
        </div>
        <button
          className="icon-button"
          aria-label="Collapse copilot"
          onClick={onCollapse}
        >
          <Icon name="panel" size={17} />
        </button>
      </div>
      <div className="copilot-context">
        <Icon name="network" size={13} />
        <span>
          {empty
            ? "Ready for a new investigation"
            : "Context: Root Cause Analysis"}
        </span>
        <span className="context-dot" />
      </div>
      <div className="chat-thread">
        <div className="chat-date">TODAY, 10:42 AM</div>
        {messages.map((m, i) => (
          <div className={`message message-${m.role} animate-in`} key={i}>
            {m.role === "ai" && (
              <div className="message-author">
                <CopilotMark small />
                <span>AIVOA</span>
                {i > 1 && <span className="message-time">10:43</span>}
              </div>
            )}
            <div className="message-bubble">
              <p>{m.text}</p>
              {m.file && (
                <div className="chat-file">
                  <span className="file-type">
                    <Icon name="file" size={17} />
                  </span>
                  <span>
                    {m.file}
                    <small>PDF document · Attached</small>
                  </span>
                  <Icon name="check-circle" size={14} />
                </div>
              )}
              {m.changes && (
                <div className="changes-list">
                  <div className="changes-heading">
                    <Icon name="sparkles" size={12} />
                    WHAT I UPDATED
                  </div>
                  {m.changes.map((c) => (
                    <div className="change" key={c.field}>
                      <span>{c.field}</span>
                      <div>
                        <del>{c.from}</del>
                        <Icon name="arrow" size={10} />
                        <strong>{c.to}</strong>
                      </div>
                    </div>
                  ))}
                  <span className="changes-link">
                    <Icon name="check-circle" size={11} />
                    Updated on your case canvas
                  </span>
                </div>
              )}
            </div>
            {m.role === "user" && (
              <span className="user-message-meta">
                You · 10:42 <Icon name="check" size={11} />
              </span>
            )}
          </div>
        ))}
        {loading && (
          <div className="typing-indicator">
            <CopilotMark small />
            <span />
            <span />
            <span />
            <small>Reviewing the evidence…</small>
          </div>
        )}
        <div ref={endRef} />
      </div>
      <div className="copilot-bottom">
        <div className="quick-prompts">
          {["Suggest root causes", "Generate CAPA", "Log a new incident"].map(
            (p) => (
              <button key={p} onClick={() => onSend(p)} disabled={loading}>
                <Icon
                  name={
                    p === "Suggest root causes"
                      ? "sparkles"
                      : p === "Generate CAPA"
                        ? "target"
                        : "plus"
                  }
                  size={12}
                />
                {p}
                <Icon name="arrow" size={11} />
              </button>
            ),
          )}
        </div>
        <div className="composer">
          <textarea
            aria-label="Message AIVOA Copilot"
            placeholder="Ask, describe, or paste an incident…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                submit()
              }
            }}
          />
          <div className="composer-toolbar">
            <button
              aria-label="Attach a PDF"
              title="Attach a PDF"
              onClick={() => fileRef.current?.click()}
            >
              <Icon name="attach" size={16} />
            </button>
            <button
              aria-label="Paste an email"
              title="Paste an email"
              onClick={onPaste}
            >
              <Icon name="mail" size={16} />
            </button>
            <span>↵ to send</span>
            <button
              className="send-button"
              disabled={!input.trim() || loading}
              aria-label="Send message"
              onClick={submit}
            >
              <Icon name="arrow" size={17} />
            </button>
          </div>
        </div>
        <button className="drop-zone" onClick={() => fileRef.current?.click()}>
          <Icon name="upload" size={12} />
          Drop a PDF here, or <strong>browse files</strong>
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,application/pdf"
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.[0]) onUpload(e.target.files[0])
            e.target.value = ""
          }}
        />
        <p className="copilot-disclaimer">
          <Icon name="shield" size={11} />
          AI can be wrong. Review before confirming.
        </p>
      </div>
      {dragging && (
        <div className="drag-overlay">
          <Icon name="upload" size={35} />
          <strong>Drop your PDF to investigate</strong>
        </div>
      )}
    </aside>
  )
}

function Modal({
  title,
  icon = "info",
  children,
  onClose,
  footer,
}: {
  title: string
  icon?: IconName
  children: ReactNode
  onClose: () => void
  footer?: ReactNode
}) {
  const closeRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    closeRef.current?.focus()
    const listener = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
      if (e.key === "Tab") {
        const elements = closeRef.current
          ?.closest('[role="dialog"]')
          ?.querySelectorAll<HTMLElement>(
            'button, input, textarea, [tabindex="0"]',
          )
        if (!elements?.length) return
        const first = elements[0],
          last = elements[elements.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener("keydown", listener)
    return () => {
      document.removeEventListener("keydown", listener)
      previous?.focus()
    }
  }, [onClose])
  return (
    <div
      className="modal-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <section
        className="modal animate-in"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="modal-heading">
          <span className="modal-icon">
            <Icon name={icon} size={23} />
          </span>
          <button
            ref={closeRef}
            aria-label="Close dialog"
            className="icon-button"
            onClick={onClose}
          >
            <Icon name="close" />
          </button>
        </div>
        <h2 id="modal-title">{title}</h2>
        <div className="modal-content">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </section>
    </div>
  )
}

function LoadingCanvas() {
  return (
    <section
      className="loading-canvas animate-in"
      role="status"
      aria-label="Building your investigation"
    >
      <div className="loading-canvas-label">
        <CopilotMark />
        <div>
          <h2>Connecting the dots…</h2>
          <p>Copilot is building your example investigation.</p>
        </div>
      </div>
      <div className="skeleton skeleton-title" />
      <div className="skeleton skeleton-subtitle" />
      <div className="skeleton skeleton-risk" />
      <div className="skeleton-columns">
        {[0, 1].map((i) => (
          <div className="card skeleton-card" key={i}>
            <div className="skeleton skeleton-subtitle" />
            <div className="skeleton skeleton-title" />
            {[0, 1, 2, 3].map((n) => (
              <div className="skeleton skeleton-line" key={n} />
            ))}
          </div>
        ))}
      </div>
    </section>
  )
}

export default function App() {
  const [stage, setStage] = useState("Root Cause Analysis")
  const [tab, setTab] = useState("Hypotheses")
  const [causes, setCauses] = useState(initialCauses)
  const [capas, setCapas] = useState(initialCapas)
  const [empty, setEmpty] = useState(false)
  const [messages, setMessages] = useState<Message[]>(firstMessages)
  const [loading, setLoading] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [modal, setModal] = useState<string | null>(null)
  const [toast, setToast] = useState<{
    text: string
    error?: boolean
  } | null>(null)
  const [document, setDocument] = useState("")
  const [pasteText, setPasteText] = useState("")
  const [saved, setSaved] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current)
    },
    [],
  )
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 4500)
      return () => clearTimeout(t)
    }
  }, [toast])
  const notify = (text: string, error = false) => setToast({ text, error })
  const unconfirmed = causes.filter(
    (c) => !["Human Confirmed", "Rejected"].includes(c.status),
  ).length
  const proposed = capas.filter((c) => c.status === "Proposed").length
  const send = (text: string, file?: string) => {
    if (loading) return
    setMessages((prev) => [...prev, { role: "user", text, file }])
    setLoading(true)
    setSaved(false)
    timer.current = setTimeout(() => {
      const lower = text.toLowerCase()
      let reply: Message
      if (lower.includes("new incident") && !file) {
        setEmpty(true)
        setStage("Incident")
        setCauses(initialCauses)
        setCapas(initialCapas)
        reply = {
          role: "ai",
          text: "Let’s start a new investigation. Paste the incident details, an email, or attach a PDF. For this prototype, I’ll demonstrate the workflow using our Metformin investigation.",
        }
      } else if (lower.includes("capa") && !empty) {
        setStage("CAPA")
        reply = {
          role: "ai",
          text: "I’ve prepared 2 corrective and 2 preventive actions linked to the root cause hypotheses. Review the owners, target dates, and effectiveness checks before accepting.",
          changes: [
            { field: "CAPA plan", from: "Draft", to: "4 proposed actions" },
          ],
        }
      } else if (lower.includes("root cause") && !empty) {
        setStage("Root Cause Analysis")
        setTab("Hypotheses")
        reply = {
          role: "ai",
          text: "The 3 candidate causes are ready for review. HPLC reference standard preparation remains the strongest lead. The system suitability pass does not rule out a standard concentration error.",
        }
      } else if (empty || file) {
        setEmpty(false)
        setStage("Root Cause Analysis")
        setTab("Hypotheses")
        reply = {
          role: "ai",
          text: "I’ve populated the example investigation using the Metformin mock case. This prototype simulates document extraction; your PDF is not uploaded or analyzed.",
          changes: [
            { field: "Product", from: "Not set", to: "Metformin HCl API" },
            { field: "Assay result", from: "Not set", to: "97.2% (OOS)" },
            { field: "Severity", from: "Not set", to: "Major" },
          ],
        }
      } else {
        reply = {
          role: "ai",
          text: `For this investigation, I recommend independently preparing the HPLC reference standard and repeating the assay on a retained sample. Keep batch MFH260712A on hold pending QA review. This is a simulated response based on the example case, not a verified analytical conclusion.`,
          changes:
            lower.includes("verify") || lower.includes("standard")
              ? [
                  {
                    field: "Next step",
                    from: "Pending review",
                    to: "Independent repeat assay",
                  },
                ]
              : undefined,
        }
      }
      setMessages((prev) => [...prev, reply])
      setLoading(false)
    }, 1400)
  }
  const upload = (file: File) => {
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      notify("Please select a PDF document to continue.", true)
      return
    }
    if (file.size > 20 * 1024 * 1024) {
      notify("This file is too large. Please select a PDF under 20 MB.", true)
      return
    }
    send(
      "Please review this document and populate the investigation.",
      file.name,
    )
  }
  const newCase = () => {
    setModal("new")
  }
  const startNew = () => {
    if (timer.current) clearTimeout(timer.current)
    setLoading(false)
    setEmpty(true)
    setStage("Incident")
    setMessages([
      {
        role: "ai",
        text: "Hello, Ananya. Let’s get to the root of it. Paste an incident, share an email, or upload a QC report. I’ll help turn the details into a structured investigation.",
      },
    ])
    setCauses(initialCauses)
    setCapas(initialCapas)
    setModal(null)
    setSaved(false)
  }
  const documentAction = (name: string) => {
    if (name === "upload") {
      setModal("upload")
    } else {
      setDocument(name)
      setModal("document")
    }
  }
  const reviewCause = (id: string, status: Cause["status"]) => {
    setCauses((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)))
    setSaved(false)
    notify(
      status === "Human Confirmed"
        ? `${id} confirmed. Your review has been recorded in this prototype.`
        : status === "Rejected"
          ? `${id} rejected and excluded from the investigation.`
          : `${id} returned to hypothesis.`,
    )
  }
  const requestEvidence = (title: string) => {
    if (evidenceItems.find((i) => i.title === title)?.available) {
      setDocument(title)
      setModal("document")
    } else send(`What evidence is needed for ${title.toLowerCase()}?`)
  }
  return (
    <div className={`app-shell ${collapsed ? "copilot-is-collapsed" : ""}`}>
      <header className="topbar">
        <a
          className="brand"
          href="#"
          onClick={(e) => e.preventDefault()}
          aria-label="AIVOA RCA Studio"
        >
          <span className="brand-mark">
            <i />
            <i />
            <i />
            <i />
          </span>
          <span>
            AIVOA<span className="brand-divider">/</span>
            <span className="brand-product">RCA Studio</span>
          </span>
        </a>
        <div className="topbar-case">
          <span className="topbar-divider" />
          <Icon name="file" size={14} />
          <span>{empty ? "New investigation" : "RCA-2026-0001"}</span>
          <Badge
            tone={loading ? "purple" : saved ? "green" : "slate"}
            icon={loading ? "sparkles" : saved ? "check" : undefined}
          >
            <span className={`status-dot ${loading ? "processing" : ""}`} />
            {loading
              ? "AI Processing"
              : empty
                ? "Draft"
                : saved
                  ? "Ready to Save"
                  : "Needs Review"}
          </Badge>
        </div>
        <div className="topbar-actions">
          <span className="prototype-label">
            <Icon name="shield" size={12} />
            Prototype, not a validated GxP system
          </span>
          <Button
            variant="primary"
            icon="download"
            disabled={empty || loading}
            onClick={() => setModal("save")}
          >
            Save Investigation
          </Button>
          <span className="top-avatar">AS</span>
        </div>
      </header>
      <Sidebar
        stage={stage}
        setStage={setStage}
        empty={empty}
        newCase={newCase}
        onDocument={documentAction}
        onHelp={() => setModal("help")}
      />
      <main className="case-canvas">
        <div className="canvas-breadcrumb">
          <span>Investigations</span>
          <Icon name="chevron" size={11} />
          <span>{empty ? "New investigation" : "RCA-2026-0001"}</span>
          <span className="canvas-secure">
            <Icon name="shield" size={12} />
            Private workspace
          </span>
        </div>
        {empty && loading ? (
          <LoadingCanvas />
        ) : empty ? (
          <div className="empty-canvas animate-in">
            <span className="empty-overline">
              YOUR AI-ASSISTED INVESTIGATION WORKSPACE
            </span>
            <div className="empty-visual">
              <span className="empty-orbit orbit-1" />
              <span className="empty-orbit orbit-2" />
              <div className="empty-center">
                <Icon name="network" size={40} />
              </div>
              <span className="floating-file">
                <Icon name="file" size={23} />
              </span>
              <span className="floating-spark">
                <Icon name="sparkles" size={21} />
              </span>
            </div>
            <h1>
              Every answer starts
              <br />
              with the right question.
            </h1>
            <p>
              Bring the incident. We’ll help connect the evidence,
              <br className="desktop-break" /> uncover possible causes, and find
              a path forward.
            </p>
            <Button
              variant="primary"
              icon="sparkles"
              onClick={() =>
                send(
                  "Investigate the OOS assay for Metformin HCl API batch MFH260712A, assay 97.2% versus 98.0–102.0%.",
                )
              }
            >
              Explore an example investigation
            </Button>
            <span className="empty-or">
              or share an incident with your copilot
            </span>
            <div className="empty-features">
              {[
                {
                  icon: "file" as IconName,
                  title: "Start with your evidence",
                  text: "Paste an incident or attach a PDF.",
                },
                {
                  icon: "network" as IconName,
                  title: "Connect the dots",
                  text: "Explore AI-assisted hypotheses.",
                },
                {
                  icon: "shield" as IconName,
                  title: "Stay in control",
                  text: "Review and confirm every finding.",
                },
              ].map((f) => (
                <div key={f.title}>
                  <Icon name={f.icon} size={20} />
                  <h3>{f.title}</h3>
                  <p>{f.text}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            <div className="case-heading">
              <div className="case-kicker">
                <span className="case-number">RCA-2026-0001</span>
                <Badge tone="amber">
                  <span className="badge-dot" />
                  Major
                </Badge>
                <Badge tone="slate" icon="clock">
                  Batch on hold
                </Badge>
              </div>
              <h1>Out-of-specification assay result</h1>
              <div className="case-meta">
                <span>
                  <Icon name="flask" size={14} />
                  Metformin Hydrochloride API
                </span>
                <i />
                <span>
                  Batch <strong>MFH260712A</strong>
                </span>
                <i />
                <span>
                  <Icon name="box" size={13} />
                  Hyderabad · Unit II
                </span>
              </div>
              <div className="case-heading-note">
                <span>Manufactured 12 Jul 2026</span>
                <span>
                  Assay <strong className="oos-value">97.2%</strong>
                  <span className="spec-value"> / Spec. 98.0–102.0%</span>
                </span>
              </div>
            </div>
            <RiskSnapshot
              onAction={() => send("Help me verify HPLC standard preparation.")}
            />
            <div className="stage-heading">
              <div>
                <span className="stage-eyebrow">
                  STEP{" "}
                  {String(
                    stages.findIndex((s) => s.name === stage) + 1,
                  ).padStart(2, "0")}{" "}
                  OF 06
                </span>
                <h2>{stage}</h2>
                <p>
                  {stage === "Root Cause Analysis"
                    ? "Explore the possibilities. Follow the evidence."
                    : stage === "CAPA"
                      ? "Turn investigation insights into meaningful action."
                      : stage === "Evidence"
                        ? "Build a complete and traceable evidence trail."
                        : "Your copilot captured the details. Review and confirm."}
                </p>
              </div>
              <div className="stage-heading-right">
                {stage === "Root Cause Analysis" ? (
                  <Badge tone="purple" icon="sparkles">
                    3 AI hypotheses
                  </Badge>
                ) : stage === "CAPA" ? (
                  <Badge tone="purple" icon="sparkles">
                    {proposed} proposed actions
                  </Badge>
                ) : (
                  <Badge tone="blue" icon="check">
                    AI populated
                  </Badge>
                )}
              </div>
            </div>
            {loading && (
              <div className="processing-banner" role="status">
                <Icon name="sparkles" size={15} />
                <span>Copilot is working on your investigation…</span>
                <span className="loading-line" />
              </div>
            )}
            {stage === "Root Cause Analysis" && (
              <>
                <div
                  className="analysis-tabs"
                  role="tablist"
                  aria-label="Analysis view"
                >
                  {[
                    {
                      name: "Hypotheses",
                      icon: "target" as IconName,
                      count: "3",
                    },
                    { name: "5 Whys", icon: "branch" as IconName },
                    { name: "Fishbone", icon: "network" as IconName },
                  ].map((t) => (
                    <button
                      key={t.name}
                      role="tab"
                      aria-selected={tab === t.name}
                      onClick={() => setTab(t.name)}
                      className={tab === t.name ? "selected" : ""}
                    >
                      <Icon name={t.icon} size={15} />
                      {t.name}
                      {t.count && <span>{t.count}</span>}
                    </button>
                  ))}
                  <div className="tabs-end">
                    <span className="saved-dot" />
                    {saved ? "Saved in this session" : "Changes not saved"}
                  </div>
                </div>
                {tab === "Hypotheses" ? (
                  <div className="analysis-grid animate-in">
                    <div className="causes-list">
                      {causes.map((cause) => (
                        <CauseCard
                          cause={cause}
                          key={cause.id}
                          onStatus={reviewCause}
                        />
                      ))}
                    </div>
                    <div className="analysis-side">
                      <EvidenceChecklist onRequest={requestEvidence} />
                      <section className="card causal-preview">
                        <div className="heading-group">
                          <Icon name="branch" size={17} />
                          <h3>Go a little deeper</h3>
                        </div>
                        <p>
                          Trace the strongest hypothesis through five layers of
                          “why”.
                        </p>
                        <button onClick={() => setTab("5 Whys")}>
                          Explore 5 Whys analysis
                          <Icon name="arrow" size={14} />
                        </button>
                      </section>
                      <div className="human-note">
                        <Icon name="shield" size={17} />
                        <div>
                          <strong>Your judgment comes first</strong>
                          <p>
                            AI hypotheses are starting points. Confirm only when
                            the evidence supports your conclusion.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : tab === "5 Whys" ? (
                  <div className="analysis-grid animate-in">
                    <FiveWhys />
                    <div className="analysis-side">
                      <EvidenceChecklist onRequest={requestEvidence} />
                      <div className="human-note">
                        <Icon name="info" size={17} />
                        <div>
                          <strong>Linked hypothesis</strong>
                          <p>
                            RC-01 · HPLC reference standard preparation error
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="animate-in">
                    <Fishbone
                      onCause={(c) =>
                        send(`Help investigate ${c.toLowerCase()}.`)
                      }
                    />
                    <div className="fishbone-bottom">
                      <div className="human-note">
                        <Icon name="info" size={17} />
                        <div>
                          <strong>
                            Broaden the investigation, then narrow the focus
                          </strong>
                          <p>
                            Six categories help avoid premature conclusions.
                            AI-identified candidates are not confirmed causes.
                          </p>
                        </div>
                      </div>
                      <Button
                        icon="target"
                        onClick={() => setTab("Hypotheses")}
                      >
                        Review hypotheses
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
            {stage === "CAPA" && (
              <div className="capa-view animate-in">
                <div className="capa-notice">
                  <Icon name="info" size={15} />
                  <p>
                    Actions are preliminary. Confirm the root cause and review
                    the proposed plan before implementation.
                  </p>
                </div>
                <div className="capa-columns">
                  {["Corrective", "Preventive"].map((type) => (
                    <div key={type}>
                      <div className="capa-column-heading">
                        <span
                          className={
                            type === "Corrective"
                              ? "corrective-icon"
                              : "preventive-icon"
                          }
                        >
                          <Icon
                            name={type === "Corrective" ? "target" : "shield"}
                            size={16}
                          />
                        </span>
                        <h3>{type} actions</h3>
                        <span className="count-pill">2</span>
                      </div>
                      {capas
                        .filter((c) => c.type === type)
                        .map((c) => (
                          <CapaCard
                            capa={c}
                            key={c.id}
                            onStatus={(id, status) => {
                              setCapas((prev) =>
                                prev.map((item) =>
                                  item.id === id ? { ...item, status } : item,
                                ),
                              )
                              setSaved(false)
                              notify(`${id} ${status.toLowerCase()}.`)
                            }}
                          />
                        ))}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {stage === "Evidence" && (
              <div className="details-grid animate-in">
                <EvidenceChecklist onRequest={requestEvidence} />
                <section className="card detail-card">
                  <SectionHeading
                    icon="upload"
                    title="Add supporting evidence"
                  />
                  <p>
                    Ask the copilot which records are needed, or attach a PDF to
                    the conversation.
                  </p>
                  <Button icon="attach" onClick={() => setModal("upload")}>
                    Attach a document
                  </Button>
                  <div className="human-note">
                    <Icon name="shield" size={17} />
                    <div>
                      <strong>Prototype document handling</strong>
                      <p>
                        Files remain in your browser. Extraction is simulated
                        using the Metformin example.
                      </p>
                    </div>
                  </div>
                </section>
              </div>
            )}
            {["Incident", "Product & Batch", "Impact"].includes(stage) && (
              <section className="card detail-card animate-in">
                <SectionHeading
                  icon={stages.find((s) => s.name === stage)?.icon}
                  title={`${stage} details`}
                >
                  <Badge tone="blue" icon="sparkles">
                    Populated by Copilot
                  </Badge>
                </SectionHeading>
                <div className="detail-fields">
                  {(stage === "Incident"
                    ? [
                        {
                          label: "Incident title",
                          value: "Out-of-specification assay result",
                        },
                        { label: "Incident date", value: "14 July 2026" },
                        {
                          label: "Reported by",
                          value: "Ananya Sharma · Quality Assurance",
                        },
                        {
                          label: "Description",
                          value:
                            "Final API assay 97.2%, below the approved specification of 98.0–102.0%.",
                        },
                      ]
                    : stage === "Product & Batch"
                      ? [
                          {
                            label: "Product name",
                            value: "Metformin Hydrochloride API",
                          },
                          { label: "Batch number", value: "MFH260712A" },
                          {
                            label: "Manufacturing date",
                            value: "12 July 2026",
                          },
                          { label: "Facility", value: "Hyderabad · Unit II" },
                        ]
                      : [
                          {
                            label: "Severity",
                            value: "Major",
                            status: "AI suggested",
                          },
                          { label: "Batch disposition", value: "On hold" },
                          {
                            label: "Potential impact",
                            value:
                              "Product potency and specification compliance",
                            status: "AI suggested",
                          },
                          {
                            label: "Containment",
                            value:
                              "Maintain batch hold pending OOS investigation",
                            status: "AI suggested",
                          },
                        ]
                  ).map((f) => (
                    <Field
                      key={f.label}
                      {...f}
                      onReview={() => {
                        setSaved(false)
                        notify(
                          "Field reviewed. Change recorded for this session.",
                        )
                      }}
                    />
                  ))}
                </div>
                <div className="analysis-disclaimer">
                  <Icon name="info" size={13} />
                  AI-extracted information should be checked against the source
                  documents.
                </div>
              </section>
            )}
            <div className="canvas-footer">
              <span>
                <Icon name="shield" size={12} />
                AI-assisted. Human-led. Evidence-driven.
              </span>
              <button
                onClick={() => {
                  const index = stages.findIndex((s) => s.name === stage)
                  setStage(stages[(index + 1) % stages.length].name)
                }}
              >
                {stage === "CAPA"
                  ? "Back to incident"
                  : `Continue to ${stages[stages.findIndex((s) => s.name === stage) + 1]?.name ?? "CAPA"}`}
                <Icon name="arrow" size={14} />
              </button>
            </div>
          </>
        )}
      </main>
      <Copilot
        messages={messages}
        loading={loading}
        collapsed={collapsed}
        onCollapse={() => setCollapsed(!collapsed)}
        onSend={send}
        onUpload={upload}
        empty={empty}
        onPaste={() => setModal("paste")}
      />
      {toast && (
        <div
          role={toast.error ? "alert" : "status"}
          className={`toast ${toast.error ? "toast-error" : ""}`}
        >
          <Icon name={toast.error ? "warning" : "check-circle"} size={18} />
          <span>{toast.text}</span>
          <button
            aria-label="Dismiss notification"
            onClick={() => setToast(null)}
          >
            <Icon name="close" size={14} />
          </button>
        </div>
      )}
      {modal === "save" && (
        <Modal
          title="Save this investigation?"
          icon="download"
          onClose={() => setModal(null)}
          footer={
            <>
              <Button onClick={() => setModal(null)}>Cancel</Button>
              <Button
                variant="primary"
                icon="check"
                onClick={() => {
                  setModal(null)
                  setSaved(true)
                  notify(
                    "Investigation saved for this session. No data is sent to a server.",
                  )
                }}
              >
                {unconfirmed || proposed ? "Save anyway" : "Save investigation"}
              </Button>
            </>
          }
        >
          <p>
            Your investigation includes AI-generated content that hasn’t been
            fully reviewed.
          </p>
          <div className="save-summary">
            <div>
              <span className="summary-icon purple">
                <Icon name="network" size={18} />
              </span>
              <span>
                Unconfirmed AI hypotheses
                <small>Require human review and verification</small>
              </span>
              <strong>{unconfirmed}</strong>
            </div>
            <div>
              <span className="summary-icon amber">
                <Icon name="target" size={18} />
              </span>
              <span>
                Proposed CAPA actions
                <small>Not yet accepted for implementation</small>
              </span>
              <strong>{proposed}</strong>
            </div>
          </div>
          <div className="modal-warning">
            <Icon name="info" size={16} />
            <span>
              Saving does not approve the findings or release the batch. This
              prototype retains changes only until the page is refreshed.
            </span>
          </div>
        </Modal>
      )}
      {modal === "new" && (
        <Modal
          title="Start a new investigation?"
          icon="plus"
          onClose={() => setModal(null)}
          footer={
            <>
              <Button onClick={() => setModal(null)}>Keep working</Button>
              <Button variant="primary" onClick={startNew}>
                Start new investigation
              </Button>
            </>
          }
        >
          <p>
            This will clear the current prototype workspace, including reviews
            and chat messages. No changes are stored after a refresh.
          </p>
        </Modal>
      )}
      {modal === "paste" && (
        <Modal
          title="Start with an email or incident"
          icon="mail"
          onClose={() => setModal(null)}
          footer={
            <>
              <Button onClick={() => setModal(null)}>Cancel</Button>
              <Button
                variant="primary"
                icon="sparkles"
                disabled={!pasteText.trim()}
                onClick={() => {
                  send(pasteText)
                  setPasteText("")
                  setModal(null)
                }}
              >
                Share with Copilot
              </Button>
            </>
          }
        >
          <p>
            Paste the incident details below. Copilot will demonstrate
            extraction using the Metformin example case.
          </p>
          <textarea
            className="paste-textarea"
            aria-label="Incident or email content"
            placeholder="Paste an email or describe what happened…"
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
          />
        </Modal>
      )}
      {modal === "upload" && (
        <Modal
          title="Add a source document"
          icon="upload"
          onClose={() => setModal(null)}
        >
          <p>
            Choose a QC report or other supporting PDF. This prototype simulates
            extraction and does not upload your file.
          </p>
          <label className="modal-upload">
            <Icon name="upload" size={27} />
            <strong>Choose a PDF document</strong>
            <span>PDF files up to 20 MB</span>
            <input
              type="file"
              accept=".pdf,application/pdf"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  upload(e.target.files[0])
                  setModal(null)
                }
              }}
            />
          </label>
        </Modal>
      )}
      {modal === "document" && (
        <Modal
          title={document.replace(/_/g, " ")}
          icon="file"
          onClose={() => setModal(null)}
          footer={
            <Button variant="primary" onClick={() => setModal(null)}>
              Done
            </Button>
          }
        >
          <Badge tone="blue" icon="file">
            Mock source document
          </Badge>
          <div className="document-preview">
            <span>AIVOA · QUALITY CONTROL</span>
            <h3>
              {document.includes("SOP")
                ? "Standard preparation procedure"
                : document.includes("Batch")
                  ? "Batch manufacturing record"
                  : "Analytical investigation record"}
            </h3>
            <dl>
              <div>
                <dt>Product</dt>
                <dd>Metformin Hydrochloride API</dd>
              </div>
              <div>
                <dt>Batch</dt>
                <dd>MFH260712A</dd>
              </div>
              <div>
                <dt>Manufactured</dt>
                <dd>12 July 2026</dd>
              </div>
              <div>
                <dt>Assay result</dt>
                <dd>97.2% (Spec. 98.0–102.0%)</dd>
              </div>
              <div>
                <dt>Disposition</dt>
                <dd>On hold · Investigation required</dd>
              </div>
            </dl>
            <p>
              Manual dilution recorded. No independent second-person
              verification documented. System suitability met acceptance
              criteria.
            </p>
          </div>
          <p className="small-note">
            Illustrative excerpt only. Original PDF files are not included in
            this prototype.
          </p>
        </Modal>
      )}
      {modal === "help" && (
        <Modal
          title="Your investigation, AI-assisted"
          icon="help"
          onClose={() => setModal(null)}
          footer={
            <Button variant="primary" onClick={() => setModal(null)}>
              Got it
            </Button>
          }
        >
          <div className="help-steps">
            <p>
              <strong>1. Share an incident</strong>Paste details, an email, or
              attach a PDF in the copilot.
            </p>
            <p>
              <strong>2. Follow the evidence</strong>Switch between hypotheses,
              5 Whys, and fishbone analysis.
            </p>
            <p>
              <strong>3. Make the call</strong>Confirm or reject root causes,
              then review the CAPA plan.
            </p>
            <p>
              <strong>4. Save your work</strong>Review outstanding AI
              suggestions before saving.
            </p>
          </div>
          <div className="modal-warning">
            <Icon name="shield" size={17} />
            <span>
              This is a static prototype, not a validated GxP system. Chat
              responses and extraction are simulated. Changes are session-only.
            </span>
          </div>
        </Modal>
      )}
    </div>
  )
}
