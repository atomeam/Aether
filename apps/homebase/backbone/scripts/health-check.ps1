# Automation Consolidation v2 - Health Check Script
# Run this script to check the health of the orchestrator

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Orchestrator Health Check" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$healthUrl = "http://localhost:3000/health"

try {
    Write-Host "Checking orchestrator health at $healthUrl..." -ForegroundColor Yellow
    $response = Invoke-RestMethod -Uri $healthUrl -TimeoutSec 5
    
    Write-Host "Status: $($response.status)" -ForegroundColor Green
    Write-Host "Timestamp: $($response.timestamp)" -ForegroundColor White
    Write-Host "Uptime: $([math]::Round($response.uptime, 2)) seconds" -ForegroundColor White
    
    Write-Host ""
    Write-Host "Orchestrator is healthy!" -ForegroundColor Green
    exit 0
} catch {
    Write-Host "Failed to connect to orchestrator" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Make sure the orchestrator is running:" -ForegroundColor Yellow
    Write-Host "npm run dev" -ForegroundColor White
    exit 1
}
