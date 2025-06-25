import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    console.log('🚀 MINIMAL TEST: Extension starting...');
    
    // Immediate notification
    vscode.window.showInformationMessage('🟢 MINIMAL TEST: Extension loaded successfully!');
    
    // Simple command
    const disposable = vscode.commands.registerCommand('minimal.hello', () => {
        vscode.window.showInformationMessage('✅ MINIMAL TEST: Hello World!');
    });
    
    context.subscriptions.push(disposable);
    console.log('🚀 MINIMAL TEST: Extension fully activated!');
}

export function deactivate() {
    console.log('🚀 MINIMAL TEST: Extension deactivated');
} 