// API Client for Code Whisperer Backend Service
import axios, { AxiosResponse, AxiosError } from 'axios';

export interface CodeContext {
    file_path: string;
    language: string;
    selected_code: string;
    full_file_content?: string;
}

export interface QueryRequest {
    query_type: "explain" | "optimize" | "debug" | "refactor" | "generate" | "review";
    query_text: string;
    code_context: CodeContext;
    include_examples?: boolean;
}

export interface CodeSuggestion {
    title: string;
    description: string;
    code_snippet?: string;
    confidence: number;
}

export interface QueryResponse {
    query_id: string;
    query_type: string;
    explanation: string;
    suggestions: CodeSuggestion[];
    code_examples: string[];
    confidence: number;
    processing_time_ms: number;
}

export interface IngestRequest {
    file_path: string;
    content: string;
    language: string;
    project_id?: string;
    metadata?: any;
}

export interface IngestResponse {
    ingest_id: string;
    status: string;
    chunks_created: number;
    embeddings_generated: number;
    processing_time_ms: number;
    message: string;
}

export interface HealthResponse {
    status: string;
    service: string;
    version: string;
    timestamp?: string;
    dependencies?: any;
}

export interface ApiError {
    error: string;
    message: string;
    details?: any;
    request_id?: string;
}

export class CodeWhispererApiClient {
    private baseUrl: string;
    private timeout: number;

    constructor(baseUrl: string = 'http://localhost:8000', timeout: number = 30000) {
        this.baseUrl = baseUrl;
        this.timeout = timeout;
    }

    /**
     * Send a query to the AI service
     */
    async query(request: QueryRequest): Promise<QueryResponse> {
        try {
            const response = await axios.post<QueryResponse>(`${this.baseUrl}/api/query`, request, {
                headers: {
                    'Content-Type': 'application/json',
                },
                timeout: this.timeout,
            });

            return response.data;
        } catch (error) {
            console.error('Query API error:', error);
            throw this.handleAxiosError(error);
        }
    }

    /**
     * Trigger codebase ingestion
     */
    async ingest(request: IngestRequest): Promise<IngestResponse> {
        try {
            const response = await axios.post<IngestResponse>(`${this.baseUrl}/api/ingest`, request, {
                headers: {
                    'Content-Type': 'application/json',
                },
                timeout: this.timeout,
            });

            return response.data;
        } catch (error) {
            console.error('Ingest API error:', error);
            throw this.handleAxiosError(error);
        }
    }

    /**
     * Check if the backend service is healthy
     */
    async healthCheck(): Promise<HealthResponse | null> {
        try {
            const response = await axios.get<HealthResponse>(`${this.baseUrl}/health`, {
                timeout: this.timeout,
            });
            
            return response.data;
        } catch (error) {
            console.error('Health check failed:', error);
            return null;
        }
    }

    /**
     * Get the current service status
     */
    async getStatus(): Promise<any> {
        try {
            const response = await axios.get(`${this.baseUrl}/status`, {
                timeout: this.timeout,
            });

            return response.data;
        } catch (error) {
            console.error('Status API error:', error);
            throw this.handleAxiosError(error);
        }
    }

    /**
     * Test connection to the backend
     */
    async testConnection(): Promise<boolean> {
        try {
            const response = await axios.get(`${this.baseUrl}/`, {
                timeout: this.timeout,
            });
            return response.status === 200;
        } catch (error) {
            console.error('Connection test failed:', error);
            return false;
        }
    }

    private handleApiError(error: any): Error {
        if (error instanceof Error) {
            return error;
        }
        
        if (typeof error === 'string') {
            return new Error(error);
        }
        
        return new Error('An unknown API error occurred');
    }

    private handleAxiosError(error: any): Error {
        if (error.response) {
            // Server responded with error status
            const response = error.response;
            const errorData = response.data as ApiError;
            return new Error(errorData?.message || errorData?.error || `HTTP ${response.status}: ${response.statusText}`);
        } else if (error.request) {
            // Request was made but no response received
            return new Error('No response from server. Please check if the backend is running.');
        } else {
            // Something else happened
            return new Error(error.message || 'An unknown error occurred');
        }
    }

    /**
     * Update the base URL for the API client
     */
    setBaseUrl(baseUrl: string): void {
        this.baseUrl = baseUrl;
    }

    /**
     * Update the request timeout
     */
    setTimeout(timeout: number): void {
        this.timeout = timeout;
    }
}

/**
 * Singleton instance of the API client configured for our working backend
 */
export const apiClient = new CodeWhispererApiClient('http://localhost:8000'); 