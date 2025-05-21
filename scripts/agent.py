#!/usr/bin/env python3
import sys
import json
import argparse
import os

def process_command(command_type, user_command, file_content, file_path):
    """
    Process the command and return a response.
    
    Args:
        command_type (str): The type of command (pseudo_code, explain, custom)
        user_command (str): The original command from the user
        file_content (str): The content of the current file
        file_path (str): The path to the current file
        
    Returns:
        str: The response to the command
    """
    if command_type == "pseudo_code":
        return generate_pseudo_code(file_content, file_path)
    elif command_type == "explain":
        return explain_code(file_content, file_path)
    else:
        return process_custom_command(user_command, file_content, file_path)

def generate_pseudo_code(code, file_path):
    """
    Generate pseudo code from the given code.
    
    Args:
        code (str): The source code
        file_path (str): The path to the file
        
    Returns:
        str: The pseudo code representation
    """
    if not code.strip():
        return "The file is empty or contains only whitespace."
    
    file_name = os.path.basename(file_path)
    file_ext = os.path.splitext(file_path)[1].lower()
    
    result = f"# Pseudo Code for {file_name}\n\n"
    
    # Determine language based on file extension
    language = "unknown"
    if file_ext in ['.py', '.pyw']:
        language = "python"
    elif file_ext in ['.js', '.jsx', '.ts', '.tsx']:
        language = "javascript/typescript"
    elif file_ext in ['.java']:
        language = "java"
    elif file_ext in ['.c', '.cpp', '.h', '.hpp']:
        language = "c/c++"
    elif file_ext in ['.cs']:
        language = "c#"
    elif file_ext in ['.go']:
        language = "go"
    elif file_ext in ['.rb']:
        language = "ruby"
    elif file_ext in ['.php']:
        language = "php"
    elif file_ext in ['.swift']:
        language = "swift"
    elif file_ext in ['.rs']:
        language = "rust"
    
    result += f"Language: {language}\n\n"
    
    # Split the code into lines
    lines = code.split('\n')
    
    # Process the code based on language
    if language == "python":
        result += process_python_code(lines)
    else:
        # Generic processing for other languages
        result += process_generic_code(lines)
    
    return result

def process_python_code(lines):
    """Process Python code to generate pseudo code"""
    pseudo_code = []
    indent_level = 0
    in_function = False
    in_class = False
    
    for line in lines:
        stripped = line.strip()
        
        # Skip empty lines and comments
        if not stripped or stripped.startswith('#'):
            continue
        
        # Calculate indentation level
        current_indent = len(line) - len(line.lstrip())
        
        # Check for function definitions
        if stripped.startswith('def '):
            in_function = True
            func_name = stripped[4:].split('(')[0]
            pseudo_code.append(f"{'  ' * indent_level}FUNCTION {func_name}:")
            indent_level += 1
        
        # Check for class definitions
        elif stripped.startswith('class '):
            in_class = True
            class_name = stripped[6:].split('(')[0].split(':')[0]
            pseudo_code.append(f"{'  ' * indent_level}CLASS {class_name}:")
            indent_level += 1
        
        # Check for if statements
        elif stripped.startswith('if ') or stripped.startswith('elif '):
            condition = stripped.split(':')[0][3:] if stripped.startswith('if ') else stripped.split(':')[0][5:]
            pseudo_code.append(f"{'  ' * indent_level}IF {condition}:")
            indent_level += 1
        
        # Check for else statements
        elif stripped.startswith('else:'):
            pseudo_code.append(f"{'  ' * indent_level}ELSE:")
            indent_level += 1
        
        # Check for loops
        elif stripped.startswith('for '):
            loop_var = stripped.split(':')[0][4:]
            pseudo_code.append(f"{'  ' * indent_level}FOR {loop_var}:")
            indent_level += 1
        
        elif stripped.startswith('while '):
            condition = stripped.split(':')[0][6:]
            pseudo_code.append(f"{'  ' * indent_level}WHILE {condition}:")
            indent_level += 1
        
        # Check for return statements
        elif stripped.startswith('return '):
            return_val = stripped[7:]
            pseudo_code.append(f"{'  ' * indent_level}RETURN {return_val}")
        
        # Check for assignments
        elif '=' in stripped and not '==' in stripped and not '>=' in stripped and not '<=' in stripped:
            var_name = stripped.split('=')[0].strip()
            value = stripped.split('=')[1].strip()
            pseudo_code.append(f"{'  ' * indent_level}SET {var_name} = {value}")
        
        # Check for function calls
        elif '(' in stripped and ')' in stripped and not stripped.startswith(('if', 'elif', 'for', 'while', 'def', 'class')):
            pseudo_code.append(f"{'  ' * indent_level}CALL {stripped}")
        
        # Handle indentation changes
        if current_indent < indent_level * 4 and indent_level > 0:
            indent_level = max(0, current_indent // 4)
    
    return '\n'.join(pseudo_code)

def process_generic_code(lines):
    """Process generic code to generate pseudo code"""
    pseudo_code = []
    indent_level = 0
    
    for line in lines:
        stripped = line.strip()
        
        # Skip empty lines and comments
        if not stripped or stripped.startswith('//') or stripped.startswith('/*') or stripped.startswith('*'):
            continue
        
        # Calculate indentation level
        current_indent = len(line) - len(line.lstrip())
        
        # Check for function definitions
        if 'function' in stripped or 'def ' in stripped or 'void' in stripped or 'int ' in stripped or 'string ' in stripped:
            if '{' in stripped or ':' in stripped:
                pseudo_code.append(f"{'  ' * indent_level}FUNCTION: {stripped}")
                indent_level += 1
        
        # Check for class definitions
        elif 'class ' in stripped:
            if '{' in stripped or ':' in stripped:
                pseudo_code.append(f"{'  ' * indent_level}CLASS: {stripped}")
                indent_level += 1
        
        # Check for if statements
        elif stripped.startswith('if ') or stripped.startswith('else if'):
            pseudo_code.append(f"{'  ' * indent_level}CONDITION: {stripped}")
            if '{' in stripped:
                indent_level += 1
        
        # Check for else statements
        elif stripped.startswith('else'):
            pseudo_code.append(f"{'  ' * indent_level}ELSE:")
            if '{' in stripped:
                indent_level += 1
        
        # Check for loops
        elif stripped.startswith('for ') or stripped.startswith('while ') or stripped.startswith('foreach'):
            pseudo_code.append(f"{'  ' * indent_level}LOOP: {stripped}")
            if '{' in stripped:
                indent_level += 1
        
        # Check for return statements
        elif stripped.startswith('return '):
            pseudo_code.append(f"{'  ' * indent_level}RETURN: {stripped}")
        
        # Check for assignments
        elif '=' in stripped and not '==' in stripped and not '>=' in stripped and not '<=' in stripped:
            pseudo_code.append(f"{'  ' * indent_level}ASSIGN: {stripped}")
        
        # Check for closing braces
        elif stripped == '}' and indent_level > 0:
            indent_level -= 1
            pseudo_code.append(f"{'  ' * indent_level}END BLOCK")
        
        # Other statements
        elif stripped.endswith(';'):
            pseudo_code.append(f"{'  ' * indent_level}STATEMENT: {stripped}")
    
    return '\n'.join(pseudo_code)

def explain_code(code, file_path):
    """
    Explain the given code.
    
    Args:
        code (str): The source code
        file_path (str): The path to the file
        
    Returns:
        str: The explanation
    """
    if not code.strip():
        return "The file is empty or contains only whitespace."
    
    file_name = os.path.basename(file_path)
    file_ext = os.path.splitext(file_path)[1].lower()
    
    # Determine language based on file extension
    language = "unknown"
    if file_ext in ['.py', '.pyw']:
        language = "Python"
    elif file_ext in ['.js']:
        language = "JavaScript"
    elif file_ext in ['.ts']:
        language = "TypeScript"
    elif file_ext in ['.java']:
        language = "Java"
    elif file_ext in ['.c']:
        language = "C"
    elif file_ext in ['.cpp', '.cc']:
        language = "C++"
    elif file_ext in ['.cs']:
        language = "C#"
    elif file_ext in ['.go']:
        language = "Go"
    elif file_ext in ['.rb']:
        language = "Ruby"
    elif file_ext in ['.php']:
        language = "PHP"
    elif file_ext in ['.swift']:
        language = "Swift"
    elif file_ext in ['.rs']:
        language = "Rust"
    elif file_ext in ['.html', '.htm']:
        language = "HTML"
    elif file_ext in ['.css']:
        language = "CSS"
    elif file_ext in ['.json']:
        language = "JSON"
    elif file_ext in ['.md']:
        language = "Markdown"
    
    # Count lines of code
    lines = code.split('\n')
    non_empty_lines = [line for line in lines if line.strip()]
    
    # Basic code analysis
    functions = []
    classes = []
    imports = []
    
    if language == "Python":
        for line in lines:
            stripped = line.strip()
            if stripped.startswith('def '):
                functions.append(stripped[4:].split('(')[0])
            elif stripped.startswith('class '):
                classes.append(stripped[6:].split('(')[0].split(':')[0])
            elif stripped.startswith('import ') or stripped.startswith('from '):
                imports.append(stripped)
    
    # Generate explanation
    explanation = f"# Code Explanation for {file_name}\n\n"
    explanation += f"## Overview\n\n"
    explanation += f"This is a {language} file with {len(non_empty_lines)} lines of code.\n\n"
    
    if language == "Python" and (functions or classes or imports):
        explanation += "## Structure\n\n"
        
        if imports:
            explanation += "### Imports\n\n"
            for imp in imports[:10]:  # Limit to first 10 imports
                explanation += f"- `{imp}`\n"
            if len(imports) > 10:
                explanation += f"- ... and {len(imports) - 10} more imports\n"
            explanation += "\n"
        
        if classes:
            explanation += "### Classes\n\n"
            for cls in classes:
                explanation += f"- `{cls}`\n"
            explanation += "\n"
        
        if functions:
            explanation += "### Functions\n\n"
            for func in functions:
                explanation += f"- `{func}`\n"
            explanation += "\n"
    
    explanation += "## Purpose\n\n"
    explanation += "Based on the code analysis, this file appears to "
    
    if language == "Python":
        if "def main" in code or "if __name__ == '__main__'" in code:
            explanation += "be a standalone script that can be executed directly.\n\n"
        elif len(classes) > 0 and len(functions) > 0:
            explanation += "define a class with various methods, possibly implementing a specific functionality or component.\n\n"
        elif len(functions) > 0:
            explanation += "contain utility functions or helpers for a specific purpose.\n\n"
        elif "import " in code:
            explanation += "be a module that provides functionality to other parts of the application.\n\n"
    
    explanation += "## Detailed Analysis\n\n"
    explanation += "To get a more detailed analysis of this code, you can ask specific questions about parts of the code you're interested in.\n"
    
    return explanation

def process_custom_command(command, file_content, file_path):
    """
    Process a custom command.
    
    Args:
        command (str): The command from the user
        file_content (str): The content of the current file
        file_path (str): The path to the current file
        
    Returns:
        str: The response to the command
    """
    # Extract file information
    file_name = os.path.basename(file_path) if file_path else "No file"
    file_ext = os.path.splitext(file_path)[1].lower() if file_path else ""
    
    # Process based on command keywords
    if "summarize" in command.lower() or "summary" in command.lower():
        return summarize_code(file_content, file_path)
    elif "count" in command.lower() and "lines" in command.lower():
        return count_lines(file_content, file_path)
    elif "find" in command.lower() or "search" in command.lower():
        search_term = command.lower().split("find")[1].strip() if "find" in command.lower() else command.lower().split("search")[1].strip()
        return search_in_code(file_content, search_term, file_path)
    else:
        # Default response for unknown commands
        return f"I received your command: '{command}'\n\nFile: {file_name}\nFile type: {file_ext}\nFile size: {len(file_content)} characters\n\nTo use this agent effectively, try commands like:\n- provide pseudo code to current file\n- explain this code\n- summarize this code\n- count lines in this file\n- find [term] in this code"

def summarize_code(code, file_path):
    """Generate a summary of the code"""
    if not code.strip():
        return "The file is empty or contains only whitespace."
    
    file_name = os.path.basename(file_path) if file_path else "No file"
    
    # Count lines of code
    lines = code.split('\n')
    non_empty_lines = [line for line in lines if line.strip()]
    comment_lines = [line for line in lines if line.strip().startswith('#') or line.strip().startswith('//')]
    
    summary = f"# Summary of {file_name}\n\n"
    summary += f"- Total lines: {len(lines)}\n"
    summary += f"- Code lines: {len(non_empty_lines) - len(comment_lines)}\n"
    summary += f"- Comment lines: {len(comment_lines)}\n"
    summary += f"- Blank lines: {len(lines) - len(non_empty_lines)}\n\n"
    
    # Try to determine the main purpose of the file
    summary += "## Main Purpose\n\n"
    
    if "def main" in code or "if __name__ == '__main__'" in code:
        summary += "This appears to be a standalone script that can be executed directly.\n\n"
    elif "class " in code:
        class_count = code.count("class ")
        summary += f"This file defines {class_count} class(es), likely implementing specific functionality or components.\n\n"
    elif "def " in code:
        func_count = code.count("def ")
        summary += f"This file contains {func_count} function(s), possibly providing utility or helper methods.\n\n"
    elif "import " in code:
        summary += "This appears to be a module that provides functionality to other parts of the application.\n\n"
    
    return summary

def count_lines(code, file_path):
    """Count lines in the code file"""
    if not code.strip():
        return "The file is empty or contains only whitespace."
    
    file_name = os.path.basename(file_path) if file_path else "No file"
    
    # Count different types of lines
    lines = code.split('\n')
    non_empty_lines = [line for line in lines if line.strip()]
    comment_lines = [line for line in lines if line.strip().startswith('#') or line.strip().startswith('//')]
    code_lines = [line for line in non_empty_lines if not line.strip().startswith('#') and not line.strip().startswith('//')]
    
    result = f"# Line Count for {file_name}\n\n"
    result += f"- Total lines: {len(lines)}\n"
    result += f"- Code lines: {len(code_lines)}\n"
    result += f"- Comment lines: {len(comment_lines)}\n"
    result += f"- Blank lines: {len(lines) - len(non_empty_lines)}\n"
    
    return result

def search_in_code(code, search_term, file_path):
    """Search for a term in the code"""
    if not code.strip():
        return "The file is empty or contains only whitespace."
    
    if not search_term.strip():
        return "No search term provided."
    
    file_name = os.path.basename(file_path) if file_path else "No file"
    search_term = search_term.strip()
    
    # Search for the term in each line
    lines = code.split('\n')
    matches = []
    
    for i, line in enumerate(lines):
        if search_term.lower() in line.lower():
            matches.append((i+1, line.strip()))
    
    if not matches:
        return f"No matches found for '{search_term}' in {file_name}."
    
    result = f"# Search Results for '{search_term}' in {file_name}\n\n"
    result += f"Found {len(matches)} matches:\n\n"
    
    for line_num, line_text in matches:
        result += f"Line {line_num}: {line_text}\n"
    
    return result

def main():
    parser = argparse.ArgumentParser(description='Dev Agent Python Script')
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
        
        command_type = data.get('command', 'custom')
        user_command = data.get('content', '')
        file_content = data.get('fileContent', '')
        file_path = data.get('filePath', '')
        
        response = process_command(command_type, user_command, file_content, file_path)
        print(response)
        
    except Exception as e:
        print(f"Error in agent.py: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()