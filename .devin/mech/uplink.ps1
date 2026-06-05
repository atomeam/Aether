param(
  [Parameter(Mandatory)][string]$IngestUrl,   # https://devin.a-to-mind.com (base URL)
  [Parameter(Mandatory)][string]$Token,
  [int]$IntervalSec = 2
)
# Streams Devin's REAL state to the cockpit. No synthetic data:
# if a source file is absent, we send {present:false} so the HUD shows an empty state.
$ErrorActionPreference = "Continue"
$ws   = ".devin/memory/WORKING_SET.md"
$sess = ".devin/memory/SESSION.md"
$test = ".devin/mech/last-test-output.txt"   # AgentCoder loop writes real test output here
$sub  = ".devin/mech/subagent-status.json"   # council/verifier writes real status here

function ReadOrNull($p){ if (Test-Path $p) { (Get-Content $p -Raw) } else { $null } }
function Send($evt){
  try { 
    $url = "$IngestUrl/api/telemetry/ingest"  # Use telemetry ingest endpoint
    Invoke-RestMethod -Method Post -Uri $url -Headers @{ Authorization = "Bearer $Token" } `
        -ContentType "application/json" -Body $evt | Out-Null 
  }
  catch { Write-Host "uplink send failed: $($_.Exception.Message)" -ForegroundColor Yellow }
}

Write-Host "Uplink streaming REAL state every ${IntervalSec}s. Ctrl+C to stop." -ForegroundColor Cyan
Write-Host "Ingest URL: $IngestUrl/api/telemetry/ingest" -ForegroundColor Cyan
$lastHash = ""
while ($true) {
  $branch = (& git rev-parse --abbrev-ref HEAD 2>$null)
  $payload = @{
    ts          = [DateTime]::UtcNow.ToString("o")
    branch      = $branch
    workingSet  = ReadOrNull $ws
    session     = ReadOrNull $sess
    testOutput  = ReadOrNull $test
    subagents   = if (Test-Path $sub) { (Get-Content $sub -Raw | ConvertFrom-Json) } else { $null }
  }
  $json = $payload | ConvertTo-Json -Depth 25 -Compress
  $hash = [System.BitConverter]::ToString((New-Object Security.Cryptography.SHA1Managed).ComputeHash([Text.Encoding]::UTF8.GetBytes($json)))
  if ($hash -ne $lastHash) { Send $json; $lastHash = $hash; Write-Host "." -NoNewline -ForegroundColor Green }  # send only on real change
  Start-Sleep -Seconds $IntervalSec
}