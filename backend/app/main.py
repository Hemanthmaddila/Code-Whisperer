"""
Code Whisperer FastAPI Backend
Main application entry point for the RAG-powered code assistant
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import os
from dotenv import load_dotenv

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
@app.get("/health")
async def health_check():
    """Health check endpoint to verify the API is running"""
    return {"status": "healthy", "service": "Code Whisperer API", "version": "0.1.0"}

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "message": "Welcome to Code Whisperer API",
        "description": "AI-powered code assistant with RAG capabilities",
        "version": "0.1.0",
        "docs": "/docs",
        "health": "/health"
    }

# TODO: Import and include API routers when implemented
# from app.api import query_router, ingest_router
# app.include_router(query_router, prefix="/api/v1")
# app.include_router(ingest_router, prefix="/api/v1")

# Placeholder endpoints for Phase 3 development
@app.post("/query")
async def query_endpoint():
    """Placeholder for query endpoint - will be implemented in Phase 3"""
    return {
        "status": "not_implemented",
        "message": "Query endpoint will be implemented in Phase 3 (Backend Development)"
    }

@app.post("/ingest")
async def ingest_endpoint():
    """Placeholder for ingest endpoint - will be implemented in Phase 3"""
    return {
        "status": "not_implemented", 
        "message": "Ingest endpoint will be implemented in Phase 3 (Backend Development)"
    }

@app.get("/status")
async def status_endpoint():
    """Placeholder for status endpoint - will be implemented in Phase 3"""
    return {
        "status": "not_implemented",
        "message": "Status endpoint will be implemented in Phase 3 (Backend Development)"
    }

# Exception handlers
@app.exception_handler(404)
async def not_found_handler(request, exc):
    return JSONResponse(
        status_code=404,
        content={"error": "Endpoint not found", "message": str(exc.detail)}
    )

@app.exception_handler(500)
async def internal_error_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error", "message": "An unexpected error occurred"}
    )

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