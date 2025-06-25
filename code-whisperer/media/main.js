// Code Whisperer Webview Client-side Script

// Get VS Code API reference
const vscode = acquireVsCodeApi();

// DOM elements
let queryInput;
let queryTypeSelect;
let submitBtn;
let clearBtn;
let testConnectionBtn;
let responseContainer;
let responseContent;
let loadingIndicator;
let connectionStatus;
let responseTime;
let responseConfidence;

// Application state
let state = {
    isLoading: false,
    currentQuery: '',
    currentQueryType: 'explain',
    lastResponse: null,
    connectionStatus: 'unknown'
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    initializeElements();
    setupEventListeners();
    restoreState();
});

function initializeElements() {
    queryInput = document.getElementById('queryInput');
    queryTypeSelect = document.getElementById('queryTypeSelect');
    submitBtn = document.getElementById('submitBtn');
    clearBtn = document.getElementById('clearBtn');
    testConnectionBtn = document.getElementById('testConnectionBtn');
    responseContainer = document.getElementById('responseContainer');
    responseContent = document.getElementById('responseContent');
    loadingIndicator = document.getElementById('loadingIndicator');
    connectionStatus = document.getElementById('connectionStatus');
    responseTime = document.getElementById('responseTime');
    responseConfidence = document.getElementById('responseConfidence');

    if (!queryInput || !submitBtn || !responseContainer) {
        console.error('Required DOM elements not found');
        return;
    }
}

function setupEventListeners() {
    // Submit button click
    submitBtn.addEventListener('click', handleSubmit);
    
    // Clear button click
    if (clearBtn) {
        clearBtn.addEventListener('click', handleClear);
    }

    // Test connection button
    if (testConnectionBtn) {
        testConnectionBtn.addEventListener('click', handleTestConnection);
    }

    // Query type selection
    if (queryTypeSelect) {
        queryTypeSelect.addEventListener('change', function() {
            state.currentQueryType = queryTypeSelect.value;
            updateState();
        });
    }

    // Enter key in textarea (Ctrl+Enter to submit)
    queryInput.addEventListener('keydown', function(event) {
        if (event.ctrlKey && event.key === 'Enter') {
            event.preventDefault();
            handleSubmit();
        }
    });

    // Auto-resize textarea
    queryInput.addEventListener('input', function() {
        autoResizeTextarea();
        updateSubmitButtonState();
    });

    // Listen for messages from the extension
    window.addEventListener('message', handleMessage);
}

function autoResizeTextarea() {
    queryInput.style.height = 'auto';
    queryInput.style.height = Math.min(queryInput.scrollHeight, 300) + 'px';
}

function updateSubmitButtonState() {
    const hasText = queryInput.value.trim().length > 0;
    const isConnected = state.connectionStatus === 'connected';
    submitBtn.disabled = !hasText || state.isLoading || !isConnected;
}

function handleSubmit() {
    const query = queryInput.value.trim();
    const queryType = queryTypeSelect ? queryTypeSelect.value : 'explain';
    
    if (!query) {
        showError('Please enter a query or question about your code.');
        return;
    }

    if (state.connectionStatus !== 'connected') {
        showError('Backend connection is not available. Please check if the server is running on localhost:8002.');
        return;
    }

    // Update state
    state.isLoading = true;
    state.currentQuery = query;
    state.currentQueryType = queryType;
    updateState();

    // Show loading state
    setLoadingState(true);

    // Send message to extension
    const message = {
        type: 'query',
        query: query,
        queryType: queryType,
        timestamp: Date.now()
    };

    vscode.postMessage(message);
}

function handleClear() {
    queryInput.value = '';
    if (queryTypeSelect) {
        queryTypeSelect.value = 'explain';
    }
    hideResponse();
    updateSubmitButtonState();
    state.currentQuery = '';
    state.currentQueryType = 'explain';
    state.lastResponse = null;
    updateState();
    queryInput.focus();
}

function handleTestConnection() {
    setConnectionStatus('testing', '🔄 Testing connection...');
    vscode.postMessage({ type: 'testConnection' });
}

function handleMessage(event) {
    const message = event.data;
    
    switch (message.type) {
        case 'response':
            handleQueryResponse(message);
            break;
        case 'error':
            handleError(message);
            break;
        case 'connectionStatus':
            handleConnectionStatus(message);
            break;
        case 'context':
            handleContextUpdate(message);
            break;
        case 'autoAnalyze':
            handleAutoAnalyze(message);
            break;
        default:
            console.warn('Unknown message type:', message.type);
    }
}

function handleQueryResponse(message) {
    state.isLoading = false;
    state.lastResponse = message;
    updateState();

    setLoadingState(false);
    showResponse(message);
}

function handleError(message) {
    state.isLoading = false;
    updateState();

    setLoadingState(false);
    showError(message.error || 'An error occurred while processing your query.', message.details);
}

function handleConnectionStatus(message) {
    switch (message.status) {
        case 'connected':
            setConnectionStatus('connected', `✅ Connected (v${message.version || '1.0'})`);
            break;
        case 'disconnected':
            setConnectionStatus('disconnected', '⚠️ Disconnected');
            break;
        case 'error':
            setConnectionStatus('error', `❌ Connection Error: ${message.error}`);
            break;
        default:
            setConnectionStatus('unknown', '🔄 Checking...');
    }
}

function setConnectionStatus(status, text) {
    state.connectionStatus = status;
    updateState();
    
    if (connectionStatus) {
        const indicator = connectionStatus.querySelector('.status-indicator');
        const textEl = connectionStatus.querySelector('.status-text');
        
        if (indicator && textEl) {
            textEl.textContent = text;
            
            // Update styling based on status
            connectionStatus.className = `connection-status status-${status}`;
        }
    }
    
    updateSubmitButtonState();
}

function handleContextUpdate(message) {
    console.log('Context update:', message);
}

function handleAutoAnalyze(message) {
    // Set the default query
    if (queryInput) {
        queryInput.value = message.defaultQuery || 'Analyze this code and explain what it does';
        autoResizeTextarea();
    }
    
    // Set query type to 'explain' by default
    if (queryTypeSelect) {
        queryTypeSelect.value = 'explain';
    }
    
    // Update state
    state.currentQueryType = 'explain';
    updateState();
    updateSubmitButtonState();
    
    // Show a message indicating the code was received
    const fileName = message.fileName ? message.fileName.split(/[/\\]/).pop() : 'selected code';
    const codeLength = message.code ? message.code.length : 0;
    
    showInfo(`📄 Analyzing code from ${fileName} (${codeLength} characters)`);
    
    // Auto-submit if connection is available
    if (state.connectionStatus === 'connected') {
        setTimeout(() => {
            handleSubmit();
        }, 1000);
    } else {
        showError('Backend connection is not available. Please check if the server is running.');
    }
}

function setLoadingState(loading) {
    if (loading) {
        showLoading();
        submitBtn.disabled = true;
        submitBtn.textContent = 'Analyzing...';
    } else {
        hideLoading();
        updateSubmitButtonState();
        submitBtn.textContent = 'Ask Code Whisperer';
    }
}

function showResponse(response) {
    responseContainer.classList.remove('hidden');
    
    // Clear previous content
    responseContent.innerHTML = '';
    
    // Update metadata
    if (responseTime) {
        responseTime.textContent = `⏱️ ${response.processingTime}ms`;
    }
    if (responseConfidence) {
        const confidence = Math.round(response.confidence * 100);
        responseConfidence.textContent = `🎯 ${confidence}% confidence`;
    }
    
    // Main explanation
    if (response.explanation) {
        const explanationDiv = document.createElement('div');
        explanationDiv.className = 'ai-explanation';
        explanationDiv.innerHTML = `
            <h3>🤖 AI Analysis</h3>
            <div class="explanation-content">${formatText(response.explanation)}</div>
        `;
        responseContent.appendChild(explanationDiv);
    }
    
    // Suggestions
    if (response.suggestions && response.suggestions.length > 0) {
        const suggestionsDiv = document.createElement('div');
        suggestionsDiv.className = 'ai-suggestions';
        
        let suggestionsHtml = '<h3>💡 Suggestions</h3>';
        response.suggestions.forEach((suggestion, index) => {
            const confidencePercentage = Math.round(suggestion.confidence * 100);
            suggestionsHtml += `
                <div class="suggestion-item">
                    <div class="suggestion-header">
                        <h4>${suggestion.title}</h4>
                        <span class="suggestion-confidence">${confidencePercentage}%</span>
                    </div>
                    <p>${formatText(suggestion.description)}</p>
                    ${suggestion.code_snippet ? `<pre><code>${escapeHtml(suggestion.code_snippet)}</code></pre>` : ''}
                </div>
            `;
        });
        
        suggestionsDiv.innerHTML = suggestionsHtml;
        responseContent.appendChild(suggestionsDiv);
    }
    
    // Code examples
    if (response.codeExamples && response.codeExamples.length > 0) {
        const examplesDiv = document.createElement('div');
        examplesDiv.className = 'code-examples';
        
        let examplesHtml = '<h3>📝 Code Examples</h3>';
        response.codeExamples.forEach((example, index) => {
            examplesHtml += `
                <div class="example-item">
                    <pre><code>${escapeHtml(example)}</code></pre>
                </div>
            `;
        });
        
        examplesDiv.innerHTML = examplesHtml;
        responseContent.appendChild(examplesDiv);
    }
    
    // Scroll to response
    responseContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function showError(errorMessage, details) {
    responseContainer.classList.remove('hidden');
    
    // Clear metadata
    if (responseTime) responseTime.textContent = '';
    if (responseConfidence) responseConfidence.textContent = '';
    
    responseContent.innerHTML = '';
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    
    let errorHtml = `
        <div class="error">
            <h3>❌ Error</h3>
            <p>${escapeHtml(errorMessage)}</p>
        </div>
    `;
    
    if (details && details.trim()) {
        errorHtml += `
            <details class="error-details">
                <summary>Technical Details</summary>
                <pre>${escapeHtml(details)}</pre>
            </details>
        `;
    }
    
    errorDiv.innerHTML = errorHtml;
    responseContent.appendChild(errorDiv);
    
    responseContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function showInfo(infoMessage) {
    responseContainer.classList.remove('hidden');
    
    // Clear metadata
    if (responseTime) responseTime.textContent = '';
    if (responseConfidence) responseConfidence.textContent = '';
    
    responseContent.innerHTML = '';
    const infoDiv = document.createElement('div');
    infoDiv.className = 'info-message';
    
    const infoHtml = `
        <div class="info">
            <h3>ℹ️ Info</h3>
            <p>${escapeHtml(infoMessage)}</p>
        </div>
    `;
    
    infoDiv.innerHTML = infoHtml;
    responseContent.appendChild(infoDiv);
    
    responseContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function hideResponse() {
    responseContainer.classList.add('hidden');
}

function showLoading() {
    responseContainer.classList.remove('hidden');
    loadingIndicator.classList.remove('hidden');
    responseContent.classList.add('hidden');
}

function hideLoading() {
    loadingIndicator.classList.add('hidden');
    responseContent.classList.remove('hidden');
}

// State management for persistence
function updateState() {
    vscode.setState({
        query: state.currentQuery,
        queryType: state.currentQueryType,
        isLoading: state.isLoading,
        lastResponse: state.lastResponse,
        connectionStatus: state.connectionStatus
    });
}

function restoreState() {
    const previousState = vscode.getState();
    if (previousState) {
        state = { ...state, ...previousState };
        
        if (state.currentQuery) {
            queryInput.value = state.currentQuery;
            autoResizeTextarea();
        }
        
        if (state.currentQueryType && queryTypeSelect) {
            queryTypeSelect.value = state.currentQueryType;
        }
        
        if (state.lastResponse && !state.isLoading) {
            showResponse(state.lastResponse);
        }
        
        updateSubmitButtonState();
    }
}

// Utility functions
function formatText(text) {
    // Convert basic markdown-like formatting
    return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`(.*?)`/g, '<code>$1</code>')
        .replace(/\n/g, '<br>');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Export for potential future use
window.CodeWhisperer = {
    handleSubmit,
    handleClear,
    handleTestConnection,
    state
}; 