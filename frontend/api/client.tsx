```typescript
import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';

// API base URL
const baseURL = process.env.NEXT_PUBLIC_API_URL || '';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add JWT token
api.interceptors.request.use(
  (config) => {
    // Only run in browser environment
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle 401 errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Only run in browser environment
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// TypeScript interfaces

export interface Session {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export interface CreateSessionRequest {
  name: string;
}

export interface CreateSessionResponse {
  session: Session;
}

export interface ListSessionsResponse {
  sessions: Session[];
}

export interface Message {
  id: string;
  session_id: string;
  content: string;
  role: 'user' | 'assistant';
  created_at: string;
  sources?: SourceCitation[];
}

export interface SourceCitation {
  filename: string;
  row_start: number;
  row_end: number;
  content: string;
}

export interface GetMessagesResponse {
  messages: Message[];
}

export interface UploadFileRequest {
  file: File;
  session_id: string;
}

export interface UploadFileResponse {
  file_id: string;
  filename: string;
  file_size: number;
  uploaded_at: string;
  session_id: string;
}

export interface IngestDocumentsRequest {
  file_ids: string[];
  session_id: string;
}

export interface IngestDocumentsResponse {
  message: string;
  ingested_count: number;
  session_id: string;
}

export interface AIQueryRequest {
  question: string;
  session_id: string;
}

export interface AIQueryResponse {
  answer: string;
  sources: SourceCitation[];
  session_id: string;
}

// API functions

export const createSession = async (data: CreateSessionRequest): Promise<CreateSessionResponse> => {
  const response: AxiosResponse<CreateSessionResponse> = await api.post('/api/sessions', data);
  return response.data;
};

export const listSessions = async (): Promise<ListSessionsResponse> => {
  const response: AxiosResponse<ListSessionsResponse> = await api.get('/api/sessions');
  return response.data;
};

export const getMessages = async (sessionId: string): Promise<GetMessagesResponse> => {
  const response: AxiosResponse<GetMessagesResponse> = await api.get(`/api/sessions/${sessionId}/messages`);
  return response.data;
};

export const uploadFile = async (data: UploadFileRequest): Promise<UploadFileResponse> => {
  const formData = new FormData();
  formData.append('file', data.file);
  formData.append('session_id', data.session_id);

  const response: AxiosResponse<UploadFileResponse> = await api.post('/api/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const ingestDocuments = async (data: IngestDocumentsRequest): Promise<IngestDocumentsResponse> => {
  const response: AxiosResponse<IngestDocumentsResponse> = await api.post('/api/ai/ingest', data);
  return response.data;
};

export const aiQuery = async (data: AIQueryRequest): Promise<AIQueryResponse> => {
  const response: AxiosResponse<AIQueryResponse> = await api.post('/api/ai/query', data);
  return response.data;
};

// Export the api instance for direct use if needed
export { api };
```