import React from 'react';
import { useAppDispatch, useAppSelector } from '../../app/store';
import { setActiveRcaTab, RcaTab } from '../ui/uiSlice';
import { runAction } from '../copilot/copilotSlice';
import { CauseCard } from './CauseCard';
import { FiveWhys } from './FiveWhys';
import { Fishbone } from './Fishbone';
import { EvidenceChecklist } from '../investigation/EvidenceStage';
import { Icon, IconName } from '../../components/Icon';
import { Button } from '../../components/UI';

export const RcaStage: React.FC = () => {
  const dispatch = useAppDispatch();
  const activeTab = useAppSelector((state) => state.ui?.activeRcaTab || 'Hypotheses');
  const rootCauses = useAppSelector((state) => state.investigation?.current?.root_causes || []);
  const investigationStatus = useAppSelector((state) => state.investigation?.current?.status || 'draft');
  const isLoading = useAppSelector((state) => state.copilot?.status === 'loading');

  const tabs: { name: RcaTab; icon: IconName; count?: string }[] = [
    {
      name: 'Hypotheses',
      icon: 'target',
      count: rootCauses.length > 0 ? String(rootCauses.length) : undefined
    },
    { name: '5 Whys', icon: 'branch' },
    { name: 'Fishbone', icon: 'network' }
  ];

  return (
    <>
      <div className="analysis-tabs" role="tablist" aria-label="Analysis view">
        {tabs.map((t) => (
          <button
            key={t.name}
            type="button"
            role="tab"
            aria-selected={activeTab === t.name}
            onClick={() => dispatch(setActiveRcaTab(t.name))}
            className={activeTab === t.name ? 'selected' : ''}
          >
            <Icon name={t.icon} size={15} />
            {t.name}
            {t.count && <span>{t.count}</span>}
          </button>
        ))}

        <div className="tabs-end">
          <span className="saved-dot" />
          {investigationStatus === 'saved' ? 'Saved' : 'Changes not saved'}
        </div>
      </div>

      {activeTab === 'Hypotheses' && (
        <div className="analysis-grid animate-in">
          <div className="causes-list">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '11px', color: '#666' }}>
                {rootCauses.length} Root Cause Hypotheses Identified
              </span>
              <Button
                variant="secondary"
                icon="refresh"
                disabled={isLoading}
                onClick={() => dispatch(runAction('rca'))}
              >
                Re-run root cause analysis
              </Button>
            </div>

            {rootCauses.length === 0 ? (
              <div className="card" style={{ padding: '36px', textAlign: 'center', color: '#777' }}>
                <Icon name="network" size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                <h3>No root cause hypotheses generated yet</h3>
                <p style={{ fontSize: '12px', marginTop: '6px' }}>
                  Ask Copilot to &quot;Suggest root causes&quot; or click the button above to run analysis.
                </p>
              </div>
            ) : (
              rootCauses.map((cause, i) => (
                <CauseCard key={cause.id} cause={cause} index={i} />
              ))
            )}
          </div>

          <div className="analysis-side">
            <EvidenceChecklist />

            <section className="card causal-preview">
              <div className="heading-group">
                <Icon name="branch" size={17} />
                <h3>Go a little deeper</h3>
              </div>
              <p>
                Trace the primary hypothesis through five progressive layers of analytical rationale.
              </p>
              <button
                type="button"
                onClick={() => dispatch(setActiveRcaTab('5 Whys'))}
              >
                Explore 5 Whys analysis
                <Icon name="arrow" size={14} />
              </button>
            </section>

            <div className="human-note">
              <Icon name="shield" size={17} />
              <div>
                <strong>Your judgment comes first</strong>
                <p>
                  AI hypotheses are starting points. Confirm only when physical batch records and repeat analytical testing substantiate the conclusion.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === '5 Whys' && (
        <div className="analysis-grid animate-in">
          <FiveWhys />
          <div className="analysis-side">
            <EvidenceChecklist />
            <div className="human-note">
              <Icon name="info" size={17} />
              <div>
                <strong>Regulatory Traceability</strong>
                <p>
                  Each why step correlates observable symptoms directly with underlying systemic mechanisms in compliance with ICH Q10 quality guidelines.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'Fishbone' && (
        <div className="animate-in">
          <Fishbone />
          <div className="fishbone-bottom">
            <div className="human-note">
              <Icon name="info" size={17} />
              <div>
                <strong>Broaden the investigation, then narrow the focus</strong>
                <p>
                  Reviewing all six Ishikawa branches prevents premature closure before equipment calibration, analyst technique, and material lots are systematically evaluated.
                </p>
              </div>
            </div>
            <Button
              icon="target"
              onClick={() => dispatch(setActiveRcaTab('Hypotheses'))}
            >
              Review hypotheses
            </Button>
          </div>
        </div>
      )}
    </>
  );
};

