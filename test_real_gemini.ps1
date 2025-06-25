# Test Real Gemini API
$uri = "http://localhost:8002/api/v1/query"
$headers = @{
    "Content-Type" = "application/json"
}

$body = @{
    query_type = "explain"
    query_text = "Explain what this Python function does and suggest improvements"
    code_context = @{
        file_path = "test.py"
        language = "python"
        selected_code = "def factorial(n):`n    if n == 0:`n        return 1`n    else:`n        return n * factorial(n-1)"
    }
    include_examples = $true
} | ConvertTo-Json -Depth 3

Write-Host "🧪 Testing REAL Gemini API Integration..."
Write-Host "📍 URL: $uri"
Write-Host "📝 Request: Factorial function analysis"
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri $uri -Method POST -Headers $headers -Body $body
    Write-Host "✅ SUCCESS! Real AI Analysis received:"
    Write-Host ""
    Write-Host "🔍 Query ID: $($response.query_id)"
    Write-Host "⏱️  Processing Time: $($response.processing_time_ms)ms"
    Write-Host "🎯 Confidence: $($response.confidence)"
    Write-Host ""
    Write-Host "📋 AI Explanation:"
    Write-Host $response.explanation
    Write-Host ""
    Write-Host "💡 Suggestions ($($response.suggestions.Count)):"
    foreach ($suggestion in $response.suggestions) {
        Write-Host "  - $($suggestion.title)"
    }
    Write-Host ""
    
    # Check if this is real Gemini response or mock
    if ($response.explanation -like "*This is a mock response*") {
        Write-Host "❌ WARNING: Still getting mock responses - API key may not be working"
    } else {
        Write-Host "🎉 REAL GEMINI API WORKING! Getting actual AI responses!"
    }
} catch {
    Write-Host "❌ ERROR: $($_.Exception.Message)"
} 