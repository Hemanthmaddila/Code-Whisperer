# Code Whisperer VS Code Extension Development Plan

## 🎯 Project Overview
**Code Whisperer** is a Retrieval-Augmented Generation (RAG) powered VS Code extension that helps developers understand and work with their codebase through natural language queries.

## 🏗️ Architecture Overview
- **Frontend**: VS Code Extension (TypeScript) with custom Webview UI
- **Backend**: FastAPI service (Python) with RAG pipeline
- **AI Engine**: Google Gemini LLM with LangChain orchestration
- **Vector Store**: Pinecone/ChromaDB for code embeddings
- **Deployment**: Docker + Google Cloud Run

---

## 📋 PHASE 1: Environment Setup & Project Scaffolding

### Step 1.1: Install Prerequisites
```bash
# Node.js and npm (for VS Code extension)
node --version  # Should be 16+
npm --version

# Python (for FastAPI backend)
python --version  # Should be 3.8+
pip --version

# Docker Desktop
docker --version

# VS Code Extension tools
npm install -g yo generator-code @vscode/vsce
```

### Step 1.2: Create VS Code Extension Project
```bash
# Create extension using Yeoman
cd "Code Whisperer"
npx --package yo --package generator-code -- yo code

# Select:
# - New Extension (TypeScript)
# - Name: Code Whisperer
# - Identifier: code-whisperer
# - Description: AI-powered code assistant with RAG capabilities
# - Initialize git: Yes
# - Bundle: No (for now)
# - Package manager: npm
```

### Step 1.3: Create Backend Project Structure
```bash
# Create backend directory
mkdir backend
cd backend

# Create Python virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Create initial structure
mkdir app
mkdir app/core
mkdir app/api
mkdir app/services
touch app/__init__.py
touch app/main.py
touch requirements.txt
touch Dockerfile
touch .env.example
```

---

## 📋 PHASE 2: Frontend Development (VS Code Extension)

### Step 2.1: Configure Extension Manifest
Edit `package.json`:
```json
{
  "contributes": {
    "commands": [
      {
        "command": "codewhisperer.start",
        "title": "Start Code Whisperer",
        "category": "Code Whisperer"
      }
    ],
    "menus": {
      "commandPalette": [
        {
          "command": "codewhisperer.start"
        }
      ]
    }
  }
}
```

### Step 2.2: Create Webview Interface
Create `src/webview.ts`:
- WebviewPanel creation and management
- HTML content generation with CSP
- Two-way communication setup

Create `media/` directory:
- `media/main.js` - Client-side webview logic
- `media/styles.css` - UI styling
- `media/vscode-codicons.css` - VS Code icons

### Step 2.3: Implement Core Extension Logic
Update `src/extension.ts`:
- Command registration
- Webview panel management
- Message handling between extension and webview
- API client for backend communication

### Step 2.4: Create API Client Module
Create `src/api.ts`:
- HTTP client for FastAPI backend
- Request/response type definitions
- Error handling and retry logic
- Mock responses for development

---

## 📋 PHASE 3: Backend Development (FastAPI RAG Service)

### Step 3.1: Setup FastAPI Application
Create `app/main.py`:
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Code Whisperer API", version="0.1.0")

# Configure CORS for VS Code extension
app.add_middleware(
    CORSMiddleware,
    allow_origins=["vscode-webview://*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
```

### Step 3.2: Install Dependencies
Create `requirements.txt`:
```
fastapi==0.104.1
uvicorn[standard]==0.24.0
langchain==0.0.340
langchain-google-genai==0.0.6
langchain-community==0.0.12
python-dotenv==1.0.0
pydantic==2.5.0
chromadb==0.4.18
tree-sitter==0.20.4
tree-sitter-python==0.20.4
tree-sitter-javascript==0.20.1
tree-sitter-typescript==0.20.2
sentence-transformers==2.2.2
```

### Step 3.3: Create Data Models
Create `app/core/models.py`:
```python
from pydantic import BaseModel
from typing import List, Optional

class IngestRequest(BaseModel):
    directory_path: str
    file_patterns: List[str] = ["*.py", "*.js", "*.ts", "*.jsx", "*.tsx"]

class QueryRequest(BaseModel):
    query: str
    code_context: Optional[str] = None
    max_results: int = 5

class QueryResponse(BaseModel):
    answer: str
    sources: List[str]
    confidence: float
```

### Step 3.4: Implement RAG Pipeline
Create `app/services/rag_service.py`:
- Document loading with LangChain
- Code-specific parsing with tree-sitter
- Intelligent chunking strategy
- Vector embedding generation
- Similarity search and retrieval

### Step 3.5: Create API Endpoints
Create `app/api/endpoints.py`:
- `/ingest` - Process and embed codebase
- `/query` - Handle user queries with RAG
- `/status` - Get ingestion status

---

## 📋 PHASE 4: Integration & Testing

### Step 4.1: Local Development Setup
Backend:
```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

Frontend:
```bash
# In VS Code, press F5 to launch Extension Development Host
```

### Step 4.2: Connect Frontend to Backend
- Update API client with local backend URL
- Test webview communication
- Implement error handling

### Step 4.3: End-to-End Testing
- Test code ingestion workflow
- Test query and response flow
- Validate webview UI updates
- Test with different programming languages

---

## 📋 PHASE 5: Deployment & Containerization

### Step 5.1: Create Dockerfile
```dockerfile
FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY ./app ./app

EXPOSE 8080

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080"]
```

### Step 5.2: Deploy to Google Cloud Run
```bash
# Build and deploy
gcloud builds submit --tag gcr.io/PROJECT-ID/codewhisperer-api
gcloud run deploy codewhisperer-service \
  --image gcr.io/PROJECT-ID/codewhisperer-api \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

### Step 5.3: Update Extension Configuration
- Update API client with production URL
- Add configuration settings for backend URL
- Implement environment switching

---

## 📋 PHASE 6: Publishing & Distribution

### Step 6.1: Prepare for Publishing
- Create high-quality README.md
- Add screenshots and demos
- Create icon and banner images
- Write comprehensive CHANGELOG.md

### Step 6.2: Create Publisher Account
- Set up Azure DevOps account
- Create VS Code Marketplace publisher
- Generate Personal Access Token

### Step 6.3: Package and Publish
```bash
# Package extension
vsce package

# Test installation
code --install-extension code-whisperer-0.1.0.vsix

# Publish to marketplace
vsce login <publisher-name>
vsce publish
```

---

## 🚀 Getting Started

### Quick Start Commands
```bash
# 1. Clone/setup project
git clone <repo-url> && cd code-whisperer

# 2. Setup backend
cd backend && python -m venv venv && source venv/bin/activate
pip install -r requirements.txt

# 3. Setup frontend
cd .. && npm install

# 4. Start development
# Terminal 1: Backend
cd backend && uvicorn app.main:app --reload

# Terminal 2: Frontend (VS Code)
# Press F5 in VS Code to launch Extension Development Host
```

---

## 📚 Key Resources

- [VS Code Extension API](https://code.visualstudio.com/api)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [LangChain Documentation](https://python.langchain.com/)
- [Google Cloud Run](https://cloud.google.com/run)

---

## 🔄 Development Workflow

1. **Feature Development**: Work in feature branches
2. **Local Testing**: Use Extension Development Host
3. **Backend Testing**: Use FastAPI's automatic docs at `/docs`
4. **Integration Testing**: Test full workflow end-to-end
5. **Deployment**: Deploy backend changes first, then extension
6. **Publishing**: Use semantic versioning for releases

---

## 📝 Next Steps

1. ✅ **Phase 1**: Environment Setup
2. ⏳ **Phase 2**: Frontend Development
3. ⏳ **Phase 3**: Backend Development
4. ⏳ **Phase 4**: Integration
5. ⏳ **Phase 5**: Deployment
6. ⏳ **Phase 6**: Publishing

Let's begin with **Phase 1: Environment Setup**! 