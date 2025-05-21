# Testing the Dev Agent VS Code Extension

This document provides instructions for testing the Dev Agent VS Code extension with the test agent script.

## Prerequisites

1. VS Code installed on your system
2. The Dev Agent extension installed (.vsix file)

## Test Cases

### Test 1: Process Current File

1. Open a Python file in VS Code
2. Configure the extension to use the test agent script:
   - Open VS Code settings (File > Preferences > Settings)
   - Search for "dev-agent"
   - Set `dev-agent.scriptPath` to the path of the test_agent.py script
   - Set `dev-agent.pythonPath` to the path of your Python executable
3. Right-click in the editor and select "Dev Agent: Process Current File"
4. Select "provide pseudo code to current file" from the quick pick menu
5. The Dev Agent chat panel should open with pseudo code for the current file

**Expected Result**: The extension should take the current file content and pass it to the test_agent.py script, which should return pseudo code for the file.

### Test 2: Upload and Process File

1. Run the command "Dev Agent: Upload and Process File" from the Command Palette (Ctrl+Shift+P)
2. Select a Python file from your file system
3. Select "explain this code" from the quick pick menu
4. The Dev Agent chat panel should open with an explanation of the code

**Expected Result**: The extension should take the uploaded file content and pass it to the test_agent.py script, which should return an explanation of the code.

### Test 3: Agent Script Not Found

1. Open VS Code settings (File > Preferences > Settings)
2. Set `dev-agent.scriptPath` to a non-existent path (e.g., "non_existent_agent.py")
3. Right-click in the editor and select "Dev Agent: Process Current File"
4. Select any command from the quick pick menu

**Expected Result**: The extension should display an error message indicating that the agent script was not found, along with the command that would have been executed.

## Verifying the Results

For each test case, verify that:

1. The extension correctly passes the file content to the agent script
2. The agent script processes the content and returns a response
3. The response is displayed in the chat panel
4. Error messages are displayed when the agent script is not found

## Troubleshooting

If you encounter issues:

1. Check the VS Code Developer Tools (Help > Toggle Developer Tools) for error messages
2. Verify that the paths in the settings are correct
3. Make sure the test_agent.py script is executable
4. Check that Python is installed and available in your PATH