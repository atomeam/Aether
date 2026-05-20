# Curator Consumer (PowerShell)
# 
# Consumes jobs from the Redis queue and invokes Curator evaluation.
# Runs as a long-running process, blocking on BRPOP.
#
# Required env vars:
#   REDIS_URL - Redis connection URL
#   QUEUE_CLAIM_TTL_MS - Claim timeout in ms (default: 300000)
#
# For local testing without Redis, uses file-based fallback.

param(
    [string]$RedisUrl = $env:REDIS_URL,
    [int]$ClaimTtlMs = [int]($env:QUEUE_CLAIM_TTL_MS -or 300000),
    [switch]$Once = $false
)

$ErrorActionPreference = "Stop"

# Queue configuration
$QueueList = "curator:pending"
$ClaimedPrefix = "curator:claimed:"
$ClaimedDir = "$PSScriptRoot/../.queue/claimed"
$PendingDir = "$PSScriptRoot/../.queue/pending"
$DoneDir = "$PSScriptRoot/../.queue/done"

# Ensure directories exist
$null = New-Item -ItemType Directory -Force -Path $ClaimedDir, $PendingDir, $DoneDir | Out-Null

function Write-QueueLog {
    param([string]$Level, [string]$Message, [hashtable]$Payload = @{})
    $entry = @{
        ts = (Get-Date -Format "o")
        kind = "queue"
        level = $Level
        source = "curator-consumer"
        payload = $Payload
    }
    $entry | ConvertTo-Json -Compress | Write-Host
}

function Get-CuratorJob {
    param([string]$Body)
    
    $job = @{
        id = [guid]::NewGuid().ToString()
        payload = $null
        meta = @{
            source = "tier-1"
            receivedAt = (Get-Date -Format "o")
            eventId = $null
        }
    }
    
    try {
        $job.payload = $Body | ConvertFrom-Json
        # Derive eventId from body hash if not provided
        if (-not $job.meta.eventId) {
            $hash = [System.Security.Cryptography.SHA256]::Create().ComputeHash([System.Text.Encoding]::UTF8.GetBytes($Body)) | ForEach-Object { $_.ToString("x2") } -join ""
            $job.meta.eventId = "bodyhash:$hash"
        }
    }
    catch {
        Write-QueueLog "ERROR" "JSON_PARSE_FAILED" @{ body = $Body.Substring(0, [Math]::Min(200, $Body.Length)) }
        return $null
    }
    
    return $job
}

function Invoke-CuratorEvaluation {
    param([hashtable]$Proposal)
    
    # TODO: Wire to actual Curator evaluation
    Write-QueueLog "INFO" "CURATOR_INVOKE" @{ proposalId = $Proposal.id }
    
    return @{ success = $true }
}

function Start-ConsumerLoop {
    Write-QueueLog "INFO" "CONSUMER_STARTED" @{ redis = $RedisUrl }
    
    if ($RedisUrl) {
        # Redis consumer
        $client = New-Object System.Net.WebClient
        $client.Headers.Add("Content-Type", "application/json")
        
        while ($true) {
            try {
                # BRPOP equivalent using polling
                $resp = Invoke-RestMethod -Uri "$RedisUrl/lpop/$QueueList" -Method POST -TimeoutSec 30
                
                if ($resp) {
                    $job = Get-CuratorJob -Body $resp
                    if ($job) {
                        Write-QueueLog "INFO" "JOB_CLAIMED" @{ jobId = $job.id; source = $job.meta.source }
                        
                        # Claim in Redis
                        $claimedKey = "$ClaimedPrefix$($job.id)"
                        $null = Invoke-RestMethod -Uri "$RedisUrl/setex/$claimedKey/$([int]($ClaimTtlMs/1000))/$([System.Uri]::EscapeDataString($resp))" -Method POST
                        
                        try {
                            # Invoke Curator
                            $result = Invoke-CuratorEvaluation -Proposal $job.payload
                            
                            if ($result.success) {
                                # Remove from claimed
                                $null = Invoke-RestMethod -Uri "$RedisUrl/del/$claimedKey" -Method POST
                                Write-QueueLog "INFO" "JOB_COMPLETED" @{ jobId = $job.id }
                            }
                            else {
                                # Re-queue on failure
                                $null = Invoke-RestMethod -Uri "$RedisUrl/lpush/$QueueList/$([System.Uri]::EscapeDataString($resp))" -Method POST
                                $null = Invoke-RestMethod -Uri "$RedisUrl/del/$claimedKey" -Method POST
                                Write-QueueLog "WARN" "JOB_REQUEUED" @{ jobId = $job.id }
                            }
                        }
                        catch {
                            # Release back to pending on exception
                            $null = Invoke-RestMethod -Uri "$RedisUrl/lpush/$QueueList/$([System.Uri]::EscapeDataString($resp))" -Method POST
                            $null = Invoke-RestMethod -Uri "$RedisUrl/del/$claimedKey" -Method POST
                            Write-QueueLog "ERROR" "JOB_FAILED_RELEASED" @{ jobId = $job.id; error = $_.Exception.Message }
                        }
                    }
                }
            }
            catch [System.Net.WebException] {
                if ($_.Exception.Response.StatusCode -eq 204) {
                    # No job available, continue
                    Start-Sleep -Milliseconds 1000
                }
                else {
                    Write-QueueLog "ERROR" "REDIS_ERROR" @{ error = $_.Exception.Message }
                    Start-Sleep -Seconds 5
                }
            }
            catch {
                Write-QueueLog "ERROR" "CONSUMER_ERROR" @{ error = $_.Exception.Message }
                Start-Sleep -Seconds 5
            }
            
            if ($Once) { break }
        }
    }
    else {
        # File-based fallback
        Write-QueueLog "WARN" "USING_FILE_QUEUE" @{}
        
        while ($true) {
            try {
                $files = Get-ChildItem -Path $PendingDir -Filter "*.json" | Sort-Object LastWriteTime | Select-Object -First 1
                
                foreach ($file in $files) {
                    $body = Get-Content -Path $file.FullName -Raw
                    $job = Get-CuratorJob -Body $body
                    
                    if ($job) {
                        # Move to claimed
                        $claimedFile = Join-Path $ClaimedDir $file.Name
                        Move-Item -Path $file.FullName -Destination $claimedFile -Force
                        
                        Write-QueueLog "INFO" "JOB_CLAIMED" @{ jobId = $job.id; file = $file.Name }
                        
                        try {
                            $result = Invoke-CuratorEvaluation -Proposal $job.payload
                            
                            if ($result.success) {
                                Move-Item -Path $claimedFile -Destination (Join-Path $DoneDir $file.Name) -Force
                                Write-QueueLog "INFO" "JOB_COMPLETED" @{ jobId = $job.id }
                            }
                            else {
                                Move-Item -Path $claimedFile -Destination $file.FullName -Force
                                Write-QueueLog "WARN" "JOB_REQUEUED" @{ jobId = $job.id }
                            }
                        }
                        catch {
                            Move-Item -Path $claimedFile -Destination $file.FullName -Force
                            Write-QueueLog "ERROR" "JOB_FAILED_RELEASED" @{ jobId = $job.id; error = $_.Exception.Message }
                        }
                    }
                }
            }
            catch {
                Write-QueueLog "ERROR" "CONSUMER_ERROR" @{ error = $_.Exception.Message }
            }
            
            Start-Sleep -Milliseconds 1000
            if ($Once) { break }
        }
    }
}

function Start-Reaper {
    # Reclaim expired claims
    if ($RedisUrl) {
        try {
            # Scan claimed keys and re-queue expired
            Write-QueueLog "INFO" "REAPER_SCAN" @{}
            # TODO: Implement SCAN-based reaper
        }
        catch {
            Write-QueueLog "ERROR" "REAPER_ERROR" @{ error = $_.Exception.Message }
        }
    }
    else {
        # File-based reaper
        $expired = Get-ChildItem -Path $ClaimedDir -Filter "*.json" | Where-Object { $_.LastWriteTime -lt (Get-Date).AddMilliseconds(-$ClaimTtlMs) }
        
        foreach ($file in $expired) {
            $pendingFile = Join-Path $PendingDir $file.Name
            Move-Item -Path $file.FullName -Destination $pendingFile -Force
            Write-QueueLog "INFO" "REAPER_RECLAIMED" @{ file = $file.Name }
        }
    }
}

# Run reaper on startup
Start-Reaper

# Start consumer
Start-ConsumerLoop