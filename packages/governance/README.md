# @aether/governance

Audit, evaluation, and policy guardrails.

## Components

- AuditMiddleware — Decision logging
- JudgeAgent — Offline evaluation
- PolicyGuardrails — Confidence/latency limits
- DecisionRecord — Intent/outcome tracking

## Usage

```typescript
import { AuditMiddleware } from '@aether/governance';
const audit = new AuditMiddleware();