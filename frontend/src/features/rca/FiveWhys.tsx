import React, { useState } from 'react';
import { useAppSelector } from '../../app/store';
import { SectionHeading, Badge } from '../../components/UI';
import { Icon } from '../../components/Icon';

export const FiveWhys: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const whySteps = useAppSelector((state) => state.investigation?.current?.why_steps || []);
  const rootCauses = useAppSelector((state) => state.investigation?.current?.root_causes || []);

  // Find unique cause IDs that have why steps
  const causeIdsWithSteps = Array.from(new Set(whySteps.map((s) => s.root_cause_id)));
  const [selectedCauseId, setSelectedCauseId] = useState<string>(
    causeIdsWithSteps[0] || rootCauses[0]?.id || 'RC-01'
  );

  const activeSteps = whySteps.filter(
    (s) => s.root_cause_id === selectedCauseId || causeIdsWithSteps.length <= 1
  );

  const activeCause = rootCauses.find((c) => c.id === selectedCauseId);

  return (
    <section className={`card whys-card ${compact ? 'compact' : ''}`}>
      <SectionHeading icon="branch" title="5 Whys analysis">
        <Badge tone="purple" icon="network">
          Drill-down
        </Badge>
      </SectionHeading>

      <p className="card-subtitle">
        Following the strongest analytical lead through progressive layers of root causation.
      </p>

      {/* Cause Selector if multiple causes exist */}
      {causeIdsWithSteps.length > 1 && (
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          {causeIdsWithSteps.map((cid) => {
            const cause = rootCauses.find((c) => c.id === cid);
            return (
              <button
                key={cid}
                type="button"
                onClick={() => setSelectedCauseId(cid)}
                className={`btn btn-secondary ${selectedCauseId === cid ? 'selected' : ''}`}
                style={{
                  fontSize: '11px',
                  padding: '4px 10px',
                  borderColor: selectedCauseId === cid ? '#6366f1' : undefined
                }}
              >
                {cid}: {cause?.statement.slice(0, 30) || 'Hypothesis'}...
              </button>
            );
          })}
        </div>
      )}

      {activeSteps.length === 0 ? (
        <div className="no-sources" style={{ padding: '30px 0', textAlign: 'center' }}>
          No 5 Whys steps generated yet. Prompt Copilot to &quot;Run 5 Whys analysis&quot; to drill down.
        </div>
      ) : (
        <div className="why-timeline">
          {activeSteps.map((why, i) => (
            <div className="why-step" key={why.id || i}>
              <span className={`why-number ${i === activeSteps.length - 1 ? 'last' : ''}`}>
                {String(why.step_no || i + 1).padStart(2, '0')}
              </span>
              <div>
                <h4>{why.question}</h4>
                <p>{why.answer}</p>
                <span className="why-source">
                  <Icon name={i === activeSteps.length - 1 ? 'target' : 'file'} size={11} />
                  {activeCause?.statement || 'Analytical investigation trail'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="analysis-disclaimer">
        <Icon name="info" size={13} />
        A causal logic path based on current evidence, not a definitive regulatory release.
      </div>
    </section>
  );
};

