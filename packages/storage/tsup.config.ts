import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  external: ['@aws-sdk/client-s3', '@aws-sdk/s3-request-presigner'],
  splitting: false,
  treeshake: true,
});
