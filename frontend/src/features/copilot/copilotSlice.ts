import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { apiClient } from '../../api/client';
import { RootState } from '../../app/store';
import { setInvestigation } from '../investigation/investigationSlice';
import { showToast } from '../ui/uiSlice';
import { Investigation } from '../investigation/types';

export interface CopilotMessageItem {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  kind?: 'text' | 'file' | 'changes';
  fileName?: string;
  changes?: Array<{
    field: string;
    from: string;
    to: string;
  }>;
}

export interface CopilotChangeEntry {
  path: string;
  label: string;
  old: any;
  new: any;
  source: 'extracted' | 'ai_suggested' | 'user';
}

interface CopilotState {
  messages: CopilotMessageItem[];
  status: 'idle' | 'loading' | 'error';
  error: string | null;
  lastChangeLog: CopilotChangeEntry[];
  highlightedPaths: string[];
}

const initialGreeting: CopilotMessageItem = {
  id: 'msg-welcome',
  role: 'assistant',
  content:
    "Hi. I'm your investigation copilot. Share an incident, paste an email, or upload a QC report, and we'll work through the investigation together.",
  timestamp: 'Just now',
  kind: 'text'
};

const initialState: CopilotState = {
  messages: [initialGreeting],
  status: 'idle',
  error: null,
  lastChangeLog: [],
  highlightedPaths: []
};

function formatDisplayValue(val: any): string {
  if (val === null || val === undefined || val === '') return 'Not set';
  if (typeof val === 'boolean') return val ? 'Yes' : 'No';
  if (typeof val === 'object') return Array.isArray(val) ? `${val.length} items` : 'Configured';
  return String(val);
}

// Async Thunk: Send natural language message
export const sendMessage = createAsyncThunk<
  void,
  { message: string; inputType?: 'text' | 'email'; forceAction?: 'rca' | 'capa' },
  { state: RootState }
>('copilot/sendMessage', async ({ message, inputType = 'text', forceAction }, { getState, dispatch }) => {
  const state = getState();
  const currentInv: Investigation = state.investigation.current;

  // Build history (last 6 only)
  const history = state.copilot.messages
    .filter((m) => m.kind !== 'changes')
    .slice(-6)
    .map((m) => ({
      role: m.role,
      content: m.content
    }));

  // Append user message immediately
  const userMsgId = 'msg-user-' + Date.now();
  dispatch(
    addMessage({
      id: userMsgId,
      role: 'user',
      content: message,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      kind: 'text'
    })
  );

  try {
    const res = await apiClient.sendMessage({
      message,
      inputType,
      investigation: currentInv,
      history,
      forceAction
    });

    console.log('[sendMessage] API Response:', res);

    // Replace whole investigation object from server if provided
    const targetInv = res?.investigation || res;
    if (targetInv && typeof targetInv === 'object') {
      dispatch(setInvestigation(targetInv));
    } else {
      console.warn('[sendMessage] No investigation payload in response:', res);
    }

    // Append AI response message
    const aiMsgId = 'msg-ai-' + Date.now();
    const assistantText = res?.assistant_message || (
      res?.change_log?.length
        ? `Applied updates to ${res.change_log.map((c) => c.label || c.path).slice(0, 3).join(', ')}.`
        : 'Reviewed investigation details.'
    );

    dispatch(
      addMessage({
        id: aiMsgId,
        role: 'assistant',
        content: assistantText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        kind: 'text'
      })
    );

    // If change_log exists and has items, append "changes" message
    if (res?.change_log && res.change_log.length > 0) {
      dispatch(
        addMessage({
          id: 'msg-chg-' + Date.now(),
          role: 'assistant',
          content: `Updated ${res.change_log.length} field${res.change_log.length > 1 ? 's' : ''}:`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          kind: 'changes',
          changes: res.change_log.map((c) => ({
            field: c.label || c.path,
            from: formatDisplayValue(c.old),
            to: formatDisplayValue(c.new)
          }))
        })
      );

      // Set highlighted paths
      const paths = res.change_log.map((c) => c.path).filter(Boolean);
      dispatch(setHighlights(paths));
    }
  } catch (err: any) {
    let errorMsg = 'Failed to process message';
    if (typeof err === 'string') {
      errorMsg = err;
    } else if (err?.message) {
      errorMsg = typeof err.message === 'object' ? JSON.stringify(err.message) : String(err.message);
    } else if (typeof err === 'object') {
      errorMsg = JSON.stringify(err);
    }

    dispatch(
      addMessage({
        id: 'msg-err-' + Date.now(),
        role: 'assistant',
        content: `Error: ${errorMsg}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        kind: 'text'
      })
    );
    dispatch(showToast({ text: errorMsg, error: true }));
    throw err;
  }
});

// Async Thunk: Upload PDF document
export const uploadDocument = createAsyncThunk<
  void,
  { file: File },
  { state: RootState }
>('copilot/uploadDocument', async ({ file }, { getState, dispatch }) => {
  const state = getState();
  const currentInv: Investigation = state.investigation.current;

  // Build history (last 6)
  const history = state.copilot.messages
    .filter((m) => m.kind !== 'changes')
    .slice(-6)
    .map((m) => ({
      role: m.role,
      content: m.content
    }));

  // Append user message with attached file chip
  const userMsgId = 'msg-upload-' + Date.now();
  dispatch(
    addMessage({
      id: userMsgId,
      role: 'user',
      content: `Investigate source document: ${file.name}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      kind: 'file',
      fileName: file.name
    })
  );

  try {
    const res = await apiClient.uploadDocument(file, currentInv, history);

    console.log('[uploadDocument] API Response:', res);

    // Replace whole investigation object from server if provided
    const targetInv = res?.investigation || res;
    if (targetInv && typeof targetInv === 'object') {
      dispatch(setInvestigation(targetInv));
    } else {
      console.warn('[uploadDocument] No investigation payload in response:', res);
    }

    // Append AI response
    const uploadAssistantText = res?.assistant_message || (
      res?.change_log?.length
        ? `Extracted parameters from ${file.name} and updated ${res.change_log.length} fields.`
        : `Extracted deviation data from ${file.name}.`
    );

    dispatch(
      addMessage({
        id: 'msg-ai-upload-' + Date.now(),
        role: 'assistant',
        content: uploadAssistantText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        kind: 'text'
      })
    );

    // If change_log exists, append "changes" message
    if (res.change_log && res.change_log.length > 0) {
      dispatch(
        addMessage({
          id: 'msg-chg-upload-' + Date.now(),
          role: 'assistant',
          content: `Extracted ${res.change_log.length} parameter${res.change_log.length > 1 ? 's' : ''} from ${file.name}:`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          kind: 'changes',
          changes: res.change_log.map((c) => ({
            field: c.label || c.path,
            from: formatDisplayValue(c.old),
            to: formatDisplayValue(c.new)
          }))
        })
      );

      const paths = res.change_log.map((c) => c.path).filter(Boolean);
      dispatch(setHighlights(paths));
    }
  } catch (err: any) {
    let errorMsg = 'Failed to upload and extract document';
    if (typeof err === 'string') {
      errorMsg = err;
    } else if (err?.message) {
      errorMsg = typeof err.message === 'object' ? JSON.stringify(err.message) : String(err.message);
    } else if (typeof err === 'object') {
      errorMsg = JSON.stringify(err);
    }
    dispatch(
      addMessage({
        id: 'msg-err-upload-' + Date.now(),
        role: 'assistant',
        content: `Error: ${errorMsg}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        kind: 'text'
      })
    );
    dispatch(showToast({ text: errorMsg, error: true }));
    throw err;
  }
});

// Async Thunk: Run Action ("rca" | "capa")
export const runAction = createAsyncThunk<
  void,
  'rca' | 'capa',
  { state: RootState }
>('copilot/runAction', async (actionType, { dispatch }) => {
  const prompt =
    actionType === 'rca'
      ? 'Perform Root Cause Analysis on the current deviation evidence and suggest potential causes.'
      : 'Generate regulatory CAPA recommendations with owners, target dates, and effectiveness checks.';

  await dispatch(sendMessage({ message: prompt, forceAction: actionType })).unwrap();
});

export const copilotSlice = createSlice({
  name: 'copilot',
  initialState,
  reducers: {
    addMessage: (state, action: PayloadAction<CopilotMessageItem>) => {
      state.messages.push(action.payload);
    },
    setHighlights: (state, action: PayloadAction<string[]>) => {
      state.highlightedPaths = action.payload;
    },
    clearHighlights: (state) => {
      state.highlightedPaths = [];
    },
    resetCopilot: (state) => {
      state.messages = [initialGreeting];
      state.status = 'idle';
      state.error = null;
      state.lastChangeLog = [];
      state.highlightedPaths = [];
    }
  },
  extraReducers: (builder) => {
    builder
      // sendMessage
      .addCase(sendMessage.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(sendMessage.fulfilled, (state) => {
        state.status = 'idle';
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.status = 'error';
        state.error = action.error.message || 'Copilot action failed';
      })
      // uploadDocument
      .addCase(uploadDocument.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(uploadDocument.fulfilled, (state) => {
        state.status = 'idle';
      })
      .addCase(uploadDocument.rejected, (state, action) => {
        state.status = 'error';
        state.error = action.error.message || 'Upload failed';
      });
  }
});

export const { addMessage, setHighlights, clearHighlights, resetCopilot } = copilotSlice.actions;
export default copilotSlice.reducer;

