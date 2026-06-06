# Autonomous Improvement Daemon
# Runs continuously to organize, refine, and improve

param(
    [switch]$Continuous,
    [switch]$Once
)

$repoRoot = "C:\Users\adamm\Aether"
$victusUrl = "http://localhost:8080"
$logFile = "$repoRoot\autonomous-improvement.log"

# Read GitHub token from .env file if available
if (Test-Path "$repoRoot\.env") {
    $envContent = Get-Content "$repoRoot\.env" | Where-Object { $_ -match "GITHUB_TOKEN" }
    if ($envContent) {
        $env:GITHUB_TOKEN = ($envContent -split "=")[1].Trim()
    }
}

Write-Host "=== AUTONOMOUS IMPROVEMENT DAEMON ===" -ForegroundColor Cyan
Write-Host "Constantly organize, refine, and improve." -ForegroundColor Yellow
Write-Host ""

function Log-Message {
    param($message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "[$timestamp] $message" | Out-File -FilePath $logFile -Append
    Write-Host "[$timestamp] $message" -ForegroundColor Gray
}

function Scan-Improvements {
    Log-Message "Scanning for improvements..."
    
    # Run .env validation
    $envValidationResult = & "$repoRoot\.devin\skills\env-validation\skill.ps1" -Audit 2>&1
    if ($LASTEXITCODE -ne 0) {
        Log-Message "Environment validation issues found"
        # Try to fix automatically
        & "$repoRoot\.devin\skills\env-validation\skill.ps1" -Fix 2>&1 | Out-Null
        Log-Message "Attempted to fix environment issues"
        return $true
    }
    
    # Run data integrity check
    $dataIntegrityResult = & "$repoRoot\.devin\skills\real-vs-simulated\skill.ps1" -Audit 2>&1
    if ($LASTEXITCODE -ne 0) {
        Log-Message "Data integrity issues found"
        return $true
    }
    
    # Check for broken components in frontend
    $brokenComponents = @("__scheduled.tsx", "Apidetect.tsx", "Apistatus.tsx", "Cron5min.tsx", "Health.tsx", "Jsonversion.tsx", "Verify.tsx")
    foreach ($component in $brokenComponents) {
        $componentPath = "$repoRoot\apps\frontend\src\components\$component"
        if (Test-Path $componentPath) {
            Log-Message "Broken component: $component"
            Remove-Item $componentPath -Force
            Log-Message "Removed $component"
        }
    }
    
    Log-Message "Scan complete"
    return $false
}

function Deploy-UAPWorker {
    Log-Message "Deploying UAP worker..."
    
    Push-Location "$repoRoot\apps\uap-detection"
    $deployResult = wrangler deploy 2>&1
    Pop-Location
    
    if ($LASTEXITCODE -eq 0) {
        Log-Message "✅ UAP worker deployed"
        return $true
    } else {
        Log-Message "❌ UAP worker deployment failed"
        return $false
    }
}

function Update-PR {
    Log-Message "Updating PR..."
    
    $token = $env:GITHUB_TOKEN
    if (-not $token) {
        Log-Message "❌ GITHUB_TOKEN not set"
        return
    }
    
    $currentBody = (Invoke-WebRequest -Uri "https://api.github.com/repos/atomeam/Aether/pulls/90" -Headers @{ Authorization = "token $token"; Accept = "application/vnd.github.v3+json" } | ConvertFrom-Json).body
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $newBody = $currentBody + "`n`n### Autonomous Update [$timestamp]`n`nSystem running autonomously. Constantly organizing, refining, and improving."
    $json = @{ body = $newBody } | ConvertTo-Json
    Invoke-WebRequest -Uri "https://api.github.com/repos/atomeam/Aether/pulls/90" -Method PATCH -Headers @{ Authorization = "token $token"; Accept = "application/vnd.github.v3+json" } -Body $json -ContentType "application/json" | Out-Null
    
    Log-Message "✅ PR updated"
}

function Run-ImprovementCycle {
    Log-Message "=== Starting improvement cycle ==="
    
    # Scan
    $issuesFound = Scan-Improvements
    
    # Deploy if issues were fixed
    if ($issuesFound) {
        Deploy-UAPWorker
        Update-PR
    } else {
        # Even if no issues, deploy latest changes
        Deploy-UAPWorker
        Update-PR
    }
    
    Log-Message "=== Cycle complete ==="
}

# Main loop
if ($Continuous) {
    Write-Host "Starting autonomous daemon..." -ForegroundColor Cyan
    Write-Host "Press Ctrl+C to stop" -ForegroundColor Yellow
    Write-Host ""
    
    while ($true) {
        try {
            Run-ImprovementCycle
            Write-Host "Waiting 5 minutes..." -ForegroundColor Gray
            Start-Sleep -Seconds 300
        } catch {
            Log-Message "❌ Error in cycle: $_"
            Start-Sleep -Seconds 60
        }
    }
}

if ($Once) {
    Run-ImprovementCycle
}

if (-not $Continuous -and -not $Once) {
    Write-Host "Usage: .\daemon.ps1 -Continuous | -Once" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "=== AUTONOMOUS IMPROVEMENT DAEMON COMPLETE ===" -ForegroundColor Cyan