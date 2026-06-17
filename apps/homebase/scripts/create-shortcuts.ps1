# Create Desktop Shortcuts for Automation Orchestrator

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Creating Desktop Shortcuts" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptPath
$desktopPath = [Environment]::GetFolderPath("Desktop")

Write-Host "Project Root: $projectRoot" -ForegroundColor Yellow
Write-Host "Desktop Path: $desktopPath" -ForegroundColor Yellow

# Create WScript.Shell object
$WshShell = New-Object -ComObject WScript.Shell

# Shortcut 1: Automation Orchestrator
$orchestratorShortcut = "$desktopPath\Automation Orchestrator.lnk"
$orchestratorTarget = "powershell.exe"
$orchestratorArguments = "-ExecutionPolicy Bypass -File `"$projectRoot\start.ps1`""
$orchestratorIcon = "powershell.exe,0"

$Shortcut = $WshShell.CreateShortcut($orchestratorShortcut)
$Shortcut.TargetPath = $orchestratorTarget
$Shortcut.Arguments = $orchestratorArguments
$Shortcut.WorkingDirectory = $projectRoot
$Shortcut.Description = "Start Automation Orchestrator"
$Shortcut.IconLocation = $orchestratorIcon
$Shortcut.Save()

Write-Host "Created: Automation Orchestrator.lnk" -ForegroundColor Green

# Shortcut 2: Dashboard
$dashboardShortcut = "$desktopPath\Automation Dashboard.lnk"
$dashboardTarget = "node.exe"
$dashboardArguments = "server.js"
$dashboardWorkingDir = "$projectRoot\dashboard"
$dashboardIcon = "node.exe,0"

$Shortcut = $WshShell.CreateShortcut($dashboardShortcut)
$Shortcut.TargetPath = $dashboardTarget
$Shortcut.Arguments = $dashboardArguments
$Shortcut.WorkingDirectory = $dashboardWorkingDir
$Shortcut.Description = "Start Automation Dashboard"
$Shortcut.IconLocation = $dashboardIcon
$Shortcut.Save()

Write-Host "Created: Automation Dashboard.lnk" -ForegroundColor Green

# Shortcut 3: Quick Start Script
$quickStartScript = "$projectRoot\scripts\quick-start.ps1"
$quickStartContent = '# Quick Start Script - Starts both orchestrator and dashboard
Write-Host "Starting Automation Orchestrator and Dashboard..." -ForegroundColor Cyan

# Start orchestrator minimized
Start-Process powershell -ArgumentList "-ExecutionPolicy Bypass -File `"' + $projectRoot + '\start.ps1`"" -WindowStyle Minimized

# Wait for orchestrator to start
Start-Sleep -Seconds 3

# Start dashboard
Start-Process node -ArgumentList "server.js" -WorkingDirectory "' + $projectRoot + '\dashboard"

# Wait for dashboard to start
Start-Sleep -Seconds 2

# Open browser
Start-Process "http://localhost:8080"

Write-Host "Automation system started!" -ForegroundColor Green
'

$quickStartContent | Out-File -FilePath $quickStartScript -Encoding UTF8

# Shortcut 3: Quick Start
$quickStartShortcut = "$desktopPath\Automation Quick Start.lnk"
$Shortcut = $WshShell.CreateShortcut($quickStartShortcut)
$Shortcut.TargetPath = "powershell.exe"
$Shortcut.Arguments = "-ExecutionPolicy Bypass -File `"$quickStartScript`""
$Shortcut.WorkingDirectory = $projectRoot
$Shortcut.Description = "Start Orchestrator and Dashboard"
$Shortcut.IconLocation = "powershell.exe,0"
$Shortcut.Save()

Write-Host "Created: Automation Quick Start.lnk" -ForegroundColor Green

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Shortcuts created successfully!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Shortcuts available on desktop:" -ForegroundColor Cyan
Write-Host "  - Automation Orchestrator.lnk" -ForegroundColor White
Write-Host "  - Automation Dashboard.lnk" -ForegroundColor White
Write-Host "  - Automation Quick Start.lnk" -ForegroundColor Cyan
Write-Host ""
Write-Host "Quick Start will:" -ForegroundColor Yellow
Write-Host "  1. Start the orchestrator (minimized)" -ForegroundColor White
Write-Host "  2. Start the dashboard server" -ForegroundColor White
Write-Host "  3. Open dashboard in browser" -ForegroundColor White