/**
 * @aether/browser-automation - Intelligent Browser Automation
 * Optimized for Gemini AI integration with Cloudflare Browser Rendering
 */

export interface BrowserConfig {
  timeout?: number;
  viewport?: { width: number; height: number };
  userAgent?: string;
  blockAds?: boolean;
  blockTrackers?: boolean;
}

export interface PageSnapshot {
  url: string;
  title: string;
  text: string;
  html?: string;
  links: Array<{ href: string; text: string }>;
  images: Array<{ src: string; alt: string }>;
  metadata: {
    description?: string;
    keywords?: string;
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
  };
  screenshot?: string; // base64
  timestamp: number;
}

export class BrowserAutomation {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private cacheTTL = 5 * 60 * 1000; // 5 minutes

  constructor(private browser?: any) {}

  /**
   * Smart page analysis - extracts structured data from a URL
   * Uses caching to avoid redundant fetches
   */
  async analyzePage(url: string, config: BrowserConfig = {}): Promise<PageSnapshot> {
    const cacheKey = `analyze:${url}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const snapshot: PageSnapshot = {
      url,
      title: '',
      text: '',
      links: [],
      images: [],
      metadata: {},
      timestamp: Date.now()
    };

    try {
      if (this.browser) {
        // Use Cloudflare Browser Rendering
        const page = await this.browser.newPage();
        
        if (config.viewport) {
          await page.setViewport(config.viewport);
        }

        await page.goto(url, { 
          waitUntil: 'networkidle0',
          timeout: config.timeout || 30000 
        });

        snapshot.title = await page.title();
        snapshot.text = await page.evaluate(() => document.body.innerText);
        
        // Extract links
        snapshot.links = await page.evaluate(() => {
          return Array.from(document.querySelectorAll('a')).map((a: any) => ({
            href: a.href,
            text: a.textContent?.trim() || ''
          })).filter((link: any) => link.href && link.text);
        });

        // Extract images
        snapshot.images = await page.evaluate(() => {
          return Array.from(document.querySelectorAll('img')).map((img: any) => ({
            src: img.src,
            alt: img.alt || ''
          })).filter((img: any) => img.src);
        });

        // Extract metadata
        snapshot.metadata = await page.evaluate(() => {
          const meta: any = {};
          const getMeta = (name: string) => 
            document.querySelector(`meta[name="${name}"]`)?.getAttribute('content') ||
            document.querySelector(`meta[property="${name}"]`)?.getAttribute('content');
          
          meta.description = getMeta('description');
          meta.keywords = getMeta('keywords');
          meta.ogTitle = getMeta('og:title');
          meta.ogDescription = getMeta('og:description');
          meta.ogImage = getMeta('og:image');
          
          return meta;
        });

        // Optional screenshot
        if (config.blockAds !== false) {
          await page.addStyleTag({
            content: 'iframe, .ad, [class*="ad"], [id*="ad"] { display: none !important; }'
          });
        }

        await page.close();
      } else {
        // Fallback: fetch without browser rendering
        const response = await fetch(url);
        const html = await response.text();
        
        snapshot.title = this.extractTitle(html);
        snapshot.text = this.extractText(html);
        snapshot.links = this.extractLinks(html);
        snapshot.images = this.extractImages(html);
        snapshot.metadata = this.extractMetadata(html);
      }

      this.setCache(cacheKey, snapshot);
      return snapshot;
    } catch (error) {
      console.error(`[BrowserAutomation] Failed to analyze ${url}:`, error);
      throw error;
    }
  }

  /**
   * Extract specific content using CSS selectors
   * Optimized for targeted data extraction
   */
  async extractContent(url: string, selectors: Record<string, string>): Promise<Record<string, any>> {
    const snapshot = await this.analyzePage(url);
    const result: Record<string, any> = {};

    if (this.browser) {
      const page = await this.browser.newPage();
      await page.goto(url, { waitUntil: 'networkidle0' });

      for (const [key, selector] of Object.entries(selectors)) {
        try {
          const elements = await page.$$(selector);
          result[key] = await Promise.all(
            elements.map((el: any) => el.evaluate((e: any) => e.textContent?.trim()))
          );
        } catch {
          result[key] = null;
        }
      }

      await page.close();
    } else {
      // Fallback: simple regex-based extraction
      // This is a basic fallback - browser rendering provides better results
      for (const [key, selector] of Object.entries(selectors)) {
        result[key] = null; // Can't extract without browser
      }
    }

    return result;
  }

  /**
   * Smart search - finds relevant pages for a query
   * Uses Gemini to analyze and rank results
   */
  async search(query: string, maxResults: number = 5): Promise<Array<{ url: string; title: string; snippet: string }>> {
    // This would integrate with a search API
    // For now, return empty - would need search API integration
    return [];
  }

  /**
   * Batch page analysis - processes multiple URLs efficiently
   * Uses parallel processing with rate limiting
   */
  async analyzeBatch(urls: string[], config: BrowserConfig = {}): Promise<PageSnapshot[]> {
    const batchSize = 3; // Process 3 pages at a time
    const results: PageSnapshot[] = [];

    for (let i = 0; i < urls.length; i += batchSize) {
      const batch = urls.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(url => this.analyzePage(url, config).catch(err => {
          console.error(`[BrowserAutomation] Failed to analyze ${url}:`, err);
          return null;
        }))
      );
      results.push(...batchResults.filter((r): r is PageSnapshot => r !== null));
      
      // Small delay between batches to be polite
      if (i + batchSize < urls.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    return results;
  }

  /**
   * Generate a summary suitable for Gemini prompts
   * Compresses page data into a concise format
   */
  summarizeForAI(snapshot: PageSnapshot): string {
    const parts: string[] = [];
    
    parts.push(`URL: ${snapshot.url}`);
    parts.push(`Title: ${snapshot.title}`);
    
    if (snapshot.metadata.description) {
      parts.push(`Description: ${snapshot.metadata.description}`);
    }

    if (snapshot.links.length > 0) {
      parts.push(`Links: ${snapshot.links.slice(0, 10).map(l => l.text).join(', ')}`);
    }

    const textPreview = snapshot.text.slice(0, 500);
    if (textPreview) {
      parts.push(`Content Preview: ${textPreview}...`);
    }

    return parts.join('\n');
  }

  /**
   * Cache management
   */
  private getFromCache(key: string): any {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() - entry.timestamp > this.cacheTTL) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Health check - verifies browser is available
   */
  async healthCheck(): Promise<{ available: boolean; type: string }> {
    if (this.browser) {
      try {
        const version = await this.browser.version();
        return { available: true, type: 'cloudflare-browser' };
      } catch {
        return { available: false, type: 'cloudflare-browser' };
      }
    }
    
    return { available: true, type: 'fetch-fallback' };
  }

  /**
   * Helper methods for fallback HTML parsing (regex-based)
   */
  private extractTitle(html: string): string {
    const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    return match ? match[1].trim() : '';
  }

  private extractText(html: string): string {
    // Remove script and style tags, then extract text
    let text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
    text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
    text = text.replace(/<[^>]+>/g, ' ');
    return text.replace(/\s+/g, ' ').trim();
  }

  private extractLinks(html: string): Array<{ href: string; text: string }> {
    const links: Array<{ href: string; text: string }> = [];
    const regex = /<a[^>]+href=["']([^"']+)["'][^>]*>([^<]+)<\/a>/gi;
    let match;
    
    while ((match = regex.exec(html)) !== null) {
      if (match[1] && match[2]) {
        links.push({ href: match[1], text: match[2].trim() });
      }
    }
    
    return links;
  }

  private extractImages(html: string): Array<{ src: string; alt: string }> {
    const images: Array<{ src: string; alt: string }> = [];
    const regex = /<img[^>]+src=["']([^"']+)["'][^>]*alt=["']([^"']*)["'][^>]*>/gi;
    let match;
    
    while ((match = regex.exec(html)) !== null) {
      if (match[1]) {
        images.push({ src: match[1], alt: match[2] || '' });
      }
    }
    
    return images;
  }

  private extractMetadata(html: string): any {
    const metadata: any = {};
    
    const extractMeta = (name: string): string | undefined => {
      const regex = new RegExp(`<meta[^>]+name=["']${name}["'][^>]+content=["']([^"']+)["']`, 'i');
      const match = regex.exec(html);
      if (match) return match[1];
      
      const ogRegex = new RegExp(`<meta[^>]+property=["']${name}["'][^>]+content=["']([^"']+)["']`, 'i');
      const ogMatch = ogRegex.exec(html);
      return ogMatch ? ogMatch[1] : undefined;
    };
    
    metadata.description = extractMeta('description');
    metadata.keywords = extractMeta('keywords');
    metadata.ogTitle = extractMeta('og:title');
    metadata.ogDescription = extractMeta('og:description');
    metadata.ogImage = extractMeta('og:image');
    
    return metadata;
  }
}

/**
 * Gemini Integration Helper
 * Formats browser data for Gemini prompts
 */
export class GeminiBrowserHelper {
  constructor(private browser: BrowserAutomation) {}

  /**
   * Analyzes a page and formats the result for Gemini
   * Returns a prompt-ready string
   */
  async analyzeForGemini(url: string, purpose: string): Promise<string> {
    const snapshot = await this.browser.analyzePage(url);
    const summary = this.browser.summarizeForAI(snapshot);
    
    return `
Browser Analysis for: ${purpose}

${summary}

Available Links: ${snapshot.links.length}
Available Images: ${snapshot.images.length}

Key Links:
${snapshot.links.slice(0, 5).map(l => `- ${l.text}: ${l.href}`).join('\n')}
    `.trim();
  }

  /**
   * Multi-page analysis for comparative tasks
   */
  async compareForGemini(urls: string[], purpose: string): Promise<string> {
    const snapshots = await this.browser.analyzeBatch(urls);
    
    const comparisons = snapshots.map((snapshot, i) => {
      return `
Page ${i + 1}: ${snapshot.url}
${this.browser.summarizeForAI(snapshot)}
      `.trim();
    });

    return `
Multi-Page Comparison for: ${purpose}

${comparisons.join('\n\n---\n\n')}
    `.trim();
  }
}

export function createBrowserAutomation(browser?: any): BrowserAutomation {
  return new BrowserAutomation(browser);
}

export function createGeminiBrowserHelper(browser: BrowserAutomation): GeminiBrowserHelper {
  return new GeminiBrowserHelper(browser);
}