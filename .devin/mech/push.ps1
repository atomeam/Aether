param([Parameter(Mandatory)][string]$ApiBase, [Parameter(Mandatory)][string]$Token)
# Pushes local mech JSON to the Cockpit API. Run after doctor/guard/telemetry.
$ErrorActionPreference = "Stop"

function Push($key,$file){
    if (-not (Test-Path $file)) { 
        Write-Host "skipped $key (file not found)" -ForegroundColor Yellow
        return 
    }
    $val = Get-Content $file -Raw
    try {
        $body = @{ key=$key; value=($val | ConvertFrom-Json) } | ConvertTo-Json -Depth 25
        $url = "$ApiBase/api/kv/ingest"  # Use KV ingest endpoint for mech state
        Invoke-RestMethod -Method Post -Uri $url -Headers @{ Authorization = "Bearer $Token" } `
            -ContentType "application/json" -Body $body
        Write-Host "pushed $key" -ForegroundColor Green
    } catch {
        Write-Host "failed to push $key: $_" -ForegroundColor Red
    }
}

Push "doctor"           ".devin/mech/doctor.json"
Push "guard"            ".devin/mech/guard.json"
Push "telemetry_latest" ".devin/mech/telemetry_latest.json"
Push "eval_scorecard"   ".devin/mech/eval_scorecard.json"