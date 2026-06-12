# scripts/health-check.ps1 — Check health of all Aether services
Write-Host "=== Aether Health Check ===" -ForegroundColor Cyan

$services = @(
    @{ Name = "Backend API"; Url = "http://localhost:3001/api/health" },
    @{ Name = "Backend Stack"; Url = "http://localhost:3001/api/stack" },
    @{ Name = "Frontend"; Url = "http://localhost:5173" },
    @{ Name = "Ollama"; Url = "http://localhost:11434/api/tags" }
)

$allHealthy = $true

foreach ($service in $services) {
    try {
        $response = Invoke-WebRequest -Uri $service.Url -TimeoutSec 5 -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            Write-Host "  ✅ $($service.Name) — ONLINE" -ForegroundColor Green
        }
        else {
            Write-Host "  ⚠️  $($service.Name) — Status $($response.StatusCode)" -ForegroundColor Yellow
            $allHealthy = $false
        }
    }
    catch {
        Write-Host "  ❌ $($service.Name) — OFFLINE" -ForegroundColor Red
        $allHealthy = $false
    }
}

Write-Host ""
if ($allHealthy) {
    Write-Host "All services healthy!" -ForegroundColor Green
}
else {
    Write-Host "Some services are down." -ForegroundColor Yellow
}