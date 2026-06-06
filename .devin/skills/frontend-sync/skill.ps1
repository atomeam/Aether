# Frontend Sync Skill
# Automatically syncs frontend UI with backend API capabilities

param(
    [switch]$AutoFix = $true,
    [string]$BackendPath = "apps",
    [string]$FrontendPath = "src",
    [switch]$Verbose
)

Write-Host "=== FRONTEND SYNC SKILL ===" -ForegroundColor Cyan
Write-Host "AutoFix: $AutoFix" -ForegroundColor Yellow
Write-Host "BackendPath: $BackendPath" -ForegroundColor Yellow
Write-Host "FrontendPath: $FrontendPath" -ForegroundColor Yellow
Write-Host ""

# Scan backend for API endpoints
function Get-BackendAPIEndpoints {
    param([string]$Path)
    
    $endpoints = @()
    
    # Scan TypeScript files for API endpoints
    $tsFiles = Get-ChildItem -Path $Path -Recurse -Filter "*.ts" -ErrorAction SilentlyContinue
    
    foreach ($file in $tsFiles) {
        $content = Get-Content $file.FullName -Raw -ErrorAction SilentlyContinue
        
        # Find API endpoint definitions
        if ($content -match 'url\.pathname\s*===\s*["'']([^"'']+)["'']') {
            $endpoints += @{
                Path = $matches[1]
                File = $file.FullName
                Method = if ($content -match 'request\.method\s*===\s*["'']GET["'']') { 'GET' }
                        elseif ($content -match 'request\.method\s*===\s*["'']POST["'']') { 'POST' }
                        elseif ($content -match 'request\.method\s*===\s*["'']PUT["'']') { 'PUT' }
                        elseif ($content -match 'request\.method\s*===\s*["'']DELETE["'']') { 'DELETE' }
                        else { 'ANY' }
            }
        }
    }
    
    return $endpoints
}

# Scan frontend for UI components
function Get-FrontendComponents {
    param([string]$Path)
    
    $components = @()
    
    # Scan React/TypeScript files for components
    $tsxFiles = Get-ChildItem -Path $Path -Recurse -Filter "*.tsx" -ErrorAction SilentlyContinue
    
    foreach ($file in $tsxFiles) {
        $content = Get-Content $file.FullName -Raw -ErrorAction SilentlyContinue
        
        # Find component definitions
        if ($content -match 'export\s+(const|function)\s+(\w+)') {
            $components += @{
                Name = $matches[2]
                File = $file.FullName
                Type = 'Component'
            }
        }
        
        # Find API calls
        if ($content -match 'fetch\(["'']([^"'']+)["'']') {
            $components += @{
                Name = $matches[2]
                File = $file.FullName
                Type = 'APICall'
            }
        }
    }
    
    return $components
}

# Detect mismatches between backend and frontend
function Detect-Mismatches {
    param(
        [array]$BackendEndpoints,
        [array]$FrontendComponents
    )
    
    $mismatches = @()
    
    # Check for backend endpoints without UI components
    foreach ($endpoint in $BackendEndpoints) {
        $hasUI = $FrontendComponents | Where-Object { 
            $_.Type -eq 'APICall' -and $_.Name -like "*$($endpoint.Path)*"
        }
        
        if (-not $hasUI) {
            $mismatches += @{
                Type = 'MISSING_UI'
                Endpoint = $endpoint.Path
                Method = $endpoint.Method
                Severity = 'HIGH'
            }
        }
    }
    
    # Check for UI components without backend endpoints
    foreach ($component in $FrontendComponents) {
        if ($component.Type -eq 'APICall') {
            $hasBackend = $BackendEndpoints | Where-Object { 
                $component.Name -like "*$($_.Path)*"
            }
            
            if (-not $hasBackend) {
                $mismatches += @{
                    Type = 'ORPHAN_UI'
                    Component = $component.Name
                    File = $component.File
                    Severity = 'MEDIUM'
                }
            }
        }
    }
    
    return $mismatches
}

# Auto-generate UI component for missing endpoint
function Generate-UIComponent {
    param(
        [string]$Endpoint,
        [string]$Method,
        [string]$FrontendPath
    )
    
    # Sanitize endpoint name for component
    $componentName = ($Endpoint -replace '/', '-' -replace '-', ' ' -replace ' ', '').Trim()
    if ($componentName.Length -eq 0) {
        $componentName = "ApiEndpoint"
    }
    
    # Capitalize first letter
    $componentName = (Get-Culture).TextInfo.ToTitleCase($componentName.Substring(0, 1)) + $componentName.Substring(1)
    
    $componentFile = "$FrontendPath/components/${componentName}.tsx"
    
    $componentContent = @"
import React, { useState, useEffect } from 'react';
import { Activity } from 'lucide-react';

export function ${componentName}() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch('${Endpoint}');
      const result = await response.json();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 border border-white/5 bg-white/[0.01] rounded-lg">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-blue-400 animate-pulse" />
          <span className="text-sm text-white/60">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 border border-red-500/20 bg-red-500/[0.02] rounded-lg">
        <div className="text-red-400 text-sm">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="p-4 border border-white/5 bg-white/[0.01] rounded-lg">
      <h3 className="text-[10px] font-black uppercase tracking-widest text-white/90 mb-4">
        ${componentName}
      </h3>
      <pre className="text-[8px] text-white/60 font-mono overflow-auto">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}
"@
    
    # Ensure directory exists
    $componentDir = Split-Path $componentFile -Parent
    if (-not (Test-Path $componentDir)) {
        try {
            New-Item -ItemType Directory -Path $componentDir -Force -ErrorAction SilentlyContinue | Out-Null
        } catch {
            Write-Host "⚠️ Failed to create directory: $componentDir" -ForegroundColor Yellow
            return $null
        }
    }
    
    try {
        $componentContent | Out-File -FilePath $componentFile -Encoding utf8 -Force
        Write-Host "✅ Created: $componentFile" -ForegroundColor Green
        return $componentFile
    } catch {
        Write-Host "❌ Failed to create: $componentFile" -ForegroundColor Red
        return $null
    }
}

# Update main App.tsx to include new component
function Update-AppComponent {
    param(
        [string]$ComponentName,
        [string]$FrontendPath
    )
    
    $appFile = "$FrontendPath/App.tsx"
    if (-not (Test-Path $appFile)) {
        Write-Host "⚠️ App.tsx not found at $appFile" -ForegroundColor Yellow
        return $false
    }
    
    $content = Get-Content $appFile -Raw
    
    # Check if component is already imported
    if ($content -match "import.*$ComponentName") {
        Write-Host "✅ Component $ComponentName already imported" -ForegroundColor Green
        return $true
    }
    
    # Add import statement
    $importLine = "import { $ComponentName } from './components/${ComponentName}';"
    $content = $importLine + "`n" + $content
    
    $content | Out-File -FilePath $appFile -Encoding utf8 -Force
    
    Write-Host "✅ Added import for $ComponentName" -ForegroundColor Green
    return $true
}

# Main execution
Write-Host "Scanning backend APIs..." -ForegroundColor Cyan
$backendEndpoints = Get-BackendAPIEndpoints -Path $BackendPath
Write-Host "Found $($backendEndpoints.Count) backend endpoints" -ForegroundColor White
Write-Host ""

Write-Host "Scanning frontend components..." -ForegroundColor Cyan
$frontendComponents = Get-FrontendComponents -Path $FrontendPath
Write-Host "Found $($frontendComponents.Count) frontend components" -ForegroundColor White
Write-Host ""

Write-Host "Detecting mismatches..." -ForegroundColor Cyan
$mismatches = Detect-Mismatches -BackendEndpoints $backendEndpoints -FrontendComponents $frontendComponents
Write-Host "Found $($mismatches.Count) mismatches" -ForegroundColor White
Write-Host ""

if ($mismatches.Count -eq 0) {
    Write-Host "✅ Frontend is in sync with backend" -ForegroundColor Green
    exit 0
}

# Display mismatches
Write-Host "=== MISMATCHES ===" -ForegroundColor Yellow
foreach ($mismatch in $mismatches) {
    if ($mismatch.Type -eq 'MISSING_UI') {
        Write-Host "❌ Missing UI for: $($mismatch.Method) $($mismatch.Endpoint)" -ForegroundColor Red
    } else {
        Write-Host "⚠️ Orphan UI: $($mismatch.Component) in $($mismatch.File)" -ForegroundColor Yellow
    }
}
Write-Host ""

# Auto-fix if enabled
if ($AutoFix) {
    Write-Host "=== AUTO-FIXING ===" -ForegroundColor Green
    $fixedCount = 0
    
    foreach ($mismatch in $mismatches) {
        if ($mismatch.Type -eq 'MISSING_UI') {
            Write-Host "Generating UI for: $($mismatch.Method) $($mismatch.Endpoint)" -ForegroundColor Yellow
            
            try {
                $componentFile = Generate-UIComponent -Endpoint $mismatch.Endpoint -Method $mismatch.Method -FrontendPath $FrontendPath
                Write-Host "✅ Created: $componentFile" -ForegroundColor Green
                
                # Update App.tsx
                $componentName = Split-Path $componentFile -Leaf -Replace '.tsx', ''
                Update-AppComponent -ComponentName $componentName -FrontendPath $FrontendPath
                
                $fixedCount++
            } catch {
                Write-Host "❌ Failed to generate UI for: $($mismatch.Endpoint)" -ForegroundColor Red
            }
        }
    }
    
    Write-Host ""
    Write-Host "✅ Fixed $fixedCount mismatches" -ForegroundColor Green
} else {
    Write-Host "⚠️ Auto-fix disabled. Run with -AutoFix to fix automatically." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== FRONTEND SYNC COMPLETE ===" -ForegroundColor Cyan

exit 0