# Quick pre-PR green check. Fast checks first, bail on first failure.
$ErrorActionPreference = "Continue"
$steps = @("pnpm run typecheck --filter=!@aether/weekly-digest --filter=!@aether/aether-verifier")
foreach ($s in $steps) {
  Write-Host "-> $s" -ForegroundColor Cyan
  & cmd /c "$s"
  if ($LASTEXITCODE -ne 0) { Write-Host "FAIL: $s (exit $LASTEXITCODE)" -ForegroundColor Red; exit 1 }
}
Write-Host "ALL GREEN" -ForegroundColor Green