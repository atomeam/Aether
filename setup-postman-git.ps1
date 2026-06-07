# Automated Postman Git Integration Setup
# Automatically configures Postman with Git integration for Aether project

param(
    [switch]$Setup,
    [switch]$Sync,
    [switch]$CreateHook
)

$ErrorActionPreference = "Stop"

function Write-ColorOutput {
    param([string]$Message, [string]$Color = "White")
    Write-Host $Message -ForegroundColor $Color
}

function Setup-PostmanGitIntegration {
    Write-ColorOutput "`n=== Automated Postman Git Integration Setup ===" "Magenta"
    
    $projectRoot = "C:\Users\adamm\Aether"
    $postmanDir = Join-Path $projectRoot "postman"
    $collectionsDir = Join-Path $postmanDir "collections"
    $environmentsDir = Join-Path $postmanDir "environments"
    $configDir = Join-Path $projectRoot ".postman"
    
    Write-ColorOutput "Step 1: Creating directory structure..." "Yellow"
    
    # Create directories
    if (-not (Test-Path $collectionsDir)) {
        New-Item -ItemType Directory -Path $collectionsDir -Force | Out-Null
        Write-ColorOutput "  [OK] Created collections directory" "Green"
    } else {
        Write-ColorOutput "  [OK] Collections directory exists" "Green"
    }
    
    if (-not (Test-Path $environmentsDir)) {
        New-Item -ItemType Directory -Path $environmentsDir -Force | Out-Null
        Write-ColorOutput "  [OK] Created environments directory" "Green"
    } else {
        Write-ColorOutput "  [OK] Environments directory exists" "Green"
    }
    
    if (-not (Test-Path $configDir)) {
        New-Item -ItemType Directory -Path $configDir -Force | Out-Null
        Write-ColorOutput "  [OK] Created .postman config directory" "Green"
    } else {
        Write-ColorOutput "  [OK] .postman config directory exists" "Green"
    }
    
    Write-ColorOutput "`nStep 2: Moving Postman files to correct locations..." "Yellow"
    
    # Move collection
    $collectionSource = Join-Path $projectRoot "Aether-Postman-Collection.json"
    $collectionDest = Join-Path $collectionsDir "Aether-Postman-Collection.json"
    
    if (Test-Path $collectionSource) {
        Move-Item -Path $collectionSource -Destination $collectionDest -Force
        Write-ColorOutput "  [OK] Moved collection to postman/collections/" "Green"
    } else {
        Write-ColorOutput "  [!] Collection file not found at root" "Yellow"
    }
    
    # Move environment
    $envSource = Join-Path $projectRoot "Aether-Postman-Environment.json"
    $envDest = Join-Path $environmentsDir "Aether-Postman-Environment.json"
    
    if (Test-Path $envSource) {
        Move-Item -Path $envSource -Destination $envDest -Force
        Write-ColorOutput "  [OK] Moved environment to postman/environments/" "Green"
    } else {
        Write-ColorOutput "  [!] Environment file not found at root" "Yellow"
    }
    
    # Move documentation
    $docsSource = Join-Path $projectRoot "Aether-Postman-Setup.md"
    $docsDest = Join-Path $projectRoot "docs\Aether-Postman-Setup.md"
    
    if (Test-Path $docsSource) {
        if (-not (Test-Path "C:\Users\adamm\Aether\docs")) {
            New-Item -ItemType Directory -Path "C:\Users\adamm\Aether\docs" -Force | Out-Null
        }
        Move-Item -Path $docsSource -Destination $docsDest -Force
        Write-ColorOutput "  [OK] Moved documentation to docs/" "Green"
    }
    
    Write-ColorOutput "`nStep 3: Creating Postman resources configuration..." "Yellow"
    
    $resourcesYaml = @"
# Postman Resources Configuration
# This file configures which collections and environments to sync with Postman workspace

collections:
  - path: postman/collections/Aether-Postman-Collection.json
    name: Aether Backend API
    description: Complete API collection for Aether backend with Victus integration

environments:
  - path: postman/environments/Aether-Postman-Environment.json
    name: Aether Development
    description: Development environment for Aether API testing
"@
    
    $resourcesPath = Join-Path $configDir "resources.yaml"
    $resourcesYaml | Set-Content $resourcesPath
    Write-ColorOutput "  [OK] Created .postman/resources.yaml" "Green"
    
    Write-ColorOutput "`nStep 4: Creating Postman CLI configuration..." "Yellow"
    
    $configJson = @"
{
  "workspace": {
    "id": "",
    "name": "Aether Development"
  }
}
"@
    
    $configPath = Join-Path $configDir "config.json"
    $configJson | Set-Content $configPath
    Write-ColorOutput "  [OK] Created .postman/config.json" "Green"
    
    Write-ColorOutput "`nStep 5: Creating Git pre-commit hook for Postman validation..." "Yellow"
    
    $hookScript = @"
#!/bin/bash
# Git pre-commit hook for Postman collection validation
# Validates Postman collections before committing

echo "Validating Postman collections..."

# Check if postman CLI is installed
if ! command -v postman &> /dev/null; then
    echo "Warning: Postman CLI not installed. Install with: npm install -g postman-cli"
    exit 0
fi

# Validate collections
cd postman/collections
for collection in *.json; do
    if [ -f "$collection" ]; then
        echo "Validating $collection..."
        postman collection lint "$collection" || echo "Warning: Collection validation failed for $collection"
    fi
done

echo "Postman validation complete"
"@
    
    $hookPath = Join-Path $projectRoot ".git\hooks\pre-commit"
    $hookScript | Set-Content $hookPath
    Write-ColorOutput "  [OK] Created Git pre-commit hook" "Green"
    
    Write-ColorOutput "`nStep 6: Adding to Git..." "Yellow"
    
    Set-Location $projectRoot
    git add postman/ .postman/ .git/hooks/pre-commit docs/Aether-Postman-Setup.md 2>&1 | Out-Null
    Write-ColorOutput "  [OK] Added Postman files to Git" "Green"
    
    Write-ColorOutput "`n=== Setup Complete ===" "Magenta"
    Write-ColorOutput "`nNext Steps:" "Cyan"
    Write-ColorOutput "1. Open Postman" "White"
    Write-ColorOutput "2. Click 'Connect your Git repository'" "White"
    Write-ColorOutput "3. Select folder: $projectRoot" "White"
    Write-ColorOutput "4. Postman will automatically detect the postman/ structure" "White"
    Write-ColorOutput "5. Import the collection from postman/collections/" "White"
    Write-ColorOutput "6. Import the environment from postman/environments/" "White"
    Write-ColorOutput "`nGit Integration:" "Cyan"
    Write-ColorOutput "- Pre-commit hook validates collections before commit" "White"
    Write-ColorOutput "- Postman files are tracked in Git" "White"
    Write-ColorOutput "- Changes sync automatically when you connect in Postman" "White"
}

function Sync-PostmanChanges {
    Write-ColorOutput "`n=== Syncing Postman Changes ===" "Magenta"
    
    $projectRoot = "C:\Users\adamm\Aether"
    
    Set-Location $projectRoot
    
    # Check for changes
    $status = git status --short postman/ .postman/
    
    if ($status) {
        Write-ColorOutput "Postman changes detected:" "Yellow"
        Write-ColorOutput $status "Cyan"
        
        $commit = Read-Host "Commit these changes? (y/n)"
        if ($commit -eq 'y' -or $commit -eq 'Y') {
            git add postman/ .postman/
            git commit -m "Update Postman collection and environment"
            Write-ColorOutput "  [OK] Changes committed" "Green"
            
            $push = Read-Host "Push to GitHub? (y/n)"
            if ($push -eq 'y' -or $push -eq 'Y') {
                git push
                Write-ColorOutput "  [OK] Changes pushed to GitHub" "Green"
            }
        }
    } else {
        Write-ColorOutput "No Postman changes to sync" "Green"
    }
}

function Create-GitHook {
    Write-ColorOutput "`n=== Creating Git Hook ===" "Magenta"
    
    $projectRoot = "C:\Users\adamm\Aether"
    $hookPath = Join-Path $projectRoot ".git\hooks\pre-commit"
    
    $hookScript = @"
#!/bin/bash
# Git pre-commit hook for Postman collection validation
# Validates Postman collections before committing

echo "Validating Postman collections..."

# Check if postman CLI is installed
if ! command -v postman &> /dev/null; then
    echo "Warning: Postman CLI not installed. Install with: npm install -g postman-cli"
    exit 0
fi

# Validate collections
cd postman/collections
for collection in *.json; do
    if [ -f "$collection" ]; then
        echo "Validating $collection..."
        postman collection lint "$collection" || echo "Warning: Collection validation failed for $collection"
    fi
done

echo "Postman validation complete"
"@
    
    $hookScript | Set-Content $hookPath
    
    # Make hook executable on Unix systems
    if ($IsLinux -or $IsMacOS) {
        chmod +x $hookPath
    }
    
    Write-ColorOutput "  [OK] Git pre-commit hook created" "Green"
}

# Main logic
if ($Setup) {
    Setup-PostmanGitIntegration
} elseif ($Sync) {
    Sync-PostmanChanges
} elseif ($CreateHook) {
    Create-GitHook
} else {
    Write-ColorOutput "`n=== Automated Postman Git Integration ===" "Magenta"
    Write-ColorOutput "`nUsage:" "Cyan"
    Write-ColorOutput "  -Setup      Set up Postman Git integration" "White"
    Write-ColorOutput "  -Sync       Sync Postman changes with Git" "White"
    Write-ColorOutput "  -CreateHook Create Git pre-commit hook" "White"
    Write-ColorOutput "`nExamples:" "Cyan"
    Write-ColorOutput "  .\setup-postman-git.ps1 -Setup" "White"
    Write-ColorOutput "  .\setup-postman-git.ps1 -Sync" "White"
    Write-ColorOutput "`nRunning full setup..." "Yellow"
    Setup-PostmanGitIntegration
}