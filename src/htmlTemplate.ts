import * as vscode from 'vscode';

export interface TaskGroup {
    tasks: vscode.Task[];
    subGroups: Record<string, vscode.Task[]>;
}

export interface TaskViewSettings {
    showTooltips: boolean;
    showGroupTooltips: boolean;
    showSubgroupTooltips: boolean;
    requireGroupConfirmation: boolean;
    requireSubgroupConfirmation: boolean;
    showTaskCounts: boolean;
}

export function generateTaskViewHtml(
    workspaceTasks: vscode.Task[],
    sourceGroups: Record<string, TaskGroup>,
    taskStatuses: Record<string, 'grey' | 'green' | 'yellow' | 'red'>,
    settings: TaskViewSettings
): string {
    const renderTaskItem = (task: vscode.Task, isChild = false) => {
        const status = taskStatuses[task.name] || 'grey';
        // Don't prepend "Workspace:" for workspace tasks
        const displayName = (task.source && task.source !== 'Workspace') ? `${task.source}: ${task.name}` : task.name;
        
        // Build custom tooltip content
        let tooltipHtml = `
            <div><strong>Name:</strong> ${task.name}</div>
            <div><strong>Provider:</strong> ${task.source || 'n/a'}</div>
            <div><strong>Type:</strong> ${task.definition.type || 'n/a'}</div>
        `;
        
        // Get the actual command and determine the appropriate label
        let actualCommand: string | undefined;
        let commandArgs: string[] = [];
        let commandLabel = 'Command';
        
        // Get args if they exist
        if (task.definition.args && Array.isArray(task.definition.args)) {
            commandArgs = task.definition.args;
        }
        
        // Handle different task types appropriately
        if (task.definition.type === 'shell') {
            commandLabel = 'Shell Command';
            // For shell tasks, check multiple possible locations for the command
            actualCommand = task.definition.command as string || 
                           task.definition.commandLine as string ||
                           (task as any).commandLine ||
                           (task as any).execution?.commandLine;
            
            // If still no command found, try to reconstruct from task properties
            if (!actualCommand && task.definition.args) {
                // Sometimes the first arg is actually the command
                const args = task.definition.args as string[];
                if (args.length > 0) {
                    actualCommand = args.join(' ');
                }
            }
        } else if (task.definition.type === 'process') {
            commandLabel = 'Process Command';
            actualCommand = task.definition.command as string;
        } else if (task.definition.type === 'npm') {
            commandLabel = 'NPM Script';
            if (task.definition.script) {
                actualCommand = `npm run ${task.definition.script}`;
            } else {
                actualCommand = task.definition.command as string;
            }
        } else if (task.definition.type === 'cmake') {
            commandLabel = 'Command';
            // For CMAKE tasks, the command is typically in the definition
            actualCommand = task.definition.command as string || task.name;
        } else {
            // Generic handling for other task types
            commandLabel = 'Command';
            actualCommand = task.definition.command as string;
        }
        
        // Show command information
        if (actualCommand) {
            let fullCommand = actualCommand;
            if (commandArgs.length > 0) {
                fullCommand += ` ${commandArgs.join(' ')}`;
            }
            tooltipHtml += `<div><strong>${commandLabel}:</strong> <code>${fullCommand}</code></div>`;
        }
        
        const statusColor = status === 'green' ? '#22c55e80' : status === 'red' ? '#ef444480' : status === 'yellow' ? '#eab308' : '#6b7280';
        
        const tooltipAttribute = settings.showTooltips ? `data-tooltip-content="${tooltipHtml.replace(/"/g, '&quot;')}"` : '';
        
        return `
            <div class="task-item ${isChild ? 'child' : ''}" ${tooltipAttribute}>
                <span class="status-indicator" style="background-color:${statusColor}"></span>
                <span class="task-name">${displayName}</span>
                <div class="spacer"></div>
                <button class="action run" data-command="runTask" data-task="${task.name}" title="Run">
                    <svg width="16" height="16" viewBox="0 0 24 24">
                        <polygon points="5,3 19,12 5,21" fill="#22c55e"/>
                    </svg>
                </button>
                <button class="action stop" data-command="terminateTask" data-task="${task.name}" title="Stop">
                    <svg width="16" height="16" viewBox="0 0 24 24">
                        <rect x="5" y="5" width="14" height="14" fill="#ef4444"/>
                    </svg>
                </button>
            </div>
        `;
    };

    // Group workspace tasks by their task.group
    const workspaceGroups: Record<string, vscode.Task[]> = {};
    const ungroupedWorkspaceTasks: vscode.Task[] = [];
    
    workspaceTasks.forEach(task => {
        let taskGroupName: string | null = null;
        if (task.group) {
            if (typeof task.group === 'string') {
                taskGroupName = task.group;
            } else {
                taskGroupName = task.group.id || 'build';
            }
        }
        
        if (taskGroupName) {
            if (!workspaceGroups[taskGroupName]) {
                workspaceGroups[taskGroupName] = [];
            }
            workspaceGroups[taskGroupName].push(task);
        } else {
            ungroupedWorkspaceTasks.push(task);
        }
    });
    
    // Render ungrouped workspace tasks first
    const ungroupedWorkspaceTasksHtml = ungroupedWorkspaceTasks.map(task => renderTaskItem(task, false)).join('');
    
    let groupCounter = 0;
    
    // Render workspace groups first
    const workspaceGroupsHtml = Object.entries(workspaceGroups).map(([groupName, groupTasks]) => {
        const groupId = `workspace-group-${groupCounter++}`;
        const tasksHtml = groupTasks.map(task => renderTaskItem(task, true)).join('');
        const taskCount = groupTasks.length;
        
        // Build tooltip content for workspace group
        const taskNames = groupTasks.map(t => t.name).join(', ');
        const taskTypes = [...new Set(groupTasks.map(t => t.definition.type || 'unknown'))].join(', ');
        const groupTooltip = `
            <div><strong>Group:</strong> ${groupName}</div>
            <div><strong>Type:</strong> Workspace Group</div>
            <div><strong>Task Count:</strong> ${taskCount}</div>
            <div><strong>Task Types:</strong> ${taskTypes}</div>
            <div><strong>Tasks:</strong> ${taskNames}</div>
        `;
        
        const groupTooltipAttribute = (settings.showTooltips && settings.showGroupTooltips) 
            ? `data-tooltip-content="${groupTooltip.replace(/"/g, '&quot;')}"` : '';
        const taskCountDisplay = settings.showTaskCounts && taskCount > 1 
            ? `<span class="group-count">(${taskCount})</span>` : '';
        
        return `
            <div class="task-group">
                <div class="group-header" data-toggle="${groupId}" ${groupTooltipAttribute}>
                    <button class="toggle-btn">
                        <svg class="toggle-icon" width="12" height="12" viewBox="0 0 12 12">
                            <path fill="currentColor" d="M4 2 L8 6 L4 10 Z"/>
                        </svg>
                    </button>
                    <span class="group-name">${groupName}</span>
                    ${taskCountDisplay}
                    <button class="action run-group" data-command="runGroup" data-group="${groupName}" data-group-type="workspace" data-task-count="${taskCount}" title="Run All Tasks in Group">
                        <svg width="14" height="14" viewBox="0 0 24 24">
                            <polygon points="5,3 19,12 5,21" fill="#22c55e"/>
                        </svg>
                    </button>
                </div>
                <div class="group-tasks" id="${groupId}">
                    ${tasksHtml}
                </div>
            </div>
        `;
    }).join('');
    
    const groupHtml = Object.entries(sourceGroups)
        .filter(([_, group]) => group.tasks.length > 0 || Object.keys(group.subGroups).length > 0)
        .map(([sourceName, group]) => {
            const sourceGroupId = `source-${groupCounter++}`;
            
            // Render tasks directly under the source (no task.group)
            const directTasksHtml = group.tasks.map(task => renderTaskItem(task, true)).join('');
            
            // Render sub-groups (tasks with task.group)
            const subGroupsHtml = Object.entries(group.subGroups).map(([subGroupName, subGroupTasks]) => {
                const subGroupId = `subgroup-${groupCounter++}`;
                const subTasksHtml = subGroupTasks.map(task => renderTaskItem(task, true)).join('');
                const subTaskCount = subGroupTasks.length;
                
                // Build tooltip content for subgroup
                const subTaskNames = subGroupTasks.map(t => t.name).join(', ');
                const subTaskTypes = [...new Set(subGroupTasks.map(t => t.definition.type || 'unknown'))].join(', ');
                const subGroupTooltip = `
                    <div><strong>Subgroup:</strong> ${subGroupName}</div>
                    <div><strong>Parent Source:</strong> ${sourceName}</div>
                    <div><strong>Type:</strong> Task Subgroup</div>
                    <div><strong>Task Count:</strong> ${subTaskCount}</div>
                    <div><strong>Task Types:</strong> ${subTaskTypes}</div>
                    <div><strong>Tasks:</strong> ${subTaskNames}</div>
                `;
                
                const subGroupTooltipAttribute = (settings.showTooltips && settings.showSubgroupTooltips) 
                    ? `data-tooltip-content="${subGroupTooltip.replace(/"/g, '&quot;')}"` : '';
                const subTaskCountDisplay = settings.showTaskCounts && subTaskCount > 1 
                    ? `<span class="group-count">(${subTaskCount})</span>` : '';
                
                return `
                    <div class="task-subgroup">
                        <div class="group-header" data-toggle="${subGroupId}" ${subGroupTooltipAttribute}>
                            <button class="toggle-btn">
                                <svg class="toggle-icon" width="12" height="12" viewBox="0 0 12 12">
                                    <path fill="currentColor" d="M4 2 L8 6 L4 10 Z"/>
                                </svg>
                            </button>
                            <span class="group-name">${subGroupName}</span>
                            ${subTaskCountDisplay}
                            <button class="action run-subgroup" data-command="runSubGroup" data-group="${subGroupName}" data-source="${sourceName}" data-task-count="${subTaskCount}" title="Run All Tasks in Subgroup">
                                <svg width="14" height="14" viewBox="0 0 24 24">
                                    <polygon points="5,3 19,12 5,21" fill="#22c55e"/>
                                </svg>
                            </button>
                        </div>
                        <div class="group-tasks" id="${subGroupId}">
                            ${subTasksHtml}
                        </div>
                    </div>
                `;
            }).join('');

            const totalCount = group.tasks.length + Object.keys(group.subGroups).length;
            
            // Build tooltip content for source group
            const allSourceTasks = [...group.tasks, ...Object.values(group.subGroups).flat()];
            const directTaskNames = group.tasks.map(t => t.name).join(', ') || 'None';
            const subGroupNames = Object.keys(group.subGroups).join(', ') || 'None';
            const sourceTaskTypes = [...new Set(allSourceTasks.map(t => t.definition.type || 'unknown'))].join(', ');
            const totalTaskCount = allSourceTasks.length;
            const sourceTooltip = `
                <div><strong>Source:</strong> ${sourceName}</div>
                <div><strong>Type:</strong> Task Provider/Source</div>
                <div><strong>Direct Tasks:</strong> ${group.tasks.length}</div>
                <div><strong>Subgroups:</strong> ${Object.keys(group.subGroups).length}</div>
                <div><strong>Total Tasks:</strong> ${totalTaskCount}</div>
                <div><strong>Task Types:</strong> ${sourceTaskTypes}</div>
                <div><strong>Direct Task Names:</strong> ${directTaskNames}</div>
                <div><strong>Subgroup Names:</strong> ${subGroupNames}</div>
            `;
            
            const sourceTooltipAttribute = (settings.showTooltips && settings.showGroupTooltips) 
                ? `data-tooltip-content="${sourceTooltip.replace(/"/g, '&quot;')}"` : '';
            const totalCountDisplay = settings.showTaskCounts && totalCount > 1 
                ? `<span class="group-count">(${totalCount})</span>` : '';
            
            return `
                <div class="task-group">
                    <div class="group-header" data-toggle="${sourceGroupId}" ${sourceTooltipAttribute}>
                        <button class="toggle-btn">
                            <svg class="toggle-icon" width="12" height="12" viewBox="0 0 12 12">
                                <path fill="currentColor" d="M4 2 L8 6 L4 10 Z"/>
                            </svg>
                        </button>
                        <span class="group-name">${sourceName}</span>
                        ${totalCountDisplay}
                        <button class="action run-source-group" data-command="runSourceGroup" data-source="${sourceName}" data-task-count="${totalCount}" title="Run All Tasks in Source">
                            <svg width="14" height="14" viewBox="0 0 24 24">
                                <polygon points="5,3 19,12 5,21" fill="#22c55e"/>
                            </svg>
                        </button>
                    </div>
                    <div class="group-tasks" id="${sourceGroupId}">
                        ${directTasksHtml}
                        ${subGroupsHtml}
                    </div>
                </div>
            `;
        }).join('');

    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Tasks</title>
            <style>
                ${getTaskViewStyles()}
            </style>
        </head>
        <body>
            <div class="task-container">
                ${ungroupedWorkspaceTasksHtml}
                ${workspaceGroupsHtml}
                ${groupHtml}
            </div>
            <div class="custom-tooltip" id="custom-tooltip"></div>
            <script>
                ${getTaskViewScript(settings)}
            </script>
        </body>
        </html>
    `;
}

function getTaskViewStyles(): string {
    return `
        body {
            font-family: var(--vscode-font-family);
            font-weight: var(--vscode-font-weight);
            font-size: var(--vscode-font-size);
            line-height: var(--vscode-editor-line-height);
            color: var(--vscode-foreground);
            background-color: var(--vscode-sideBar-background);
            margin: 0;
            padding: 0;
        }
        .task-container {
            padding: 8px 0;
        }
        .task-group { margin-bottom: 0; }
        .group-header {
            display: flex;
            align-items: center;
            cursor: pointer;
            font-weight: normal;
            min-width: 0;
        }
        .group-name { 
            flex: 1; 
            font-variant: small-caps;
            font-weight: normal;
            letter-spacing: 0.05em;
            text-transform: uppercase;
            font-size: 0.85em;
            user-select: none;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            min-width: 0;
        }
        .group-count {
            font-size: 0.75em;
            color: var(--vscode-descriptionForeground);
            margin-right: 8px;
            white-space: nowrap;
        }

        .group-tasks {
            overflow: hidden;
            max-height: 0;
        }
        .group-tasks.expanded {
            max-height: 1000px; /* Large enough to accommodate content */
        }
        .task-item {
            display: flex;
            align-items: center;
            margin: 0;
            padding: 2px 8px;
            position: relative;
        }
        .status-indicator {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            margin-right: 8px;
        }
        .task-name { 
            flex: 1; 
            user-select: none;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            min-width: 0;
        }
        .spacer {
            width: 50px; /* Approximate width of task count + group run button + margins */
            height: 16px;
            flex-shrink: 0;
            margin-right: 8px;
        }
        
        button.action {
            margin-left: auto;
            margin-right: 8px;
            border: none;
            background: none;
            cursor: pointer;
            padding: 2px;
            font-family: var(--vscode-font-family);
            min-width: 16px;
        }
        button.action:hover svg polygon,
        button.action:hover svg rect { opacity: 0.7; }
        .toggle-btn { 
            margin-right: 8px; 
            background: none; 
            border: none; 
            cursor: pointer; 
            padding: 2px;
            color: var(--vscode-foreground);
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .toggle-icon {
            width: 12px;
            height: 12px;
        }
        .toggle-icon.expanded {
            transform: rotate(90deg);
        }
        
        /* VS Code-style hover effects */
        .group-header:hover,
        .task-item:hover {
            background-color: var(--vscode-list-hoverBackground);
        }
        .group-header {
            padding: 4px 8px;
            margin: 0;
            position: relative;
        }
        .task-item.child {
            padding-left: 24px;
        }
        .task-subgroup {
            margin-bottom: 0;
            position: relative;
        }
        
        /* Left border indicators for hierarchy */
        .group-tasks .task-item {
            border-left: 2px solid var(--vscode-tree-indentGuidesStroke);
            margin-left: 16px;
        }
        
        .task-subgroup .task-item {
            border-left: 2px solid var(--vscode-tree-indentGuidesStroke);
            margin-left: 32px;
        }
        .task-subgroup .group-header {
            font-weight: normal;
            font-size: 1em;
            color: var(--vscode-foreground);
            padding: 4px 8px 4px 24px;
        }
        .task-subgroup .group-name {
            font-variant: small-caps;
            text-transform: uppercase;
            font-size: 0.85em;
            letter-spacing: 0.05em;
            font-weight: normal;
        }
        .task-subgroup .task-item {
            padding: 2px 8px 2px 8px;
        }
        .task-subgroup .task-item.child {
            padding-left: 24px;
        }
        
        /* Custom tooltip styles */
        .custom-tooltip {
            position: absolute;
            background-color: var(--vscode-editorHoverWidget-background);
            border: 1px solid var(--vscode-editorHoverWidget-border);
            border-radius: 4px;
            padding: 8px 12px;
            font-size: 12px;
            line-height: 1.4;
            color: var(--vscode-editorHoverWidget-foreground);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
            z-index: 1000;
            max-width: 300px;
            word-wrap: break-word;
            pointer-events: none;
            opacity: 0;
            transform: translateY(-8px);
            transition: opacity 0.2s ease, transform 0.2s ease;
        }
        
        /* Triangle pointing up (tooltip below element) */
        .custom-tooltip.position-below::before {
            content: '';
            position: absolute;
            top: -6px;
            left: 50%;
            transform: translateX(-50%);
            width: 0;
            height: 0;
            border-left: 6px solid transparent;
            border-right: 6px solid transparent;
            border-bottom: 6px solid var(--vscode-editorHoverWidget-border);
        }
        
        .custom-tooltip.position-below::after {
            content: '';
            position: absolute;
            top: -5px;
            left: 50%;
            transform: translateX(-50%);
            width: 0;
            height: 0;
            border-left: 5px solid transparent;
            border-right: 5px solid transparent;
            border-bottom: 5px solid var(--vscode-editorHoverWidget-background);
        }
        
        /* Triangle pointing down (tooltip above element) */
        .custom-tooltip.position-above::before {
            content: '';
            position: absolute;
            bottom: -6px;
            left: 50%;
            transform: translateX(-50%);
            width: 0;
            height: 0;
            border-left: 6px solid transparent;
            border-right: 6px solid transparent;
            border-top: 6px solid var(--vscode-editorHoverWidget-border);
        }
        
        .custom-tooltip.position-above::after {
            content: '';
            position: absolute;
            bottom: -5px;
            left: 50%;
            transform: translateX(-50%);
            width: 0;
            height: 0;
            border-left: 5px solid transparent;
            border-right: 5px solid transparent;
            border-top: 5px solid var(--vscode-editorHoverWidget-background);
        }
        
        .custom-tooltip.show {
            opacity: 1;
            transform: translateY(0);
        }
        
        .custom-tooltip div {
            margin: 2px 0;
        }
        
        .custom-tooltip strong {
            color: var(--vscode-editorHoverWidget-foreground);
            font-weight: 600;
        }
        
        .custom-tooltip code {
            background-color: var(--vscode-textCodeBlock-background);
            color: var(--vscode-textPreformat-foreground);
            padding: 2px 4px;
            border-radius: 3px;
            font-family: var(--vscode-editor-font-family);
            font-size: 11px;
        }
    `;
}

function getTaskViewScript(settings: TaskViewSettings): string {
    return `
        const vscode = acquireVsCodeApi();
        
        // Store and restore group states
        let groupStates = vscode.getState() || {};
        
        function saveGroupState(groupId, isExpanded) {
            groupStates[groupId] = isExpanded;
            vscode.setState(groupStates);
        }
        
        function restoreGroupStates() {
            Object.keys(groupStates).forEach(groupId => {
                const elem = document.getElementById(groupId);
                const header = document.querySelector(\`[data-toggle="\${groupId}"]\`);
                if (elem && header && groupStates[groupId]) {
                    elem.classList.add('expanded');
                    const icon = header.querySelector('.toggle-icon');
                    if (icon) icon.classList.add('expanded');
                }
            });
        }

        document.querySelectorAll('button.action, .toggle-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const command = btn.getAttribute('data-command');
                const task = btn.getAttribute('data-task');
                const group = btn.getAttribute('data-group');
                const source = btn.getAttribute('data-source');
                const groupType = btn.getAttribute('data-group-type');
                
                // Handle group run commands with confirmation
                if (command === 'runGroup' || command === 'runSubGroup' || command === 'runSourceGroup') {
                    const shiftPressed = e.shiftKey;
                    const requireConfirmation = (command === 'runGroup' && ${settings.requireGroupConfirmation}) || 
                                               ((command === 'runSubGroup' || command === 'runSourceGroup') && ${settings.requireSubgroupConfirmation});
                    
                    if (!shiftPressed && requireConfirmation) {
                        const groupName = group || source;
                        vscode.postMessage({ 
                            command: 'showConfirmation', 
                            title: 'Run All Tasks',
                            message: \`Run all tasks in "\${groupName}"?\`,
                            originalCommand: { command, name: task, group, source, groupType }
                        });
                        return;
                    }
                }
                
                if (command || task || group) {
                    vscode.postMessage({ command, name: task, group, source, groupType });
                }
            });
        });

        document.querySelectorAll('.group-header').forEach(header => {
            header.addEventListener('click', (e) => {
                // Don't toggle if clicking on action buttons
                if (e.target.closest('.action')) return;
                
                const toggleId = header.getAttribute('data-toggle');
                const elem = document.getElementById(toggleId);
                const icon = header.querySelector('.toggle-icon');
                const isExpanded = elem.classList.contains('expanded');
                
                if (isExpanded) {
                    elem.classList.remove('expanded');
                    icon.classList.remove('expanded');
                    saveGroupState(toggleId, false);
                } else {
                    elem.classList.add('expanded');
                    icon.classList.add('expanded');
                    saveGroupState(toggleId, true);
                }
            });
        });
        
        // Restore states after DOM is ready
        setTimeout(restoreGroupStates, 0);
        
        // Listen for messages from the extension
        window.addEventListener('message', event => {
            const message = event.data;
            if (message.command === 'preserveState') {
                // Save current expanded state before refresh
                const currentExpandedGroups = {};
                document.querySelectorAll('.group-tasks.expanded').forEach(elem => {
                    currentExpandedGroups[elem.id] = true;
                });
                vscode.setState(currentExpandedGroups);
            }
        });



        // Custom tooltip functionality
        const tooltip = document.getElementById('custom-tooltip');
        let tooltipTimeout;

        function showTooltip(element, content) {
            tooltip.innerHTML = content;
            tooltip.classList.add('show');
            
            const rect = element.getBoundingClientRect();
            const tooltipRect = tooltip.getBoundingClientRect();
            
            // Try to position tooltip above the element first
            let left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
            let top = rect.top - tooltipRect.height - 8;
            let isAbove = true;
            
            // Keep tooltip within viewport bounds
            if (left < 8) left = 8;
            if (left + tooltipRect.width > window.innerWidth - 8) {
                left = window.innerWidth - tooltipRect.width - 8;
            }
            if (top < 8) {
                // Show below if no space above
                top = rect.bottom + 8;
                isAbove = false;
            }
            
            // Remove existing position classes and add the appropriate one
            tooltip.classList.remove('position-above', 'position-below');
            tooltip.classList.add(isAbove ? 'position-above' : 'position-below');
            
            tooltip.style.left = left + 'px';
            tooltip.style.top = top + 'px';
        }

        function hideTooltip() {
            tooltip.classList.remove('show', 'position-above', 'position-below');
        }

        // Add tooltip event listeners to task items
        if (${settings.showTooltips}) {
            document.querySelectorAll('[data-tooltip-content]').forEach(element => {
                element.addEventListener('mouseenter', () => {
                    clearTimeout(tooltipTimeout);
                    const content = element.getAttribute('data-tooltip-content');
                    tooltipTimeout = setTimeout(() => showTooltip(element, content), 500);
                });

                element.addEventListener('mouseleave', () => {
                    clearTimeout(tooltipTimeout);
                    hideTooltip();
                });
            });
        }
    `;
}