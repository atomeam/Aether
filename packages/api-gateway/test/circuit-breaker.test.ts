/**
 * Circuit Breaker Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CircuitBreaker } from '../src/circuit-breaker.js';

describe('CircuitBreaker', () => {
  let circuitBreaker: CircuitBreaker;

  beforeEach(() => {
    circuitBreaker = new CircuitBreaker({
      threshold: 3,
      timeout: 1000,
      resetTimeout: 2000,
    });
  });

  describe('execute', () => {
    it('should execute function successfully', async () => {
      const fn = vi.fn().mockResolvedValue('success');
      const result = await circuitBreaker.execute(fn);

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should throw error when function fails', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('failure'));

      await expect(circuitBreaker.execute(fn)).rejects.toThrow('failure');
    });

    it('should open circuit after threshold failures', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('failure'));

      // Trigger failures
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute(fn);
        } catch (e) {
          // Expected
        }
      }

      // Circuit should be open
      const state = circuitBreaker.getState();
      expect(state.state).toBe('open');

      // Next call should fail immediately
      await expect(circuitBreaker.execute(fn)).rejects.toThrow('Circuit breaker is OPEN');
    });

    it('should transition to half-open after reset timeout', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('failure'));

      // Trigger failures
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute(fn);
        } catch (e) {
          // Expected
        }
      }

      // Wait for reset timeout
      await new Promise(resolve => setTimeout(resolve, 2100));

      // Should attempt reset
      const successFn = vi.fn().mockResolvedValue('success');
      const result = await circuitBreaker.execute(successFn);

      expect(result).toBe('success');
      expect(circuitBreaker.getState().state).toBe('closed');
    });
  });

  describe('recordSuccess', () => {
    it('should record successful operation', () => {
      circuitBreaker.recordSuccess();
      const state = circuitBreaker.getState();

      expect(state.successCount).toBe(1);
      expect(state.failureCount).toBe(0);
    });

    it('should close circuit when successful in half-open', () => {
      // Manually set to half-open
      circuitBreaker['state'].state = 'half-open';
      circuitBreaker['state'].failureCount = 5;

      circuitBreaker.recordSuccess();
      const state = circuitBreaker.getState();

      expect(state.state).toBe('closed');
      expect(state.failureCount).toBe(0);
    });
  });

  describe('recordFailure', () => {
    it('should record failed operation', () => {
      circuitBreaker.recordFailure();
      const state = circuitBreaker.getState();

      expect(state.failureCount).toBe(1);
      expect(state.successCount).toBe(0);
    });

    it('should trip circuit when threshold exceeded', () => {
      const cb = new CircuitBreaker({
        threshold: 2,
        timeout: 1000,
        resetTimeout: 2000,
      });

      cb.recordFailure();
      cb.recordFailure();

      const state = cb.getState();
      expect(state.state).toBe('open');
    });
  });

  describe('getState', () => {
    it('should return current state', () => {
      const state = circuitBreaker.getState();

      expect(state).toHaveProperty('state');
      expect(state).toHaveProperty('failureCount');
      expect(state).toHaveProperty('successCount');
    });
  });

  describe('open', () => {
    it('should manually open circuit', () => {
      circuitBreaker.open();
      const state = circuitBreaker.getState();

      expect(state.state).toBe('open');
    });
  });

  describe('close', () => {
    it('should manually close circuit', () => {
      circuitBreaker.open();
      circuitBreaker.close();
      const state = circuitBreaker.getState();

      expect(state.state).toBe('closed');
      expect(state.failureCount).toBe(0);
    });
  });

  describe('reset', () => {
    it('should reset circuit breaker', () => {
      circuitBreaker.recordFailure();
      circuitBreaker.recordSuccess();

      circuitBreaker.reset();
      const state = circuitBreaker.getState();

      expect(state.state).toBe('closed');
      expect(state.failureCount).toBe(0);
      expect(state.successCount).toBe(0);
    });
  });
});
