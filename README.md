# VSCode Task View

A VS Code extension that displays workspace tasks in a tree view within the activity bar sidebar. Tasks are organized by source and type with options for execution and configuration.

## Features

### Task Organization
- Tasks are grouped hierarchically by source (workspace, npm, CMake, etc.)
- Sub-grouping by task type (build, test, etc.) within each source
- Visual status indicators show task execution state (running/idle)

### Task Execution
- Run or stop individual tasks using action buttons
- Execute all tasks in a group or subgroup
- Optional confirmation dialogs for bulk operations
- Hold `Shift` while clicking to skip confirmations

### Information Display
- Hover tooltips show task details including command, provider, and type information
- Group tooltips display task counts and member information
- Command line details for shell tasks

### Configuration Options
- Control tooltip visibility globally or by category
- Configure confirmation dialog behavior
- Toggle display of task counts
- Compatible with VS Code's built-in task system

## Installation

Install from the VS Code Extensions view (`Ctrl+Shift+X` / `Cmd+Shift+X`) by searching for "VSCode Task View".

Alternatively, install manually by downloading the `.vsix` file from [Releases](https://github.com/cat-loaf/vscode-task-view/releases) and using the `Extensions: Install from VSIX...` command.

## Usage

The Task View panel appears in the Activity Bar (left sidebar). Tasks are displayed in a tree structure organized by source and type.

- Click the run button to execute individual tasks
- Click the stop button to terminate running tasks
- Click the run button next to a group to execute all tasks in that group
- Hold `Shift` while clicking group run buttons to skip confirmation dialogs
- Hover over tasks and groups to see detailed information (if tooltips are enabled)

## Configuration

Settings are available under "Task View" in VS Code's settings (`File → Preferences → Settings`):

- `taskView.showTooltips` (boolean, default: true) - Enable/disable all tooltips
- `taskView.showGroupTooltips` (boolean, default: true) - Show tooltips for task groups
- `taskView.showSubgroupTooltips` (boolean, default: true) - Show tooltips for task subgroups  
- `taskView.requireGroupConfirmation` (boolean, default: true) - Confirm before running workspace groups
- `taskView.requireSubgroupConfirmation` (boolean, default: true) - Confirm before running provider groups
- `taskView.showTaskCounts` (boolean, default: true) - Display task counts next to group names

## Supported Task Types

Works with all VS Code task providers:

- Workspace tasks (defined in `.vscode/tasks.json`)
- npm scripts (from package.json)
- CMake build tasks
- Shell commands
- Process executables
- Any other task provider supported by VS Code

## Known Issues

- Task exit codes are not accessible through VS Code's Task API, so success/failure status cannot be reliably determined
- Some task providers may not expose full command information for tooltips

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup, code style guidelines, and contribution process.

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history.

## Issues and Support

Report bugs and request features on [GitHub Issues](https://github.com/cat-loaf/vscode-task-view/issues).
