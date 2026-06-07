# Kill all processes using port 3002
$connections = Get-NetTCPConnection -LocalPort 3002 -ErrorAction SilentlyContinue
if ($connections) {
    $connections | ForEach-Object {
        Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
    }
    Write-Host "Killed processes on port 3002"
} else {
    Write-Host "No processes found on port 3002"
}
