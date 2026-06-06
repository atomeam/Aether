import { z } from "zod"

// Shared base — applies everywhere
const BaseEnv = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
})

export const BackendEnvSchema = BaseEnv.extend({
  PORT: z.coerce.number().int().positive().default(3000),
  GEMINI_API_KEY: z.string().min(1, "GEMINI_API_KEY is required"),
  STRIPE_API_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_SUCCESS_URL: z.string().optional(),
  STRIPE_CANCEL_URL: z.string().optional(),
  CURATOR_ALLOW_LIST: z
    .string()
    .optional()
    .transform((s) => (s ? s.split(",").map((x) => x.trim()) : undefined)),
})
export type BackendEnv = z.infer<typeof BackendEnvSchema>

export const BridgeEnvSchema = BaseEnv.extend({
  BRIDGE_PORT: z.coerce.number().int().positive().default(4000),
})
export type BridgeEnv = z.infer<typeof BridgeEnvSchema>

// Frontend is special — see gotcha below
// ⚠️ All keys are PUBLIC (Vite inlines them into bundle)
export const FrontendEnvSchema = BaseEnv.extend({
  VITE_API_URL: z.string().url(),
})
export type FrontendEnv = z.infer<typeof FrontendEnvSchema>

/**
 * Parse environment variables against a Zod schema.
 * Exits with descriptive error on failure.
 */
export function parseEnv<T>(
  schema: z.ZodSchema<T>,
  source: Record<string, unknown> = process.env,
  label = "env"
): T {
  const result = schema.safeParse(source)
  if (!result.success) {
    console.error(`[${label}] validation failed:`)
    for (const issue of result.error.issues) {
      const path = issue.path.join(".") || "(root)"
      console.error(`  - ${path}: ${issue.message}`)
    }
    process.exit(1)
  }
  return result.data
}