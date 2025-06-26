def fibonacci(n):
    """Calculate the nth Fibonacci number using recursion."""
    if n <= 1:
        return n
    else:
        return fibonacci(n-1) + fibonacci(n-2)

# This function could be optimized for better performance
def process_data(data):
    result = []
    for item in data:
        if item > 0:
            result.append(item * 2)
    return result

# Example usage
numbers = [1, -2, 3, 4, -5, 6]
processed = process_data(numbers)
print(f"Fibonacci of 10: {fibonacci(10)}")
print(f"Processed data: {processed}") 