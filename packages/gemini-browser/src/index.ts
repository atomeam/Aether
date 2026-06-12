/**
 * @aether/gemini-browser - Gemini AI + Browser Automation Integration
 * Smart browser control optimized for Gemini AI workflows
 */

export interface PageSnapshot {
  url: string;
  title: string;
  text: string;
  links: Array<{ href: string; text: string }>;
  metadata: Record<string, string | undefined>;
}

/**
 * Simple browser automation wrapper
 * In production, this would use the Cloudflare Browser binding
 */
class SimpleBrowserAutomation {
  constructor(private browser?: any) {}

  async analyzePage(url: string): Promise<PageSnapshot> {
    const response = await fetch(url);
    const html = await response.text();
    
    return {
      url,
      title: this.extractTitle(html),
      text: this.extractText(html),
      links: this.extractLinks(html),
      metadata: this.extractMetadata(html)
    };
  }

  private extractTitle(html: string): string {
    const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    return match ? match[1].trim() : '';
  }

  private extractText(html: string): string {
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

  private extractMetadata(html: string): Record<string, string | undefined> {
    const metadata: Record<string, string | undefined> = {};
    
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

export interface GeminiBrowserConfig {
  apiKey: string;
  browser?: any;
  cacheEnabled?: boolean;
  maxCacheSize?: number;
}

export interface BrowserTask {
  type: 'analyze' | 'extract' | 'compare' | 'search';
  url?: string;
  urls?: string[];
  selectors?: Record<string, string>;
  query?: string;
  purpose: string;
}

export interface BrowserTaskResult {
  task: BrowserTask;
  success: boolean;
  data?: any;
  error?: string;
  duration: number;
  cached: boolean;
}

export class GeminiBrowserController {
  private browser: SimpleBrowserAutomation;
  private taskCache = new Map<string, { result: BrowserTaskResult; timestamp: number }>();
  private cacheEnabled: boolean;
  private maxCacheSize: number;

  constructor(config: GeminiBrowserConfig) {
    this.browser = new SimpleBrowserAutomation(config.browser);
    this.cacheEnabled = config.cacheEnabled ?? true;
    this.maxCacheSize = config.maxCacheSize ?? 100;
  }

  /**
   * Execute a browser task with smart caching and optimization
   */
  async executeTask(task: BrowserTask): Promise<BrowserTaskResult> {
    const startTime = Date.now();
    const cacheKey = this.getCacheKey(task);

    // Check cache first
    if (this.cacheEnabled) {
      const cached = this.taskCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) { // 5 minute cache
        return { ...cached.result, cached: true };
      }
    }

    let result: BrowserTaskResult;

    try {
      switch (task.type) {
        case 'analyze':
          result = await this.executeAnalyze(task);
          break;
        case 'extract':
          result = await this.executeExtract(task);
          break;
        case 'compare':
          result = await this.executeCompare(task);
          break;
        case 'search':
          result = await this.executeSearch(task);
          break;
        default:
          throw new Error(`Unknown task type: ${(task as any).type}`);
      }
    } catch (error) {
      result = {
        task,
        success: false,
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime,
        cached: false
      };
    }

    // Cache successful results
    if (this.cacheEnabled && result.success) {
      this.taskCache.set(cacheKey, { result, timestamp: Date.now() });
      this.enforceCacheLimit();
    }

    result.duration = Date.now() - startTime;
    return result;
  }

  /**
   * Analyze a single page and format for Gemini
   */
  private async executeAnalyze(task: BrowserTask): Promise<BrowserTaskResult> {
    if (!task.url) {
      throw new Error('URL is required for analyze task');
    }

    const snapshot = await this.browser.analyzePage(task.url);
    const analysis = this.formatSnapshotForGemini(snapshot, task.purpose);

    return {
      task,
      success: true,
      data: { analysis, raw: snapshot },
      cached: false,
      duration: 0
    };
  }

  /**
   * Extract specific content using selectors
   * Note: Simple fallback - full selector support requires browser rendering
   */
  private async executeExtract(task: BrowserTask): Promise<BrowserTaskResult> {
    if (!task.url) {
      throw new Error('URL is required for extract task');
    }

    // For simple fetch-based approach, we return the full page content
    // In production with Cloudflare Browser, this would use actual selectors
    const snapshot = await this.browser.analyzePage(task.url);
    
    return {
      task,
      success: true,
      data: { 
        fullText: snapshot.text,
        links: snapshot.links,
        metadata: snapshot.metadata
      },
      cached: false,
      duration: 0
    };
  }

  /**
   * Compare multiple pages
   */
  private async executeCompare(task: BrowserTask): Promise<BrowserTaskResult> {
    if (!task.urls || task.urls.length === 0) {
      throw new Error('URLs are required for compare task');
    }

    const snapshots: PageSnapshot[] = [];
    for (const url of task.urls) {
      try {
        const snapshot = await this.browser.analyzePage(url);
        snapshots.push(snapshot);
      } catch (error) {
        console.error(`Failed to analyze ${url}:`, error);
      }
    }

    const comparison = this.formatComparisonForGemini(snapshots, task.purpose);

    return {
      task,
      success: true,
      data: { comparison, snapshots },
      cached: false,
      duration: 0
    };
  }

  /**
   * Search for information (placeholder - would integrate with search API)
   */
  private async executeSearch(task: BrowserTask): Promise<BrowserTaskResult> {
    if (!task.query) {
      throw new Error('Query is required for search task');
    }

    // Placeholder - would integrate with actual search API
    return {
      task,
      success: true,
      data: { query: task.query, results: [] },
      cached: false,
      duration: 0
    };
  }

  /**
   * Execute multiple tasks in parallel with rate limiting
   */
  async executeBatch(tasks: BrowserTask[], maxConcurrent: number = 3): Promise<BrowserTaskResult[]> {
    const results: BrowserTaskResult[] = [];
    const executing: Promise<void>[] = [];

    for (const task of tasks) {
      const promise = this.executeTask(task).then(result => {
        results.push(result);
      });

      executing.push(promise);

      if (executing.length >= maxConcurrent) {
        await Promise.race(executing);
        executing.splice(
          executing.findIndex(p => p === promise),
          1
        );
      }
    }

    await Promise.all(executing);
    return results;
  }

  /**
   * Generate a prompt that includes browser data for Gemini
   */
  async generatePromptWithBrowserData(
    basePrompt: string,
    browserTasks: BrowserTask[]
  ): Promise<string> {
    const results = await this.executeBatch(browserTasks);

    const browserContext = results
      .filter(r => r.success)
      .map(r => {
        if (r.task.type === 'analyze' && r.data?.analysis) {
          return r.data.analysis;
        }
        if (r.task.type === 'compare' && r.data?.comparison) {
          return r.data.comparison;
        }
        return JSON.stringify(r.data, null, 2);
      })
      .join('\n\n---\n\n');

    return `
${basePrompt}

BROWSER CONTEXT:
${browserContext}
    `.trim();
  }

  /**
   * Cache management
   */
  private getCacheKey(task: BrowserTask): string {
    return JSON.stringify({
      type: task.type,
      url: task.url,
      urls: task.urls,
      selectors: task.selectors,
      query: task.query
    });
  }

  private enforceCacheLimit(): void {
    if (this.taskCache.size > this.maxCacheSize) {
      const entries = Array.from(this.taskCache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      const toRemove = entries.slice(0, entries.length - this.maxCacheSize);
      toRemove.forEach(([key]) => this.taskCache.delete(key));
    }
  }

  clearCache(): void {
    this.taskCache.clear();
  }

  getCacheStats(): { size: number; maxSize: number; hitRate: number } {
    return {
      size: this.taskCache.size,
      maxSize: this.maxCacheSize,
      hitRate: 0 // Would need to track hits/misses
    };
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{
    browser: { available: boolean; type: string };
    cache: { enabled: boolean; size: number };
  }> {
    return {
      browser: { available: true, type: this.browser ? 'cloudflare-browser' : 'fetch-fallback' },
      cache: {
        enabled: this.cacheEnabled,
        size: this.taskCache.size
      }
    };
  }

  /**
   * Helper methods for Gemini formatting
   */
  private formatSnapshotForGemini(snapshot: PageSnapshot, purpose: string): string {
    const parts: string[] = [];
    
    parts.push(`Browser Analysis for: ${purpose}`);
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

  private formatComparisonForGemini(snapshots: PageSnapshot[], purpose: string): string {
    const comparisons = snapshots.map((snapshot, i) => {
      return `
Page ${i + 1}: ${snapshot.url}
Title: ${snapshot.title}
${snapshot.metadata.description ? `Description: ${snapshot.metadata.description}` : ''}
Content Preview: ${snapshot.text.slice(0, 300)}...
      `.trim();
    });

    return `
Multi-Page Comparison for: ${purpose}

${comparisons.join('\n\n---\n\n')}
    `.trim();
  }
}

/**
 * Smart task planner - decides the most efficient way to accomplish browser tasks
 */
export class SmartTaskPlanner {
  constructor(private controller: GeminiBrowserController) {}

  /**
   * Plan and execute tasks optimally
   * Analyzes dependencies and parallelization opportunities
   */
  async planAndExecute(goals: string[]): Promise<BrowserTaskResult[]> {
    const tasks = this.goalsToTasks(goals);
    const optimizedTasks = this.optimizeTaskOrder(tasks);

    return await this.controller.executeBatch(optimizedTasks);
  }

  private goalsToTasks(goals: string[]): BrowserTask[] {
    // Simple heuristic - convert goals to tasks
    // In a real implementation, this would use AI to understand the goals
    return goals.map(goal => ({
      type: 'analyze',
      url: this.extractUrl(goal),
      purpose: goal
    } as BrowserTask));
  }

  private extractUrl(goal: string): string {
    const urlMatch = goal.match(/https?:\/\/[^\s]+/);
    return urlMatch ? urlMatch[0] : '';
  }

  private optimizeTaskOrder(tasks: BrowserTask[]): BrowserTask[] {
    // Simple optimization - group by domain to leverage browser caching
    const domainMap = new Map<string, BrowserTask[]>();

    for (const task of tasks) {
      if (task.url) {
        try {
          const url = new URL(task.url);
          const domain = url.hostname;
          
          if (!domainMap.has(domain)) {
            domainMap.set(domain, []);
          }
          domainMap.get(domain)!.push(task);
        } catch {
          // Invalid URL, keep as is
        }
      }
    }

    // Flatten back to array, with same-domain tasks grouped
    const optimized: BrowserTask[] = [];
    for (const tasks of domainMap.values()) {
      optimized.push(...tasks);
    }

    // Add any tasks without valid URLs
    for (const task of tasks) {
      if (!task.url) {
        optimized.push(task);
      }
    }

    return optimized;
  }
}

export function createGeminiBrowserController(config: GeminiBrowserConfig): GeminiBrowserController {
  return new GeminiBrowserController(config);
}

export function createSmartTaskPlanner(controller: GeminiBrowserController): SmartTaskPlanner {
  return new SmartTaskPlanner(controller);
}