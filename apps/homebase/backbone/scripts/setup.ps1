# Automation Consolidation v2 - Setup Script
# Run this script to set up the orchestrator environment

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Automation Consolidation v2 - Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
Write-Host "Checking Node.js installation..." -ForegroundColor Yellow
$nodeVersion = node --version 2>$null
if ($nodeVersion) {
    Write-Host "Node.js is installed: $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "Node.js is not installed. Please install Node.js 18+ from https://nodejs.org/" -ForegroundColor Red
    exit 1
}

# Check if npm is installed
Write-Host "Checking npm installation..." -ForegroundColor Yellow
$npmVersion = npm --version 2>$null
if ($npmVersion) {
    Write-Host "npm is installed: $npmVersion" -ForegroundColor Green
} else {
    Write-Host "npm is not installed. Please install Node.js which includes npm." -ForegroundColor Red
    exit 1
}

# Install dependencies
Write-Host "Installing dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -eq 0) {
    Write-Host "Dependencies installed successfully" -ForegroundColor Green
} else {
    Write-Host "Failed to install dependencies" -ForegroundColor Red
    exit 1
}

# Create .env file if it doesn't exist
Write-Host "Setting up environment configuration..." -ForegroundColor Yellow
if (-not (Test-Path "backbone\config\.env")) {
    Copy-Item "backbone\config\.env.example" "backbone\config\.env"
    Write-Host "Created backbone\config\.env from .env.example" -ForegroundColor Green
    Write-Host "Please edit backbone\config\.env with your configuration" -ForegroundColor Yellow
} else {
    Write-Host "backbone\config\.env already exists" -ForegroundColor Gray
}

# Create necessary directories
Write-Host "Creating necessary directories..." -ForegroundColor Yellow
$directories = @("runs", "backbone\logs")
foreach ($dir in $directories) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        Write-Host "Created directory: $dir" -ForegroundColor Green
    } else {
        Write-Host "Directory already exists: $dir" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Setup completed successfully!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Edit backbone\config\.env with your configuration" -ForegroundColor White
Write-Host "2. Edit backbone\config\config.yaml to enable workflows" -ForegroundColor White
Write-Host "3. Run: .\backbone\scripts\start.ps1" -ForegroundColor White
Write-Host "4. Visit: http://localhost:3000/health" -ForegroundColor White
Write-Host ""
