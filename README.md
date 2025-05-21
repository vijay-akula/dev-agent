# Dev Agent VS Code Extension

## Overview

The Dev Agent VS Code extension provides a chat interface similar to GitHub Copilot Chat, allowing users to interact with a Python-based agent script. The extension can process the current file or uploaded files and execute Python scripts to analyze code.

## Features

1. **Chat Interface**: A chat panel in the secondary sidebar, similar to GitHub Copilot Chat
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
- `dev-agent.scriptPath`: Path to the agent script (defaults to agent_v2.py)
- `dev-agent.additionalArgs`: Additional arguments to pass to the agent script

## Agent Scripts

The extension comes with two agent scripts:

1. **agent_v2.py** (default): A more advanced agent script that supports the following features:
   - Code explanation
   - Pseudo code generation
   - File summarization
   - Code execution
   - Custom commands

2. **agent.py**: The original agent script (legacy support)

The agent_v2.py script uses the `--input-file` argument format and processes JSON input files.

## Installation

1. Download the `.vsix` file from the releases page
2. Open VS Code
3. Go to the Extensions view (Ctrl+Shift+X)
4. Click on the "..." menu in the top-right of the Extensions view
5. Select "Install from VSIX..."
6. Choose the downloaded `.vsix` file

## Development

1. Clone the repository
2. Run `npm install` to install dependencies
3. Make your changes
4. Run `npm run compile` to compile the TypeScript code
5. Run `npm run package` to create a `.vsix` file
6. Install the extension from the `.vsix` file

## License

MIT