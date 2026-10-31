import React from 'react';
import { useAppDispatch, useAppSelector } from '../../app/store';
import { SectionHeading, Button } from '../../components/UI';
import { Icon } from '../../components/Icon';
import { sendMessage } from '../copilot/copilotSlice';
import { setDocumentModal, setUploadModalOpen } from '../ui/uiSlice';

export const EvidenceChecklist: React.FC = () => {
  const dispatch = useAppDispatch();
  const evidence = useAppSelector((state) => state.investigation?.current?.evidence || []);

  const availableCount = evidence.filter((e) => e.availability === 'available').length;
  const totalCount = evidence.length;

  const handleItemClick = (item: (typeof evidence)[0]) => {
    if (item.availability === 'available') {
      dispatch(setDocumentModal(item.kind || item.description));
    } else {
      dispatch(
        sendMessage({
          message: `What evidence is needed for ${item.kind || item.description}?`
        })
      );
    }
  };

  return (
    <section className="card evidence-card">
      <SectionHeading
        icon="file"
        title="Evidence checklist"
        detail={totalCount > 0 ? `${availableCount}/${totalCount}` : '0/0'}
      />
      <p className="card-subtitle">
        A rigorous GxP investigation begins with complete analytical and batch evidence.
      </p>

      {evidence.length === 0 ? (
        <div className="no-sources" style={{ padding: '24px 0', textAlign: 'center' }}>
          No evidence items logged yet. Upload an analytical report or ask Copilot to populate evidence.
        </div>
      ) : (
        <div className="evidence-checklist">
          {evidence.map((item) => {
            const isAvailable = item.availability === 'available';
            return (
              <button
                key={item.id}
                type="button"
                className="evidence-item"
                onClick={() => handleItemClick(item)}
              >
                <span className={`check-box ${isAvailable ? 'checked' : ''}`}>
                  {isAvailable && <Icon name="check" size={11} />}
                </span>
                <span>
                  <strong>{item.description}</strong>
                  {item.source_quote && <small>{item.source_quote}</small>}
                  {item.why_needed &&
                    item.why_needed !== 'Required for cGMP compliance and root cause verification' && (
                      <small style={{ color: isAvailable ? '#555' : '#b25e00', fontStyle: 'italic' }}>
                        Compliance Note: {item.why_needed}
                      </small>
                    )}
                  <span className={`availability ${isAvailable ? 'available' : 'missing'}`}>
                    {isAvailable ? 'Available' : 'Missing'}
                  </span>
                </span>
                {!isAvailable && <Icon name="plus" size={12} />}
              </button>
            );
          })}
        </div>
      )}

      <div className="evidence-note">
        <Icon name="info" size={13} />
        <span>Missing evidence may alter the root cause probability distribution.</span>
      </div>
    </section>
  );
};

export const EvidenceStage: React.FC = () => {
  const dispatch = useAppDispatch();

  return (
    <div className="details-grid animate-in">
      <EvidenceChecklist />

      <section className="card detail-card">
        <SectionHeading icon="upload" title="Add supporting evidence" />
        <p>
          Upload analytical chromatograms, BMR logs, equipment calibration certs, or SOP procedures.
        </p>

        <Button
          icon="attach"
          onClick={() => dispatch(setUploadModalOpen(true))}
        >
          Attach a document
        </Button>

        <div className="human-note" style={{ marginTop: '20px' }}>
          <Icon name="shield" size={17} />
          <div>
            <strong>Analytical Evidence Trail</strong>
            <p>
              Documents are processed directly in your private session to extract parameters and correlate findings.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

