import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { exec, spawn } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

export class ChatViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'dev-agent-chat-panel';
  private _view?: vscode.WebviewView;
  private _extensionUri: vscode.Uri;
  private _chatHistory: Array<{role: 'user' | 'agent' | 'system', content: string}> = [];
  private _currentFile: { path: string, content: string } | null = null;
  private _readyCallbacks: Array<() => void> = [];
  private _disposables: vscode.Disposable[] = [];

  constructor(extensionUri: vscode.Uri) {
    this._extensionUri = extensionUri;
  }

  public get view(): vscode.WebviewView | undefined {
    return this._view;
  }

  public onReady(callback: () => void): void {
    if (this._view) {
      callback();
    } else {
      this._readyCallbacks.push(callback);
    }
  }

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(this._extensionUri, 'media'),
        vscode.Uri.joinPath(this._extensionUri, 'out')
      ]
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    // Set up message handling
    webviewView.webview.onDidReceiveMessage(
      async (message) => {
        switch (message.command) {
          case 'execute':
            await this.handleExecuteCommand(message);
            break;
          case 'executeCode':
            await this.handleExecuteCode(message);
            break;
          case 'devAgentCommand':
            await this.handleDevAgentCommand(message);
            break;
          case 'uploadFile':
            vscode.commands.executeCommand('dev-agent.uploadFile');
            break;
          case 'useCurrentFile':
            await this.handleUseCurrentFile();
            break;
          case 'clearChat':
            this.clearChat();
            break;
        }
      },
      null,
      this._disposables
    );

    // Notify that the view is ready
    this._readyCallbacks.forEach(callback => callback());
    this._readyCallbacks = [];
  }

  public clearChat(): void {
    this._chatHistory = [];
    this._update();
  }

  public processUploadedFile(fileName: string, fileContent: string, command: string): void {
    // Update the current file
    this._currentFile = {
      path: fileName,
      content: fileContent
    };
    
    // Add system message to chat history
    this._chatHistory.push({
      role: 'system',
      content: `File uploaded: ${fileName}`
    });
    
    // Update the webview
    this._update();
    
    // Send message to webview to update file context display
    if (this._view) {
      this._view.webview.postMessage({
        command: 'updateFileContext',
        filePath: fileName,
        fileContent: fileContent
      });
    }
  }

  public processAtMention(command: string, fileContent: string, filePath: string): void {
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

  private async handleExecuteCommand(message: any): Promise<void> {
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
      if (this._view) {
        this._view.webview.postMessage({
          command: 'response',
          text: 'Processing your request...',
          isLoading: true
        });
      }

      // Run the agent script
      const result = await this.runAgentScript(command, commandType, fileContent, filePath);

      // Add agent response to chat history
      this._chatHistory.push({
        role: 'agent',
        content: result
      });

      // Send result to webview
      if (this._view) {
        this._view.webview.postMessage({
          command: 'response',
          text: result,
          isLoading: false
        });
      }

      // Update the webview
      this._update();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      // Add error to chat history
      this._chatHistory.push({
        role: 'agent',
        content: `Error: ${errorMessage}`
      });

      if (this._view) {
        this._view.webview.postMessage({
          command: 'response',
          text: `Error: ${errorMessage}`,
          isError: true,
          isLoading: false
        });
      }

      // Update the webview
      this._update();
    }
  }

  private async handleExecuteCode(message: any): Promise<void> {
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
      if (this._view) {
        this._view.webview.postMessage({
          command: 'loading',
          isLoading: true
        });
      }

      const result = await this.executeCode(message.code, fileContent, fileName);

      // Add agent response to chat history
      this._chatHistory.push({
        role: 'agent',
        content: result
      });

      // Send result to webview
      if (this._view) {
        this._view.webview.postMessage({
          command: 'response',
          text: result,
          isLoading: false
        });
      }

      // Update the webview
      this._update();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      // Add error to chat history
      this._chatHistory.push({
        role: 'agent',
        content: `Error: ${errorMessage}`
      });

      if (this._view) {
        this._view.webview.postMessage({
          command: 'response',
          text: `Error: ${errorMessage}`,
          isError: true,
          isLoading: false
        });
      }

      // Update the webview
      this._update();
    }
  }

  private async handleDevAgentCommand(message: any): Promise<void> {
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
      if (this._view) {
        this._view.webview.postMessage({
          command: 'loading',
          isLoading: true
        });
      }

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
      if (this._view) {
        this._view.webview.postMessage({
          command: 'response',
          text: result,
          isLoading: false
        });
      }

      // Update the webview
      this._update();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      // Add error to chat history
      this._chatHistory.push({
        role: 'agent',
        content: `Error: ${errorMessage}`
      });

      if (this._view) {
        this._view.webview.postMessage({
          command: 'response',
          text: `Error: ${errorMessage}`,
          isError: true,
          isLoading: false
        });
      }

      // Update the webview
      this._update();
    }
  }

  private async handleUseCurrentFile(): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      // Try to get the file from the explorer selection
      const selectedFiles = await this.getSelectedFilesFromExplorer();
      if (selectedFiles.length > 0) {
        const fileUri = selectedFiles[0];
        try {
          const fileContent = await vscode.workspace.fs.readFile(fileUri);
          const content = Buffer.from(fileContent).toString('utf8');
          const filePath = fileUri.fsPath;
          
          // Update the current file
          this._currentFile = {
            path: filePath,
            content: content
          };
          
          // Add system message to chat history
          this._chatHistory.push({
            role: 'system',
            content: `File loaded: ${path.basename(filePath)}`
          });
          
          // Update the webview
          this._update();
          
          // Notify the webview about the file context update
          if (this._view) {
            this._view.webview.postMessage({
              command: 'updateFileContext',
              filePath: filePath,
              fileContent: content
            });
          }
          
          return;
        } catch (error) {
          vscode.window.showErrorMessage(`Failed to read file: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
      
      vscode.window.showErrorMessage('No active editor or selected file found');
      return;
    }

    const document = editor.document;
    const fileContent = document.getText();
    const filePath = document.fileName;
    
    // Update the current file
    this._currentFile = {
      path: filePath,
      content: fileContent
    };
    
    // Add system message to chat history
    this._chatHistory.push({
      role: 'system',
      content: `File loaded: ${path.basename(filePath)}`
    });
    
    // Update the webview
    this._update();
    
    // Notify the webview about the file context update
    if (this._view) {
      this._view.webview.postMessage({
        command: 'updateFileContext',
        filePath: filePath,
        fileContent: fileContent
      });
    }
  }

  private async getSelectedFilesFromExplorer(): Promise<vscode.Uri[]> {
    // This is a workaround to get the selected files in the explorer
    // It uses the internal API, which might change in future VS Code versions
    try {
      const result = await vscode.commands.executeCommand<vscode.Uri[]>('_getSelectionFromExplorer');
      return result || [];
    } catch (error) {
      console.error('Failed to get selection from explorer:', error);
      return [];
    }
  }

  public async processCommand(command: string, fileContent: string, filePath: string): Promise<void> {
    try {
      // Show loading indicator
      if (this._view) {
        this._view.webview.postMessage({
          command: 'loading',
          isLoading: true
        });
      }

      // Determine command type
      let commandType = 'custom';
      if (command.toLowerCase().includes('pseudo code')) {
        commandType = 'pseudo_code';
      } else if (command.toLowerCase().includes('explain')) {
        commandType = 'explain';
      }

      // Run the agent script
      const result = await this.runAgentScript(command, commandType, fileContent, filePath);

      // Add agent response to chat history
      this._chatHistory.push({
        role: 'agent',
        content: result
      });

      // Send result to webview
      if (this._view) {
        this._view.webview.postMessage({
          command: 'response',
          text: result,
          isLoading: false
        });
      }

      // Update the webview
      this._update();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      // Add error to chat history
      this._chatHistory.push({
        role: 'agent',
        content: `Error: ${errorMessage}`
      });

      if (this._view) {
        this._view.webview.postMessage({
          command: 'response',
          text: `Error: ${errorMessage}`,
          isError: true,
          isLoading: false
        });
      }

      // Update the webview
      this._update();
    }
  }

  private async runAgentScript(command: string, commandType: string, fileContent: string, filePath: string): Promise<string> {
    try {
      // Get configuration
      const config = vscode.workspace.getConfiguration('dev-agent');
      const scriptPath = config.get<string>('scriptPath', 'agent.py');
      const pythonPath = config.get<string>('pythonPath', 'python');
      const additionalArgs = config.get<string>('additionalArgs', '');

      // Resolve script path
      let resolvedScriptPath = scriptPath;
      if (!path.isAbsolute(scriptPath)) {
        // Try to resolve relative to workspace folders
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (workspaceFolders && workspaceFolders.length > 0) {
          const workspacePath = workspaceFolders[0].uri.fsPath;
          resolvedScriptPath = path.join(workspacePath, scriptPath);
          
          // If not found in workspace, try to resolve relative to extension directory
          if (!fs.existsSync(resolvedScriptPath)) {
            resolvedScriptPath = path.join(this._extensionUri.fsPath, scriptPath);
          }
        } else {
          // If no workspace, try to resolve relative to extension directory
          resolvedScriptPath = path.join(this._extensionUri.fsPath, scriptPath);
        }
      }

      // Check if script exists
      if (!fs.existsSync(resolvedScriptPath)) {
        throw new Error(`Agent script not found at ${resolvedScriptPath}`);
      }

      // Create a temporary file for the input
      const tempDir = os.tmpdir();
      const tempFile = path.join(tempDir, `dev_agent_input_${Date.now()}.json`);
      
      // Create input data
      const inputData = {
        command: command,
        command_type: commandType,
        file_content: fileContent,
        file_path: filePath,
        // For backward compatibility
        prompt: command,
        input: fileContent
      };
      
      // Write input data to temp file
      fs.writeFileSync(tempFile, JSON.stringify(inputData, null, 2));
      
      // Build the command
      let cmd = `${pythonPath} "${resolvedScriptPath}" --input-file "${tempFile}"`;
      if (additionalArgs) {
        cmd += ` ${additionalArgs}`;
      }
      
      // Execute the command
      const { stdout, stderr } = await execPromise(cmd, { maxBuffer: 10 * 1024 * 1024 });
      
      // Clean up temp file
      try {
        fs.unlinkSync(tempFile);
      } catch (error) {
        console.error('Failed to delete temp file:', error);
      }
      
      if (stderr) {
        console.warn('Agent script stderr:', stderr);
      }
      
      return stdout || 'No output from agent script';
    } catch (error) {
      console.error('Error running agent script:', error);
      throw error;
    }
  }

  private async executeCode(code: string, fileContent: string, fileName: string): Promise<string> {
    try {
      // Create a temporary file for the code
      const tempDir = os.tmpdir();
      const tempFile = path.join(tempDir, `dev_agent_code_${Date.now()}.py`);
      
      // Write code to temp file
      fs.writeFileSync(tempFile, code);
      
      // Get configuration
      const config = vscode.workspace.getConfiguration('dev-agent');
      const pythonPath = config.get<string>('pythonPath', 'python');
      
      // Execute the code
      const { stdout, stderr } = await execPromise(`${pythonPath} "${tempFile}"`, { 
        maxBuffer: 10 * 1024 * 1024,
        timeout: 30000 // 30 seconds timeout
      });
      
      // Clean up temp file
      try {
        fs.unlinkSync(tempFile);
      } catch (error) {
        console.error('Failed to delete temp file:', error);
      }
      
      let result = '';
      if (stdout) {
        result += stdout;
      }
      if (stderr) {
        if (result) {
          result += '\n\nErrors/Warnings:\n' + stderr;
        } else {
          result = stderr;
        }
      }
      
      return result || 'Code executed successfully with no output';
    } catch (error) {
      console.error('Error executing code:', error);
      throw error;
    }
  }

  private _update() {
    if (!this._view) {
      return;
    }
    
    this._view.webview.html = this._getHtmlForWebview(this._view.webview);
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    // Get the local path to main script run in the webview
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'media', 'main.js')
    );

    // Get the local path to css styles
    const styleMainUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'media', 'main.css')
    );

    // Get the local path to highlight.js styles
    const highlightJsUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'media', 'highlight.min.js')
    );

    const highlightCssUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'media', 'github.min.css')
    );

    // Get the local path to marked.js
    const markedJsUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'media', 'marked.min.js')
    );

    // Use a nonce to only allow specific scripts to be run
    const nonce = getNonce();

    // Convert chat history to HTML
    const chatHistoryHtml = this._chatHistory.map(message => {
      const isUser = message.role === 'user';
      const isSystem = message.role === 'system';
      const className = isUser ? 'user-message' : (isSystem ? 'system-message' : 'agent-message');
      const avatar = isUser ? '👤' : (isSystem ? '🔔' : '🤖');
      
      return `
        <div class="message ${className}">
          <div class="avatar">${avatar}</div>
          <div class="content">
            <div class="markdown-content">${message.content}</div>
          </div>
        </div>
      `;
    }).join('');

    // Get current file context display
    const fileContextHtml = this._currentFile 
      ? `<div class="file-context">Current file: ${path.basename(this._currentFile.path)}</div>`
      : '<div class="file-context">No file selected</div>';

    return `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
      <link href="${styleMainUri}" rel="stylesheet">
      <link href="${highlightCssUri}" rel="stylesheet">
      <title>Dev Agent Chat</title>
    </head>
    <body>
      <div class="chat-container">
        <div class="chat-header">
          <h2>Dev Agent Chat</h2>
          <div class="actions">
            <button id="clear-chat" title="Clear chat history">Clear Chat</button>
          </div>
        </div>
        
        <div class="chat-messages" id="chat-messages">
          ${chatHistoryHtml}
        </div>
        
        <div class="chat-input-container">
          ${fileContextHtml}
          <div class="file-actions">
            <button id="use-current-file">Use Current File</button>
            <button id="upload-file">Upload File</button>
          </div>
          <div class="input-wrapper">
            <textarea id="chat-input" placeholder="Type @dev-agent followed by your command or question..."></textarea>
            <button id="send-button" title="Send">Send</button>
          </div>
        </div>
      </div>
      
      <script nonce="${nonce}" src="${markedJsUri}"></script>
      <script nonce="${nonce}" src="${highlightJsUri}"></script>
      <script nonce="${nonce}" src="${scriptUri}"></script>
    </body>
    </html>`;
  }

  public dispose() {
    // Clean up resources
    this._disposables.forEach(d => d.dispose());
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