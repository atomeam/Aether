# Chaos Engineering

## Overview

The `@aether/chaos` package provides chaos engineering capabilities for testing system resilience.

## Features

### Blast Radius Caps

Limits the number of failures injected per cycle to prevent cascading issues.

### Quarantine

Failed components are quarantined to prevent further damage while investigation occurs.

### Canary Deployment

Tests changes on a small subset before full rollout.

### Auto-Revert

Automatically reverts to last known good state when failures are detected.

### Checkpoint System

Saves state before changes so rollback is possible.

## Synthetic Failure Types

| Type | Description |
|------|-------------|
| `broken_package_json` | Corrupts package.json to test dependency handling |
| `corrupted_env_var` | Modifies environment variables |
| `invalid_syntax` | Introduces syntax errors |
| `missing_dep` | Removes a dependency |
| `network_timeout` | Simulates network failures |

## Usage

```typescript
import { injectChaos, revertChaos } from '@aether/chaos';

// Inject failure
await injectChaos('broken_package_json', { blastRadius: 1 });

// Revert
await revertChaos();
```

## Configuration

```typescript
const CHAOS_CONFIG = {
  maxBlastRadius: 3,        // Max failures per cycle
  quarantineTimeout: 30000,  // 30s quarantine
  canaryPercent: 10,         // 10% of traffic
  autoRevert: true,          // Auto-revert on failure
  checkpointInterval: 60000, // Checkpoint every 60s
};