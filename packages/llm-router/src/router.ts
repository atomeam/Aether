import { Provider, Model, LLMRequest, LLMResponse, RoutingStrategy, ProviderConfig } from './types';
import { BaseProvider, createProvider } from './provider';
import { MODEL_COSTS } from './costs';

export class LLMRouter {
  private providers: Map<Provider, BaseProvider>;
  private strategy: RoutingStrategy;
  private roundRobinIndex: number = 0;

  constructor(
    providerConfigs: Record<Provider, ProviderConfig>,
    strategy: RoutingStrategy = { type: 'cost' }
  ) {
    this.providers = new Map();
    this.strategy = strategy;

    for (const [provider, config] of Object.entries(providerConfigs)) {
      this.providers.set(provider as Provider, createProvider(provider as Provider, config));
    }
  }

  async route(request: LLMRequest): Promise<LLMResponse> {
    const selectedProvider = this.selectProvider(request);
    return await this.executeWithFallback(request, selectedProvider);
  }

  private selectProvider(request: LLMRequest): Provider {
    const availableProviders = Array.from(this.providers.entries()).filter(
      ([_, provider]) => provider.isHealthy()
    );

    if (availableProviders.length === 0) {
      throw new Error('No healthy providers available');
    }

    switch (this.strategy.type) {
      case 'cost':
        return this.selectByCost(availableProviders, request);
      case 'latency':
        return this.selectByLatency(availableProviders);
      case 'quality':
        return this.selectByQuality(availableProviders, request);
      case 'round-robin':
        return this.selectByRoundRobin(availableProviders);
      case 'weighted':
        return this.selectByWeighted(availableProviders);
      default:
        return availableProviders[0][0];
    }
  }

  private selectByCost(
    providers: Array<[Provider, BaseProvider]>,
    request: LLMRequest
  ): Provider {
    const model = request.model || Model.GPT_3_5_TURBO;
    const sorted = [...providers].sort((a, b) => {
      const costA = MODEL_COSTS[model].inputCostPer1k + MODEL_COSTS[model].outputCostPer1k;
      const costB = MODEL_COSTS[model].inputCostPer1k + MODEL_COSTS[model].outputCostPer1k;
      return costA - costB;
    });
    return sorted[0][0];
  }

  private selectByLatency(providers: Array<[Provider, BaseProvider]>): Provider {
    const sorted = [...providers].sort((a, b) => {
      const statsA = a[1].getStats();
      const statsB = b[1].getStats();
      return statsA.averageLatency - statsB.averageLatency;
    });
    return sorted[0][0];
  }

  private selectByQuality(
    providers: Array<[Provider, BaseProvider]>,
    request: LLMRequest
  ): Provider {
    // Quality heuristic: prefer more capable models for complex tasks
    const model = request.model || Model.GPT_3_5_TURBO;
    const qualityOrder = [
      Model.GPT_4,
      Model.GPT_4_TURBO,
      Model.CLAUDE_3_OPUS,
      Model.CLAUDE_3_SONNET,
      Model.GEMINI_ULTRA,
      Model.GEMINI_PRO,
      Model.GPT_3_5_TURBO,
      Model.CLAUDE_3_HAIKU
    ];

    const modelIndex = qualityOrder.indexOf(model);
    if (modelIndex !== -1) {
      // Find provider that supports this model
      for (const [provider, _] of providers) {
        if (this.providerSupportsModel(provider, model)) {
          return provider;
        }
      }
    }

    // Fallback to first available
    return providers[0][0];
  }

  private selectByRoundRobin(providers: Array<[Provider, BaseProvider]>): Provider {
    const provider = providers[this.roundRobinIndex % providers.length][0];
    this.roundRobinIndex++;
    return provider;
  }

  private selectByWeighted(providers: Array<[Provider, BaseProvider]>): Provider {
    const weights = this.strategy.weights || {};
    const totalWeight = providers.reduce((sum, [provider]) => {
      return sum + (weights[provider] || 1);
    }, 0);

    let random = Math.random() * totalWeight;
    for (const [provider] of providers) {
      random -= weights[provider] || 1;
      if (random <= 0) {
        return provider;
      }
    }

    return providers[0][0];
  }

  private providerSupportsModel(provider: Provider, model: Model): boolean {
    // Simplified model support check
    switch (provider) {
      case Provider.OPENAI:
        return model.startsWith('gpt');
      case Provider.ANTHROPIC:
        return model.startsWith('claude');
      case Provider.GOOGLE:
        return model.startsWith('gemini');
      default:
        return false;
    }
  }

  private async executeWithFallback(
    request: LLMRequest,
    primaryProvider: Provider
  ): Promise<LLMResponse> {
    const provider = this.providers.get(primaryProvider);
    if (!provider) {
      throw new Error(`Provider ${primaryProvider} not found`);
    }

    try {
      return await provider.execute(request);
    } catch (error) {
      console.error(`Primary provider ${primaryProvider} failed:`, error);

      // Try fallback providers
      const fallbackProviders = Array.from(this.providers.entries())
        .filter(([p]) => p !== primaryProvider)
        .filter(([_, p]) => p.isHealthy());

      for (const [fallbackProvider, fallbackInstance] of fallbackProviders) {
        try {
          console.log(`Trying fallback provider: ${fallbackProvider}`);
          return await fallbackInstance.execute(request);
        } catch (fallbackError) {
          console.error(`Fallback provider ${fallbackProvider} failed:`, fallbackError);
        }
      }

      throw new Error('All providers failed');
    }
  }

  setStrategy(strategy: RoutingStrategy): void {
    this.strategy = strategy;
  }

  getStats(): Record<Provider, any> {
    const stats: Record<Provider, any> = {};
    for (const [provider, instance] of this.providers.entries()) {
      stats[provider] = instance.getStats();
    }
    return stats;
  }

  getTotalStats(): {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    totalCost: number;
    averageLatency: number;
  } {
    let totalRequests = 0;
    let successfulRequests = 0;
    let failedRequests = 0;
    let totalCost = 0;
    let totalLatency = 0;
    let latencyCount = 0;

    for (const provider of this.providers.values()) {
      const stats = provider.getStats();
      totalRequests += stats.totalRequests;
      successfulRequests += stats.successfulRequests;
      failedRequests += stats.failedRequests;
      totalCost += stats.totalCost;
      if (stats.averageLatency > 0) {
        totalLatency += stats.averageLatency;
        latencyCount++;
      }
    }

    return {
      totalRequests,
      successfulRequests,
      failedRequests,
      totalCost,
      averageLatency: latencyCount > 0 ? totalLatency / latencyCount : 0
    };
  }

  resetStats(): void {
    for (const provider of this.providers.values()) {
      provider.resetStats();
    }
  }
}
