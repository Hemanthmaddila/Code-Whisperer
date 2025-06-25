// Sample JavaScript code for testing Code Whisperer

// Function with potential performance issues
function findDuplicates(arr) {
    const duplicates = [];
    for (let i = 0; i < arr.length; i++) {
        for (let j = i + 1; j < arr.length; j++) {
            if (arr[i] === arr[j] && !duplicates.includes(arr[i])) {
                duplicates.push(arr[i]);
            }
        }
    }
    return duplicates;
}

// Async function with error handling
async function fetchUserProfile(userId) {
    try {
        const response = await fetch(`/api/users/${userId}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const userData = await response.json();
        
        // Transform data
        return {
            id: userData.id,
            fullName: `${userData.firstName} ${userData.lastName}`,
            email: userData.email,
            isActive: userData.status === 'active',
            lastSeen: new Date(userData.lastLoginDate)
        };
    } catch (error) {
        console.error('Failed to fetch user profile:', error);
        return null;
    }
}

// Class with various methods
class ShoppingCart {
    constructor() {
        this.items = [];
        this.taxRate = 0.08;
    }

    addItem(product, quantity = 1) {
        const existingItem = this.items.find(item => item.product.id === product.id);
        
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            this.items.push({ product, quantity });
        }
    }

    removeItem(productId) {
        this.items = this.items.filter(item => item.product.id !== productId);
    }

    calculateSubtotal() {
        return this.items.reduce((total, item) => {
            return total + (item.product.price * item.quantity);
        }, 0);
    }

    calculateTotal() {
        const subtotal = this.calculateSubtotal();
        const tax = subtotal * this.taxRate;
        return subtotal + tax;
    }

    getItemCount() {
        return this.items.reduce((count, item) => count + item.quantity, 0);
    }
}

// Complex array processing function
function analyzeData(data) {
    const result = data
        .filter(item => item.active && item.score > 50)
        .map(item => ({
            ...item,
            category: item.score >= 80 ? 'excellent' : 'good',
            normalized: item.score / 100
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);

    return {
        topItems: result,
        averageScore: result.reduce((sum, item) => sum + item.score, 0) / result.length,
        categories: result.reduce((acc, item) => {
            acc[item.category] = (acc[item.category] || 0) + 1;
            return acc;
        }, {})
    };
}

// Event handling with potential memory leaks
function setupEventListeners() {
    const button = document.getElementById('submit-btn');
    const input = document.getElementById('user-input');
    
    button.addEventListener('click', function() {
        const value = input.value;
        console.log('Button clicked with value:', value);
        
        // This creates a memory leak
        setInterval(() => {
            console.log('Checking value:', value);
        }, 1000);
    });
}

// Utility function with edge cases
function formatCurrency(amount, currency = 'USD') {
    if (typeof amount !== 'number' || isNaN(amount)) {
        return 'Invalid amount';
    }
    
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2
    }).format(amount);
}

// Example usage
const cart = new ShoppingCart();
cart.addItem({ id: 1, name: 'Laptop', price: 999.99 }, 1);
cart.addItem({ id: 2, name: 'Mouse', price: 29.99 }, 2);

console.log('Cart total:', formatCurrency(cart.calculateTotal()));
console.log('Items in cart:', cart.getItemCount());

const sampleData = [
    { id: 1, active: true, score: 85, name: 'Product A' },
    { id: 2, active: false, score: 45, name: 'Product B' },
    { id: 3, active: true, score: 92, name: 'Product C' },
    { id: 4, active: true, score: 67, name: 'Product D' }
];

const analysis = analyzeData(sampleData);
console.log('Data analysis:', analysis); 