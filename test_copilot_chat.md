# Testing the Dev Agent VS Code Extension with Copilot-like Chat

This document provides instructions for testing the enhanced Dev Agent VS Code extension with the Copilot-like chat interface.

## Prerequisites

1. VS Code installed on your system
2. The Dev Agent extension installed (.vsix file)

## Test Cases

### Test 1: Chat Interface with @dev-agent Commands

1. Open the Dev Agent chat panel by clicking on the Dev Agent icon in the status bar or using the keyboard shortcut Ctrl+Shift+D (Cmd+Shift+D on Mac)
2. Type the following in the chat input:
   ```
   @dev-agent explain this code
   ```
3. Press Enter or click the Send button
4. The Dev Agent should process the command and display a response in the chat

**Expected Result**: The extension should recognize the @dev-agent command and process it, even without a file context.

### Test 2: Using the Current File as Context

1. Open a Python file in VS Code
2. Open the Dev Agent chat panel
3. Click the "Use Current File" button in the chat interface
4. The file context should be displayed at the top of the chat input
5. Type a question about the code, such as:
   ```
   What does this code do?
   ```
6. Press Enter or click the Send button

**Expected Result**: The extension should take the current file as context, pass it to the agent script along with the prompt, and display the response in the chat.

### Test 3: Uploading a File as Context

1. Open the Dev Agent chat panel
2. Click the "Upload File" button in the chat interface
3. Select a Python file from your file system
4. The file context should be displayed at the top of the chat input
5. Type a command, such as:
   ```
   @dev-agent provide pseudo code
   ```
6. Press Enter or click the Send button

**Expected Result**: The extension should take the uploaded file as context, pass it to the agent script along with the prompt, and display the response in the chat.

### Test 4: Agent Script Not Found

1. Open VS Code settings (File > Preferences > Settings)
2. Set `dev-agent.scriptPath` to a non-existent path (e.g., "non_existent_agent.py")
3. Open the Dev Agent chat panel
4. Type any command and press Enter

**Expected Result**: The extension should display an error message indicating that the agent script was not found, along with the command that would have been executed.

## Verifying the Results

For each test case, verify that:

1. The chat interface works correctly
2. The file context is displayed properly
3. The agent script receives both the prompt and input
4. The response is displayed in the chat panel with proper formatting
5. Error messages are displayed when the agent script is not found

## Troubleshooting

If you encounter issues:

1. Check the VS Code Developer Tools (Help > Toggle Developer Tools) for error messages
2. Verify that the paths in the settings are correct
3. Make sure the test_agent.py script is executable
4. Check that Python is installed and available in your PATH