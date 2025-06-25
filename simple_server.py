#!/usr/bin/env python3
"""
Code Whisperer - Simple Working Server
Complete FastAPI server with Gemini integration
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from enum import Enum
import uvicorn
import os
import uuid
import time
from datetime import datetime
from dotenv import load_dotenv
from google import genai

# Load environment variables
load_dotenv()

# Initialize Gemini client
GEMINI_API_KEY = os.getenv('GOOGLE_API_KEY')
if GEMINI_API_KEY:
    gemini_client = genai.Client(api_key=GEMINI_API_KEY)
else:
    print("⚠️ Warning: GOOGLE_API_KEY not found. Gemini features will be mocked.")
    gemini_client = None

# Data Models
class QueryType(str, Enum):
    EXPLAIN = "explain"
    OPTIMIZE = "optimize"
    DEBUG = "debug"
    REFACTOR = "refactor"
    GENERATE = "generate"
    REVIEW = "review"

class CodeContext(BaseModel):
    file_path: str = Field(..., description="Path to the file being analyzed")
    language: str = Field(..., description="Programming language")
    selected_code: str = Field(..., description="The selected code snippet")
    full_file_content: Optional[str] = Field(None, description="Full file content for context")

class QueryRequest(BaseModel):
    query_type: QueryType = Field(..., description="Type of analysis requested")
    query_text: str = Field(..., description="User's specific question")
    code_context: CodeContext = Field(..., description="Code context information")
    include_examples: bool = Field(default=True, description="Whether to include code examples")

class CodeSuggestion(BaseModel):
    title: str = Field(..., description="Title/summary of the suggestion")
    description: str = Field(..., description="Detailed description")
    code_snippet: Optional[str] = Field(None, description="Suggested code if applicable")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Confidence score 0-1")

class QueryResponse(BaseModel):
    query_id: str = Field(..., description="Unique identifier for this query")
    query_type: QueryType = Field(..., description="Type of analysis performed")
    explanation: str = Field(..., description="Main explanation or analysis")
    suggestions: List[CodeSuggestion] = Field(default=[], description="List of suggestions")
    code_examples: List[str] = Field(default=[], description="Relevant code examples")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Overall confidence in response")
    processing_time_ms: int = Field(..., description="Time taken to process the query")

# Create FastAPI app
app = FastAPI(
    title="Code Whisperer API",
    description="AI-powered code assistant with Gemini integration",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS for VS Code extension
app.add_middleware(
    CORSMiddleware,
    allow_origins=["vscode-webview://*", "http://localhost:*", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Gemini Service Functions
def build_prompt(query_type: str, query_text: str, code_context: CodeContext) -> str:
    """Build context-aware prompt for Gemini"""
    
    language = code_context.language
    file_path = code_context.file_path
    selected_code = code_context.selected_code
    
    prompts = {
        "explain": f"""
As a senior software engineer, explain this {language} code clearly and concisely:

File: {file_path}
Code:
```{language}
{selected_code}
```

User Question: {query_text}

Please provide:
1. What the code does
2. Key concepts used
3. Any notable features or potential issues

Keep it practical and helpful.
""",
        "optimize": f"""
As a performance expert, analyze this {language} code for optimization:

File: {file_path}
Code:
```{language}
{selected_code}
```

User Question: {query_text}

Please provide specific optimization suggestions with examples.
""",
        "debug": f"""
As a debugging specialist, help find issues in this {language} code:

File: {file_path}
Code:
```{language}
{selected_code}
```

User Question: {query_text}

Please identify potential bugs and suggest fixes.
""",
        "refactor": f"""
As a code quality expert, suggest improvements for this {language} code:

File: {file_path}
Code:
```{language}
{selected_code}
```

User Question: {query_text}

Please provide refactoring suggestions for better code quality.
""",
        "review": f"""
As a code reviewer, provide feedback on this {language} code:

File: {file_path}
Code:
```{language}
{selected_code}
```

User Question: {query_text}

Please provide constructive code review feedback.
""",
        "generate": f"""
As a code generation assistant, help create {language} code:

Context: {file_path}
Request: {query_text}

Reference code (if provided):
```{language}
{selected_code}
```

Please generate appropriate code with explanations.
"""
    }
    
    return prompts.get(query_type, prompts["explain"])

def extract_suggestions(response: str) -> List[CodeSuggestion]:
    """Extract suggestions from AI response"""
    suggestions = []
    lines = response.split('\n')
    
    for line in lines:
        line = line.strip()
        if line and (line.startswith(('1.', '2.', '3.', '4.', '5.', '-', '*', '•'))):
            clean_line = line.lstrip('12345.-*• ').strip()
            if len(clean_line) > 10:  # Only meaningful suggestions
                suggestions.append(CodeSuggestion(
                    title=clean_line[:60] + "..." if len(clean_line) > 60 else clean_line,
                    description=clean_line,
                    confidence=0.85
                ))
    
    return suggestions[:4]  # Limit to top 4

def extract_code_examples(response: str) -> List[str]:
    """Extract code examples from AI response"""
    examples = []
    lines = response.split('\n')
    in_code_block = False
    current_example = []
    
    for line in lines:
        if line.strip().startswith('```'):
            if in_code_block:
                if current_example:
                    examples.append('\n'.join(current_example))
                    current_example = []
                in_code_block = False
            else:
                in_code_block = True
        elif in_code_block:
            current_example.append(line)
    
    return examples[:2]  # Limit to 2 examples

# API Endpoints
@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "message": "Code Whisperer API - Ready!",
        "description": "AI-powered code assistant with Gemini integration",
        "version": "1.0.0",
        "status": "operational",
        "endpoints": {
            "query": "/api/v1/query",
            "health": "/health",
            "docs": "/docs"
        },
        "gemini_status": "connected" if gemini_client else "mocked"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    gemini_status = "connected"
    
    if gemini_client:
        try:
            # Quick health test
            response = gemini_client.models.generate_content(
                model="gemini-1.5-flash",
                contents="Health check - respond with OK"
            )
            gemini_status = "healthy" if response.text else "degraded"
        except:
            gemini_status = "error"
    else:
        gemini_status = "mocked"
    
    return {
        "status": "healthy",
        "service": "Code Whisperer API",
        "version": "1.0.0",
        "timestamp": datetime.now().isoformat(),
        "dependencies": {
            "gemini_api": gemini_status,
            "fastapi": "operational"
        }
    }

@app.post("/api/v1/query", response_model=QueryResponse)
async def query_code(request: QueryRequest):
    """
    Analyze code with AI assistance
    Main endpoint for code analysis queries
    """
    start_time = time.time()
    query_id = str(uuid.uuid4())
    
    try:
        if gemini_client:
            # Real Gemini integration
            prompt = build_prompt(request.query_type.value, request.query_text, request.code_context)
            
            response = gemini_client.models.generate_content(
                model="gemini-1.5-flash",
                contents=prompt
            )
            
            ai_response = response.text.strip()
            suggestions = extract_suggestions(ai_response)
            code_examples = extract_code_examples(ai_response)
            confidence = 0.9 if len(ai_response) > 200 else 0.7
            
        else:
            # Mock response for development
            ai_response = f"""
This {request.code_context.language} code in {request.code_context.file_path} appears to implement the following functionality:

{request.query_text}

The selected code shows a {request.query_type.value} scenario that could benefit from:
1. Adding proper error handling
2. Improving code documentation
3. Following best practices for {request.code_context.language}

This is a mock response since Gemini API is not configured.
"""
            suggestions = [
                CodeSuggestion(
                    title="Add error handling",
                    description="Consider adding try-catch blocks for robust error handling",
                    confidence=0.8
                ),
                CodeSuggestion(
                    title="Improve documentation",
                    description="Add comments and docstrings to explain the code functionality",
                    confidence=0.9
                )
            ]
            code_examples = [f"# Example {request.code_context.language} improvement"]
            confidence = 0.75
        
        processing_time = int((time.time() - start_time) * 1000)
        
        return QueryResponse(
            query_id=query_id,
            query_type=request.query_type,
            explanation=ai_response,
            suggestions=suggestions,
            code_examples=code_examples,
            confidence=confidence,
            processing_time_ms=processing_time
        )
        
    except Exception as e:
        # Error handling
        processing_time = int((time.time() - start_time) * 1000)
        
        return QueryResponse(
            query_id=query_id,
            query_type=request.query_type,
            explanation=f"Error processing request: {str(e)}",
            suggestions=[],
            code_examples=[],
            confidence=0.0,
            processing_time_ms=processing_time
        )

# Test endpoint for easy testing
@app.post("/test")
async def test_endpoint(data: dict):
    """Simple test endpoint for debugging"""
    return {
        "message": "Test successful!",
        "received_data": data,
        "timestamp": datetime.now().isoformat(),
        "server_status": "operational"
    }

if __name__ == "__main__":
    # Get configuration from environment
    host = os.getenv("API_HOST", "0.0.0.0")
    port = int(os.getenv("API_PORT", 8000))
    
    print("🚀 Starting Code Whisperer API Server")
    print(f"📍 Server: http://{host}:{port}")
    print(f"📚 Docs: http://{host}:{port}/docs")
    print(f"🔑 Gemini: {'Connected' if gemini_client else 'Mocked (set GOOGLE_API_KEY)'}")
    print("=" * 50)
    
    # Run the server
    uvicorn.run(
        "simple_server:app",
        host=host,
        port=port,
        reload=True,
        log_level="info"
    ) 