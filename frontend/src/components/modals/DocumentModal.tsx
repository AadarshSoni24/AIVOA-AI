import React from 'react';
import { useAppDispatch, useAppSelector } from '../../app/store';
import { setDocumentModal } from '../../features/ui/uiSlice';
import { Modal } from '../common/Modal';
import { Badge, Button } from '../UI';

export const DocumentModal: React.FC = () => {
  const dispatch = useAppDispatch();
  const documentName = useAppSelector((state) => state.ui.documentModal);
  const investigation = useAppSelector((state) => state.investigation?.current);

  if (!documentName) return null;

  const handleClose = () => dispatch(setDocumentModal(null));

  const productName = investigation?.product?.name || 'Metformin Hydrochloride API';
  const batchNumber = investigation?.product?.batch_number || 'MFH260712A';
  const assayResult = investigation?.impact?.actual_condition || '97.2% (Spec. 98.0–102.0%)';

  return (
    <Modal
      title={documentName.replace(/_/g, ' ')}
      icon="file"
      onClose={handleClose}
      footer={
        <Button variant="primary" onClick={handleClose}>
          Done
        </Button>
      }
    >
      <Badge tone="blue" icon="file">
        Source Document Record
      </Badge>

      <div className="document-preview">
        <span>AIVOA · QUALITY ASSURANCE &amp; ANALYTICAL SERVICES</span>
        <h3>
          {documentName.includes('SOP')
            ? 'Standard Operating Procedure'
            : documentName.includes('Batch') || documentName.includes('BMR')
              ? 'Batch Manufacturing Record'
              : 'Analytical QC Release Certificate'}
        </h3>

        <dl>
          <div>
            <dt>Product</dt>
            <dd>{productName}</dd>
          </div>
          <div>
            <dt>Batch No.</dt>
            <dd>{batchNumber}</dd>
          </div>
          <div>
            <dt>Assay Result</dt>
            <dd>{assayResult}</dd>
          </div>
          <div>
            <dt>Disposition</dt>
            <dd>Quarantine Hold · Investigation Active</dd>
          </div>
        </dl>

        <p>
          Analytical data verified by QC Release Analyst. All instrument parameters, column performance, and system suitability were evaluated in the investigation.
        </p>
      </div>

      <p className="small-note">
        Structured document metadata captured for audit trail and regulatory submission traceability.
      </p>
    </Modal>
  );
};

