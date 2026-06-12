# Run all tests across the monorepo
# Usage:
#   .\test-all.ps1              # Run all tests
#   .\test-all.ps1 -Filter backend  # Run tests for a specific workspace
#   .\test-all.ps1 -Filter frontend # Run tests for frontend only
#   .\test-all.ps1 -Verbose     # Show detailed test output

param(
  [Parameter(Mandatory = $false)]
  [string]$Filter,

  [Parameter(Mandatory = $false)]
  [switch]$VerboseOutput
)

$ErrorActionPreference = "Stop"
$ProjectRoot = "C:\Users\adamm\Aether"

# Validate project root exists
if (-not (Test-Path $ProjectRoot)) {
  Write-Host "ERROR: Project root not found at $ProjectRoot" -ForegroundColor Red
  exit 1
}

# Validate turbo is available
$turboPath = Get-Command npx -ErrorAction SilentlyContinue
if (-not $turboPath) {
  Write-Host "ERROR: 'npx' not found. Ensure Node.js is installed and on PATH." -ForegroundColor Red
  exit 1
}

Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "  AETHER TEST RUNNER" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""

$startTime = Get-Date
Write-Host "Started at: $($startTime.ToString('yyyy-MM-dd HH:mm:ss'))" -ForegroundColor DarkGray
Write-Host "Project:    $ProjectRoot" -ForegroundColor DarkGray
if ($Filter) {
  Write-Host "Filter:     $Filter" -ForegroundColor DarkGray
}
Write-Host ""

Push-Location $ProjectRoot
try {
  # Build the turbo command
  $turboArgs = @("turbo", "run", "test")
  if ($Filter) {
    $turboArgs += "--filter=$Filter"
  }
  if (-not $VerboseOutput) {
    $turboArgs += "--output-logs=errors-only"
  }

  Write-Host "Running: npx $($turboArgs -join ' ')" -ForegroundColor DarkGray
  Write-Host ""
  Write-Host "Running all tests..." -ForegroundColor Green

  $process = Start-Process -FilePath "npx" -ArgumentList $turboArgs[1..($turboArgs.Length - 1)] `
    -NoNewWindow -Wait -PassThru -WorkingDirectory $ProjectRoot

  $exitCode = $process.ExitCode

  Write-Host ""

  if ($exitCode -eq 0) {
    $endTime = Get-Date
    $elapsed = $endTime - $startTime
    Write-Host "===========================================" -ForegroundColor Green
    Write-Host "  ALL TESTS PASSED" -ForegroundColor Green
    Write-Host "  Duration: $([math]::Round($elapsed.TotalSeconds, 1))s" -ForegroundColor Green
    Write-Host "===========================================" -ForegroundColor Green
  }
  else {
    $endTime = Get-Date
    $elapsed = $endTime - $startTime
    Write-Host "===========================================" -ForegroundColor Red
    Write-Host "  TESTS FAILED (exit code: $exitCode)" -ForegroundColor Red
    Write-Host "  Duration: $([math]::Round($elapsed.TotalSeconds, 1))s" -ForegroundColor Red
    Write-Host "===========================================" -ForegroundColor Red
  }

  exit $exitCode
}
catch {
  $endTime = Get-Date
  $elapsed = $endTime - $startTime
  Write-Host ""
  Write-Host "===========================================" -ForegroundColor Red
  Write-Host "  TEST EXECUTION ERROR" -ForegroundColor Red
  Write-Host "  $($_.Exception.Message)" -ForegroundColor Red
  Write-Host "  Duration: $([math]::Round($elapsed.TotalSeconds, 1))s" -ForegroundColor Red
  Write-Host "===========================================" -ForegroundColor Red
  exit 1
}
finally {
  Pop-Location
}