/**
 * Test Route Guard Middleware
 * 
 * Blocks /api/test/* routes in production unless explicitly enabled.
 * Production security: deny test/debug endpoints by default.
 * Development/test: always allow.
 */

export function shouldExposeTestRoutes(env: NodeJS.ProcessEnv = process.env): boolean {
  const nodeEnv = env.NODE_ENV || "development";
  const allowOverride = env.ALLOW_TEST_ROUTES === "1";
  
  // Production: only allow if explicitly enabled
  if (nodeEnv === "production") {
    return allowOverride;
  }
  
  // Development/test: always allow
  return true;
}

/**
 * Express middleware factory for guarding test routes.
 * Returns 404 if test routes should not be exposed.
 */
export function testRouteGuard(env: NodeJS.ProcessEnv = process.env) {
  return (_req: any, res: any, next: any) => {
    if (!shouldExposeTestRoutes(env)) {
      return res.status(404).json({ error: "Not found" });
    }
    next();
  };
}
