# Start development services
# Usage:
#   .\dev.ps1              # Start all services
#   .\dev.ps1 -Backend     # Start backend only
#   .\dev.ps1 -Frontend    # Start frontend only
#   .\dev.ps1 -Kill        # Kill services on ports before starting

param(
  [Parameter(Mandatory = $false)]
  [switch]$Backend,

  [Parameter(Mandatory = $false)]
  [switch]$Frontend,

  [Parameter(Mandatory = $false)]
  [switch]$KillExisting
)

$ErrorActionPreference = "Stop"
$ProjectRoot = "C:\Users\adamm\Aether"

# Validate project root exists
if (-not (Test-Path $ProjectRoot)) {
  Write-Host "ERROR: Project root not found at $ProjectRoot" -ForegroundColor Red
  exit 1
}

# If no specific service flag, start all
if (-not $Backend -and -not $Frontend) {
  $Backend = $true
  $Frontend = $true
}

Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "  AETHER DEV SERVER" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""

# Check and optionally kill existing processes on ports
$ports = @()
if ($Backend) { $ports += @{ Name = "Backend"; Port = 3001 } }
if ($Frontend) { $ports += @{ Name = "Frontend"; Port = 5173 } }

foreach ($svc in $ports) {
  $connections = Get-NetTCPConnection -LocalPort $svc.Port -ErrorAction SilentlyContinue
  if ($connections) {
    if ($KillExisting) {
      Write-Host "Killing existing process on port $($svc.Port)..." -ForegroundColor Yellow
      foreach ($conn in $connections) {
        $proc = Get-Process -Id $conn.OwningProcess -ErrorAction SilentlyContinue
        if ($proc) {
          Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
        }
      }
      Start-Sleep -Seconds 1
    }
    else {
      Write-Host "WARNING: Port $($svc.Port) ($($svc.Name)) is already in use." -ForegroundColor Yellow
      Write-Host "  Use -KillExisting to stop it, or manually check:" -ForegroundColor DarkGray
      Write-Host "  Get-NetTCPConnection -LocalPort $($svc.Port)" -ForegroundColor DarkGray
    }
  }
}

Write-Host ""

# Start backend
if ($Backend) {
  Write-Host "Starting backend on port 3001..." -ForegroundColor Yellow
  Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$ProjectRoot'; npm run dev:backend"
}

# Start frontend
if ($Frontend) {
  Write-Host "Starting frontend on port 5173..." -ForegroundColor Yellow
  Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$ProjectRoot'; npm run dev:frontend"
}

Write-Host ""
Write-Host "Services starting in new windows..." -ForegroundColor Green
Write-Host ""

if ($Backend) {
  Write-Host "  Backend:  http://localhost:3001" -ForegroundColor Cyan
}
if ($Frontend) {
  Write-Host "  Frontend: http://localhost:5173" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "Tip: Use .\status.ps1 to check if services are running" -ForegroundColor DarkGray
Write-Host "Tip: Use .\test-all.ps1 to run tests" -ForegroundColor DarkGray