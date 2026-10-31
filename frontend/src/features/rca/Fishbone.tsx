import React from 'react';
import { useAppDispatch, useAppSelector } from '../../app/store';
import { selectFishboneCauses } from '../investigation/selectors';
import { sendMessage } from '../copilot/copilotSlice';
import { SectionHeading, Badge } from '../../components/UI';
import { Icon, IconName } from '../../components/Icon';
import { RootCauseCategory } from '../investigation/types';

interface BranchConfig {
  key: RootCauseCategory;
  name: string;
  icon: IconName;
}

const BRANCHES: BranchConfig[] = [
  { key: 'man', name: 'Man (Personnel)', icon: 'help' },
  { key: 'machine', name: 'Machine (Equipment)', icon: 'settings' },
  { key: 'method', name: 'Method (Procedures)', icon: 'branch' },
  { key: 'material', name: 'Material (Raw & Reagents)', icon: 'box' },
  { key: 'measurement', name: 'Measurement (QC Testing)', icon: 'activity' },
  { key: 'environment', name: 'Environment (Facility / HVAC)', icon: 'flask' }
];

export const Fishbone: React.FC = () => {
  const dispatch = useAppDispatch();
  const fishboneCauses = useAppSelector(selectFishboneCauses);
  const investigation = useAppSelector((state) => state.investigation?.current);
  const isLoading = useAppSelector((state) => state.copilot?.status === 'loading');

  const actualCond = investigation?.impact?.actual_condition || 'OOS Deviation';
  const batchNumber = investigation?.product?.batch_number || 'Batch -';

  const handleCauseClick = (statement: string) => {
    if (!isLoading) {
      dispatch(sendMessage({ message: `Help investigate root cause hypothesis: "${statement}"` }));
    }
  };

  return (
    <section className="card fishbone-card">
      <SectionHeading icon="network" title="Ishikawa Cause & Effect (6M) Analysis">
        <Badge tone="purple" icon="network">
          6M mapped
        </Badge>
      </SectionHeading>

      <p className="card-subtitle">
        Investigate root causes across the six pharmaceutical manufacturing categories to prevent premature attribution.
      </p>

      <div className="fishbone-diagram">
        <div className="fishbone-spine" />

        <div className="fishbone-branches">
          {BRANCHES.map((b, i) => {
            const causes = fishboneCauses[b.key] || [];
            const hasCauses = causes.length > 0;

            return (
              <div
                key={b.key}
                className={`fishbone-branch branch-${i} ${hasCauses ? 'has-cause' : ''}`}
              >
                <div className="branch-heading">
                  <Icon name={b.icon} size={15} />
                  <strong>{b.name}</strong>
                  {hasCauses && <span className="branch-dot" />}
                </div>

                {hasCauses ? (
                  causes.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => handleCauseClick(c.statement)}
                      title="Click to explore with Copilot"
                      disabled={isLoading}
                    >
                      {c.statement}
                    </button>
                  ))
                ) : (
                  <span style={{ fontSize: '10px', color: '#aaa', fontStyle: 'italic', padding: '4px 6px' }}>
                    No contributors identified
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Fish head effect */}
        <div className="fish-head">
          <Icon name="target" size={22} />
          <strong>{investigation.incident?.title?.slice(0, 24) || 'OOS Assay'}</strong>
          <span>{actualCond}</span>
          <small>{batchNumber}</small>
        </div>
      </div>

      <div className="fishbone-legend">
        <span>
          <i style={{ background: '#6366f1' }} />
          AI-identified candidate
        </span>
        <span>
          <i style={{ background: '#22c55e' }} />
          Potential contributor
        </span>
        <span>Click any branch cause to explore with Copilot</span>
      </div>
    </section>
  );
};

