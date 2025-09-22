/**
 * VSCode Task View Extension
 * 
 * This extension provides a visual task manager in the VS Code sidebar,
 * allowing users to view, organize, and execute tasks from a webview interface.
 */

import * as vscode from 'vscode';
import { TaskViewProvider } from './taskViewProvider';

/**
 * Extension activation function
 * Called when the extension is first activated
 * 
 * @param context - VS Code extension context
 */
export function activate(context: vscode.ExtensionContext): void {
    try {
        // Create the task view provider
        const provider = new TaskViewProvider(context.extensionUri);

        // Register the webview view provider
        const disposable = vscode.window.registerWebviewViewProvider(
            TaskViewProvider.viewType, 
            provider,
            {
                webviewOptions: {
                    retainContextWhenHidden: true
                }
            }
        );

        // Add to subscriptions for proper cleanup
        context.subscriptions.push(disposable);

        console.log('VSCode Task View extension activated successfully');
    } catch (error) {
        console.error('Failed to activate VSCode Task View extension:', error);
        vscode.window.showErrorMessage('Failed to activate Task View extension');
    }
}

/**
 * Extension deactivation function
 * Called when the extension is deactivated
 */
export function deactivate(): void {
    console.log('VSCode Task View extension deactivated');
}
