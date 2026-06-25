import {
  ABTest,
  PromptVariant,
  TestResult,
  VariantMetrics,
  PerformanceMetrics,
  ABTestSchema,
  PromptVariantSchema,
  TestResultSchema,
  PerformanceMetricsSchema
} from './types';

export class ABTestingEngine {
  private tests: Map<string, ABTest> = new Map();
  private results: Map<string, TestResult[]> = new Map();

  createTest(
    name: string,
    variants: Array<{ name: string; prompt: string; weight?: number }>,
    description?: string
  ): ABTest {
    const id = this.generateId();

    const promptVariants: PromptVariant[] = variants.map((v) => ({
      id: this.generateId(),
      templateId: id,
      name: v.name,
      prompt: v.prompt,
      weight: v.weight ?? 1 / variants.length,
      metrics: {
        impressions: 0,
        successes: 0,
        failures: 0,
        averageLatency: 0,
        averageQuality: 0,
        totalCost: 0
      }
    }));

    // Normalize weights
    const totalWeight = promptVariants.reduce((sum, v) => sum + v.weight, 0);
    promptVariants.forEach((v) => {
      v.weight = v.weight / totalWeight;
    });

    const test: ABTest = {
      id,
      name,
      description,
      variants: promptVariants,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    ABTestSchema.parse(test);
    this.tests.set(id, test);
    this.results.set(id, []);
    return test;
  }

  selectVariant(testId: string): PromptVariant {
    const test = this.tests.get(testId);
    if (!test) {
      throw new Error(`Test not found: ${testId}`);
    }

    if (test.status !== 'active') {
      throw new Error(`Test is not active: ${testId}`);
    }

    // Weighted random selection
    const random = Math.random();
    let cumulative = 0;

    for (const variant of test.variants) {
      cumulative += variant.weight;
      if (random <= cumulative) {
        variant.metrics.impressions++;
        return variant;
      }
    }

    // Fallback to last variant
    return test.variants[test.variants.length - 1];
  }

  recordResult(testId: string, result: TestResult): void {
    const test = this.tests.get(testId);
    if (!test) {
      throw new Error(`Test not found: ${testId}`);
    }

    TestResultSchema.parse(result);

    const variant = test.variants.find((v) => v.id === result.variantId);
    if (!variant) {
      throw new Error(`Variant not found: ${result.variantId}`);
    }

    // Update variant metrics
    if (result.success) {
      variant.metrics.successes++;
    } else {
      variant.metrics.failures++;
    }

    // Update running averages
    const totalResults = variant.metrics.successes + variant.metrics.failures;
    variant.metrics.averageLatency =
      (variant.metrics.averageLatency * (totalResults - 1) + result.latency) / totalResults;
    variant.metrics.averageQuality =
      (variant.metrics.averageQuality * (totalResults - 1) + result.quality) / totalResults;
    variant.metrics.totalCost += result.cost;

    // Store result
    const testResults = this.results.get(testId) || [];
    testResults.push(result);
    this.results.set(testId, testResults);

    // Update test timestamp
    test.updatedAt = new Date();
  }

  getTest(testId: string): ABTest | undefined {
    return this.tests.get(testId);
  }

  getAllTests(): ABTest[] {
    return Array.from(this.tests.values());
  }

  getResults(testId: string): TestResult[] {
    return this.results.get(testId) || [];
  }

  getPerformanceMetrics(testId: string): PerformanceMetrics {
    const test = this.tests.get(testId);
    if (!test) {
      throw new Error(`Test not found: ${testId}`);
    }

    const results = this.results.get(testId) || [];
    const totalTests = results.length;

    if (totalTests === 0) {
      return {
        totalTests: 0,
        successRate: 0,
        averageLatency: 0,
        averageQuality: 0,
        totalCost: 0
      };
    }

    const successes = results.filter((r) => r.success).length;
    const successRate = successes / totalTests;
    const averageLatency = results.reduce((sum, r) => sum + r.latency, 0) / totalTests;
    const averageQuality = results.reduce((sum, r) => sum + r.quality, 0) / totalTests;
    const totalCost = results.reduce((sum, r) => sum + r.cost, 0);

    // Find best and worst variants
    let bestVariant: string | undefined;
    let worstVariant: string | undefined;
    let bestScore = -Infinity;
    let worstScore = Infinity;

    for (const variant of test.variants) {
      const score = this.calculateVariantScore(variant);
      if (score > bestScore) {
        bestScore = score;
        bestVariant = variant.id;
      }
      if (score < worstScore) {
        worstScore = score;
        worstVariant = variant.id;
      }
    }

    const metrics: PerformanceMetrics = {
      totalTests,
      successRate,
      averageLatency,
      averageQuality,
      totalCost,
      bestVariant,
      worstVariant
    };

    PerformanceMetricsSchema.parse(metrics);
    return metrics;
  }

  concludeTest(testId: string, winnerId?: string): ABTest {
    const test = this.tests.get(testId);
    if (!test) {
      throw new Error(`Test not found: ${testId}`);
    }

    if (winnerId) {
      const variant = test.variants.find((v) => v.id === winnerId);
      if (!variant) {
        throw new Error(`Variant not found: ${winnerId}`);
      }
      test.winner = winnerId;
    } else {
      // Auto-select winner based on metrics
      const metrics = this.getPerformanceMetrics(testId);
      test.winner = metrics.bestVariant;
    }

    test.status = 'completed';
    test.updatedAt = new Date();

    return test;
  }

  pauseTest(testId: string): ABTest {
    const test = this.tests.get(testId);
    if (!test) {
      throw new Error(`Test not found: ${testId}`);
    }

    test.status = 'paused';
    test.updatedAt = new Date();
    return test;
  }

  resumeTest(testId: string): ABTest {
    const test = this.tests.get(testId);
    if (!test) {
      throw new Error(`Test not found: ${testId}`);
    }

    test.status = 'active';
    test.updatedAt = new Date();
    return test;
  }

  deleteTest(testId: string): boolean {
    this.results.delete(testId);
    return this.tests.delete(testId);
  }

  private calculateVariantScore(variant: PromptVariant): number {
    const metrics = variant.metrics;
    const total = metrics.successes + metrics.failures;

    if (total === 0) return 0;

    const successRate = metrics.successes / total;
    const qualityWeight = 0.4;
    const latencyWeight = 0.3;
    const costWeight = 0.3;

    // Normalize latency (lower is better, cap at 10s)
    const normalizedLatency = Math.min(metrics.averageLatency / 10000, 1);
    const latencyScore = 1 - normalizedLatency;

    // Normalize cost (lower is better, cap at $1)
    const normalizedCost = Math.min(metrics.totalCost, 1);
    const costScore = 1 - normalizedCost;

    return (
      successRate * qualityWeight +
      metrics.averageQuality * qualityWeight +
      latencyScore * latencyWeight +
      costScore * costWeight
    );
  }

  private generateId(): string {
    return `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
