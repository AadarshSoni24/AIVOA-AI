import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../app/store';
import { selectFieldValue, selectFieldStatus } from '../features/investigation/selectors';
import { updateField } from '../features/investigation/investigationSlice';
import { Badge } from './UI';
import { Icon } from './Icon';

interface AIFieldProps {
  path: string;
  label: string;
  type?: 'text' | 'textarea' | 'select';
  options?: string[];
  placeholder?: string;
}

export const AIField: React.FC<AIFieldProps> = ({
  path,
  label,
  type = 'text',
  options,
  placeholder = '-'
}) => {
  const dispatch = useAppDispatch();
  const rawValue = useAppSelector((state) => selectFieldValue(state, path));
  const status = useAppSelector((state) => selectFieldStatus(state, path));
  const isHighlighted = useAppSelector((state) =>
    state.copilot.highlightedPaths.includes(path)
  );
  const isLoading = useAppSelector((state) => state.copilot.status === 'loading');

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');

  const startEditing = () => {
    setDraft(rawValue ? String(rawValue) : '');
    setEditing(true);
  };

  const handleSave = () => {
    dispatch(updateField({ path, value: draft }));
    setEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && type !== 'textarea') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      setDraft(rawValue ? String(rawValue) : '');
      setEditing(false);
    }
  };

  // Status badge config
  const getBadge = () => {
    switch (status) {
      case 'confirmed':
        return (
          <Badge tone="green" icon="check-circle">
            Confirmed
          </Badge>
        );
      case 'reviewed':
        return (
          <Badge tone="slate" icon="check">
            Reviewed
          </Badge>
        );
      case 'ai_suggested':
        return (
          <Badge tone="purple" icon="network">
            AI suggested
          </Badge>
        );
      case 'extracted':
      default:
        return <Badge tone="blue">Extracted</Badge>;
    }
  };

  const displayValue = rawValue ? String(rawValue) : placeholder;

  return (
    <div className="review-field">
      <div className="field-label">
        <span>{label}</span>
        {getBadge()}
      </div>

      <div
        className={`field-value ${isHighlighted ? 'is-highlighted' : ''}`}
        style={isHighlighted ? { animation: 'field-highlight 3.5s ease-out' } : undefined}
      >
        {editing ? (
          type === 'select' && options ? (
            <select
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleKeyDown}
              className="field-input"
            >
              <option value="">Select...</option>
              {options.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          ) : type === 'textarea' ? (
            <textarea
              autoFocus
              value={draft}
              rows={2}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleKeyDown}
              className="field-input"
            />
          ) : (
            <input
              autoFocus
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleKeyDown}
              className="field-input"
            />
          )
        ) : (
          <span className={!rawValue ? 'text-muted' : ''}>{displayValue}</span>
        )}

        <button
          type="button"
          aria-label={editing ? `Confirm ${label}` : `Edit ${label} for review`}
          title={editing ? 'Save' : 'Edit for review'}
          disabled={isLoading}
          onClick={() => {
            if (editing) {
              handleSave();
            } else {
              startEditing();
            }
          }}
          className="icon-button"
        >
          <Icon name={editing ? 'check' : 'edit'} size={14} />
        </button>
      </div>
    </div>
  );
};
