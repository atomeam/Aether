/**
 * CDN integration for cache invalidation
 */

import type { ICDN, CDNConfig, CDNInvalidationOptions, CDNInvalidationResult } from '../types/index';
import { CDNConfigSchema, CDNInvalidationOptionsSchema } from '../schemas/index';

export abstract class BaseCDN implements ICDN {
  protected config: CDNConfig;

  constructor(config: CDNConfig) {
    this.config = CDNConfigSchema.parse(config);
  }

  abstract invalidate(options: CDNInvalidationOptions): Promise<CDNInvalidationResult>;
  abstract getInvalidationStatus(id: string): Promise<CDNInvalidationResult>;

  isEnabled(): boolean {
    return this.config.enabled;
  }

  getConfig(): CDNConfig {
    return { ...this.config };
  }

  protected handleError(error: unknown): never {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(String(error));
  }
}

export class CloudflareCDN extends BaseCDN {
  async invalidate(_options: CDNInvalidationOptions): Promise<CDNInvalidationResult> {
    if (!this.config.enabled) {
      throw new Error('CDN is not enabled');
    }

    // In a real implementation, this would call the Cloudflare API
    // For now, we'll return a mock result
    return {
      id: `cf-${Date.now()}`,
      status: 'pending',
      createdAt: new Date(),
    };
  }

  async getInvalidationStatus(id: string): Promise<CDNInvalidationResult> {
    // In a real implementation, this would check the Cloudflare API
    return {
      id,
      status: 'completed',
      createdAt: new Date(),
    };
  }
}

export class CloudFrontCDN extends BaseCDN {
  async invalidate(_options: CDNInvalidationOptions): Promise<CDNInvalidationResult> {
    if (!this.config.enabled) {
      throw new Error('CDN is not enabled');
    }

    // In a real implementation, this would call the AWS CloudFront API
    // For now, we'll return a mock result
    return {
      id: `cf-${Date.now()}`,
      status: 'pending',
      createdAt: new Date(),
    };
  }

  async getInvalidationStatus(id: string): Promise<CDNInvalidationResult> {
    // In a real implementation, this would check the CloudFront API
    return {
      id,
      status: 'completed',
      createdAt: new Date(),
    };
  }
}

export class CustomCDN extends BaseCDN {
  async invalidate(_options: CDNInvalidationOptions): Promise<CDNInvalidationResult> {
    if (!this.config.enabled) {
      throw new Error('CDN is not enabled');
    }

    // In a real implementation, this would call a custom API
    // For now, we'll return a mock result
    return {
      id: `custom-${Date.now()}`,
      status: 'pending',
      createdAt: new Date(),
    };
  }

  async getInvalidationStatus(id: string): Promise<CDNInvalidationResult> {
    // In a real implementation, this would check the custom API
    return {
      id,
      status: 'completed',
      createdAt: new Date(),
    };
  }
}

export function createCDN(config: CDNConfig): ICDN {
  switch (config.provider) {
    case 'cloudflare':
      return new CloudflareCDN(config);
    case 'cloudfront':
      return new CloudFrontCDN(config);
    case 'custom':
      return new CustomCDN(config);
    default:
      throw new Error(`Unsupported CDN provider: ${config.provider}`);
  }
}
