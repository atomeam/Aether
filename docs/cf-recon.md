# CF Recon — Cloudflare Inventory via GitHub Actions

A workflow_dispatch workflow that queries Cloudflare resource inventory using the repo's CF_API_TOKEN secret. No auto-triggers — manual only.

## Usage
```bash
gh workflow run cf-recon.yml
gh run watch
gh run view --log
```

## Jobs
- whoami        — validates token + account
- kv            — lists all KV namespaces
- d1            — lists all D1 databases
- r2            — lists all R2 buckets
- deployments   — lists recent aether-bridge deploys

## Security
- workflow_dispatch only — never triggers on push/PR
- Uses existing CF_API_TOKEN + CF_ACCOUNT_ID GitHub secrets
- Output goes to GHA logs only, no artifacts uploaded
