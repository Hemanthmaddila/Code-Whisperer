// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { CodeWhispererWebviewProvider } from './webview';
import { apiClient } from './api';

let webviewProvider: CodeWhispererWebviewProvider;

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	console.log('Code Whisperer extension is now active!');
	
	// Show immediate confirmation that extension loaded
	vscode.window.showInformationMessage('🎉 Code Whisperer Extension Activated Successfully!');

	// Initialize the webview provider
	webviewProvider = new CodeWhispererWebviewProvider(context);

	// Register the main command to start Code Whisperer
	const startCommand = vscode.commands.registerCommand('codewhisperer.start', () => {
		webviewProvider.createOrShow();
	});

	// Register command to analyze selected code
	const analyzeSelectionCommand = vscode.commands.registerCommand('codewhisperer.analyzeSelection', () => {
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			vscode.window.showErrorMessage('No active editor found. Please open a file first.');
			return;
		}

		const selection = editor.selection;
		const selectedText = editor.document.getText(selection);
		
		if (!selectedText.trim()) {
			vscode.window.showWarningMessage('Please select some code to analyze.');
			return;
		}

		// Open the webview and send the selected code for analysis
		webviewProvider.createOrShow();
		webviewProvider.analyzeCode(selectedText, editor.document.fileName);
	});

	// Register command to analyze code (general)
	const analyzeCodeCommand = vscode.commands.registerCommand('codewhisperer.analyzeCode', () => {
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			vscode.window.showErrorMessage('No active editor found. Please open a file first.');
			return;
		}

		// Get all content if no selection
		const selection = editor.selection;
		const selectedText = selection.isEmpty ? 
			editor.document.getText() : 
			editor.document.getText(selection);

		if (!selectedText.trim()) {
			vscode.window.showWarningMessage('No code found to analyze.');
			return;
		}

		// Open the webview and send the code for analysis
		webviewProvider.createOrShow();
		webviewProvider.analyzeCode(selectedText, editor.document.fileName);
	});

	// Register command to show interface
	const showInterfaceCommand = vscode.commands.registerCommand('codewhisperer.showInterface', () => {
		webviewProvider.createOrShow();
	});

	// Add a simple test command to verify registration works
	const testCommand = vscode.commands.registerCommand('codewhisperer.test', async () => {
		vscode.window.showInformationMessage('🧪 Testing Code Whisperer API...');
		
		try {
			// Test health check first
			const health = await apiClient.healthCheck();
			console.log('Health check result:', health);
			
			if (!health) {
				vscode.window.showErrorMessage('❌ Backend health check failed');
				return;
			}

			// Test actual query
			const testRequest = {
				query_type: 'explain' as const,
				query_text: 'What does this code do?',
				code_context: {
					file_path: 'test.py',
					language: 'python',
					selected_code: 'def hello():\n    print("Hello World")',
					full_file_content: ''
				},
				include_examples: true
			};

			console.log('Sending test query:', testRequest);
			const response = await apiClient.query(testRequest);
			console.log('Query response:', response);
			
			vscode.window.showInformationMessage(`✅ API Test Success! Response: ${response.explanation.substring(0, 100)}...`);
			
		} catch (error) {
			console.error('API test failed:', error);
			vscode.window.showErrorMessage(`❌ API Test Failed: ${error}`);
		}
	});

	// Register additional commands for future use
	const ingestCommand = vscode.commands.registerCommand('codewhisperer.ingest', async () => {
		// TODO: Implement codebase ingestion
		vscode.window.showInformationMessage('Codebase ingestion will be implemented in Phase 3 (Backend Development)');
	});

	// Add commands to subscriptions for proper cleanup
	context.subscriptions.push(
		startCommand, 
		analyzeSelectionCommand, 
		analyzeCodeCommand, 
		showInterfaceCommand, 
		testCommand, 
		ingestCommand
	);

	// Show welcome message on first activation
	if (context.globalState.get('codewhisperer.firstActivation', true)) {
		vscode.window.showInformationMessage(
			'Welcome to Code Whisperer! Use "Code Whisperer: Start" from the Command Palette to begin.',
			'Open Code Whisperer'
		).then(selection => {
			if (selection === 'Open Code Whisperer') {
				webviewProvider.createOrShow();
			}
		});
		context.globalState.update('codewhisperer.firstActivation', false);
	}
}

// This method is called when your extension is deactivated
export function deactivate() {
	// Clean up webview provider
	if (webviewProvider) {
		webviewProvider.dispose();
	}
}
