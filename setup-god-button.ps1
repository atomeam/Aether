# ============================================================
# GOD-BUTTON WEBHOOK — execute via GitHub Actions
# One-click execution from cockpit → repository_dispatch → GitHub Actions
# GitHub Actions remains the sole deploy path. Cockpit just triggers it.
# Run from the Aether repo ROOT.
# ============================================================

[CmdletBinding()]
param([switch]$Force)
$ErrorActionPreference = "Stop"
function Ok($m){ Write-Host "  [OK] $m" -ForegroundColor Green }
function Warn($m){ Write-Host "  [!!] $m" -ForegroundColor Yellow }
function Step($m){ Write-Host "`n=== $m ===" -ForegroundColor Cyan }
if (-not (Test-Path ".git")) { throw "Run from the Aether repo ROOT." }
$repo = (Resolve-Path ".").Path
function Save($Path,$Content){
    $dir = Split-Path -Parent $Path
    if ($dir -and -not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
    if ((Test-Path $Path) -and -not $Force) { Warn "exists, skipped (-Force): $Path"; return }
    $enc = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText(($repo+[IO.Path]::DirectorySeparatorChar+($Path -replace '/','\')), ($Content -replace "`r`n","`n"), $enc)
    Ok "wrote $Path"
}

# ------------------------------------------------------------
# 1. GITHUB ACTIONS WORKFLOW — repository_dispatch handler
#    Triggered by cockpit webhook, performs actual deploy
# ------------------------------------------------------------
Step "GitHub Actions workflow (repository_dispatch)"
Save ".github/workflows/god-button.yml" @'
name: God Button - Execute via Cockpit

on:
  repository_dispatch:
    types: [god-button-execute]

jobs:
  execute:
    name: Execute God Button
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Validate Request
        run: |
          echo "Payload: ${{ github.event.client_payload }}"
          PR_NUMBER="${{ github.event.client_payload.pr_number }}"
          if [ -z "$PR_NUMBER" ]; then
            echo "Error: pr_number required in payload"
            exit 1
          fi
          echo "PR Number: $PR_NUMBER"

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 9

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm

      - name: Install Dependencies
        run: pnpm install

      - name: Run Mech Doctor
        run: |
          pwsh -File ./mech.ps1 -Cmd doctor
          if ($LASTEXITCODE -ne 0) { throw "Mech doctor failed" }

      - name: Run Guard Check
        run: |
          pwsh -File ./mech.ps1 -Cmd guard-check
          if ($LASTEXITCODE -ne 0) { throw "Guard check failed" }

      - name: Run Fastcheck
        run: |
          pwsh -File ./.devin/fastcheck.ps1
          if ($LASTEXITCODE -ne 0) { throw "Fastcheck failed" }

      - name: Merge PR
        run: |
          PR_NUMBER="${{ github.event.client_payload.pr_number }}"
          gh pr merge $PR_NUMBER --merge --delete-branch
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      - name: Update Notion Runs Ledger
        run: |
          echo "Would update Notion Runs ledger here"
          echo "PR ${{ github.event.client_payload.pr_number }} merged"
          # This requires Notion MCP write access (currently blocked by allowlist)

      - name: Notify Cockpit
        run: |
          echo "Execution complete. Notify cockpit via telemetry."
          # Send success status to cockpit via telemetry hub
'@

# ------------------------------------------------------------
# 2. COCKPIT API ENDPOINT — authenticated webhook trigger
#    Validates request, then calls GitHub repository_dispatch
# ------------------------------------------------------------
Step "Cockpit API endpoint (webhook trigger)"
Save "apps/cockpit/api/webhook.ts" @'
// God Button webhook endpoint. Triggers GitHub Actions repository_dispatch.
// Cockpit cannot deploy directly - it only triggers GitHub Actions.
export interface Env { GITHUB_TOKEN: string; WEBHOOK_TOKEN: string }

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);

    if (url.pathname === "/api/webhook/execute" && req.method === "POST") {
      // Authenticate webhook request
      if (req.headers.get("authorization") !== `Bearer ${env.WEBHOOK_TOKEN}`) {
        return new Response("unauthorized", { status: 401 });
      }

      const body = await req.json<{ pr_number: number }>();
      if (!body?.pr_number) {
        return new Response("pr_number required", { status: 400 });
      }

      // Trigger GitHub Actions repository_dispatch
      const githubRes = await fetch("https://api.github.com/repos/atomeam/Aether/dispatches", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${env.GITHUB_TOKEN}`,
          "Accept": "application/vnd.github.v3+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          event_type: "god-button-execute",
          client_payload: { pr_number: body.pr_number },
        }),
      });

      if (!githubRes.ok) {
        return new Response(`GitHub API error: ${githubRes.statusText}`, { status: 500 });
      }

      return new Response(JSON.stringify({ ok: true, pr_number: body.pr_number }), {
        headers: { "content-type": "application/json" },
      });
    }

    return new Response("not found", { status: 404 });
  },
};
'@

# ------------------------------------------------------------
# 3. COCKPIT BUTTON COMPONENT — God Button UI
# ------------------------------------------------------------
Step "God Button (React)"
Save "apps/cockpit/src/GodButton.tsx" @'
import { useState } from "react";

export default function GodButton({ prNumber, disabled }: { prNumber: number; disabled?: boolean }) {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  async function execute() {
    setBusy(true);
    setStatus("Triggering GitHub Actions...");
    try {
      const res = await fetch("/api/webhook/execute", {
        method: "POST",
        headers: {
          authorization: `Bearer ${import.meta.env.VITE_COCKPIT_TOKEN}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({ pr_number: prNumber }),
      });
      const data = await res.json();
      if (data.ok) {
        setStatus("✓ GitHub Actions triggered. Check workflow status.");
      } else {
        setStatus(`✗ Failed: ${data.error || "Unknown error"}`);
      }
    } catch (e) {
      setStatus(`✗ Network error: ${(e as Error).message}`);
    }
    setBusy(false);
  }

  return (
    <div style={{ marginTop: 24, padding: 16, background: "#1a1d2a", borderRadius: 12 }}>
      <div style={{ marginBottom: 12 }}>
        <b>🔥 God Button</b>
        <span style={{ marginLeft: 8, opacity: 0.6 }}>PR #{prNumber}</span>
      </div>
      <button
        disabled={disabled || busy}
        onClick={execute}
        style={{
          background: disabled ? "#374151" : "#f59e0b",
          color: "#fff",
          border: 0,
          padding: "12px 24px",
          fontSize: 16,
          borderRadius: 8,
          cursor: disabled ? "not-allowed" : "pointer",
          width: "100%",
        }}
      >
        {busy ? "⏳ Executing..." : "🚀 EXECUTE"}
      </button>
      {status && (
        <div style={{ marginTop: 8, fontSize: 13, opacity: 0.8 }}>{status}</div>
      )}
      <div style={{ marginTop: 8, fontSize: 11, opacity: 0.5 }}>
        Triggers GitHub Actions → runs mech checks → merges PR → updates Notion
      </div>
    </div>
  );
}
'@

# ------------------------------------------------------------
# 4. INTEGRATE INTO COCKPIT
# ------------------------------------------------------------
Step "Integrate God Button into Cockpit"
Save "apps/cockpit/src/Cockpit.tsx" @'
import { useEffect, useState } from "react";
import Hud from "./Hud";
import GodButton from "./GodButton";

type Status = {
  doctor?: { score: number; checks: { name: string; ok: boolean }[] };
  guard?: { alerts: string[] };
  telemetry?: { branch: string; commits_24h: number };
  cie?: { open: number };
  evals?: { passRate: number };
  ejector?: { engaged: boolean };
};

const API = import.meta.env.VITE_COCKPIT_API ?? "/api";

export default function Cockpit() {
  const [s, setS] = useState<Status | null>(null);
  const [busy, setBusy] = useState(false);
  const [prNumber, setPrNumber] = useState(0);

  async function load() { setS(await (await fetch(`${API}/status`)).json()); }
  useEffect(() => { load(); const t = setInterval(load, 5000); return () => clearInterval(t); }, []);

  async function eject(engaged: boolean) {
    setBusy(true);
    await fetch(`${API}/ejector`, { method: "POST", headers: { authorization: `Bearer ${import.meta.env.VITE_COCKPIT_TOKEN}` }, body: JSON.stringify({ engaged }) });
    await load(); setBusy(false);
  }

  const score = s?.doctor?.score ?? 0;
  const armorOk = (s?.guard?.alerts?.length ?? 0) === 0;
  const ejected = s?.ejector?.engaged ?? false;
  const canExecute = score >= 80 && armorOk && !ejected;

  return (
    <div style={{ fontFamily: "ui-sans-serif", padding: 24, background: "#0b0d12", color: "#e6e8ee", minHeight: "100vh" }}>
      <h1>🤖 Devin Cockpit</h1>
      
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 16 }}>
        <Card title="Readiness" value={`${score}%`} good={score >= 80} />
        <Card title="Armor" value={armorOk ? "INTACT" : `${s?.guard?.alerts?.length} ALERTS`} good={armorOk} />
        <Card title="CIE proposals" value={`${s?.cie?.open ?? 0} open`} good />
        <Card title="Eval pass rate" value={`${Math.round((s?.evals?.passRate ?? 0) * 100)}%`} good={(s?.evals?.passRate ?? 0) >= 0.8} />
        <Card title="Branch" value={s?.telemetry?.branch ?? "—"} good />
        <Card title="Commits 24h" value={`${s?.telemetry?.commits_24h ?? 0}`} good />
      </div>

      <div style={{ marginTop: 24 }}>
        <button disabled={busy} onClick={() => eject(!ejected)}
          style={{ background: ejected ? "#16a34a" : "#dc2626", color: "#fff", border: 0, padding: "14px 28px", fontSize: 18, borderRadius: 10, cursor: "pointer" }}>
          {ejected ? "▶ RESUME MECH" : "■ EJECT (kill all loops)"}
        </button>
        {ejected && <span style={{ marginLeft: 12, color: "#fbbf24" }}>Ejector engaged — autonomous loops halted.</span>}
      </div>

      {!armorOk && (
        <div style={{ marginTop: 16, background: "#3b0d0d", padding: 12, borderRadius: 8 }}>
          <b>Armor alerts:</b>
          <ul>{s?.guard?.alerts?.map((a, i) => <li key={i}>{a}</li>)}</ul>
        </div>
      )}

      <div style={{ marginTop: 32 }}>
        <h2 style={{ marginBottom: 16 }}>🧠 Live Nervous System</h2>
        <Hud />
      </div>

      <div style={{ marginTop: 32 }}>
        <h2 style={{ marginBottom: 16 }}>🔥 Execution</h2>
        <div style={{ marginBottom: 16 }}>
          <label>PR Number: </label>
          <input
            type="number"
            value={prNumber}
            onChange={(e) => setPrNumber(parseInt(e.target.value) || 0)}
            style={{ background: "#151823", border: "1px solid #1f2430", color: "#e6e8ee", padding: 8, borderRadius: 4, width: 120 }}
          />
        </div>
        <GodButton prNumber={prNumber} disabled={!canExecute || prNumber === 0} />
        {!canExecute && (
          <div style={{ marginTop: 8, color: "#fbbf24", fontSize: 13 }}>
            God Button disabled: {score < 80 ? "Readiness < 80%" : ""} {!armorOk ? "Armor compromised" : ""} {ejected ? "Ejector engaged" : ""}
          </div>
        )}
      </div>
    </div>
  );
}

function Card({ title, value, good }: { title: string; value: string; good?: boolean }) {
  return (
    <div style={{ background: "#151823", borderRadius: 12, padding: 16, borderLeft: `4px solid ${good ? "#22c55e" : "#ef4444"}` }}>
      <div style={{ opacity: 0.7, fontSize: 13 }}>{title}</div>
      <div style={{ fontSize: 26, fontWeight: 700 }}>{value}</div>
    </div>
  );
}
'@

Step "Done - God Button webhook scaffolded"
Write-Host "  Workflow:   .github/workflows/god-button.yml"
Write-Host "  API:        apps/cockpit/api/webhook.ts"
Write-Host "  Component:  apps/cockpit/src/GodButton.tsx"
Write-Host "  Updated:    apps/cockpit/src/Cockpit.tsx"
Ok "GitHub Actions remains sole deploy path. Cockpit just triggers it."