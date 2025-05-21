import * as assert from 'assert';
import * as vscode from 'vscode';
import * as sinon from 'sinon';
import * as fs from 'fs';
import * as path from 'path';
import { ChatPanel } from '../../chatPanel';

suite('ChatPanel Test Suite', () => {
  let sandbox: sinon.SinonSandbox;
  
  setup(() => {
    sandbox = sinon.createSandbox();
  });
  
  teardown(() => {
    sandbox.restore();
  });
  
  test('ChatPanel should be created', async () => {
    // Mock the vscode.window.createWebviewPanel
    const mockPanel = {
      webview: {
        html: '',
        onDidReceiveMessage: () => ({ dispose: () => {} }),
        postMessage: () => Promise.resolve(true)
      },
      onDidDispose: () => ({ dispose: () => {} }),
      onDidChangeViewState: () => ({ dispose: () => {} }),
      reveal: () => {},
      dispose: () => {}
    };
    
    const createWebviewPanelStub = sandbox.stub(vscode.window, 'createWebviewPanel').returns(mockPanel as any);
    
    // Create a mock extension URI
    const extensionUri = vscode.Uri.file('/workspace/dev-agent');
    
    // Call the static method to create the panel
    ChatPanel.createOrShow(extensionUri);
    
    // Assert that createWebviewPanel was called with the correct parameters
    assert.strictEqual(createWebviewPanelStub.calledOnce, true);
    assert.strictEqual(createWebviewPanelStub.firstCall.args[0], 'devAgentChat');
    assert.strictEqual(createWebviewPanelStub.firstCall.args[1], 'Dev Agent Chat');
  });
  
  test('executeCode should run Python code and return output', async function() {
    this.timeout(15000); // Increase timeout for this test
    
    // Skip this test if we're not in a real environment
    if (process.env.CI) {
      this.skip();
      return;
    }
    
    // Create a mock extension URI
    const extensionUri = vscode.Uri.file('/workspace/dev-agent');
    
    // Create a mock panel
    const mockPanel = {
      webview: {
        html: '',
        onDidReceiveMessage: () => ({ dispose: () => {} }),
        postMessage: () => Promise.resolve(true)
      },
      onDidDispose: () => ({ dispose: () => {} }),
      onDidChangeViewState: () => ({ dispose: () => {} }),
      reveal: () => {},
      dispose: () => {}
    };
    
    // Stub the vscode.window.createWebviewPanel
    sandbox.stub(vscode.window, 'createWebviewPanel').returns(mockPanel as any);
    
    // Create the panel
    ChatPanel.createOrShow(extensionUri);
    
    // Get the current panel instance
    const panel = ChatPanel.currentPanel;
    
    // Make sure the panel was created
    assert.ok(panel);
    
    if (panel) {
      // Create a simple Python script
      const pythonCode = 'print("Hello, Dev Agent!")';
      
      // Use the private method to execute the code
      // Note: This is a bit of a hack to access a private method for testing
      const result = await (panel as any).executeCode(pythonCode);
      
      // Assert that the result contains the expected output
      assert.ok(result.includes('Hello, Dev Agent!'));
    }
  });
  
  test('processAtMention should call runAgentScript with correct parameters', async () => {
    // Create a mock extension URI
    const extensionUri = vscode.Uri.file('/workspace/dev-agent');
    
    // Create a mock panel
    const mockPanel = {
      webview: {
        html: '',
        onDidReceiveMessage: () => ({ dispose: () => {} }),
        postMessage: () => Promise.resolve(true)
      },
      onDidDispose: () => ({ dispose: () => {} }),
      onDidChangeViewState: () => ({ dispose: () => {} }),
      reveal: () => {},
      dispose: () => {},
      title: 'Dev Agent Chat'
    };
    
    // Stub the vscode.window.createWebviewPanel
    sandbox.stub(vscode.window, 'createWebviewPanel').returns(mockPanel as any);
    
    // Create the panel
    ChatPanel.createOrShow(extensionUri);
    
    // Get the current panel instance
    const panel = ChatPanel.currentPanel;
    
    // Make sure the panel was created
    assert.ok(panel);
    
    if (panel) {
      // Stub the runAgentScript method
      const runAgentScriptStub = sandbox.stub(panel as any, 'runAgentScript').resolves('Test result');
      
      // Call processAtMention
      await panel.processAtMention('provide pseudo code to current file', 'console.log("Hello");', '/test/file.js');
      
      // Assert that runAgentScript was called with the correct parameters
      assert.strictEqual(runAgentScriptStub.calledOnce, true);
      assert.strictEqual(runAgentScriptStub.firstCall.args[0], 'provide pseudo code to current file');
      assert.strictEqual(runAgentScriptStub.firstCall.args[1], 'pseudo_code');
      assert.strictEqual(runAgentScriptStub.firstCall.args[2], 'console.log("Hello");');
      assert.strictEqual(runAgentScriptStub.firstCall.args[3], '/test/file.js');
    }
  });
});