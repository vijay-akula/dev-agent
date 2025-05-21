#!/usr/bin/env python3
"""
Dev Agent Script - Version 2
This script processes input from the Dev Agent VS Code extension and returns a response.
"""

import argparse
import json
import sys
import os
import traceback
from datetime import datetime

def parse_arguments():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(description='Dev Agent Script')
    parser.add_argument('--input-file', type=str, help='Path to the input JSON file')
    parser.add_argument('--verbose', action='store_true', help='Enable verbose output')
    return parser.parse_args()

def process_command(command, file_content, file_path=None, command_type=None):
    """Process the command and return a response."""
    if command_type == "explain":
        return explain_code(file_content, file_path)
    elif command_type == "pseudo_code":
        return generate_pseudo_code(file_content, file_path)
    elif command.lower().startswith("explain"):
        return explain_code(file_content, file_path)
    elif command.lower().startswith("pseudo code") or command.lower().startswith("provide pseudo"):
        return generate_pseudo_code(file_content, file_path)
    elif command.lower().startswith("summarize"):
        return summarize_file(file_content, file_path)
    elif command.lower().startswith("execute"):
        return execute_code(file_content)
    else:
        return process_custom_command(command, file_content, file_path)

def explain_code(code, file_path=None):
    """Explain the provided code."""
    file_info = f" in {os.path.basename(file_path)}" if file_path else ""
    return f"""
# Code Explanation{file_info}

This code appears to be {detect_language(code, file_path)}.

## Overview
The code {get_code_overview(code, file_path)}.

## Key Components
{get_key_components(code)}

## Potential Issues
{get_potential_issues(code)}

## Suggestions for Improvement
{get_improvement_suggestions(code)}
"""

def generate_pseudo_code(code, file_path=None):
    """Generate pseudo code for the provided code."""
    file_info = f" for {os.path.basename(file_path)}" if file_path else ""
    return f"""
# Pseudo Code{file_info}

```
{get_pseudo_code(code)}
```

## Explanation
{get_pseudo_code_explanation(code)}
"""

def summarize_file(content, file_path=None):
    """Summarize the provided file content."""
    file_info = f" for {os.path.basename(file_path)}" if file_path else ""
    return f"""
# File Summary{file_info}

{get_file_summary(content, file_path)}

## Key Points
{get_key_points(content)}

## Structure
{get_file_structure(content, file_path)}
"""

def execute_code(code):
    """Execute the provided Python code and return the result."""
    try:
        # Extract Python code from markdown code blocks if present
        if "```python" in code or "```py" in code:
            code_blocks = []
            lines = code.split("\n")
            in_code_block = False
            current_block = []
            
            for line in lines:
                if line.strip().startswith("```py") or line.strip().startswith("```python"):
                    in_code_block = True
                    current_block = []
                elif line.strip() == "```" and in_code_block:
                    in_code_block = False
                    code_blocks.append("\n".join(current_block))
                elif in_code_block:
                    current_block.append(line)
            
            if code_blocks:
                code = "\n".join(code_blocks)
        
        # Create a temporary file to execute
        temp_file = f"/tmp/dev_agent_exec_{datetime.now().strftime('%Y%m%d%H%M%S')}.py"
        with open(temp_file, "w") as f:
            f.write(code)
        
        # Redirect stdout and stderr to capture output
        import io
        from contextlib import redirect_stdout, redirect_stderr
        
        stdout_buffer = io.StringIO()
        stderr_buffer = io.StringIO()
        
        with redirect_stdout(stdout_buffer), redirect_stderr(stderr_buffer):
            exec(open(temp_file).read())
        
        stdout_output = stdout_buffer.getvalue()
        stderr_output = stderr_buffer.getvalue()
        
        # Clean up the temporary file
        os.remove(temp_file)
        
        # Format the response
        if stderr_output:
            return f"""
# Code Execution Result

## Error
```
{stderr_output}
```

## Code
```python
{code}
```
"""
        else:
            return f"""
# Code Execution Result

## Output
```
{stdout_output if stdout_output else "No output"}
```

## Code
```python
{code}
```
"""
    except Exception as e:
        return f"""
# Code Execution Error

```
{traceback.format_exc()}
```

## Code
```python
{code}
```
"""

def process_custom_command(command, file_content, file_path=None):
    """Process a custom command."""
    file_info = f" for {os.path.basename(file_path)}" if file_path else ""
    return f"""
# Response to: "{command}"{file_info}

I've analyzed the content you provided. Here's my response:

{get_custom_response(command, file_content)}

## Additional Information
{get_additional_info(command, file_content)}
"""

# Helper functions for code analysis
def detect_language(code, file_path=None):
    """Detect the programming language of the code."""
    if file_path:
        ext = os.path.splitext(file_path)[1].lower()
        if ext == '.py':
            return "Python"
        elif ext == '.js':
            return "JavaScript"
        elif ext == '.ts':
            return "TypeScript"
        elif ext == '.html':
            return "HTML"
        elif ext == '.css':
            return "CSS"
        elif ext == '.java':
            return "Java"
        elif ext == '.c':
            return "C"
        elif ext == '.cpp':
            return "C++"
        elif ext == '.cs':
            return "C#"
        elif ext == '.go':
            return "Go"
        elif ext == '.rb':
            return "Ruby"
        elif ext == '.php':
            return "PHP"
        elif ext == '.swift':
            return "Swift"
        elif ext == '.kt':
            return "Kotlin"
        elif ext == '.rs':
            return "Rust"
        elif ext == '.md':
            return "Markdown"
        elif ext == '.json':
            return "JSON"
        elif ext == '.xml':
            return "XML"
        elif ext == '.yaml' or ext == '.yml':
            return "YAML"
    
    # Simple language detection based on code patterns
    if 'def ' in code and 'import ' in code:
        return "Python"
    elif 'function ' in code and 'var ' in code:
        return "JavaScript"
    elif 'class ' in code and 'public ' in code:
        return "Java or C#"
    elif '<html>' in code.lower() and '</html>' in code.lower():
        return "HTML"
    elif '{' in code and '}' in code and ';' in code:
        return "a C-family language (C, C++, Java, JavaScript, etc.)"
    else:
        return "an unidentified programming language"

def get_code_overview(code, file_path=None):
    """Get an overview of the code."""
    language = detect_language(code, file_path)
    
    if language == "Python":
        if "class " in code:
            return "defines one or more Python classes"
        elif "def " in code:
            return "contains one or more Python functions"
        elif "import " in code:
            return "imports modules and performs operations"
        else:
            return "contains Python script code"
    elif language == "JavaScript" or language == "TypeScript":
        if "class " in code:
            return "defines one or more JavaScript/TypeScript classes"
        elif "function " in code:
            return "contains one or more JavaScript/TypeScript functions"
        elif "import " in code or "require(" in code:
            return "imports modules and performs operations"
        else:
            return "contains JavaScript/TypeScript script code"
    else:
        return "implements functionality in " + language

def get_key_components(code):
    """Identify key components in the code."""
    lines = code.split('\n')
    components = []
    
    # Look for classes, functions, imports
    for line in lines:
        line = line.strip()
        if line.startswith('class '):
            components.append(f"- Class: `{line.split('class ')[1].split('(')[0].split(':')[0]}`")
        elif line.startswith('def '):
            components.append(f"- Function: `{line.split('def ')[1].split('(')[0]}`")
        elif line.startswith('import ') or line.startswith('from '):
            components.append(f"- Import: `{line}`")
    
    if components:
        return "\n".join(components)
    else:
        return "No distinct components identified. The code appears to be a script or simple program."

def get_potential_issues(code):
    """Identify potential issues in the code."""
    issues = []
    
    # Check for common issues
    if "except:" in code and "except Exception:" not in code:
        issues.append("- Bare except clause could catch unexpected exceptions")
    
    if "print(" in code:
        issues.append("- Contains print statements which might be left from debugging")
    
    if "TODO" in code or "FIXME" in code:
        issues.append("- Contains TODO or FIXME comments indicating incomplete work")
    
    if "# " not in code and '"""' not in code and "'''" not in code:
        issues.append("- Limited or no comments/documentation")
    
    if issues:
        return "\n".join(issues)
    else:
        return "No obvious issues detected in the code."

def get_improvement_suggestions(code):
    """Suggest improvements for the code."""
    suggestions = []
    
    # Check for potential improvements
    if "# " not in code and '"""' not in code and "'''" not in code:
        suggestions.append("- Add comments or docstrings to improve code readability")
    
    if "print(" in code:
        suggestions.append("- Consider replacing print statements with proper logging")
    
    if "except:" in code and "except Exception:" not in code:
        suggestions.append("- Specify exception types in except clauses")
    
    if len(code.split('\n')) > 200:
        suggestions.append("- Consider breaking down large files into smaller modules")
    
    if suggestions:
        return "\n".join(suggestions)
    else:
        return "The code appears well-structured. No specific improvements suggested."

def get_pseudo_code(code):
    """Generate pseudo code for the provided code."""
    # This is a simplified implementation
    lines = code.split('\n')
    pseudo_code = []
    indent = ""
    
    for line in lines:
        stripped = line.strip()
        if not stripped or stripped.startswith('#'):
            continue
        
        if stripped.startswith('import ') or stripped.startswith('from '):
            continue
        
        if stripped.startswith('class '):
            class_name = stripped.split('class ')[1].split('(')[0].split(':')[0]
            pseudo_code.append(f"DEFINE CLASS {class_name}")
            indent = "  "
        elif stripped.startswith('def '):
            func_name = stripped.split('def ')[1].split('(')[0]
            params = stripped.split('(')[1].split(')')[0]
            pseudo_code.append(f"{indent}FUNCTION {func_name}({params}):")
            indent += "  "
        elif stripped.startswith('if '):
            condition = stripped.split('if ')[1].split(':')[0]
            pseudo_code.append(f"{indent}IF {condition} THEN")
            indent += "  "
        elif stripped.startswith('elif '):
            condition = stripped.split('elif ')[1].split(':')[0]
            indent = indent[:-2]
            pseudo_code.append(f"{indent}ELSE IF {condition} THEN")
            indent += "  "
        elif stripped.startswith('else:'):
            indent = indent[:-2]
            pseudo_code.append(f"{indent}ELSE")
            indent += "  "
        elif stripped.startswith('for '):
            loop = stripped.split('for ')[1].split(':')[0]
            pseudo_code.append(f"{indent}FOR {loop} DO")
            indent += "  "
        elif stripped.startswith('while '):
            condition = stripped.split('while ')[1].split(':')[0]
            pseudo_code.append(f"{indent}WHILE {condition} DO")
            indent += "  "
        elif stripped.startswith('return '):
            value = stripped.split('return ')[1]
            pseudo_code.append(f"{indent}RETURN {value}")
        elif stripped.startswith(('break', 'continue')):
            pseudo_code.append(f"{indent}{stripped.upper()}")
        elif stripped.endswith(':'):
            # Other block structures
            pseudo_code.append(f"{indent}{stripped}")
            indent += "  "
        else:
            # Regular statements
            pseudo_code.append(f"{indent}{stripped}")
    
    return "\n".join(pseudo_code)

def get_pseudo_code_explanation(code):
    """Explain the pseudo code."""
    return """The pseudo code above represents the logical structure of the original code, 
with control structures and function definitions highlighted. It abstracts away 
implementation details to focus on the algorithm and logic flow."""

def get_file_summary(content, file_path=None):
    """Summarize the file content."""
    language = detect_language(content, file_path)
    
    if file_path:
        ext = os.path.splitext(file_path)[1].lower()
        if ext == '.md':
            return "This is a Markdown document that contains formatted text and possibly code examples."
        elif ext == '.json':
            return "This is a JSON file that contains structured data in JavaScript Object Notation format."
        elif ext == '.xml':
            return "This is an XML file that contains structured data in Extensible Markup Language format."
        elif ext == '.yaml' or ext == '.yml':
            return "This is a YAML file that contains structured data in YAML Ain't Markup Language format."
    
    line_count = len(content.split('\n'))
    
    if language == "Python":
        class_count = content.count('class ')
        def_count = content.count('def ')
        return f"This is a Python file containing approximately {line_count} lines of code, {class_count} classes, and {def_count} function definitions."
    elif language == "JavaScript":
        function_count = content.count('function ')
        return f"This is a JavaScript file containing approximately {line_count} lines of code and {function_count} function definitions."
    elif language == "TypeScript":
        function_count = content.count('function ')
        interface_count = content.count('interface ')
        return f"This is a TypeScript file containing approximately {line_count} lines of code, {function_count} function definitions, and {interface_count} interfaces."
    else:
        return f"This is a {language} file containing approximately {line_count} lines of code."

def get_key_points(content):
    """Extract key points from the content."""
    # This is a simplified implementation
    lines = content.split('\n')
    key_points = []
    
    # Look for comments, function definitions, class definitions
    for line in lines:
        line = line.strip()
        if line.startswith('# ') and len(line) > 3:
            key_points.append(f"- {line[2:]}")
        elif line.startswith('// ') and len(line) > 4:
            key_points.append(f"- {line[3:]}")
        elif line.startswith('/* ') and len(line) > 4:
            key_points.append(f"- {line[3:].rstrip('*/')}")
    
    if key_points:
        return "\n".join(key_points)
    else:
        return "No explicit key points identified in comments. Consider adding descriptive comments to highlight important aspects of the code."

def get_file_structure(content, file_path=None):
    """Analyze the structure of the file."""
    language = detect_language(content, file_path)
    lines = content.split('\n')
    structure = []
    
    if language == "Python":
        imports = []
        classes = []
        functions = []
        
        for line in lines:
            line = line.strip()
            if line.startswith('import ') or line.startswith('from '):
                imports.append(line)
            elif line.startswith('class '):
                classes.append(line.split('class ')[1].split('(')[0].split(':')[0])
            elif line.startswith('def '):
                functions.append(line.split('def ')[1].split('(')[0])
        
        if imports:
            structure.append(f"- Imports ({len(imports)}): {', '.join(imports[:3])}{'...' if len(imports) > 3 else ''}")
        if classes:
            structure.append(f"- Classes ({len(classes)}): {', '.join(classes)}")
        if functions:
            structure.append(f"- Functions ({len(functions)}): {', '.join(functions[:5])}{'...' if len(functions) > 5 else ''}")
    
    elif language == "JavaScript" or language == "TypeScript":
        imports = []
        classes = []
        functions = []
        
        for line in lines:
            line = line.strip()
            if line.startswith('import '):
                imports.append(line)
            elif line.startswith('class '):
                classes.append(line.split('class ')[1].split(' {')[0].split(' extends')[0])
            elif line.startswith('function '):
                functions.append(line.split('function ')[1].split('(')[0])
            elif ' function ' in line:
                functions.append(line.split(' function ')[1].split('(')[0])
        
        if imports:
            structure.append(f"- Imports ({len(imports)}): {', '.join(imports[:3])}{'...' if len(imports) > 3 else ''}")
        if classes:
            structure.append(f"- Classes ({len(classes)}): {', '.join(classes)}")
        if functions:
            structure.append(f"- Functions ({len(functions)}): {', '.join(functions[:5])}{'...' if len(functions) > 5 else ''}")
    
    if structure:
        return "\n".join(structure)
    else:
        return "The file structure could not be automatically analyzed."

def get_custom_response(command, file_content):
    """Generate a custom response based on the command."""
    # This is a simplified implementation
    if "explain" in command.lower():
        return "Here's an explanation of the code you provided:\n\n" + get_code_overview(file_content)
    elif "summarize" in command.lower():
        return "Here's a summary of the content:\n\n" + get_file_summary(file_content)
    elif "improve" in command.lower() or "optimize" in command.lower():
        return "Here are some suggestions for improvement:\n\n" + get_improvement_suggestions(file_content)
    elif "issue" in command.lower() or "bug" in command.lower():
        return "Here are potential issues in the code:\n\n" + get_potential_issues(file_content)
    else:
        return f"I've processed your command: '{command}'. The content you provided is {len(file_content)} characters long."

def get_additional_info(command, file_content):
    """Provide additional information based on the command and content."""
    # This is a simplified implementation
    language = detect_language(file_content)
    return f"The content appears to be written in {language}. It contains {len(file_content.split('\\n'))} lines and {len(file_content)} characters."

def main():
    """Main function to process input and generate output."""
    args = parse_arguments()
    
    if not args.input_file:
        print("Error: No input file specified. Use --input-file to specify the input JSON file.")
        sys.exit(1)
    
    try:
        # Read the input file
        with open(args.input_file, 'r') as f:
            input_data = json.load(f)
        
        # Extract data from input
        command = input_data.get('command', input_data.get('prompt', ''))
        file_content = input_data.get('file_content', input_data.get('input', ''))
        file_path = input_data.get('file_path', None)
        command_type = input_data.get('command_type', None)
        
        # Process the command
        response = process_command(command, file_content, file_path, command_type)
        
        # Print the response
        print(response)
        
    except Exception as e:
        print(f"Error processing input: {str(e)}")
        if args.verbose:
            traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()