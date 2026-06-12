# Governance Model

## Overview

The `@aether/governance` package provides audit, evaluation, and policy guardrails for the agent system.

## Components

### Audit Middleware

Logs all decisions with context for compliance and debugging.

```typescript
import { AuditMiddleware } from '@aether/governance';

const audit = new AuditMiddleware();
app.use(audit.middleware());
```

### Judge Agent

Offline evaluation of agent decisions against policies.

### Policy Guardrails

- Confidence thresholds
- Latency limits
- Action allow-lists
- Resource usage limits

### Decision Records

```typescript
interface DecisionRecord {
  traceId: string;
  timestamp: number;
  intent: string;
  outcome: string;
  confidence: number;
  latency: number;
}
```

## Usage

```typescript
import { AuditMiddleware, PolicyGuardrails, JudgeAgent } from '@aether/governance';

// Audit all decisions
const audit = new AuditMiddleware();

// Enforce policies
const guardrails = new PolicyGuardrails({
  maxConfidence: 0.9,
  maxLatency: 5000,
});

// Evaluate decisions
const judge = new JudgeAgent();
const evaluation = await judge.evaluate(decisionRecord);