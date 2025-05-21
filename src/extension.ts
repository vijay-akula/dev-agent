import * as vscode from 'vscode';
import * as path from 'path';
import { ChatViewProvider } from './chatViewProvider';

let chatViewProvider: ChatViewProvider | undefined;

export function activate(context: vscode.ExtensionContext) {
  console.log('Dev Agent extension is now active!');

  // Register the chat view provider
  chatViewProvider = new ChatViewProvider(context.extensionUri);
  
  const chatViewDisposable = vscode.window.registerWebviewViewProvider(
    'dev-agent-chat-panel',
    chatViewProvider,
    {
      webviewOptions: {
        retainContextWhenHidden: true
      }
    }
  );
  
  context.subscriptions.push(chatViewDisposable);

  // Register the command to start the Dev Agent
  let startChatDisposable = vscode.commands.registerCommand('dev-agent.startChat', () => {
    vscode.commands.executeCommand('workbench.view.extension.dev-agent-panel');
  });

  // For backward compatibility with the previous command name
  let startDisposable = vscode.commands.registerCommand('dev-agent.start', () => {
    vscode.commands.executeCommand('workbench.view.extension.dev-agent-panel');
  });

  // Register command to process @dev-agent mentions in editors
  let processAtMentionDisposable = vscode.commands.registerCommand('dev-agent.processAtMention', async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage('No active editor found');
      return;
    }

    const document = editor.document;
    const selection = editor.selection;
    const text = document.getText(selection);

    if (text.trim().startsWith('@dev-agent')) {
      // Extract the command after @dev-agent
      const command = text.trim().substring('@dev-agent'.length).trim();
      
      // Get the entire file content
      const fileContent = document.getText();
      const filePath = document.fileName;
      
      // Open the chat panel and send the command
      vscode.commands.executeCommand('workbench.view.extension.dev-agent-panel');
      
      // Wait for the view to be ready
      if (chatViewProvider) {
        chatViewProvider.onReady(() => {
          chatViewProvider?.processAtMention(command, fileContent, filePath);
        });
      }
    } else {
      vscode.window.showInformationMessage('Please select text starting with @dev-agent');
    }
  });

  // Add a text editor command to detect and process @dev-agent mentions
  let textEditorCommandDisposable = vscode.commands.registerTextEditorCommand('dev-agent.detectAtMention', 
    async (textEditor: vscode.TextEditor, edit: vscode.TextEditorEdit) => {
      const document = textEditor.document;
      const text = document.getText();
      
      // Find all @dev-agent mentions in the document
      const regex = /@dev-agent\s+([^\n]+)/g;
      let match;
      const mentions: Array<{command: string, range: vscode.Range}> = [];
      
      while ((match = regex.exec(text)) !== null) {
        mentions.push({
          command: match[1].trim(),
          range: new vscode.Range(
            document.positionAt(match.index),
            document.positionAt(match.index + match[0].length)
          )
        });
      }
      
      if (mentions.length === 0) {
        vscode.window.showInformationMessage('No @dev-agent mentions found in the document');
        return;
      }
      
      // If there's only one mention, process it directly
      if (mentions.length === 1) {
        const fileContent = document.getText();
        const filePath = document.fileName;
        
        vscode.commands.executeCommand('workbench.view.extension.dev-agent-panel');
        
        if (chatViewProvider) {
          chatViewProvider.onReady(() => {
            chatViewProvider?.processAtMention(mentions[0].command, fileContent, filePath);
          });
        }
        return;
      }
      
      // If there are multiple mentions, let the user choose which one to process
      const items = mentions.map(m => ({
        label: m.command,
        description: document.getText(m.range)
      }));
      
      const selected = await vscode.window.showQuickPick(items, {
        placeHolder: 'Select an @dev-agent mention to process'
      });
      
      if (selected) {
        const mention = mentions.find(m => m.command === selected.label);
        if (mention) {
          const fileContent = document.getText();
          const filePath = document.fileName;
          
          vscode.commands.executeCommand('workbench.view.extension.dev-agent-panel');
          
          if (chatViewProvider) {
            chatViewProvider.onReady(() => {
              chatViewProvider?.processAtMention(mention.command, fileContent, filePath);
            });
          }
        }
      }
    }
  );

  // Register command to process the current file
  let processCurrentFileDisposable = vscode.commands.registerCommand('dev-agent.processCurrentFile', async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage('No active editor found');
      return;
    }

    const document = editor.document;
    const fileContent = document.getText();
    const filePath = document.fileName;

    // Show quick pick for command selection
    const commands = [
      'provide pseudo code',
      'explain this code',
      'summarize this file',
      'custom command...'
    ];

    const selectedCommand = await vscode.window.showQuickPick(commands, {
      placeHolder: 'Select a command to run on the current file'
    });

    if (!selectedCommand) {
      return;
    }

    let command = selectedCommand;
    if (selectedCommand === 'custom command...') {
      const customCommand = await vscode.window.showInputBox({
        placeHolder: 'Enter a custom command',
        prompt: 'Enter a command to run on the current file'
      });

      if (!customCommand) {
        return;
      }

      command = customCommand;
    }

    // Open the chat panel and send the command
    vscode.commands.executeCommand('workbench.view.extension.dev-agent-panel');
    
    if (chatViewProvider) {
      chatViewProvider.onReady(() => {
        chatViewProvider?.processAtMention(command, fileContent, filePath);
      });
    }
  });

  // Register command to upload a file
  let uploadFileDisposable = vscode.commands.registerCommand('dev-agent.uploadFile', async () => {
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
      
      // Show quick pick for command selection
      const commands = [
        'provide pseudo code',
        'explain this code',
        'summarize this file',
        'custom command...'
      ];

      const selectedCommand = await vscode.window.showQuickPick(commands, {
        placeHolder: 'Select a command to run on the uploaded file'
      });

      if (!selectedCommand) {
        return;
      }

      let command = selectedCommand;
      if (selectedCommand === 'custom command...') {
        const customCommand = await vscode.window.showInputBox({
          placeHolder: 'Enter a custom command',
          prompt: 'Enter a command to run on the uploaded file'
        });

        if (!customCommand) {
          return;
        }

        command = customCommand;
      }

      // Open the chat panel and send the command
      vscode.commands.executeCommand('workbench.view.extension.dev-agent-panel');
      
      if (chatViewProvider) {
        chatViewProvider.onReady(() => {
          chatViewProvider?.processUploadedFile(path.basename(filePath), content, command);
          chatViewProvider?.processAtMention(command, content, filePath);
        });
      }
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to read file: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

  // Register command to upload and process a file (for backward compatibility)
  let uploadAndProcessDisposable = vscode.commands.registerCommand('dev-agent.uploadAndProcess', async () => {
    vscode.commands.executeCommand('dev-agent.uploadFile');
  });

  // Add status bar item
  const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  statusBarItem.text = "$(comment) Dev Agent";
  statusBarItem.tooltip = "Open Dev Agent Chat";
  statusBarItem.command = 'dev-agent.startChat';
  statusBarItem.show();

  // Register all disposables
  context.subscriptions.push(
    startChatDisposable,
    startDisposable,
    processAtMentionDisposable,
    textEditorCommandDisposable,
    processCurrentFileDisposable,
    uploadFileDisposable,
    uploadAndProcessDisposable,
    statusBarItem
  );
}

export function deactivate() {
  // Clean up resources
  if (chatViewProvider) {
    chatViewProvider.dispose();
    chatViewProvider = undefined;
  }
}