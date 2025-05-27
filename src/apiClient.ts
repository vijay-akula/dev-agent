import * as fs from 'fs';
import * as path from 'path';

export interface ApiResponse {
    input: {
        agentWorkflowName: string;
        inputFileContent: string;
        inputFileName: string;
        outputDirPath: string;
        systemPrompt: string;
        userPrompt: string;
    };
    payload: Array<{
        agentName: string;
        content: string;
        fileName: string;
    }>;
}

export async function callAgentApi(
    fileContent: string,
    fileName: string
): Promise<ApiResponse> {
    try {
        // Read system prompt from file
        const systemPrompt = await fs.promises.readFile(path.join(process.cwd(), 'prompts', 'system_prompts.txt'), 'utf8');
        
        // Read user template from file
        const userTemplate = await fs.promises.readFile(path.join(process.cwd(), 'prompts', 'user_template.txt'), 'utf8');
        
        // Replace placeholder in user template
        const userPrompt = userTemplate.replace('{input_content}', fileContent);
        
        // Call the REST API
        const response = await fetch('http://localhost:8080/genai/agent/run', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                agentFlowName: 'gsc',
                systemPrompt,
                userPrompt,
                inputFileConent: fileContent,
                inputFileName: fileName
            })
        });
        
        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }
        
        return await response.json() as ApiResponse;
    } catch (error) {
        console.error('Error calling API:', error);
        throw error;
    }
}

export function formatApiResponse(data: ApiResponse): string {
    let formattedResponse = '<div class="api-response">';
    formattedResponse += '<h3>API Response</h3>';
    formattedResponse += '<table style="width:100%; border-collapse: collapse;">';
    formattedResponse += '<tr><th style="text-align:left; padding:8px; border:1px solid var(--vscode-panel-border);">Field</th><th style="text-align:left; padding:8px; border:1px solid var(--vscode-panel-border);">Value</th></tr>';
    
    // Input section
    formattedResponse += '<tr><td colspan="2" style="padding:8px; border:1px solid var(--vscode-panel-border); background-color:var(--vscode-editor-lineHighlightBackground);"><strong>Input</strong></td></tr>';
    formattedResponse += `<tr><td style="padding:8px; border:1px solid var(--vscode-panel-border);">Agent Workflow</td><td style="padding:8px; border:1px solid var(--vscode-panel-border);">${data.input.agentWorkflowName}</td></tr>`;
    formattedResponse += `<tr><td style="padding:8px; border:1px solid var(--vscode-panel-border);">Input File</td><td style="padding:8px; border:1px solid var(--vscode-panel-border);">${data.input.inputFileName}</td></tr>`;
    formattedResponse += `<tr><td style="padding:8px; border:1px solid var(--vscode-panel-border);">Output Path</td><td style="padding:8px; border:1px solid var(--vscode-panel-border);">${data.input.outputDirPath}</td></tr>`;
    
    // Payload section
    formattedResponse += '<tr><td colspan="2" style="padding:8px; border:1px solid var(--vscode-panel-border); background-color:var(--vscode-editor-lineHighlightBackground);"><strong>Payload</strong></td></tr>';
    
    // Loop through payload items
    data.payload.forEach(item => {
        formattedResponse += `<tr><td style="padding:8px; border:1px solid var(--vscode-panel-border);">Agent</td><td style="padding:8px; border:1px solid var(--vscode-panel-border);">${item.agentName}</td></tr>`;
        formattedResponse += `<tr><td style="padding:8px; border:1px solid var(--vscode-panel-border);">File</td><td style="padding:8px; border:1px solid var(--vscode-panel-border);">${item.fileName}</td></tr>`;
        formattedResponse += `<tr><td style="padding:8px; border:1px solid var(--vscode-panel-border);">Content</td><td style="padding:8px; border:1px solid var(--vscode-panel-border);"><pre>${item.content}</pre></td></tr>`;
    });
    
    formattedResponse += '</table>';
    formattedResponse += '</div>';
    
    return formattedResponse;
}