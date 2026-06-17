# Windows Service Installation Script for Automation Orchestrator
# This script installs the orchestrator as a Windows service using NSSM (Non-Sucking Service Manager)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Automation Orchestrator Service Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptPath
$serviceName = "AutomationOrchestrator"
$serviceDisplayName = "Automation Orchestrator"
$nodePath = "node"
$scriptPath = "$projectRoot\backbone\orchestrator\src\index.ts"

Write-Host "Project Root: $projectRoot" -ForegroundColor Yellow
Write-Host "Service Name: $serviceName" -ForegroundColor Yellow
Write-Host "Script Path: $scriptPath" -ForegroundColor Yellow

# Check if NSSM is available
$nssmPath = "nssm"
try {
    $nssmVersion = & $nssmPath version 2>&1
    Write-Host "NSSM found: $nssmVersion" -ForegroundColor Green
} catch {
    Write-Host "NSSM not found. Please install NSSM from https://nssm.cc/download" -ForegroundColor Red
    Write-Host "Alternative: Use Task Scheduler instead" -ForegroundColor Yellow
    exit 1
}

# Check if service already exists
$service = Get-Service -Name $serviceName -ErrorAction SilentlyContinue
if ($service) {
    Write-Host "Service '$serviceName' already exists. Stopping and removing..." -ForegroundColor Yellow
    Stop-Service -Name $serviceName -Force
    & $nssmPath remove $serviceName confirm
    Start-Sleep -Seconds 2
}

# Install the service
Write-Host "Installing service..." -ForegroundColor Green
& $nssmPath install $serviceName $nodePath "$scriptPath"
& $nssmPath set $serviceName AppDirectory "$projectRoot"
& $nssmPath set $serviceName DisplayName $serviceDisplayName
& $nssmPath set $serviceName Description "Automation Orchestrator - Manages scheduled workflows and automation tasks"
& $nssmPath set $serviceName Start SERVICE_AUTO_START
& $nssmPath set $serviceName AppEnvironmentExtra "NODE_ENV=production"

# Set up logging
$logsDir = "$projectRoot\logs"
if (-not (Test-Path $logsDir)) {
    New-Item -ItemType Directory -Path $logsDir -Force
}
& $nssmPath set $serviceName StdoutLog "$logsDir\service-stdout.log"
& $nssmPath set $serviceName StderrLog "$logsDir\service-stderr.log"

# Set service recovery options
& $nssmPath set $serviceName AppRestartDelay 60000
& $nssmPath set $serviceName AppThrottle 1500
& $nssmPath set $serviceName AppExit Default Restart
& $nssmPath set $serviceName AppRestartDelay 60000

# Start the service
Write-Host "Starting service..." -ForegroundColor Green
Start-Service -Name $serviceName

# Verify service is running
$service = Get-Service -Name $serviceName
if ($service.Status -eq 'Running') {
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "Service installed and running successfully!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "Service Name: $serviceName" -ForegroundColor Cyan
    Write-Host "Status: $($service.Status)" -ForegroundColor Cyan
    Write-Host "Logs: $logsDir" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Useful commands:" -ForegroundColor Yellow
    Write-Host "  Start service:   Start-Service $serviceName" -ForegroundColor White
    Write-Host "  Stop service:    Stop-Service $serviceName" -ForegroundColor White
    Write-Host "  Restart service: Restart-Service $serviceName" -ForegroundColor White
    Write-Host "  Remove service:  nssm remove $serviceName confirm" -ForegroundColor White
    Write-Host "  View logs:       Get-Content $logsDir\service-stdout.log" -ForegroundColor White
} else {
    Write-Host "Service failed to start. Status: $($service.Status)" -ForegroundColor Red
    Write-Host "Check logs at: $logsDir" -ForegroundColor Yellow
    exit 1
}