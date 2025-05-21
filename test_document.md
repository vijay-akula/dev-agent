# Dev Agent VS Code Extension

## Overview

The Dev Agent VS Code extension provides a chat interface similar to GitHub Copilot Chat, allowing users to interact with a Python-based agent script. The extension can process the current file or uploaded files and execute Python scripts to analyze code.

## Features

1. **Chat Interface**: A chat panel in the panel area at the bottom of VS Code, similar to GitHub Copilot Chat
2. **File Processing**: Process the current file or upload files for analysis
3. **Python Integration**: Execute Python scripts to analyze code
4. **Configurable**: Set custom paths for Python and agent scripts
5. **Clear Chat**: Easily clear chat history with a button
6. **Smart File Selection**: Use the current editor file or file selected in the VS Code explorer
7. **Code Execution**: Execute Python code directly from the chat
8. **@dev-agent Mentions**: Support for @dev-agent mentions in code

## Usage

1. Open the Dev Agent chat panel using the command palette (`Ctrl+Shift+P` or `Cmd+Shift+P`) and search for "Dev Agent: Start Chat"
2. The chat panel will open in the panel area at the bottom of VS Code (similar to GitHub Copilot Chat)
3. Type commands in the chat input, such as:
   - `@dev-agent explain this code`
   - `@dev-agent provide pseudo code`
   - `@dev-agent summarize this file`
4. Execute Python code by typing code blocks with ```python or ```py syntax
5. Upload files using the upload button in the chat panel
6. Process the current file using the "Use Current File" button
   - If you have an active editor open, it will use that file
   - If no editor is open but you have a file selected in the explorer, it will use that file
7. Clear the chat history using the "Clear Chat" button
8. Select text in an editor that starts with @dev-agent and use the context menu to process it

## Configuration

The extension provides the following configuration options:

- `dev-agent.pythonPath`: Path to the Python executable
- `dev-agent.scriptPath`: Path to the agent script
- `dev-agent.additionalArgs`: Additional arguments to pass to the agent script

## Testing

To test the extension:

1. Install the extension in VS Code
2. Open a code file
3. Start the Dev Agent chat panel
4. Try various commands like `@dev-agent explain this code`
5. Upload a file using the upload button
6. Try executing Python code with code blocks:
   ```python
   print("Hello, world!")
   ```
7. Select a file in the explorer and click "Use Current File"
8. Clear the chat history with the "Clear Chat" button
9. Check that all features work correctly

## Troubleshooting

If you encounter issues:

1. Check that Python is installed and accessible
2. Verify that the agent script exists at the configured path
3. Check the VS Code Developer Tools console for error messages
4. Try restarting VS Code

## Next Steps

Future enhancements could include:

1. Support for more programming languages
2. Integration with other tools and services
3. Enhanced code analysis capabilities
4. Custom themes and styling options
5. Support for collaborative coding sessions
6. Integration with AI models for code generation
7. Code refactoring suggestions
8. Performance optimization tools