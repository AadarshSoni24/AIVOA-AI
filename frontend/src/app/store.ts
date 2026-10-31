import { configureStore } from '@reduxjs/toolkit';
import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';
import { investigationSlice } from '../features/investigation/investigationSlice';
import copilotReducer from '../features/copilot/copilotSlice';
import { uiSlice } from '../features/ui/uiSlice';
import historyReducer from '../features/history/historySlice';

export const store = configureStore({
  reducer: {
    investigation: investigationSlice.reducer,
    copilot: copilotReducer,
    ui: uiSlice.reducer,
    history: historyReducer
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

