/**
 * @aether/automation - Workflow orchestrator tests
 * 
 * @version 1.0.0
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WorkflowOrchestrator, workflowOrchestrator } from './workflow-orchestrator';
import type { Workflow } from './types';

describe('WorkflowOrchestrator', () => {
  let orchestrator: WorkflowOrchestrator;

  beforeEach(() => {
    orchestrator = new WorkflowOrchestrator();
  });

  describe('registerWorkflow', () => {
    it('should register a workflow', () => {
      const workflow: Workflow = {
        id: 'workflow-1',
        name: 'Test Workflow',
        status: 'active',
        triggers: [],
        actions: [
          {
            id: 'action-1',
            type: 'transform',
            config: { transform: () => ({ result: 'success' }) },
          },
        ],
      };

      orchestrator.registerWorkflow(workflow);

      expect(orchestrator.getWorkflow('workflow-1')).toEqual(workflow);
    });

    it('should throw error when executing non-existent workflow', async () => {
      await expect(
        orchestrator.executeWorkflow('non-existent')
      ).rejects.toThrow('Workflow not found');
    });

    it('should throw error when executing inactive workflow', async () => {
      const workflow: Workflow = {
        id: 'workflow-1',
        name: 'Test Workflow',
        status: 'draft',
        triggers: [],
        actions: [
          {
            id: 'action-1',
            type: 'transform',
            config: { transform: () => ({ result: 'success' }) },
          },
        ],
      };

      orchestrator.registerWorkflow(workflow);

      await expect(
        orchestrator.executeWorkflow('workflow-1')
      ).rejects.toThrow('Workflow is not active');
    });
  });

  describe('unregisterWorkflow', () => {
    it('should unregister a workflow', () => {
      const workflow: Workflow = {
        id: 'workflow-1',
        name: 'Test Workflow',
        status: 'active',
        triggers: [],
        actions: [
          {
            id: 'action-1',
            type: 'transform',
            config: { transform: () => ({ result: 'success' }) },
          },
        ],
      };

      orchestrator.registerWorkflow(workflow);
      orchestrator.unregisterWorkflow('workflow-1');

      expect(orchestrator.getWorkflow('workflow-1')).toBeUndefined();
    });
  });

  describe('getWorkflow', () => {
    it('should return workflow by ID', () => {
      const workflow: Workflow = {
        id: 'workflow-1',
        name: 'Test Workflow',
        status: 'active',
        triggers: [],
        actions: [
          {
            id: 'action-1',
            type: 'transform',
            config: { transform: () => ({ result: 'success' }) },
          },
        ],
      };

      orchestrator.registerWorkflow(workflow);

      expect(orchestrator.getWorkflow('workflow-1')).toEqual(workflow);
    });

    it('should return undefined for non-existent workflow', () => {
      expect(orchestrator.getWorkflow('non-existent')).toBeUndefined();
    });
  });

  describe('getAllWorkflows', () => {
    it('should return all workflows', () => {
      const workflow1: Workflow = {
        id: 'workflow-1',
        name: 'Workflow 1',
        status: 'active',
        triggers: [],
        actions: [
          {
            id: 'action-1',
            type: 'transform',
            config: { transform: () => ({ result: 'success' }) },
          },
        ],
      };

      const workflow2: Workflow = {
        id: 'workflow-2',
        name: 'Workflow 2',
        status: 'active',
        triggers: [],
        actions: [
          {
            id: 'action-1',
            type: 'transform',
            config: { transform: () => ({ result: 'success' }) },
          },
        ],
      };

      orchestrator.registerWorkflow(workflow1);
      orchestrator.registerWorkflow(workflow2);

      const workflows = orchestrator.getAllWorkflows();

      expect(workflows).toHaveLength(2);
      expect(workflows).toContainEqual(workflow1);
      expect(workflows).toContainEqual(workflow2);
    });
  });

  describe('getWorkflowsByStatus', () => {
    it('should return workflows by status', () => {
      const workflow1: Workflow = {
        id: 'workflow-1',
        name: 'Workflow 1',
        status: 'active',
        triggers: [],
        actions: [
          {
            id: 'action-1',
            type: 'transform',
            config: { transform: () => ({ result: 'success' }) },
          },
        ],
      };

      const workflow2: Workflow = {
        id: 'workflow-2',
        name: 'Workflow 2',
        status: 'draft',
        triggers: [],
        actions: [
          {
            id: 'action-1',
            type: 'transform',
            config: { transform: () => ({ result: 'success' }) },
          },
        ],
      };

      orchestrator.registerWorkflow(workflow1);
      orchestrator.registerWorkflow(workflow2);

      const activeWorkflows = orchestrator.getWorkflowsByStatus('active');

      expect(activeWorkflows).toHaveLength(1);
      expect(activeWorkflows[0]).toEqual(workflow1);
    });
  });

  describe('executeWorkflow', () => {
    it('should execute workflow successfully', async () => {
      const workflow: Workflow = {
        id: 'workflow-1',
        name: 'Test Workflow',
        status: 'active',
        triggers: [],
        actions: [
          {
            id: 'action-1',
            type: 'transform',
            config: { transform: () => ({ result: 'success' }) },
          },
        ],
      };

      orchestrator.registerWorkflow(workflow);

      const result = await orchestrator.executeWorkflow('workflow-1', {
        input: { test: 'data' },
      });

      expect(result.success).toBe(true);
      expect(result.execution.status).toBe('completed');
      expect(result.execution.steps).toHaveLength(1);
    });

    it('should cancel execution when conditions not met', async () => {
      const workflow: Workflow = {
        id: 'workflow-1',
        name: 'Test Workflow',
        status: 'active',
        triggers: [],
        actions: [
          {
            id: 'action-1',
            type: 'transform',
            config: { transform: () => ({ result: 'success' }) },
          },
        ],
        conditions: {
          id: 'group-1',
          logic: 'AND',
          conditions: [
            {
              id: 'cond-1',
              field: 'user.email',
              operator: 'contains',
              value: '@example.com',
            },
          ],
        },
      };

      orchestrator.registerWorkflow(workflow);

      const result = await orchestrator.executeWorkflow('workflow-1', {
        input: { user: { email: 'test@gmail.com' } },
      });

      expect(result.success).toBe(false);
      expect(result.execution.status).toBe('cancelled');
      expect(result.execution.error).toBe('Conditions not met');
    });

    it('should handle action failure', async () => {
      const workflow: Workflow = {
        id: 'workflow-1',
        name: 'Test Workflow',
        status: 'active',
        triggers: [],
        actions: [
          {
            id: 'action-1',
            type: 'transform',
            config: { transform: () => {
              throw new Error('Action failed');
            }},
          },
        ],
      };

      orchestrator.registerWorkflow(workflow);

      const result = await orchestrator.executeWorkflow('workflow-1');

      expect(result.success).toBe(false);
      expect(result.execution.status).toBe('failed');
      expect(result.execution.error).toBe('One or more actions failed');
    });

    it('should continue on error when configured', async () => {
      const workflow: Workflow = {
        id: 'workflow-1',
        name: 'Test Workflow',
        status: 'active',
        triggers: [],
        actions: [
          {
            id: 'action-1',
            type: 'transform',
            config: { transform: () => {
              throw new Error('Action failed');
            }},
          },
          {
            id: 'action-2',
            type: 'transform',
            config: { transform: () => ({ result: 'success' }) },
          },
        ],
        errorHandling: {
          retryOnFailure: true,
          notifyOnFailure: true,
          continueOnError: true,
        },
      };

      orchestrator.registerWorkflow(workflow);

      const result = await orchestrator.executeWorkflow('workflow-1');

      expect(result.success).toBe(false);
      expect(result.execution.status).toBe('failed');
      expect(result.execution.steps).toHaveLength(2);
    });

    it('should call onExecutionStart callback', async () => {
      const onStart = vi.fn();

      const orchestratorWithCallback = new WorkflowOrchestrator({
        onExecutionStart: onStart,
      });

      const workflow: Workflow = {
        id: 'workflow-1',
        name: 'Test Workflow',
        status: 'active',
        triggers: [],
        actions: [
          {
            id: 'action-1',
            type: 'transform',
            config: { transform: () => ({ result: 'success' }) },
          },
        ],
      };

      orchestratorWithCallback.registerWorkflow(workflow);
      await orchestratorWithCallback.executeWorkflow('workflow-1');

      expect(onStart).toHaveBeenCalled();
    });

    it('should call onExecutionComplete callback', async () => {
      const onComplete = vi.fn();

      const orchestratorWithCallback = new WorkflowOrchestrator({
        onExecutionComplete: onComplete,
      });

      const workflow: Workflow = {
        id: 'workflow-1',
        name: 'Test Workflow',
        status: 'active',
        triggers: [],
        actions: [
          {
            id: 'action-1',
            type: 'transform',
            config: { transform: () => ({ result: 'success' }) },
          },
        ],
      };

      orchestratorWithCallback.registerWorkflow(workflow);
      await orchestratorWithCallback.executeWorkflow('workflow-1');

      expect(onComplete).toHaveBeenCalled();
    });

    it('should call onExecutionFailed callback', async () => {
      const onFailed = vi.fn();

      const orchestratorWithCallback = new WorkflowOrchestrator({
        onExecutionFailed: onFailed,
      });

      const workflow: Workflow = {
        id: 'workflow-1',
        name: 'Test Workflow',
        status: 'active',
        triggers: [],
        actions: [
          {
            id: 'action-1',
            type: 'transform',
            config: { transform: () => {
              throw new Error('Action failed');
            }},
          },
        ],
      };

      orchestratorWithCallback.registerWorkflow(workflow);
      await orchestratorWithCallback.executeWorkflow('workflow-1');

      expect(onFailed).toHaveBeenCalled();
    });
  });

  describe('getExecution', () => {
    it('should return execution by ID', async () => {
      const workflow: Workflow = {
        id: 'workflow-1',
        name: 'Test Workflow',
        status: 'active',
        triggers: [],
        actions: [
          {
            id: 'action-1',
            type: 'transform',
            config: { transform: () => ({ result: 'success' }) },
          },
        ],
      };

      orchestrator.registerWorkflow(workflow);
      const result = await orchestrator.executeWorkflow('workflow-1');

      const execution = orchestrator.getExecution(result.execution.id);

      expect(execution).toEqual(result.execution);
    });

    it('should return undefined for non-existent execution', () => {
      expect(orchestrator.getExecution('non-existent')).toBeUndefined();
    });
  });

  describe('getWorkflowExecutions', () => {
    it('should return executions for a workflow', async () => {
      const workflow: Workflow = {
        id: 'workflow-1',
        name: 'Test Workflow',
        status: 'active',
        triggers: [],
        actions: [
          {
            id: 'action-1',
            type: 'transform',
            config: { transform: () => ({ result: 'success' }) },
          },
        ],
      };

      orchestrator.registerWorkflow(workflow);
      await orchestrator.executeWorkflow('workflow-1');
      await orchestrator.executeWorkflow('workflow-1');

      const executions = orchestrator.getWorkflowExecutions('workflow-1');

      expect(executions).toHaveLength(2);
    });
  });

  describe('clear', () => {
    it('should clear all workflows and executions', async () => {
      const workflow: Workflow = {
        id: 'workflow-1',
        name: 'Test Workflow',
        status: 'active',
        triggers: [],
        actions: [
          {
            id: 'action-1',
            type: 'transform',
            config: { transform: () => ({ result: 'success' }) },
          },
        ],
      };

      orchestrator.registerWorkflow(workflow);
      await orchestrator.executeWorkflow('workflow-1');
      orchestrator.clear();

      expect(orchestrator.getAllWorkflows()).toHaveLength(0);
      expect(orchestrator.getExecution('any')).toBeUndefined();
    });
  });
});

describe('workflowOrchestrator (global instance)', () => {
  it('should be a singleton instance', () => {
    expect(workflowOrchestrator).toBeInstanceOf(WorkflowOrchestrator);
  });
});
