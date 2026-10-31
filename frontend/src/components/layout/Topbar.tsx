import React from 'react';
import { useAppDispatch, useAppSelector } from '../../app/store';
import { setView, setSaveModalOpen, setNewModalOpen } from '../../features/ui/uiSlice';
import { selectDerivedStatusPill, selectHasContent } from '../../features/investigation/selectors';
import { fetchHistory } from '../../features/history/historySlice';
import { Icon } from '../Icon';
import { Badge, Button } from '../UI';

export const Topbar: React.FC = () => {
  const dispatch = useAppDispatch();
  const investigation = useAppSelector((state) => state.investigation?.current);
  const copilotStatus = useAppSelector((state) => state.copilot?.status);
  const currentView = useAppSelector((state) => state.ui?.view);
  const statusPill = useAppSelector(selectDerivedStatusPill);

  const isLoading = copilotStatus === 'loading';
  const hasContent = useAppSelector(selectHasContent);
  const isDraft = !hasContent;

  const handleSavedInvestigationsClick = () => {
    if (currentView === 'history') {
      dispatch(setView('workspace'));
    } else {
      dispatch(fetchHistory());
      dispatch(setView('history'));
    }
  };

  return (
    <header className="topbar">
      <a
        className="brand"
        href="#"
        onClick={(e) => {
          e.preventDefault();
          dispatch(setView('workspace'));
        }}
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
        <span>{investigation?.investigation_no || 'New investigation'}</span>
        <Badge tone={statusPill?.tone || 'slate'}>
          <span className={`status-dot ${isLoading ? 'processing' : ''}`} />
          {statusPill?.label || 'Draft'}
        </Badge>
      </div>

      <div className="topbar-actions">
        <span className="prototype-label">
          <Icon name="shield" size={12} />
          Prototype, not a validated GxP system
        </span>

        <button
          type="button"
          className="text-button"
          onClick={handleSavedInvestigationsClick}
          style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
        >
          <Icon name="file" size={13} />
          {currentView === 'history' ? 'Back to Workspace' : 'Saved Investigations'}
        </button>

        <button
          type="button"
          className="text-button"
          onClick={() => dispatch(setNewModalOpen(true))}
          style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
        >
          <Icon name="plus" size={13} />
          New RCA
        </button>

        <Button
          variant="primary"
          icon="download"
          disabled={isDraft || isLoading}
          onClick={() => dispatch(setSaveModalOpen(true))}
        >
          Save Investigation
        </Button>

        <span className="top-avatar" title="Quality Assurance Specialist">
          QA
        </span>
      </div>
    </header>
  );
};

