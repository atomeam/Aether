param(
    [Parameter(Mandatory=$false)]
    [string]$Search,
    
    [Parameter(Mandatory=$false)]
    [string]$Fetch,
    
    [Parameter(Mandatory=$false)]
    [switch]$ListTools,
    
    [Parameter(Mandatory=$false)]
    [switch]$Status,
    
    [Parameter(Mandatory=$false)]
    [int]$MaxResults = 10
)

# Docker MCP Bridge Skill
# Direct access to Docker MCP servers for Devin AI

function Write-ColorOutput {
    param([string]$Message, [string]$Color = "White")
    Write-Host $Message -ForegroundColor $Color
}

function Test-MCPServer {
    Write-ColorOutput "=== Checking MCP Server Status ===" "Cyan"
    
    try {
        $containerStatus = docker ps --filter "name=mcp-duckduckgo" --format "{{.Status}}" 2>&1
        if ($LASTEXITCODE -eq 0 -and $containerStatus -match "Up") {
            Write-ColorOutput "✅ DuckDuckGo MCP server running" "Green"
            return $true
        } else {
            Write-ColorOutput "❌ DuckDuckGo MCP server not running" "Red"
            Write-ColorOutput "   Start with: docker-compose -f docker-compose.mcp.yml up -d" "Yellow"
            return $false
        }
    } catch {
        Write-ColorOutput "❌ Server check failed: $_" "Red"
        return $false
    }
}

function Invoke-MCPRequest {
    param(
        [string]$ServerImage = "mcp/duckduckgo:latest",
        [hashtable]$Request
    )
    
    $requestJson = $Request | ConvertTo-Json -Depth 10 -Compress
    $tempScript = [System.IO.Path]::GetTempFileName() + ".js"
    
    try {
        # Create Node.js script that takes request as command line argument
        $nodeScript = @"
const { spawn } = require('child_process');

const request = process.argv[2];
const serverImage = process.argv[3] || 'mcp/duckduckgo:latest';

const mcpServer = spawn('docker', ['run', '-i', '--rm', serverImage]);

let output = '';
let error = '';

mcpServer.stdout.on('data', (data) => {
  output += data.toString();
});

mcpServer.stderr.on('data', (data) => {
  error += data.toString();
});

mcpServer.stdin.write(request + '\n');
mcpServer.stdin.end();

mcpServer.on('close', (code) => {
  console.log(output);
});
"@
        
        $nodeScript | Out-File -FilePath $tempScript -Encoding UTF8 -NoNewline
        
        # Use the Node.js script from test-mcp-server.js as a template
        $result = & "C:\Users\adamm\Aether\test-mcp-server.js" 2>&1
        
        return @{
            Output = $result
            Error = ""
            ExitCode = 0
        }
    } finally {
        if (Test-Path $tempScript) { Remove-Item $tempScript -Force }
    }
}

function Get-MCPTools {
    Write-ColorOutput "=== Getting Available MCP Tools ===" "Cyan"
    
    $request = @{
        jsonrpc = "2.0"
        id = 1
        method = "tools/list"
    }
    
    $result = Invoke-MCPRequest -Request $request
    
    if ($result.ExitCode -eq 0) {
        try {
            $response = $result.Output | ConvertFrom-Json
            if ($response.result.tools) {
                Write-ColorOutput "✅ Available tools:" "Green"
                $response.result.tools | ForEach-Object {
                    Write-ColorOutput "  - $($_.name): $($_.description.Substring(0, [Math]::Min(80, $_.description.Length)))..." "White"
                }
                return $response.result.tools
            }
        } catch {
            Write-ColorOutput "❌ Failed to parse response: $_" "Red"
        }
    } else {
        Write-ColorOutput "❌ MCP request failed" "Red"
        Write-ColorOutput $result.Error "Red"
    }
    
    return $null
}

function Invoke-DuckDuckGoSearch {
    param(
        [string]$Query,
        [int]$MaxResults = 10
    )
    
    Write-ColorOutput "=== DuckDuckGo Search ===" "Cyan"
    Write-ColorOutput "Query: $Query" "White"
    Write-ColorOutput "Max Results: $MaxResults" "White"
    Write-ColorOutput ""
    
    # Create a modified version of test-mcp-server.js for search
    $searchScript = @"
const { spawn } = require('child_process');

const query = '$Query';
const maxResults = $MaxResults;

const mcpServer = spawn('docker', ['run', '-i', '--rm', 'mcp/duckduckgo:latest']);

let output = '';
let error = '';

mcpServer.stdout.on('data', (data) => {
  output += data.toString();
});

mcpServer.stderr.on('data', (data) => {
  error += data.toString();
});

// Initialize
mcpServer.stdin.write(JSON.stringify({
  jsonrpc: '2.0',
  id: 1,
  method: 'initialize',
  params: {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: {
      name: 'devin-mcp-bridge',
      version: '1.0.0'
    }
  }
}) + '\n');

// List tools
setTimeout(() => {
  mcpServer.stdin.write(JSON.stringify({
    jsonrpc: '2.0',
    id: 2,
    method: 'tools/list'
  }) + '\n');
}, 500);

// Perform search
setTimeout(() => {
  mcpServer.stdin.write(JSON.stringify({
    jsonrpc: '2.0',
    id: 3,
    method: 'tools/call',
    params: {
      name: 'search',
      arguments: {
        query: query,
        max_results: maxResults
      }
    }
  }) + '\n');
}, 1000);

// Shutdown after search
setTimeout(() => {
  mcpServer.stdin.end();
}, 5000);

mcpServer.on('close', (code) => {
  console.log(output);
});
"@
    
    $tempScript = [System.IO.Path]::GetTempFileName() + ".js"
    $searchScript | Out-File -FilePath $tempScript -Encoding UTF8 -NoNewline
    
    try {
        $result = node $tempScript 2>&1
        
        # Parse the search results from the output - look for the search result JSON
        $searchResults = ""
        $lines = $result -split "`n"
        foreach ($line in $lines) {
            if ($line -match '"text".*"Found \d+ search results') {
                try {
                    # Extract the JSON object containing the search results
                    $jsonMatch = [regex]::Match($line, '\{.*"content".*\}')
                    if ($jsonMatch.Success) {
                        $parsed = $jsonMatch.Value | ConvertFrom-Json
                        if ($parsed.result.content) {
                            $searchResults = $parsed.result.content[0].text
                            break
                        }
                    }
                } catch {
                    # If parsing fails, continue to next line
                }
            }
        }
        
        if ($searchResults) {
            Write-ColorOutput $searchResults "Green"
            return $searchResults
        } else {
            Write-ColorOutput "Could not extract search results, showing raw output:" "Yellow"
            Write-ColorOutput $result "White"
            return $result
        }
    } finally {
        if (Test-Path $tempScript) { Remove-Item $tempScript -Force }
    }
}

function Invoke-WebFetch {
    param([string]$Url)
    
    Write-ColorOutput "=== Webpage Content Fetch ===" "Cyan"
    Write-ColorOutput "URL: $Url" "White"
    Write-ColorOutput ""
    
    $request = @{
        jsonrpc = "2.0"
        id = 1
        method = "tools/call"
        params = @{
            name = "fetch_content"
            arguments = @{
                url = $Url
            }
        }
    }
    
    $result = Invoke-MCPRequest -Request $request
    
    if ($result.ExitCode -eq 0) {
        try {
            $response = $result.Output | ConvertFrom-Json
            if ($response.result.content) {
                $content = $response.result.content[0].text
                Write-ColorOutput "✅ Content fetched successfully" "Green"
                Write-ColorOutput ""
                Write-ColorOutput $content "White"
                return $content
            } elseif ($response.result.isError) {
                Write-ColorOutput "❌ Fetch returned error" "Red"
                Write-ColorOutput $response.result.content[0].text "Red"
            }
        } catch {
            Write-ColorOutput "❌ Failed to parse fetch response: $_" "Red"
        }
    } else {
        Write-ColorOutput "❌ Fetch request failed" "Red"
        Write-ColorOutput $result.Error "Red"
    }
    
    return $null
}

# Main execution
if ($Status) {
    Test-MCPServer
} elseif ($ListTools) {
    if (Test-MCPServer) {
        Get-MCPTools
    }
} elseif ($Search) {
    if (Test-MCPServer) {
        Invoke-DuckDuckGoSearch -Query $Search -MaxResults $MaxResults
    }
} elseif ($Fetch) {
    if (Test-MCPServer) {
        Invoke-WebFetch -Url $Fetch
    }
} else {
    Write-ColorOutput "Docker MCP Bridge Skill" "Magenta"
    Write-ColorOutput ""
    Write-ColorOutput "Usage:" "Cyan"
    Write-ColorOutput "  -Search <query>       Perform DuckDuckGo web search" "White"
    Write-ColorOutput "  -Fetch <url>          Fetch webpage content" "White"
    Write-ColorOutput "  -ListTools            List available MCP tools" "White"
    Write-ColorOutput "  -Status               Check MCP server status" "White"
    Write-ColorOutput "  -MaxResults <number>  Set max search results (default: 10)" "White"
    Write-ColorOutput ""
    Write-ColorOutput "Example:" "Cyan"
    Write-ColorOutput "  .\.devin\skills\docker-mcp-bridge\skill.ps1 -Search 'Docker MCP tutorial'" "White"
    Write-ColorOutput "  .\.devin\skills\docker-mcp-bridge\skill.ps1 -Fetch 'https://example.com'" "White"
}