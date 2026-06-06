# Frontend Sync Skill - Fixed Version
# Automatically syncs frontend UI with backend API capabilities

param(
    [switch]$AutoFix = $true,
    [string]$BackendPath = "apps/backend",
    [string]$FrontendPath = "apps/frontend/src",
    [switch]$Verbose
)

$ErrorActionPreference = "Stop"
$repoRoot = "C:\Users\adamm\Aether"

Write-Host "=== FRONTEND SYNC SKILL ===" -ForegroundColor Cyan
Write-Host "AutoFix: $AutoFix" -ForegroundColor Yellow
Write-Host "BackendPath: $BackendPath" -ForegroundColor Yellow
Write-Host "FrontendPath: $FrontendPath" -ForegroundColor Yellow
Write-Host ""

# Scan backend server.ts for API endpoints
function Get-BackendAPIEndpoints {
    param([string]$Path)
    
    $endpoints = @()
    $serverFile = "$Path/server.ts"
    
    if (-not (Test-Path $serverFile)) {
        Write-Host "⚠️ Backend server.ts not found at $serverFile" -ForegroundColor Yellow
        return $endpoints
    }
    
    $content = Get-Content $serverFile -Raw -ErrorAction SilentlyContinue
    
    # Find all app.get, app.post, app.delete, app.put, app.all calls
    $patterns = @(
        'app\.get\(["'']([^"'']+)["'']',
        'app\.post\(["'']([^"'']+)["'']',
        'app\.delete\(["'']([^"'']+)["'']',
        'app\.put\(["'']([^"'']+)["'']',
        'app\.all\(["'']([^"'']+)["'']'
    )
    
    $methods = @('GET', 'POST', 'DELETE', 'PUT', 'ANY')
    
    for ($i = 0; $i -lt $patterns.Count; $i++) {
        $pattern = $patterns[$i]
        $method = $methods[$i]
        
        if ($content -match $pattern) {
            $endpoints += @{
                Path = $matches[1]
                Method = $method
                File = $serverFile
            }
        }
    }
    
    return $endpoints
}

# Scan frontend for existing API calls
function Get-FrontendAPICalls {
    param([string]$Path)
    
    $apiCalls = @()
    
    # Scan React/TypeScript files for fetch calls
    $tsxFiles = Get-ChildItem -Path $Path -Recurse -Filter "*.tsx" -ErrorAction SilentlyContinue
    $tsFiles = Get-ChildItem -Path $Path -Recurse -Filter "*.ts" -ErrorAction SilentlyContinue
    
    $allFiles = $tsxFiles + $tsFiles
    
    foreach ($file in $allFiles) {
        $content = Get-Content $file.FullName -Raw -ErrorAction SilentlyContinue
        
        # Find fetch calls to localhost:3000
        if ($content -match 'fetch\(["'']([^"'']*localhost:3000[^"'']*)["'']') {
            $apiCalls += @{
                URL = $matches[1]
                File = $file.FullName
            }
        }
        
        # Find fetch calls to /api/
        if ($content -match 'fetch\(["'']([^"'']*\/api\/[^"'']*)["'']') {
            $apiCalls += @{
                URL = $matches[1]
                File = $file.FullName
            }
        }
    }
    
    return $apiCalls
}

# Detect mismatches
function Detect-Mismatches {
    param(
        [array]$BackendEndpoints,
        [array]$FrontendAPICalls
    )
    
    $mismatches = @()
    
    # Check for backend endpoints without frontend calls
    foreach ($endpoint in $BackendEndpoints) {
        $hasCall = $FrontendAPICalls | Where-Object { 
            $_.URL -like "*$($endpoint.Path)*" -or $_.URL -like "*$($endpoint.Path)*"
        }
        
        if (-not $hasCall) {
            $mismatches += @{
                Type = 'MISSING_UI'
                Endpoint = $endpoint.Path
                Method = $endpoint.Method
                Severity = 'HIGH'
            }
        }
    }
    
    return $mismatches
}

# Generate working UI component
function Generate-UIComponent {
    param(
        [string]$Endpoint,
        [string]$Method,
        [string]$FrontendPath
    )
    
    # Sanitize endpoint name for component - include method to make unique
    $cleanEndpoint = ($Endpoint -replace '[^a-zA-Z0-9]', '' -replace '/', '' -replace ':', '')
    $componentName = "${Method}${cleanEndpoint}"
    if ($componentName.Length -eq 0) {
        $componentName = "ApiEndpoint"
    }
    
    # Capitalize first letter
    $componentName = (Get-Culture).TextInfo.ToTitleCase($componentName.Substring(0, 1)) + $componentName.Substring(1)
    
    $componentFile = "$FrontendPath/components/${componentName}.tsx"
    
    # Check if component already exists
    if (Test-Path $componentFile) {
        Write-Host "⚠️ Component already exists: $componentFile" -ForegroundColor Yellow
        return $null
    }
    
    $componentContent = @"
import React, { useState, useEffect } from 'react';
import { Activity, RefreshCw } from 'lucide-react';

export function ${componentName}() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3000${Endpoint}');
      if (!response.ok) {
        throw new Error('HTTP ' + response.status);
      }
      const result = await response.json();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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
        <div className="flex items-center justify-between gap-2">
          <div className="text-red-400 text-sm">Error: {error}</div>
          <button 
            onClick={fetchData}
            className="text-red-400 hover:text-red-300"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 border border-white/5 bg-white/[0.01] rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-white/90">
          ${componentName}
        </h3>
        <button 
          onClick={fetchData}
          className="text-white/60 hover:text-white/90"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
      <pre className="text-[8px] text-white/60 font-mono overflow-auto max-h-64">
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
            New-Item -ItemType Directory -Path $componentDir -Force -ErrorAction Stop | Out-Null
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

# Main execution
Write-Host "Scanning backend APIs..." -ForegroundColor Cyan
$backendEndpoints = Get-BackendAPIEndpoints -Path $BackendPath
Write-Host "Found $($backendEndpoints.Count) backend endpoints" -ForegroundColor White
Write-Host ""

Write-Host "Scanning frontend API calls..." -ForegroundColor Cyan
$frontendAPICalls = Get-FrontendAPICalls -Path $FrontendPath
Write-Host "Found $($frontendAPICalls.Count) frontend API calls" -ForegroundColor White
Write-Host ""

Write-Host "Detecting mismatches..." -ForegroundColor Cyan
$mismatches = Detect-Mismatches -BackendEndpoints $backendEndpoints -FrontendAPICalls $frontendAPICalls
Write-Host "Found $($mismatches.Count) mismatches" -ForegroundColor White
Write-Host ""

if ($mismatches.Count -eq 0) {
    Write-Host "✅ Frontend is in sync with backend" -ForegroundColor Green
    exit 0
}

# Display mismatches
Write-Host "=== MISMATCHES ===" -ForegroundColor Yellow
foreach ($mismatch in $mismatches) {
    Write-Host "❌ Missing UI for: $($mismatch.Method) $($mismatch.Endpoint)" -ForegroundColor Red
}
Write-Host ""

# Auto-fix if enabled
if ($AutoFix) {
    Write-Host "=== AUTO-FIXING ===" -ForegroundColor Green
    $fixedCount = 0
    
    foreach ($mismatch in $mismatches) {
        Write-Host "Generating UI for: $($mismatch.Method) $($mismatch.Endpoint)" -ForegroundColor Yellow
        
        try {
            $componentFile = Generate-UIComponent -Endpoint $mismatch.Endpoint -Method $mismatch.Method -FrontendPath $FrontendPath
            if ($componentFile) {
                $fixedCount++
            }
        } catch {
            Write-Host "❌ Failed to generate UI for: $($mismatch.Endpoint)" -ForegroundColor Red
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