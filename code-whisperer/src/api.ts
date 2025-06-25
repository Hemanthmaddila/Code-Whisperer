// API Client for Code Whisperer Backend Service

export interface QueryRequest {
    query: string;
    code_context?: string;
    max_results?: number;
}

export interface QueryResponse {
    answer: string;
    sources: string[];
    confidence?: number;
}

export interface IngestRequest {
    directory_path: string;
    file_patterns?: string[];
}

export interface IngestResponse {
    status: string;
    files_processed: number;
    vectors_created: number;
    message?: string;
}

export interface ApiError {
    error: string;
    details?: string;
}

export class CodeWhispererApiClient {
    private baseUrl: string;
    private timeout: number;

    constructor(baseUrl: string = 'http://localhost:8000', timeout: number = 30000) {
        this.baseUrl = baseUrl;
        this.timeout = timeout;
    }

    /**
     * Send a query to the RAG service
     */
    async query(request: QueryRequest): Promise<QueryResponse> {
        try {
            const response = await this.makeRequest('/query', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(request),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' })) as ApiError;
                throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
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
            const response = await this.makeRequest('/ingest', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(request),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' })) as ApiError;
                throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
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
    async healthCheck(): Promise<boolean> {
        try {
            const response = await this.makeRequest('/health', {
                method: 'GET',
            });
            return response.ok;
        } catch (error) {
            console.error('Health check failed:', error);
            return false;
        }
    }

    /**
     * Get the current ingestion status
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
 * Singleton instance of the API client
 */
export const apiClient = new CodeWhispererApiClient(); 