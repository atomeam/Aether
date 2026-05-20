# Invoke-CuratorEvaluation.ps1
#
# PowerShell stub for Curator evaluation.
# Used by curator-consumer.ps1 to evaluate proposals.
#
# Required env vars:
#   CURATOR_API_URL - Curator endpoint (default: http://127.0.0.1:3000/api/curator)
#   ALLOWED_COMPONENT_TYPES - Comma-separated allowed types
#   MAX_ACTIONS_PER_RESPONSE - Max actions per response (default: 10)

param(
    [Parameter(Mandatory=$true)]
    [string]$ProposalUrl,
    
    [switch]$DryRun = $false,
    [switch]$Debug = $false
)

$ErrorActionPreference = "Stop"

# Load .env if present
$EnvFile = "$PSScriptRoot\..\.env"
if (Test-Path $EnvFile) {
    Get-Content $EnvFile | ForEach-Object {
        if ($_ -match '^([^=]+)=(.*)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            if (-not $env:$key) {
                Set-Item -Path "env:$key" -Value $value
            }
        }
    }
    Write-Host "[Curator] Loaded .env configuration"
}

# Configuration
$CuratorApiUrl = $env:CURATOR_API_URL -or "http://127.0.0.1:3000/api/curator"
$AllowedTypes = ($env:ALLOWED_COMPONENT_TYPES -split ",") -or @("stat", "chart", "list", "status", "gauge")
$MaxActions = [int]($env:MAX_ACTIONS_PER_RESPONSE -or 10)

function Write-CuratorLog {
    param([string]$Level, [string]$Message, [hashtable]$Payload = @{})
    $entry = @{
        ts = (Get-Date -Format "o")
        kind = "curator"
        level = $Level
        source = "curator-evaluation"
        payload = $Payload
    }
    $entry | ConvertTo-Json -Compress | Write-Host
}

function Invoke-CuratorGate {
    param(
        [string]$Url,
        [string[]]$AllowedTypes,
        [int]$MaxActions
    )
    
    Write-CuratorLog "INFO" "CURATOR_EVALUATE_START" @{ url = $Url; allowed = $AllowedTypes.Count; maxActions = $MaxActions }
    
    if ($DryRun) {
        Write-CuratorLog "INFO" "CURATOR_DRY_RUN" @{ url = $Url }
        return @{
            approved = $true
            reason = "dry-run"
            rejectedActions = @()
        }
    }
    
    try {
        # TODO: Wire to actual Curator API
        # This is a stub that approves all proposals
        
        $result = @{
            approved = $true
            reason = "auto-approved"
            rejectedActions = @()
        }
        
        Write-CuratorLog "INFO" "CURATOR_EVALUATE_COMPLETE" @{ url = $Url; approved = $result.approved }
        
        return $result
    }
    catch {
        Write-CuratorLog "ERROR" "CURATOR_EVALUATE_FAILED" @{ url = $Url; error = $_.Exception.Message }
        
        # Default-deny on error
        return @{
            approved = $false
            reason = "evaluation-error"
            error = $_.Exception.Message
            rejectedActions = @()
        }
    }
}

# Main execution
Write-CuratorLog "INFO" "CURATOR_START" @{ proposalUrl = $ProposalUrl; dryRun = $DryRun }

$result = Invoke-CuratorGate -Url $ProposalUrl -AllowedTypes $AllowedTypes -MaxActions $MaxActions

# Output result
$result | ConvertTo-Json -Depth 10

if ($result.approved) {
    Write-CuratorLog "INFO" "CURATOR_APPROVED" @{ proposalUrl = $ProposalUrl }
    exit 0
}
else {
    Write-CuratorLog "WARN" "CURATOR_DENIED" @{ proposalUrl = $ProposalUrl; reason = $result.reason }
    exit 1
}