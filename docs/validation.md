# Validation

## Overview

AtoMind uses Zod schemas for runtime validation across all API endpoints.

## Schema Locations

- `packages/contracts/src/index.ts` — shared schemas
- `packages/env/src/index.ts` — environment schemas
- `apps/backend/server.ts` — route-specific schemas

## Key Schemas

### BuildRequestSchema

```typescript
const BuildRequestSchema = z.object({
  prompt: z.string().min(1).max(10000),
  components: z.array(ComponentSchema).optional(),
  theme: ThemeSchema.optional(),
});
```

### ComponentSchema

```typescript
const ComponentSchema = z.object({
  id: z.string(),
  type: z.enum(['stat', 'chart', 'list', 'status', 'gauge']),
  title: z.string(),
  data: z.any(),
});
```

### ComponentActionSchema

```typescript
const ComponentActionSchema = z.object({
  action: z.enum(['ADD', 'REMOVE', 'MODIFY']),
  targetId: z.string().optional(),
  component: ComponentSchema.optional(),
});
```

## Usage

```typescript
import { parseBuildRequest } from '@aether/contracts';

try {
  const request = parseBuildRequest(req.body);
  // Validated request
} catch (error) {
  return res.status(400).json({ error: error.message });
}
```

## Adding New Schemas

1. Define schema in `packages/contracts/src/index.ts`
2. Export the schema and inferred type
3. Use in route handlers
4. Add tests