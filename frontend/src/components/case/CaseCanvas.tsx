import React from 'react';
import { useAppDispatch, useAppSelector } from '../../app/store';
import { AppStage, setActiveStage } from '../../features/ui/uiSlice';
import { sendMessage } from '../../features/copilot/copilotSlice';
import { CaseHeader } from './CaseHeader';
import { RiskSnapshot } from './RiskSnapshot';
import { IncidentStage } from '../../features/investigation/IncidentStage';
import { ProductStage } from '../../features/investigation/ProductStage';
import { ImpactStage } from '../../features/investigation/ImpactStage';
import { EvidenceStage } from '../../features/investigation/EvidenceStage';
import { RcaStage } from '../../features/rca/RcaStage';
import { CapaStage } from '../../features/capa/CapaStage';
import { selectHasContent } from '../../features/investigation/selectors';
import { Icon, IconName } from '../Icon';
import { Badge, Button, CopilotMark } from '../UI';

const STAGE_ORDER: AppStage[] = [
  'Incident',
  'Product & Batch',
  'Impact',
  'Evidence',
  'Root Cause Analysis',
  'CAPA'
];

export const LoadingCanvas: React.FC = () => {
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
          <p>Copilot is building your investigation.</p>
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
  );
};

export const EmptyCanvas: React.FC = () => {
  const dispatch = useAppDispatch();
  const isLoading = useAppSelector((state) => state.copilot.status === 'loading');

  const handleExploreSample = () => {
    dispatch(
      sendMessage({
        message:
          'Investigate the OOS assay for Metformin HCl API batch MFH260712A, assay 97.2% versus 98.0–102.0%.'
      })
    );
  };

  return (
    <div className="empty-canvas animate-in">
      <span className="empty-overline">YOUR AI-ASSISTED INVESTIGATION WORKSPACE</span>
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
          <Icon name="network" size={21} />
        </span>
      </div>

      <h1>
        Every answer starts
        <br />
        with the right question.
      </h1>

      <p>
        Bring the incident. We’ll help connect the evidence,
        <br className="desktop-break" /> uncover possible causes, and find a path forward.
      </p>

      <Button
        variant="primary"
        icon="arrow"
        disabled={isLoading}
        onClick={handleExploreSample}
      >
        Explore an example investigation
      </Button>

      <span className="empty-or">or share an incident with your copilot</span>

      <div className="empty-features">
        {[
          {
            icon: 'file' as IconName,
            title: 'Start with your evidence',
            text: 'Paste an incident or attach a PDF.'
          },
          {
            icon: 'network' as IconName,
            title: 'Connect the dots',
            text: 'Explore AI-assisted hypotheses.'
          },
          {
            icon: 'shield' as IconName,
            title: 'Stay in control',
            text: 'Review and confirm every finding.'
          }
        ].map((f) => (
          <div key={f.title}>
            <Icon name={f.icon} size={20} />
            <h3>{f.title}</h3>
            <p>{f.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export const CaseCanvas: React.FC = () => {
  const dispatch = useAppDispatch();
  const currentInv = useAppSelector((state) => state.investigation?.current);
  const activeStage = useAppSelector((state) => state.ui?.activeStage || 'Incident');
  const copilotStatus = useAppSelector((state) => state.copilot?.status);
  const rootCauses = currentInv?.root_causes || [];
  const capaList = currentInv?.capa || [];

  const isLoading = copilotStatus === 'loading';
  const hasContent = useAppSelector(selectHasContent);
  const isEmpty = !hasContent;

  const currentStageIndex = STAGE_ORDER.indexOf(activeStage);
  const nextStage =
    currentStageIndex >= 0 && currentStageIndex < STAGE_ORDER.length - 1
      ? STAGE_ORDER[currentStageIndex + 1]
      : STAGE_ORDER[0];

  const handleNextStage = () => {
    dispatch(setActiveStage(nextStage));
  };

  const getStageSubtitle = (st: AppStage) => {
    switch (st) {
      case 'Root Cause Analysis':
        return 'Explore the possibilities. Follow the analytical evidence.';
      case 'CAPA':
        return 'Turn investigation insights into meaningful corrective and preventive actions.';
      case 'Evidence':
        return 'Build a complete, verifiable, and traceable analytical evidence trail.';
      case 'Impact':
        return 'Assess product quality, clinical safety, and batch quarantine parameters.';
      case 'Product & Batch':
        return 'Confirm manufacturing details, material identifiers, and equipment history.';
      case 'Incident':
      default:
        return 'Your copilot captured the details. Review and confirm findings.';
    }
  };

  const getStageBadge = () => {
    if (activeStage === 'Root Cause Analysis') {
      return (
        <Badge tone="purple" icon="network">
          {rootCauses.length} AI hypotheses
        </Badge>
      );
    }
    if (activeStage === 'CAPA') {
      const proposedCount = capaList.filter((c) => c.status === 'proposed').length;
      return (
        <Badge tone="purple" icon="target">
          {proposedCount} proposed actions
        </Badge>
      );
    }
    return (
      <Badge tone="blue" icon="check">
        AI populated
      </Badge>
    );
  };

  return (
    <main className="case-canvas">
      {/* Breadcrumb */}
      <div className="canvas-breadcrumb">
        <span>Investigations</span>
        <Icon name="chevron" size={11} />
        <span>{currentInv?.investigation_no || 'New investigation'}</span>
        <span className="canvas-secure">
          <Icon name="shield" size={12} />
          Private workspace
        </span>
      </div>

      {isEmpty && isLoading ? (
        <LoadingCanvas />
      ) : isEmpty ? (
        <EmptyCanvas />
      ) : (
        <>
          <CaseHeader />

          <RiskSnapshot />

          <div className="stage-heading">
            <div>
              <span className="stage-eyebrow">
                STEP {String(currentStageIndex + 1).padStart(2, '0')} OF 06
              </span>
              <h2>{activeStage}</h2>
              <p>{getStageSubtitle(activeStage)}</p>
            </div>
            <div className="stage-heading-right">{getStageBadge()}</div>
          </div>

          {isLoading && (
            <div className="processing-banner" role="status">
              <Icon name="network" size={15} />
              <span>Copilot is working on your investigation…</span>
              <span className="loading-line" />
            </div>
          )}

          {activeStage === 'Incident' && <IncidentStage />}
          {activeStage === 'Product & Batch' && <ProductStage />}
          {activeStage === 'Impact' && <ImpactStage />}
          {activeStage === 'Evidence' && <EvidenceStage />}
          {activeStage === 'Root Cause Analysis' && <RcaStage />}
          {activeStage === 'CAPA' && <CapaStage />}

          {/* Canvas Footer */}
          <div className="canvas-footer">
            <span>
              <Icon name="shield" size={12} />
              AI-assisted. Human-led. Evidence-driven.
            </span>
            <button type="button" onClick={handleNextStage}>
              {activeStage === 'CAPA'
                ? 'Back to incident'
                : `Continue to ${nextStage}`}
              <Icon name="arrow" size={14} />
            </button>
          </div>
        </>
      )}
    </main>
  );
};

