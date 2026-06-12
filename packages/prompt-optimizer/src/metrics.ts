import { TestResult, PerformanceMetrics } from './types';

export class MetricsTracker {
  private results: Map<string, TestResult[]> = new Map();

  recordResult(promptId: string, result: TestResult): void {
    const existing = this.results.get(promptId) || [];
    existing.push(result);
    this.results.set(promptId, existing);
  }

  getMetrics(promptId: string): PerformanceMetrics {
    const results = this.results.get(promptId) || [];
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

    return {
      totalTests,
      successRate,
      averageLatency,
      averageQuality,
      totalCost
    };
  }

  getAllMetrics(): Record<string, PerformanceMetrics> {
    const metrics: Record<string, PerformanceMetrics> = {};

    for (const [promptId] of this.results.entries()) {
      metrics[promptId] = this.getMetrics(promptId);
    }

    return metrics;
  }

  getResults(promptId: string): TestResult[] {
    return this.results.get(promptId) || [];
  }

  clearResults(promptId: string): void {
    this.results.delete(promptId);
  }

  clearAll(): void {
    this.results.clear();
  }

  comparePrompts(promptIds: string[]): {
    best: string;
    worst: string;
    rankings: Array<{ id: string; score: number }>;
  } {
    const scores = promptIds.map((id) => {
      const metrics = this.getMetrics(id);
      const score = this.calculateScore(metrics);
      return { id, score };
    });

    scores.sort((a, b) => b.score - a.score);

    return {
      best: scores[0].id,
      worst: scores[scores.length - 1].id,
      rankings: scores
    };
  }

  private calculateScore(metrics: PerformanceMetrics): number {
    if (metrics.totalTests === 0) return 0;

    const successWeight = 0.4;
    const qualityWeight = 0.3;
    const latencyWeight = 0.2;
    const costWeight = 0.1;

    // Normalize latency (lower is better, cap at 10s)
    const normalizedLatency = Math.min(metrics.averageLatency / 10000, 1);
    const latencyScore = 1 - normalizedLatency;

    // Normalize cost (lower is better, cap at $1)
    const normalizedCost = Math.min(metrics.totalCost, 1);
    const costScore = 1 - normalizedCost;

    return (
      metrics.successRate * successWeight +
      metrics.averageQuality * qualityWeight +
      latencyScore * latencyWeight +
      costScore * costWeight
    );
  }
}
