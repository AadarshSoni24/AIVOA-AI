import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../app/store';
import { setEmailModalOpen } from '../../features/ui/uiSlice';
import { sendMessage } from '../../features/copilot/copilotSlice';
import { Modal } from '../common/Modal';
import { Button } from '../UI';

export const EmailModal: React.FC = () => {
  const dispatch = useAppDispatch();
  const isOpen = useAppSelector((state) => state.ui.emailModalOpen);
  const isLoading = useAppSelector((state) => state.copilot.status === 'loading');

  const [text, setText] = useState('');

  if (!isOpen) return null;

  const handleClose = () => {
    setText('');
    dispatch(setEmailModalOpen(false));
  };

  const handleShare = () => {
    const trimmed = text.trim();
    if (trimmed && !isLoading) {
      dispatch(sendMessage({ message: trimmed, inputType: 'email' }));
      handleClose();
    }
  };

  return (
    <Modal
      title="Start with an email or incident"
      icon="mail"
      onClose={handleClose}
      footer={
        <>
          <Button onClick={handleClose}>Cancel</Button>
          <Button
            variant="primary"
            icon="send"
            disabled={!text.trim() || isLoading}
            onClick={handleShare}
          >
            Share with Copilot
          </Button>
        </>
      }
    >
      <p>
        Paste the deviation email, OOS notification, or shift log below. Copilot will extract product parameters, assess impact, and structure the investigation form.
      </p>

      <textarea
        className="paste-textarea"
        aria-label="Incident or email content"
        placeholder="Paste deviation notice email, assay results, or describe the quality issue..."
        value={text}
        rows={8}
        onChange={(e) => setText(e.target.value)}
      />
    </Modal>
  );
};

