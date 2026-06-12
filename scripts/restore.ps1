# Aether Restore Script
# Restores Aether monorepo from a backup

param(
    [Parameter(Mandatory=$true)]
    [string]$BackupPath
)

Write-Host "🔄 Aether Restore Script" -ForegroundColor Green
Write-Host "Backup Path: $BackupPath" -ForegroundColor Cyan
Write-Host ""

# Check if backup exists
if (-not (Test-Path $BackupPath)) {
    Write-Host "❌ Backup not found: $BackupPath" -ForegroundColor Red
    exit 1
}

# Extract backup if it's a zip file
if ($BackupPath -like "*.zip") {
    Write-Host "🗜️ Extracting backup..." -ForegroundColor Yellow
    $extractPath = "C:\Users\adamm\Temp\aether-restore"
    
    if (Test-Path $extractPath) {
        Remove-Item -Path $extractPath -Recurse -Force
    }
    
    New-Item -ItemType Directory -Path $extractPath -Force | Out-Null
    Expand-Archive -Path $BackupPath -DestinationPath $extractPath -Force
    
    $backupDir = Get-ChildItem -Path $extractPath | Select-Object -First 1
    $backupDir = $backupDir.FullName
} else {
    $backupDir = $BackupPath
}

# Read manifest
$manifestPath = Join-Path $backupDir "manifest.json"
if (Test-Path $manifestPath) {
    $manifest = Get-Content -Path $manifestPath | ConvertFrom-Json
    Write-Host "📋 Backup manifest:" -ForegroundColor Cyan
    Write-Host "   Timestamp: $($manifest.timestamp)" -ForegroundColor Gray
    Write-Host "   Git Commit: $($manifest.gitCommit)" -ForegroundColor Gray
    Write-Host "   Git Branch: $($manifest.gitBranch)" -ForegroundColor Gray
    Write-Host ""
}

# Confirm restore
Write-Host "⚠️ This will restore Aether from backup." -ForegroundColor Yellow
Write-Host "Current Aether will be backed up automatically." -ForegroundColor Yellow
$confirm = Read-Host "Continue? (y/n)"

if ($confirm -ne "y") {
    Write-Host "Restore cancelled" -ForegroundColor Yellow
    exit 0
}

# Create emergency backup of current state
Write-Host "🔄 Creating emergency backup of current state..." -ForegroundColor Yellow
$emergencyBackup = "C:\Users\adamm\Backups\Aether\emergency-backup-$(Get-Date -Format 'yyyy-MM-dd_HH-mm-ss')"
New-Item -ItemType Directory -Path $emergencyBackup -Force | Out-Null
Copy-Item -Path "C:\Users\adamm\Aether" -Destination "$emergencyBackup\Aether" -Recurse -Force

# Restore source code
Write-Host "📦 Restoring source code..." -ForegroundColor Yellow
$sourceBackup = Join-Path $backupDir "Aether"
if (Test-Path $sourceBackup) {
    Remove-Item -Path "C:\Users\adamm\Aether" -Recurse -Force
    Copy-Item -Path $sourceBackup -Destination "C:\Users\adamm\Aether" -Recurse -Force
    Write-Host "Source code restored" -ForegroundColor Green
} else {
    Write-Host "❌ Source code not found in backup" -ForegroundColor Red
    exit 1
}

# Restore package-lock.json
Write-Host "📦 Restoring package-lock.json..." -ForegroundColor Yellow
$lockfileBackup = Join-Path $backupDir "package-lock.json"
if (Test-Path $lockfileBackup) {
    Copy-Item -Path $lockfileBackup -Destination "C:\Users\adamm\Aether\package-lock.json" -Force
    Write-Host "package-lock.json restored" -ForegroundColor Green
}

# Restore environment variables
Write-Host "🔐 Restoring environment variables..." -ForegroundColor Yellow
$envBackup = Join-Path $backupDir ".env.backup"
if (Test-Path $envBackup) {
    Copy-Item -Path $envBackup -Destination "C:\Users\adamm\.env" -Force
    Write-Host "Environment variables restored" -ForegroundColor Green
}

# Restore Git state if needed
Write-Host "📝 Checking Git state..." -ForegroundColor Yellow
Push-Location C:\Users\adamm\Aether
$gitStatus = git status --short
if ($gitStatus) {
    Write-Host "⚠️ Git has uncommitted changes" -ForegroundColor Yellow
    Write-Host "Review git status before proceeding" -ForegroundColor Yellow
}
Pop-Location

# Cleanup temp files
if ($BackupPath -like "*.zip") {
    Remove-Item -Path "C:\Users\adamm\Temp\aether-restore" -Recurse -Force
}

Write-Host ""
Write-Host "✅ Restore complete!" -ForegroundColor Green
Write-Host "Emergency backup: $emergencyBackup" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Review git status: cd C:\Users\adamm\Aether && git status" -ForegroundColor Gray
Write-Host "2. Install dependencies: cd C:\Users\adamm\Aether && npm install" -ForegroundColor Gray
Write-Host "3. Test build: cd C:\Users\adamm\Aether && npm run build" -ForegroundColor Gray