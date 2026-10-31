import React, { useState } from 'react';
import { useAppDispatch } from '../../app/store';
import {
  confirmRootCause,
  rejectRootCause,
  setRootCauseStatus
} from '../investigation/investigationSlice';
import { showToast } from '../ui/uiSlice';
import { InvestigationRootCause, RootCauseStatus } from '../investigation/types';
import { Badge, Button } from '../../components/UI';
import { Icon } from '../../components/Icon';

interface CauseCardProps {
  cause: InvestigationRootCause;
  index: number;
}

export const CauseCard: React.FC<CauseCardProps> = ({ cause, index }) => {
  const dispatch = useAppDispatch();
  const [expanded, setExpanded] = useState(index === 0);

  const confirmed = cause.status === 'human_confirmed';
  const rejected = cause.status === 'rejected';

  const handleConfirm = () => {
    dispatch(confirmRootCause(cause.id));
    dispatch(
      showToast({
        text: `${cause.id} confirmed by QA Specialist.`,
        error: false
      })
    );
  };

  const handleReject = () => {
    dispatch(rejectRootCause(cause.id));
    dispatch(
      showToast({
        text: `${cause.id} rejected and excluded from primary investigation.`,
        error: false
      })
    );
  };

  const handleUndo = () => {
    dispatch(setRootCauseStatus({ id: cause.id, status: 'hypothesis' }));
    dispatch(
      showToast({
        text: `${cause.id} reset to AI hypothesis.`,
        error: false
      })
    );
  };

  const getStatusBadge = () => {
    if (confirmed) {
      return (
        <Badge tone="green" icon="check-circle">
          Human confirmed
        </Badge>
      );
    }
    if (rejected) {
      return (
        <Badge tone="slate">
          Rejected
        </Badge>
      );
    }
    if (cause.status === 'evidence_supported') {
      return (
        <Badge tone="purple" icon="check">
          Evidence supported
        </Badge>
      );
    }
    return (
      <Badge tone="purple" icon="network">
        Hypothesis
      </Badge>
    );
  };

  const categoryName =
    cause.category.charAt(0).toUpperCase() + cause.category.slice(1);

  const getCategoryIcon = (cat: string) => {
    switch (cat.toLowerCase()) {
      case 'man':
        return 'help';
      case 'machine':
        return 'settings';
      case 'material':
        return 'box';
      case 'measurement':
        return 'activity';
      case 'environment':
        return 'flask';
      case 'method':
      default:
        return 'branch';
    }
  };

  const stagesOrder: RootCauseStatus[] = [
    'hypothesis',
    'under_investigation',
    'evidence_supported',
    'human_confirmed'
  ];
  const currentStageIndex = stagesOrder.indexOf(cause.status);

  return (
    <article
      className={`cause-card ${
        confirmed ? 'confirmed' : rejected ? 'rejected' : ''
      }`}
    >
      <div className="cause-top">
        <span className="cause-id">{cause.id}</span>
        {getStatusBadge()}
        <span className="confidence">
          <span
            className={
              cause.confidence === 'high'
                ? 'confidence-high'
                : 'confidence-medium'
            }
          />
          {cause.confidence ? `${cause.confidence.toUpperCase()} CONFIDENCE` : 'CONFIDENCE'}
        </span>
      </div>

      <button
        type="button"
        className="cause-title"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
      >
        <h3>{cause.statement}</h3>
        <Icon
          name="chevron"
          size={17}
          className={expanded ? 'rotate-up' : 'rotate-down'}
        />
      </button>

      <div className="cause-category">
        <Icon name={getCategoryIcon(cause.category) as any} size={12} />
        {categoryName}
      </div>

      <p className="cause-description">{cause.explanation || cause.statement}</p>

      {expanded && (
        <div className="cause-details animate-in">
          {/* Supporting evidence */}
          {cause.supporting_evidence && cause.supporting_evidence.length > 0 && (
            <div className="evidence-row">
              <span className="evidence-symbol green">
                <Icon name="check-circle" size={14} />
              </span>
              <div>
                <strong>Supporting evidence</strong>
                <p>{cause.supporting_evidence.join('; ')}</p>
              </div>
            </div>
          )}

          {/* Contradicting evidence */}
          {cause.contradicting_evidence && cause.contradicting_evidence.length > 0 && (
            <div className="evidence-row">
              <span className="evidence-symbol slate">
                <Icon name="activity" size={14} />
              </span>
              <div>
                <strong>Contradicting evidence</strong>
                <p>{cause.contradicting_evidence.join('; ')}</p>
              </div>
            </div>
          )}

          {/* Missing evidence */}
          {cause.missing_evidence && cause.missing_evidence.length > 0 && (
            <div className="evidence-row">
              <span className="evidence-symbol amber">
                <Icon name="warning" size={14} />
              </span>
              <div>
                <strong>Missing evidence</strong>
                <p>{cause.missing_evidence.join('; ')}</p>
              </div>
            </div>
          )}

          {/* Verification steps */}
          {cause.verification_steps && cause.verification_steps.length > 0 && (
            <div className="verification">
              <Icon name="search" size={15} />
              <div>
                <strong>How to verify</strong>
                <p>{cause.verification_steps.join('; ')}</p>
              </div>
            </div>
          )}

          {/* Progress Stepper */}
          <div className="cause-progress">
            {[
              { id: 'hypothesis', label: 'Hypothesis' },
              { id: 'under_investigation', label: 'Investigating' },
              { id: 'evidence_supported', label: 'Evidence supported' },
              { id: 'human_confirmed', label: 'Human confirmed' }
            ].map((st, i) => {
              const reached = i <= currentStageIndex;
              return (
                <div
                  key={st.id}
                  className={reached ? `reached ${confirmed ? 'is-confirmed' : ''}` : ''}
                >
                  <span>
                    {i < currentStageIndex || confirmed ? (
                      <Icon name="check" size={9} />
                    ) : (
                      ''
                    )}
                  </span>
                  <small>{st.label}</small>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="cause-footer">
        <span>
          <Icon name={confirmed ? 'check-circle' : 'info'} size={12} />
          {confirmed
            ? 'Confirmed by QA Specialist'
            : rejected
              ? 'Excluded from investigation'
              : 'Requires human confirmation'}
        </span>

        <div>
          {!confirmed && !rejected && (
            <>
              <button
                type="button"
                className="reject-button"
                onClick={handleReject}
              >
                Reject
              </button>
              <Button
                icon="check"
                variant="confirm"
                onClick={handleConfirm}
              >
                Confirm
              </Button>
            </>
          )}

          {(confirmed || rejected) && (
            <button
              type="button"
              className="text-button"
              onClick={handleUndo}
            >
              Undo
            </button>
          )}
        </div>
      </div>
    </article>
  );
};

