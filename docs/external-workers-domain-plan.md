# External Workers Custom Domain Plan

**Status**: RESEARCH COMPLETE - AWAITING CF AGENT VERIFICATION  
**Date**: 2026-05-29  
**Zone ID**: `f14fc312aa45f081586a59053b442017` (a-to-mind.com)

---

## Overview

This document outlines the custom domain configuration plan for external Cloudflare Workers that are not part of the Aether monorepo but are part of the a-to-mind.com ecosystem.

**External Workers Identified**:
- `billing-worker` - Stripe webhook handler
- `grants-api` - Grants API service

---

## Current State Assessment

### billing-worker

**Known Information** (from worker-catalog.md):
- **Purpose**: Stripe webhook handler
- **Current Route**: Unknown (not deployed via Aether monorepo)
- **Queue**: Stripe webhook queue
- **MCP**: Stripe ×2 configured, unwired
- **Owner**: Viktor
- **Deployment**: External to Aether monorepo

**Research Findings**:
- ❌ Could not locate billing-worker in atomeam GitHub organization
- ❌ No public repository found
- ❌ Current production routes unknown
- ⚠️ **REQUIRES**: Operator to provide repository location or CF dashboard access

**Recommended Custom Domain**: `billing.a-to-mind.com`

### grants-api

**Known Information** (from worker-catalog.md):
- **Purpose**: Grants API
- **Current Route**: Unknown (not deployed via Aether monorepo)
- **KV**: grants-api-KV exists in Cloudflare (confirmed)
- **Owner**: Viktor
- **Deployment**: External to Aether monorepo

**Research Findings**:
- ❌ Could not locate grants-api in atomeam GitHub organization
- ❌ No public repository found
- ❌ Current production routes unknown
- ✅ **CONFIRMED**: grants-api-KV namespace exists in Cloudflare
- ⚠️ **REQUIRES**: Operator to provide repository location or CF dashboard access

**Recommended Custom Domain**: `grants.a-to-mind.com`

---

## DNS and Zone Prerequisites

### Zone Configuration

**Target Zone**: `a-to-mind.com` (Zone ID: `f14fc312aa45f081586a59053b442017`)

**Current Status**:
- ✅ Zone exists and is active
- ✅ Zone is under Cloudflare Registrar (NS locked)
- ✅ METRICS KV namespace verified: `49202b2460a74d2dbd6d747d35dda5b7`

### DNS Prerequisites

**Required DNS Records** (to be created by CF agent on first deploy):

| Subdomain | Type | Value | Purpose |
|----------|------|-------|---------|
| `billing` | CNAME | `billing-worker.workers.dev` (or current worker domain) | billing-worker custom domain |
| `grants` | CNAME | `grants-api.workers.dev` (or current worker domain) | grants-api custom domain |

**SSL/TLS Prerequisites**:
- ✅ Cloudflare automatically provisions SSL certificates for custom domains
- ✅ No manual SSL configuration required
- ✅ Certificates provisioned within 24 hours of DNS propagation

---

## Custom Domain Configuration Plan

### Implementation Approach

**Option A: wrangler.toml Configuration** (Recommended)
- Add custom domain routes to each worker's wrangler.toml
- Use `routes = [{ pattern = "subdomain.a-to-mind.com", custom_domain = true }]` syntax
- CNAME records auto-create on first deploy

**Option B: Cloudflare Dashboard Configuration**
- Manual configuration via Cloudflare Dashboard
- Custom Domains → Workers → Add custom domain
- Requires manual CNAME record creation

### Configuration Templates

#### billing-worker wrangler.toml

```toml
routes = [
  { pattern = "billing.a-to-mind.com", custom_domain = true }
]
```

#### grants-api wrangler.toml

```toml
routes = [
  { pattern = "grants.a-to-mind.com", custom_domain = true }
]
```

---

## Blocking Issues

### Information Gaps

1. **Repository Locations**: Neither billing-worker nor grants-api repositories found in atomeam GitHub organization
2. **Current Routes**: Unknown what domains these workers currently use
3. **Deployment Method**: Unknown if deployed via wrangler or Cloudflare Dashboard
4. **Access**: No access to CF dashboard to verify current worker configurations

### Required Actions

**For Operator**:
1. **Provide repository locations** for billing-worker and grants-api
2. **Grant CF dashboard access** or provide current worker configurations
3. **Confirm deployment method** (wrangler vs dashboard)
4. **Verify current production domains** for both workers

**For CF Agent** (after information provided):
1. **Verify current worker configurations** in CF dashboard
2. **Confirm grants-api-KV binding** is correct
3. **Identify any existing custom domains** that need migration
4. **Execute custom domain configuration** once plan approved

---

## Migration Path

### Phase 1: Discovery (BLOCKED)
- [ ] Locate billing-worker repository
- [ ] Locate grants-api repository
- [ ] Verify current production domains
- [ ] Document existing custom domains (if any)

### Phase 2: Configuration (BLOCKED)
- [ ] Add custom domain routes to wrangler.toml files
- [ ] Test configuration locally with wrangler dev
- [ ] Verify no conflicts with existing routes

### Phase 3: Deployment (BLOCKED)
- [ ] Deploy billing-worker with new custom domain
- [ ] Deploy grants-api with new custom domain
- [ ] Verify CNAME records auto-created
- [ ] Test SSL certificate provisioning

### Phase 4: DNS Cutover (BLOCKED)
- [ ] Update DNS records if needed
- [ ] Monitor SSL certificate provisioning
- [ ] Verify custom domains are accessible
- [ ] Update worker-catalog.md with new routes

---

## Risk Assessment

### Low Risk
- ✅ Zone is already under Cloudflare management
- ✅ SSL auto-provisioning is reliable
- ✅ Custom domain configuration is well-tested

### Medium Risk
- ⚠️ Unknown current configurations may have dependencies
- ⚠️ DNS propagation may cause temporary downtime
- ⚠️ Existing integrations may reference current domains

### High Risk
- ❌ **COMPLETE BLOCK**: Repository locations unknown
- ❌ **COMPLETE BLOCK**: Current configurations unknown
- ❌ **COMPLETE BLOCK**: No access to verify state

---

## Next Steps

**Immediate** (Operator):
1. Provide repository locations for billing-worker and grants-api
2. Grant CF dashboard access or provide current configurations
3. Confirm current production domains for both workers

**Follow-up** (CF Agent):
1. Verify current worker configurations in CF dashboard
2. Confirm grants-api-KV binding details
3. Execute custom domain configuration once plan approved
4. Monitor deployment and DNS propagation

**Documentation** (Devin):
1. Update worker-catalog.md once configurations are verified
2. Add external workers to wrangler drift check process
3. Document custom domain configuration patterns

---

## Appendix: Reference Information

**Zone Details**:
- Zone: `a-to-mind.com`
- Zone ID: `f14fc312aa45f081586a59053b442017`
- Registrar: Cloudflare
- NS Status: Locked (permanent)

**Related Documentation**:
- CANONICAL_BINDINGS_MAP.md - Aether bridge bindings
- docs/worker-catalog.md - Complete worker inventory
- AGENTS.md - Lane discipline and resource ID verification rules

**Dependencies**:
- PLAN-B custom domain configuration (Aether monorepo workers)
- PR #47 - KV writers package + Crew Room (provides infrastructure)
- METRICS KV namespace - `49202b2460a74d2dbd6d747d35dda5b7`

---

*Last Updated: 2026-05-29*  
*Status: AWAITING OPERATOR INPUT FOR REPOSITORY LOCATIONS AND CURRENT CONFIGURATIONS*
