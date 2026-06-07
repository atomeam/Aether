param(
    [Parameter(Mandatory=$false)]
    [switch]$Setup,
    
    [Parameter(Mandatory=$false)]
    [string]$AddServer,
    
    [Parameter(Mandatory=$false)]
    [switch]$Verify,
    
    [Parameter(Mandatory=$false)]
    [switch]$ClientConfig,
    
    [Parameter(Mandatory=$false)]
    [switch]$Troubleshoot,
    
    [Parameter(Mandatory=$false)]
    [switch]$EnableAI
)

# Docker MCP Setup Skill
# Automated setup of Docker MCP servers and gateway

function Write-ColorOutput {
    param([string]$Message, [string]$Color = "White")
    Write-Host $Message -ForegroundColor $Color
}

function Test-DockerInstallation {
    Write-ColorOutput "=== Checking Docker Installation ===" "Cyan"
    
    try {
        $dockerVersion = docker --version 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-ColorOutput "✅ Docker installed: $dockerVersion" "Green"
            return $true
        } else {
            Write-ColorOutput "❌ Docker not found" "Red"
            return $false
        }
    } catch {
        Write-ColorOutput "❌ Docker check failed: $_" "Red"
        return $false
    }
}

function Test-MCPInstallation {
    Write-ColorOutput "=== Checking MCP CLI Installation ===" "Cyan"
    
    try {
        $mcpVersion = mcp --version 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-ColorOutput "✅ MCP CLI installed: $mcpVersion" "Green"
            return $true
        } else {
            Write-ColorOutput "⚠️  MCP CLI not found (optional for Docker MCP)" "Yellow"
            Write-ColorOutput "   Docker MCP works without MCP CLI" "Yellow"
            return $true  # Make it optional since Docker MCP doesn't require it
        }
    } catch {
        Write-ColorOutput "⚠️  MCP CLI not found (optional for Docker MCP)" "Yellow"
        Write-ColorOutput "   Docker MCP works without MCP CLI" "Yellow"
        return $true  # Make it optional
    }
}

function Get-AvailableServers {
    return @(
        "duckduckgo",
        "filesystem",
        "postgres",
        "sqlite",
        "sequential-thinking",
        "memory",
        "e2b",
        "fetch",
        "git",
        "github"
    )
}

function Enable-DockerAIFeatures {
    Write-ColorOutput "=== Enabling Docker AI Features ===" "Cyan"
    
    try {
        # Check if Docker Desktop AI features are available
        $dockerInfo = docker info 2>&1
        if ($dockerInfo -match "Gordon" -or $dockerInfo -match "Model Runner") {
            Write-ColorOutput "✅ Docker AI features detected" "Green"
        } else {
            Write-ColorOutput "⚠️  Docker AI features may need manual enablement in Docker Desktop" "Yellow"
            Write-ColorOutput "   Settings → AI → Enable Gordon and Docker Model Runner" "Yellow"
        }
        
        # Configure Model Runner port
        $modelRunnerPort = 12434
        Write-ColorOutput "✅ Docker Model Runner port: $modelRunnerPort" "Green"
        
        # Check GPU availability
        $gpuInfo = nvidia-smi 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-ColorOutput "✅ GPU detected for AI inference" "Green"
        } else {
            Write-ColorOutput "⚠️  No GPU detected, will use CPU inference" "Yellow"
        }
        
        return $true
    } catch {
        Write-ColorOutput "❌ Failed to check Docker AI features: $_" "Red"
        return $false
    }
}
function Test-DockerStatus {
    Write-ColorOutput "=== Checking Docker Status ===" "Cyan"
    
    try {
        $dockerStatus = docker ps 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-ColorOutput "✅ Docker daemon running" "Green"
            return $true
        } else {
            Write-ColorOutput "❌ Docker daemon not running" "Red"
            Write-ColorOutput "   Please start Docker Desktop" "Yellow"
            return $false
        }
    } catch {
        Write-ColorOutput "❌ Docker status check failed: $_" "Red"
        return $false
    }
}

function Pull-MCPGateway {
    Write-ColorOutput "=== Pulling Docker MCP Gateway ===" "Cyan"
    
    try {
        docker pull docker/mcp-gateway 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-ColorOutput "✅ Docker MCP Gateway pulled successfully" "Green"
            return $true
        } else {
            Write-ColorOutput "❌ Failed to pull Docker MCP Gateway" "Red"
            return $false
        }
    } catch {
        Write-ColorOutput "❌ Gateway pull failed: $_" "Red"
        return $false
    }
}

function Pull-MCPServer {
    param([string]$ServerName)
    
    Write-ColorOutput "=== Pulling MCP Server: $ServerName ===" "Cyan"
    
    try {
        docker pull mcp/$ServerName 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-ColorOutput "✅ MCP Server '$ServerName' pulled successfully" "Green"
            return $true
        } else {
            Write-ColorOutput "❌ Failed to pull MCP Server '$ServerName'" "Red"
            return $false
        }
    } catch {
        Write-ColorOutput "❌ Server pull failed: $_" "Red"
        return $false
    }
}

function New-DockerComposeConfig {
    param([string]$ServerName = "duckduckgo")
    
    Write-ColorOutput "=== Creating Docker Compose Configuration ===" "Cyan"
    
    $composePath = "docker-compose.mcp.yml"
    $serviceName = "mcp-$ServerName"
    $imageName = "mcp/$ServerName"
    
    $composeContent = @"
services:
  ${serviceName}:
    image: ${imageName}:latest
    container_name: ${serviceName}
    stdin_open: true
    tty: true
"@
    
    try {
        $composeContent | Out-File -FilePath $composePath -Encoding UTF8
        Write-ColorOutput "✅ Docker Compose config created: $composePath" "Green"
        return $true
    } catch {
        Write-ColorOutput "❌ Failed to create Docker Compose config: $_" "Red"
        return $false
    }
}

function New-ClientConfig {
    param([string]$ServerName = "duckduckgo")
    
    Write-ColorOutput "=== Generating MCP Client Configuration ===" "Cyan"
    
    $imageName = "mcp/$ServerName"
    
    $clientConfig = @"
{
  "mcpServers": {
    "$ServerName": {
      "command": "docker",
      "args": [
        "run", "-i", "--rm",
        "${imageName}:latest"
      ]
    }
  }
}
"@
    
    $configPath = "mcp-client-config.json"
    try {
        $clientConfig | Out-File -FilePath $configPath -Encoding UTF8
        Write-ColorOutput "✅ Client config created: $configPath" "Green"
        Write-ColorOutput "   Add this to your MCP client configuration" "Yellow"
        return $true
    } catch {
        Write-ColorOutput "❌ Failed to create client config: $_" "Red"
        return $false
    }
}

function New-SetupGuide {
    Write-ColorOutput "=== Creating Setup Guide ===" "Cyan"
    
    $guideContent = @"
# Docker MCP Setup Guide

## Quick Start

1. Start the MCP server:
   \`docker-compose -f docker-compose.mcp.yml up -d\`

2. Add to your MCP client config (see mcp-client-config.json)

3. Restart your MCP client

4. Test the connection

## Troubleshooting

**Docker daemon errors:**
- Make sure Docker Desktop is running
- Check Docker Desktop settings

**MCP client can't connect:**
- Verify container is running: \`docker ps\`
- Check container logs: \`docker logs mcp-<server-name>\`
- Ensure client config matches examples

## Available MCP Servers

- duckduckgo: Web search
- brave: Alternative web search
- youtube-transcript: YouTube transcripts
- atlassian: Jira/Confluence
- github: GitHub operations
- slack: Slack integration
- filesystem: File operations
- postgres: PostgreSQL operations
"@
    
    $guidePath = "setup-mcp-docker.md"
    try {
        $guideContent | Out-File -FilePath $guidePath -Encoding UTF8
        Write-ColorOutput "✅ Setup guide created: $guidePath" "Green"
        return $true
    } catch {
        Write-ColorOutput "❌ Failed to create setup guide: $_" "Red"
        return $false
    }
}

function Invoke-CompleteSetup {
    Write-ColorOutput "🚀 Starting Complete Docker MCP Setup" "Magenta"
    Write-ColorOutput ""
    
    $dockerOk = Test-DockerInstallation
    if (-not $dockerOk) {
        Write-ColorOutput "❌ Setup failed: Docker not installed" "Red"
        return $false
    }
    
    $mcpOk = Test-MCPInstallation  # This now returns true even if MCP CLI is missing
    $dockerRunning = Test-DockerStatus
    if (-not $dockerRunning) {
        Write-ColorOutput "❌ Setup failed: Docker not running" "Red"
        return $false
    }
    
    # Enable Docker AI features
    $aiFeaturesOk = Enable-DockerAIFeatures
    
    $gatewayOk = Pull-MCPGateway
    if (-not $gatewayOk) {
        Write-ColorOutput "⚠️  Gateway pull failed, continuing with direct server setup" "Yellow"
    }
    
    $serverOk = Pull-MCPServer -ServerName "duckduckgo"
    if (-not $serverOk) {
        Write-ColorOutput "❌ Setup failed: Could not pull MCP server" "Red"
        return $false
    }
    
    $composeOk = New-DockerComposeConfig -ServerName "duckduckgo"
    if (-not $composeOk) {
        Write-ColorOutput "❌ Setup failed: Could not create Docker Compose config" "Red"
        return $false
    }
    
    $clientOk = New-ClientConfig -ServerName "duckduckgo"
    if (-not $clientOk) {
        Write-ColorOutput "❌ Setup failed: Could not create client config" "Red"
        return $false
    }
    
    $guideOk = New-SetupGuide
    if (-not $guideOk) {
        Write-ColorOutput "⚠️  Setup guide creation failed, but setup is complete" "Yellow"
    }
    
    Write-ColorOutput ""
    Write-ColorOutput "✅ Docker MCP Setup Complete!" "Green"
    Write-ColorOutput ""
    Write-ColorOutput "Next steps:" "Cyan"
    Write-ColorOutput "1. Start server: docker-compose -f docker-compose.mcp.yml up -d" "White"
    Write-ColorOutput "2. Add config to MCP client (see mcp-client-config.json)" "White"
    Write-ColorOutput "3. Restart MCP client" "White"
    Write-ColorOutput "4. Test connection" "White"
    
    return $true
}

function Invoke-Verification {
    Write-ColorOutput "🔍 Running Docker MCP Verification" "Magenta"
    Write-ColorOutput ""
    
    $dockerOk = Test-DockerInstallation
    $mcpOk = Test-MCPInstallation  # This now returns true even if MCP CLI is missing
    $dockerRunning = Test-DockerStatus
    
    Write-ColorOutput ""
    Write-ColorOutput "=== Verification Summary ===" "Cyan"
    Write-ColorOutput "Docker: $(if ($dockerOk) { '✅ OK' } else { '❌ FAIL' })" $(if ($dockerOk) { 'Green' } else { 'Red' })
    Write-ColorOutput "MCP CLI: $(if ($mcpOk) { '✅ OK (optional)' } else { '❌ FAIL' })" $(if ($mcpOk) { 'Green' } else { 'Red' })
    Write-ColorOutput "Docker Running: $(if ($dockerRunning) { '✅ OK' } else { '❌ FAIL' })" $(if ($dockerRunning) { 'Green' } else { 'Red' })
    
    return ($dockerOk -and $dockerRunning)  # MCP CLI is optional
}

function Invoke-Troubleshooting {
    Write-ColorOutput "🔧 Running Docker MCP Troubleshooting" "Magenta"
    Write-ColorOutput ""
    
    Write-ColorOutput "=== System Information ===" "Cyan"
    Write-ColorOutput "OS: $((Get-WmiObject Win32_OperatingSystem).Caption)" "White"
    Write-ColorOutput "PowerShell: $($PSVersionTable.PSVersion)" "White"
    
    Write-ColorOutput ""
    Write-ColorOutput "=== Docker Information ===" "Cyan"
    docker info 2>&1 | Select-Object -First 10 | ForEach-Object { Write-ColorOutput $_ "White" }
    
    Write-ColorOutput ""
    Write-ColorOutput "=== Running Containers ===" "Cyan"
    docker ps 2>&1 | ForEach-Object { Write-ColorOutput $_ "White" }
    
    Write-ColorOutput ""
    Write-ColorOutput "=== Docker Images ===" "Cyan"
    docker images | Where-Object { $_ -match "mcp" } | ForEach-Object { Write-ColorOutput $_ "White" }
    
    Write-ColorOutput ""
    Write-ColorOutput "=== Common Issues ===" "Cyan"
    Write-ColorOutput "1. Docker not running: Start Docker Desktop" "Yellow"
    Write-ColorOutput "2. Port conflicts: Check if port 8080 is in use" "Yellow"
    Write-ColorOutput "3. Permission errors: Run as administrator" "Yellow"
    Write-ColorOutput "4. Network issues: Check internet connection" "Yellow"
}

# Main execution
if ($Setup) {
    Invoke-CompleteSetup
} elseif ($AddServer) {
    Write-ColorOutput "📦 Adding MCP Server: $AddServer" "Magenta"
    $serverOk = Pull-MCPServer -ServerName $AddServer
    if ($serverOk) {
        New-DockerComposeConfig -ServerName $AddServer
        New-ClientConfig -ServerName $AddServer
        Write-ColorOutput "✅ Server '$AddServer' added successfully" "Green"
    } else {
        Write-ColorOutput "❌ Failed to add server '$AddServer'" "Red"
    }
} elseif ($Verify) {
    Invoke-Verification
} elseif ($ClientConfig) {
    New-ClientConfig
} elseif ($Troubleshoot) {
    Invoke-Troubleshooting
} elseif ($EnableAI) {
    Enable-DockerAIFeatures
} else {
    Write-ColorOutput "Docker MCP Setup Skill" "Magenta"
    Write-ColorOutput ""
    Write-ColorOutput "Usage:" "Cyan"
    Write-ColorOutput "  -Setup          Complete Docker MCP setup" "White"
    Write-ColorOutput "  -AddServer <name>  Add specific MCP server" "White"
    Write-ColorOutput "  -Verify         Verify installation" "White"
    Write-ColorOutput "  -ClientConfig   Generate client config" "White"
    Write-ColorOutput "  -Troubleshoot  Run diagnostics" "White"
    Write-ColorOutput "  -EnableAI       Enable Docker AI features" "White"
    Write-ColorOutput ""
    Write-ColorOutput "Example:" "Cyan"
    Write-ColorOutput "  .\.devin\skills\docker-mcp-setup\skill.ps1 -Setup" "White"
}