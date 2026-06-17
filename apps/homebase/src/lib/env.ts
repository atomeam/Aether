import { z } from 'zod';

const boolFlag = z.enum(['true', 'false']).default('false').transform((value) => value === 'true');

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  BRIDGE_BASE_URL: z.string().url().default('http://localhost:8787'),
  BRIDGE_API_TOKEN: z.string().min(1).optional(),
  BRIDGE_TASKS_PATH: z.string().default('/tasks'),
  BRIDGE_AUDIT_EVENTS_PATH: z.string().default('/ops/deploy-event'),
  ATOMIND_BASE_URL: z.string().url().default('https://aether-bridge.atomicmoonbeam88.workers.dev'),
  ATOMIND_DEVIN_SECRET: z.string().min(1).optional(),
  NOTION_WORKSPACE_INDEX_URL: z.string().url().default('https://www.notion.so'),
  NOTION_ROSTER_URL: z.string().url().default('https://www.notion.so'),
  NOTION_ROLE_CARDS_URL: z.string().url().default('https://www.notion.so'),
  NOTION_PULL_ENABLED: boolFlag,
  NOTION_SYNC_ENABLED: boolFlag
});

export type AppEnv = z.infer<typeof envSchema>;

let cachedEnv: AppEnv | null = null;

export function getEnv(overrides?: Partial<NodeJS.ProcessEnv>): AppEnv {
  if (overrides) {
    return envSchema.parse({ ...process.env, ...overrides });
  }

  if (!cachedEnv) {
    cachedEnv = envSchema.parse(process.env);
  }

  return cachedEnv;
}
