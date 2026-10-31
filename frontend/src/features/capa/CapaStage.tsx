import React from 'react';
import { useAppDispatch, useAppSelector } from '../../app/store';
import { runAction } from '../copilot/copilotSlice';
import { CapaCard } from './CapaCard';
import { Icon } from '../../components/Icon';
import { Button } from '../../components/UI';

export const CapaStage: React.FC = () => {
  const dispatch = useAppDispatch();
  const capaList = useAppSelector((state) => state.investigation?.current?.capa || []);
  const isLoading = useAppSelector((state) => state.copilot?.status === 'loading');

  const corrective = capaList.filter((c) => c.type === 'corrective');
  const preventive = capaList.filter((c) => c.type === 'preventive');

  return (
    <div className="capa-view animate-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <div className="capa-notice" style={{ margin: 0, flex: 1, marginRight: '16px' }}>
          <Icon name="info" size={15} />
          <p>
            Actions are preliminary. Confirm root causes and review the proposed execution timeline before CAPA approval.
          </p>
        </div>

        <Button
          variant="primary"
          icon="target"
          disabled={isLoading}
          onClick={() => dispatch(runAction('capa'))}
        >
          Generate CAPA
        </Button>
      </div>

      <div className="capa-columns">
        {/* Corrective Actions */}
        <div>
          <div className="capa-column-heading">
            <span className="corrective-icon">
              <Icon name="target" size={16} />
            </span>
            <h3>Corrective actions</h3>
            <span className="count-pill">{corrective.length}</span>
          </div>

          {corrective.length === 0 ? (
            <div className="card" style={{ padding: '24px', textAlign: 'center', color: '#888' }}>
              No corrective actions proposed yet. Click &quot;Generate CAPA&quot; to formulate remediation.
            </div>
          ) : (
            corrective.map((c) => <CapaCard key={c.id} capa={c} />)
          )}
        </div>

        {/* Preventive Actions */}
        <div>
          <div className="capa-column-heading">
            <span className="preventive-icon">
              <Icon name="shield" size={16} />
            </span>
            <h3>Preventive actions</h3>
            <span className="count-pill">{preventive.length}</span>
          </div>

          {preventive.length === 0 ? (
            <div className="card" style={{ padding: '24px', textAlign: 'center', color: '#888' }}>
              No preventive actions proposed yet. Click &quot;Generate CAPA&quot; to prevent recurrence.
            </div>
          ) : (
            preventive.map((c) => <CapaCard key={c.id} capa={c} />)
          )}
        </div>
      </div>
    </div>
  );
};

