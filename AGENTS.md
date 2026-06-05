# Aether â€” Agent Rules (hotrod)

## Stack
Turborepo / TypeScript / React+Vite / Cloudflare Workers (wrangler) / D1, KV, Queues, R2.
Subdomains: aether, bridge, notion, billing, grants, crew, home.

## Speed rules
- Grep before reading whole files. Read only what you'll edit.
- Smallest diff that satisfies the task. No drive-by refactors.
- typecheck + lint on changed files first; full test suite only before opening the PR.
- Parallelize independent reads/edits.

## Hard floor (do not cross)
- Feature branch + PR only. NEVER push to main.
- NEVER edit wrangler.toml (Viktor's lane).
- NEVER commit secrets (.env/.pem/.key).
- NEVER report "done" without the verbatim command output that proves it.

## Superpackages (available)
- Notion integration: Read-first workspace awareness (requires org allowlist)
- Gemini uplink: Deep reasoning for complex infrastructure (requires GEMINI_API_KEY)

## Done =
changed-file tests green + typecheck + lint clean (paste output) + PR opened.