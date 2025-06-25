#!/usr/bin/env python3
"""
Simple test to verify our Pydantic models work correctly
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.models import QueryRequest, QueryResponse, QueryType, CodeContext

def test_models():
    """Test that our models can be created and serialized"""
    
    print("🧪 Testing Code Whisperer API Models")
    print("=" * 40)
    
    try:
        # Test CodeContext
        context = CodeContext(
            file_path="test.py",
            language="python",
            selected_code="def hello(): pass"
        )
        print("✅ CodeContext model created")
        
        # Test QueryRequest
        request = QueryRequest(
            query_type=QueryType.EXPLAIN,
            query_text="What does this function do?",
            code_context=context
        )
        print("✅ QueryRequest model created")
        print(f"   Query Type: {request.query_type}")
        print(f"   Language: {request.code_context.language}")
        
        # Test JSON serialization
        json_data = request.dict()
        print("✅ JSON serialization works")
        print(f"   JSON keys: {list(json_data.keys())}")
        
        print("\n" + "=" * 40)
        print("🎉 All models working correctly!")
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    success = test_models()
    sys.exit(0 if success else 1) 