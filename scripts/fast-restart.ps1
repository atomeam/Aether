Write-Host "🚀 Fast Backend Restart" -ForegroundColor Green

# Kill all node processes
Write-Host "Killing node processes..." -ForegroundColor Yellow
taskkill /F /IM node.exe 2>$null | Out-Null

# Wait for cleanup
Write-Host "Waiting for cleanup..." -ForegroundColor Yellow
Start-Sleep -Seconds 2

# Start backend
Write-Host "Starting backend..." -ForegroundColor Yellow
cd C:\Users\adamm\Aether
pnpm dev:backend

Write-Host "✅ Backend ready!" -ForegroundColor Green
