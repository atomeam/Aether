/**
 * Cloudflare R2 storage adapter (S3-compatible)
 */

import { S3Adapter } from './s3';
import type { StorageConfig } from '../types/index';

export class R2Adapter extends S3Adapter {
  constructor(config: StorageConfig) {
    // R2 uses S3-compatible API
    // User should provide the endpoint in config.endpoint
    const r2Config = {
      ...config,
      type: 'r2' as const,
    };

    super(r2Config);
  }

  getPublicUrl(key: string): string {
    const normalizedKey = this.normalizeKey(key);

    if (this.config.cdnUrl) {
      return `${this.config.cdnUrl}/${normalizedKey}`;
    }

    // R2 public URL format (if custom domain is not set)
    // Users should configure cdnUrl for public access
    return `/${normalizedKey}`;
  }
}
