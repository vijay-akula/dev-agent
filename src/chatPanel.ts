import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { exec, spawn } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

export class ChatPanel {
  public static currentPanel: ChatPanel | undefined;
  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private _disposables: vscode.Disposable[] = [];
  private _chatHistory: Array<{role: 'user' | 'agent' | 'system', content: string}> = [];
  private _currentFile: { path: string, content: string } | null = null;

  public static createOrShow(extensionUri: vscode.Uri) {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    // If we already have a panel, show it
    if (ChatPanel.currentPanel) {
      ChatPanel.currentPanel._panel.reveal(column);
      return;
    }

    // Otherwise, create a new panel
    const panel = vscode.window.createWebviewPanel(
      'devAgentChat',
      'Dev Agent Chat',
      vscode.ViewColumn.Beside, // Always open in the secondary sidebar
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [
          vscode.Uri.joinPath(extensionUri, 'media'),
          vscode.Uri.joinPath(extensionUri, 'out')
        ]
      }
    );

    ChatPanel.currentPanel = new ChatPanel(panel, extensionUri);
  }

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    this._panel = panel;
    this._extensionUri = extensionUri;

    // Add initial welcome message to chat history
    this._chatHistory.push({
      role: 'system',
      content: 'Welcome to Dev Agent! You can ask questions about your code, use @dev-agent commands, or upload files for analysis.'
    });

    // Set the webview's initial html content
    this._update();

    // Listen for when the panel is disposed
    // This happens when the user closes the panel or when the panel is closed programmatically
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

    // Handle messages from the webview
    this._panel.webview.onDidReceiveMessage(
      async (message) => {
        switch (message.command) {
          case 'clearChat':
            // Clear chat history
            this._chatHistory = [];
            // Clear current file
            this._currentFile = null;
            // Update the webview
            this._update();
            break;
          case 'execute':
            await this.handleExecuteCommand(message);
            break;
          case 'executeCode':
            // Get the current file content if available
            const editor = vscode.window.activeTextEditor;
            let fileContent = '';
            let fileName = '';
            
            if (editor) {
              fileContent = editor.document.getText();
              fileName = path.basename(editor.document.fileName);
            }
            
            // Add user message to chat history
            this._chatHistory.push({
              role: 'user',
              content: message.code
            });
            
            try {
              // Show loading indicator
              this._panel.webview.postMessage({ 
                command: 'loading', 
                isLoading: true 
              });
              
              const result = await this.executeCode(message.code, fileContent, fileName);
              
              // Add agent response to chat history
              this._chatHistory.push({
                role: 'agent',
                content: result
              });
              
              // Send result to webview
              this._panel.webview.postMessage({ 
                command: 'response', 
                text: result,
                isLoading: false
              });
              
              // Update the webview
              this._update();
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : String(error);
              
              // Add error to chat history
              this._chatHistory.push({
                role: 'agent',
                content: `Error: ${errorMessage}`
              });
              
              this._panel.webview.postMessage({ 
                command: 'response', 
                text: `Error: ${errorMessage}`,
                isError: true,
                isLoading: false
              });
              
              // Update the webview
              this._update();
            }
            break;
          case 'devAgentCommand':
            // Get the current file content if available
            const editorForCommand = vscode.window.activeTextEditor;
            let fileContentForCommand = '';
            let fileNameForCommand = '';
            
            if (editorForCommand) {
              fileContentForCommand = editorForCommand.document.getText();
              fileNameForCommand = path.basename(editorForCommand.document.fileName);
            }
            
            // Add user message to chat history
            this._chatHistory.push({
              role: 'user',
              content: `@dev-agent ${message.text}`
            });
            
            try {
              // Show loading indicator
              this._panel.webview.postMessage({ 
                command: 'loading', 
                isLoading: true 
              });
              
              const result = await this.runAgentScript(
                message.text, 
                'custom', 
                fileContentForCommand, 
                fileNameForCommand
              );
              
              // Add agent response to chat history
              this._chatHistory.push({
                role: 'agent',
                content: result
              });
              
              // Send result to webview
              this._panel.webview.postMessage({ 
                command: 'response', 
                text: result,
                isLoading: false
              });
              
              // Update the webview
              this._update();
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : String(error);
              
              // Add error to chat history
              this._chatHistory.push({
                role: 'agent',
                content: `Error: ${errorMessage}`
              });
              
              this._panel.webview.postMessage({ 
                command: 'response', 
                text: `Error: ${errorMessage}`,
                isError: true,
                isLoading: false
              });
              
              // Update the webview
              this._update();
            }
            break;
          case 'uploadFile':
            vscode.commands.executeCommand('dev-agent.uploadFile');
            break;
          case 'useCurrentFile':
            await this.handleUseCurrentFile();
            break;
        }
      },
      null,
      this._disposables
    );
  }

  private async handleExecuteCommand(message: any) {
    const prompt = message.prompt;
    const isDevAgentCommand = message.isDevAgentCommand;
    const currentFile = message.currentFile || this._currentFile;

    // Add user message to chat history
    this._chatHistory.push({
      role: 'user',
      content: prompt
    });

    // Update the webview to show the user message
    this._update();

    try {
      let command = prompt;
      let commandType = 'custom';
      let fileContent = '';
      let filePath = '';

      // If we have a current file, use it
      if (currentFile) {
        fileContent = currentFile.content;
        filePath = currentFile.path;
      }

      // If it's a dev-agent command, extract the actual command
      if (isDevAgentCommand && prompt.startsWith('@dev-agent')) {
        command = prompt.substring('@dev-agent'.length).trim();
      }

      // Determine command type
      if (command.toLowerCase().includes('pseudo code')) {
        commandType = 'pseudo_code';
      } else if (command.toLowerCase().includes('explain')) {
        commandType = 'explain';
      }

      // Show loading indicator
      this._panel.webview.postMessage({ 
        command: 'response', 
        text: 'Processing your request...',
        isLoading: true 
      });

      // Run the agent script
      const result = await this.runAgentScript(command, commandType, fileContent, filePath);

      // Add agent response to chat history
      this._chatHistory.push({
        role: 'agent',
        content: result
      });

      // Send result to webview
      this._panel.webview.postMessage({ 
        command: 'response', 
        text: result,
        isLoading: false
      });

      // Update the webview
      this._update();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      // Add error to chat history
      this._chatHistory.push({
        role: 'agent',
        content: `Error: ${errorMessage}`
      });

      this._panel.webview.postMessage({ 
        command: 'response', 
        text: `Error: ${errorMessage}`,
        isError: true,
        isLoading: false
      });

      // Update the webview
      this._update();
    }
  }

  private async handleUploadFile() {
    // Show file picker dialog
    const fileUris = await vscode.window.showOpenDialog({
      canSelectMany: false,
      openLabel: 'Select File',
      filters: {
        'All Files': ['*']
      }
    });

    if (!fileUris || fileUris.length === 0) {
      return;
    }

    const fileUri = fileUris[0];
    
    try {
      // Read the file content
      const fileContent = await vscode.workspace.fs.readFile(fileUri);
      const content = Buffer.from(fileContent).toString('utf8');
      const filePath = fileUri.fsPath;
      
      // Update the current file using our helper method
      this.updateCurrentFile(filePath, content);
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to read file: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async handleUseCurrentFile() {
    // First try to get the active editor
    const editor = vscode.window.activeTextEditor;
    
    if (editor) {
      const document = editor.document;
      const fileContent = document.getText();
      const filePath = document.fileName;
      
      // Update with the active editor file
      this.updateCurrentFile(filePath, fileContent);
      return;
    }
    
    // If no active editor, try to get the selected file in explorer
    try {
      // Get the selected file in the explorer
      const uris = await vscode.window.showOpenDialog({
        canSelectMany: false,
        openLabel: 'Select File',
        filters: {
          'All Files': ['*']
        }
      });
      
      if (uris && uris.length > 0) {
        const fileUri = uris[0];
        const fileContent = await vscode.workspace.fs.readFile(fileUri);
        const content = Buffer.from(fileContent).toString('utf8');
        const filePath = fileUri.fsPath;
        
        // Update with the selected file
        this.updateCurrentFile(filePath, content);
      } else {
        vscode.window.showInformationMessage('No file selected');
      }
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to read file: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  // Helper method to update the current file
  private updateCurrentFile(filePath: string, fileContent: string) {
    // Update the current file
    this._currentFile = {
      path: filePath,
      content: fileContent
    };

    // Notify the webview about the file context update
    this._panel.webview.postMessage({
      command: 'updateFileContext',
      filePath: filePath,
      fileContent: fileContent
    });

    // Add a system message to the chat history
    this._chatHistory.push({
      role: 'system',
      content: `File loaded: ${path.basename(filePath)}`
    });

    // Update the webview
    this._update();
  }

  public processAtMention(command: string, fileContent: string, filePath: string) {
    // Add user message to chat history
    this._chatHistory.push({
      role: 'user',
      content: `@dev-agent ${command}`
    });

    // Update the current file
    this._currentFile = {
      path: filePath,
      content: fileContent
    };

    // Update the webview
    this._update();

    // Process the command
    this.processCommand(command, fileContent, filePath);
  }

  private async processCommand(command: string, fileContent: string, filePath: string) {
    try {
      // Determine command type
      let commandType = 'custom';
      if (command.toLowerCase().includes('pseudo code')) {
        commandType = 'pseudo_code';
      } else if (command.toLowerCase().includes('explain')) {
        commandType = 'explain';
      }
      
      // Show loading indicator
      this._panel.webview.postMessage({ 
        command: 'response', 
        text: 'Processing your request...',
        isLoading: true 
      });
      
      // Run the agent script
      const result = await this.runAgentScript(command, commandType, fileContent, filePath);
      
      // Add agent response to chat history
      this._chatHistory.push({
        role: 'agent',
        content: result
      });
      
      // Send result to webview
      this._panel.webview.postMessage({ 
        command: 'response', 
        text: result,
        isLoading: false
      });
      
      // Update the webview
      this._update();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Add error to chat history
      this._chatHistory.push({
        role: 'agent',
        content: `Error: ${errorMessage}`
      });
      
      this._panel.webview.postMessage({ 
        command: 'response', 
        text: `Error: ${errorMessage}`,
        isError: true,
        isLoading: false
      });
      
      // Update the webview
      this._update();
    }
  }

  public async processUploadedFile(fileName: string, fileContent: string, command: string) {
    // Add user message to chat history
    this._chatHistory.push({
      role: 'user',
      content: `@dev-agent ${command} (File: ${fileName})`
    });
    
    try {
      // Show loading indicator
      this._panel.webview.postMessage({ 
        command: 'loading', 
        isLoading: true 
      });
      
      // Run the agent script with the uploaded file
      const result = await this.runAgentScript(command, 'custom', fileContent, fileName);
      
      // Add agent response to chat history
      this._chatHistory.push({
        role: 'agent',
        content: result
      });
      
      // Send result to webview
      this._panel.webview.postMessage({ 
        command: 'result', 
        result: result,
        isLoading: false
      });
      
      // Update the webview
      this._update();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Add error to chat history
      this._chatHistory.push({
        role: 'agent',
        content: `Error: ${errorMessage}`
      });
      
      this._panel.webview.postMessage({ 
        command: 'error', 
        error: errorMessage,
        isLoading: false
      });
      
      // Update the webview
      this._update();
    }
  }
  
  private async executeCode(code: string, fileContent: string = '', fileName: string = '') {
    // Check if the code is a @dev-agent command
    if (code.startsWith('@dev-agent')) {
      const command = code.substring('@dev-agent'.length).trim();
      return await this.runAgentScript(command, 'custom', fileContent, fileName);
    }
    
    // Otherwise, treat it as regular code to execute
    try {
      // If there's a current file, use it as input
      if (fileContent && fileName) {
        return await this.runAgentScript(code, 'custom', fileContent, fileName);
      } else {
        // No current file, just execute the code as is
        return await this.runAgentScript(code, 'custom', '', '');
      }
    } catch (error) {
      throw error;
    }
  }
  
  private async runAgentScript(
    userCommand: string, 
    commandType: string, 
    fileContent: string, 
    filePath: string
  ): Promise<string> {
    // Get the configuration
    const config = vscode.workspace.getConfiguration('dev-agent');
    const scriptPath = config.get<string>('scriptPath', 'agent.py');
    const pythonPath = config.get<string>('pythonPath', 'python');
    const additionalArgs = config.get<string>('additionalArgs', '');
    
    // Resolve the script path
    let resolvedScriptPath = scriptPath;
    
    // If the path is not absolute, try to resolve it
    if (!path.isAbsolute(resolvedScriptPath)) {
      // Try to find the script in the workspace folders
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (workspaceFolders) {
        for (const folder of workspaceFolders) {
          const potentialPath = path.join(folder.uri.fsPath, resolvedScriptPath);
          if (fs.existsSync(potentialPath)) {
            resolvedScriptPath = potentialPath;
            break;
          }
        }
      }
      
      // If still not found, try to find it in the extension directory
      if (!fs.existsSync(resolvedScriptPath)) {
        const extensionPath = vscode.extensions.getExtension('dev-agent.dev-agent')?.extensionPath || 
                              path.dirname(this._extensionUri.fsPath);
        const potentialPath = path.join(extensionPath, 'scripts', resolvedScriptPath);
        if (fs.existsSync(potentialPath)) {
          resolvedScriptPath = potentialPath;
        }
      }
    }
    
    // Check if the agent script exists
    if (!fs.existsSync(resolvedScriptPath)) {
      const command = `${pythonPath} "${resolvedScriptPath}" ${additionalArgs}`;
      return `Error: Agent script not found at ${resolvedScriptPath}\n\nCommand that would have been executed:\n${command}\n\nPlease check the 'dev-agent.scriptPath' setting in your VS Code settings.`;
    }
    
    // Create a temporary file for the request data
    const tempDir = path.join(os.tmpdir(), 'dev-agent');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    const tempFile = path.join(tempDir, `request_${Date.now()}.json`);
    
    // Create the request data
    const requestData = {
      command: commandType,
      content: userCommand,
      fileContent: fileContent,
      filePath: filePath,
      // Add new fields for the enhanced functionality
      prompt: userCommand,
      input: fileContent
    };
    
    // Write the request data to the temporary file
    fs.writeFileSync(tempFile, JSON.stringify(requestData, null, 2));
    
    // Construct the command
    const command = `${pythonPath} "${resolvedScriptPath}" --input-file "${tempFile}" ${additionalArgs}`.trim();
    
    try {
      // Set a timeout for execution (30 seconds)
      const timeoutMs = 30000;
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Agent script execution timed out after 30 seconds')), timeoutMs);
      });
      
      // Execute the agent script with timeout
      const execPromiseWithTimeout = Promise.race([
        execPromise(command),
        timeoutPromise
      ]);
      
      const { stdout, stderr } = await execPromiseWithTimeout as { stdout: string, stderr: string };
      
      if (stderr) {
        console.error('Agent script stderr:', stderr);
        return `${stdout}\n\nWarnings/Errors:\n${stderr}`;
      }
      
      return stdout || 'Agent script executed successfully with no output.';
    } catch (error) {
      if (error instanceof Error && error.message.includes('timed out')) {
        throw error;
      }
      
      // Return a detailed error message including the command that was executed
      return `Error executing agent script:\n${error instanceof Error ? error.message : String(error)}\n\nCommand executed:\n${command}\n\nPlease check your settings and ensure the script exists and is executable.`;
    } finally {
      // Clean up the temporary file
      try {
        fs.unlinkSync(tempFile);
      } catch (error) {
        console.error('Failed to delete temporary file:', error);
      }
    }
  }

  public dispose() {
    ChatPanel.currentPanel = undefined;

    // Clean up our resources
    this._panel.dispose();

    while (this._disposables.length) {
      const x = this._disposables.pop();
      if (x) {
        x.dispose();
      }
    }
  }

  private _update() {
    const webview = this._panel.webview;
    this._panel.webview.html = this._getHtmlForWebview(webview);
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    // Get the current file info if available
    let currentFileInfo = 'No file selected';
    if (this._currentFile) {
      currentFileInfo = path.basename(this._currentFile.path);
    }
    
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Dev Agent Chat</title>
        <style>
            body {
                font-family: var(--vscode-font-family);
                padding: 0;
                margin: 0;
                color: var(--vscode-foreground);
                background-color: var(--vscode-editor-background);
                display: flex;
                flex-direction: column;
                height: 100vh;
            }
            #header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 8px 16px;
                background-color: var(--vscode-editor-background);
                border-bottom: 1px solid var(--vscode-panel-border);
            }
            .current-file {
                font-size: 0.9em;
                color: var(--vscode-descriptionForeground);
                margin-right: 10px;
                display: flex;
                align-items: center;
            }
            .file-icon {
                margin-right: 5px;
            }
            #file-actions {
                display: flex;
                gap: 8px;
            }
            #header-title {
                font-size: 14px;
                font-weight: bold;
            }
            #header-actions {
                display: flex;
                gap: 8px;
            }
            .header-button {
                background: none;
                border: none;
                color: var(--vscode-button-foreground);
                cursor: pointer;
                padding: 4px 8px;
                font-size: 12px;
                border-radius: 4px;
                background-color: var(--vscode-button-background);
            }
            .header-button:hover {
                background-color: var(--vscode-button-hoverBackground);
            }
            #chat-container {
                flex: 1;
                overflow-y: auto;
                padding: 16px;
                display: flex;
                flex-direction: column;
                gap: 16px;
            }
            .message-container {
                display: flex;
                flex-direction: column;
                max-width: 90%;
            }
            .message-container.user {
                align-self: flex-end;
            }
            .message-container.agent {
                align-self: flex-start;
            }
            .message-container.system {
                align-self: center;
                max-width: 80%;
            }
            .message-header {
                display: flex;
                align-items: center;
                margin-bottom: 4px;
            }
            .avatar {
                width: 24px;
                height: 24px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                margin-right: 8px;
                color: white;
            }
            .user .avatar {
                background-color: var(--vscode-statusBarItem-remoteBackground);
            }
            .agent .avatar {
                background-color: var(--vscode-statusBarItem-prominentBackground);
            }
            .system .avatar {
                background-color: var(--vscode-editorInfo-foreground);
            }
            .message-sender {
                font-weight: 500;
                font-size: 12px;
            }
            .message-content {
                padding: 8px 12px;
                border-radius: 8px;
                font-size: 14px;
                line-height: 1.4;
            }
            .user .message-content {
                background-color: var(--vscode-editor-inactiveSelectionBackground);
                color: var(--vscode-editor-foreground);
            }
            .agent .message-content {
                background-color: var(--vscode-editor-selectionBackground);
                color: var(--vscode-editor-foreground);
            }
            .system .message-content {
                background-color: var(--vscode-editor-lineHighlightBackground);
                color: var(--vscode-editor-foreground);
                font-style: italic;
            }
            .message-content pre {
                background-color: var(--vscode-textCodeBlock-background);
                padding: 8px;
                border-radius: 4px;
                overflow-x: auto;
                margin: 8px 0;
            }
            .message-content code {
                font-family: var(--vscode-editor-font-family);
                font-size: 13px;
            }
            #input-container {
                padding: 16px;
                border-top: 1px solid var(--vscode-panel-border);
                background-color: var(--vscode-editor-background);
            }
            #context-display {
                display: flex;
                align-items: center;
                padding: 4px 8px;
                background-color: var(--vscode-editor-lineHighlightBackground);
                border-radius: 4px;
                margin-bottom: 8px;
                font-size: 12px;
            }
            #context-display.hidden {
                display: none;
            }
            #input-wrapper {
                display: flex;
                flex-direction: column;
            }
            #chat-input {
                resize: none;
                padding: 8px 12px;
                border-radius: 4px;
                border: 1px solid var(--vscode-input-border);
                background-color: var(--vscode-input-background);
                color: var(--vscode-input-foreground);
                font-family: var(--vscode-font-family);
                font-size: 14px;
                min-height: 60px;
                max-height: 200px;
            }
            #chat-input:focus {
                outline: none;
                border-color: var(--vscode-focusBorder);
            }
            #button-container {
                display: flex;
                justify-content: space-between;
                margin-top: 8px;
            }
            #file-buttons {
                display: flex;
                gap: 8px;
            }
            .file-button {
                background: none;
                border: 1px solid var(--vscode-button-background);
                color: var(--vscode-button-background);
                cursor: pointer;
                padding: 4px 8px;
                font-size: 12px;
                border-radius: 4px;
                background-color: transparent;
            }
            .file-button:hover {
                background-color: var(--vscode-button-background);
                color: var(--vscode-button-foreground);
            }
            #send-button {
                background-color: var(--vscode-button-background);
                color: var(--vscode-button-foreground);
                border: none;
                padding: 6px 12px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 13px;
            }
            #send-button:hover {
                background-color: var(--vscode-button-hoverBackground);
            }
            .loading {
                display: inline-block;
                width: 16px;
                height: 16px;
                border: 2px solid rgba(255, 255, 255, 0.3);
                border-radius: 50%;
                border-top-color: var(--vscode-button-foreground);
                animation: spin 1s ease-in-out infinite;
                margin-left: 8px;
            }
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
        </style>
    </head>
    <body>
        <div id="header">
            <div id="header-title">Dev Agent Chat</div>
            <div class="current-file">
                <span class="file-icon">📄</span>
                <span id="current-file-name">${currentFileInfo}</span>
            </div>
            <div id="header-actions">
                <button id="clear-chat" class="header-button">Clear Chat</button>
            </div>
        </div>
        
        <div id="chat-container">
            ${this._chatHistory.map(message => {
                let avatarLetter = '';
                let displayName = '';
                
                switch (message.role) {
                    case 'user':
                        avatarLetter = 'U';
                        displayName = 'You';
                        break;
                    case 'agent':
                        avatarLetter = 'A';
                        displayName = 'Dev Agent';
                        break;
                    case 'system':
                        avatarLetter = 'S';
                        displayName = 'System';
                        break;
                }
                
                // Simple markdown rendering for code blocks and headers
                let content = message.content;
                if (typeof content === 'string') {
                    content = content
                        .replace(/```(\\w*)\\n([\\s\\S]*?)```/g, '<pre><code class="language-$1">$2</code></pre>')
                        .replace(/^# (.*)$/gm, '<h1>$1</h1>')
                        .replace(/^## (.*)$/gm, '<h2>$1</h2>')
                        .replace(/^### (.*)$/gm, '<h3>$1</h3>')
                        .replace(/\\*\\*(.*)\\*\\*/g, '<strong>$1</strong>')
                        .replace(/\\*(.*)\\*/g, '<em>$1</em>')
                        .replace(/\\n/g, '<br>');
                }
                
                return `
                <div class="message-container ${message.role}">
                    <div class="message-header">
                        <div class="avatar">${avatarLetter}</div>
                        <div class="message-sender">${displayName}</div>
                    </div>
                    <div class="message-content">${content}</div>
                </div>
                `;
            }).join('')}
        </div>
        
        <div id="input-container">
            <div id="context-display" class="${this._currentFile ? '' : 'hidden'}">
                <span class="file-icon">📄</span>
                <span id="context-filename">${currentFileInfo}</span>
                <button id="clear-context" style="margin-left: auto; background: none; border: none; cursor: pointer; color: var(--vscode-editor-foreground);">×</button>
            </div>
            
            <div id="input-wrapper">
                <textarea id="chat-input" placeholder="Ask a question or type @dev-agent followed by a command..."></textarea>
                
                <div id="button-container">
                    <div id="file-buttons">
                        <button id="upload-file" class="file-button">Upload File</button>
                        <button id="use-current-file" class="file-button">Use Current File</button>
                    </div>
                    <button id="send-button">Send</button>
                </div>
            </div>
        </div>
        
        <script>
            const vscode = acquireVsCodeApi();
            
            // DOM elements
            const chatContainer = document.getElementById('chat-container');
            const chatInput = document.getElementById('chat-input');
            const sendButton = document.getElementById('send-button');
            const clearChatButton = document.getElementById('clear-chat');
            const uploadFileButton = document.getElementById('upload-file');
            const useCurrentFileButton = document.getElementById('use-current-file');
            const contextDisplay = document.getElementById('context-display');
            const clearContextButton = document.getElementById('clear-context');
            const currentFileName = document.getElementById('current-file-name');
            const contextFilename = document.getElementById('context-filename');
            
            // Scroll to bottom of chat
            function scrollToBottom() {
                chatContainer.scrollTop = chatContainer.scrollHeight;
            }
            
            // Scroll to bottom initially
            scrollToBottom();
            
            // Handle send button click
            sendButton.addEventListener('click', () => {
                const prompt = chatInput.value.trim();
                if (!prompt) return;
                
                // Check if it's a dev-agent command
                const isDevAgentCommand = prompt.startsWith('@dev-agent');
                
                // Send message to extension
                vscode.postMessage({
                    command: 'execute',
                    prompt: prompt,
                    isDevAgentCommand: isDevAgentCommand
                });
                
                // Clear input
                chatInput.value = '';
            });
            
            // Handle Enter key (Shift+Enter for new line)
            chatInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendButton.click();
                }
            });
            
            // Handle clear chat button
            clearChatButton.addEventListener('click', () => {
                vscode.postMessage({
                    command: 'clearChat'
                });
            });
            
            // Handle upload file button
            uploadFileButton.addEventListener('click', () => {
                vscode.postMessage({
                    command: 'uploadFile'
                });
            });
            
            // Handle use current file button
            useCurrentFileButton.addEventListener('click', () => {
                vscode.postMessage({
                    command: 'useCurrentFile'
                });
            });
            
            // Handle clear context button
            clearContextButton.addEventListener('click', () => {
                vscode.postMessage({
                    command: 'clearContext'
                });
                contextDisplay.classList.add('hidden');
            });
            
            // Handle messages from extension
            window.addEventListener('message', (event) => {
                const message = event.data;
                
                switch (message.command) {
                    case 'response':
                        // Response will be rendered in the chat history
                        scrollToBottom();
                        break;
                    case 'updateFileContext':
                        // Update file context display
                        contextDisplay.classList.remove('hidden');
                        const fileName = message.filePath.split('/').pop();
                        currentFileName.textContent = fileName;
                        contextFilename.textContent = fileName;
                        break;
                }
            });
        </script>
    </body>
    </html>`;
  }
}

function getNonce() {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}