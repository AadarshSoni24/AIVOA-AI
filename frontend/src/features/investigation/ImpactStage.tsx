import React from 'react';
import { SectionHeading, Badge } from '../../components/UI';
import { Icon } from '../../components/Icon';
import { AIField } from '../../components/AIField';

export const ImpactStage: React.FC = () => {
  return (
    <section className="card detail-card animate-in">
      <SectionHeading icon="shield" title="Impact & Containment Assessment">
        <Badge tone="purple" icon="shield">
          Populated by Copilot
        </Badge>
      </SectionHeading>

      <div className="detail-fields">
        <AIField path="impact.expected_condition" label="Approved Specification / Limit" />
        <AIField path="impact.actual_condition" label="Actual Result (OOS / OOT)" />
        <AIField
          path="risk.severity"
          label="Risk Severity"
          type="select"
          options={['Critical', 'Major', 'Minor']}
        />
        <AIField path="impact.containment_actions" label="Containment & Quarantine" />
        <AIField path="impact.quality_impact" label="Quality & Regulatory Impact" />
        <AIField path="impact.product_impact" label="Product Impact" />
      </div>

      <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <AIField
          path="impact.patient_impact"
          label="Patient Safety & Clinical Risk Evaluation"
          type="textarea"
        />
        <AIField
          path="risk.rationale"
          label="Risk Justification Rationale"
          type="textarea"
        />
      </div>

      <div className="analysis-disclaimer">
        <Icon name="info" size={13} />
        Containment actions require QA approval before releasing physical or ERP quarantine holds.
      </div>
    </section>
  );
};

