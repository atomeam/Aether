# @aether/chaos

Chaos engineering for testing system resilience.

## Features

- Blast radius caps
- Quarantine for failed components
- Canary deployment testing
- Auto-revert with checkpoints
- Synthetic failure injection

## Usage

```typescript
import { injectChaos, revertChaos } from '@aether/chaos';
await injectChaos('broken_package_json', { blastRadius: 1 });
await revertChaos();