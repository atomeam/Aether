/**
 * @aether/social - Social Sharing Module
 * 
 * Social media sharing functionality for various platforms including
 * Twitter, Facebook, LinkedIn, Pinterest, Reddit, WhatsApp, Telegram, and Email.
 */

import type {
  SharePlatform,
  ShareContent,
  ShareOptions,
  ShareResult
} from './types.js';
import { ShareError } from './types.js';

// ============================================================================
// Share URL Templates
// ============================================================================

const SHARE_URLS: Record<SharePlatform, string> = {
  twitter: 'https://twitter.com/intent/tweet',
  facebook: 'https://www.facebook.com/sharer/sharer.php',
  linkedin: 'https://www.linkedin.com/sharing/share-offsite/',
  pinterest: 'https://pinterest.com/pin/create/button/',
  reddit: 'https://reddit.com/submit',
  whatsapp: 'https://wa.me/',
  telegram: 'https://t.me/share/url',
  email: 'mailto:'
};

// ============================================================================
// Share Manager Class
// ============================================================================

export class ShareManager {
  private trackingParams: Record<string, string> = {};

  /**
   * Set global tracking parameters for all shares
   */
  setTrackingParams(params: Record<string, string>): void {
    this.trackingParams = params;
  }

  /**
   * Generate share URL for a platform
   */
  generateShareUrl(platform: SharePlatform, content: ShareContent): string {
    const baseUrl = SHARE_URLS[platform];
    const params = this.buildShareParams(platform, content);
    
    // Add global tracking params
    Object.entries(this.trackingParams).forEach(([key, value]) => {
      params.set(key, value);
    });

    const queryString = params.toString();
    return queryString ? `${baseUrl}?${queryString}` : baseUrl;
  }

  /**
   * Build platform-specific share parameters
   */
  private buildShareParams(platform: SharePlatform, content: ShareContent): URLSearchParams {
    const params = new URLSearchParams();

    switch (platform) {
      case 'twitter':
        params.set('text', this.formatTweet(content));
        if (content.url) params.set('url', content.url);
        if (content.hashtags?.length) {
          params.set('hashtags', content.hashtags.map(h => h.replace('#', '')).join(','));
        }
        if (content.via) params.set('via', content.via);
        if (content.related?.length) params.set('related', content.related.join(','));
        break;

      case 'facebook':
        params.set('u', content.url);
        if (content.hashtags?.length) {
          params.set('hashtag', content.hashtags[0]);
        }
        break;

      case 'linkedin':
        params.set('url', content.url);
        break;

      case 'pinterest':
        params.set('url', content.url);
        if (content.description) params.set('description', content.description);
        if (content.image) params.set('media', content.image);
        break;

      case 'reddit':
        params.set('url', content.url);
        if (content.title) params.set('title', content.title);
        break;

      case 'whatsapp':
        const whatsappText = this.formatWhatsApp(content);
        params.set('text', whatsappText);
        break;

      case 'telegram':
        params.set('url', content.url);
        if (content.title) params.set('text', content.title);
        break;

      case 'email':
        params.set('subject', content.title);
        const emailBody = this.formatEmail(content);
        params.set('body', emailBody);
        break;
    }

    return params;
  }

  /**
   * Format content for Twitter (280 char limit)
   */
  private formatTweet(content: ShareContent): string {
    let tweet = content.title;
    
    if (content.description) {
      tweet += `\n\n${content.description}`;
    }
    
    if (content.hashtags?.length) {
      tweet += '\n' + content.hashtags.slice(0, 3).join(' ');
    }
    
    // Truncate if too long (leave room for URL)
    const maxLength = content.url ? 240 : 280;
    if (tweet.length > maxLength) {
      tweet = tweet.substring(0, maxLength - 3) + '...';
    }
    
    return tweet;
  }

  /**
   * Format content for WhatsApp
   */
  private formatWhatsApp(content: ShareContent): string {
    let message = `${content.title}\n\n`;
    
    if (content.description) {
      message += `${content.description}\n\n`;
    }
    
    message += content.url;
    
    if (content.hashtags?.length) {
      message += '\n\n' + content.hashtags.join(' ');
    }
    
    return message;
  }

  /**
   * Format content for Email
   */
  private formatEmail(content: ShareContent): string {
    let body = '';
    
    if (content.description) {
      body += `${content.description}\n\n`;
    }
    
    body += `Link: ${content.url}`;
    
    if (content.hashtags?.length) {
      body += `\n\nTags: ${content.hashtags.map(h => h.replace('#', '')).join(', ')}`;
    }
    
    return body;
  }

  /**
   * Open share dialog in new tab
   */
  share(options: ShareOptions): ShareResult {
    try {
      const url = this.generateShareUrl(options.platform, options.content);
      
      if (options.openInNewTab !== false) {
        window.open(url, '_blank', 'width=600,height=400');
      }
      
      return {
        success: true,
        platform: options.platform,
        url
      };
    } catch (error) {
      return {
        success: false,
        platform: options.platform,
        error: error instanceof Error ? error.message : 'Failed to open share dialog'
      };
    }
  }

  /**
   * Generate share URLs for multiple platforms
   */
  generateShareUrls(content: ShareContent, platforms?: SharePlatform[]): Record<SharePlatform, string> {
    const targetPlatforms = platforms || Object.keys(SHARE_URLS) as SharePlatform[];
    const urls: Record<SharePlatform, string> = {} as Record<SharePlatform, string>;
    
    for (const platform of targetPlatforms) {
      urls[platform] = this.generateShareUrl(platform, content);
    }
    
    return urls;
  }

  /**
   * Get share count for a URL (requires API integration)
   */
  async getShareCount(url: string, platform: SharePlatform): Promise<number> {
    // This would require integration with each platform's API
    // For now, return 0 as a placeholder
    console.warn(`Share count for ${platform} requires API integration`);
    return 0;
  }

  /**
   * Get share counts for multiple platforms
   */
  async getShareCounts(url: string, platforms: SharePlatform[]): Promise<Record<SharePlatform, number>> {
    const counts: Record<SharePlatform, number> = {} as Record<SharePlatform, number>;
    
    for (const platform of platforms) {
      counts[platform] = await this.getShareCount(url, platform);
    }
    
    return counts;
  }

  /**
   * Generate Open Graph meta tags for a page
   */
  generateOpenGraphTags(content: ShareContent): string {
    const tags: string[] = [];
    
    tags.push(`<meta property="og:title" content="${this.escapeHtml(content.title)}">`);
    
    if (content.description) {
      tags.push(`<meta property="og:description" content="${this.escapeHtml(content.description)}">`);
    }
    
    tags.push(`<meta property="og:url" content="${content.url}">`);
    
    if (content.image) {
      tags.push(`<meta property="og:image" content="${content.image}">`);
    }
    
    if (content.hashtags?.length) {
      tags.push(`<meta property="og:tags" content="${content.hashtags.join(',')}">`);
    }
    
    return tags.join('\n');
  }

  /**
   * Generate Twitter Card meta tags
   */
  generateTwitterCardTags(content: ShareContent, cardType: 'summary' | 'summary_large_image' = 'summary'): string {
    const tags: string[] = [];
    
    tags.push(`<meta name="twitter:card" content="${cardType}">`);
    tags.push(`<meta name="twitter:title" content="${this.escapeHtml(content.title)}">`);
    
    if (content.description) {
      tags.push(`<meta name="twitter:description" content="${this.escapeHtml(content.description)}">`);
    }
    
    if (content.image) {
      tags.push(`<meta name="twitter:image" content="${content.image}">`);
    }
    
    return tags.join('\n');
  }

  /**
   * Escape HTML special characters
   */
  private escapeHtml(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    
    return text.replace(/[&<>"']/g, (char) => map[char]);
  }

  /**
   * Validate share content
   */
  validateContent(content: ShareContent): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!content.title || content.title.trim().length === 0) {
      errors.push('Title is required');
    }
    
    if (!content.url || !this.isValidUrl(content.url)) {
      errors.push('Valid URL is required');
    }
    
    if (content.image && !this.isValidUrl(content.image)) {
      errors.push('Image must be a valid URL');
    }
    
    if (content.hashtags) {
      const invalidHashtags = content.hashtags.filter(h => !h.startsWith('#'));
      if (invalidHashtags.length > 0) {
        errors.push(`Hashtags must start with #: ${invalidHashtags.join(', ')}`);
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Check if string is a valid URL
   */
  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get platform-specific character limits
   */
  getCharacterLimit(platform: SharePlatform): number {
    const limits: Record<SharePlatform, number> = {
      twitter: 280,
      facebook: 63206,
      linkedin: 700,
      pinterest: 500,
      reddit: 300,
      whatsapp: 65536,
      telegram: 4096,
      email: 65536
    };
    
    return limits[platform];
  }

  /**
   * Check if content fits within platform limits
   */
  fitsPlatformLimit(platform: SharePlatform, content: ShareContent): boolean {
    const limit = this.getCharacterLimit(platform);
    const text = this.formatTweet(content); // Use tweet format as baseline
    return text.length <= limit;
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Create a new share manager instance
 */
export function createShareManager(): ShareManager {
  return new ShareManager();
}

/**
 * Quick share function
 */
export function share(platform: SharePlatform, content: ShareContent): ShareResult {
  const manager = new ShareManager();
  return manager.share({ platform, content });
}

/**
 * Generate share URL
 */
export function generateShareUrl(platform: SharePlatform, content: ShareContent): string {
  const manager = new ShareManager();
  return manager.generateShareUrl(platform, content);
}

/**
 * Get supported platforms
 */
export function getSupportedPlatforms(): SharePlatform[] {
  return Object.keys(SHARE_URLS) as SharePlatform[];
}
