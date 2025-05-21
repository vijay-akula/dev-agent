#!/usr/bin/env python3
"""
Test file for the Dev Agent extension.
This file demonstrates various Python constructs.
"""

import os
import sys
import json
from typing import List, Dict, Any

class TestClass:
    """A simple test class to demonstrate class functionality."""
    
    def __init__(self, name: str):
        """Initialize the TestClass with a name."""
        self.name = name
        self.data = {}
    
    def process_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Process the input data and return the result."""
        self.data = data
        result = {}
        
        for key, value in data.items():
            if isinstance(value, str):
                result[key] = value.upper()
            elif isinstance(value, int):
                result[key] = value * 2
            else:
                result[key] = value
        
        return result

def calculate_fibonacci(n: int) -> List[int]:
    """Calculate the Fibonacci sequence up to n."""
    fib = [0, 1]
    
    while len(fib) < n:
        fib.append(fib[-1] + fib[-2])
    
    return fib

def main():
    """Main function to demonstrate the functionality."""
    # Create an instance of TestClass
    test_obj = TestClass("Test Object")
    
    # Process some data
    input_data = {
        "name": "example",
        "value": 42,
        "active": True
    }
    
    result = test_obj.process_data(input_data)
    print(f"Processed data: {result}")
    
    # Calculate Fibonacci sequence
    n = 10
    fib_sequence = calculate_fibonacci(n)
    print(f"Fibonacci sequence (n={n}): {fib_sequence}")

if __name__ == "__main__":
    main()