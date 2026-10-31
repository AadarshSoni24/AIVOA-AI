import React, { useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../../app/store';
import { setUploadModalOpen, showToast } from '../../features/ui/uiSlice';
import { uploadDocument } from '../../features/copilot/copilotSlice';
import { Modal } from '../common/Modal';
import { Icon } from '../Icon';

export const UploadModal: React.FC = () => {
  const dispatch = useAppDispatch();
  const isOpen = useAppSelector((state) => state.ui.uploadModalOpen);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleClose = () => dispatch(setUploadModalOpen(false));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      dispatch(showToast({ text: 'Please select a valid PDF document.', error: true }));
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      dispatch(showToast({ text: 'File exceeds 10 MB limit. Please select a smaller PDF.', error: true }));
      return;
    }

    handleClose();
    dispatch(uploadDocument({ file }));
  };

  return (
    <Modal
      title="Add a source document"
      icon="upload"
      onClose={handleClose}
    >
      <p>
        Select an analytical QC report, batch manufacturing record (BMR), or equipment calibration certificate. Copilot will extract parameters and populate the case file.
      </p>

      <label className="modal-upload">
        <Icon name="upload" size={27} />
        <strong>Choose a PDF document</strong>
        <span>PDF files up to 10 MB</span>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
      </label>
    </Modal>
  );
};

