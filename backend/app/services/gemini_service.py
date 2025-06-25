"""
Gemini AI Service for Code Whisperer
Handles AI queries using Google Gemini API with RAG capabilities
"""

import os
import time
import uuid
from typing import List, Dict, Any
from dotenv import load_dotenv
from google import genai

# Load environment variables
load_dotenv()


class GeminiService:
    """Service for interacting with Google Gemini API"""
    
    def __init__(self):
        """Initialize the Gemini service with API key"""
        self.api_key = os.getenv('GOOGLE_API_KEY')
        if not self.api_key:
            raise ValueError("GOOGLE_API_KEY not found in environment variables")
        
        # Initialize Gemini client
        self.client = genai.Client(api_key=self.api_key)
        self.model = "gemini-1.5-flash"  # Fast model for development
        
    def analyze_code(self, query_type: str, query_text: str, code_context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyze code using Gemini AI
        
        Args:
            query_type: Type of analysis (explain, optimize, debug, etc.)
            query_text: User's specific question
            code_context: Context about the code (language, file, content)
            
        Returns:
            Dict containing analysis results
        """
        start_time = time.time()
        
        # Build context-aware prompt
        prompt = self._build_prompt(query_type, query_text, code_context)
        
        try:
            # Query Gemini API
            response = self.client.models.generate_content(
                model=self.model,
                contents=prompt
            )
            
            # Process response
            ai_response = response.text.strip()
            
            # Parse response into structured format
            analysis = self._parse_response(ai_response, query_type)
            
            # Add metadata
            analysis["processing_time_ms"] = int((time.time() - start_time) * 1000)
            analysis["query_id"] = str(uuid.uuid4())
            analysis["model_used"] = self.model
            
            return analysis
            
        except Exception as e:
            # Handle API errors gracefully
            return {
                "error": True,
                "message": f"Gemini API error: {str(e)}",
                "query_id": str(uuid.uuid4()),
                "processing_time_ms": int((time.time() - start_time) * 1000)
            }
    
    def _build_prompt(self, query_type: str, query_text: str, code_context: Dict[str, Any]) -> str:
        """Build a context-aware prompt for Gemini"""
        
        language = code_context.get('language', 'unknown')
        file_path = code_context.get('file_path', 'unknown')
        selected_code = code_context.get('selected_code', '')
        
        # Base prompt templates for different query types
        prompts = {
            "explain": f"""
As a senior software engineer, please explain this {language} code:

File: {file_path}
Code:
```{language}
{selected_code}
```

Question: {query_text}

Please provide:
1. A clear explanation of what the code does
2. Key concepts and patterns used
3. Any notable features or potential issues

Keep the explanation concise but thorough.
""",
            
            "optimize": f"""
As a performance expert, analyze this {language} code for optimization opportunities:

File: {file_path}
Code:
```{language}
{selected_code}
```

Question: {query_text}

Please provide:
1. Performance analysis
2. Specific optimization suggestions
3. Improved code examples where applicable
4. Trade-offs to consider

Focus on practical improvements.
""",
            
            "debug": f"""
As a debugging specialist, help identify issues in this {language} code:

File: {file_path}
Code:
```{language}
{selected_code}
```

Question: {query_text}

Please provide:
1. Potential bugs or issues
2. Common pitfalls in this code pattern
3. Debugging suggestions
4. Best practices to prevent similar issues

Be specific about line numbers when possible.
""",
        }
        
        return prompts.get(query_type, prompts["explain"])
    
    def _parse_response(self, ai_response: str, query_type: str) -> Dict[str, Any]:
        """Parse Gemini response into structured format"""
        
        return {
            "explanation": ai_response,
            "suggestions": self._extract_suggestions(ai_response),
            "code_examples": self._extract_code_examples(ai_response),
            "confidence": self._calculate_confidence(ai_response),
            "query_type": query_type
        }
    
    def _extract_suggestions(self, response: str) -> List[Dict[str, Any]]:
        """Extract actionable suggestions from AI response"""
        suggestions = []
        
        # Simple extraction - look for numbered points or bullet points
        lines = response.split('\n')
        current_suggestion = None
        
        for line in lines:
            line = line.strip()
            if line and (line.startswith(('1.', '2.', '3.', '4.', '5.', '-', '*'))):
                if current_suggestion:
                    suggestions.append(current_suggestion)
                
                # Clean up the line to get the suggestion
                clean_line = line.lstrip('12345.-* ').strip()
                current_suggestion = {
                    "title": clean_line[:50] + "..." if len(clean_line) > 50 else clean_line,
                    "description": clean_line,
                    "confidence": 0.8
                }
        
        # Add the last suggestion if any
        if current_suggestion:
            suggestions.append(current_suggestion)
        
        return suggestions[:5]  # Limit to top 5 suggestions
    
    def _extract_code_examples(self, response: str) -> List[str]:
        """Extract code examples from AI response"""
        examples = []
        
        # Look for code blocks
        lines = response.split('\n')
        in_code_block = False
        current_example = []
        
        for line in lines:
            if line.strip().startswith('```'):
                if in_code_block:
                    # End of code block
                    if current_example:
                        examples.append('\n'.join(current_example))
                        current_example = []
                    in_code_block = False
                else:
                    # Start of code block
                    in_code_block = True
            elif in_code_block:
                current_example.append(line)
        
        return examples[:3]  # Limit to 3 examples
    
    def _calculate_confidence(self, response: str) -> float:
        """Calculate confidence score based on response quality"""
        # Simple heuristic-based confidence calculation
        confidence = 0.7  # Base confidence
        
        # Boost confidence for longer, detailed responses
        if len(response) > 500:
            confidence += 0.1
        
        # Boost for code examples
        if '```' in response:
            confidence += 0.1
        
        # Boost for structured responses (numbered points)
        if any(response.count(f'{i}.') > 0 for i in range(1, 6)):
            confidence += 0.1
        
        return min(confidence, 1.0)
    
    def health_check(self) -> Dict[str, Any]:
        """Check if Gemini service is healthy"""
        try:
            # Simple test query
            response = self.client.models.generate_content(
                model=self.model,
                contents="Hello! Please respond with 'Service is healthy' if you can read this."
            )
            
            if "healthy" in response.text.lower():
                return {"status": "healthy", "service": "gemini_api"}
            else:
                return {"status": "degraded", "service": "gemini_api"}
                
        except Exception as e:
            return {"status": "unhealthy", "service": "gemini_api", "error": str(e)} 