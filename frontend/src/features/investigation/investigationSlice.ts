import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  Investigation,
  createEmptyInvestigation,
  normalizeInvestigation,
  RootCauseStatus,
  CapaStatus
} from './types';

interface InvestigationState {
  current: Investigation;
}

const initialState: InvestigationState = {
  current: createEmptyInvestigation()
};

function setNestedValue(obj: any, path: string, value: any) {
  const parts = path.split('.');
  let current = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i];
    if (current[key] === undefined || current[key] === null || typeof current[key] !== 'object') {
      current[key] = {};
    }
    current = current[key];
  }
  current[parts[parts.length - 1]] = value;
}

export const investigationSlice = createSlice({
  name: 'investigation',
  initialState,
  reducers: {
    setInvestigation: (state, action: PayloadAction<any>) => {
      if (!action.payload) {
        console.warn('[setInvestigation] Ignored falsy payload:', action.payload);
        return;
      }
      const raw = action.payload.investigation || action.payload;
      if (!raw || typeof raw !== 'object') {
        console.warn('[setInvestigation] Ignored non-object payload:', action.payload);
        return;
      }
      state.current = normalizeInvestigation(raw);
    },
    resetInvestigation: (state) => {
      state.current = createEmptyInvestigation();
    },
    updateField: (
      state,
      action: PayloadAction<{ path: string; value: any }>
    ) => {
      if (!state.current) {
        state.current = createEmptyInvestigation();
      }
      const { path, value } = action.payload;
      setNestedValue(state.current, path, value);
      if (!state.current.field_meta) {
        state.current.field_meta = {};
      }
      state.current.field_meta[path] = 'reviewed';
    },
    confirmRootCause: (state, action: PayloadAction<string>) => {
      if (!state.current) return;
      const cause = state.current.root_causes?.find((c) => c.id === action.payload);
      if (cause) {
        cause.status = 'human_confirmed';
      }
    },
    rejectRootCause: (state, action: PayloadAction<string>) => {
      if (!state.current) return;
      const cause = state.current.root_causes?.find((c) => c.id === action.payload);
      if (cause) {
        cause.status = 'rejected';
      }
    },
    setRootCauseStatus: (
      state,
      action: PayloadAction<{ id: string; status: RootCauseStatus }>
    ) => {
      if (!state.current) return;
      const cause = state.current.root_causes?.find((c) => c.id === action.payload.id);
      if (cause) {
        cause.status = action.payload.status;
      }
    },
    setCapaStatus: (
      state,
      action: PayloadAction<{ id: string; status: CapaStatus }>
    ) => {
      if (!state.current) return;
      const item = state.current.capa?.find((c) => c.id === action.payload.id);
      if (item) {
        item.status = action.payload.status;
      }
    },
    markFieldConfirmed: (state, action: PayloadAction<string>) => {
      if (!state.current) return;
      const path = action.payload;
      if (!state.current.field_meta) {
        state.current.field_meta = {};
      }
      state.current.field_meta[path] = 'confirmed';
    }
  }
});

export const {
  setInvestigation,
  resetInvestigation,
  updateField,
  confirmRootCause,
  rejectRootCause,
  setRootCauseStatus,
  setCapaStatus,
  markFieldConfirmed
} = investigationSlice.actions;

export default investigationSlice.reducer;

