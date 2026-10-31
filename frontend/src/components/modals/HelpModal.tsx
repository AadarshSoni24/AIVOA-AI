import React from 'react';
import { useAppDispatch, useAppSelector } from '../../app/store';
import { setHelpModalOpen } from '../../features/ui/uiSlice';
import { Modal } from '../common/Modal';
import { Button } from '../UI';
import { Icon } from '../Icon';

export const HelpModal: React.FC = () => {
  const dispatch = useAppDispatch();
  const isOpen = useAppSelector((state) => state.ui.helpModalOpen);

  if (!isOpen) return null;

  const handleClose = () => dispatch(setHelpModalOpen(false));

  return (
    <Modal
      title="Root Cause Analysis (RCA) Quality Workflow"
      icon="help"
      onClose={handleClose}
      footer={
        <Button variant="primary" onClick={handleClose}>
          Got it
        </Button>
      }
    >
      <div className="help-steps">
        <p>
          <strong>1. Intake Deviation Evidence:</strong> Paste incident details, forward an email, or attach an analytical QC PDF report directly in the Copilot.
        </p>
        <p>
          <strong>2. Review AI-Populated Fields:</strong> Copilot automatically extracts batch parameters, assesses quality impact, and populates form fields with audit provenance. Click the pencil icon on any field to adjust.
        </p>
        <p>
          <strong>3. Root Cause Analysis:</strong> Evaluate hypotheses across Ishikawa (6M) categories or drill down through 5 Whys causal paths. Qualified persons must review and confirm or reject findings.
        </p>
        <p>
          <strong>4. Formulate CAPA &amp; Save:</strong> Review corrective and preventive actions, assign responsible departments and target verification dates, then save the case to the regulatory database.
        </p>
      </div>

      <div className="modal-warning">
        <Icon name="shield" size={17} />
        <span>
          GxP Compliance Note: AI-generated suggestions are decision-support hypotheses and do not substitute for formal QA oversight or authorized batch disposition.
        </span>
      </div>
    </Modal>
  );
};

