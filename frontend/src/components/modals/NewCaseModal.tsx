import React from 'react';
import { useAppDispatch, useAppSelector } from '../../app/store';
import { setNewModalOpen, setActiveStage, showToast } from '../../features/ui/uiSlice';
import { resetInvestigation } from '../../features/investigation/investigationSlice';
import { resetCopilot } from '../../features/copilot/copilotSlice';
import { Modal } from '../common/Modal';
import { Button } from '../UI';

export const NewCaseModal: React.FC = () => {
  const dispatch = useAppDispatch();
  const isOpen = useAppSelector((state) => state.ui.newModalOpen);

  if (!isOpen) return null;

  const handleClose = () => dispatch(setNewModalOpen(false));

  const handleStartNew = () => {
    dispatch(resetInvestigation());
    dispatch(resetCopilot());
    dispatch(setActiveStage('Incident'));
    handleClose();
    dispatch(
      showToast({
        text: 'New RCA workspace initialized. Ready for deviation intake.',
        error: false
      })
    );
  };

  return (
    <Modal
      title="Start a new investigation?"
      icon="plus"
      onClose={handleClose}
      footer={
        <>
          <Button onClick={handleClose}>Keep working</Button>
          <Button variant="primary" onClick={handleStartNew}>
            Start new investigation
          </Button>
        </>
      }
    >
      <p>
        This will reset the current investigation form, root cause hypotheses, and copilot conversation. Make sure to save your current case if you wish to retain it.
      </p>
    </Modal>
  );
};

