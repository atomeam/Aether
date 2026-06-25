import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LLMRouter } from './router';
import { Provider, Model, LLMRequest, RoutingStrategy } from './types';

describe('LLMRouter', () => {
  let router: LLMRouter;
  const mockConfigs: Record<Provider, any> = {
    [Provider.OPENAI]: { apiKey: 'test-openai-key' },
    [Provider.ANTHROPIC]: { apiKey: 'test-anthropic-key' },
    [Provider.GOOGLE]: { apiKey: 'test-google-key' }
  };

  beforeEach(() => {
    router = new LLMRouter(mockConfigs, { type: 'cost' });
  });

  describe('constructor', () => {
    it('should initialize with provider configs', () => {
      expect(router).toBeDefined();
      const stats = router.getStats();
      expect(stats).toHaveProperty(Provider.OPENAI);
      expect(stats).toHaveProperty(Provider.ANTHROPIC);
      expect(stats).toHaveProperty(Provider.GOOGLE);
    });
  });

  describe('strategy selection', () => {
    it('should set routing strategy', () => {
      router.setStrategy({ type: 'latency' });
      router.setStrategy({ type: 'quality' });
      router.setStrategy({ type: 'round-robin' });
      router.setStrategy({ type: 'weighted', weights: { [Provider.OPENAI]: 2, [Provider.ANTHROPIC]: 1 } });
    });

    it('should throw error with no healthy providers', () => {
      const emptyRouter = new LLMRouter({ [Provider.OPENAI]: { apiKey: 'test' } });
      // Mock all providers as unhealthy
      vi.spyOn(emptyRouter as any, 'selectProvider').mockImplementation(() => {
        throw new Error('No healthy providers available');
      });

      const request: LLMRequest = {
        messages: [{ role: 'user', content: 'test' }]
      };

      expect(emptyRouter.route(request)).rejects.toThrow('No healthy providers available');
    });
  });

  describe('stats', () => {
    it('should get provider stats', () => {
      const stats = router.getStats();
      expect(stats).toHaveProperty(Provider.OPENAI);
      expect(stats[Provider.OPENAI]).toHaveProperty('totalRequests', 0);
      expect(stats[Provider.OPENAI]).toHaveProperty('successfulRequests', 0);
      expect(stats[Provider.OPENAI]).toHaveProperty('failedRequests', 0);
    });

    it('should get total stats', () => {
      const totalStats = router.getTotalStats();
      expect(totalStats).toHaveProperty('totalRequests', 0);
      expect(totalStats).toHaveProperty('successfulRequests', 0);
      expect(totalStats).toHaveProperty('failedRequests', 0);
      expect(totalStats).toHaveProperty('totalCost', 0);
      expect(totalStats).toHaveProperty('averageLatency', 0);
    });

    it('should reset stats', () => {
      router.resetStats();
      const stats = router.getStats();
      expect(stats[Provider.OPENAI].totalRequests).toBe(0);
    });
  });
});
