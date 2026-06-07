
# PowerShell script to authenticate with Google
$ErrorActionPreference = "Stop"

Write-Host "Attempting Google Cloud authentication..."

# Try to use existing credentials if available
try {
    $account = gcloud config list account --format="value(core.account)" 2>$null
    if ($account) {
        Write-Host "Found existing account: $account"
    } else {
        Write-Host "No existing account found"
    }
} catch {
    Write-Host "No gcloud configuration found"
}

# Try to get application default credentials
try {
    $token = gcloud auth application-default print-access-token 2>$null
    if ($token) {
        Write-Host "Successfully obtained access token"
        Write-Host $token
    } else {
        Write-Host "Could not obtain access token"
    }
} catch {
    Write-Host "Failed to get application default credentials"
}

# Try to list projects
try {
    $projects = gcloud projects list --format="json" 2>$null
    if ($projects) {
        Write-Host "Available projects:"
        Write-Host $projects
    }
} catch {
    Write-Host "Could not list projects"
}
