// Code Whisperer Webview Client-side Script

// Get VS Code API reference
const vscode = acquireVsCodeApi();

// DOM elements
let queryInput;
let submitBtn;
let clearBtn;
let responseContainer;
let responseContent;
let loadingIndicator;

// Application state
let state = {
    isLoading: false,
    currentQuery: '',
    lastResponse: null
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    initializeElements();
    setupEventListeners();
    restoreState();
});

function initializeElements() {
    queryInput = document.getElementById('queryInput');
    submitBtn = document.getElementById('submitBtn');
    clearBtn = document.getElementById('clearBtn');
    responseContainer = document.getElementById('responseContainer');
    responseContent = document.getElementById('responseContent');
    loadingIndicator = document.getElementById('loadingIndicator');

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
    submitBtn.disabled = !hasText || state.isLoading;
}

function handleSubmit() {
    const query = queryInput.value.trim();
    
    if (!query) {
        showError('Please enter a query or question about your code.');
        return;
    }

    // Update state
    state.isLoading = true;
    state.currentQuery = query;
    updateState();

    // Show loading state
    setLoadingState(true);

    // Get current editor context (if any)
    const message = {
        type: 'query',
        query: query,
        timestamp: Date.now()
    };

    // Send message to extension
    vscode.postMessage(message);
}

function handleClear() {
    queryInput.value = '';
    hideResponse();
    updateSubmitButtonState();
    state.currentQuery = '';
    state.lastResponse = null;
    updateState();
    queryInput.focus();
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
        case 'context':
            handleContextUpdate(message);
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
    showResponse(message.answer, message.sources || []);
}

function handleError(message) {
    state.isLoading = false;
    updateState();

    setLoadingState(false);
    showError(message.error || 'An error occurred while processing your query.');
}

function handleContextUpdate(message) {
    // Handle context updates from the extension
    // This could include selected text, current file info, etc.
    console.log('Context update:', message);
}

function setLoadingState(loading) {
    if (loading) {
        showLoading();
        submitBtn.disabled = true;
        submitBtn.textContent = 'Processing...';
    } else {
        hideLoading();
        updateSubmitButtonState();
        submitBtn.textContent = 'Ask Code Whisperer';
    }
}

function showResponse(answer, sources = []) {
    responseContainer.classList.remove('hidden');
    
    // Clear previous content
    responseContent.innerHTML = '';
    
    // Create response content
    const answerDiv = document.createElement('div');
    answerDiv.className = 'success';
    answerDiv.textContent = answer;
    responseContent.appendChild(answerDiv);
    
    // Add sources if available
    if (sources && sources.length > 0) {
        const sourcesDiv = document.createElement('div');
        sourcesDiv.className = 'sources';
        
        const sourcesTitle = document.createElement('h4');
        sourcesTitle.textContent = 'Sources:';
        sourcesDiv.appendChild(sourcesTitle);
        
        const sourcesList = document.createElement('ul');
        sources.forEach(source => {
            const listItem = document.createElement('li');
            listItem.textContent = source;
            sourcesList.appendChild(listItem);
        });
        sourcesDiv.appendChild(sourcesList);
        
        responseContent.appendChild(sourcesDiv);
    }
    
    // Scroll to response
    responseContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function showError(errorMessage) {
    responseContainer.classList.remove('hidden');
    
    responseContent.innerHTML = '';
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error';
    errorDiv.textContent = errorMessage;
    responseContent.appendChild(errorDiv);
    
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
        isLoading: state.isLoading,
        lastResponse: state.lastResponse
    });
}

function restoreState() {
    const previousState = vscode.getState();
    if (previousState) {
        state = { ...state, ...previousState };
        
        if (state.currentQuery) {
            queryInput.value = state.currentQuery;
            autoResizeTextarea();
            updateSubmitButtonState();
        }
        
        if (state.lastResponse && !state.isLoading) {
            showResponse(state.lastResponse.answer, state.lastResponse.sources);
        }
    }
}

// Utility functions
function formatCode(code) {
    // Basic code formatting for display
    return code.replace(/```(\w+)?\n([\s\S]*?)```/g, function(match, lang, code) {
        return `<pre><code class="language-${lang || 'text'}">${escapeHtml(code.trim())}</code></pre>`;
    });
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
    state
}; 