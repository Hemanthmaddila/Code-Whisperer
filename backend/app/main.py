"""
Code Whisperer Backend - Main FastAPI Application
Provides AI-powered code analysis using Google Gemini and RAG capabilities
"""

import os
import logging
from contextlib import asynccontextmanager
from typing import Dict, List, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import uvicorn
from dotenv import load_dotenv

from .core.models import QueryRequest, QueryResponse, HealthResponse
from .services.gemini_service import GeminiService

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Global services
gemini_service: Optional[GeminiService] = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager for startup and shutdown."""
    global gemini_service
    
    logger.info("🚀 Starting Code Whisperer Backend...")
    
    try:
        # Initialize Gemini service
        api_key = os.getenv('GOOGLE_API_KEY')
        if not api_key or api_key == 'your_gemini_api_key_here':
            logger.warning("⚠️ Google API key not configured. Using mock responses.")
            gemini_service = GeminiService(use_mock=True)
        else:
            logger.info("✅ Initializing Gemini AI service...")
            gemini_service = GeminiService(api_key=api_key)
        
        await gemini_service.initialize()
        logger.info("✅ Backend initialization complete!")
        
    except Exception as e:
        logger.error(f"❌ Failed to initialize backend: {e}")
        gemini_service = GeminiService(use_mock=True)
    
    yield
    
    # Cleanup
    logger.info("🔄 Shutting down Code Whisperer Backend...")
    if gemini_service:
        await gemini_service.cleanup()

# Create FastAPI app
app = FastAPI(
    title="Code Whisperer Backend",
    description="AI-powered code assistant with RAG capabilities using Google Gemini",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
allowed_origins = os.getenv('ALLOWED_ORIGINS', 'vscode-webview://*').split(',')
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/", response_model=Dict[str, str])
async def root():
    """Root endpoint with welcome message."""
    return {
        "message": "Code Whisperer Backend API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs"
    }

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint."""
    try:
        # Check if Gemini service is available
        gemini_status = "available" if gemini_service and gemini_service.is_available else "unavailable"
        
        return HealthResponse(
            status="healthy",
            service="code-whisperer-backend",
            version="1.0.0",
            dependencies={
                "gemini_api": gemini_status,
                "vector_db": "chromadb" if os.getenv('VECTOR_DB_TYPE') == 'chromadb' else "pinecone"
            }
        )
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        raise HTTPException(status_code=503, detail=f"Service unhealthy: {str(e)}")

@app.post("/api/query", response_model=QueryResponse)
async def analyze_code(request: QueryRequest):
    """
    Main endpoint for code analysis using AI.
    Supports multiple query types: explain, optimize, debug, refactor, review, generate
    """
    try:
        logger.info(f"📝 Received {request.query_type} query: {request.query_text[:100]}...")
        
        if not gemini_service:
            raise HTTPException(status_code=503, detail="AI service not available")
        
        # Process the query
        response = await gemini_service.process_query(request)
        
        logger.info(f"✅ Query processed successfully: {response.query_id}")
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error processing query: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.post("/api/ingest")
async def ingest_codebase(
    repository_path: str,
    force: bool = False
):
    """
    Endpoint for ingesting codebase for RAG capabilities.
    This will be implemented in future versions.
    """
    logger.info(f"📂 Codebase ingestion requested for: {repository_path}")
    
    return {
        "message": "Codebase ingestion is planned for future versions",
        "status": "not_implemented",
        "repository_path": repository_path
    }

@app.get("/api/status")
async def get_status():
    """Get detailed status of all services."""
    try:
        status = {
            "backend": "running",
            "gemini_service": "available" if gemini_service and gemini_service.is_available else "unavailable",
            "environment": os.getenv('ENVIRONMENT', 'development'),
            "debug": os.getenv('DEBUG', 'false').lower() == 'true',
            "vector_db": os.getenv('VECTOR_DB_TYPE', 'chromadb')
        }
        
        if gemini_service:
            status["model_info"] = await gemini_service.get_model_info()
        
        return status
    except Exception as e:
        logger.error(f"Status check failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Error handlers
@app.exception_handler(404)
async def not_found_handler(request, exc):
    return {"error": "Endpoint not found", "detail": "The requested endpoint does not exist"}

@app.exception_handler(500)
async def internal_error_handler(request, exc):
    logger.error(f"Internal server error: {exc}")
    return {"error": "Internal server error", "detail": "Something went wrong on our end"}

if __name__ == "__main__":
    # Configuration
    host = os.getenv('API_HOST', '0.0.0.0')
    port = int(os.getenv('API_PORT', 8002))
    debug = os.getenv('DEBUG', 'false').lower() == 'true'
    
    logger.info(f"🚀 Starting Code Whisperer Backend on {host}:{port}")
    logger.info(f"🔧 Debug mode: {debug}")
    logger.info(f"📄 API documentation: http://{host}:{port}/docs")
    
    uvicorn.run(
        "app.main:app",
        host=host,
        port=port,
        reload=debug,
        log_level="info" if not debug else "debug"
    ) 