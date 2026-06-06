# .env Validation Skill
# Validates .env file for duplicates, empty values, invalid values, and missing required variables

param(
    [switch]$Audit,
    [switch]$Fix
)

$repoRoot = "C:\Users\adamm\Aether"
$envFile = "$repoRoot\.env"

Write-Host "=== .ENV VALIDATION SKILL ===" -ForegroundColor Cyan
Write-Host "Validating .env file for issues" -ForegroundColor Yellow
Write-Host ""

$issues = @()
$fixes = @()

# Required variables
$requiredVars = @(
    "GITHUB_TOKEN",
    "CLOUDFLARE_API_TOKEN",
    "CLOUDFLARE_ACCOUNT_ID"
)

# Variables that should not be empty
$nonEmptyVars = @(
    "GITHUB_TOKEN",
    "CLOUDFLARE_API_TOKEN",
    "CLOUDFLARE_ACCOUNT_ID"
)

# Variables that should not be placeholder values
$placeholderPatterns = @(
    "YOUR_TEST_KEY_HERE"
)

# Variables that are allowed to be placeholders
$allowedPlaceholders = @(
    "STRIPE_API_KEY",
    "STRIPE_WEBHOOK_SECRET",
    "STRIPE_PRICE_ID",
    "STRIPE_SUCCESS_URL",
    "STRIPE_CANCEL_URL",
    "HUBSPOT_API_KEY",
    "SENTRY_AUTH_TOKEN",
    "GEMINI_API_KEY"
)

if (-not (Test-Path $envFile)) {
    Write-Host "❌ .env file not found" -ForegroundColor Red
    exit 1
}

$envContent = Get-Content $envFile
$envVars = @{}
$duplicates = @()
$emptyVars = @()
$placeholderVars = @()
$missingVars = @()

# Variables that are allowed to have duplicates (e.g., test vs production)
$allowedDuplicates = @(
    "STRIPE_API_KEY"
)

# Parse .env file
foreach ($line in $envContent) {
    # Skip comments and empty lines
    if ($line -match "^\s*#" -or $line -match "^\s*$") {
        continue
    }
    
    if ($line -match "^([^=]+)=(.*)$") {
        $varName = $matches[1]
        $varValue = $matches[2]
        
        # Check for duplicates (unless allowed)
        if ($envVars.ContainsKey($varName) -and $allowedDuplicates -notcontains $varName) {
            $duplicates += $varName
        } else {
            $envVars[$varName] = $varValue
        }
        
        # Check for empty values
        if ($nonEmptyVars -contains $varName -and [string]::IsNullOrWhiteSpace($varValue)) {
            $emptyVars += $varName
        }
        
        # Check for placeholder values
        if ($allowedPlaceholders -notcontains $varName) {
            foreach ($pattern in $placeholderPatterns) {
                if ($varValue -match $pattern) {
                    $placeholderVars += $varName
                    break
                }
            }
        }
    }
}

# Check for missing required variables
foreach ($var in $requiredVars) {
    if (-not $envVars.ContainsKey($var)) {
        $missingVars += $var
    }
}

# Report issues
if ($duplicates.Count -gt 0) {
    $issues += "Duplicate variables: $($duplicates -join ', ')"
    Write-Host "❌ Duplicate variables: $($duplicates -join ', ')" -ForegroundColor Red
}

if ($emptyVars.Count -gt 0) {
    $issues += "Empty variables: $($emptyVars -join ', ')"
    Write-Host "❌ Empty variables: $($emptyVars -join ', ')" -ForegroundColor Red
}

if ($placeholderVars.Count -gt 0) {
    $issues += "Placeholder values: $($placeholderVars -join ', ')"
    Write-Host "❌ Placeholder values: $($placeholderVars -join ', ')" -ForegroundColor Red
}

if ($missingVars.Count -gt 0) {
    $issues += "Missing required variables: $($missingVars -join ', ')"
    Write-Host "❌ Missing required variables: $($missingVars -join ', ')" -ForegroundColor Red
}

if ($issues.Count -eq 0) {
    Write-Host "✅ .env file is valid" -ForegroundColor Green
    exit 0
}

if ($Fix) {
    Write-Host ""
    Write-Host "Fixing issues..." -ForegroundColor Yellow
    
    # Fix duplicates by keeping first occurrence
    if ($duplicates.Count -gt 0) {
        $seenVars = @{}
        $newContent = @()
        
        foreach ($line in $envContent) {
            if ($line -match "^([^=]+)=") {
                $varName = $matches[1]
                if ($seenVars.ContainsKey($varName)) {
                    $fixes += "Removed duplicate: $varName"
                    continue
                }
                $seenVars[$varName] = $true
            }
            $newContent += $line
        }
        
        $newContent | Out-File -FilePath $envFile -Encoding UTF8
        Write-Host "✅ Fixed duplicates" -ForegroundColor Green
    }
    
    # Fix empty variables by adding placeholder
    if ($emptyVars.Count -gt 0) {
        $newContent = @()
        foreach ($line in $envContent) {
            if ($line -match "^([^=]+)=\s*$") {
                $varName = $matches[1]
                $line = "$varName=PLACEHOLDER_VALUE"
                $fixes += "Added placeholder for: $varName"
            }
            $newContent += $line
        }
        
        $newContent | Out-File -FilePath $envFile -Encoding UTF8
        Write-Host "✅ Fixed empty variables" -ForegroundColor Green
    }
    
    Write-Host "✅ Fixes applied: $($fixes.Count)" -ForegroundColor Green
    exit 0
}

Write-Host ""
Write-Host "=== VALIDATION COMPLETE ===" -ForegroundColor Cyan
Write-Host "Found $($issues.Count) issues" -ForegroundColor Yellow
exit 1