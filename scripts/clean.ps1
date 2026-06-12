# scripts/clean.ps1 — Clean all build artifacts across the monorepo
Write-Host "Cleaning Aether monorepo..." -ForegroundColor Cyan

# Remove node_modules, dist, coverage, .turbo across all packages/apps
$dirs = @(
  "node_modules",
  "dist",
  "build",
  "coverage",
  ".turbo"
)

Get-ChildItem -Path "apps", "packages" -Directory -ErrorAction SilentlyContinue | ForEach-Object {
  $app = $_
  Get-ChildItem -Path $app -Directory -Recurse -ErrorAction SilentlyContinue | ForEach-Object {
    foreach ($dir in $dirs) {
      if ($_.Name -eq $dir) {
        Write-Host "  Removing $($_.FullName)" -ForegroundColor DarkGray
        Remove-Item -Path $_.FullName -Recurse -Force -ErrorAction SilentlyContinue
      }
    }
  }
}

# Clean root-level artifacts
foreach ($dir in $dirs) {
  $rootDir = Join-Path (Get-Location) $dir
  if (Test-Path $rootDir) {
    Write-Host "  Removing $rootDir" -ForegroundColor DarkGray
    Remove-Item -Path $rootDir -Recurse -Force -ErrorAction SilentlyContinue
  }
}

Write-Host "Clean complete!" -ForegroundColor Green