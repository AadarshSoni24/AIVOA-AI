import React from 'react';
import { useAppSelector } from '../../app/store';
import { Icon } from '../Icon';
import { Badge } from '../UI';

export const CaseHeader: React.FC = () => {
  const investigation = useAppSelector((state) => state.investigation?.current);

  const title = investigation?.incident?.title;
  const invNo = investigation?.investigation_no || 'RCA-2026-0001';
  const severity = investigation?.risk?.severity || 'Major';
  const batchOnHold =
    investigation?.risk?.containment_required ||
    investigation?.impact?.containment_actions?.toLowerCase().includes('hold');

  const productName = investigation?.product?.name;
  const batchNumber = investigation?.product?.batch_number;
  const facility = investigation?.incident?.facility;
  const mfgDate = investigation?.product?.manufacturing_date;
  const actualCond = investigation?.impact?.actual_condition;
  const expectedCond = investigation?.impact?.expected_condition;

  return (
    <div className="case-heading">
      <div className="case-kicker">
        <span className="case-number">{invNo}</span>
        <Badge tone={severity === 'Critical' ? 'amber' : 'amber'}>
          <span className="badge-dot" />
          {severity}
        </Badge>
        {batchOnHold && (
          <Badge tone="slate" icon="clock">
            Batch on hold
          </Badge>
        )}
      </div>

      <h1>{title || 'Investigation Case File'}</h1>

      {(productName || batchNumber || facility) && (
        <div className="case-meta">
          {productName && (
            <span>
              <Icon name="flask" size={14} />
              {productName}
            </span>
          )}
          {productName && batchNumber && <i />}
          {batchNumber && (
            <span>
              Batch <strong>{batchNumber}</strong>
            </span>
          )}
          {batchNumber && facility && <i />}
          {facility && (
            <span>
              <Icon name="box" size={13} />
              {facility}
            </span>
          )}
        </div>
      )}

      {(mfgDate || actualCond) && (
        <div className="case-heading-note">
          {mfgDate && <span>Manufactured {mfgDate}</span>}
          {actualCond && (
            <span>
              Assay <strong className="oos-value">{actualCond}</strong>
              {expectedCond && (
                <span className="spec-value"> / Spec. {expectedCond}</span>
              )}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

