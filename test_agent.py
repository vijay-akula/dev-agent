#!/usr/bin/env python3
"""
Test agent script for the Dev Agent VS Code extension.
This script mimics the behavior of the real agent.py script.
"""

import sys
import json
import argparse
import os

def process_command(command_type, user_command, file_content, file_path):
    """
    Process the command and return a response.
    
    Args:
        command_type (str): The type of command
        user_command (str): The original command from the user
        file_content (str): The content of the current file
        file_path (str): The path to the current file
        
    Returns:
        str: The response to the command
    """
    # Create a response based on the command type
    if command_type == "pseudo_code":
        return generate_pseudo_code(file_content, file_path)
    elif command_type == "explain":
        return explain_code(file_content, file_path)
    else:
        return process_custom_command(user_command, file_content, file_path)

def generate_pseudo_code(code, file_path):
    """Generate pseudo code for the given file content."""
    file_name = os.path.basename(file_path) if file_path else "Unknown file"
    line_count = len(code.split('\n'))
    
    response = f"# Pseudo Code for {file_name}\n\n"
    response += f"This file has {line_count} lines of code.\n\n"
    response += "## Pseudo Code Structure\n\n"
    
    # Simple pseudo code generation
    if "class" in code:
        response += "```\n"
        response += "CLASS SomeClass\n"
        response += "  INITIALIZE with parameters\n"
        response += "  \n"
        response += "  FUNCTION method1\n"
        response += "    DO something\n"
        response += "    RETURN result\n"
        response += "  \n"
        response += "  FUNCTION method2\n"
        response += "    DO something else\n"
        response += "    RETURN another result\n"
        response += "END CLASS\n"
        response += "```\n"
    elif "def " in code:
        response += "```\n"
        response += "FUNCTION main\n"
        response += "  INITIALIZE variables\n"
        response += "  PROCESS data\n"
        response += "  RETURN result\n"
        response += "END FUNCTION\n"
        response += "```\n"
    else:
        response += "```\n"
        response += "IMPORT necessary modules\n"
        response += "INITIALIZE variables\n"
        response += "PROCESS data\n"
        response += "OUTPUT results\n"
        response += "```\n"
    
    return response

def explain_code(code, file_path):
    """Explain the given code."""
    file_name = os.path.basename(file_path) if file_path else "Unknown file"
    line_count = len(code.split('\n'))
    
    response = f"# Code Explanation for {file_name}\n\n"
    response += f"This file has {line_count} lines of code.\n\n"
    response += "## Overview\n\n"
    
    # Simple code explanation
    if "class" in code:
        response += "This file defines one or more classes that encapsulate related functionality.\n\n"
    elif "def " in code:
        response += "This file contains one or more functions that perform specific tasks.\n\n"
    else:
        response += "This file contains script-level code that executes sequentially.\n\n"
    
    response += "## Key Components\n\n"
    
    # Identify imports
    imports = []
    for line in code.split('\n'):
        if line.strip().startswith('import ') or line.strip().startswith('from '):
            imports.append(line.strip())
    
    if imports:
        response += "### Imports\n\n"
        for imp in imports[:5]:  # Limit to first 5 imports
            response += f"- `{imp}`\n"
        if len(imports) > 5:
            response += f"- ... and {len(imports) - 5} more imports\n"
        response += "\n"
    
    return response

def process_custom_command(command, file_content, file_path):
    """Process a custom command."""
    file_name = os.path.basename(file_path) if file_path else "Unknown file"
    line_count = len(file_content.split('\n'))
    
    response = f"# Response to: {command}\n\n"
    response += f"Processing file: {file_name}\n"
    response += f"File size: {len(file_content)} characters, {line_count} lines\n\n"
    
    # Process based on command keywords
    if "summarize" in command.lower() or "summary" in command.lower():
        response += "## Summary\n\n"
        response += "This file appears to be a Python script that performs various operations.\n"
    elif "count" in command.lower() and "lines" in command.lower():
        response += "## Line Count\n\n"
        response += f"Total lines: {line_count}\n"
        response += f"Non-empty lines: {sum(1 for line in file_content.split('\n') if line.strip())}\n"
    elif "find" in command.lower() or "search" in command.lower():
        search_term = command.lower().split("find")[1].strip() if "find" in command.lower() else command.lower().split("search")[1].strip()
        response += f"## Search Results for '{search_term}'\n\n"
        matches = sum(1 for line in file_content.split('\n') if search_term in line.lower())
        response += f"Found {matches} matches for '{search_term}' in the file.\n"
    else:
        response += "## Analysis\n\n"
        response += "I've analyzed the file and found it to be a valid code file.\n"
        response += "For more specific information, try commands like:\n"
        response += "- provide pseudo code\n"
        response += "- explain this code\n"
        response += "- summarize this code\n"
        response += "- count lines\n"
    
    return response

def main():
    parser = argparse.ArgumentParser(description='Test Agent Script')
    parser.add_argument('--input-file', type=str, help='Path to the input JSON file')
    args = parser.parse_args()

    try:
        if args.input_file:
            # Read from input file
            with open(args.input_file, 'r') as f:
                data = json.load(f)
        else:
            # Read from stdin
            data = json.loads(sys.stdin.read())

        # Support both old and new field names
        command_type = data.get('command', 'custom')
        user_command = data.get('content', '')
        file_content = data.get('fileContent', '')
        file_path = data.get('filePath', '')
        
        # New fields for enhanced functionality
        prompt = data.get('prompt', user_command)
        input_content = data.get('input', file_content)
        
        # If we have prompt and input, use those instead
        if prompt:
            user_command = prompt
        if input_content:
            file_content = input_content

        response = process_command(command_type, user_command, file_content, file_path)
        print(response)

    except Exception as e:
        print(f"Error in test_agent.py: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()