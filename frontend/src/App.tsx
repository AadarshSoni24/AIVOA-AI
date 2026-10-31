import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from './app/store';
import { hideToast } from './features/ui/uiSlice';
import { clearHighlights } from './features/copilot/copilotSlice';
import { Topbar } from './components/layout/Topbar';
import { Sidebar } from './components/layout/Sidebar';
import { CaseCanvas } from './components/case/CaseCanvas';
import { CopilotPanel } from './features/copilot/CopilotPanel';
import { HistoryView } from './features/history/HistoryView';
import { SaveModal } from './components/modals/SaveModal';
import { EmailModal } from './components/modals/EmailModal';
import { NewCaseModal } from './components/modals/NewCaseModal';
import { UploadModal } from './components/modals/UploadModal';
import { DocumentModal } from './components/modals/DocumentModal';
import { HelpModal } from './components/modals/HelpModal';
import { Icon } from './components/Icon';

export const App: React.FC = () => {
  const dispatch = useAppDispatch();
  const view = useAppSelector((state) => state.ui.view);
  const collapsed = useAppSelector((state) => state.ui.copilotCollapsed);
  const toast = useAppSelector((state) => state.ui.toast);
  const highlightedPaths = useAppSelector((state) => state.copilot.highlightedPaths);

  // Auto-clear highlights after 4 seconds so future edit animations replay cleanly
  useEffect(() => {
    if (highlightedPaths.length > 0) {
      const t = setTimeout(() => {
        dispatch(clearHighlights());
      }, 4000);
      return () => clearTimeout(t);
    }
  }, [highlightedPaths, dispatch]);

  // Auto-dismiss toast after 4.5 seconds
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => {
        dispatch(hideToast());
      }, 4500);
      return () => clearTimeout(t);
    }
  }, [toast, dispatch]);

  return (
    <div className={`app-shell ${collapsed ? 'copilot-is-collapsed' : ''}`}>
      <Topbar />

      {view === 'history' ? (
        <HistoryView />
      ) : (
        <>
          <Sidebar />
          <CaseCanvas />
          <CopilotPanel />
        </>
      )}

      {/* Global Modals */}
      <SaveModal />
      <EmailModal />
      <NewCaseModal />
      <UploadModal />
      <DocumentModal />
      <HelpModal />

      {/* Global Toast Notification */}
      {toast && (
        <div
          role={toast.error ? 'alert' : 'status'}
          className={`toast ${toast.error ? 'toast-error' : ''}`}
        >
          <Icon name={toast.error ? 'warning' : 'check-circle'} size={18} />
          <span>{toast.text}</span>
          <button
            type="button"
            aria-label="Dismiss notification"
            onClick={() => dispatch(hideToast())}
          >
            <Icon name="close" size={14} />
          </button>
        </div>
      )}
    </div>
  );
};

export default App;
