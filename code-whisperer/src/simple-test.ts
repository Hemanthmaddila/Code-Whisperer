import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    console.log('SIMPLE TEST: Extension activated!');
    
    // Show immediate notification
    vscode.window.showInformationMessage('🚀 SIMPLE TEST: Extension is working!');
    
    // Register a simple command
    const command = vscode.commands.registerCommand('simple.test', () => {
        vscode.window.showInformationMessage('✅ SIMPLE TEST: Command executed successfully!');
    });
    
    context.subscriptions.push(command);
}

export function deactivate() {
    console.log('SIMPLE TEST: Extension deactivated');
} 