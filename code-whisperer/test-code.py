def calculate_fibonacci(n):
    """
    Calculate the nth Fibonacci number using recursion.
    This function has room for optimization.
    """
    if n <= 1:
        return n
    return calculate_fibonacci(n-1) + calculate_fibonacci(n-2)

def process_user_data(users):
    """
    Process a list of user dictionaries and extract active users.
    """
    active_users = []
    for user in users:
        if user.get('status') == 'active' and user.get('last_login'):
            # Convert name to title case
            formatted_name = user['name'].title()
            active_users.append({
                'id': user['id'],
                'name': formatted_name,
                'email': user['email'],
                'last_login': user['last_login']
            })
    return active_users

class DatabaseConnection:
    def __init__(self, host, port, database):
        self.host = host
        self.port = port
        self.database = database
        self.connection = None
    
    def connect(self):
        # This is a simplified connection method
        try:
            print(f"Connecting to {self.host}:{self.port}/{self.database}")
            # Simulate connection logic
            self.connection = f"connected-{self.database}"
            return True
        except Exception as e:
            print(f"Connection failed: {e}")
            return False
    
    def execute_query(self, query):
        if not self.connection:
            raise Exception("Not connected to database")
        # Simulate query execution
        return f"Result for: {query}"

# Example usage
if __name__ == "__main__":
    # Test Fibonacci
    result = calculate_fibonacci(10)
    print(f"Fibonacci(10) = {result}")
    
    # Test user processing
    sample_users = [
        {'id': 1, 'name': 'john doe', 'email': 'john@example.com', 'status': 'active', 'last_login': '2024-01-15'},
        {'id': 2, 'name': 'jane smith', 'email': 'jane@example.com', 'status': 'inactive', 'last_login': None},
        {'id': 3, 'name': 'bob wilson', 'email': 'bob@example.com', 'status': 'active', 'last_login': '2024-01-10'}
    ]
    
    active = process_user_data(sample_users)
    print(f"Active users: {active}")
    
    # Test database connection
    db = DatabaseConnection('localhost', 5432, 'myapp')
    if db.connect():
        result = db.execute_query("SELECT * FROM users")
        print(result) 