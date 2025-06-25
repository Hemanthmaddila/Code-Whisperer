# Test Code Whisperer API
$uri = "http://localhost:8001/api/v1/query"
$headers = @{
    "Content-Type" = "application/json"
}

$body = @{
    query_type = "explain"
    query_text = "What does this function do and how can I improve it?"
    code_context = @{
        file_path = "example.py"
        language = "python"
        selected_code = "def fibonacci(n):`n    if n <= 1:`n        return n`n    return fibonacci(n-1) + fibonacci(n-2)"
    }
    include_examples = $true
} | ConvertTo-Json -Depth 3

Write-Host "🧪 Testing Code Whisperer API..."
Write-Host "📍 URL: $uri"
Write-Host "📝 Request: Fibonacci function analysis"
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri $uri -Method POST -Headers $headers -Body $body
    Write-Host "✅ SUCCESS! AI Analysis received:"
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
} catch {
    Write-Host "❌ ERROR: $($_.Exception.Message)"
} 