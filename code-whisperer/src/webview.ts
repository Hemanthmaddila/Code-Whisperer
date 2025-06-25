import * as vscode from 'vscode';
import * as path from 'path';
import { apiClient, QueryRequest, QueryResponse } from './api';

export class CodeWhispererWebviewProvider {
    private static readonly viewType = 'codewhisperer';
    private panel: vscode.WebviewPanel | undefined;
    private disposables: vscode.Disposable[] = [];

    constructor(private readonly context: vscode.ExtensionContext) {}

    public createOrShow(): void {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        // If we already have a panel, show it
        if (this.panel) {
            this.panel.reveal(column);
            return;
        }

        // Otherwise, create a new panel
        this.panel = vscode.window.createWebviewPanel(
            CodeWhispererWebviewProvider.viewType,
            'Code Whisperer',
            column || vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [
                    vscode.Uri.joinPath(this.context.extensionUri, 'media')
                ]
            }
        );

        // Set the HTML content
        this.panel.webview.html = this.getWebviewContent();

        // Handle messages from the webview
        this.panel.webview.onDidReceiveMessage(
            this.handleWebviewMessage.bind(this),
            undefined,
            this.disposables
        );

        // Clean up when the panel is closed
        this.panel.onDidDispose(() => this.dispose(), null, this.disposables);

        // Test backend connection when panel is created
        this.testBackendConnection();
    }

    public analyzeCode(selectedCode: string, fileName: string): void {
        // Make sure the panel is visible
        if (!this.panel) {
            this.createOrShow();
        } else {
            this.panel.reveal();
        }

        // Wait a bit for the webview to load, then trigger analysis
        setTimeout(() => {
            this.panel?.webview.postMessage({
                type: 'autoAnalyze',
                code: selectedCode,
                fileName: fileName,
                defaultQuery: 'Analyze this code and explain what it does'
            });
        }, 500);
    }

    private async testBackendConnection(): Promise<void> {
        try {
            const health = await apiClient.healthCheck();
            if (health) {
                console.log('✅ Backend connected:', health);
                this.panel?.webview.postMessage({
                    type: 'connectionStatus',
                    status: 'connected',
                    version: health.version,
                    geminiStatus: health.dependencies?.gemini_api
                });
            } else {
                console.warn('⚠️ Backend health check failed');
                this.panel?.webview.postMessage({
                    type: 'connectionStatus',
                    status: 'disconnected',
                    error: 'Health check failed'
                });
            }
        } catch (error) {
            console.error('❌ Backend connection failed:', error);
            this.panel?.webview.postMessage({
                type: 'connectionStatus',
                status: 'error',
                error: error instanceof Error ? error.message : 'Connection failed'
            });
        }
    }

    private async handleWebviewMessage(message: any): Promise<void> {
        switch (message.type) {
            case 'query':
                await this.handleQuery(message);
                break;
            case 'testConnection':
                await this.testBackendConnection();
                break;
            default:
                console.warn('Unknown message type:', message.type);
        }
    }

    private async handleQuery(message: { query: string; queryType?: string; timestamp: number }): Promise<void> {
        try {
            // Get current editor context
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                // Show a helpful message instead of an error
                this.panel?.webview.postMessage({
                    type: 'response',
                    queryId: 'no-editor',
                    explanation: `**No Code File Open**\n\nTo use Code Whisperer, please:\n\n1. **Open a code file** (any .py, .js, .ts, .java, etc.)\n2. **Select some code** or place your cursor in a function\n3. **Ask your question** and I'll analyze it!\n\nYou can also create a new file and paste some code to get started.`,
                    suggestions: [{
                        title: "Open a Code File",
                        description: "Use File → Open or Ctrl+O to open a code file, then try your query again.",
                        confidence: 1.0
                    }, {
                        title: "Create a New File", 
                        description: "Use File → New File or Ctrl+N, then paste some code and select a language mode.",
                        confidence: 1.0
                    }],
                    codeExamples: [
                        "// Example JavaScript function\nfunction calculateSum(a, b) {\n    return a + b;\n}",
                        "# Example Python function\ndef calculate_sum(a, b):\n    return a + b"
                    ],
                    confidence: 1.0,
                    processingTime: 1,
                    queryType: message.queryType || 'explain'
                });
                return;
            }

            const selectedText = editor.document.getText(editor.selection);
            const currentFileName = editor.document.fileName || 'untitled';
            const language = editor.document.languageId;
            const fullContent = editor.document.getText();

            // Determine selected code or nearby code
            let codeToAnalyze = selectedText;
            if (!selectedText || selectedText.trim().length < 5) {
                // If no selection, get the current line and some context
                const currentLine = editor.selection.active.line;
                const lineText = editor.document.lineAt(currentLine).text;
                const startLine = Math.max(0, currentLine - 2);
                const endLine = Math.min(editor.document.lineCount - 1, currentLine + 2);
                const range = new vscode.Range(startLine, 0, endLine, editor.document.lineAt(endLine).text.length);
                codeToAnalyze = editor.document.getText(range);
            }

            if (!codeToAnalyze || codeToAnalyze.trim().length < 3) {
                // Show helpful guidance instead of an error
                this.panel?.webview.postMessage({
                    type: 'response',
                    queryId: 'no-code-selection',
                    explanation: `**No Code Selected**\n\nTo get the best analysis:\n\n1. **Select some code** in your editor (highlight it)\n2. **Or place your cursor** inside a function or code block\n3. **Then ask your question** and I'll analyze that specific code!\n\nI can see you have a **${language}** file open (${path.basename(currentFileName)}), but I need you to select some code to analyze.`,
                    suggestions: [{
                        title: "Select Code to Analyze",
                        description: "Highlight the specific code you want me to look at, then try your query again.",
                        confidence: 1.0
                    }, {
                        title: "Place Cursor in Code",
                        description: "Click inside a function or code block, and I'll analyze the surrounding context.",
                        confidence: 1.0
                    }],
                    codeExamples: [],
                    confidence: 1.0,
                    processingTime: 1,
                    queryType: message.queryType || 'explain'
                });
                return;
            }

            // Build API request
            const queryType = message.queryType || 'explain';
            const request: QueryRequest = {
                query_type: queryType as any,
                query_text: message.query,
                code_context: {
                    file_path: path.basename(currentFileName),
                    language: language,
                    selected_code: codeToAnalyze,
                    full_file_content: fullContent.length < 10000 ? fullContent : undefined // Limit size
                },
                include_examples: true
            };

            console.log('🔍 Sending query to backend:', { queryType, query: message.query, codeLength: codeToAnalyze.length });

            // Call real API
            const response: QueryResponse = await apiClient.query(request);

            console.log('✅ Received AI response:', { 
                queryId: response.query_id, 
                confidence: response.confidence,
                processingTime: response.processing_time_ms,
                suggestionsCount: response.suggestions.length
            });

            // Send formatted response back to webview
            this.panel?.webview.postMessage({
                type: 'response',
                queryId: response.query_id,
                explanation: response.explanation,
                suggestions: response.suggestions,
                codeExamples: response.code_examples,
                confidence: response.confidence,
                processingTime: response.processing_time_ms,
                queryType: response.query_type
            });

        } catch (error) {
            console.error('❌ Error handling query:', error);
            this.panel?.webview.postMessage({
                type: 'error',
                error: error instanceof Error ? error.message : 'An unknown error occurred',
                details: error instanceof Error ? error.stack : undefined
            });
        }
    }

    private getWebviewContent(): string {
        const webview = this.panel!.webview;

        // Get URIs for local resources
        const stylesUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this.context.extensionUri, 'media', 'styles.css')
        );
        const scriptUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this.context.extensionUri, 'media', 'main.js')
        );

        // Generate a nonce for security
        const nonce = this.getNonce();

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}'; font-src ${webview.cspSource};">
    <link href="${stylesUri}" rel="stylesheet">
    <title>Code Whisperer</title>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🤖 Code Whisperer</h1>
            <p>AI-powered code assistant with Gemini integration</p>
            <div id="connectionStatus" class="connection-status">
                <span class="status-indicator">🔄</span>
                <span class="status-text">Checking connection...</span>
            </div>
        </div>

        <div class="query-section">
            <div class="form-group">
                <label for="queryTypeSelect">Analysis Type:</label>
                <select id="queryTypeSelect">
                    <option value="explain">Explain Code</option>
                    <option value="optimize">Optimize Performance</option>
                    <option value="debug">Debug Issues</option>
                    <option value="refactor">Refactor Code</option>
                    <option value="review">Code Review</option>
                    <option value="generate">Generate Code</option>
                </select>
            </div>
            
            <div class="form-group">
                <label for="queryInput">Ask about your code:</label>
                <textarea 
                    id="queryInput" 
                    placeholder="Enter your question about the code...&#10;&#10;Examples:&#10;• What does this function do?&#10;• How can I improve performance?&#10;• Are there any bugs in this code?&#10;• Suggest better variable names"
                    rows="4"
                ></textarea>
            </div>
            
            <div class="button-group">
                <button id="clearBtn" class="btn btn-secondary">Clear</button>
                <button id="submitBtn" class="btn btn-primary" disabled>Ask Code Whisperer</button>
                <button id="testConnectionBtn" class="btn btn-outline">Test Connection</button>
            </div>
        </div>

        <div class="response-section">
            <div id="responseContainer" class="response-container hidden">
                <div class="response-header">
                    <span>AI Response</span>
                    <div class="response-metadata">
                        <span id="responseTime"></span>
                        <span id="responseConfidence"></span>
                    </div>
                </div>
                
                <div id="loadingIndicator" class="loading hidden">
                    <div class="loading-spinner"></div>
                    <span>Analyzing your code with AI...</span>
                </div>
                
                <div id="responseContent" class="response-content">
                    <!-- Response will be inserted here -->
                </div>
            </div>
        </div>
    </div>

    <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
    }

    private getNonce(): string {
        let text = '';
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < 32; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }

    public dispose(): void {
        this.panel?.dispose();
        this.panel = undefined;

        // Clean up disposables
        while (this.disposables.length) {
            const disposable = this.disposables.pop();
            if (disposable) {
                disposable.dispose();
            }
        }
    }
} 