import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as cp from 'child_process';
import * as os from 'os';

export function activate(context: vscode.ExtensionContext) {
    console.log('Dev Agent extension is now active');

    // Register the command to execute the agent
    let disposable = vscode.commands.registerCommand('devAgent.executeWorkflow', async () => {
        try {
            // Get the active text editor
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showErrorMessage('No active text editor found');
                return;
            }

            // Get the selected text or the entire document
            const selection = editor.selection;
            const fileContent = selection.isEmpty 
                ? editor.document.getText() 
                : editor.document.getText(selection);
            
            // Get the file path
            const filePath = editor.document.uri.fsPath;

            // Ask the user for the workflow name
            const workflowName = await vscode.window.showInputBox({
                prompt: 'Enter the workflow name',
                placeHolder: 'e.g., analyze, transform, generate',
                value: 'default'
            });

            if (!workflowName) {
                return; // User cancelled
            }

            // Create a temporary input file
            const tempDir = os.tmpdir();
            const inputFilePath = path.join(tempDir, `dev_agent_input_${Date.now()}.json`);
            
            // Prepare the input data
            const inputData = {
                command: `workflow ${workflowName}`,
                file_content: fileContent,
                file_path: filePath,
                command_type: 'workflow'
            };
            
            // Write the input data to the temporary file
            fs.writeFileSync(inputFilePath, JSON.stringify(inputData, null, 2));
            
            // Show progress indicator
            vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: `Executing workflow: ${workflowName}`,
                cancellable: false
            }, async (progress) => {
                progress.report({ increment: 0 });
                
                try {
                    // Path to the agent_v2.py script
                    const agentScriptPath = path.join(__dirname, '..', '..', 'dev-agent', 'agent_v2.py');
                    
                    // Execute the agent_v2.py script
                    const result = await executeAgentScript(agentScriptPath, inputFilePath);
                    
                    // Clean up the temporary file
                    fs.unlinkSync(inputFilePath);
                    
                    progress.report({ increment: 100 });
                    
                    // Display the result in a new editor
                    const document = await vscode.workspace.openTextDocument({
                        content: result,
                        language: 'markdown'
                    });
                    
                    await vscode.window.showTextDocument(document);
                    
                    return result;
                } catch (error) {
                    // Clean up the temporary file
                    if (fs.existsSync(inputFilePath)) {
                        fs.unlinkSync(inputFilePath);
                    }
                    
                    throw error;
                }
            });
        } catch (error) {
            vscode.window.showErrorMessage(`Error executing workflow: ${error}`);
        }
    });

    context.subscriptions.push(disposable);
}

/**
 * Execute the agent_v2.py script with the given input file
 * @param agentScriptPath Path to the agent_v2.py script
 * @param inputFilePath Path to the input JSON file
 * @returns The output of the script
 */
async function executeAgentScript(agentScriptPath: string, inputFilePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
        // Construct the command to execute the agent_v2.py script
        const pythonPath = 'python'; // Assumes python is in the PATH
        const args = [agentScriptPath, '--input-file', inputFilePath, '--verbose'];
        
        // Execute the command
        const process = cp.spawn(pythonPath, args);
        
        let stdout = '';
        let stderr = '';
        
        // Collect stdout
        process.stdout.on('data', (data) => {
            stdout += data.toString();
        });
        
        // Collect stderr
        process.stderr.on('data', (data) => {
            stderr += data.toString();
        });
        
        // Handle process completion
        process.on('close', (code) => {
            if (code === 0) {
                resolve(stdout);
            } else {
                reject(new Error(`Agent script exited with code ${code}: ${stderr}`));
            }
        });
        
        // Handle process errors
        process.on('error', (error) => {
            reject(error);
        });
    });
}

export function deactivate() {
    console.log('Dev Agent extension is now deactivated');
}