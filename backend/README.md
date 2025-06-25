# Code Whisperer Backend

FastAPI-based backend service for the Code Whisperer VS Code extension, providing RAG (Retrieval-Augmented Generation) capabilities for intelligent code analysis.

## 🚀 Quick Start

### Prerequisites
- Python 3.8+ 
- pip or poetry package manager

### Development Setup

1. **Create virtual environment**:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Create environment file**:
   ```bash
   cp env_template.txt .env
   # Edit .env with your actual API keys
   ```

4. **Run the development server**:
   ```bash
   python -m app.main
   # Or: uvicorn app.main:app --reload --port 8000
   ```

5. **Access the API**:
   - API Documentation: http://localhost:8000/docs
   - Health Check: http://localhost:8000/health
   - Root Endpoint: http://localhost:8000/

## 📁 Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI application entry point
│   ├── core/                # Core application components
│   │   ├── __init__.py
│   │   ├── models.py        # Pydantic models (Phase 3)
│   │   └── config.py        # Configuration settings (Phase 3)
│   ├── api/                 # API endpoints
│   │   ├── __init__.py
│   │   ├── endpoints.py     # API route handlers (Phase 3)
│   │   └── dependencies.py  # Dependency injection (Phase 3)
│   └── services/            # Business logic services
│       ├── __init__.py
│       ├── rag_service.py   # RAG pipeline implementation (Phase 3)
│       ├── vector_store.py  # Vector database operations (Phase 3)
│       └── code_parser.py   # Code parsing with tree-sitter (Phase 3)
├── requirements.txt         # Python dependencies
├── env_template.txt         # Environment variables template
├── Dockerfile              # Container image definition
└── README.md               # This file
```

## 🔌 API Endpoints

### Current Status (Phase 2 Complete)
- ✅ `GET /` - Root endpoint with API information
- ✅ `GET /health` - Health check endpoint
- 🚧 `POST /query` - Placeholder for RAG queries
- 🚧 `POST /ingest` - Placeholder for codebase ingestion
- 🚧 `GET /status` - Placeholder for ingestion status

### Phase 3 Implementation Plan
- **`POST /query`** - Process natural language queries about code
- **`POST /ingest`** - Ingest and vectorize codebase
- **`GET /status`** - Get ingestion and system status

## 🛠️ Technology Stack

- **FastAPI** - Modern, fast web framework for building APIs
- **LangChain** - Framework for building RAG applications
- **Google Gemini** - Large Language Model for code understanding
- **ChromaDB** - Vector database for development
- **Pinecone** - Vector database for production (optional)
- **tree-sitter** - Code parsing and syntax analysis
- **sentence-transformers** - Code embedding models

## 🧪 Development Workflow

### Running Tests
```bash
pytest
```

### Code Quality
```bash
# Format code
black app/

# Type checking
mypy app/

# Linting
flake8 app/
```

### Docker Development
```bash
# Build image
docker build -t codewhisperer-backend .

# Run container
docker run -p 8000:8080 codewhisperer-backend
```

## 🔐 Environment Variables

Copy `env_template.txt` to `.env` and configure:

| Variable | Description | Required |
|----------|-------------|----------|
| `GOOGLE_API_KEY` | Google Gemini API key | Yes |
| `PINECONE_API_KEY` | Pinecone API key (production) | No |
| `VECTOR_DB_TYPE` | Vector database type (chromadb/pinecone) | No |
| `CHUNK_SIZE` | Text chunk size for processing | No |
| `LOG_LEVEL` | Logging level (INFO/DEBUG/ERROR) | No |

## 📋 Phase 3 Implementation Checklist

- [ ] Implement Pydantic models for request/response schemas
- [ ] Create RAG service with LangChain integration
- [ ] Setup vector database (ChromaDB) operations
- [ ] Implement code parsing with tree-sitter
- [ ] Add embedding model integration
- [ ] Create query processing pipeline
- [ ] Implement codebase ingestion logic
- [ ] Add comprehensive error handling
- [ ] Setup logging and monitoring
- [ ] Write unit and integration tests

## 🚀 Deployment

### Local Deployment
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Docker Deployment
```bash
docker build -t codewhisperer-backend .
docker run -p 8000:8080 -e GOOGLE_API_KEY=your_key codewhisperer-backend
```

### Google Cloud Run (Phase 5)
```bash
gcloud builds submit --tag gcr.io/PROJECT-ID/codewhisperer-api
gcloud run deploy codewhisperer-service --image gcr.io/PROJECT-ID/codewhisperer-api
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Implement changes with tests
4. Submit a pull request

## 📝 License

MIT License - see the LICENSE file for details. 