/**
 * API Client for AIVOA RCA Studio
 * Connects to the FastAPI backend or routes to the dev-only mockAdapter
 * when VITE_USE_MOCK_API=true.
 */

import axios from 'axios';
import {
  Investigation,
  CopilotResponseContract,
  InvestigationSummary
} from '../features/investigation/types';

const USE_MOCK = import.meta.env.VITE_USE_MOCK_API === 'true';
const BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? '' : 'http://localhost:8000');

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 45000
});

// Format any axios or backend error into a clean human message
export function formatErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const serverDetail = error.response?.data?.detail;
    if (typeof serverDetail === 'string' && serverDetail) {
      return serverDetail;
    }
    if (Array.isArray(serverDetail) && serverDetail.length > 0) {
      return serverDetail.map((d: any) => d.msg || JSON.stringify(d)).join('; ');
    }
    if (error.response?.data?.message) {
      return String(error.response.data.message);
    }
    if (error.response?.status === 404) {
      return 'The requested resource was not found (404).';
    }
    if (error.response?.status === 500) {
      return 'Internal server error occurred on the investigation engine.';
    }
    if (error.code === 'ECONNABORTED') {
      return 'Request timed out waiting for AI response. Please try again.';
    }
    if (!error.response && error.message) {
      return `Network connection failed: ${error.message}`;
    }
  }
  return error instanceof Error ? error.message : 'An unexpected error occurred.';
}

export interface SendMessageParams {
  message: string;
  inputType?: 'text' | 'email';
  investigation: Investigation;
  history: Array<{ role: 'user' | 'assistant'; content: string }>;
  forceAction?: 'rca' | 'capa';
}

export const apiClient = {
  async sendMessage(params: SendMessageParams): Promise<CopilotResponseContract> {
    if (USE_MOCK) {
      const { mockPostMessage } = await import('./mockAdapter');
      return mockPostMessage(params);
    }

    try {
      const payload = {
        message: params.message,
        input_type: params.inputType || 'text',
        investigation: params.investigation,
        history: params.history.slice(-6), // last 6 only
        force_action: params.forceAction
      };
      const response = await api.post<CopilotResponseContract>('/api/copilot/message', payload);
      return response.data;
    } catch (err) {
      throw new Error(formatErrorMessage(err));
    }
  },

  async uploadDocument(
    file: File,
    investigation: Investigation,
    history: Array<{ role: 'user' | 'assistant'; content: string }>
  ): Promise<CopilotResponseContract> {
    if (USE_MOCK) {
      const { mockPostUpload } = await import('./mockAdapter');
      return mockPostUpload(file, investigation, history);
    }

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('investigation', JSON.stringify(investigation));
      formData.append('history', JSON.stringify(history.slice(-6)));

      const response = await api.post<CopilotResponseContract>('/api/copilot/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (err) {
      throw new Error(formatErrorMessage(err));
    }
  },

  async saveInvestigation(investigation: Investigation): Promise<Investigation> {
    if (USE_MOCK) {
      const { mockSaveInvestigation } = await import('./mockAdapter');
      return mockSaveInvestigation(investigation);
    }

    try {
      if (!investigation.id) {
        const response = await api.post<Investigation>('/api/investigations', investigation);
        return response.data;
      } else {
        const response = await api.put<Investigation>(
          `/api/investigations/${investigation.id}`,
          investigation
        );
        return response.data;
      }
    } catch (err) {
      throw new Error(formatErrorMessage(err));
    }
  },

  async fetchHistory(): Promise<InvestigationSummary[]> {
    if (USE_MOCK) {
      const { mockFetchHistory } = await import('./mockAdapter');
      return mockFetchHistory();
    }

    try {
      const response = await api.get<InvestigationSummary[]>('/api/investigations');
      return response.data;
    } catch (err) {
      throw new Error(formatErrorMessage(err));
    }
  },

  async getInvestigation(id: string): Promise<Investigation> {
    if (USE_MOCK) {
      const { mockGetInvestigation } = await import('./mockAdapter');
      return mockGetInvestigation(id);
    }

    try {
      const response = await api.get<Investigation>(`/api/investigations/${id}`);
      return response.data;
    } catch (err) {
      throw new Error(formatErrorMessage(err));
    }
  }
};
