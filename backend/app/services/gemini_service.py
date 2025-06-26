"""
Gemini AI Service for Code Whisperer
Handles AI queries using Google Gemini API with enhanced code analysis capabilities
"""

import os
import time
import uuid
import logging
from typing import List, Dict, Any, Optional
import asyncio

from dotenv import load_dotenv

from ..core.models import QueryRequest, QueryResponse, CodeSuggestion, QueryType

# Load environment variables
load_dotenv()

logger = logging.getLogger(__name__)


class GeminiService:
    """Enhanced service for interacting with Google Gemini API"""
    
    def __init__(self, api_key: Optional[str] = None, use_mock: bool = False):
        """Initialize the Gemini service"""
        self.use_mock = use_mock
        self.is_available = False
        self.api_key = api_key or os.getenv('GOOGLE_API_KEY')
        self.client = None
        self.model_name = "gemini-1.5-flash"  # Fast model for development
        
        logger.info(f"🤖 Initializing Gemini service (mock={use_mock})")
    
    async def initialize(self):
        """Initialize the service and test connectivity"""
        if self.use_mock:
            self.is_available = True
            logger.info("✅ Mock Gemini service initialized")
            return
        
        try:
            # Try to import and initialize Google Gemini
            import google.generativeai as genai
            
            if not self.api_key or self.api_key == 'your_gemini_api_key_here':
                logger.warning("⚠️ No valid API key provided, falling back to mock mode")
                self.use_mock = True
                self.is_available = True
                return
            
            # Configure the API
            genai.configure(api_key=self.api_key)
            self.client = genai.GenerativeModel(self.model_name)
            
            # Test the connection
            test_response = await asyncio.to_thread(
                self.client.generate_content,
                "Test connection. Please respond with 'OK' if you can read this."
            )
            
            if test_response and test_response.text:
                self.is_available = True
                logger.info("✅ Gemini API connection successful")
            else:
                raise Exception("No response from Gemini API")
                
        except ImportError:
            logger.error("❌ google-generativeai package not installed properly")
            self.use_mock = True
            self.is_available = True
        except Exception as e:
            logger.error(f"❌ Failed to initialize Gemini API: {e}")
            logger.info("🔄 Falling back to mock mode")
            self.use_mock = True
            self.is_available = True
    
    async def process_query(self, request: QueryRequest) -> QueryResponse:
        """Process a code analysis query"""
        start_time = time.time()
        query_id = str(uuid.uuid4())
        
        try:
            if self.use_mock:
                return await self._generate_mock_response(request, query_id, start_time)
            
            # Build the prompt
            prompt = self._build_enhanced_prompt(request)
            
            # Query Gemini API
            response = await asyncio.to_thread(
                self.client.generate_content,
                prompt
            )
            
            if not response or not response.text:
                raise Exception("Empty response from Gemini API")
            
            # Parse the response
            return self._parse_gemini_response(
                response.text, 
                request.query_type, 
                query_id, 
                start_time
            )
            
        except Exception as e:
            logger.error(f"❌ Error processing query {query_id}: {e}")
            return await self._generate_error_response(request, query_id, start_time, str(e))
    
    def _build_enhanced_prompt(self, request: QueryRequest) -> str:
        """Build a comprehensive prompt for Gemini"""
        context = request.code_context
        language = context.language
        file_name = os.path.basename(context.file_path)
        
        # Enhanced prompt templates
        prompt_templates = {
            QueryType.EXPLAIN: f"""
You are a senior software engineer providing code explanations. Analyze this {language} code and provide a comprehensive explanation.

**File:** {file_name}
**Language:** {language}
**Code to analyze:**
```{language}
{context.selected_code}
```

**User Question:** {request.query_text}

Please provide a detailed analysis covering:
1. **What the code does** - High-level purpose and functionality
2. **How it works** - Step-by-step breakdown of the logic
3. **Key concepts** - Important patterns, algorithms, or techniques used
4. **Code quality** - Any observations about structure, readability, or style

Keep your explanation clear and educational.
""",
            
            QueryType.OPTIMIZE: f"""
You are a performance optimization expert. Analyze this {language} code and suggest improvements.

**File:** {file_name}
**Language:** {language}
**Code to analyze:**
```{language}
{context.selected_code}
```

**User Question:** {request.query_text}

Please provide:
1. **Performance analysis** - Current efficiency and bottlenecks
2. **Optimization opportunities** - Specific improvements with explanations
3. **Improved code examples** - Show better implementations
4. **Trade-offs** - Performance vs readability vs maintainability

Focus on practical, measurable improvements.
""",
            
            QueryType.DEBUG: f"""
You are a debugging specialist. Help identify and fix issues in this {language} code.

**File:** {file_name}
**Language:** {language}
**Code to analyze:**
```{language}
{context.selected_code}
```

**User Question:** {request.query_text}

Please provide:
1. **Potential issues** - Bugs, errors, or problematic patterns
2. **Root cause analysis** - Why these issues occur
3. **Solutions** - How to fix the identified problems
4. **Prevention** - Best practices to avoid similar issues

Be specific about locations and provide corrected code examples.
""",
            
            QueryType.REFACTOR: f"""
You are a code quality expert. Help refactor this {language} code to improve its structure and maintainability.

**File:** {file_name}
**Language:** {language}
**Code to analyze:**
```{language}
{context.selected_code}
```

**User Question:** {request.query_text}

Please provide:
1. **Code structure analysis** - Current organization and design
2. **Refactoring opportunities** - Areas for improvement
3. **Refactored examples** - Show improved code structure
4. **Benefits** - How the changes improve maintainability

Focus on clean code principles and best practices.
""",
            
            QueryType.REVIEW: f"""
You are conducting a thorough code review for this {language} code.

**File:** {file_name}
**Language:** {language}
**Code to analyze:**
```{language}
{context.selected_code}
```

**User Question:** {request.query_text}

Please provide a comprehensive code review covering:
1. **Code quality** - Structure, readability, and style
2. **Best practices** - Adherence to language conventions
3. **Potential issues** - Security, performance, or correctness concerns
4. **Suggestions** - Specific improvements with examples

Be constructive and provide actionable feedback.
""",
            
            QueryType.GENERATE: f"""
You are a code generation expert. Help generate or complete {language} code based on the request.

**File:** {file_name}
**Language:** {language}
**Context code:**
```{language}
{context.selected_code}
```

**User Request:** {request.query_text}

Please provide:
1. **Generated code** - Complete, working implementation
2. **Explanation** - How the generated code works
3. **Integration** - How it fits with existing code
4. **Alternatives** - Different approaches if applicable

Ensure the generated code follows best practices and is production-ready.
"""
        }
        
        return prompt_templates.get(request.query_type, prompt_templates[QueryType.EXPLAIN])
    
    def _parse_gemini_response(self, response_text: str, query_type: QueryType, query_id: str, start_time: float) -> QueryResponse:
        """Parse Gemini response into structured QueryResponse"""
        
        # Extract suggestions
        suggestions = self._extract_suggestions_enhanced(response_text)
        
        # Extract code examples
        code_examples = self._extract_code_examples_enhanced(response_text)
        
        # Calculate confidence
        confidence = self._calculate_confidence_enhanced(response_text, len(suggestions))
        
        return QueryResponse(
            query_id=query_id,
            query_type=query_type,
            explanation=response_text,
            suggestions=suggestions,
            code_examples=code_examples,
            confidence=confidence,
            processing_time_ms=int((time.time() - start_time) * 1000)
        )
    
    def _extract_suggestions_enhanced(self, response: str) -> List[CodeSuggestion]:
        """Extract detailed suggestions from the response"""
        suggestions = []
        
        # Look for numbered points, bullet points, or section headers
        lines = response.split('\n')
        current_suggestion = None
        
        for line in lines:
            line = line.strip()
            
            # Look for numbered lists, bullets, or bold headers
            if line and any(line.startswith(marker) for marker in ['1.', '2.', '3.', '4.', '5.', '-', '*', '•']):
                if current_suggestion:
                    suggestions.append(current_suggestion)
                
                # Clean up the line
                clean_line = line
                for marker in ['1.', '2.', '3.', '4.', '5.', '-', '*', '•']:
                    clean_line = clean_line.replace(marker, '').strip()
                
                # Create suggestion
                title = clean_line[:60] + "..." if len(clean_line) > 60 else clean_line
                current_suggestion = CodeSuggestion(
                    title=title,
                    description=clean_line,
                    confidence=0.85
                )
        
        # Add the last suggestion
        if current_suggestion:
            suggestions.append(current_suggestion)
        
        return suggestions[:5]  # Limit to top 5
    
    def _extract_code_examples_enhanced(self, response: str) -> List[str]:
        """Extract code examples from the response"""
        examples = []
        
        # Look for code blocks
        parts = response.split('```')
        for i in range(1, len(parts), 2):  # Get odd indices (inside code blocks)
            code_block = parts[i].strip()
            # Remove language identifier if present
            lines = code_block.split('\n')
            if lines and not lines[0].strip().startswith((' ', '\t', '/')):
                lines = lines[1:]  # Remove language line
            
            example = '\n'.join(lines).strip()
            if example and len(example) > 10:  # Only substantial examples
                examples.append(example)
        
        return examples[:3]  # Limit to 3 examples
    
    def _calculate_confidence_enhanced(self, response: str, num_suggestions: int) -> float:
        """Calculate confidence based on response quality"""
        confidence = 0.7  # Base confidence
        
        # Length indicates thoroughness
        if len(response) > 800:
            confidence += 0.1
        elif len(response) > 400:
            confidence += 0.05
        
        # Code examples indicate practical advice
        if '```' in response:
            confidence += 0.1
        
        # Structured response indicates organization
        if any(response.count(f'{i}.') > 0 for i in range(1, 6)):
            confidence += 0.05
        
        # Multiple suggestions indicate comprehensive analysis
        if num_suggestions >= 3:
            confidence += 0.05
        
        return min(confidence, 1.0)
    
    async def _generate_mock_response(self, request: QueryRequest, query_id: str, start_time: float) -> QueryResponse:
        """Generate a realistic mock response for testing"""
        context = request.code_context
        language = context.language
        
        # Simulate processing time
        await asyncio.sleep(0.5)
        
        mock_responses = {
            QueryType.EXPLAIN: f"""
This {language} code implements a function that processes data efficiently. Here's a breakdown:

**Main Functionality:**
The code appears to handle data transformation and processing, using common {language} patterns for optimal performance.

**Key Components:**
1. **Data Input Processing** - Validates and normalizes incoming data
2. **Core Logic** - Applies business rules and transformations  
3. **Output Generation** - Formats results for downstream consumption

**Notable Features:**
- Uses efficient algorithms for data processing
- Implements proper error handling
- Follows {language} best practices for code organization

The implementation demonstrates good understanding of {language} idioms and maintains clean, readable structure.
""",
            
            QueryType.OPTIMIZE: f"""
**Performance Analysis:**
The current {language} code has several optimization opportunities that could improve execution speed and memory usage.

**Key Optimization Areas:**
1. **Algorithm Efficiency** - Current O(n²) operations could be reduced to O(n log n)
2. **Memory Usage** - Unnecessary object creation can be minimized
3. **Caching Opportunities** - Repeated calculations could be memoized

**Recommended Improvements:**
- Replace nested loops with more efficient data structures
- Use built-in {language} functions for better performance
- Implement lazy evaluation where possible
- Consider parallel processing for CPU-intensive operations

These optimizations could result in 40-60% performance improvement while maintaining code readability.
""",
            
            QueryType.DEBUG: f"""
**Potential Issues Identified:**
I've analyzed the {language} code and found several areas that could cause problems:

**Critical Issues:**
1. **Null/Undefined Handling** - Missing validation could cause runtime errors
2. **Edge Cases** - Boundary conditions aren't properly handled
3. **Resource Management** - Potential memory leaks in error scenarios

**Debugging Recommendations:**
- Add comprehensive input validation
- Implement proper exception handling
- Use defensive programming techniques
- Add logging for troubleshooting

**Prevention Strategies:**
- Write unit tests covering edge cases
- Use static analysis tools
- Implement code review processes
"""
        }
        
        base_response = mock_responses.get(
            request.query_type, 
            mock_responses[QueryType.EXPLAIN]
        )
        
        suggestions = [
            CodeSuggestion(
                title="Improve error handling",
                description="Add try-catch blocks to handle potential exceptions gracefully",
                confidence=0.9
            ),
            CodeSuggestion(
                title="Add input validation",
                description="Validate input parameters to prevent invalid data processing",
                confidence=0.85
            ),
            CodeSuggestion(
                title="Optimize data structures",
                description="Consider using more efficient data structures for better performance",
                confidence=0.8
            )
        ]
        
        code_examples = [
            f"// Example {language} improvement\nfunction improvedVersion() {{\n    // Better implementation here\n    return result;\n}}"
        ]
        
        return QueryResponse(
            query_id=query_id,
            query_type=request.query_type,
            explanation=base_response,
            suggestions=suggestions,
            code_examples=code_examples,
            confidence=0.85,
            processing_time_ms=int((time.time() - start_time) * 1000)
        )
    
    async def _generate_error_response(self, request: QueryRequest, query_id: str, start_time: float, error_msg: str) -> QueryResponse:
        """Generate error response"""
        return QueryResponse(
            query_id=query_id,
            query_type=request.query_type,
            explanation=f"I encountered an error while analyzing your code: {error_msg}. Please try again or contact support if the issue persists.",
            suggestions=[
                CodeSuggestion(
                    title="Try again",
                    description="The AI service may be temporarily unavailable. Please retry your request.",
                    confidence=0.5
                )
            ],
            code_examples=[],
            confidence=0.3,
            processing_time_ms=int((time.time() - start_time) * 1000)
        )
    
    async def get_model_info(self) -> Dict[str, Any]:
        """Get information about the AI model being used"""
        return {
            "model_name": self.model_name,
            "provider": "Google Gemini",
            "mode": "mock" if self.use_mock else "live",
            "available": self.is_available
        }
    
    async def cleanup(self):
        """Cleanup resources"""
        logger.info("🧹 Cleaning up Gemini service...")
        self.client = None
        self.is_available = False 