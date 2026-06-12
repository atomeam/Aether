# @aether/alerts

Alert engine for threshold-based notifications.

## Usage

```typescript
import { AlertEngine } from '@aether/alerts';
const engine = new AlertEngine();
engine.on('alert', (alert) => console.log(alert));
```
</content>
<write_to_file>
<path>c:/Users/adamm/Aether/packages/sandbox/README.md</path>
<content># @aether/sandbox

Sandboxed code execution environment.

## Features

- Isolated process execution
- Filesystem restrictions
- Network access control
- Execution timeout
- Resource limits

## Usage

```typescript
import { executeInSandbox } from '@aether/sandbox';
const result = await executeInSandbox(code, { timeout: 5000 });
```
</content>
<write_to_file>
<path>c:/Users/adamm/Aether/packages/foresight/README.md</path>
<content># @aether/foresight

Predictive analysis for agent decisions.

## Usage

```typescript
import { predict } from '@aether/foresight';
const prediction = await predict(decisionContext);
```
</content>
<write_to_file>
<path>c:/Users/adamm/Aether/packages/workflow/README.md</path>
<content># @aether/workflow

Workflow execution engine.

## Usage

```typescript
import { executeWorkflow } from '@aether/workflow';
const result = await executeWorkflow(workflowId, params);
```
</content>
<write_to_file>
<path>c:/Users/adamm/Aether/packages/council/README.md</path>
<content># @aether/council

Council deliberation logic.

## Usage

```typescript
import { conveneCouncil } from '@aether/council';
const decision = await conveneCouncil(proposal);
```
</content>
<write_to_file>
<path>c:/Users/adamm/Aether/packages/convene/README.md</path>
<content># @aether/convene

Triggers council deliberation.

## Usage

```typescript
import { convene } from '@aether/convene';
await convene(proposalId);
```
</content>
<write_to_file>
<path>c:/Users/adamm/Aether/packages/dream/README.md</path>
<content># @aether/dream

Dream processing for creative insights.

## Usage

```typescript
import { processDream } from '@aether/dream';
const insights = await processDream(context);
```
</content>
<write_to_file>
<path>c:/Users/adamm/Aether/packages/goals/README.md</path>
<content># @aether/goals

Goal tracking system.

## Usage

```typescript
import { trackGoal } from '@aether/goals';
await trackGoal(goalId, progress);
```
</content>
<write_to_file>
<path>c:/Users/adamm/Aether/packages/storyteller/README.md</path>
<content># @aether/storyteller

Narrative generation for system events.

## Usage

```typescript
import { generateNarrative } from '@aether/storyteller';
const story = await generateNarrative(events);
```
</content>
<write_to_file>
<path>c:/Users/adamm/Aether/packages/lessons/README.md</path>
<content># @aether/lessons

Lessons learned database.

## Usage

```typescript
import { writeLesson, readLessons } from '@aether/lessons';
await writeLesson({ title: 'Always verify bindings', category: 'infra' });
const lessons = await readLessons({ category: 'infra' });
```
</content>
<write_to_file>
<path>c:/Users/adamm/Aether/packages/metrics/README.md</path>
<content># @aether/metrics

Metrics collection system.

## Usage

```typescript
import { recordMetric } from '@aether/metrics';
await recordMetric('request_count', { endpoint: '/api/build' });
```
</content>
<write_to_file>
<path>c:/Users/adamm/Aether/packages/telemetry/README.md</path>
<content># @aether/telemetry

Telemetry collection for observability.

## Usage

```typescript
import { trackEvent } from '@aether/telemetry';
await trackEvent('agent_execution', { tool: 'file_read', duration: 150 });
```
</content>
<write_to_file>
<path>c:/Users/adamm/Aether/packages/rate-limiter/README.md</path>
<content># @aether/rate-limiter

Rate limiting middleware.

## Usage

```typescript
import { rateLimit } from '@aether/rate-limiter';
app.use(rateLimit({ windowMs: 60000, max: 100 }));
```
</content>
<write_to_file>
<path>c:/Users/adamm/Aether/packages/throttle/README.md</path>
<content># @aether/throttle

Request throttling.

## Usage

```typescript
import { throttle } from '@aether/throttle';
const throttledFn = throttle(fn, 1000);
```
</content>
<write_to_file>
<path>c:/Users/adamm/Aether/packages/context-truncate/README.md</path>
<content># @aether/context-truncate

Context window management.

## Usage

```typescript
import { truncateContext } from '@aether/context-truncate';
const truncated = truncateContext(longText, { maxTokens: 4000 });
```
</content>
<write_to_file>
<path>c:/Users/adamm/Aether/packages/compactor/README.md</path>
<content># @aether/compactor

Data compaction for storage optimization.

## Usage

```typescript
import { compact } from '@aether/compactor';
const compacted = await compact(data);
```
</content>
<write_to_file>
<path>c:/Users/adamm/Aether/packages/vitalsigns/README.md</path>
<content># @aether/vitalsigns

Health monitoring system.

## Usage

```typescript
import { checkHealth } from '@aether/vitalsigns';
const status = await checkHealth();