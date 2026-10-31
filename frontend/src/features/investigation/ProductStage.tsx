import React from 'react';
import { SectionHeading, Badge } from '../../components/UI';
import { Icon } from '../../components/Icon';
import { AIField } from '../../components/AIField';

export const ProductStage: React.FC = () => {
  return (
    <section className="card detail-card animate-in">
      <SectionHeading icon="box" title="Product & Batch Details">
        <Badge tone="purple" icon="box">
          Populated by Copilot
        </Badge>
      </SectionHeading>

      <div className="detail-fields">
        <AIField path="product.name" label="API Name" />
        <AIField path="product.batch_number" label="Batch Number" />
        <AIField path="product.grade" label="Pharmacopoeial Grade (USP / Ph.Eur.)" />
        <AIField path="product.manufacturing_stage" label="Manufacturing Stage" />
        <AIField path="product.manufacturing_date" label="Manufacturing Date" />
        <AIField path="product.equipment" label="Processing Equipment" />
        <AIField path="product.affected_quantity" label="Affected Batch Quantity" />
        <AIField path="product.unit" label="Unit (kg / drums)" />
      </div>

      <div style={{ marginTop: '16px' }}>
        <AIField
          path="product.production_details"
          label="Production Synthesis & Granulation Context"
          type="textarea"
        />
      </div>

      <div className="analysis-disclaimer">
        <Icon name="info" size={13} />
        Check batch number and material identifiers against the executed batch manufacturing record (BMR).
      </div>
    </section>
  );
};

