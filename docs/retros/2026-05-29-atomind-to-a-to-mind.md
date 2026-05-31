# Retro: atomind.io → a-to-mind.com Rename

**Date:** 2026-05-29  
**Project:** Domain rename (atomind.io → a-to-mind.com)  
**PRs:** #42 (pre-merge bot), #43 (smoke test v2), #44 (route additions), #46 (rename sweep)  

---

## What We Did

1. **Operator registered** `a-to-mind.com` via Cloudflare Registrar (zone auto-active, no NS swap needed)
2. **PR #46** (OpenHands): Repo-wide sweep — `atomind.io` → `a-to-mind.com` in docs/scripts
3. **PR #44** (OpenHands): Added `[[routes]]` blocks to aether-bridge + notion-worker wrangler.toml
4. **PR #43** (OpenHands): Rebased smoke test v2 + worker catalog with domain updates
5. **PR #48** (OpenHands): Added `assert_string_absent` to smoke script
6. **PR #49** (OpenHands): Spec'd VERIFY-0001 prompt template for future renames

---

## What Worked

| Practice | Outcome |
|----------|---------|
| **Read-only smoke test** (`curl` route checks) | Fast, safe, no mutations |
| **Separate PRs** (docs vs routes vs smoke) | Clear ownership, easy rollback |
| **Domain-agnostic assertions** (`string_absent` pattern) | Reusable for next rename |
| **Blocking on pre-merge bot** | Prevents incomplete renames from merging |

---

## What to Do Differently Next Time

| Issue | Fix |
|-------|-----|
| Route changes scattered across Workers | Create a `ROUTING_PLAN.md` with all Worker routes in one place |
| No automated domain-grep gate | Run `git grep atomind.io` as CI assertion (VERIFY-0001 string_absent) |
| Routes added to wrangler.toml without deploy verification | Add post-deploy smoke test to CI pipeline |
| 6+ PRs for single rename | Consolidate into rename umbrella PR next time |
| CF API blocked for route verification | Ensure CF credentials available before rename kicks off |

---

## Lane Discipline Example (PR #44)

PR #44 demonstrated good lane discipline:
- OpenHands owned the repo-side route additions only
- Devin was assigned the Worker-side route additions separately
- No duplicate work, clear ownership

**Lesson:** When a rename touches multiple deployment contexts, explicitly assign each context to a single owner. No overlap.

---

## What's Pending

| Item | Status | Blocker |
|------|--------|---------|
| Deploy aether-bridge + notion-worker | Pending | CF credentials for `wrangler deploy` |
| Other Workers (aether, homebase, etc.) | Pending | Devin owns |
| DNS verification | Pending | Routes must be deployed first |
| Delete atomind.io zone | Pending | Operator action |

---

## Next Rename Checklist

```markdown
- [ ] Register new domain + confirm zone active
- [ ] Add routes to all wrangler.toml files (owner per Worker)
- [ ] Open single umbrella PR for all domain changes
- [ ] Add VERIFY-0001 string_absent gate (git grep new_domain in old_domain files)
- [ ] CI smoke test with domain assertions
- [ ] Deploy all Workers
- [ ] Verify DNS resolves for all routes
- [ ] Delete old zone from CF dashboard
```

---

## Related PRs

- PR #42: `feat(ci): pre-merge validation bot` (Viktor)
- PR #43: `feat: add smoke test v2 runbook and worker catalog` (OpenHands)
- PR #44: `feat: add a-to-mind.com custom domain routes` (OpenHands)
- PR #46: `chore: rename atomind.io → a-to-mind.com` (OpenHands)
- PR #48: `feat(smoke): add assert_string_absent assertion` (OpenHands)
- PR #49: `docs(verifier): add VERIFY-0001 prompt template v0` (OpenHands)
