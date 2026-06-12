# Aether Backup Script
# Creates comprehensive backups of the Aether monorepo

param(
    [Parameter(Mandatory=$false)]
    [string]$BackupPath = "C:\Users\adamm\Backups\Aether"
)

Write-Host "🔄 Aether Backup Script" -ForegroundColor Green
Write-Host "Backup Path: $BackupPath" -ForegroundColor Cyan
Write-Host ""

# Create backup directory if it doesn't exist
if (-not (Test-Path $BackupPath)) {
    New-Item -ItemType Directory -Path $BackupPath -Force
    Write-Host "Created backup directory: $BackupPath" -ForegroundColor Yellow
}

# Generate timestamp
$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$backupDir = Join-Path $BackupPath "aether-backup-$timestamp"

Write-Host "Creating backup: $backupDir" -ForegroundColor Cyan

# Create backup directory
New-Item -ItemType Directory -Path $backupDir -Force | Out-Null

# Backup source code
Write-Host "📦 Backing up source code..." -ForegroundColor Yellow
$sourcePath = "C:\Users\adamm\Aether"
Copy-Item -Path $sourcePath -Destination "$backupDir\Aether" -Recurse -Force

# Backup package-lock.json
Write-Host "📦 Backing up package-lock.json..." -ForegroundColor Yellow
Copy-Item -Path "C:\Users\adamm\Aether\package-lock.json" -Destination "$backupDir\package-lock.json" -Force

# Backup environment variables
Write-Host "🔐 Backing up environment variables..." -ForegroundColor Yellow
$envContent = Get-Content -Path "C:\Users\adamm\.env" -ErrorAction SilentlyContinue
if ($envContent) {
    $envContent | Out-File -FilePath "$backupDir\.env.backup" -Encoding UTF8
    Write-Host "Environment variables backed up" -ForegroundColor Green
} else {
    Write-Host "No .env file found" -ForegroundColor Yellow
}

# Backup Git state
Write-Host "📝 Backing up Git state..." -ForegroundColor Yellow
Push-Location C:\Users\adamm\Aether
git log --oneline -10 | Out-File -FilePath "$backupDir\git-log.txt" -Encoding UTF8
git status | Out-File -FilePath "$backupDir\git-status.txt" -Encoding UTF8
git branch -a | Out-File -FilePath "$backupDir\git-branches.txt" -Encoding UTF8
Pop-Location

# Create backup manifest
Write-Host "📋 Creating backup manifest..." -ForegroundColor Yellow
$manifest = @{
    timestamp = $timestamp
    backupPath = $backupDir
    sourcePath = $sourcePath
    gitCommit = (git -C $sourcePath rev-parse HEAD 2>$null)
    gitBranch = (git -C $sourcePath branch --show-current 2>$null)
    size = (Get-ChildItem -Path $backupDir -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
}

$manifest | ConvertTo-Json | Out-File -FilePath "$backupDir\manifest.json" -Encoding UTF8

# Compress backup
Write-Host "🗜️ Compressing backup..." -ForegroundColor Yellow
$zipPath = "$backupDir.zip"
Compress-Archive -Path "$backupDir\*" -DestinationPath $zipPath -Force

# Remove uncompressed backup
Remove-Item -Path $backupDir -Recurse -Force

Write-Host ""
Write-Host "✅ Backup complete!" -ForegroundColor Green
Write-Host "Backup location: $zipPath" -ForegroundColor Cyan
Write-Host "Size: $([math]::Round((Get-Item $zipPath).Length / 1MB, 2)) MB" -ForegroundColor Cyan