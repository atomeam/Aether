/**
 * @aether/storage - File storage abstraction layer
 *
 * A unified interface for S3, local filesystem, and Cloudflare R2
 */

// Types
export type * from './types/index';

// Core classes
export { BaseStorage } from './storage';

// Adapters
export { S3Adapter } from './adapters/s3';
export { LocalAdapter } from './adapters/local';
export { R2Adapter } from './adapters/r2';

// CDN
export { BaseCDN, CloudflareCDN, CloudFrontCDN, CustomCDN, createCDN } from './cdn';

// Factory function
import { S3Adapter } from './adapters/s3';
import { LocalAdapter } from './adapters/local';
import { R2Adapter } from './adapters/r2';
import type { StorageConfig, IStorage } from './types/index';

export function createStorage(config: StorageConfig): IStorage {
  switch (config.type) {
    case 's3':
      return new S3Adapter(config);
    case 'local':
      return new LocalAdapter(config);
    case 'r2':
      return new R2Adapter(config);
    default:
      throw new Error(`Unsupported storage type: ${config.type}`);
  }
}
