# @aether/llm-router

A production-ready LLM routing and load balancing library for multiple AI providers (OpenAI, Anthropic, Google).

## Features

- **Provider Abstraction Layer**: Unified interface for OpenAI, Anthropic, and Google AI
- **Smart Request Routing**: Route based on cost, latency, quality, round-robin, or custom weights
- **Automatic Fallback**: Seamless fallback to alternative providers on failure
- **Rate Limiting**: Per-provider rate limiting for requests and tokens
- **Cost Tracking**: Real-time cost calculation and tracking
- **TypeScript Types**: Full TypeScript support with Zod schemas
- **Comprehensive Tests**: Full test coverage with Vitest

## Installation

```bash
npm install @aether/llm-router
```

## Quick Start

```typescript
import { LLMRouter, Provider, Model } from '@aether/llm-router';

// Configure your providers
const router = new LLMRouter(
  {
    [Provider.OPENAI]: {
      apiKey: process.env.OPENAI_API_KEY!,
      maxRequestsPerMinute: 60,
      maxTokensPerMinute: 90000
    },
    [Provider.ANTHROPIC]: {
      apiKey: process.env.ANTHROPIC_API_KEY!,
      maxRequestsPerMinute: 50,
      maxTokensPerMinute: 80000
    },
    [Provider.GOOGLE]: {
      apiKey: process.env.GOOGLE_API_KEY!,
      maxRequestsPerMinute: 60,
      maxTokensPerMinute: 90000
    }
  },
  { type: 'cost' } // Routing strategy
);

// Make a request
const response = await router.route({
  messages: [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: 'Hello, how are you?' }
  ],
  model: Model.GPT_4,
  temperature: 0.7,
  maxTokens: 1000
});

console.log(response.content);
console.log(`Cost: $${response.cost.toFixed(4)}`);
console.log(`Latency: ${response.latency}ms`);
```

## Routing Strategies

### Cost-Based Routing

Routes requests to the most cost-effective provider:

```typescript
const router = new LLMRouter(configs, { type: 'cost' });
```

### Latency-Based Routing

Routes requests to the provider with the lowest average latency:

```typescript
const router = new LLMRouter(configs, { type: 'latency' });
```

### Quality-Based Routing

Routes requests to the highest quality provider based on model capabilities:

```typescript
const router = new LLMRouter(configs, { type: 'quality' });
```

### Round-Robin Routing

Distributes requests evenly across all providers:

```typescript
const router = new LLMRouter(configs, { type: 'round-robin' });
```

### Weighted Routing

Routes requests based on custom weights:

```typescript
const router = new LLMRouter(configs, {
  type: 'weighted',
  weights: {
    [Provider.OPENAI]: 2,
    [Provider.ANTHROPIC]: 1,
    [Provider.GOOGLE]: 1
  }
});
```

## Rate Limiting

Each provider has built-in rate limiting:

```typescript
const router = new LLMRouter(
  {
    [Provider.OPENAI]: {
      apiKey: 'your-key',
      maxRequestsPerMinute: 60,      // Max 60 requests per minute
      maxTokensPerMinute: 90000      // Max 90k tokens per minute
    }
  }
);
```

## Cost Tracking

Track costs across all providers:

```typescript
const stats = router.getTotalStats();
console.log(`Total cost: $${stats.totalCost.toFixed(4)}`);
console.log(`Total requests: ${stats.totalRequests}`);
console.log(`Success rate: ${((stats.successfulRequests / stats.totalRequests) * 100).toFixed(2)}%`);
```

Get per-provider stats:

```typescript
const providerStats = router.getStats();
console.log(providerStats[Provider.OPENAI]);
// {
//   totalRequests: 100,
//   successfulRequests: 98,
//   failedRequests: 2,
//   averageLatency: 1250,
//   totalCost: 0.45
// }
```

## Fallback Mechanism

Automatic fallback to alternative providers on failure:

```typescript
try {
  const response = await router.route(request);
} catch (error) {
  // All providers failed
  console.error('All providers failed:', error);
}
```

## Changing Strategy

Change routing strategy at runtime:

```typescript
router.setStrategy({ type: 'latency' });
router.setStrategy({ type: 'weighted', weights: { [Provider.OPENAI]: 3, [Provider.ANTHROPIC]: 1 } });
```

## Reset Stats

Reset statistics:

```typescript
router.resetStats();
```

## API Reference

### LLMRouter

#### Constructor

```typescript
constructor(
  providerConfigs: Record<Provider, ProviderConfig>,
  strategy: RoutingStrategy = { type: 'cost' }
)
```

#### Methods

- `route(request: LLMRequest): Promise<LLMResponse>` - Route and execute a request
- `setStrategy(strategy: RoutingStrategy): void` - Change routing strategy
- `getStats(): Record<Provider, ProviderStats>` - Get per-provider statistics
- `getTotalStats(): TotalStats` - Get aggregated statistics
- `resetStats(): void` - Reset all statistics

### Types

```typescript
enum Provider {
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic',
  GOOGLE = 'google'
}

enum Model {
  GPT_4 = 'gpt-4',
  GPT_4_TURBO = 'gpt-4-turbo',
  GPT_3_5_TURBO = 'gpt-3.5-turbo',
  CLAUDE_3_OPUS = 'claude-3-opus',
  CLAUDE_3_SONNET = 'claude-3-sonnet',
  CLAUDE_3_HAIKU = 'claude-3-haiku',
  GEMINI_PRO = 'gemini-pro',
  GEMINI_ULTRA = 'gemini-ultra'
}

interface LLMRequest {
  messages: Message[];
  model?: Model;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

interface LLMResponse {
  content: string;
  model: Model;
  provider: Provider;
  tokensUsed: number;
  latency: number;
  cost: number;
}
```

## Cost Calculation

Automatic cost calculation based on token usage:

```typescript
import { calculateCost, estimateTokens } from '@aether/llm-router';

const cost = calculateCost(Model.GPT_4, 1000, 500); // $0.06
const estimatedTokens = estimateTokens('Your text here');
```

## Testing

```bash
npm test
npm run test:coverage
npm run test:ui
```

## License

MIT
