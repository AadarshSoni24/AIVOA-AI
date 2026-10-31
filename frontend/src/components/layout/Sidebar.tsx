import React from 'react';
import { useAppDispatch, useAppSelector } from '../../app/store';
import { AppStage, setActiveStage, setNewModalOpen, setHelpModalOpen, setDocumentModal, setUploadModalOpen } from '../../features/ui/uiSlice';
import { selectStageStatuses } from '../../features/investigation/selectors';
import { Icon, IconName } from '../Icon';

interface StageDefinition {
  name: AppStage;
  icon: IconName;
  detail: string;
}

const STAGES: StageDefinition[] = [
  { name: 'Incident', icon: 'activity', detail: 'Incident details' },
  { name: 'Product & Batch', icon: 'box', detail: 'Product identified' },
  { name: 'Impact', icon: 'shield', detail: 'Risk assessed' },
  { name: 'Evidence', icon: 'file', detail: 'Evidence trail' },
  { name: 'Root Cause Analysis', icon: 'network', detail: 'Hypotheses generated' },
  { name: 'CAPA', icon: 'target', detail: 'Proposed actions' }
];

export const Sidebar: React.FC = () => {
  const dispatch = useAppDispatch();
  const activeStage = useAppSelector((state) => state.ui?.activeStage || 'Incident');
  const stageStatuses = useAppSelector(selectStageStatuses);
  const documents = useAppSelector((state) => state.investigation?.current?.documents || []);

  const handleStageClick = (stageName: AppStage) => {
    dispatch(setActiveStage(stageName));
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'PDF document';
    if (bytes < 1024 * 1024) return `PDF · ${(bytes / 1024).toFixed(0)} KB`;
    return `PDF · ${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <aside className="sidebar">
      {/* Workspace Brand / Header */}
      <div className="workspace-label">
        <span className="workspace-icon">
          <Icon name="flask" size={17} />
        </span>
        <div>
          Quality workspace<small>API Manufacturing</small>
        </div>
      </div>

      <div className="sidebar-section-label">
        INVESTIGATION <span>01</span>
      </div>

      {/* Stepper Stages */}
      <nav className="stage-list" aria-label="Investigation stages">
        {STAGES.map((s) => {
          const status = stageStatuses[s.name] || { isComplete: false, hasItems: false };
          const isActive = activeStage === s.name;

          return (
            <button
              key={s.name}
              type="button"
              onClick={() => handleStageClick(s.name)}
              className={`stage-button ${isActive ? 'active' : ''}`}
            >
              <span
                className={`stage-ring ${status.isComplete ? 'complete' : ''} ${
                  isActive ? 'current' : ''
                }`}
              >
                {status.isComplete ? (
                  <Icon name="check" size={12} />
                ) : (
                  <Icon name={s.icon} size={15} />
                )}
              </span>

              <span className="stage-name">
                {s.name}
                {isActive && <small>In progress</small>}
              </span>

              {status.countLabel && (
                <span className="stage-fraction">{status.countLabel}</span>
              )}

              {isActive && <span className="active-dot" />}
            </button>
          );
        })}
      </nav>

      <div className="sidebar-divider" />

      {/* Source Documents */}
      <div className="sidebar-section-label">
        SOURCE DOCUMENTS{' '}
        <button
          type="button"
          aria-label="Add source document"
          title="Add source document"
          onClick={() => dispatch(setUploadModalOpen(true))}
        >
          <Icon name="plus" size={15} />
        </button>
      </div>

      {documents.length > 0 ? (
        <div className="source-files">
          {documents.map((doc, idx) => (
            <button
              key={doc.id || idx}
              type="button"
              onClick={() => dispatch(setDocumentModal(doc.filename))}
              className="source-file"
            >
              <span className="file-type">
                <Icon name="file" size={16} />
              </span>
              <span>
                {doc.filename}
                <small>{formatFileSize(doc.size)}</small>
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

      {/* Bottom Actions and Quality Assurance Identity */}
      <div className="sidebar-bottom">
        <div className="ai-assistance">
          <span className="tiny-spark">
            <Icon name="shield" size={15} />
          </span>
          <strong>AI assists. You decide.</strong>
          <p>Every conclusion stays under your review and control.</p>
        </div>

        <button
          type="button"
          className="sidebar-utility"
          onClick={() => dispatch(setNewModalOpen(true))}
        >
          <Icon name="plus" size={16} />
          New investigation
        </button>

        <button
          type="button"
          className="sidebar-utility"
          onClick={() => dispatch(setHelpModalOpen(true))}
        >
          <Icon name="help" size={16} />
          Help & documentation
          <Icon name="external" size={12} />
        </button>

        {/* Clean, generic QA profile without hardcoded sample person */}
        <div className="profile">
          <span className="avatar">QA</span>
          <div>
            Quality Assurance<small>API Manufacturing Site</small>
          </div>
          <span className="profile-status" />
        </div>
      </div>
    </aside>
  );
};

