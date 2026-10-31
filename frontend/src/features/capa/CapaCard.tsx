import React from 'react';
import { useAppDispatch } from '../../app/store';
import { setCapaStatus } from '../investigation/investigationSlice';
import { showToast } from '../ui/uiSlice';
import { InvestigationCapa } from '../investigation/types';
import { Badge, Button } from '../../components/UI';
import { Icon } from '../../components/Icon';

interface CapaCardProps {
  capa: InvestigationCapa;
}

export const CapaCard: React.FC<CapaCardProps> = ({ capa }) => {
  const dispatch = useAppDispatch();

  const isAccepted = capa.status === 'accepted';
  const isRejected = capa.status === 'rejected';

  const handleAccept = () => {
    dispatch(setCapaStatus({ id: capa.id, status: 'accepted' }));
    dispatch(
      showToast({
        text: `${capa.id} accepted for implementation.`,
        error: false
      })
    );
  };

  const handleReject = () => {
    dispatch(setCapaStatus({ id: capa.id, status: 'rejected' }));
    dispatch(
      showToast({
        text: `${capa.id} rejected from CAPA plan.`,
        error: false
      })
    );
  };

  const handleUndo = () => {
    dispatch(setCapaStatus({ id: capa.id, status: 'proposed' }));
    dispatch(
      showToast({
        text: `${capa.id} reset to proposed status.`,
        error: false
      })
    );
  };

  const statusLabel =
    isAccepted ? 'Accepted' : isRejected ? 'Rejected' : 'Proposed';

  return (
    <article
      className={`card capa-card ${isAccepted ? 'accepted' : isRejected ? 'rejected' : ''}`}
    >
      <div className="capa-card-top">
        <span className="cause-id">{capa.id}</span>
        <Badge
          tone={isAccepted ? 'green' : isRejected ? 'slate' : 'purple'}
          icon={isAccepted ? 'check' : 'target'}
        >
          {statusLabel}
        </Badge>
      </div>

      <h3>{capa.description}</h3>
      {capa.rationale && <p>{capa.rationale}</p>}

      {capa.root_cause_id && (
        <span className="root-link">
          <Icon name="network" size={12} />
          Linked to {capa.root_cause_id}
        </span>
      )}

      <div className="capa-fields">
        <div>
          <span>RESPONSIBLE DEPARTMENT</span>
          <strong>{capa.department || 'Quality Assurance'}</strong>
        </div>

        <div>
          <span>PRIORITY</span>
          <Badge tone={capa.priority?.toLowerCase() === 'high' ? 'amber' : 'blue'}>
            {capa.priority ? capa.priority.toUpperCase() : 'MEDIUM'}
          </Badge>
        </div>

        <div>
          <span>TARGET DATE</span>
          <strong>
            <Icon name="clock" size={12} />
            {capa.target_date || '30 Days'}
          </strong>
        </div>
      </div>

      {capa.effectiveness_check && (
        <div className="effectiveness">
          <Icon name="target" size={15} />
          <div>
            <strong>Effectiveness check</strong>
            <p>{capa.effectiveness_check}</p>
          </div>
        </div>
      )}

      <div className="capa-actions">
        {capa.status === 'proposed' ? (
          <>
            <button
              type="button"
              className="reject-button"
              onClick={handleReject}
            >
              Reject
            </button>
            <Button
              variant="confirm"
              icon="check"
              onClick={handleAccept}
            >
              Accept action
            </Button>
          </>
        ) : (
          <>
            <span className="reviewed-by">Reviewed by QA Specialist</span>
            <button
              type="button"
              className="text-button"
              onClick={handleUndo}
            >
              Undo
            </button>
          </>
        )}
      </div>
    </article>
  );
};

