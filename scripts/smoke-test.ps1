# Automated Smoke Test Script (PowerShell)
# Tests all critical endpoints automatically

param(
    [string]$BridgeUrl = "https://bridge.a-to-mind.com",
    [string]$BackendUrl = "http://localhost:3000"
)

$ErrorActionPreference = "Stop"

Write-Host "=== Automated Smoke Test ===" -ForegroundColor Cyan
Write-Host ""

# Test counter
$passed = 0
$failed = 0

# Test function
function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Url,
        [int]$ExpectedStatus
    )
    
    Write-Host -NoNewline "Testing $Name... "
    
    try {
        $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -Method Get
        $status = $response.StatusCode
        
        if ($status -eq $ExpectedStatus) {
            Write-Host "✓ PASS (HTTP $status)" -ForegroundColor Green
            $script:passed++
        } else {
            Write-Host "✗ FAIL (HTTP $status, expected $ExpectedStatus)" -ForegroundColor Red
            $script:failed++
        }
    }
    catch {
        Write-Host "✗ FAIL ($($_.Exception.Message))" -ForegroundColor Red
        $script:failed++
    }
}

# Test bridge endpoints
Write-Host "=== Bridge Worker Tests ===" -ForegroundColor Cyan
Test-Endpoint "Bridge Health" "$BridgeUrl/health" 200
Test-Endpoint "Bridge API Stack" "$BridgeUrl/api/stack" 200
Test-Endpoint "Bridge Crew Status" "$BridgeUrl/crew/status" 200
Write-Host ""

# Test backend endpoints (if running)
Write-Host "=== Backend Tests ===" -ForegroundColor Cyan
try {
    $backendResponse = Invoke-WebRequest -Uri "$BackendUrl/api/stack" -UseBasicParsing -Method Get
    Test-Endpoint "Backend Stack" "$BackendUrl/api/stack" 200
    Test-Endpoint "Backend Agents" "$BackendUrl/api/agents" 200
}
catch {
    Write-Host "⚠ Backend not running, skipping backend tests" -ForegroundColor Yellow
}
Write-Host ""

# Test heartbeat endpoint (requires test data)
Write-Host "=== Heartbeat Test ===" -ForegroundColor Cyan
Write-Host -NoNewline "Testing Heartbeat (write)..."
try {
    $heartbeatBody = @{
        ai_id = "test-smoke"
        name = "Smoke Test"
        status = "active"
    } | ConvertTo-Json
    
    $response = Invoke-WebRequest -Uri "$BridgeUrl/api/ai/heartbeat" `
        -UseBasicParsing `
        -Method POST `
        -ContentType "application/json" `
        -Body $heartbeatBody
    
    if ($response.Content -match '"ok":true') {
        Write-Host "✓ PASS" -ForegroundColor Green
        $script:passed++
    } else {
        Write-Host "✗ FAIL" -ForegroundColor Red
        $script:failed++
    }
}
catch {
    Write-Host "✗ FAIL ($($_.Exception.Message))" -ForegroundColor Red
    $script:failed++
}
Write-Host ""

# Test heartbeat read
Write-Host -NoNewline "Testing Heartbeat (read)..."
try {
    $presence = Invoke-WebRequest -Uri "$BridgeUrl/api/ai/presence" -UseBasicParsing -Method Get
    if ($presence.Content -match "test-smoke") {
        Write-Host "✓ PASS" -ForegroundColor Green
        $script:passed++
    } else {
        Write-Host "✗ FAIL" -ForegroundColor Red
        $script:failed++
    }
}
catch {
    Write-Host "✗ FAIL ($($_.Exception.Message))" -ForegroundColor Red
    $script:failed++
}
Write-Host ""

# Summary
Write-Host "=== Test Summary ===" -ForegroundColor Cyan
Write-Host "Passed: $passed" -ForegroundColor Green
Write-Host "Failed: $failed" -ForegroundColor Red
Write-Host ""

if ($failed -eq 0) {
    Write-Host "All tests passed!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "Some tests failed!" -ForegroundColor Red
    exit 1
}
