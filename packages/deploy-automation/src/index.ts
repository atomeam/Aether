/**
 * @aether/deploy-automation
 *
 * Comprehensive deployment automation for Cloudflare Workers and Vercel
 *
 * @packageDocumentation
 */

// Types
export * from './types';

// Cloudflare deployment
export { CloudflareDeployer } from './cloudflare/deploy';

// Vercel deployment
export { VercelDeployer } from './vercel/deploy';

// Environment management
export { EnvironmentManager, AETHER_ENV_VARIABLES } from './env/manager';

// Rollback management
export { RollbackManager } from './rollback/manager';

// Health checking
export { HealthChecker, AETHER_HEALTH_CHECKS, runAetherHealthChecks } from './health/checker';
export type { HealthCheckResult } from './health/checker';
