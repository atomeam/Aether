param(
    [Parameter(Mandatory=$false)]
    [switch]$FixAgent,
    
    [Parameter(Mandatory=$false)]
    [switch]$ListWorkflows,
    
    [Parameter(Mandatory=$false)]
    [switch]$GetWorkflow,
    
    [Parameter(Mandatory=$false)]
    [switch]$CheckConnections,
    
    [Parameter(Mandatory=$false)]
    [string]$WorkflowId,
    
    [Parameter(Mandatory=$false)]
    [string]$ChatModel = "openrouter",
    
    [Parameter(Mandatory=$false)]
    [string]$ApiKey
)

# n8n Workflow Fix Skill
# Fixes AI Agent workflows by adding Chat Model nodes

function Write-ColorOutput {
    param([string]$Message, [string]$Color = "White")
    Write-Host $Message -ForegroundColor $Color
}

function Get-n8nConfig {
    $envFile = ".env"
    if (-not (Test-Path $envFile)) {
        Write-ColorOutput "❌ .env file not found" "Red"
        return $null
    }
    
    $config = @{}
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^([^=]+)=(.*)$') {
            $config[$matches[1]] = $matches[2]
        }
    }
    
    return $config
}

function List-n8nWorkflows {
    Write-ColorOutput "=== Listing n8n Workflows ===" "Cyan"
    
    $config = Get-n8nConfig
    if (-not $config) {
        return $false
    }
    
    $n8nUrl = $config['N8N_BASE_URL']
    $n8nKey = $config['N8N_API_KEY']
    
    try {
        $response = Invoke-WebRequest -Uri "$n8nUrl/api/v1/workflows" `
            -Headers @{
                'X-N8N-API-KEY' = $n8nKey
                'Content-Type' = 'application/json'
            } `
            -Method GET `
            -UseBasicParsing `
            -ErrorAction Stop
        
        $workflows = $response.Content | ConvertFrom-Json
        
        Write-ColorOutput "✅ Found $($workflows.data.Count) workflows:" "Green"
        $workflows.data | ForEach-Object {
            Write-ColorOutput "  - ID: $($_.id)" "White"
            Write-ColorOutput "    Name: $($_.name)" "White"
            Write-ColorOutput "    Active: $($_.active)" "White"
            Write-ColorOutput "" "White"
        }
        
        return $true
    } catch {
        Write-ColorOutput "❌ Failed to list workflows: $_" "Red"
        return $false
    }
}

function Get-n8nWorkflow {
    param([string]$Id)
    
    Write-ColorOutput "=== Getting Workflow Details ===" "Cyan"
    
    $config = Get-n8nConfig
    if (-not $config) {
        return $null
    }
    
    $n8nUrl = $config['N8N_BASE_URL']
    $n8nKey = $config['N8N_API_KEY']
    
    try {
        $response = Invoke-WebRequest -Uri "$n8nUrl/api/v1/workflows/$Id" `
            -Headers @{
                'X-N8N-API-KEY' = $n8nKey
                'Content-Type' = 'application/json'
            } `
            -Method GET `
            -UseBasicParsing `
            -ErrorAction Stop
        
        $workflow = $response.Content | ConvertFrom-Json
        
        Write-ColorOutput "✅ Workflow: $($workflow.name)" "Green"
        Write-ColorOutput "  ID: $($workflow.id)" "White"
        Write-ColorOutput "  Active: $($workflow.active)" "White"
        Write-ColorOutput "  Nodes: $($workflow.nodes.Count)" "White"
        
        Write-ColorOutput "" "Cyan"
        Write-ColorOutput "Nodes:" "Cyan"
        $workflow.nodes | ForEach-Object {
            $status = if ($_.enabled -eq $false) { " (DISABLED)" } else { "" }
            Write-ColorOutput "  - $($_.name) ($($_.type))$status" "White"
        }
        
        return $workflow
    } catch {
        Write-ColorOutput "❌ Failed to get workflow: $_" "Red"
        return $null
    }
}

function Check-WorkflowConnections {
    param([string]$Id)
    
    Write-ColorOutput "=== Checking Workflow Connections ===" "Cyan"
    
    $config = Get-n8nConfig
    if (-not $config) {
        return $false
    }
    
    $n8nUrl = $config['N8N_BASE_URL']
    $n8nKey = $config['N8N_API_KEY']
    
    try {
        $response = Invoke-WebRequest -Uri "$n8nUrl/api/v1/workflows/$Id" `
            -Headers @{
                'X-N8N-API-KEY' = $n8nKey
                'Content-Type' = 'application/json'
            } `
            -Method GET `
            -UseBasicParsing `
            -ErrorAction Stop
        
        $workflow = $response.Content | ConvertFrom-Json
        
        Write-ColorOutput "✅ Checking connections for: $($workflow.name)" "Green"
        Write-ColorOutput "" "White"
        
        # Find AI Agent node
        $aiAgentNode = $workflow.nodes | Where-Object { $_.type -like "*agent*" -or $_.name -like "*agent*" }
        
        if (-not $aiAgentNode) {
            Write-ColorOutput "❌ No AI Agent node found" "Red"
            return $false
        }
        
        Write-ColorOutput "AI Agent Node: $($aiAgentNode.name) (ID: $($aiAgentNode.id))" "Cyan"
        Write-ColorOutput "" "White"
        
        # Check connections to AI Agent
        if ($workflow.connections) {
            Write-ColorOutput "Connections to AI Agent:" "Cyan"
            
            $hasChatModel = $false
            foreach ($nodeId in $workflow.connections.Keys) {
                $node = $workflow.nodes | Where-Object { $_.id -eq $nodeId }
                if ($node) {
                    $connections = $workflow.connections[$nodeId]
                    if ($connections.main) {
                        foreach ($connection in $connections.main) {
                            if ($connection.node -eq $aiAgentNode.id) {
                                Write-ColorOutput "  ✅ $($node.name) → AI Agent" "Green"
                                
                                if ($node.type -like "*chatModel*" -or $node.type -like "*lmChat*" -or $node.name -like "*Model*") {
                                    $hasChatModel = $true
                                    Write-ColorOutput "     (This is a Chat Model node)" "Yellow"
                                }
                            }
                        }
                    }
                }
            }
            
            if (-not $hasChatModel) {
                Write-ColorOutput "" "Red"
                Write-ColorOutput "❌ NO CHAT MODEL CONNECTED TO AI AGENT" "Red"
                Write-ColorOutput "   This is the cause of the error!" "Yellow"
                return $false
            } else {
                Write-ColorOutput "" "Green"
                Write-ColorOutput "✅ Chat Model is connected to AI Agent" "Green"
                return $true
            }
        } else {
            Write-ColorOutput "❌ No connections found in workflow" "Red"
            return $false
        }
    } catch {
        Write-ColorOutput "❌ Error checking connections: $_" "Red"
        return $false
    }
}

function Enable-ChatModelNode {
    param(
        [string]$WorkflowId,
        [string]$ChatModelNodeId
    )
    
    Write-ColorOutput "=== Enabling Chat Model Node ===" "Cyan"
    
    $config = Get-n8nConfig
    if (-not $config) {
        return $false
    }
    
    $n8nUrl = $config['N8N_BASE_URL']
    $n8nKey = $config['N8N_API_KEY']
    
    # Get existing workflow
    $workflow = Get-n8nWorkflow -Id $WorkflowId
    if (-not $workflow) {
        return $false
    }
    
    # Find and enable Chat Model node
    $chatModelNode = $workflow.nodes | Where-Object { $_.id -eq $ChatModelNodeId }
    
    if (-not $chatModelNode) {
        Write-ColorOutput "❌ Chat Model node not found" "Red"
        return $false
    }
    
    $chatModelNode.enabled = $true
    
    # Update workflow
    try {
        $body = $workflow | ConvertTo-Json -Depth 20
        $response = Invoke-WebRequest -Uri "$n8nUrl/api/v1/workflows/$WorkflowId" `
            -Headers @{
                'X-N8N-API-KEY' = $n8nKey
                'Content-Type' = 'application/json'
            } `
            -Method PATCH `
            -Body $body `
            -UseBasicParsing `
            -ErrorAction Stop
        
        if ($response.StatusCode -eq 200) {
            Write-ColorOutput "✅ Chat Model node enabled" "Green"
            return $true
        } else {
            Write-ColorOutput "❌ Failed to enable node: $($response.StatusCode)" "Red"
            return $false
        }
    } catch {
        Write-ColorOutput "❌ Error enabling node: $_" "Red"
        return $false
    }
}

function Connect-ChatModelToAgent {
    param(
        [string]$WorkflowId,
        [string]$ChatModelNodeId
    )
    
    Write-ColorOutput "=== Connecting Chat Model to AI Agent ===" "Cyan"
    
    $config = Get-n8nConfig
    if (-not $config) {
        return $false
    }
    
    $n8nUrl = $config['N8N_BASE_URL']
    $n8nKey = $config['N8N_API_KEY']
    
    # Get existing workflow
    $workflow = Get-n8nWorkflow -Id $WorkflowId
    if (-not $workflow) {
        return $false
    }
    
    # Find AI Agent and Chat Model nodes
    $aiAgentNode = $workflow.nodes | Where-Object { $_.type -like "*agent*" -or $_.name -like "*agent*" }
    $chatModelNode = $workflow.nodes | Where-Object { $_.id -eq $ChatModelNodeId }
    
    if (-not $aiAgentNode) {
        Write-ColorOutput "❌ AI Agent node not found" "Red"
        return $false
    }
    
    if (-not $chatModelNode) {
        Write-ColorOutput "❌ Chat Model node not found" "Red"
        return $false
    }
    
    # Add connection - convert connections to hashtable if needed
    if (-not $workflow.connections) {
        $workflow.connections = @{}
    }
    
    # Ensure connections is a hashtable
    if ($workflow.connections -is [System.Management.Automation.PSObject]) {
        $connections = @{}
        $workflow.connections.PSObject.Properties | ForEach-Object {
            $connections[$_.Name] = $_.Value
        }
        $workflow.connections = $connections
    }
    
    # Add connection from Chat Model to AI Agent
    if (-not $workflow.connections[$chatModelNode.id]) {
        $workflow.connections[$chatModelNode.id] = @{
            main = @(
                @{
                    node = $aiAgentNode.id
                    type = "main"
                    index = 0
                }
            )
        }
    } else {
        # Connection already exists, check if it points to AI Agent
        $existingConnection = $workflow.connections[$chatModelNode.id]
        if ($existingConnection.main) {
            $pointsToAgent = $existingConnection.main | Where-Object { $_.node -eq $aiAgentNode.id }
            if (-not $pointsToAgent) {
                $workflow.connections[$chatModelNode.id].main += @{
                    node = $aiAgentNode.id
                    type = "main"
                    index = 0
                }
            }
        }
    }
    
    # Update workflow using PUT method
    try {
        $body = $workflow | ConvertTo-Json -Depth 20
        $response = Invoke-WebRequest -Uri "$n8nUrl/api/v1/workflows/$WorkflowId" `
            -Headers @{
                'X-N8N-API-KEY' = $n8nKey
                'Content-Type' = 'application/json'
            } `
            -Method PUT `
            -Body $body `
            -UseBasicParsing `
            -ErrorAction Stop
        
        if ($response.StatusCode -eq 200) {
            Write-ColorOutput "✅ Chat Model connected to AI Agent" "Green"
            return $true
        } else {
            Write-ColorOutput "❌ Failed to connect: $($response.StatusCode)" "Red"
            return $false
        }
    } catch {
        Write-ColorOutput "❌ Error connecting: $_" "Red"
        return $false
    }
}

function Fix-AIAgentWorkflow {
    param([string]$WorkflowId)
    
    Write-ColorOutput "=== Fixing AI Agent Workflow ===" "Cyan"
    
    # First check connections
    $connectionsOk = Check-WorkflowConnections -Id $WorkflowId
    
    if ($connectionsOk) {
        Write-ColorOutput "" "Green"
        Write-ColorOutput "✅ Workflow is already correctly configured" "Green"
        return $true
    }
    
    # Get workflow details
    $workflow = Get-n8nWorkflow -Id $WorkflowId
    if (-not $workflow) {
        return $false
    }
    
    # Find Chat Model node
    $chatModelNode = $workflow.nodes | Where-Object { 
        $_.type -like "*chatModel*" -or 
        $_.type -like "*lmChat*" -or 
        $_.name -like "*Model*" 
    }
    
    if (-not $chatModelNode) {
        Write-ColorOutput "❌ No Chat Model node found in workflow" "Red"
        Write-ColorOutput "   You need to add a Chat Model node manually in the n8n UI" "Yellow"
        Show-ManualFixGuide -WorkflowId $WorkflowId
        return $false
    }
    
    Write-ColorOutput "Found Chat Model node: $($chatModelNode.name)" "Yellow"
    Write-ColorOutput "Node ID: $($chatModelNode.id)" "White"
    
    # Try to fix via API
    Write-ColorOutput "" "Yellow"
    Write-ColorOutput "Attempting automatic fix via API..." "Yellow"
    
    # Enable Chat Model node if disabled
    if ($chatModelNode.enabled -eq $false) {
        Write-ColorOutput "Chat Model node is disabled - enabling..." "Yellow"
        if (Enable-ChatModelNode -WorkflowId $WorkflowId -ChatModelNodeId $chatModelNode.id) {
            Write-ColorOutput "✅ Chat Model node enabled" "Green"
        } else {
            Write-ColorOutput "❌ Failed to enable Chat Model node via API" "Red"
            Write-ColorOutput "   Please enable it manually in the n8n UI" "Yellow"
        }
    }
    
    # Connect Chat Model to AI Agent
    Write-ColorOutput "Connecting Chat Model to AI Agent..." "Yellow"
    if (Connect-ChatModelToAgent -WorkflowId $WorkflowId -ChatModelNodeId $chatModelNode.id) {
        Write-ColorOutput "" "Green"
        Write-ColorOutput "✅ Workflow fixed successfully" "Green"
        Write-ColorOutput "   Chat Model is now connected and enabled" "Green"
        return $true
    } else {
        Write-ColorOutput "" "Red"
        Write-ColorOutput "❌ Automatic fix failed via API" "Red"
        Write-ColorOutput "   Please fix manually using the guide below" "Yellow"
        Show-ManualFixGuide -WorkflowId $WorkflowId
        return $false
    }
}

function Show-ManualFixGuide {
    param([string]$WorkflowId)
    
    Write-ColorOutput "" "Cyan"
    Write-ColorOutput "=== Manual Fix Guide ===" "Cyan"
    Write-ColorOutput "" "White"
    Write-ColorOutput "1. Login to n8n Cloud:" "White"
    Write-ColorOutput "   URL: https://a-to-mind.app.n8n.cloud" "Yellow"
    Write-ColorOutput "" "White"
    Write-ColorOutput "2. Open the workflow: $WorkflowId" "White"
    Write-ColorOutput "" "White"
    Write-ColorOutput "3. Find the Chat Model node (e.g., 'GPT-5 Model')" "White"
    Write-ColorOutput "" "White"
    Write-ColorOutput "4. Ensure the Chat Model node is:" "White"
    Write-ColorOutput "   - Enabled (not disabled)" "White"
    Write-ColorOutput "   - Has valid API credentials configured" "White"
    Write-ColorOutput "" "White"
    Write-ColorOutput "5. Connect the Chat Model node to the AI Agent node:" "White"
    Write-ColorOutput "   - Click the output dot on the Chat Model node" "White"
    Write-ColorOutput "   - Drag a line to the AI Agent node" "White"
    Write-ColorOutput "   - Release to create the connection" "White"
    Write-ColorOutput "" "White"
    Write-ColorOutput "6. Save the workflow" "White"
    Write-ColorOutput "" "White"
    Write-ColorOutput "7. Test the workflow to verify the fix" "White"
}

# Main execution
if ($ListWorkflows) {
    Write-ColorOutput "📋 Listing n8n Workflows" "Magenta"
    Write-ColorOutput ""
    List-n8nWorkflows
} elseif ($GetWorkflow -and $WorkflowId) {
    Write-ColorOutput "🔍 Getting Workflow Details" "Magenta"
    Write-ColorOutput ""
    Get-n8nWorkflow -Id $WorkflowId
} elseif ($CheckConnections -and $WorkflowId) {
    Write-ColorOutput "🔗 Checking Workflow Connections" "Magenta"
    Write-ColorOutput ""
    Check-WorkflowConnections -Id $WorkflowId
} elseif ($FixAgent -and $WorkflowId) {
    Write-ColorOutput "🔧 Fixing AI Agent Workflow" "Magenta"
    Write-ColorOutput ""
    Fix-AIAgentWorkflow -WorkflowId $WorkflowId
} else {
    Write-ColorOutput "n8n Workflow Fix Skill" "Magenta"
    Write-ColorOutput ""
    Write-ColorOutput "Usage:" "Cyan"
    Write-ColorOutput "  -ListWorkflows           List all n8n workflows" "White"
    Write-ColorOutput "  -GetWorkflow             Get workflow details" "White"
    Write-ColorOutput "  -CheckConnections         Check AI Agent connections" "White"
    Write-ColorOutput "  -FixAgent                Fix AI Agent workflow" "White"
    Write-ColorOutput "  -WorkflowId <id>         Workflow ID to fix" "White"
    Write-ColorOutput ""
    Write-ColorOutput "Example:" "Cyan"
    Write-ColorOutput "  .\.devin\skills\n8n-workflow-fix\skill.ps1 -ListWorkflows" "White"
    Write-ColorOutput "  .\.devin\skills\n8n-workflow-fix\skill.ps1 -CheckConnections -WorkflowId N9DGvOr3EZQm5gxH" "White"
    Write-ColorOutput "  .\.devin\skills\n8n-workflow-fix\skill.ps1 -FixAgent -WorkflowId N9DGvOr3EZQm5gxH" "White"
}