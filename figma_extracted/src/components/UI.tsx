import { useState, type ReactNode } from "react"
import { Icon, type IconName } from "./Icon"

export function Badge({
  children,
  tone = "slate",
  icon,
  className = "",
}: {
  children: ReactNode
  tone?: string
  icon?: IconName
  className?: string
}) {
  return (
    <span className={`badge badge-${tone} ${className}`}>
      {icon && <Icon name={icon} size={12} />}
      {children}
    </span>
  )
}
export function Button({
  children,
  onClick,
  variant = "secondary",
  icon,
  className = "",
  disabled = false,
}: {
  children: ReactNode
  onClick?: () => void
  variant?: string
  icon?: IconName
  className?: string
  disabled?: boolean
}) {
  return (
    <button
      className={`btn btn-${variant} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {icon && <Icon name={icon} size={15} />}
      {children}
    </button>
  )
}
export function Field({
  label,
  value,
  status = "Extracted",
  onReview,
}: {
  label: string
  value: string
  status?: string
  onReview?: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [text, setText] = useState(value)
  const [reviewed, setReviewed] = useState(false)
  return (
    <div className="review-field">
      <div className="field-label">
        <span>{label}</span>
        <Badge
          tone={
            reviewed ? "slate" : status === "AI suggested" ? "purple" : "blue"
          }
          icon={reviewed ? "check" : undefined}
        >
          {reviewed ? "Reviewed" : status}
        </Badge>
      </div>
      <div className="field-value">
        {editing ? (
          <input
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setEditing(false)
                setReviewed(true)
                onReview?.()
              }
            }}
          />
        ) : (
          <span>{text}</span>
        )}
        <button
          aria-label={editing ? `Confirm ${label}` : `Review ${label}`}
          onClick={() => {
            if (editing) {
              setReviewed(true)
              onReview?.()
            }
            setEditing(!editing)
          }}
          className="icon-button"
        >
          <Icon name={editing ? "check" : "edit"} size={14} />
        </button>
      </div>
    </div>
  )
}
export function SectionHeading({
  icon,
  title,
  detail,
  children,
}: {
  icon?: IconName
  title: string
  detail?: string
  children?: ReactNode
}) {
  return (
    <div className="section-heading">
      <div className="heading-group">
        {icon && <Icon name={icon} size={17} />}
        <h3>{title}</h3>
        {detail && <span className="count-pill">{detail}</span>}
      </div>
      {children}
    </div>
  )
}
export function CopilotMark({ small = false }: { small?: boolean }) {
  return (
    <span className={`copilot-mark ${small ? "small" : ""}`}>
      <Icon name="sparkles" size={small ? 14 : 20} />
    </span>
  )
}
