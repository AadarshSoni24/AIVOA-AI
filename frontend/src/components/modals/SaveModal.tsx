import React from 'react';
import { useAppDispatch, useAppSelector } from '../../app/store';
import { setSaveModalOpen } from '../../features/ui/uiSlice';
import {
  selectUnconfirmedRootCauses,
  selectProposedCapa
} from '../../features/investigation/selectors';
import { saveInvestigation } from '../../features/history/historySlice';
import { Modal } from '../common/Modal';
import { Button } from '../UI';
import { Icon } from '../Icon';

export const SaveModal: React.FC = () => {
  const dispatch = useAppDispatch();
  const isOpen = useAppSelector((state) => state.ui.saveModalOpen);
  const unconfirmedRootCauses = useAppSelector(selectUnconfirmedRootCauses);
  const proposedCapa = useAppSelector(selectProposedCapa);
  const isSaving = useAppSelector((state) => state.history.status === 'loading');

  if (!isOpen) return null;

  const handleClose = () => dispatch(setSaveModalOpen(false));

  const handleSave = async () => {
    handleClose();
    await dispatch(saveInvestigation());
  };

  const hasUnreviewedItems = unconfirmedRootCauses > 0 || proposedCapa > 0;

  return (
    <Modal
      title="Save this investigation?"
      icon="download"
      onClose={handleClose}
      footer={
        <>
          <Button onClick={handleClose}>Cancel</Button>
          <Button
            variant="primary"
            icon="check"
            disabled={isSaving}
            onClick={handleSave}
          >
            {hasUnreviewedItems ? 'Save anyway' : 'Save investigation'}
          </Button>
        </>
      }
    >
      <p>
        Your investigation includes AI-generated content that hasn’t been fully reviewed by a qualified person.
      </p>

      <div className="save-summary">
        <div>
          <span className="summary-icon purple">
            <Icon name="network" size={18} />
          </span>
          <span>
            Unconfirmed AI hypotheses
            <small>Require human review and analytical verification</small>
          </span>
          <strong>{unconfirmedRootCauses}</strong>
        </div>

        <div>
          <span className="summary-icon amber">
            <Icon name="target" size={18} />
          </span>
          <span>
            Proposed CAPA actions
            <small>Pending QA approval and owner acceptance</small>
          </span>
          <strong>{proposedCapa}</strong>
        </div>
      </div>

      <div className="modal-warning">
        <Icon name="info" size={16} />
        <span>
          Saving stores this investigation record to the database. It does not authorize commercial batch release until formal sign-off.
        </span>
      </div>
    </Modal>
  );
};
