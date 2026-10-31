import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../../app/store';
import {
  RootCauseCategory,
  InvestigationRootCause,
  Investigation,
  InvestigationEvidence,
  InvestigationCapa
} from './types';

function getNestedValue(obj: any, path: string): any {
  if (!obj) return '';
  const parts = path.split('.');
  let current = obj;
  for (const part of parts) {
    if (current === undefined || current === null) return '';
    current = current[part];
  }
  return current ?? '';
}

// Base primitive selectors
export const selectInvestigation = (state: RootState): Investigation | undefined =>
  state.investigation?.current;

export const selectCopilotStatus = (state: RootState): string =>
  state.copilot?.status || 'idle';

export const selectFieldValue = (state: RootState, path: string): string => {
  return getNestedValue(state.investigation?.current, path);
};

export const selectFieldStatus = (state: RootState, path: string): string => {
  return state.investigation?.current?.field_meta?.[path] || 'extracted';
};

export interface StageStatus {
  isComplete: boolean;
  countLabel?: string;
  hasItems: boolean;
}

// Stable empty defaults
const EMPTY_EVIDENCE: InvestigationEvidence[] = [];
const EMPTY_ROOT_CAUSES: InvestigationRootCause[] = [];
const EMPTY_CAPA: InvestigationCapa[] = [];

export const selectEvidenceList = createSelector(
  [selectInvestigation],
  (inv) => inv?.evidence || EMPTY_EVIDENCE
);

export const selectRootCauses = createSelector(
  [selectInvestigation],
  (inv) => inv?.root_causes || EMPTY_ROOT_CAUSES
);

export const selectCapaList = createSelector(
  [selectInvestigation],
  (inv) => inv?.capa || EMPTY_CAPA
);

export const selectUnconfirmedRootCauses = createSelector(
  [selectRootCauses],
  (rootCauses) =>
    rootCauses.filter(
      (c) => c.status !== 'human_confirmed' && c.status !== 'rejected'
    ).length
);

export const selectProposedCapa = createSelector(
  [selectCapaList],
  (capas) => capas.filter((c) => c.status === 'proposed').length
);

export interface UnconfirmedCounts {
  unconfirmedRootCauses: number;
  proposedCapa: number;
}

export const selectUnconfirmedCounts = createSelector(
  [selectUnconfirmedRootCauses, selectProposedCapa],
  (unconfirmedRootCauses, proposedCapa): UnconfirmedCounts => ({
    unconfirmedRootCauses,
    proposedCapa
  })
);

export const selectStageStatuses = createSelector(
  [selectInvestigation, selectEvidenceList, selectRootCauses, selectCapaList],
  (inv, evidenceList, rootCauses, capaList): Record<string, StageStatus> => {
    if (!inv) {
      return {
        Incident: { isComplete: false, hasItems: false },
        'Product & Batch': { isComplete: false, hasItems: false },
        Impact: { isComplete: false, hasItems: false },
        Evidence: { isComplete: false, hasItems: false },
        'Root Cause Analysis': { isComplete: false, hasItems: false },
        CAPA: { isComplete: false, hasItems: false }
      };
    }

    const incidentComplete = Boolean(inv.incident?.title && inv.incident?.description);
    const productComplete = Boolean(inv.product?.name && inv.product?.batch_number);
    const impactComplete = Boolean(
      inv.impact?.actual_condition || inv.impact?.quality_impact || inv.risk?.severity
    );

    const availableEvidence = evidenceList.filter((e) => e.availability === 'available').length;
    const evidenceTotal = evidenceList.length;

    const rootCauseCount = rootCauses.length;
    const capaCount = capaList.length;

    return {
      Incident: {
        isComplete: incidentComplete,
        hasItems: Boolean(inv.incident?.title)
      },
      'Product & Batch': {
        isComplete: productComplete,
        hasItems: Boolean(inv.product?.batch_number)
      },
      Impact: {
        isComplete: impactComplete,
        hasItems: Boolean(inv.risk?.severity)
      },
      Evidence: {
        isComplete: evidenceTotal > 0 && availableEvidence === evidenceTotal,
        countLabel: evidenceTotal > 0 ? `${availableEvidence}/${evidenceTotal}` : undefined,
        hasItems: evidenceTotal > 0
      },
      'Root Cause Analysis': {
        isComplete: rootCauseCount > 0 && rootCauses.some((c) => c.status === 'human_confirmed'),
        countLabel: rootCauseCount > 0 ? `${rootCauseCount}` : undefined,
        hasItems: rootCauseCount > 0
      },
      CAPA: {
        isComplete: capaCount > 0 && capaList.every((c) => c.status !== 'proposed'),
        countLabel: capaCount > 0 ? `${capaCount}` : undefined,
        hasItems: capaCount > 0
      }
    };
  }
);

export const selectFishboneCauses = createSelector(
  [selectRootCauses],
  (causes): Record<RootCauseCategory, InvestigationRootCause[]> => {
    const grouped: Record<RootCauseCategory, InvestigationRootCause[]> = {
      man: [],
      machine: [],
      method: [],
      material: [],
      measurement: [],
      environment: []
    };

    for (const cause of causes) {
      const cat = (cause.category?.toLowerCase() || 'method') as RootCauseCategory;
      if (grouped[cat]) {
        grouped[cat].push(cause);
      } else {
        grouped.method.push(cause);
      }
    }

    return grouped;
  }
);

const STATUS_PILL_PROCESSING = Object.freeze({ label: 'AI Processing', tone: 'purple' });
const STATUS_PILL_DRAFT = Object.freeze({ label: 'Draft', tone: 'slate' });
const STATUS_PILL_NEEDS_REVIEW = Object.freeze({ label: 'Needs Review', tone: 'slate' });
const STATUS_PILL_READY = Object.freeze({ label: 'Ready to Save', tone: 'green' });

export const selectDerivedStatusPill = createSelector(
  [selectCopilotStatus, selectInvestigation, selectUnconfirmedRootCauses, selectProposedCapa],
  (status, inv, unconfirmedRootCauses, proposedCapa): { label: string; tone: string } => {
    if (status === 'loading') {
      return STATUS_PILL_PROCESSING;
    }

    const title = inv?.incident?.title;
    if (!title) {
      return STATUS_PILL_DRAFT;
    }

    if (unconfirmedRootCauses > 0 || proposedCapa > 0) {
      return STATUS_PILL_NEEDS_REVIEW;
    }

    return STATUS_PILL_READY;
  }
);

export const selectHasContent = createSelector(
  [selectInvestigation],
  (inv): boolean => {
    if (!inv) return false;
    return Boolean(
      inv.incident?.title ||
      inv.incident?.description ||
      inv.product?.name ||
      inv.product?.batch_number ||
      (inv.documents && inv.documents.length > 0) ||
      (inv.evidence && inv.evidence.length > 0) ||
      (inv.root_causes && inv.root_causes.length > 0) ||
      (inv.capa && inv.capa.length > 0)
    );
  }
);

