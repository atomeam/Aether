/**
 * @aether/profiling - Hot Path Analysis
 * 
 * Hot path analysis implementation for identifying performance-critical
 * code paths and generating optimization recommendations.
 */

import type {
  HotPath,
  HotPathAnalysis,
  OptimizationRecommendation,
  CPUProfile,
} from './types';

// ============================================================================
// Hot Path Analyzer
// ============================================================================

export class HotPathAnalyzer {
  analyze(cpuProfile: CPUProfile): HotPathAnalysis {
    const callTree = this.buildCallTree(cpuProfile);
    const hotPaths = this.identifyHotPaths(callTree);
    const criticalPath = this.findCriticalPath(callTree);
    const recommendations = this.generateRecommendations(hotPaths, cpuProfile);

    return {
      profileId: cpuProfile.id,
      hotPaths,
      criticalPath,
      recommendations,
    };
  }

  private buildCallTree(profile: CPUProfile): HotPath {
    const root: HotPath = {
      id: 'root',
      functionName: 'root',
      fileName: 'root',
      totalTime: 0,
      selfTime: 0,
      callCount: 0,
      percentage: 0,
      children: [],
    };

    const functionStats = new Map<string, { totalTime: number; selfTime: number; callCount: number; fileName: string }>();

    // Aggregate function statistics from samples
    for (const sample of profile.samples) {
      for (let i = 0; i < sample.stackTrace.length; i++) {
        const frame = sample.stackTrace[i];
        const key = `${frame.functionName}:${frame.fileName}`;

        const existing = functionStats.get(key);
        if (existing) {
          existing.totalTime += sample.cpuTime;
          existing.callCount += 1;
          if (i === sample.stackTrace.length - 1) {
            existing.selfTime += sample.cpuTime;
          }
        } else {
          functionStats.set(key, {
            totalTime: sample.cpuTime,
            selfTime: i === sample.stackTrace.length - 1 ? sample.cpuTime : 0,
            callCount: 1,
            fileName: frame.fileName,
          });
        }
      }
    }

    const totalCpuTime = profile.summary.totalCpuTime;

    // Build tree from statistics
    for (const [key, stats] of functionStats) {
      const [functionName, fileName] = key.split(':');
      const percentage = (stats.totalTime / totalCpuTime) * 100;

      const hotPath: HotPath = {
        id: this.generateId(),
        functionName,
        fileName,
        totalTime: stats.totalTime,
        selfTime: stats.selfTime,
        callCount: stats.callCount,
        percentage,
        children: [],
      };

      root.children.push(hotPath);
    }

    // Sort by total time
    root.children.sort((a, b) => b.totalTime - a.totalTime);

    return root;
  }

  private identifyHotPaths(callTree: HotPath, threshold: number = 5): HotPath[] {
    const hotPaths: HotPath[] = [];

    function traverse(node: HotPath) {
      if (node.percentage >= threshold) {
        hotPaths.push(node);
      }
      for (const child of node.children) {
        traverse(child);
      }
    }

    traverse(callTree);
    return hotPaths.sort((a, b) => b.percentage - a.percentage);
  }

  private findCriticalPath(callTree: HotPath): HotPath {
    // Find the path with the highest cumulative time
    let maxPath: HotPath = callTree;
    let maxTime = 0;

    function findMaxPath(node: HotPath, currentPath: HotPath[], currentTotal: number) {
      const newTotal = currentTotal + node.totalTime;
      const newPath = [...currentPath, node];

      if (newTotal > maxTime) {
        maxTime = newTotal;
        maxPath = node;
      }

      for (const child of node.children) {
        findMaxPath(child, newPath, newTotal);
      }
    }

    findMaxPath(callTree, [], 0);
    return maxPath;
  }

  private generateRecommendations(hotPaths: HotPath[], profile: CPUProfile): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = [];

    for (const hotPath of hotPaths.slice(0, 10)) {
      // CPU optimization recommendations
      if (hotPath.percentage > 20) {
        recommendations.push({
          type: 'cpu',
          priority: 'critical',
          functionName: hotPath.functionName,
          fileName: hotPath.fileName,
          description: `Function ${hotPath.functionName} consumes ${hotPath.percentage.toFixed(2)}% of total CPU time`,
          suggestedAction: 'Consider optimizing or caching the result of this function',
          estimatedImpact: hotPath.percentage,
        });
      } else if (hotPath.percentage > 10) {
        recommendations.push({
          type: 'cpu',
          priority: 'high',
          functionName: hotPath.functionName,
          fileName: hotPath.fileName,
          description: `Function ${hotPath.functionName} consumes ${hotPath.percentage.toFixed(2)}% of total CPU time`,
          suggestedAction: 'Review the implementation for potential optimizations',
          estimatedImpact: hotPath.percentage,
        });
      } else if (hotPath.percentage > 5) {
        recommendations.push({
          type: 'cpu',
          priority: 'medium',
          functionName: hotPath.functionName,
          fileName: hotPath.fileName,
          description: `Function ${hotPath.functionName} consumes ${hotPath.percentage.toFixed(2)}% of total CPU time`,
          suggestedAction: 'Consider if this function can be optimized or called less frequently',
          estimatedImpact: hotPath.percentage,
        });
      }

      // Algorithm optimization recommendations
      if (hotPath.callCount > 1000 && hotPath.selfTime > hotPath.totalTime * 0.5) {
        recommendations.push({
          type: 'algorithm',
          priority: 'high',
          functionName: hotPath.functionName,
          fileName: hotPath.fileName,
          description: `Function ${hotPath.functionName} is called ${hotPath.callCount} times with high self-time`,
          suggestedAction: 'Consider memoization or algorithmic improvements',
          estimatedImpact: hotPath.percentage * 0.5,
        });
      }
    }

    // Remove duplicates and sort by priority
    const uniqueRecommendations = this.deduplicateRecommendations(recommendations);
    return uniqueRecommendations.sort((a, b) => this.priorityScore(b.priority) - this.priorityScore(a.priority));
  }

  private deduplicateRecommendations(recommendations: OptimizationRecommendation[]): OptimizationRecommendation[] {
    const seen = new Set<string>();
    const unique: OptimizationRecommendation[] = [];

    for (const rec of recommendations) {
      const key = `${rec.functionName}:${rec.fileName}:${rec.type}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(rec);
      }
    }

    return unique;
  }

  private priorityScore(priority: string): number {
    const scores: Record<string, number> = {
      critical: 4,
      high: 3,
      medium: 2,
      low: 1,
    };
    return scores[priority] || 0;
  }

  private generateId(): string {
    return `hotpath-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }
}

// ============================================================================
// Call Graph Builder
// ============================================================================

export class CallGraphBuilder {
  private edges: Map<string, Set<string>> = new Map();
  private nodeWeights: Map<string, number> = new Map();

  addEdge(caller: string, callee: string, weight: number = 1): void {
    if (!this.edges.has(caller)) {
      this.edges.set(caller, new Set());
    }
    this.edges.get(caller)!.add(callee);

    const existingWeight = this.nodeWeights.get(callee) || 0;
    this.nodeWeights.set(callee, existingWeight + weight);
  }

  getCallers(functionName: string): string[] {
    const callers: string[] = [];
    for (const [caller, callees] of this.edges) {
      if (callees.has(functionName)) {
        callers.push(caller);
      }
    }
    return callers;
  }

  getCallees(functionName: string): string[] {
    return Array.from(this.edges.get(functionName) || []);
  }

  getWeight(functionName: string): number {
    return this.nodeWeights.get(functionName) || 0;
  }

  getTopFunctions(n: number = 10): Array<{ name: string; weight: number }> {
    return Array.from(this.nodeWeights.entries())
      .map(([name, weight]) => ({ name, weight }))
      .sort((a, b) => b.weight - a.weight)
      .slice(0, n);
  }

  clear(): void {
    this.edges.clear();
    this.nodeWeights.clear();
  }
}

// ============================================================================
// Flame Graph Generator
// ============================================================================

export class FlameGraphGenerator {
  generate(cpuProfile: CPUProfile): string {
    const lines: string[] = [];

    for (const sample of cpuProfile.samples) {
      const stack = sample.stackTrace
        .map(frame => `${frame.functionName} (${frame.fileName}:${frame.lineNumber})`)
        .join(';');
      lines.push(`${stack} ${sample.cpuTime}`);
    }

    return lines.join('\n');
  }

  generateFromHotPaths(hotPaths: HotPath[]): string {
    const lines: string[] = [];

    function traverse(node: HotPath, depth: number = 0) {
      const indent = '  '.repeat(depth);
      lines.push(`${indent}${node.functionName} (${node.percentage.toFixed(2)}%)`);
      for (const child of node.children) {
        traverse(child, depth + 1);
      }
    }

    for (const hotPath of hotPaths) {
      traverse(hotPath);
    }

    return lines.join('\n');
  }
}

// ============================================================================
// Global Hot Path Analyzer Instance
// ============================================================================

export const globalHotPathAnalyzer = new HotPathAnalyzer();
export const globalCallGraphBuilder = new CallGraphBuilder();
export const globalFlameGraphGenerator = new FlameGraphGenerator();

// Convenience functions
export function analyzeHotPaths(cpuProfile: CPUProfile): HotPathAnalysis {
  return globalHotPathAnalyzer.analyze(cpuProfile);
}

export function generateFlameGraph(cpuProfile: CPUProfile): string {
  return globalFlameGraphGenerator.generate(cpuProfile);
}

export function generateFlameGraphFromHotPaths(hotPaths: HotPath[]): string {
  return globalFlameGraphGenerator.generateFromHotPaths(hotPaths);
}
