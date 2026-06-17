# Automation Consolidation v2 - Start Script
# Run this script to start the orchestrator

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Starting Automation Orchestrator" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if .env exists
if (-not (Test-Path "backbone\config\.env")) {
    Write-Host "backbone\config\.env not found. Running setup first..." -ForegroundColor Yellow
    & ".\backbone\scripts\setup.ps1"
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Setup failed. Please run setup manually." -ForegroundColor Red
        exit 1
    }
}

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "Dependencies not installed. Running npm install..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to install dependencies" -ForegroundColor Red
        exit 1
    }
}

# Start the orchestrator
Write-Host "Starting orchestrator..." -ForegroundColor Yellow
Write-Host "Press Ctrl+C to stop" -ForegroundColor Gray
Write-Host ""

npm run dev
