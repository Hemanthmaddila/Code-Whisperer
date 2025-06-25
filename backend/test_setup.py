#!/usr/bin/env python3
"""
Quick test to verify development environment setup
"""

import sys
import os
from dotenv import load_dotenv

def test_dev_environment():
    """Test the cloned development environment"""
    
    print("🧪 Testing Code Whisperer Development Environment")
    print("=" * 55)
    
    # Test environment variables
    load_dotenv()
    api_key = os.getenv('GOOGLE_API_KEY')
    
    # Test imports
    try:
        import fastapi
        print(f"✅ FastAPI: {fastapi.__version__}")
    except ImportError:
        print("❌ FastAPI not available")
        return False
    
    try:
        from google import genai
        print(f"✅ Google GenAI: Available")
    except ImportError:
        print("❌ Google GenAI not available")
        return False
    
    try:
        import langchain
        print(f"✅ LangChain: {langchain.__version__}")
    except ImportError:
        print("❌ LangChain not available")
        return False
    
    # Test API key
    if api_key and api_key != "your_gemini_api_key_here":
        print(f"✅ API Key: Configured (***{api_key[-4:]})")
        
        # Quick API test
        try:
            client = genai.Client(api_key=api_key)
            response = client.models.generate_content(
                model="gemini-1.5-flash",
                contents="Hello! Just testing the connection. Please respond with 'Connection successful!'"
            )
            print(f"✅ API Test: {response.text.strip()}")
        except Exception as e:
            print(f"⚠️  API Test: Failed - {str(e)[:50]}...")
    else:
        print("❌ API Key: Not configured")
        return False
    
    # Test virtual environment
    if 'code-whisperer-dev' in sys.prefix:
        print(f"✅ Virtual Environment: Active (development clone)")
    else:
        print(f"⚠️  Virtual Environment: {sys.prefix}")
    
    print("\n" + "=" * 55)
    print("🎉 Development Environment Ready!")
    print("🚀 Ready to start Phase 2: Backend Development!")
    
    return True

if __name__ == "__main__":
    success = test_dev_environment()
    sys.exit(0 if success else 1) 