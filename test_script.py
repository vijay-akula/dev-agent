#!/usr/bin/env python3
"""
Test script for Dev Agent extension.
This script demonstrates various Python features that can be processed by the Dev Agent.
"""

import os
import sys
import math
from datetime import datetime


class Calculator:
    """A simple calculator class to demonstrate class functionality."""
    
    def __init__(self, initial_value=0):
        self.value = initial_value
    
    def add(self, x):
        """Add a number to the current value."""
        self.value += x
        return self.value
    
    def subtract(self, x):
        """Subtract a number from the current value."""
        self.value -= x
        return self.value
    
    def multiply(self, x):
        """Multiply the current value by a number."""
        self.value *= x
        return self.value
    
    def divide(self, x):
        """Divide the current value by a number."""
        if x == 0:
            raise ValueError("Cannot divide by zero")
        self.value /= x
        return self.value
    
    def __str__(self):
        return f"Calculator(value={self.value})"


def is_prime(n):
    """Check if a number is prime."""
    if n <= 1:
        return False
    if n <= 3:
        return True
    if n % 2 == 0 or n % 3 == 0:
        return False
    i = 5
    while i * i <= n:
        if n % i == 0 or n % (i + 2) == 0:
            return False
        i += 6
    return True


def generate_primes(limit):
    """Generate a list of prime numbers up to the given limit."""
    return [n for n in range(2, limit + 1) if is_prime(n)]


def fibonacci(n):
    """Generate the Fibonacci sequence up to n terms."""
    sequence = [0, 1]
    while len(sequence) < n:
        sequence.append(sequence[-1] + sequence[-2])
    return sequence


def main():
    """Main function to demonstrate the script functionality."""
    print(f"Running test script at {datetime.now()}")
    
    # Test the Calculator class
    calc = Calculator(10)
    print(f"Initial calculator value: {calc.value}")
    print(f"After adding 5: {calc.add(5)}")
    print(f"After multiplying by 2: {calc.multiply(2)}")
    print(f"After subtracting 7: {calc.subtract(7)}")
    print(f"After dividing by 2: {calc.divide(2)}")
    
    # Test prime number generation
    limit = 50
    primes = generate_primes(limit)
    print(f"Prime numbers up to {limit}: {primes}")
    
    # Test Fibonacci sequence
    n_terms = 10
    fib_sequence = fibonacci(n_terms)
    print(f"First {n_terms} Fibonacci numbers: {fib_sequence}")
    
    # Environment information
    print(f"\nPython version: {sys.version}")
    print(f"Current working directory: {os.getcwd()}")


if __name__ == "__main__":
    # @dev-agent explain this code
    main()