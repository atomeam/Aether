# Frontend Sync Guard
# Automatically ensures frontend UI matches backend API capabilities

param(
    [switch]$AutoFix = $true,
    [switch]$Verbose
)

$ErrorActionPreference = "Stop"

Write-Host "=== FRONTEND SYNC GUARD ===" -ForegroundColor Cyan
Write-Host "AutoFix: $AutoFix" -ForegroundColor Yellow
Write-Host ""

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$frontendSyncScript = "$scriptDir\..\frontend-sync\skill.ps1"
$repoRoot = Split-Path -Parent $scriptDir

# Detect backend changes
function Get-BackendChanges {
    $changedFiles = git diff --name-only HEAD 2>$null
    if ($LASTEXITCODE -ne 0) {
        # Not a git repo or no changes
        return @()
    }
    
    $backendChanges = $changedFiles | Where-Object { 
        $_ -match '^apps/.*\.ts$' -or $_ -match '^packages/.*\.ts$'
    }
    
    return $backendChanges
}

# Check if frontend-sync skill exists
if (-not (Test-Path $frontendSyncScript)) {
    Write-Host "❌ Frontend sync skill not found: $frontendSyncScript" -ForegroundColor Red
    exit 1
}

# Get backend changes
$backendChanges = Get-BackendChanges

if ($backendChanges.Count -eq 0) {
    Write-Host "✅ No backend changes detected. Frontend sync not required." -ForegroundColor Green
    exit 0
}

Write-Host "🔍 Backend changes detected:" -ForegroundColor Yellow
foreach ($change in $backendChanges) {
    Write-Host "  - $change" -ForegroundColor White
}
Write-Host ""

# Run frontend sync
Write-Host "Running frontend sync..." -ForegroundColor Cyan

$params = @{}
if ($AutoFix) { $params['AutoFix'] = $true }
if ($Verbose) { $params['Verbose'] = $true }

try {
    & $frontendSyncScript @params
    $exitCode = $LASTEXITCODE
    
    if ($exitCode -eq 0) {
        Write-Host ""
        Write-Host "✅ Frontend is in sync with backend" -ForegroundColor Green
        exit 0
    } elseif ($exitCode -eq 2) {
        Write-Host ""
        Write-Host "⚠️  Frontend sync completed with warnings" -ForegroundColor Yellow
        exit 2
    } else {
        Write-Host ""
        Write-Host "❌ Frontend sync failed" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host ""
    Write-Host "❌ Error running frontend sync: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}