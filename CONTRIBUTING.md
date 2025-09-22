# Contributing to VSCode Task View

Thank you for your interest in contributing to VSCode Task View! We welcome contributions from the community and appreciate your help in making this extension better.

## Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v16 or higher)
- **npm** (v7 or higher)
- **Visual Studio Code** (latest version recommended)
- **Git** for version control

### Development Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/YOUR_USERNAME/vscode-task-view.git
   cd vscode-task-view
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Open in VS Code**
   ```bash
   code .
   ```

4. **Start Development**
   - Press `F5` to open a new Extension Development Host window
   - The extension will be loaded automatically in the development host
   - Make changes to the code and reload the window (`Ctrl+R` / `Cmd+R`) to see updates

## Project Structure

```
├── src/
│   ├── extension.ts           # Main extension entry point
│   ├── taskViewProvider.ts    # Main webview provider class
│   └── taskOrganizer.ts       # Task organization and status logic
├── resources/
│   └── task-icon.svg          # Extension icon
├── package.json               # Extension manifest and configuration
├── tsconfig.json              # TypeScript configuration
├── eslint.config.mjs          # ESLint configuration
└── .prettierrc                # Code formatting configuration
```

### Key Components

- **`extension.ts`**: Extension activation/deactivation lifecycle
- **`taskViewProvider.ts`**: Main webview implementation with HTML/CSS/JS generation
- **`taskOrganizer.ts`**: Task grouping, organization, and status management logic
- **`package.json`**: Extension configuration including all user settings

## 🛠️ Development Workflow

### Code Style and Formatting

We use Prettier for code formatting and ESLint for linting:

```bash
# Format code
npm run format

# Run linter
npm run lint

# Fix linting issues automatically
npm run lint:fix
```

**Formatting Standards:**
- **Indentation**: 2 spaces (no tabs)
- **Line Length**: 100 characters maximum
- **Semicolons**: Required
- **Quotes**: Single quotes for strings
- **Trailing Commas**: ES5 compatible

### Building and Testing

```bash
# Compile TypeScript
npm run compile

# Watch mode for development
npm run watch

# Package the extension
npm run package
```

### Code Quality Guidelines

#### TypeScript Best Practices
- Use proper type annotations for all function parameters and return types
- Prefer interfaces over type aliases for object shapes
- Use meaningful variable and function names
- Add JSDoc comments for public methods and complex logic

#### Architecture Patterns
- **Separation of Concerns**: Keep UI logic, business logic, and data management separate
- **Error Handling**: Always handle potential errors gracefully with try-catch blocks
- **Resource Management**: Properly dispose of resources in dispose() methods
- **Type Safety**: Avoid `any` types; use proper TypeScript types

#### Example Code Structure
```typescript
/**
 * Processes tasks and returns organized results
 * @param tasks Array of VS Code tasks to organize
 * @returns Organized task structure with groups and metadata
 */
export function organizeTasks(tasks: vscode.Task[]): OrganizedTasks {
  try {
    // Implementation with proper error handling
  } catch (error) {
    console.error('Error organizing tasks:', error);
    throw error;
  }
}
```

## 🧪 Testing

### Manual Testing

1. **Extension Loading**
   - Verify the Task View panel appears in the Activity Bar
   - Check that the panel loads without errors

2. **Task Display**
   - Create tasks in `.vscode/tasks.json`
   - Verify tasks appear correctly organized in the tree view
   - Test with different task types (npm, shell, etc.)

3. **User Interactions**
   - Test task execution (run/stop buttons)
   - Verify group operations work correctly
   - Test tooltip display and configuration changes

4. **Configuration**
   - Test all 6 configuration options in VS Code settings
   - Verify settings changes take effect immediately

### Test Scenarios

Create comprehensive test scenarios for:
- Various task configurations
- Different workspace setups
- Edge cases (empty workspaces, malformed tasks)
- Configuration combinations
- Error conditions

## 📝 Commit Guidelines

### Commit Message Format

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(ui): add task execution confirmation dialogs
fix(organizer): handle undefined task groups properly
docs(readme): update installation instructions
refactor(provider): improve webview message handling
```

### Branch Naming

- `feature/description-of-feature`
- `fix/description-of-fix`
- `docs/description-of-documentation-update`

## 🔄 Pull Request Process

### Before Submitting

1. **Code Quality**
   - Run `npm run lint` and fix all issues
   - Run `npm run format` to ensure consistent formatting
   - Add JSDoc comments to new public methods

2. **Testing**
   - Manually test your changes in the Extension Development Host
   - Verify existing functionality still works
   - Test edge cases and error conditions

3. **Documentation**
   - Update README.md if adding new features
   - Update CHANGELOG.md with your changes
   - Add or update code comments as needed

### Submitting Your PR

1. **Create Pull Request**
   - Use a descriptive title
   - Provide detailed description of changes
   - Reference any related issues

2. **PR Template**
   ```markdown
   ## Description
   Brief description of the changes

   ## Type of Change
   - [ ] Bug fix
   - [ ] New feature
   - [ ] Documentation update
   - [ ] Code refactoring

   ## Testing
   - [ ] Tested manually in Extension Development Host
   - [ ] Verified existing functionality works
   - [ ] Tested edge cases

   ## Screenshots (if applicable)
   Add screenshots for UI changes
   ```

3. **Review Process**
   - Address feedback promptly
   - Make requested changes in new commits
   - Maintain a clean commit history

## 🐛 Bug Reports

### Before Reporting

1. **Search Existing Issues**: Check if the bug has already been reported
2. **Reproduce**: Ensure you can consistently reproduce the issue
3. **Environment**: Note your VS Code version, OS, and extension version

### Bug Report Template

```markdown
**Bug Description**
A clear description of the bug

**Steps to Reproduce**
1. Go to '...'
2. Click on '...'
3. See error

**Expected Behavior**
What should happen

**Actual Behavior**
What actually happens

**Environment**
- OS: [e.g., Windows 10, macOS 12]
- VS Code Version: [e.g., 1.74.0]
- Extension Version: [e.g., 1.0.0]

**Additional Context**
Screenshots, logs, or other relevant information
```

## 💡 Feature Requests

### Before Requesting

1. **Check Existing**: Look for similar feature requests
2. **Use Case**: Clearly explain the problem the feature would solve
3. **Scope**: Consider if the feature fits the extension's purpose

### Feature Request Template

```markdown
**Feature Description**
A clear description of the feature

**Problem Statement**
What problem does this solve?

**Proposed Solution**
How should this feature work?

**Alternatives Considered**
Other ways this could be implemented

**Additional Context**
Mockups, examples, or other relevant information
```

## 📋 Code of Conduct

### Our Standards

- **Be Respectful**: Treat all contributors with respect and kindness
- **Be Constructive**: Provide helpful feedback and suggestions
- **Be Patient**: Remember that everyone has different experience levels
- **Be Inclusive**: Welcome contributors from all backgrounds

### Unacceptable Behavior

- Harassment, discrimination, or offensive language
- Personal attacks or inappropriate comments
- Spamming or trolling
- Publishing private information without permission

## 🤝 Community

- **GitHub Issues**: For bug reports and feature requests
- **GitHub Discussions**: For questions and general discussion
- **Pull Requests**: For code contributions

## 📞 Getting Help

If you need help with contributing:

1. **Check Documentation**: Review this guide and the README
2. **Search Issues**: Look for similar questions or problems
3. **Ask Questions**: Open a GitHub Discussion or issue
4. **Be Specific**: Provide details about what you're trying to do

---

Thank you for contributing to VSCode Task View! Your help makes this extension better for everyone. 🎉