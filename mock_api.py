from flask import Flask, request, jsonify
from flask_cors import CORS
import time

app = Flask(__name__)
CORS(app)

@app.route('/genai/agent/run', methods=['POST'])
def run_agent():
    # Get request data
    data = request.json
    
    # Extract data from request
    agent_flow_name = data.get('agentFlowName', '')
    system_prompt = data.get('systemPrompt', '')
    user_prompt = data.get('userPrompt', '')
    input_file_content = data.get('inputFileConent', '')
    input_file_name = data.get('inputFileName', '')
    
    # Simulate processing time
    time.sleep(2)
    
    # Create response
    response = {
        "input": {
            "agentWorkflowName": agent_flow_name,
            "inputFileContent": input_file_content[:50] + "..." if input_file_content else "",
            "inputFileName": input_file_name,
            "outputDirPath": "C:/Users/K140496/work/ift/ift-tal/output",
            "systemPrompt": system_prompt,
            "userPrompt": user_prompt
        },
        "payload": [
            {
                "agentName": "agent_document_tal_code",
                "content": f"Generated documentation for {input_file_name}:\n\n```\n# This is a mock response\n# The file {input_file_name} has been processed\n# System prompt: {system_prompt[:30]}...\n# User prompt: {user_prompt[:30]}...\n```",
                "fileName": input_file_name
            }
        ]
    }
    
    return jsonify(response)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080, debug=True)