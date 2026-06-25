import { Provider, Model, LLMRequest, LLMResponse, ProviderConfig, ProviderStats } from './types';
import { RateLimiter } from './rate-limiter';
import { calculateCost, estimateTokens } from './costs';

export abstract class BaseProvider {
  protected config: ProviderConfig;
  protected rateLimiter: RateLimiter;
  protected stats: ProviderStats;

  constructor(config: ProviderConfig) {
    this.config = config;
    this.rateLimiter = new RateLimiter(
      config.maxRequestsPerMinute,
      config.maxTokensPerMinute
    );
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageLatency: 0,
      totalCost: 0
    };
  }

  abstract getProviderType(): Provider;
  abstract makeRequest(request: LLMRequest): Promise<LLMResponse>;

  async execute(request: LLMRequest): Promise<LLMResponse> {
    const estimatedTokens = estimateTokens(
      request.messages.map((m) => m.content).join('\n')
    );

    if (!this.rateLimiter.canMakeRequest(estimatedTokens)) {
      throw new Error('Rate limit exceeded');
    }

    const startTime = Date.now();
    this.stats.totalRequests++;

    try {
      const response = await this.makeRequest(request);
      const latency = Date.now() - startTime;

      this.rateLimiter.recordRequest(response.tokensUsed);
      this.stats.successfulRequests++;
      this.stats.totalCost += response.cost;

      // Update average latency
      this.stats.averageLatency =
        (this.stats.averageLatency * (this.stats.successfulRequests - 1) +
          latency) /
        this.stats.successfulRequests;

      return response;
    } catch (error) {
      this.stats.failedRequests++;
      this.stats.lastError = error instanceof Error ? error.message : String(error);
      this.stats.lastErrorTime = new Date();
      throw error;
    }
  }

  getStats(): ProviderStats {
    return { ...this.stats };
  }

  resetStats(): void {
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageLatency: 0,
      totalCost: 0
    };
  }

  isHealthy(): boolean {
    // Consider unhealthy if more than 50% of requests failed in the last minute
    if (this.stats.totalRequests > 10) {
      const failureRate = this.stats.failedRequests / this.stats.totalRequests;
      if (failureRate > 0.5) {
        return false;
      }
    }
    return true;
  }
}

export class OpenAIProvider extends BaseProvider {
  getProviderType(): Provider {
    return Provider.OPENAI;
  }

  async makeRequest(request: LLMRequest): Promise<LLMResponse> {
    const baseUrl = this.config.baseUrl || 'https://api.openai.com/v1';
    const model = request.model || Model.GPT_3_5_TURBO;

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.apiKey}`
      },
      body: JSON.stringify({
        model,
        messages: request.messages,
        temperature: request.temperature ?? 0.7,
        max_tokens: request.maxTokens,
        stream: request.stream ?? false
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    const tokensUsed = data.usage?.total_tokens || estimateTokens(content);
    const cost = calculateCost(model, data.usage?.prompt_tokens || 0, data.usage?.completion_tokens || 0);

    return {
      content,
      model,
      provider: Provider.OPENAI,
      tokensUsed,
      latency: 0, // Set by execute()
      cost
    };
  }
}

export class AnthropicProvider extends BaseProvider {
  getProviderType(): Provider {
    return Provider.ANTHROPIC;
  }

  async makeRequest(request: LLMRequest): Promise<LLMResponse> {
    const baseUrl = this.config.baseUrl || 'https://api.anthropic.com/v1';
    const model = request.model || Model.CLAUDE_3_SONNET;

    const response = await fetch(`${baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model,
        messages: request.messages.filter((m) => m.role !== 'system'),
        system: request.messages.find((m) => m.role === 'system')?.content,
        max_tokens: request.maxTokens || 4096,
        temperature: request.temperature ?? 0.7,
        stream: request.stream ?? false
      })
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.content[0].text;
    const tokensUsed = data.usage?.input_tokens + data.usage?.output_tokens || estimateTokens(content);
    const cost = calculateCost(model, data.usage?.input_tokens || 0, data.usage?.output_tokens || 0);

    return {
      content,
      model,
      provider: Provider.ANTHROPIC,
      tokensUsed,
      latency: 0,
      cost
    };
  }
}

export class GoogleProvider extends BaseProvider {
  getProviderType(): Provider {
    return Provider.GOOGLE;
  }

  async makeRequest(request: LLMRequest): Promise<LLMResponse> {
    const baseUrl = this.config.baseUrl || 'https://generativelanguage.googleapis.com/v1beta';
    const model = request.model || Model.GEMINI_PRO;

    const response = await fetch(
      `${baseUrl}/models/${model}:generateContent?key=${this.config.apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: request.messages.map((m) => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }]
          })),
          generationConfig: {
            temperature: request.temperature ?? 0.7,
            maxOutputTokens: request.maxTokens
          }
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Google API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.candidates[0].content.parts[0].text;
    const tokensUsed = data.usageMetadata?.totalTokenCount || estimateTokens(content);
    const cost = calculateCost(model, data.usageMetadata?.promptTokenCount || 0, data.usageMetadata?.candidatesTokenCount || 0);

    return {
      content,
      model,
      provider: Provider.GOOGLE,
      tokensUsed,
      latency: 0,
      cost
    };
  }
}

export function createProvider(
  provider: Provider,
  config: ProviderConfig
): BaseProvider {
  switch (provider) {
    case Provider.OPENAI:
      return new OpenAIProvider(config);
    case Provider.ANTHROPIC:
      return new AnthropicProvider(config);
    case Provider.GOOGLE:
      return new GoogleProvider(config);
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}
