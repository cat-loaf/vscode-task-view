/**
 * Task Organization and Status Management
 * 
 * This module handles the organization of VS Code tasks into logical groups
 * and manages task execution status tracking.
 */

import * as vscode from 'vscode';

/**
 * Represents a group of tasks with optional subgroups
 */
export interface TaskGroup {
    /** Tasks directly under this group */
    tasks: vscode.Task[];
    /** Subgroups organized by group name (e.g., 'build', 'test') */
    subGroups: Record<string, vscode.Task[]>;
}

/**
 * Structure for organizing all tasks in the workspace
 */
export interface OrganizedTasks {
    /** Tasks defined in workspace tasks.json */
    workspaceTasks: vscode.Task[];
    /** Tasks grouped by their source/provider */
    sourceGroups: Record<string, TaskGroup>;
}

/**
 * Valid task status values
 */
export type TaskStatus = 'grey' | 'green' | 'yellow' | 'red';

/**
 * Task status mapping by task name
 */
export type TaskStatusMap = Record<string, TaskStatus>;

/**
 * Organizes VS Code tasks into a hierarchical structure
 * 
 * Tasks are organized as follows:
 * - Workspace tasks: Tasks defined in .vscode/tasks.json
 * - Source groups: Tasks grouped by their source/provider (e.g., npm, CMake, etc.)
 *   - Within each source, tasks are further grouped by their task group (build, test, etc.)
 * 
 * @param tasks - Array of all available VS Code tasks
 * @returns Organized task structure
 */
export function organizeTasks(tasks: vscode.Task[]): OrganizedTasks {
    const workspaceTasks: vscode.Task[] = [];
    const sourceGroups: Record<string, TaskGroup> = {};
    
    tasks.forEach(task => {
        // Separate workspace tasks from provider tasks
        if (isWorkspaceTask(task)) {
            workspaceTasks.push(task);
        } else {
            organizeProviderTask(task, sourceGroups);
        }
    });

    return { workspaceTasks, sourceGroups };
}

/**
 * Determines if a task is a workspace-defined task
 */
function isWorkspaceTask(task: vscode.Task): boolean {
    return task.source === 'Workspace' || !task.source;
}

/**
 * Organizes a provider task into the appropriate source group and subgroup
 */
function organizeProviderTask(task: vscode.Task, sourceGroups: Record<string, TaskGroup>): void {
    const source = task.source || 'Unknown';
    
    // Initialize source group if it doesn't exist
    if (!sourceGroups[source]) {
        sourceGroups[source] = { tasks: [], subGroups: {} };
    }
    
    const taskGroupName = extractTaskGroupName(task);
    
    if (taskGroupName) {
        // Add to appropriate subgroup
        if (!sourceGroups[source].subGroups[taskGroupName]) {
            sourceGroups[source].subGroups[taskGroupName] = [];
        }
        sourceGroups[source].subGroups[taskGroupName].push(task);
    } else {
        // Add to main task list for this source
        sourceGroups[source].tasks.push(task);
    }
}

/**
 * Extracts the task group name from a task
 */
function extractTaskGroupName(task: vscode.Task): string | null {
    if (!task.group) {
        return null;
    }
    
    if (typeof task.group === 'string') {
        return task.group;
    }
    
    return task.group.id || 'build';
}

/**
 * Creates a status mapping for all tasks based on their current execution state
 * 
 * Status indicators:
 * - yellow: Task is currently running
 * - grey: Task is idle/not running
 * 
 * Note: VS Code's Task API doesn't provide access to exit codes, so we can only
 * reliably determine if a task is running or not.
 * 
 * @param tasks - Array of all tasks to create status for
 * @param executions - Currently running task executions
 * @returns Mapping of task names to their current status
 */
export function createTaskStatuses(
    tasks: vscode.Task[], 
    executions: readonly vscode.TaskExecution[]
): TaskStatusMap {
    const taskStatuses: TaskStatusMap = {};
    
    tasks.forEach(task => {
        const isRunning = executions.some(execution => execution.task.name === task.name);
        taskStatuses[task.name] = isRunning ? 'yellow' : 'grey';
    });

    return taskStatuses;
}