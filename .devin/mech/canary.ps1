param(
  [Parameter(Mandatory)][string]$HealthUrl,   # canary health endpoint
  [int]$Samples = 20, [int]$IntervalSec = 3, [double]$MaxErrorRate = 0.05
)
# Bold deploy, safe landing. Deploy to canary, watch error rate, promote or revert.
$ErrorActionPreference = "Stop"
function Say($m,$c="Cyan"){ Write-Host $m -ForegroundColor $c }

Say "Deploying to CANARY (no prod traffic shifted yet)..."
& cmd /c "npx wrangler deploy --env canary"   # uses your existing wrangler env; never edited by Devin
if ($LASTEXITCODE -ne 0) { Say "Canary deploy failed; prod untouched." Red; exit 1 }

Say "Watching canary health ($Samples samples)..."
$errors = 0
for ($i=1; $i -le $Samples; $i++) {
  try { $r = Invoke-WebRequest -Uri $HealthUrl -TimeoutSec 8 -UseBasicParsing; if ($r.StatusCode -ge 500) { $errors++ } }
  catch { $errors++ }
  Start-Sleep -Seconds $IntervalSec
}
$rate = [math]::Round($errors / $Samples, 3)
Say "Canary error rate: $rate (threshold $MaxErrorRate)"

if ($rate -le $MaxErrorRate) {
  Say "HEALTHY -> promoting canary to production." Green
  & cmd /c "npx wrangler deploy --env production"
} else {
  Say "ERROR SPIKE -> AUTO-ROLLBACK. Production was never promoted." Yellow
  & cmd /c "npx wrangler rollback --env canary"
  exit 2
}