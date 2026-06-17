# Quick Start Script - Starts both orchestrator and dashboard
Write-Host "Starting Automation Orchestrator and Dashboard..." -ForegroundColor Cyan

# Start orchestrator minimized
Start-Process powershell -ArgumentList "-ExecutionPolicy Bypass -File `"C:\Users\adamm\automation_consolidation_v2\start.ps1`"" -WindowStyle Minimized

# Wait for orchestrator to start
Start-Sleep -Seconds 3

# Start dashboard
Start-Process node -ArgumentList "server.js" -WorkingDirectory "C:\Users\adamm\automation_consolidation_v2\dashboard"

# Wait for dashboard to start
Start-Sleep -Seconds 2

# Open browser
Start-Process "http://localhost:8080"

Write-Host "Automation system started!" -ForegroundColor Green

