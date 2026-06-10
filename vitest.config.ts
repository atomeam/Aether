import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    passWithNoTests: true,
    env: {
      // Backend env validation hard-exits without this; tests run in degraded mode
      ALLOW_DEGRADED: '1',
    },
  },
});
