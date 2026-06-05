# ============================================================
# NOTION x DEVIN — Integration Superpackage
# Wires Devin CLI to the Notion MCP server and teaches it how to
# use THIS workspace safely. Read-first; scoped writes only.
# Run from the Aether repo ROOT.
# ============================================================

[CmdletBinding()]
param([switch]$Force, [switch]$TryConnect)

$ErrorActionPreference = "Stop"
function Ok($m){ Write-Host "  [OK] $m" -ForegroundColor Green }
function Warn($m){ Write-Host "  [!!] $m" -ForegroundColor Yellow }
function Step($m){ Write-Host "`n=== $m ===" -ForegroundColor Cyan }

if (-not (Test-Path ".git")) { throw "Run from the Aether repo ROOT (no .git found)." }
$repo = (Resolve-Path ".").Path
function Save($Path,$Content){
    $dir = Split-Path -Parent $Path
    if ($dir -and -not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
    if ((Test-Path $Path) -and -not $Force) { Warn "exists, skipped (-Force): $Path"; return }
    $enc = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText(($repo + [IO.Path]::DirectorySeparatorChar + ($Path -replace '/','\')), ($Content -replace "`r`n","`n"), $enc)
    Ok "wrote $Path"
}

# ------------------------------------------------------------
# 1. MCP server entry (merge into .devin/config.json)
# ------------------------------------------------------------
Step "Register Notion MCP server in .devin/config.json"
$cfgPath = ".devin/config.json"
try {
    if (Test-Path $cfgPath) {
        $cfg = Get-Content $cfgPath -Raw | ConvertFrom-Json
    } else {
        $cfg = [pscustomobject]@{}
    }
    $notion = [pscustomobject]@{ url = "https://mcp.notion.com/mcp"; transport = "http" }
    if (-not $cfg.PSObject.Properties.Name -contains "mcpServers") {
        $cfg | Add-Member -NotePropertyName "mcpServers" -NotePropertyValue ([pscustomobject]@{}) -Force
    }
    $cfg.mcpServers | Add-Member -NotePropertyName "notion" -NotePropertyValue $notion -Force
    ($cfg | ConvertTo-Json -Depth 25) | Set-Content -Path $cfgPath -Encoding utf8
    Ok "mcpServers.notion -> https://mcp.notion.com/mcp"
} catch { Warn "couldn't auto-edit config.json ($($_.Exception.Message)); add the mcpServers.notion block manually." }

# ------------------------------------------------------------
# 2. SKILL — how Devin should use Notion
# ------------------------------------------------------------
Step "Notion usage skill"
Save ".devin/notion/SKILL.md" @'
# Skill: Notion (workspace integration)

## Posture
- READ-FIRST. Default to read/search. Writes are the exception, not the habit.
- Before acting, pull live context from the canonical pages (see CONTRACT.md).
- Resolve pages by title via Notion search; cache the resolved URL in CONTRACT.md.

## Read flow (every meaningful task)
1. Read North Star + Profit scoreboard -> state which metric this task moves.
2. Read the Runs ledger -> avoid duplicating prior work; continue the loop.
3. Read role cards / connections pages if the task touches ownership lanes.

## Write flow (rare, scoped)
- ONLY write to the Runs ledger (append a run row). Nothing else without explicit OK.
- Never edit North Star, Profit scoreboard, role cards, or protocol pages.
- Every write must carry evidence: PR link + verbatim check output + RUN id.

## Hard floor
- No invented executions. If you didn't run it, don't log it as done.
- If a write target is ambiguous, STOP and ask. Don't guess a page.
'@

# ------------------------------------------------------------
# 3. CONTRACT — the read/write map (operator fills real URLs once)
# ------------------------------------------------------------
Step "Read/write contract"
Save ".devin/notion/CONTRACT.md" @'
# Notion Contract — what Devin may touch

> Operator: paste the real notion.so URL next to each page once (Devin can also
> resolve by title via search and fill these in on first run).

## READ (allowed, encouraged)
| Page (by title)            | URL | Why |
|----------------------------|-----|-----|
| North Star                 |     | Direction / priority |
| Profit scoreboard          |     | Which metric a task moves |
| Mission: Close the loop    |     | Current mission framing |
| Runs ledger                |     | Prior work, avoid dupes |
| Autonomy Paste System v1   |     | Standard paste/run templates |
| The Chair Protocol v0      |     | Governance / approval rules |
| Devin role card            |     | Devin's lane + limits |
| Devin's Current Connections|     | What's wired vs blocked |

## WRITE (allowed, scoped)
| Page (by title) | URL | Allowed write |
|-----------------|-----|---------------|
| Runs ledger     |     | APPEND a run row only (PR link + evidence + RUN id) |

## WRITE (forbidden)
- North Star, Profit scoreboard, role cards, protocol pages, anything not listed above.
'@

# ------------------------------------------------------------
# 4. SYNC — RUN pack -> Notion Runs ledger convention
# ------------------------------------------------------------
Step "Run-sync convention"
Save ".devin/notion/SYNC.md" @'
# RUN -> Notion sync (Runs ledger only)

When a task closes with a PASS verdict, append ONE row to the Runs ledger:
- Date / RUN id
- Task (one line) + which North Star/scoreboard metric it moved
- PR link
- Evidence: verbatim "ALL GREEN" (typecheck/lint/tests) summary
- Verdict: PASS (+ verifier note)

Rules:
- One row per merged/opened PR. No row without a PR link + evidence.
- If write access is blocked, write the row to runs/<date>/notion-row.md instead,
  and flag it as PENDING-SYNC for a human to paste.
'@

# ------------------------------------------------------------
# 5. ALLOWLIST REQUEST — for the org admin (since MCP is gated)
# ------------------------------------------------------------
Step "Admin allowlist request"
Save ".devin/notion/ALLOWLIST_REQUEST.md" @'
# Request: allowlist Notion MCP for Devin

To: workspace/org admin
Ask: Please allowlist the MCP endpoint  https://mcp.notion.com/mcp  for Devin.

Scope (phase 1, low risk): READ-ONLY.
- Devin reads canonical context (North Star, Profit scoreboard, Runs ledger) so it
  stops relying on manually pasted context.
Phase 2 (after review): scoped WRITE limited to appending rows to the Runs ledger.

Why it is safe:
- Read-only first; no write scope until reviewed.
- Devin remains PR-only on code; Notion writes (later) are append-only to one page.
- All actions evidence-gated; no destructive operations.
'@

# ------------------------------------------------------------
# 6. VERIFY — confirm the connection once allowlisted
# ------------------------------------------------------------
Step "Verify helper"
Save ".devin/notion/verify.ps1" @'
Write-Host "-> devin mcp list" -ForegroundColor Cyan
$out = & cmd /c "devin mcp list 2>&1"
$out
if ($out -match "notion") { Write-Host "Notion MCP present." -ForegroundColor Green }
else { Write-Host "Notion MCP NOT listed (likely org-allowlist blocked)." -ForegroundColor Yellow }
'@

# ------------------------------------------------------------
# 7. Best-effort connect (will fail if org allowlist blocks it)
# ------------------------------------------------------------
if ($TryConnect) {
    Step "Attempting devin mcp add + login (best-effort)"
    & cmd /c "devin mcp add notion https://mcp.notion.com/mcp 2>&1"
    & cmd /c "devin mcp login notion 2>&1"
    & cmd /c "devin mcp list 2>&1"
    Warn "If 'notion' is absent above, the org allowlist is still blocking it (see ALLOWLIST_REQUEST.md)."
}

Step "Done - Notion x Devin superpackage installed"
Write-Host "  config:   .devin/config.json         (mcpServers.notion)"
Write-Host "  skill:    .devin/notion/SKILL.md"
Write-Host "  contract: .devin/notion/CONTRACT.md  (fill real URLs once)"
Write-Host "  sync:     .devin/notion/SYNC.md"
Write-Host "  unblock:  .devin/notion/ALLOWLIST_REQUEST.md"
Write-Host "  verify:   .devin/notion/verify.ps1"
Ok "Read-only first. Scoped writes later. Evidence always."