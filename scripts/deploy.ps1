# scripts/deploy.ps1 — Deploy Aether to production
param(
    [string]$Target = "all"  # backend, frontend, bridge, or all
)

Write-Host "=== Aether Deployment ===" -ForegroundColor Cyan
Write-Host "Target: $Target" -ForegroundColor Yellow

$ErrorActionPreference = "Stop"

# Build all workspaces first
Write-Host "`n[1/5] Building all workspaces..." -ForegroundColor Green
npm run build
if ($LASTEXITCODE -ne 0) { Write-Host "Build failed!" -ForegroundColor Red; exit 1 }

# Run tests
Write-Host "`n[2/5] Running tests..." -ForegroundColor Green
npm run test
if ($LASTEXITCODE -ne 0) { Write-Host "Tests failed!" -ForegroundColor Red; exit 1 }

# Run typecheck
Write-Host "`n[3/5] Running typecheck..." -ForegroundColor Green
npm run typecheck
if ($LASTEXITCODE -ne 0) { Write-Host "Typecheck failed!" -ForegroundColor Red; exit 1 }

# Deploy based on target
if ($Target -eq "all" -or $Target -eq "backend") {
    Write-Host "`n[4/5] Deploying backend to Vercel..." -ForegroundColor Green
    cd apps/backend
    vercel --prod --yes
    cd ../..
}

if ($Target -eq "all" -or $Target -eq "frontend") {
    Write-Host "`n[5/5] Deploying frontend to Vercel..." -ForegroundColor Green
    cd apps/frontend
    npm run build
    vercel --prod --yes
    cd ../..
}

if ($Target -eq "all" -or $Target -eq "bridge") {
    Write-Host "`nDeploying bridge to Cloudflare Workers..." -ForegroundColor Green
    cd apps/bridge
    wrangler deploy
    cd ../..
}

Write-Host "`n=== Deployment Complete ===" -ForegroundColor Green