// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { CodeWhispererWebviewProvider } from './webview';

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

	// Add a simple test command to verify registration works
	const testCommand = vscode.commands.registerCommand('codewhisperer.test', () => {
		vscode.window.showInformationMessage('✅ Code Whisperer Test Command Works!');
	});

	// Register additional commands for future use
	const ingestCommand = vscode.commands.registerCommand('codewhisperer.ingest', async () => {
		// TODO: Implement codebase ingestion
		vscode.window.showInformationMessage('Codebase ingestion will be implemented in Phase 3 (Backend Development)');
	});

	// Add commands to subscriptions for proper cleanup
	context.subscriptions.push(startCommand, testCommand, ingestCommand);

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
