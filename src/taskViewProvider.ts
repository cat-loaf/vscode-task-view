
/**
 * Task View Provider
 * 
 * Main provider class that manages the webview for the task view extension.
 * Handles task organization, status tracking, and user interactions.
 */

import * as vscode from 'vscode';
import { organizeTasks, createTaskStatuses, OrganizedTasks, TaskStatusMap } from './taskOrganizer';
import { generateTaskViewHtml, TaskViewSettings } from './htmlTemplate';

/**
 * Message types for webview communication
 */
interface WebviewMessage {
    command: string;
    name?: string;
    group?: string;
    source?: string;
    groupType?: string;
    title?: string;
    message?: string;
    originalCommand?: any;
}

/**
 * Main webview provider for the task view
 */
export class TaskViewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'taskView';
    
    private _webviewView?: vscode.WebviewView;
    private _pollInterval?: ReturnType<typeof setInterval>;
    private readonly _disposables: vscode.Disposable[] = [];

    constructor(private readonly _extensionUri: vscode.Uri) {}

    /**
     * Resolves the webview view when it becomes active
     */
    public async resolveWebviewView(
        webviewView: vscode.WebviewView,
        _context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken
    ): Promise<void> {
        this._webviewView = webviewView;

        // Configure webview options
        webviewView.webview.options = { 
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };

        // Initialize the view
        await this.refreshTasks();

        // Set up event listeners
        this.setupEventListeners(webviewView);
    }

    /**
     * Sets up all event listeners for the webview and VS Code events
     */
    private setupEventListeners(webviewView: vscode.WebviewView): void {
        // File system watcher for tasks.json changes
        const watcher = vscode.workspace.createFileSystemWatcher('**/.vscode/tasks.json');
        this._disposables.push(
            watcher,
            watcher.onDidChange(() => this.refreshTasks()),
            watcher.onDidCreate(() => this.refreshTasks()),
            watcher.onDidDelete(() => this.refreshTasks())
        );

        // Task execution event listeners
        this._disposables.push(
            vscode.tasks.onDidStartTask(() => this.refreshTasks()),
            vscode.tasks.onDidEndTask(() => this.refreshTasks())
        );

        // Configuration change listener
        this._disposables.push(
            vscode.workspace.onDidChangeConfiguration((e) => {
                if (e.affectsConfiguration('taskView')) {
                    this.refreshTasks();
                }
            })
        );

        // Periodic refresh
        this._pollInterval = setInterval(() => this.refreshTasks(), 10000);

        // Webview message handler
        this._disposables.push(
            webviewView.webview.onDidReceiveMessage(async (message: WebviewMessage) => {
                try {
                    await this.handleWebviewMessage(message);
                } catch (error) {
                    console.error('Error handling webview message:', error);
                    vscode.window.showErrorMessage('Task View: Failed to execute command');
                }
            })
        );
    }

    /**
     * Handles messages received from the webview
     */
    private async handleWebviewMessage(message: WebviewMessage): Promise<void> {
        switch (message.command) {
            case 'runTask':
                if (message.name) {
                    const task = await this.findTaskByName(message.name);
                    if (task) {
                        await vscode.tasks.executeTask(task);
                    }
                }
                break;

            case 'terminateTask':
                if (message.name) {
                    const executions = vscode.tasks.taskExecutions.filter(te => te.task.name === message.name);
                    executions.forEach(te => te.terminate());
                }
                break;

            case 'runGroup':
            case 'runSubGroup':
            case 'runSourceGroup':
                await this.executeGroupRun(message);
                break;

            case 'showConfirmation':
                if (message.message) {
                    const result = await vscode.window.showInformationMessage(
                        message.message,
                        { modal: true },
                        'Yes',
                        'No'
                    );
                    if (result === 'Yes' && message.originalCommand) {
                        await this.executeGroupRun(message.originalCommand);
                    }
                }
                break;

            case 'pauseTask':
                if (message.name) {
                    vscode.window.showInformationMessage(`Pause not implemented for "${message.name}"`);
                }
                break;

            default:
                console.warn('Unknown webview command:', message.command);
        }
    }

    /**
     * Finds a task by its name
     */
    private async findTaskByName(name: string): Promise<vscode.Task | undefined> {
        const tasks = await vscode.tasks.fetchTasks();
        return tasks.find(task => task.name === name);
    }

    /**
     * Executes group run commands
     */
    private async executeGroupRun(message: WebviewMessage): Promise<void> {
        if (!message.name) {return;}

        try {
            const tasks = await this.getTasksForGroup(message.command!, message.name);
            for (const task of tasks) {
                await vscode.tasks.executeTask(task);
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to run group "${message.name}": ${error}`);
        }
    }

    /**
     * Gets tasks for a specific group type
     */
    private async getTasksForGroup(command: string, groupName: string): Promise<vscode.Task[]> {
        const allTasks = await vscode.tasks.fetchTasks();
        
        switch (command) {
            case 'runGroup':
                return allTasks.filter(task => task.group?.id === groupName);
            case 'runSubGroup':
                return allTasks.filter(task => 
                    task.definition?.type === groupName || 
                    task.source === groupName
                );
            case 'runSourceGroup':
                return allTasks.filter(task => task.source === groupName);
            default:
                return [];
        }
    }

    /**
     * Disposes of the provider and cleans up resources
     */
    public dispose(): void {
        if (this._pollInterval) {clearInterval(this._pollInterval);}
    }

    private async refreshTasks() {
        if (!this._webviewView) {return;}

        try {
            const tasks = await vscode.tasks.fetchTasks();
            const executions = vscode.tasks.taskExecutions;

            const taskStatuses = createTaskStatuses(tasks, executions);

            // Send message to preserve state before refresh
            this._webviewView.webview.postMessage({ command: 'preserveState' });
            
            // Small delay to allow state preservation
            setTimeout(() => {
                if (this._webviewView) {
                    this._webviewView.webview.html = this._getHtmlForTasks(tasks, taskStatuses);
                }
            }, 50);
        } catch (err) {
            console.error('Error fetching tasks:', err);
        }
    }

    private _getHtmlForTasks(
        tasks: vscode.Task[],
        taskStatuses: Record<string, 'grey' | 'green' | 'yellow' | 'red'>
    ): string {
        const { workspaceTasks, sourceGroups } = organizeTasks(tasks);
        const config = vscode.workspace.getConfiguration('taskView');
        const settings = {
            showTooltips: config.get<boolean>('showTooltips', true),
            showGroupTooltips: config.get<boolean>('showGroupTooltips', true),
            showSubgroupTooltips: config.get<boolean>('showSubgroupTooltips', true),
            requireGroupConfirmation: config.get<boolean>('requireGroupConfirmation', true),
            requireSubgroupConfirmation: config.get<boolean>('requireSubgroupConfirmation', true),
            showTaskCounts: config.get<boolean>('showTaskCounts', true)
        };
        return generateTaskViewHtml(workspaceTasks, sourceGroups, taskStatuses, settings);
    }


}
