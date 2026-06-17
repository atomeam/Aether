# Task Scheduler Setup Script for Automation Orchestrator
# This script sets up the orchestrator to run automatically using Windows Task Scheduler

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Automation Orchestrator Task Scheduler Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptPath
$taskName = "AutomationOrchestrator"
$startScript = "$projectRoot\start.ps1"

Write-Host "Project Root: $projectRoot" -ForegroundColor Yellow
Write-Host "Task Name: $taskName" -ForegroundColor Yellow
Write-Host "Start Script: $startScript" -ForegroundColor Yellow

# Check if start script exists
if (-not (Test-Path $startScript)) {
    Write-Host "Start script not found: $startScript" -ForegroundColor Red
    exit 1
}

# Remove existing task if it exists
$existingTask = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
if ($existingTask) {
    Write-Host "Removing existing task..." -ForegroundColor Yellow
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
    Start-Sleep -Seconds 1
}

# Create the task action
$action = New-ScheduledTaskAction `
    -Execute "powershell.exe" `
    -Argument "-ExecutionPolicy Bypass -File `"$startScript`"" `
    -WorkingDirectory $projectRoot

# Create the trigger (start at system startup and on logon)
$trigger1 = New-ScheduledTaskTrigger -AtStartup
$trigger2 = New-ScheduledTaskTrigger -AtLogon

# Create the principal (run with highest privileges)
$principal = New-ScheduledTaskPrincipal `
    -UserId "SYSTEM" `
    -LogonType ServiceAccount `
    -RunLevel Highest

# Create the settings
$settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -RestartCount 3 `
    -RestartInterval (New-TimeSpan -Minutes 1) `
    -ExecutionTimeLimit (New-TimeSpan -Days 365) `
    -MultipleInstances IgnoreNew

# Register the task
Write-Host "Registering scheduled task..." -ForegroundColor Green
Register-ScheduledTask `
    -TaskName $taskName `
    -Action $action `
    -Trigger $trigger1, $trigger2 `
    -Principal $principal `
    -Settings $settings `
    -Description "Automation Orchestrator - Manages scheduled workflows and automation tasks" `
    -Force

# Verify task was created
$task = Get-ScheduledTask -TaskName $taskName
if ($task) {
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "Task created successfully!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "Task Name: $taskName" -ForegroundColor Cyan
    Write-Host "Status: $($task.State)" -ForegroundColor Cyan
    Write-Host "Triggers: At Startup, At Logon" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Useful commands:" -ForegroundColor Yellow
    Write-Host "  Start task:      Start-ScheduledTask -TaskName $taskName" -ForegroundColor White
    Write-Host "  Stop task:       Stop-ScheduledTask -TaskName $taskName" -ForegroundColor White
    Write-Host "  Enable task:     Enable-ScheduledTask -TaskName $taskName" -ForegroundColor White
    Write-Host "  Disable task:    Disable-ScheduledTask -TaskName $taskName" -ForegroundColor White
    Write-Host "  Remove task:     Unregister-ScheduledTask -TaskName $taskName -Confirm:`$false" -ForegroundColor White
    Write-Host "  View task info:  Get-ScheduledTaskInfo -TaskName $taskName" -ForegroundColor White
    
    # Start the task immediately
    Write-Host ""
    Write-Host "Starting task immediately..." -ForegroundColor Green
    Start-ScheduledTask -TaskName $taskName
    Write-Host "Task started. The orchestrator should now be running." -ForegroundColor Green
} else {
    Write-Host "Failed to create task." -ForegroundColor Red
    exit 1
}