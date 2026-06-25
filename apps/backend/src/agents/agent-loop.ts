/**
 * Agent Loop Integration
 * 
 * Connects Curator → Executor → Evaluator → Reflector in a continuous loop.
 * Watches for approved actions, executes them, evaluates outcomes, and learns.
 */

import { curateActions } from '@aether/curator';
import { executeApprovedAction, getExecutorHealth } from './executor';
import { evaluateLedger, getEvaluatorHealth } from './evaluator';
import { readRecords } from '@aether/logger';

export interface AgentLoopConfig {
  tickIntervalMs: number;
  maxActionsPerTick: number;
  enableLearning: boolean;
  enableGovernance: boolean;
}

export interface AgentLoopStatus {
  isRunning: boolean;
  uptimeSeconds: number;
  tickCount: number;
  lastTickAt: number | null;
  actionsExecuted: number;
  actionsApproved: number;
  actionsRejected: number;
  evaluationCount: number;
  learningCount: number;
}

export class AgentLoop {
  private isRunning = false;
  private startTime = 0;
  private tickCount = 0;
  private lastTickAt: number | null = null;
  private actionsExecuted = 0;
  private actionsApproved = 0;
  private actionsRejected = 0;
  private evaluationCount = 0;
  private learningCount = 0;
  private intervalId: number | null = null;

  constructor(private config: AgentLoopConfig) {
    this.config = {
      tickIntervalMs: config.tickIntervalMs ?? 60000,
      maxActionsPerTick: config.maxActionsPerTick ?? 10,
      enableLearning: config.enableLearning ?? true,
      enableGovernance: config.enableGovernance ?? true,
    };
  }

  /**
   * Start the agent loop
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.warn('Agent loop is already running');
      return;
    }

    this.isRunning = true;
    this.startTime = Date.now();
    
    console.log('🤖 Agent Loop started');
    console.log(`   Tick interval: ${this.config.tickIntervalMs}ms`);
    console.log(`   Max actions per tick: ${this.config.maxActionsPerTick}`);
    console.log(`   Learning: ${this.config.enableLearning ? 'enabled' : 'disabled'}`);
    console.log(`   Governance: ${this.config.enableGovernance ? 'enabled' : 'disabled'}`);

    // Run initial tick
    await this.executeTick();

    // Start continuous loop
    this.intervalId = setInterval(() => {
      this.executeTick().catch(error => {
        console.error('Agent loop tick error:', error);
      });
    }, this.config.tickIntervalMs) as unknown as number;
  }

  /**
   * Stop the agent loop
   */
  stop(): void {
    if (!this.isRunning) {
      console.warn('Agent loop is not running');
      return;
    }

    this.isRunning = false;
    
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    console.log('🛑 Agent Loop stopped');
  }

  /**
   * Get current loop status
   */
  getStatus(): AgentLoopStatus {
    return {
      isRunning: this.isRunning,
      uptimeSeconds: this.startTime > 0 ? Math.floor((Date.now() - this.startTime) / 1000) : 0,
      tickCount: this.tickCount,
      lastTickAt: this.lastTickAt,
      actionsExecuted: this.actionsExecuted,
      actionsApproved: this.actionsApproved,
      actionsRejected: this.actionsRejected,
      evaluationCount: this.evaluationCount,
      learningCount: this.learningCount
    };
  }

  /**
   * Execute one tick of the agent loop
   */
  private async executeTick(): Promise<void> {
    this.tickCount++;
    this.lastTickAt = Date.now();

    console.log(`\n🔄 Agent Loop Tick #${this.tickCount} at ${new Date().toISOString()}`);

    try {
      // Step 1: Read pending actions from ledger
      const records = await readRecords(3600000); // Last hour
      const pendingActions = records.filter(r => r.status === 'pending');

      if (pendingActions.length === 0) {
        console.log('   ✅ No pending actions to process');
        return;
      }

      console.log(`   📋 Found ${pendingActions.length} pending actions`);

      // Step 2: Process actions (limit to max per tick)
      const actionsToProcess = pendingActions.slice(0, this.config.maxActionsPerTick);
      
      for (const action of actionsToProcess) {
        await this.processAction(action);
      }

      // Step 3: Evaluate ledger if governance enabled
      if (this.config.enableGovernance) {
        await this.evaluateLedger();
      }

      // Step 4: Learn from outcomes if learning enabled
      if (this.config.enableLearning) {
        await this.learnFromOutcomes();
      }

    } catch (error) {
      console.error('Agent loop tick failed:', error);
    }
  }

  /**
   * Process a single action through the agent pipeline
   */
  private async processAction(action: any): Promise<void> {
    console.log(`   🔍 Processing action: ${action.tool}`);

    try {
      // Step 1: Curator validation
      const curatorResult = await curateActions([{
        type: action.tool,
        args: action.args || {}
      }]);

      if (!curatorResult.approved) {
        console.log(`   ❌ Curator rejected action: ${action.tool}: ${curatorResult.reason}`);
        this.actionsRejected++;
        return;
      }

      console.log(`   ✅ Curator approved action: ${action.tool}`);
      this.actionsApproved++;

      // Step 2: Executor execution
      const executorResult = await executeApprovedAction({
        traceId: action.traceId || `trace_${Date.now()}`,
        tool: action.tool,
        args: action.args || {},
        timestamp: Date.now()
      });

      if (executorResult.success) {
        console.log(`   ✅ Executor succeeded: ${action.tool}`);
        this.actionsExecuted++;
      } else {
        console.log(`   ❌ Executor failed: ${action.tool} - ${executorResult.error}`);
      }

    } catch (error) {
      console.error(`   ❌ Action processing failed: ${error}`);
    }
  }

  /**
   * Evaluate ledger for patterns
   */
  private async evaluateLedger(): Promise<void> {
    console.log('   📊 Evaluating ledger patterns...');
    
    try {
      const evaluations = await evaluateLedger(3600000);
      this.evaluationCount++;

      if (evaluations.length > 0) {
        console.log(`   📋 Found ${evaluations.length} patterns:`);
        evaluations.forEach(evaluation => {
          console.log(`      - ${evaluation.pattern}: ${evaluation.suggestion} (${evaluation.priority})`);
        });
      } else {
        console.log('   ✅ No concerning patterns found');
      }
    } catch (error) {
      console.error('   ❌ Ledger evaluation failed:', error);
    }
  }

  /**
   * Learn from outcomes (placeholder for Reflector integration)
   */
  private async learnFromOutcomes(): Promise<void> {
    console.log('   🧠 Learning from outcomes...');
    
    try {
      // This would integrate with Reflector when implemented
      // For now, just count the learning tick
      this.learningCount++;
      console.log('   ✅ Learning tick completed');
    } catch (error) {
      console.error('   ❌ Learning failed:', error);
    }
  }
}

// Default configuration
export const defaultAgentLoopConfig: AgentLoopConfig = {
  tickIntervalMs: 60000, // 1 minute
  maxActionsPerTick: 10,
  enableLearning: true,
  enableGovernance: true
};

// Global agent loop instance
let globalAgentLoop: AgentLoop | null = null;

/**
 * Get or create the global agent loop
 */
export function getAgentLoop(config?: AgentLoopConfig): AgentLoop {
  if (!globalAgentLoop) {
    globalAgentLoop = new AgentLoop(config || defaultAgentLoopConfig);
  }
  return globalAgentLoop;
}

/**
 * Get comprehensive agent system health
 */
export async function getAgentSystemHealth() {
  const executorHealth = getExecutorHealth();
  const evaluatorHealth = getEvaluatorHealth();
  const loop = getAgentLoop();
  const loopStatus = loop.getStatus();

  return {
    executor: executorHealth,
    evaluator: evaluatorHealth,
    loop: loopStatus,
    overall: {
      status: loopStatus.isRunning ? 'running' : 'stopped',
      healthy: executorHealth.status === 'running' && evaluatorHealth.status === 'running'
    }
  };
}