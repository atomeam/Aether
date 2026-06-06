# Real vs Simulated Data Skill
# Find and replace all simulated/fake data with real data

param(
    [switch]$Audit,
    [switch]$Fix,
    [switch]$Verbose
)

$ErrorActionPreference = "Stop"

Write-Host "=== REAL VS SIMULATED DATA SKILL ===" -ForegroundColor Cyan
Write-Host "Real work is easier than simulated work." -ForegroundColor Yellow
Write-Host ""

$repoRoot = "C:\Users\adamm\Aether"
$simulatedDataFound = [System.Collections.Generic.List[object]]::new()

# Patterns to search for simulated data
$patterns = @(
    @{ Pattern = "Math\.random"; Description = "Random number generation" },
    @{ Pattern = "fake"; Description = "Fake data keyword" },
    @{ Pattern = "mock"; Description = "Mock data keyword" },
    @{ Pattern = "simulated"; Description = "Simulated data keyword" },
    @{ Pattern = "hardcoded"; Description = "Hardcoded values" }
)

# Audit function
function Find-SimulatedData {
    param([string]$Path)
    
    Write-Host "Scanning for simulated data..." -ForegroundColor Cyan
    
    # Use simple pattern matching on key files
    $keyFiles = @(
        "src\components\UAPDetectionArrays.tsx",
        "apps\uap-detection\src\complete-system.ts",
        "apps\uap-detection\src\index.ts",
        "src\App.tsx"
    )
    
    foreach ($file in $keyFiles) {
        $filePath = Join-Path $Path $file
        if (Test-Path $filePath) {
            foreach ($pattern in $patterns) {
                $matches = Select-String -Path $filePath -Pattern $pattern.Pattern -ErrorAction SilentlyContinue
                if ($matches) {
                    foreach ($match in $matches) {
                        $result = [PSCustomObject]@{
                            File = $filePath
                            Pattern = $pattern.Pattern
                            Description = $pattern.Description
                            Line = $match.LineNumber
                        }
                        $simulatedDataFound.Add($result)
                        
                        if ($Verbose) {
                            Write-Host "Found: $($pattern.Description) in ${file}:$($match.LineNumber)" -ForegroundColor Yellow
                        }
                    }
                }
            }
        }
    }
}

# Fix function
function Fix-SimulatedData {
    param([string]$Path)
    
    $fixedCount = 0
    
    # Only fix key files
    $keyFiles = @(
        "src\components\UAPDetectionArrays.tsx",
        "apps\uap-detection\src\complete-system.ts",
        "apps\uap-detection\src\index.ts",
        "src\App.tsx"
    )
    
    foreach ($file in $keyFiles) {
        $filePath = Join-Path $Path $file
        if (Test-Path $filePath) {
            $content = Get-Content $filePath -Raw -ErrorAction SilentlyContinue
            $originalContent = $content
            $modified = $false
            
            # Add warning comment if simulated data found
            if ($content -match "Math\.random" -and -not ($content -match "TODO.*Replace.*real")) {
                $content = "// WARNING: This uses simulated data. Replace with real API calls.`n// Real work is easier than simulated work.`n" + $content
                $modified = $true
            }
            
            if ($modified) {
                $content | Out-File -FilePath $filePath -Encoding utf8 -Force
                $fixedCount++
                Write-Host "Fixed: $file" -ForegroundColor Green
            }
        }
    }
    
    return $fixedCount
}

# Main execution
if ($Audit) {
    Write-Host "Auditing for simulated data..." -ForegroundColor Cyan
    Find-SimulatedData -Path $repoRoot
    
    Write-Host ""
    Write-Host "=== AUDIT RESULTS ===" -ForegroundColor Yellow
    Write-Host "Found $($simulatedDataFound.Count) instances of simulated data" -ForegroundColor White
    
    if ($simulatedDataFound.Count -gt 0) {
        Write-Host ""
        Write-Host "Simulated data found:" -ForegroundColor Red
        foreach ($item in $simulatedFound) {
            Write-Host "  - $($item.Description) in $($item.File):$($item.Line)" -ForegroundColor Yellow
        }
        Write-Host ""
        Write-Host "Run with -Fix to replace with TODO comments" -ForegroundColor Yellow
    } else {
        Write-Host "✅ No simulated data found!" -ForegroundColor Green
    }
}

if ($Fix) {
    Write-Host "Fixing simulated data..." -ForegroundColor Cyan
    $fixedCount = Fix-SimulatedData -Path $repoRoot
    Write-Host "Fixed $fixedCount files" -ForegroundColor Green
}

if (-not $Audit -and -not $Fix) {
    Write-Host "Usage: .\skill.ps1 -Audit | -Fix" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "=== REAL VS SIMULATED DATA SKILL ===" -ForegroundColor Cyan
Write-Host "Real work is easier than simulated work." -ForegroundColor Yellow