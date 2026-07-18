/**
 * @aether/contracts - Shared schemas for FE ↔ BE ↔ Bridge communication
 * 
 * Contract-first validation using Zod. All boundaries should parse these schemas
 * to ensure type safety and runtime validation.
 * 
 * @version 1.0.0
 */

import { z } from 'zod';

// =============================================================================
// PROMPT TO COMPONENT SPEC - Frontend → Backend
// =============================================================================

/**
 * A component in the generative UI dashboard
 */
export const ComponentSchema = z.object({
  id: z.string().min(1),
  type: z.enum(['stat', 'chart', 'list', 'status', 'gauge']),
  title: z.string().min(1),
  props: z.object({
    label: z.string(),
    value: z.string().optional(),
    items: z.array(z.string()).optional(),
    data: z.array(z.object({
      name: z.string(),
      value: z.number(),
    })).optional(),
    description: z.string().optional(),
  }),
});

export type Component = z.infer<typeof ComponentSchema>;

/**
 * Request payload from frontend to /api/build endpoint
 */
export const BuildRequestSchema = z.object({
  prompt: z.string().min(1).max(5000),
  currentComponents: z.array(ComponentSchema).default([]),
});

export type BuildRequest = z.infer<typeof BuildRequestSchema>;

// =============================================================================
// COMPONENT ACTION - Backend → Frontend (response actions)
// =============================================================================

/**
 * Actions returned from the generative UI engine
 */
export const ComponentActionSchema = z.union([
  z.object({
    action: z.literal('ADD'),
    plan: ComponentSchema,
  }),
  z.object({
    action: z.literal('REMOVE'),
    targetId: z.string(),
  }),
  z.object({
    action: z.literal('MODIFY'),
    targetId: z.string(),
    plan: ComponentSchema.partial(),
  }),
  // Extended UI actions
  z.object({
    action: z.literal('PATCH'),
    targetId: z.string(),
    patchData: z.record(z.unknown()),
  }),
  z.object({
    action: z.literal('MUTATE_THEME'),
    themeUpdate: z.record(z.unknown()),
  }),
  z.object({
    action: z.literal('SET_DIRECTIVE'),
    directive: z.string(),
  }),
  z.object({
    action: z.literal('SOURCE_MUTATION'),
  }),
  // MCP tool invocations
  z.object({
    action: z.literal('MCP_TOOL_CALL'),
    toolName: z.string(),
    toolArgs: z.record(z.unknown()),
  }),
  // CLI skill invocations (adapter-backed tools)
  z.object({
    action: z.literal('CLI_SKILL_CALL'),
    skillName: z.string(),
    command: z.string(),
    args: z.record(z.unknown()),
  }),
]);

export type ComponentAction = z.infer<typeof ComponentActionSchema>;

/**
 * Council response from the generative UI engine
 */
export const CouncilSchema = z.object({
  builder: z.string(),
  strategist: z.string(),
  operator: z.string(),
});

export type Council = z.infer<typeof CouncilSchema>;

/**
 * Response from /api/build endpoint
 */
export const BuildResponseSchema = z.object({
  thought: z.string(),
  explanation: z.string(),
  actions: z.array(ComponentActionSchema),
  isFallback: z.boolean().default(false),
  quotaExhausted: z.boolean().optional(),
  curatorRejected: z.boolean().optional(),
  council: CouncilSchema.optional(),
  manifesto: z.string().optional(),
});

export type BuildResponse = z.infer<typeof BuildResponseSchema>;

// =============================================================================
// VALIDATORS - Boundary parse functions
// =============================================================================

/**
 * Parse and validate incoming build request at the API boundary
 * Use this at the route handler, not deep in business logic
 * 
 * @throws ZodError if validation fails
 */
export function parseBuildRequest(data: unknown): BuildRequest {
  return BuildRequestSchema.parse(data);
}

/**
 * Parse build request safely, returning result instead of throwing
 */
export function safeParseBuildRequest(data: unknown): z.SafeParseReturnType<BuildRequest, BuildRequest> {
  return BuildRequestSchema.safeParse(data);
}

/**
 * Validate build response before sending to frontend
 */
export function parseBuildResponse(data: unknown): BuildResponse {
  return BuildResponseSchema.parse(data);
}

/**
 * Validate component actions array
 */
export function parseComponentActions(data: unknown): ComponentAction[] {
  return z.array(ComponentActionSchema).parse(data);
}