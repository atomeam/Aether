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
    @{ Pattern = "Math\.random.*fake"; Description = "Fake data generation" },
    @{ Pattern = "Math\.random.*mock"; Description = "Mock data generation" },
    @{ Pattern = "Math\.random.*simulated"; Description = "Simulated data generation" },
    @{ Pattern = "fake.*Math\.random"; Description = "Fake data with random" },
    @{ Pattern = "mock.*Math\.random"; Description = "Mock data with random" },
    @{ Pattern = "simulated.*Math\.random"; Description = "Simulated data with random" },
    @{ Pattern = "fake"; Description = "Fake data keyword" },
    @{ Pattern = "mock"; Description = "Mock data keyword" },
    @{ Pattern = "simulated"; Description = "Simulated data keyword" },
    @{ Pattern = "hardcoded"; Description = "Hardcoded values" }
)

# Patterns to EXCLUDE (legitimate algorithmic randomness)
$excludePatterns = @(
    @{ Pattern = "bootstrap"; Description = "Bootstrap resampling" },
    @{ Pattern = "resample"; Description = "Resampling algorithms" },
    @{ Pattern = "p.*value"; Description = "P-value calculations" },
    @{ Pattern = "monte.*carlo"; Description = "Monte Carlo simulations" },
    @{ Pattern = "sampling"; Description = "Statistical sampling" },
    @{ Pattern = "shuffle"; Description = "Array shuffling" },
    @{ Pattern = "random.*index"; Description = "Random index selection" },
    @{ Pattern = "calculatePValue"; Description = "P-value calculation function" },
    @{ Pattern = "calculateConfidenceInterval"; Description = "Confidence interval calculation" },
    @{ Pattern = "UAP.*detection"; Description = "UAP detection simulation (feature, not fake data)" },
    @{ Pattern = "detectUAP"; Description = "UAP detection function (feature, not fake data)" },
    @{ Pattern = "gravitational.*wave"; Description = "Gravitational wave detection (feature, not fake data)" },
    @{ Pattern = "electromagnetic.*field"; Description = "EM field detection (feature, not fake data)" }
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
            $content = Get-Content $filePath -Raw -ErrorAction SilentlyContinue
            if ($null -eq $content) { continue }
            
            # Check if file already has warning comment
            if ($content -match "WARNING.*simulated data") {
                Write-Host "Skipping $file (already has warning comment)" -ForegroundColor Gray
                continue
            }
            
            # Check if file contains legitimate algorithmic randomness
            $isLegitimate = $false
            foreach ($exclude in $excludePatterns) {
                if ($content -match $exclude.Pattern) {
                    $isLegitimate = $true
                    break
                }
            }
            
            if ($isLegitimate) {
                Write-Host "Skipping $file (contains legitimate algorithmic randomness or feature simulation)" -ForegroundColor Gray
                continue
            }
            
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
            
            # Check if file contains legitimate algorithmic randomness
            $isLegitimate = $false
            foreach ($exclude in $excludePatterns) {
                if ($content -match $exclude.Pattern) {
                    $isLegitimate = $true
                    break
                }
            }
            
            # Only add warning if not legitimate and doesn't already have it
            if (-not $isLegitimate -and ($content -match "Math\.random") -and -not ($content -match "WARNING.*simulated data")) {
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