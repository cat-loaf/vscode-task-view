# Changelog

All notable changes to the "VSCode Task View" extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-12-19

### Added
- **Core Features**
  - Hierarchical task organization by source/provider (workspace, npm, CMake, etc.)
  - Smart grouping by task type (build, test, etc.) within each source
  - One-click task execution with run/stop buttons
  - Batch operations for running all tasks in groups or subgroups
  - Real-time task status indicators (running/idle states)

- **User Experience Enhancements**
  - Rich information tooltips showing task details, commands, and metadata
  - Safety confirmation dialogs for bulk task execution
  - Shift+click bypass for confirmation dialogs
  - Visual hierarchy with proper indentation and color coding
  - Responsive hover effects and smooth UI transitions

- **Configuration Options**
  - `taskView.showTooltips`: Master tooltip control
  - `taskView.showGroupTooltips`: Group-specific tooltip settings
  - `taskView.showSubgroupTooltips`: Subgroup-specific tooltip settings
  - `taskView.requireGroupConfirmation`: Workspace group confirmation control
  - `taskView.requireSubgroupConfirmation`: Provider group confirmation control
  - `taskView.showTaskCounts`: Toggle task count display in group names

- **Technical Implementation**
  - TypeScript-based VS Code extension with proper type safety
  - Webview provider pattern for custom UI rendering
  - Comprehensive error handling and resource management
  - Modular architecture with separated concerns
  - VS Code native integration for task execution and theming

### Technical Details
- **Architecture**: Clean separation between extension lifecycle, task organization, and UI provider
- **Type Safety**: Full TypeScript implementation with proper interfaces and type definitions
- **Error Handling**: Comprehensive try-catch blocks and graceful error recovery
- **Resource Management**: Proper disposal patterns for webviews and event listeners
- **Documentation**: Extensive JSDoc comments and inline documentation

### Development Infrastructure
- **Code Quality**: ESLint configuration with strict TypeScript rules
- **Formatting**: Prettier configuration for consistent code style
- **Project Structure**: Organized source files with clear separation of concerns
- **Documentation**: Comprehensive README, CONTRIBUTING, and CHANGELOG files

## [Unreleased]

### Planned
- Unit testing framework and test coverage
- Task filtering and search functionality
- Custom task templates and favorites
- Integration with VS Code's built-in task runner
- Performance optimizations for large workspaces

---

## Release Notes Format

Each release documents:
- **Added**: New features and capabilities
- **Changed**: Modifications to existing functionality
- **Deprecated**: Features planned for removal
- **Removed**: Features that have been removed
- **Fixed**: Bug fixes and issue resolutions
- **Security**: Security-related improvements