import React from 'react';
import { SectionHeading, Badge } from '../../components/UI';
import { Icon } from '../../components/Icon';
import { AIField } from '../../components/AIField';

export const IncidentStage: React.FC = () => {
  return (
    <section className="card detail-card animate-in">
      <SectionHeading icon="activity" title="Incident & Deviation Information">
        <Badge tone="purple" icon="activity">
          Populated by Copilot
        </Badge>
      </SectionHeading>

      <div className="detail-fields">
        <AIField path="incident.title" label="Deviation Title" />
        <AIField path="incident.source_reference" label="Source Reference (QC/OOS No.)" />
        <AIField path="incident.date_occurrence" label="Occurrence Date" />
        <AIField path="incident.date_discovery" label="Discovery Date" />
        <AIField path="incident.reported_by" label="Reported By" />
        <AIField path="incident.department" label="Department" />
        <AIField path="incident.facility" label="Manufacturing Facility / Suite" />
        <AIField path="incident.category" label="Deviation Category" />
        <AIField path="incident.detection_method" label="Detection Method" />
        <AIField path="incident.initial_severity" label="Initial Severity" />
      </div>

      <div style={{ marginTop: '16px' }}>
        <AIField
          path="incident.description"
          label="Detailed Incident Description & Narrative"
          type="textarea"
        />
      </div>

      <div className="analysis-disclaimer">
        <Icon name="info" size={13} />
        AI-extracted information must be verified against analytical source documents before release.
      </div>
    </section>
  );
};

