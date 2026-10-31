import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../app/store';
import { sendMessage } from '../../features/copilot/copilotSlice';
import { Icon } from '../Icon';

export const RiskSnapshot: React.FC = () => {
  const dispatch = useAppDispatch();
  const risk = useAppSelector((state) => state.investigation?.current?.risk);
  const evidence = useAppSelector((state) => state.investigation?.current?.evidence || []);
  const isLoading = useAppSelector((state) => state.copilot?.status === 'loading');

  const [expanded, setExpanded] = useState(false);

  const missingEvidence = evidence.filter((e) => e.availability === 'missing');
  const hasRisk = Boolean(risk && (risk.severity || risk.rationale || risk.next_action));

  const handleActionClick = () => {
    if (risk?.next_action && !isLoading) {
      dispatch(sendMessage({ message: `Proceed with action: ${risk.next_action}` }));
    }
  };

  if (!hasRisk) {
    return (
      <section className="risk-snapshot">
        <div className="risk-heading">
          <div className="heading-group">
            <span className="risk-icon">
              <Icon name="shield" size={17} />
            </span>
            <h3>Risk Assessment Snapshot</h3>
            <span className="preliminary">Assessment · preliminary</span>
          </div>
        </div>
        <p className="risk-rationale" style={{ color: '#888', fontStyle: 'italic' }}>
          <Icon name="info" size={13} />
          Risk snapshot will appear here as soon as incident evidence is ingested by Copilot.
        </p>
      </section>
    );
  }

  return (
    <section className="risk-snapshot">
      <div className="risk-heading">
        <div className="heading-group">
          <span className="risk-icon">
            <Icon name="activity" size={17} />
          </span>
          <h3>Risk Assessment Snapshot</h3>
          <span className="preliminary">Assessment · preliminary</span>
        </div>
        <button
          type="button"
          className="icon-button"
          aria-label={expanded ? 'Hide risk rationale' : 'Expand risk rationale'}
          onClick={() => setExpanded(!expanded)}
        >
          <Icon
            name="chevron"
            size={15}
            className={expanded ? 'rotate-up' : 'rotate-down'}
          />
        </button>
      </div>

      <div className="risk-columns">
        <div className="risk-item">
          <span className="eyebrow">SUGGESTED SEVERITY</span>
          <div>
            <span className="severity-dot" />
            <strong>{risk.severity || 'Major'}</strong>
            <span className="risk-caption">Quality impact</span>
          </div>
        </div>

        <div className="risk-item">
          <span className="eyebrow">CONTAINMENT</span>
          <div>
            <Icon name="shield" size={16} className="teal" />
            <strong>{risk.containment_required ? 'Required' : 'Under Review'}</strong>
            <span className="risk-caption">
              {risk.containment_required ? 'Batch on hold' : 'No hold active'}
            </span>
          </div>
        </div>

        {risk.next_action && (
          <div className="risk-item next-action">
            <span className="eyebrow">SUGGESTED NEXT ACTION</span>
            <button type="button" onClick={handleActionClick} disabled={isLoading}>
              {risk.next_action}
              <Icon name="arrow" size={15} />
            </button>
          </div>
        )}
      </div>

      {risk.rationale && (
        <p className="risk-rationale">
          <Icon name="info" size={13} />
          {risk.rationale}
        </p>
      )}

      {expanded && (
        <div className="expanded-rationale animate-in">
          {risk.rationale || 'Detailed risk evaluation guidelines apply.'}
          {risk.occurrence && (
            <div style={{ marginTop: '6px', fontSize: '11px', color: '#666' }}>
              <strong>Occurrence:</strong> {risk.occurrence} |{' '}
              <strong>Detectability:</strong> {risk.detectability || 'Standard'}
            </div>
          )}
        </div>
      )}

      {/* Missing evidence highlight required by assessment */}
      {missingEvidence.length > 0 && (
        <div
          style={{
            marginTop: '12px',
            padding: '8px 12px',
            background: '#fff9ed',
            border: '1px solid #f6d89e',
            borderRadius: '6px',
            fontSize: '11px',
            color: '#845700'
          }}
        >
          <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Icon name="warning" size={13} />
            Missing Evidence Gaps Identified ({missingEvidence.length})
          </div>
          <ul style={{ margin: '6px 0 0 18px', padding: 0 }}>
            {missingEvidence.map((ev) => (
              <li key={ev.id} style={{ marginBottom: '4px', lineHeight: 1.4 }}>
                <span style={{ fontWeight: 550, color: '#6d4500' }}>{ev.description}</span>
                {ev.why_needed &&
                  ev.why_needed !== 'Required for cGMP compliance and root cause verification' && (
                    <span style={{ color: '#a07800', marginLeft: '5px', fontSize: '10px' }}>
                      ({ev.why_needed})
                    </span>
                  )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
};

