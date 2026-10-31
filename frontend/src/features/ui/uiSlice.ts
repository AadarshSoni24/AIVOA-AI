import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type AppView = 'workspace' | 'history';
export type AppStage =
  | 'Incident'
  | 'Product & Batch'
  | 'Impact'
  | 'Evidence'
  | 'Root Cause Analysis'
  | 'CAPA';
export type RcaTab = 'Hypotheses' | '5 Whys' | 'Fishbone';

interface ToastMessage {
  text: string;
  error?: boolean;
}

interface UiState {
  view: AppView;
  activeStage: AppStage;
  activeRcaTab: RcaTab;
  copilotCollapsed: boolean;
  saveModalOpen: boolean;
  emailModalOpen: boolean;
  newModalOpen: boolean;
  uploadModalOpen: boolean;
  helpModalOpen: boolean;
  documentModal: string | null;
  toast: ToastMessage | null;
}

const initialState: UiState = {
  view: 'workspace',
  activeStage: 'Root Cause Analysis',
  activeRcaTab: 'Hypotheses',
  copilotCollapsed: false,
  saveModalOpen: false,
  emailModalOpen: false,
  newModalOpen: false,
  uploadModalOpen: false,
  helpModalOpen: false,
  documentModal: null,
  toast: null
};

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setView: (state, action: PayloadAction<AppView>) => {
      state.view = action.payload;
    },
    setActiveStage: (state, action: PayloadAction<AppStage>) => {
      state.activeStage = action.payload;
    },
    setActiveRcaTab: (state, action: PayloadAction<RcaTab>) => {
      state.activeRcaTab = action.payload;
    },
    toggleCopilotCollapsed: (state) => {
      state.copilotCollapsed = !state.copilotCollapsed;
    },
    setCopilotCollapsed: (state, action: PayloadAction<boolean>) => {
      state.copilotCollapsed = action.payload;
    },
    setSaveModalOpen: (state, action: PayloadAction<boolean>) => {
      state.saveModalOpen = action.payload;
    },
    setEmailModalOpen: (state, action: PayloadAction<boolean>) => {
      state.emailModalOpen = action.payload;
    },
    setNewModalOpen: (state, action: PayloadAction<boolean>) => {
      state.newModalOpen = action.payload;
    },
    setUploadModalOpen: (state, action: PayloadAction<boolean>) => {
      state.uploadModalOpen = action.payload;
    },
    setHelpModalOpen: (state, action: PayloadAction<boolean>) => {
      state.helpModalOpen = action.payload;
    },
    setDocumentModal: (state, action: PayloadAction<string | null>) => {
      state.documentModal = action.payload;
    },
    showToast: (state, action: PayloadAction<ToastMessage>) => {
      state.toast = action.payload;
    },
    hideToast: (state) => {
      state.toast = null;
    }
  }
});

export const {
  setView,
  setActiveStage,
  setActiveRcaTab,
  toggleCopilotCollapsed,
  setCopilotCollapsed,
  setSaveModalOpen,
  setEmailModalOpen,
  setNewModalOpen,
  setUploadModalOpen,
  setHelpModalOpen,
  setDocumentModal,
  showToast,
  hideToast
} = uiSlice.actions;

export default uiSlice.reducer;

