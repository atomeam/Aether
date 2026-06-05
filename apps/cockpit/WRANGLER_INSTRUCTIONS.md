# Cockpit Worker - Wrangler.toml Configuration Instructions

## For Viktor: Durable Object Binding

The cockpit worker needs a Durable Object binding for the telemetry hub. Please add the following to `apps/cockpit/wrangler.toml`:

```toml
# apps/cockpit/wrangler.toml
# Add this section to enable the TelemetryHub Durable Object

[[durable_objects.bindings]]
name = "TELEMETRY_HUB"
class_name = "TelemetryHub"

[[migrations]]
tag = "v1"
new_sqlite_classes = ["TelemetryHub"]
```

## Required Environment Variables

The cockpit worker needs these secrets (set via `npx wrangler secret put`):

```bash
# For telemetry uplink (Devin's local agent streams here)
npx wrangler secret put UPLINK_TOKEN --env production

# For cockpit browser viewers (WebSocket authentication)
npx wrangler secret put VIEWER_TOKEN --env production

# For KV state ingestion (mech.ps1 push command)
npx wrangler secret put INGEST_TOKEN --env production
```

## Required KV Namespace

The cockpit worker needs a KV namespace for mech state storage:

```bash
npx wrangler kv namespace create MECH_STATE --env production
```

## Route Configuration

Add the cockpit worker to your routing configuration to serve from a subdomain (e.g., `devin.a-to-mind.com`):

```toml
# In your main wrangler.toml or routes configuration
routes = [
  { pattern = "devin.a-to-mind.com/*", zone_name = "a-to-mind.com" }
]
```

## Summary

- **Durable Object**: TelemetryHub for WebSocket fan-out
- **KV Namespace**: MECH_STATE for mech state storage
- **Secrets**: UPLINK_TOKEN, VIEWER_TOKEN, INGEST_TOKEN
- **Purpose**: Real-time telemetry streaming from Devin to cockpit web dashboard

This is telemetry only - no deployment capabilities. The worker cannot deploy anything; it only streams real-time state data.