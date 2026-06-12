# @aether/gemini-browser - Smart Gemini Browser Control

Intelligent browser automation optimized for Gemini AI workflows in the Aether monorepo.

## Overview

This package provides smart browser control capabilities that integrate seamlessly with Gemini AI calls in the Aether backend. It includes:

- **Intelligent Caching**: Reduces redundant page fetches with smart cache management
- **Batch Processing**: Optimizes multiple page analyses with rate limiting
- **Gemini-Ready Formatting**: Automatically formats browser data for Gemini prompts
- **Task Planning**: Smart task execution with dependency analysis
- **Cloudflare Browser Integration**: Ready to use with Cloudflare Browser Rendering binding

## Features

### Smart Caching
- 5-minute TTL for page snapshots
- Configurable cache size limits
- Automatic cache eviction
- Cache hit tracking

### Batch Processing
- Parallel page analysis with configurable concurrency
- Rate limiting to be polite to servers
- Error isolation (one failure doesn't stop the batch)

### Gemini Integration
- Automatic formatting of browser data for prompts
- Multi-page comparison support
- Context injection for enhanced AI responses

### Task Planning
- Automatic task optimization
- Domain-based grouping for cache efficiency
- Dependency-aware execution

## Usage

### Basic Setup

```typescript
import { createGeminiBrowserController } from '@aether/gemini-browser';

const controller = createGeminiBrowserController({
  apiKey: process.env.GEMINI_API_KEY,
  browser: env.MYBROWSER, // Cloudflare Browser binding
  cacheEnabled: true,
  maxCacheSize: 100
});
```

### Analyze a Page for Gemini

```typescript
const result = await controller.executeTask({
  type: 'analyze',
  url: 'https://example.com',
  purpose: 'Extract product information'
});

if (result.success) {
  // result.data.analysis is formatted for Gemini prompts
  console.log(result.data.analysis);
}
```

### Generate Prompt with Browser Context

```typescript
const prompt = await controller.generatePromptWithBrowserData(
  'Create a product comparison',
  [
    { type: 'analyze', url: 'https://product-a.com', purpose: 'Get product A details' },
    { type: 'analyze', url: 'https://product-b.com', purpose: 'Get product B details' }
  ]
);

// Use this enhanced prompt with Gemini
const geminiResponse = await callGeminiWithRetry('gemini-3-flash-preview', {
  contents: [{ role: 'user', parts: [{ text: prompt }] }]
});
```

### Batch Processing

```typescript
const tasks = [
  { type: 'analyze', url: 'https://example.com/1', purpose: 'Analyze page 1' },
  { type: 'analyze', url: 'https://example.com/2', purpose: 'Analyze page 2' },
  { type: 'analyze', url: 'https://example.com/3', purpose: 'Analyze page 3' },
];

const results = await controller.executeBatch(tasks, 3); // Process 3 at a time
```

### Smart Task Planning

```typescript
import { createSmartTaskPlanner } from '@aether/gemini-browser';

const planner = createSmartTaskPlanner(controller);

const results = await planner.planAndExecute([
  'Analyze https://example.com for pricing',
  'Compare https://product-a.com and https://product-b.com'
]);
```

## Integration with Aether Backend

To integrate with the existing Aether backend:

1. Add the controller to the backend server:

```typescript
// apps/backend/server.ts
import { createGeminiBrowserController } from '@aether/gemini-browser';

const browserController = createGeminiBrowserController({
  apiKey: env.GEMINI_API_KEY,
  browser: null, // Will use fetch fallback unless Cloudflare Browser is available
  cacheEnabled: true
});
```

2. Add a new endpoint for browser-enhanced builds:

```typescript
app.post('/api/build-with-browser', async (req, res) => {
  const { prompt, urls } = req.body;
  
  const browserTasks = urls.map((url: string) => ({
    type: 'analyze' as const,
    url,
    purpose: 'Gather context for UI generation'
  }));
  
  const enhancedPrompt = await browserController.generatePromptWithBrowserData(
    prompt,
    browserTasks
  );
  
  const response = await callGeminiWithRetry('gemini-3-flash-preview', {
    contents: [{ role: 'user', parts: [{ text: enhancedPrompt }] }]
  });
  
  // Process response...
});
```

## Cloudflare Browser Integration

When deployed to Cloudflare Workers with the Browser Rendering binding:

```typescript
// In wrangler.toml:
[browser]
binding = "MYBROWSER"

// In the worker:
const controller = createGeminiBrowserController({
  apiKey: env.GEMINI_API_KEY,
  browser: env.MYBROWSER, // Cloudflare Browser binding
  cacheEnabled: true
});
```

The browser binding provides:
- Full JavaScript execution
- Dynamic content rendering
- Screenshot capabilities
- Advanced selector support

## Performance Optimizations

### Caching Strategy
- Page snapshots cached for 5 minutes
- Cache key includes URL and task type
- Automatic LRU eviction when cache is full

### Batch Processing
- Default concurrency: 3 parallel requests
- Configurable via `executeBatch(tasks, maxConcurrent)`
- 500ms delay between batches to be polite

### Smart Planning
- Groups tasks by domain for cache efficiency
- Executes independent tasks in parallel
- Respects task dependencies

## API Reference

### GeminiBrowserController

#### Methods
- `executeTask(task: BrowserTask): Promise<BrowserTaskResult>`
- `executeBatch(tasks: BrowserTask[], maxConcurrent?: number): Promise<BrowserTaskResult[]>`
- `generatePromptWithBrowserData(basePrompt: string, browserTasks: BrowserTask[]): Promise<string>`
- `clearCache(): void`
- `getCacheStats(): CacheStats`
- `healthCheck(): Promise<HealthStatus>`

### BrowserTask

```typescript
interface BrowserTask {
  type: 'analyze' | 'extract' | 'compare' | 'search';
  url?: string;
  urls?: string[];
  selectors?: Record<string, string>;
  query?: string;
  purpose: string;
}
```

### BrowserTaskResult

```typescript
interface BrowserTaskResult {
  task: BrowserTask;
  success: boolean;
  data?: any;
  error?: string;
  duration: number;
  cached: boolean;
}
```

## Benefits for Gemini Integration

1. **Reduced Token Usage**: Browser data is compressed and formatted efficiently
2. **Faster Responses**: Caching reduces redundant fetches
3. **Better Context**: Structured page data provides richer context for AI
4. **Cost Savings**: Fewer API calls due to caching
5. **Reliability**: Retry logic and error handling improve robustness

## Future Enhancements

- [ ] Integration with search APIs (Google, Bing, etc.)
- [ ] Screenshot generation for visual analysis
- [ ] Advanced selector support with Cloudflare Browser
- [ ] Natural language task planning with AI
- [ ] Content diffing for change detection
- [ ] Webhook support for real-time monitoring
