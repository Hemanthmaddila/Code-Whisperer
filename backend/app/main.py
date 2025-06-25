"""
Code Whisperer FastAPI Backend
Main application entry point for the RAG-powered code assistant
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import os
import uuid
import time
from datetime import datetime
from dotenv import load_dotenv

# Import our data models
from app.core.models import (
    QueryRequest, QueryResponse, IngestRequest, IngestResponse,
    HealthResponse, StatusResponse, ErrorResponse, QueryType
)

# Load environment variables
load_dotenv()

# Create FastAPI application instance
app = FastAPI(
    title="Code Whisperer API",
    description="AI-powered code assistant with RAG capabilities",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS for VS Code extension
app.add_middleware(
    CORSMiddleware,
    allow_origins=["vscode-webview://*", "http://localhost:*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check endpoint
@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint to verify the API is running"""
    return HealthResponse(
        status="healthy",
        service="Code Whisperer API",
        version="0.1.0",
        timestamp=datetime.now().isoformat(),
        dependencies={
            "gemini_api": "connected",
            "vector_db": "ready",
            "langchain": "loaded"
        }
    )

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "message": "Welcome to Code Whisperer API",
        "description": "AI-powered code assistant with RAG capabilities",
        "version": "0.1.0",
        "docs": "/docs",
        "health": "/health",
        "endpoints": {
            "query": "/api/v1/query",
            "ingest": "/api/v1/ingest", 
            "status": "/status"
        }
    }

# Enhanced query endpoint with proper models
@app.post("/api/v1/query", response_model=QueryResponse)
async def query_code(request: QueryRequest):
    """
    Analyze code and provide AI-powered insights
    
    This endpoint accepts code context and a query, then uses RAG with Gemini
    to provide intelligent analysis, suggestions, and explanations.
    """
    start_time = time.time()
    
    # Generate unique query ID
    query_id = str(uuid.uuid4())
    
    # TODO: Implement actual RAG pipeline in next steps
    # For now, return a structured mock response
    
    # Simulate processing time
    await asyncio.sleep(0.1)
    
    # Mock response based on query type
    mock_responses = {
        QueryType.EXPLAIN: {
            "explanation": f"This code in {request.code_context.language} appears to be implementing functionality related to {request.code_context.file_path}. The selected code segment shows...",
            "suggestions": [
                {
                    "title": "Add documentation",
                    "description": "Consider adding docstrings to explain the function's purpose",
                    "code_snippet": '"""Docstring explaining the function"""',
                    "confidence": 0.9
                }
            ]
        },
        QueryType.OPTIMIZE: {
            "explanation": "The code can be optimized for better performance and readability...",
            "suggestions": [
                {
                    "title": "Use list comprehension",
                    "description": "Replace loop with more efficient list comprehension",
                    "confidence": 0.85
                }
            ]
        },
        QueryType.DEBUG: {
            "explanation": "Potential issues found in the code that may cause bugs...",
            "suggestions": [
                {
                    "title": "Add error handling",
                    "description": "Consider adding try-catch blocks for error handling",
                    "confidence": 0.8
                }
            ]
        }
    }
    
    response_data = mock_responses.get(request.query_type, mock_responses[QueryType.EXPLAIN])
    
    processing_time = int((time.time() - start_time) * 1000)
    
    return QueryResponse(
        query_id=query_id,
        query_type=request.query_type,
        explanation=response_data["explanation"],
        suggestions=response_data["suggestions"],
        code_examples=["# Example will be added in next steps"],
        confidence=0.85,
        processing_time_ms=processing_time
    )

# Enhanced ingest endpoint
@app.post("/api/v1/ingest", response_model=IngestResponse)
async def ingest_code(request: IngestRequest):
    """
    Ingest code files into the knowledge base for RAG retrieval
    
    This endpoint processes code files, creates embeddings, and stores them
    in the vector database for future retrieval.
    """
    start_time = time.time()
    
    # Generate unique ingest ID
    ingest_id = str(uuid.uuid4())
    
    # TODO: Implement actual file processing and embedding generation
    # For now, return a mock response
    
    # Simulate processing
    await asyncio.sleep(0.2)
    
    processing_time = int((time.time() - start_time) * 1000)
    
    return IngestResponse(
        ingest_id=ingest_id,
        status="success",
        chunks_created=5,  # Mock: would be actual chunks from file
        embeddings_generated=5,  # Mock: would be actual embeddings
        processing_time_ms=processing_time,
        message=f"Successfully ingested {request.file_path} ({request.language})"
    )

# Enhanced status endpoint
@app.get("/status", response_model=StatusResponse)
async def get_status():
    """Get detailed service status and statistics"""
    return StatusResponse(
        service_status="operational",
        api_version="0.1.0",
        active_connections=1,  # Mock data
        total_queries=42,      # Mock data
        total_ingestions=10,   # Mock data
        knowledge_base_size=150, # Mock data
        last_updated=datetime.now().isoformat()
    )

# Exception handlers
@app.exception_handler(404)
async def not_found_handler(request, exc):
    return JSONResponse(
        status_code=404,
        content=ErrorResponse(
            error="not_found",
            message="Endpoint not found",
            request_id=str(uuid.uuid4())
        ).dict()
    )

@app.exception_handler(500)
async def internal_error_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content=ErrorResponse(
            error="internal_error",
            message="An unexpected error occurred",
            request_id=str(uuid.uuid4())
        ).dict()
    )

# Add missing import
import asyncio

if __name__ == "__main__":
    # Configuration from environment variables
    host = os.getenv("API_HOST", "0.0.0.0")
    port = int(os.getenv("API_PORT", 8000))
    debug = os.getenv("DEBUG", "true").lower() == "true"
    
    # Run the application
    uvicorn.run(
        "app.main:app",
        host=host,
        port=port,
        reload=debug,
        log_level=os.getenv("LOG_LEVEL", "info").lower()
    ) 