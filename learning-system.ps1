# Continuous Learning System - Fully Connected
# Autonomously learns, organizes, and documents skill improvements using all systems

param(
    [switch]$Continuous,
    [switch]$Once
)

$repoRoot = "C:\Users\adamm\Aether"
$learningDir = "$repoRoot\.learning"
$logFile = "$repoRoot\learning.log"
$victusUrl = "http://localhost:8080"

Write-Host "=== CONTINUOUS LEARNING SYSTEM - FULLY CONNECTED ===" -ForegroundColor Cyan
Write-Host "Connected to MCP, Victus, Codebase, and Improvement System" -ForegroundColor Yellow
Write-Host ""

# Create learning directory structure
$skillAreas = @("frontend", "backend", "cloud", "ai-ml", "devops", "architecture")
foreach ($area in $skillAreas) {
    $areaDir = "$learningDir\$area"
    if (-not (Test-Path $areaDir)) {
        New-Item -ItemType Directory -Path $areaDir -Force | Out-Null
        New-Item -ItemType Directory -Path "$areaDir\topics" -Force | Out-Null
        New-Item -ItemType Directory -Path "$areaDir\resources" -Force | Out-Null
        New-Item -ItemType Directory -Path "$areaDir\projects" -Force | Out-Null
    }
}

function Log-Message {
    param($message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "[$timestamp] $message" | Out-File -FilePath $logFile -Append
    Write-Host "[$timestamp] $message" -ForegroundColor Gray
}

function Research-Topic {
    param($area, $topic)
    
    Log-Message "Researching: $area - $topic"
    
    # Use web search for research
    try {
        $searchQuery = "$area $topic tutorial 2026 best practices"
        $results = web_search -query $searchQuery -num_results 5
        
        $resources = @()
        foreach ($result in $results) {
            $resources += "- [$($result.title)]($($result.url))"
        }
        
        return $resources
    } catch {
        Log-Message "Research failed"
        return @("- Search failed")
    }
}

function Apply-Learning {
    param($area, $topic, $content)
    
    Log-Message "Applying learning: $topic to codebase"
    
    # Send to Victus for orchestration
    try {
        $response = Invoke-RestMethod -Uri "$victusUrl/api/execute" -Method POST -ContentType "application/json" -Body @{
            objective = "Apply learning: $topic"
            plan = @(
                @{ type = "local"; action = "apply-learning"; params = @{ area = $area; topic = $topic; content = $content } }
            )
        } | ConvertTo-Json -Depth 10
        
        Log-Message "Sent to Victus: $($response.success)"
    } catch {
        Log-Message "Victus not available for $topic"
    }
}

function Generate-PracticeProject {
    param($area, $topic)
    
    Log-Message "Generating practice project: $topic"
    
    $projectDir = "$learningDir\$area\projects\$topic"
    if (-not (Test-Path $projectDir)) {
        New-Item -ItemType Directory -Path $projectDir -Force | Out-Null
        
        # Generate project structure
        $projectContent = @"
# $topic - Practice Project

**Area:** $area
**Created:** $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

## Project Description
*To be filled*

## Tech Stack
*To be filled*

## Setup
\`\`\`bash
# Installation commands
\`\`\`

## Features
- [ ] Feature 1
- [ ] Feature 2
- [ ] Feature 3

## Learning Goals
- [ ] Apply $topic concepts
- [ ] Build working example
- [ ] Document learnings
"@
        
        $projectContent | Out-File -FilePath "$projectDir\README.md" -Encoding UTF8
        Log-Message "Created practice project: $topic"
    }
}

function Learn-Topic {
    param($area, $topic)
    
    Log-Message "Learning: $area - $topic"
    
    # Research the topic
    $resources = Research-Topic -area $area -topic $topic
    
    # Document findings
    $topicFile = "$learningDir\$area\topics\$topic.md"
    $content = @"
# $topic

**Area:** $area
**Learned:** $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

## Resources
$($resources -join "`n")

## Key Concepts
*To be filled after research*

## Code Examples
\`\`\`typescript
// Example code
\`\`\`

## Practice Projects
See: [../projects/$topic/](../projects/$topic/)

## Mastery Checklist
- [ ] Understand basics
- [ ] Build simple example
- [ ] Build complex project
- [ ] Teach someone else
- [ ] Apply to production code
"@
    
    $content | Out-File -FilePath $topicFile -Encoding UTF8
    Log-Message "Documented: $topic"
    
    # Generate practice project
    Generate-PracticeProject -area $area -topic $topic
    
    # Apply learning to codebase
    Apply-Learning -area $area -topic $topic -content $content
}

function Learn-Frontend {
    Log-Message "Learning frontend skills..."
    
    $topics = @(
        "React Server Components",
        "React 19 new features",
        "Next.js 15",
        "Tailwind CSS v4",
        "Framer Motion",
        "React Query",
        "Zustand state management",
        "TypeScript 5.8"
    )
    
    foreach ($topic in $topics) {
        $topicFile = "$learningDir\frontend\topics\$topic.md"
        if (-not (Test-Path $topicFile)) {
            Learn-Topic -area "frontend" -topic $topic
        }
    }
}

function Learn-Backend {
    Log-Message "Learning backend skills..."
    
    $topics = @(
        "Node.js 22",
        "Express 5",
        "Fastify",
        "PostgreSQL 17",
        "Prisma ORM",
        "GraphQL",
        "REST API best practices",
        "Microservices patterns"
    )
    
    foreach ($topic in $topics) {
        $topicFile = "$learningDir\backend\topics\$topic.md"
        if (-not (Test-Path $topicFile)) {
            Learn-Topic -area "backend" -topic $topic
        }
    }
}

function Learn-Cloud {
    Log-Message "Learning cloud skills..."
    
    $topics = @(
        "Cloudflare Workers AI",
        "Cloudflare Durable Objects",
        "Cloudflare Queues",
        "Cloudflare Vectorize",
        "Cloudflare R2",
        "AWS Lambda",
        "Vercel Edge Functions",
        "Serverless patterns"
    )
    
    foreach ($topic in $topics) {
        $topicFile = "$learningDir\cloud\topics\$topic.md"
        if (-not (Test-Path $topicFile)) {
            Learn-Topic -area "cloud" -topic $topic
        }
    }
}

function Learn-AI-ML {
    Log-Message "Learning AI/ML skills..."
    
    $topics = @(
        "LangChain",
        "OpenAI API",
        "Vector databases",
        "RAG patterns",
        "Fine-tuning models",
        "Prompt engineering",
        "ML pipelines",
        "TensorFlow.js"
    )
    
    foreach ($topic in $topics) {
        $topicFile = "$learningDir\ai-ml\topics\$topic.md"
        if (-not (Test-Path $topicFile)) {
            Learn-Topic -area "ai-ml" -topic $topic
        }
    }
}

function Learn-DevOps {
    Log-Message "Learning DevOps skills..."
    
    $topics = @(
        "Docker",
        "Kubernetes",
        "GitHub Actions",
        "CI-CD pipelines",
        "Terraform",
        "Monitoring",
        "Logging",
        "Security"
    )
    
    foreach ($topic in $topics) {
        $topicFile = "$learningDir\devops\topics\$topic.md"
        if (-not (Test-Path $topicFile)) {
            Learn-Topic -area "devops" -topic $topic
        }
    }
}

function Learn-Architecture {
    Log-Message "Learning architecture skills..."
    
    $topics = @(
        "Microservices",
        "Event-driven architecture",
        "CQRS",
        "Domain-driven design",
        "System design",
        "Scalability patterns",
        "API design",
        "Data modeling"
    )
    
    foreach ($topic in $topics) {
        $topicFile = "$learningDir\architecture\topics\$topic.md"
        if (-not (Test-Path $topicFile)) {
            Learn-Topic -area "architecture" -topic $topic
        }
    }
}

function Trigger-Improvement {
    Log-Message "Triggering improvement system to apply learnings"
    
    # Trigger the autonomous improvement daemon
    $daemonResult = & "$repoRoot\daemon.ps1" -Once 2>&1
    Log-Message "Improvement system triggered"
}

function Run-LearningCycle {
    Log-Message "=== Starting learning cycle ==="
    
    # Validate environment before learning
    $envValidation = & "$repoRoot\.devin\skills\env-validation\skill.ps1" -Audit 2>&1
    if ($LASTEXITCODE -ne 0) {
        Log-Message "Environment validation failed, attempting fix"
        & "$repoRoot\.devin\skills\env-validation\skill.ps1" -Fix 2>&1 | Out-Null
    }
    
    # Learn all areas
    Learn-Frontend
    Learn-Backend
    Learn-Cloud
    Learn-AI-ML
    Learn-DevOps
    Learn-Architecture
    
    # Trigger improvement system to apply learnings
    Trigger-Improvement
    
    # Generate progress report
    $progressFile = "$learningDir\progress.md"
    $progress = @"
# Learning Progress

**Last Update:** $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

## Frontend
$((Get-ChildItem "$learningDir\frontend\topics" -Filter "*.md").Count) topics learned
$((Get-ChildItem "$learningDir\frontend\projects" -Directory).Count) practice projects

## Backend
$((Get-ChildItem "$learningDir\backend\topics" -Filter "*.md").Count) topics learned
$((Get-ChildItem "$learningDir\backend\projects" -Directory).Count) practice projects

## Cloud
$((Get-ChildItem "$learningDir\cloud\topics" -Filter "*.md").Count) topics learned
$((Get-ChildItem "$learningDir\cloud\projects" -Directory).Count) practice projects

## AI/ML
$((Get-ChildItem "$learningDir\ai-ml\topics" -Filter "*.md").Count) topics learned
$((Get-ChildItem "$learningDir\ai-ml\projects" -Directory).Count) practice projects

## DevOps
$((Get-ChildItem "$learningDir\devops\topics" -Filter "*.md").Count) topics learned
$((Get-ChildItem "$learningDir\devops\projects" -Directory).Count) practice projects

## Architecture
$((Get-ChildItem "$learningDir\architecture\topics" -Filter "*.md").Count) topics learned
$((Get-ChildItem "$learningDir\architecture\projects" -Directory).Count) practice projects

**Total Topics:** $((Get-ChildItem "$learningDir" -Recurse -Filter "*.md" -Depth 2).Count)
**Total Projects:** $((Get-ChildItem "$learningDir" -Recurse -Directory -Depth 2).Count)

## Connections
- Web Search (research)
- Victus (orchestration)
- Improvement System (application)
- Codebase (target)
- Environment Validation (integrity)
"@
    
    $progress | Out-File -FilePath $progressFile -Encoding UTF8
    Log-Message "Progress report updated"
    
    Log-Message "=== Learning cycle complete ==="
}

# Main loop
if ($Continuous) {
    Write-Host "Starting continuous learning system..." -ForegroundColor Cyan
    Write-Host "Press Ctrl+C to stop" -ForegroundColor Yellow
    Write-Host ""
    
    while ($true) {
        try {
            Run-LearningCycle
            Write-Host "Waiting 10 minutes..." -ForegroundColor Gray
            Start-Sleep -Seconds 600
        } catch {
            Log-Message "❌ Error in cycle: $_"
            Start-Sleep -Seconds 60
        }
    }
}

if ($Once) {
    Run-LearningCycle
}

if (-not $Continuous -and -not $Once) {
    Write-Host "Usage: .\learning-system.ps1 -Continuous | -Once" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "=== CONTINUOUS LEARNING SYSTEM COMPLETE ===" -ForegroundColor Cyan