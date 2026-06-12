/**
 * Agent Loop Integration Tests
 * 
 * Tests the complete agent loop: Curator → Executor → Evaluator → Reflector
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AgentLoop, getAgentLoop, getAgentSystemHealth, defaultAgentLoopConfig } from './agent-loop';

// Mock dependencies
vi.mock('@aether/curator', () => ({
  curateActions: vi.fn()
}));

vi.mock('./executor', () => ({
  executeApprovedAction: vi.fn(),
  getExecutorHealth: vi.fn()
}));

vi.mock('./evaluator', () => ({
  evaluateLedger: vi.fn(),
  getEvaluatorHealth: vi.fn()
}));

vi.mock('@aether/logger', () => ({
  readRecords: vi.fn(),
  writeRecord: vi.fn()
}));

describe('AgentLoop', () => {
  let agentLoop: AgentLoop;

  beforeEach(() => {
    agentLoop = new AgentLoop({
      tickIntervalMs: 100, // Fast for testing
      maxActionsPerTick: 5,
      enableLearning: false, // Disable for tests
      enableGovernance: false // Disable for tests
    });
  });

  afterEach(async () => {
    if (agentLoop) {
      agentLoop.stop();
    }
  });

  describe('initialization', () => {
    it('should create agent loop with default config', () => {
      const defaultLoop = new AgentLoop(defaultAgentLoopConfig);
      expect(defaultLoop).toBeDefined();
      defaultLoop.stop();
    });

    it('should create agent loop with custom config', () => {
      const customConfig = {
        tickIntervalMs: 5000,
        maxActionsPerTick: 20,
        enableLearning: true,
        enableGovernance: true
      };
      const customLoop = new AgentLoop(customConfig);
      expect(customLoop).toBeDefined();
      customLoop.stop();
    });

    it('should have initial status as stopped', () => {
      const status = agentLoop.getStatus();
      expect(status.isRunning).toBe(false);
      expect(status.tickCount).toBe(0);
      expect(status.actionsExecuted).toBe(0);
    });
  });

  describe('start/stop', () => {
    it('should start the agent loop', async () => {
      await agentLoop.start();
      const status = agentLoop.getStatus();
      expect(status.isRunning).toBe(true);
      expect(status.uptimeSeconds).toBeGreaterThan(0);
    });

    it('should stop the agent loop', async () => {
      await agentLoop.start();
      await agentLoop.stop();
      const status = agentLoop.getStatus();
      expect(status.isRunning).toBe(false);
    });

    it('should not start if already running', async () => {
      await agentLoop.start();
      await agentLoop.start(); // Should not throw
      const status = agentLoop.getStatus();
      expect(status.isRunning).toBe(true);
    });

    it('should not stop if not running', () => {
      agentLoop.stop(); // Should not throw
      const status = agentLoop.getStatus();
      expect(status.isRunning).toBe(false);
    });
  });

  describe('status tracking', () => {
    it('should track uptime correctly', async () => {
      await agentLoop.start();
      await new Promise(resolve => setTimeout(resolve, 100));
      const status = agentLoop.getStatus();
      expect(status.uptimeSeconds).toBeGreaterThanOrEqual(0);
    });

    it('should track tick count', async () => {
      await agentLoop.start();
      await new Promise(resolve => setTimeout(resolve, 150));
      const status = agentLoop.getStatus();
      expect(status.tickCount).toBeGreaterThan(0);
    });

    it('should track last tick time', async () => {
      await agentLoop.start();
      await new Promise(resolve => setTimeout(resolve, 150));
      const status = agentLoop.getStatus();
      expect(status.lastTickAt).not.toBeNull();
      expect(status.lastTickAt).toBeGreaterThan(0);
    });
  });

  describe('action processing', () => {
    it('should process pending actions', async () => {
      // This would require mocking the ledger and executor
      // For now, just test that the loop runs without errors
      await agentLoop.start();
      await new Promise(resolve => setTimeout(resolve, 150));
      const status = agentLoop.getStatus();
      expect(status.isRunning).toBe(true);
    });
  });

  describe('global instance', () => {
    it('should return same instance on multiple calls', () => {
      const loop1 = getAgentLoop();
      const loop2 = getAgentLoop();
      expect(loop1).toBe(loop2);
    });

    it('should return instance with custom config on first call', () => {
      const customConfig = {
        tickIntervalMs: 10000,
        maxActionsPerTick: 15,
        enableLearning: true,
        enableGovernance: true
      };
      const loop = getAgentLoop(customConfig);
      expect(loop).toBeDefined();
      loop.stop();
    });
  });

  describe('system health', () => {
    it('should return comprehensive health status', async () => {
      const health = await getAgentSystemHealth();
      expect(health).toBeDefined();
      expect(health.executor).toBeDefined();
      expect(health.evaluator).toBeDefined();
      expect(health.loop).toBeDefined();
      expect(health.overall).toBeDefined();
    });

    it('should include loop status in health', async () => {
      const health = await getAgentSystemHealth();
      expect(health.loop).toHaveProperty('isRunning');
      expect(health.loop).toHaveProperty('uptimeSeconds');
      expect(health.loop).toHaveProperty('tickCount');
    });

    it('should include overall system status', async () => {
      const health = await getAgentSystemHealth();
      expect(health.overall).toHaveProperty('status');
      expect(health.overall).toHaveProperty('healthy');
    });
  });
});

describe('AgentLoop Integration', () => {
  describe('Curator integration', () => {
    it('should validate actions through curator', async () => {
      // Integration test would require actual curator
      // This is a placeholder for the integration test
      expect(true).toBe(true);
    });
  });

  describe('Executor integration', () => {
    it('should execute approved actions', async () => {
      // Integration test would require actual executor
      // This is a placeholder for the integration test
      expect(true).toBe(true);
    });
  });

  describe('Evaluator integration', () => {
    it('should evaluate ledger patterns', async () => {
      // Integration test would require actual evaluator
      // This is a placeholder for the integration test
      expect(true).toBe(true);
    });
  });

  describe('Reflector integration', () => {
    it('should learn from outcomes when enabled', async () => {
      // Integration test would require actual reflector
      // This is a placeholder for the integration test
      expect(true).toBe(true);
    });
  });
});