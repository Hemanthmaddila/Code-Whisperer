"""
Pydantic models for Code Whisperer API
Defines request and response schemas for type safety and validation
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from enum import Enum


class QueryType(str, Enum):
    """Types of queries the Code Whisperer can handle"""
    EXPLAIN = "explain"
    OPTIMIZE = "optimize" 
    DEBUG = "debug"
    REFACTOR = "refactor"
    GENERATE = "generate"
    REVIEW = "review"


class CodeContext(BaseModel):
    """Context information about the code being analyzed"""
    file_path: str = Field(..., description="Path to the file being analyzed")
    language: str = Field(..., description="Programming language (python, javascript, etc.)")
    selected_code: str = Field(..., description="The selected code snippet")
    full_file_content: Optional[str] = Field(None, description="Full file content for context")
    cursor_position: Optional[Dict[str, int]] = Field(None, description="Cursor line/column position")


class QueryRequest(BaseModel):
    """Request model for code analysis queries"""
    query_type: QueryType = Field(..., description="Type of analysis requested")
    query_text: str = Field(..., description="User's specific question or request")
    code_context: CodeContext = Field(..., description="Code context information")
    include_examples: bool = Field(default=True, description="Whether to include code examples")
    max_response_length: int = Field(default=1000, description="Maximum response length in characters")


class CodeSuggestion(BaseModel):
    """A code suggestion or improvement"""
    title: str = Field(..., description="Title/summary of the suggestion")
    description: str = Field(..., description="Detailed description")
    code_snippet: Optional[str] = Field(None, description="Suggested code if applicable")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Confidence score 0-1")


class QueryResponse(BaseModel):
    """Response model for code analysis queries"""
    query_id: str = Field(..., description="Unique identifier for this query")
    query_type: QueryType = Field(..., description="Type of analysis performed")
    explanation: str = Field(..., description="Main explanation or analysis")
    suggestions: List[CodeSuggestion] = Field(default=[], description="List of suggestions")
    code_examples: List[str] = Field(default=[], description="Relevant code examples")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Overall confidence in response")
    processing_time_ms: int = Field(..., description="Time taken to process the query")
    

class IngestRequest(BaseModel):
    """Request model for ingesting code files into the knowledge base"""
    file_path: str = Field(..., description="Path to the file to ingest")
    content: str = Field(..., description="File content to ingest")
    language: str = Field(..., description="Programming language")
    project_id: Optional[str] = Field(None, description="Project identifier")
    metadata: Dict[str, Any] = Field(default={}, description="Additional metadata")


class IngestResponse(BaseModel):
    """Response model for file ingestion"""
    ingest_id: str = Field(..., description="Unique identifier for this ingestion")
    status: str = Field(..., description="Ingestion status (success, error, etc.)")
    chunks_created: int = Field(..., description="Number of text chunks created")
    embeddings_generated: int = Field(..., description="Number of embeddings generated")
    processing_time_ms: int = Field(..., description="Time taken to process the file")
    message: str = Field(..., description="Human-readable status message")


class HealthResponse(BaseModel):
    """Response model for health check"""
    status: str = Field(..., description="Service health status")
    service: str = Field(..., description="Service name")
    version: str = Field(..., description="API version")
    timestamp: Optional[str] = Field(None, description="Current timestamp")
    dependencies: Dict[str, str] = Field(default={}, description="Status of dependencies")


class ErrorResponse(BaseModel):
    """Standard error response model"""
    error: str = Field(..., description="Error type")
    message: str = Field(..., description="Human-readable error message")
    details: Optional[Dict[str, Any]] = Field(None, description="Additional error details")
    request_id: Optional[str] = Field(None, description="Request identifier for tracking")


class StatusResponse(BaseModel):
    """Response model for service status"""
    service_status: str = Field(..., description="Overall service status")
    api_version: str = Field(..., description="API version")
    active_connections: int = Field(..., description="Number of active connections")
    total_queries: int = Field(..., description="Total queries processed")
    total_ingestions: int = Field(..., description="Total files ingested")
    knowledge_base_size: int = Field(..., description="Number of documents in knowledge base")
    last_updated: Optional[str] = Field(None, description="Last update timestamp") 