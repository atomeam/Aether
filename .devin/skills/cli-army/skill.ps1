# CLI Army Skill - Simple Batch Execution
# Execute multiple CLI commands in parallel using PowerShell jobs

param(
    [switch]$Batch,
    [string[]]$Commands = @()
)

$ErrorActionPreference = "Stop"
$repoRoot = "C:\Users\adamm\Aether"

function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) {
        Write-Output $args
    }
    $host.UI.RawUI.ForegroundColor = $fc
}

if ($Batch -and $Commands.Count -gt 0) {
    Write-ColorOutput Cyan "=== CLI ARMY BATCH EXECUTION ==="
    Write-ColorOutput Yellow "Commands: $($Commands.Count)"
    Write-ColorOutput Yellow "Repo: $repoRoot"
    
    $results = @()
    $jobs = @()
    
    foreach ($cmd in $Commands) {
        $job = Start-Job -ScriptBlock {
            param($command, $repoRoot)
            Set-Location $repoRoot
            $output = Invoke-Expression $command 2>&1
            @{
                success = ($LASTEXITCODE -eq 0)
                output = $output
                command = $command
                timestamp = Get-Date
            }
        } -ArgumentList $cmd, $repoRoot
        
        $jobs += @{ job = $job; command = $cmd }
    }
    
    foreach ($jobInfo in $jobs) {
        $result = Receive-Job -Job $jobInfo.job -Wait
        $results += $result
        Remove-Job -Job $jobInfo.job
        
        if ($result.success) {
            Write-ColorOutput Green "✓ $($jobInfo.command)"
        } else {
            Write-ColorOutput Red "✗ $($jobInfo.command)"
        }
    }
    
    Write-ColorOutput Green "=== BATCH COMPLETE ==="
    Write-ColorOutput Cyan "Successful: $($results.Where({$_.success}).Count)"
    Write-ColorOutput Cyan "Failed: $($results.Where({-not $_.success}).Count)"
    
    exit 0
}

Write-ColorOutput Cyan "=== CLI ARMY SKILL ==="
Write-ColorOutput Yellow "Usage:"
Write-Output '  .\skill.ps1 -Batch -Commands "npm run build","npm run test","git status"'
exit 1