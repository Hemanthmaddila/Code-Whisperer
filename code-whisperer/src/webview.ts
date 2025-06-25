import * as vscode from 'vscode';
import * as path from 'path';

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
    }

    private async handleWebviewMessage(message: any): Promise<void> {
        switch (message.type) {
            case 'query':
                await this.handleQuery(message);
                break;
            default:
                console.warn('Unknown message type:', message.type);
        }
    }

    private async handleQuery(message: { query: string; timestamp: number }): Promise<void> {
        try {
            // Get current editor context
            const editor = vscode.window.activeTextEditor;
            const selectedText = editor?.document.getText(editor.selection);
            const currentFileName = editor?.document.fileName;

            // For now, return a mock response
            // TODO: Integrate with backend API
            const response = await this.getMockResponse(message.query, selectedText);

            // Send response back to webview
            this.panel?.webview.postMessage({
                type: 'response',
                answer: response.answer,
                sources: response.sources
            });

        } catch (error) {
            console.error('Error handling query:', error);
            this.panel?.webview.postMessage({
                type: 'error',
                error: error instanceof Error ? error.message : 'An unknown error occurred'
            });
        }
    }

    private async getMockResponse(query: string, selectedText?: string): Promise<{ answer: string; sources: string[] }> {
        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        let answer = '';
        const sources: string[] = [];

        if (selectedText) {
            answer = `Based on the selected code:\n\n${selectedText}\n\nThis appears to be a code snippet. Your query "${query}" relates to this code. This is a mock response - the actual AI analysis will be implemented when the backend is connected.`;
            sources.push('Selected code from current editor');
        } else {
            answer = `Your query: "${query}"\n\nThis is a mock response from Code Whisperer. The actual RAG-powered AI analysis will be implemented when the FastAPI backend is connected. For now, this demonstrates the webview interface and message passing functionality.`;
        }

        sources.push('Code Whisperer Knowledge Base (Mock)');
        return { answer, sources };
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
            <p>AI-powered code assistant with RAG capabilities</p>
        </div>

        <div class="query-section">
            <div class="form-group">
                <label for="queryInput">Ask about your code:</label>
                <textarea 
                    id="queryInput" 
                    placeholder="Enter your question about the codebase, explain a function, ask for refactoring suggestions, or get help with debugging...&#10;&#10;Examples:&#10;• What does this function do?&#10;• How can I optimize this code?&#10;• Explain the logic in the selected code&#10;• Find similar functions in my codebase"
                    rows="4"
                ></textarea>
            </div>
            
            <div class="button-group">
                <button id="clearBtn" class="btn btn-secondary">Clear</button>
                <button id="submitBtn" class="btn btn-primary" disabled>Ask Code Whisperer</button>
            </div>
        </div>

        <div class="response-section">
            <div id="responseContainer" class="response-container hidden">
                <div class="response-header">
                    AI Response
                </div>
                
                <div id="loadingIndicator" class="loading hidden">
                    <div class="loading-spinner"></div>
                    <span>Analyzing your code...</span>
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