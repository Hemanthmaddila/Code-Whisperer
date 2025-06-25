// API Client for Code Whisperer Backend Service

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

    constructor(baseUrl: string = 'http://localhost:8002', timeout: number = 30000) {
        this.baseUrl = baseUrl;
        this.timeout = timeout;
    }

    /**
     * Send a query to the AI service
     */
    async query(request: QueryRequest): Promise<QueryResponse> {
        try {
            const response = await this.makeRequest('/api/v1/query', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(request),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error', message: 'Failed to parse error response' })) as ApiError;
                throw new Error(errorData.message || errorData.error || `HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.json() as QueryResponse;
        } catch (error) {
            console.error('Query API error:', error);
            throw this.handleApiError(error);
        }
    }

    /**
     * Trigger codebase ingestion
     */
    async ingest(request: IngestRequest): Promise<IngestResponse> {
        try {
            const response = await this.makeRequest('/api/v1/ingest', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(request),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error', message: 'Failed to parse error response' })) as ApiError;
                throw new Error(errorData.message || errorData.error || `HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.json() as IngestResponse;
        } catch (error) {
            console.error('Ingest API error:', error);
            throw this.handleApiError(error);
        }
    }

    /**
     * Check if the backend service is healthy
     */
    async healthCheck(): Promise<HealthResponse | null> {
        try {
            const response = await this.makeRequest('/health', {
                method: 'GET',
            });
            
            if (response.ok) {
                return await response.json() as HealthResponse;
            }
            return null;
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
            const response = await this.makeRequest('/status', {
                method: 'GET',
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Status API error:', error);
            throw this.handleApiError(error);
        }
    }

    /**
     * Test connection to the backend
     */
    async testConnection(): Promise<boolean> {
        try {
            const response = await this.makeRequest('/', {
                method: 'GET',
            });
            return response.ok;
        } catch (error) {
            console.error('Connection test failed:', error);
            return false;
        }
    }

    private async makeRequest(endpoint: string, options: RequestInit): Promise<Response> {
        const url = `${this.baseUrl}${endpoint}`;
        
        // Create an AbortController for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal,
            });
            clearTimeout(timeoutId);
            return response;
        } catch (error) {
            clearTimeout(timeoutId);
            if (error instanceof Error && error.name === 'AbortError') {
                throw new Error(`Request timeout after ${this.timeout}ms`);
            }
            throw error;
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
export const apiClient = new CodeWhispererApiClient('http://localhost:8002'); 