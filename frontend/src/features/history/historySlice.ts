import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { apiClient } from '../../api/client';
import { RootState } from '../../app/store';
import { InvestigationSummary, Investigation } from '../investigation/types';
import { setInvestigation } from '../investigation/investigationSlice';
import { showToast, setView } from '../ui/uiSlice';

interface HistoryState {
  items: InvestigationSummary[];
  status: 'idle' | 'loading' | 'error';
  error: string | null;
}

const initialState: HistoryState = {
  items: [],
  status: 'idle',
  error: null
};

// Async thunk: fetch saved investigations list
export const fetchHistory = createAsyncThunk<InvestigationSummary[]>(
  'history/fetchHistory',
  async (_, { dispatch }) => {
    try {
      const list = await apiClient.fetchHistory();
      return list;
    } catch (err: any) {
      dispatch(showToast({ text: err.message || 'Failed to fetch saved investigations', error: true }));
      throw err;
    }
  }
);

// Async thunk: load a specific investigation and switch to workspace
export const loadInvestigation = createAsyncThunk<
  Investigation,
  string,
  { state: RootState }
>('history/loadInvestigation', async (id, { dispatch }) => {
  try {
    const inv = await apiClient.getInvestigation(id);
    if (inv) {
      dispatch(setInvestigation(inv));
    }
    dispatch(setView('workspace'));
    dispatch(
      showToast({
        text: `Loaded investigation ${inv?.investigation_no || id}`,
        error: false
      })
    );
    return inv;
  } catch (err: any) {
    dispatch(showToast({ text: err.message || 'Failed to load investigation', error: true }));
    throw err;
  }
});

// Async thunk: save current investigation (POST new or PUT existing)
export const saveInvestigation = createAsyncThunk<
  Investigation,
  void,
  { state: RootState }
>('history/saveInvestigation', async (_, { getState, dispatch }) => {
  const current = getState().investigation.current;
  try {
    const saved = await apiClient.saveInvestigation(current);
    if (saved) {
      dispatch(setInvestigation(saved));
    }
    dispatch(
      showToast({
        text: `Investigation ${saved?.investigation_no || 'case'} saved successfully.`,
        error: false
      })
    );
    return saved;
  } catch (err: any) {
    const errorMsg = err.message || 'Failed to save investigation';
    dispatch(showToast({ text: errorMsg, error: true }));
    throw err;
  }
});

export const historySlice = createSlice({
  name: 'history',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // fetchHistory
      .addCase(fetchHistory.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchHistory.fulfilled, (state, action: PayloadAction<InvestigationSummary[]>) => {
        state.status = 'idle';
        state.items = action.payload;
      })
      .addCase(fetchHistory.rejected, (state, action) => {
        state.status = 'error';
        state.error = action.error.message || 'Error fetching history';
      })
      // saveInvestigation
      .addCase(saveInvestigation.fulfilled, (state, action: PayloadAction<Investigation>) => {
        const saved = action.payload;
        const index = state.items.findIndex((item) => item.id === saved.id);
        const summary: InvestigationSummary = {
          id: saved.id || 'inv-' + Date.now(),
          investigation_no: saved.investigation_no,
          title: saved.incident?.title || 'Untitled Deviation',
          batch_number: saved.product?.batch_number || '-',
          severity: saved.risk?.severity || 'Major',
          status: saved.status,
          updated_at: new Date().toISOString()
        };
        if (index >= 0) {
          state.items[index] = summary;
        } else {
          state.items.unshift(summary);
        }
      });
  }
});

export default historySlice.reducer;

