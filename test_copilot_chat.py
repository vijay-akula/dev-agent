#!/usr/bin/env python3
"""
Test script for the Dev Agent extension with Copilot-like chat functionality.
This script simulates the behavior of the agent.py script when receiving
prompts and input from the chat interface.
"""

import json
import sys
import argparse

def process_command(command_type, user_command, file_content, file_path):
    """
    Process a command and return a response.
    
    Args:
        command_type: The type of command (explain, pseudo_code, custom)
        user_command: The user's command text
        file_content: The content of the file being processed
        file_path: The path to the file being processed
        
    Returns:
        A string response
    """
    # Print debug info
    print(f"Command Type: {command_type}", file=sys.stderr)
    print(f"User Command: {user_command}", file=sys.stderr)
    print(f"File Path: {file_path}", file=sys.stderr)
    print(f"File Content Length: {len(file_content)}", file=sys.stderr)
    
    # Check if the command is to explain code
    if command_type == 'explain':
        return explain_code(file_content, file_path)
    
    # Check if the command is to generate pseudo code
    elif command_type == 'pseudo_code':
        return generate_pseudo_code(file_content, file_path)
    
    # Handle custom commands
    else:
        return handle_custom_command(user_command, file_content, file_path)

def explain_code(file_content, file_path):
    """Generate an explanation of the code."""
    if not file_content:
        return "No code provided to explain."
    
    # Count lines of code
    lines = file_content.strip().split('\n')
    line_count = len(lines)
    
    # Simple explanation for demonstration purposes
    if 'fibonacci' in file_content:
        return f"""# Fibonacci Function Explanation

This code defines a function called `fibonacci(n)` that generates the Fibonacci sequence up to n elements.

## How it works:

1. If n is 0 or negative, it returns an empty list
2. If n is 1, it returns [0]
3. If n is 2, it returns [0, 1]
4. For n > 2, it:
   - Initializes the sequence with [0, 1]
   - Uses a loop to calculate each subsequent number by adding the two previous numbers
   - Appends each new number to the sequence
   - Returns the complete sequence

The final line prints the Fibonacci sequence with 10 elements, which would be:
[0, 1, 1, 2, 3, 5, 8, 13, 21, 34]

This is a classic implementation of the Fibonacci sequence using dynamic programming (storing previous results).
"""
    
    return f"""# Code Explanation

This file has {line_count} lines of code.

## Overview

This code appears to {get_code_purpose(file_content)}.

## Key Components

{get_key_components(file_content)}

## Execution Flow

{get_execution_flow(file_content)}
"""

def generate_pseudo_code(file_content, file_path):
    """Generate pseudo code for the given file content."""
    if not file_content:
        return "No code provided to convert to pseudo code."
    
    # Count lines of code
    lines = file_content.strip().split('\n')
    line_count = len(lines)
    
    # Simple pseudo code generation for demonstration purposes
    if 'fibonacci' in file_content:
        return f"""# Pseudo Code for Fibonacci Function

```
Function Fibonacci(n):
    If n <= 0:
        Return empty list
    Else if n = 1:
        Return [0]
    Else if n = 2:
        Return [0, 1]
    Else:
        Initialize sequence = [0, 1]
        For i from 2 to n-1:
            next_number = sequence[i-1] + sequence[i-2]
            Append next_number to sequence
        Return sequence

Call Fibonacci(10) and print the result
```

This pseudo code represents the algorithm for generating a Fibonacci sequence with n elements.
"""
    
    return f"""# Pseudo Code

```
{generate_simple_pseudo_code(file_content)}
```

This pseudo code represents the high-level logic of the original code, which has {line_count} lines.
"""

def handle_custom_command(command, file_content, file_path):
    """Handle custom commands from the user."""
    # Check for specific keywords in the command
    if 'hello' in command.lower() or 'hi' in command.lower():
        return "Hello! I'm the Dev Agent. How can I help you with your code today?"
    
    if 'help' in command.lower():
        return """# Dev Agent Help

I can help you with your code in several ways:

1. **Explain code**: Ask me to explain what a piece of code does
   Example: `@dev-agent explain this code`

2. **Generate pseudo code**: Ask me to convert code to pseudo code
   Example: `@dev-agent provide pseudo code`

3. **Ask questions**: Ask me questions about your code
   Example: `What does this function do?`

4. **Custom commands**: Try other commands related to code analysis

You can also upload files or use your current file as context for our conversation.
"""
    
    # If the command contains the word "analyze" or "review"
    if 'analyze' in command.lower() or 'review' in command.lower():
        return analyze_code(file_content, file_path)
    
    # Default response for other custom commands
    return f"""I received your command: "{command}"

To process this command, I need to understand what you're looking for. Here are some things I can do:

1. Explain code
2. Generate pseudo code
3. Analyze code structure
4. Answer questions about your code

Please try one of these commands or clarify what you'd like me to do with your code.
"""

def analyze_code(file_content, file_path):
    """Analyze the code and provide feedback."""
    if not file_content:
        return "No code provided to analyze."
    
    # Count lines of code
    lines = file_content.strip().split('\n')
    line_count = len(lines)
    
    # Simple analysis for demonstration purposes
    return f"""# Code Analysis

This file has {line_count} lines of code.

## Structure
- Functions: {count_functions(file_content)}
- Classes: {count_classes(file_content)}
- Comments: {count_comments(file_content)}

## Observations
{get_observations(file_content)}

## Suggestions
{get_suggestions(file_content)}
"""

# Helper functions for code analysis

def get_code_purpose(code):
    """Determine the purpose of the code."""
    if 'fibonacci' in code.lower():
        return "implement the Fibonacci sequence algorithm"
    if 'def ' in code and 'print' in code:
        return "define one or more functions and print some output"
    if 'class ' in code:
        return "define one or more classes"
    return "perform some computation or data processing"

def get_key_components(code):
    """Identify key components in the code."""
    components = []
    
    if 'def ' in code:
        components.append("- One or more function definitions")
    if 'class ' in code:
        components.append("- One or more class definitions")
    if 'import ' in code:
        components.append("- Import statements for external modules")
    if 'for ' in code:
        components.append("- Loop structures for iteration")
    if 'if ' in code:
        components.append("- Conditional statements for decision making")
    if 'return ' in code:
        components.append("- Return statements to output results")
    if 'print' in code:
        components.append("- Print statements for output")
    
    if not components:
        return "No major components identified."
    
    return "\n".join(components)

def get_execution_flow(code):
    """Describe the execution flow of the code."""
    if 'def ' in code and 'if ' in code and 'else' in code:
        return "The code defines functions with conditional logic to handle different cases."
    if 'for ' in code and 'append' in code:
        return "The code uses loops to build up data structures incrementally."
    return "The code executes sequentially from top to bottom."

def generate_simple_pseudo_code(code):
    """Generate simple pseudo code from the given code."""
    # This is a very simplified version for demonstration
    lines = code.strip().split('\n')
    pseudo_code = []
    
    for line in lines:
        line = line.strip()
        if line.startswith('def '):
            # Function definition
            func_name = line.split('def ')[1].split('(')[0]
            params = line.split('(')[1].split(')')[0]
            pseudo_code.append(f"Function {func_name}({params}):")
        elif line.startswith('if '):
            # If statement
            condition = line.split('if ')[1].split(':')[0]
            pseudo_code.append(f"If {condition}:")
        elif line.startswith('elif '):
            # Elif statement
            condition = line.split('elif ')[1].split(':')[0]
            pseudo_code.append(f"Else If {condition}:")
        elif line.startswith('else:'):
            # Else statement
            pseudo_code.append("Else:")
        elif line.startswith('for '):
            # For loop
            loop_var = line.split('for ')[1].split(' in ')[0]
            iterable = line.split(' in ')[1].split(':')[0]
            pseudo_code.append(f"For each {loop_var} in {iterable}:")
        elif line.startswith('while '):
            # While loop
            condition = line.split('while ')[1].split(':')[0]
            pseudo_code.append(f"While {condition}:")
        elif line.startswith('return '):
            # Return statement
            value = line.split('return ')[1]
            pseudo_code.append(f"Return {value}")
        elif line.startswith('print('):
            # Print statement
            value = line.split('print(')[1].split(')')[0]
            pseudo_code.append(f"Print {value}")
        elif '=' in line and not line.startswith(' '):
            # Variable assignment
            var_name = line.split('=')[0].strip()
            value = line.split('=')[1].strip()
            pseudo_code.append(f"Set {var_name} to {value}")
        elif line and not line.startswith('#'):
            # Other code lines
            pseudo_code.append(line)
    
    return "\n".join(pseudo_code)

def count_functions(code):
    """Count the number of function definitions in the code."""
    return code.count('def ')

def count_classes(code):
    """Count the number of class definitions in the code."""
    return code.count('class ')

def count_comments(code):
    """Count the number of comment lines in the code."""
    lines = code.strip().split('\n')
    comment_count = 0
    for line in lines:
        if line.strip().startswith('#'):
            comment_count += 1
    return comment_count

def get_observations(code):
    """Generate observations about the code."""
    observations = []
    
    if 'fibonacci' in code.lower():
        observations.append("- This code implements the Fibonacci sequence algorithm")
    if code.count('if ') > 3:
        observations.append("- The code has multiple conditional statements")
    if code.count('for ') > 2:
        observations.append("- The code uses several loops for iteration")
    if code.count('print') > 3:
        observations.append("- The code has multiple print statements, which might be used for debugging")
    if 'return' not in code:
        observations.append("- The code doesn't return any values, it might be procedural rather than functional")
    
    if not observations:
        return "No specific observations."
    
    return "\n".join(observations)

def get_suggestions(code):
    """Generate suggestions for improving the code."""
    suggestions = []
    
    if 'fibonacci' in code.lower() and 'memo' not in code.lower() and 'cache' not in code.lower():
        suggestions.append("- Consider using memoization to optimize the Fibonacci calculation for larger values")
    if code.count('print') > 3:
        suggestions.append("- Consider reducing the number of print statements in production code")
    if 'if ' in code and 'else' not in code:
        suggestions.append("- Consider adding else clauses to handle all possible conditions")
    if 'try' not in code and 'except' not in code:
        suggestions.append("- Consider adding error handling with try/except blocks for robustness")
    if 'def ' in code and '"""' not in code and "'''" not in code:
        suggestions.append("- Consider adding docstrings to document your functions")
    
    if not suggestions:
        return "No specific suggestions."
    
    return "\n".join(suggestions)

def main():
    parser = argparse.ArgumentParser(description='Test Agent Script for Copilot-like Chat')
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

        # Print debug info to stderr
        print(f"Received request with:", file=sys.stderr)
        print(f"  Command Type: {command_type}", file=sys.stderr)
        print(f"  User Command: {user_command}", file=sys.stderr)
        print(f"  File Path: {file_path}", file=sys.stderr)
        print(f"  File Content Length: {len(file_content)}", file=sys.stderr)
        print(f"  Prompt: {prompt}", file=sys.stderr)
        print(f"  Input Content Length: {len(input_content)}", file=sys.stderr)

        response = process_command(command_type, user_command, file_content, file_path)
        print(response)

    except Exception as e:
        print(f"Error in test_copilot_chat.py: {str(e)}", file=sys.stderr)
        print(f"Error: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()