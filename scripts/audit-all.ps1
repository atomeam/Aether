# scripts/audit-all.ps1 — Run security audit across the entire monorepo
Write-Host "Running security audit across Aether monorepo..." -ForegroundColor Cyan

$ErrorActionPreference = "Continue"

# Run npm audit
Write-Host "`n=== Root audit ===" -ForegroundColor Yellow
npm audit

Write-Host "`n=== Workspace audit ===" -ForegroundColor Yellow
npm audit --workspaces

Write-Host "`nAudit complete. Review findings above." -ForegroundColor Green