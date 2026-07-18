#Requires -Version 5.1
<#
.SYNOPSIS
    Aether adapter for Taskwarrior (PowerShell → WSL → Taskwarrior).

.DESCRIPTION
    Wraps Taskwarrior in WSL to produce clean JSON output for agent consumption.
    Avoids mixed stderr/stdout and expression parsing quirks in task 2.6.2.

.PARAMETER Command
    The Taskwarrior command: list, get, create, done, export

.PARAMETER Args
    Arguments for the command (filter, UUID, description, tags).

.EXAMPLE
    ./adapter.ps1 list status:pending
    ./adapter.ps1 get "550e8400-e29b-41d4-a716-446655440000"
    ./adapter.ps1 create "My task" "tag1,tag2"
    ./adapter.ps1 done "550e8400-e29b-41d4-a716-446655440000"
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory = $true, Position = 0)]
    [ValidateSet('list', 'get', 'create', 'done', 'export')]
    [string]$Command,

    [Parameter(Position = 1, ValueFromRemainingArguments = $true)]
    [string[]]$Args
)

$ErrorActionPreference = 'Stop'

# --- Configuration ---
$WslDistro = if ($env:AETHER_WSL_DISTRO) { $env:AETHER_WSL_DISTRO } else { 'Ubuntu' }
$AdapterSh = if ($env:AETHER_TASK_ADAPTER_SH) { $env:AETHER_TASK_ADAPTER_SH } else {
    '~/.local/share/aether/integrations/taskwarrior/adapter.sh'
}

# --- Command allowlist ---
$AllowedCommands = @('list', 'get', 'create', 'done', 'export')
if ($Command -notin $AllowedCommands) {
    Write-Error "Command '$Command' not in allowlist: $($AllowedCommands -join ', ')"
    exit 1
}

# --- Validate arguments ---
switch ($Command) {
    'get', 'done' {
        if ($Args.Count -lt 1) {
            Write-Error "Usage: adapter.ps1 $Command <uuid>"
            exit 1
        }
        if ($Args[0] -notmatch '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$') {
            Write-Error "Invalid UUID format: $($Args[0])"
            exit 1
        }
    }
    'create' {
        if ($Args.Count -lt 1) {
            Write-Error "Usage: adapter.ps1 create <description> [tags]"
            exit 1
        }
    }
}

# --- Build WSL command ---
$WslArgs = @('-e', 'bash', '--noprofile', '--norc', '-c',
    "export PATH=/usr/local/sbin:/usr/local/bin:$HOME/.local/bin:/usr/sbin:/usr/bin:/sbin:/bin; " +
    "bash $AdapterSh $Command $($Args -join ' ')"
)

# --- Execute ---
Write-Verbose "Executing: wsl.exe --distribution $WslDistro $($WslArgs -join ' ')"
$result = & wsl.exe --distribution $WslDistro @WslArgs 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Error "Taskwarrior adapter failed with exit code $LASTEXITCODE`: $result"
    exit $LASTEXITCODE
}

Write-Output $result
