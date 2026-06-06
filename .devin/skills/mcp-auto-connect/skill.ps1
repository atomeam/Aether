# MCP Auto-Connect Skill
# Automatically connects to all available MCP servers

param(
    [switch]$Connect,
    [switch]$List,
    [switch]$Continuous
)

Write-Host "=== MCP AUTO-CONNECT SKILL ===" -ForegroundColor Cyan
Write-Host "Automatically connecting to all available MCP servers" -ForegroundColor Yellow
Write-Host ""

# MCP servers to connect to
$mcpServers = @(
    @{ Name = "cloudflare"; Type = "remote"; Url = "https://mcp.cloudflare.com/mcp" },
    @{ Name = "cloudflare-observability"; Type = "remote"; Url = "https://observability.mcp.cloudflare.com/mcp" },
    @{ Name = "cloudflare-bindings"; Type = "remote"; Url = "https://bindings.mcp.cloudflare.com/mcp" },
    @{ Name = "cloudflare-builds"; Type = "remote"; Url = "https://builds.mcp.cloudflare.com/mcp" },
    @{ Name = "cloudflare-docs"; Type = "remote"; Url = "https://docs.mcp.cloudflare.com/mcp" },
    @{ Name = "filesystem"; Type = "local"; Command = "npx"; Args = @("-y", "@modelcontextprotocol/server-filesystem", "C:\Users\adamm\Aether") },
    @{ Name = "brave-search"; Type = "local"; Command = "npx"; Args = @("-y", "@modelcontextprotocol/server-brave-search") },
    @{ Name = "github"; Type = "local"; Command = "npx"; Args = @("-y", "@modelcontextprotocol/server-github") },
    @{ Name = "sqlite"; Type = "local"; Command = "npx"; Args = @("-y", "@modelcontextprotocol/server-sqlite", "C:\Users\adamm\Aether\aether.db") },
    @{ Name = "fetch"; Type = "local"; Command = "npx"; Args = @("-y", "@modelcontextprotocol/server-fetch") }
)

function Connect-MCPServers {
    Write-Host "Connecting to MCP servers..." -ForegroundColor Cyan
    
    $connected = 0
    $failed = 0
    
    foreach ($server in $mcpServers) {
        Write-Host "Connecting to $($server.Name)..." -ForegroundColor Gray
        
        if ($server.Type -eq "local") {
            # Start local MCP server
            try {
                $process = Start-Process -FilePath $server.Command -ArgumentList $server.Args -NoNewWindow -PassThru
                Write-Host "  ✅ Started $($server.Name)" -ForegroundColor Green
                $connected++
            } catch {
                Write-Host "  ❌ Failed to start $($server.Name)" -ForegroundColor Red
                $failed++
            }
        } else {
            # Remote MCP server - just verify it's accessible
            try {
                $response = Invoke-WebRequest -Uri $server.Url -Method HEAD -TimeoutSec 5
                Write-Host "  ✅ Connected to $($server.Name)" -ForegroundColor Green
                $connected++
            } catch {
                Write-Host "  ❌ Failed to connect to $($server.Name)" -ForegroundColor Red
                $failed++
            }
        }
    }
    
    Write-Host ""
    Write-Host "=== CONNECTION RESULTS ===" -ForegroundColor Yellow
    Write-Host "Connected: $connected" -ForegroundColor Green
    Write-Host "Failed: $failed" -ForegroundColor Red
}

function List-MCPServers {
    Write-Host "Available MCP servers:" -ForegroundColor Cyan
    foreach ($server in $mcpServers) {
        Write-Host "  - $($server.Name) ($($server.Type))" -ForegroundColor White
    }
}

# Main execution
if ($Connect) {
    Connect-MCPServers
}

if ($List) {
    List-MCPServers
}

if ($Continuous) {
    Write-Host "Starting continuous MCP connection monitoring..." -ForegroundColor Cyan
    Write-Host "Press Ctrl+C to stop" -ForegroundColor Yellow
    Write-Host ""
    
    while ($true) {
        Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Checking MCP connections..." -ForegroundColor Cyan
        Connect-MCPServers
        Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Waiting 5 minutes..." -ForegroundColor Gray
        Start-Sleep -Seconds 300
    }
}

if (-not $Connect -and -not $List -and -not $Continuous) {
    Write-Host "Usage: .\skill.ps1 -Connect | -List | -Continuous" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "=== MCP AUTO-CONNECT COMPLETE ===" -ForegroundColor Cyan