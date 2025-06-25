# Code Whisperer

AI-powered code assistant with RAG capabilities that helps developers understand and work with their codebase through natural language queries.

## Features

- **Code Analysis**: Analyze selected code or entire files using AI
- **Natural Language Queries**: Ask questions about your code in plain English
- **Multiple Analysis Types**: 
  - Explain code functionality
  - Optimize performance
  - Debug issues
  - Refactor suggestions
  - Code review
  - Generate code

## Usage

1. Open a code file in VS Code
2. Select some code (optional)
3. Use one of these methods:
   - **Command Palette**: `Ctrl+Shift+P` → "Code Whisperer: Analyze Selected Code"
   - **Right-click**: Right-click on selected code → "Code Whisperer: Analyze Selected Code"
   - **Keyboard**: `Ctrl+Alt+A` to analyze selected code
   - **Interface**: `Ctrl+Shift+P` → "Code Whisperer: Show Interface"

## Commands

- `Code Whisperer: Start` - Open the Code Whisperer interface
- `Code Whisperer: Analyze Code` - Analyze current file or selection
- `Code Whisperer: Analyze Selected Code` - Analyze currently selected code
- `Code Whisperer: Show Interface` - Show the Code Whisperer panel
- `Code Whisperer: Test Extension` - Test that the extension is working

## Requirements

- VS Code 1.74.0 or later
- Backend server running on localhost:8002 (for full functionality)

## Known Issues

- Backend integration is currently in development
- Mock responses are shown when backend is not available

## Release Notes

### 0.0.1

Initial development version with frontend interface and command structure.

## Development

This extension is currently in development. Backend integration and full AI capabilities are being implemented.
