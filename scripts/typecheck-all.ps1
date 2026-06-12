# scripts/typecheck-all.ps1 — Run typecheck across the entire monorepo
Write-Host "Running typecheck across Aether monorepo..." -ForegroundColor Cyan

$ErrorActionPreference = "Continue"

# Run turbo typecheck
npx turbo run typecheck

if ($LASTEXITCODE -eq 0) {
  Write-Host "Typecheck passed!" -ForegroundColor Green
}
else {
  Write-Host "Typecheck failed with errors. See output above." -ForegroundColor Red
  exit $LASTEXITCODE
}