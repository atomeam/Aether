/**
 * @aether/automation - Workflow orchestration engine
 * 
 * Orchestrates workflow execution with full lifecycle management
 * 
 * @version 1.0.0
 */

import type {
  Workflow,
  Execution,
  ExecutionStatus,
  TriggerEvent,
} from './types';
import { checkWorkflowConditions } from './condition-evaluator';
import { executeActions, type ActionExecutionContext } from './action-executor';
import { triggerManager, type TriggerListener } from './trigger-manager';

export interface WorkflowOrchestratorOptions {
  onExecutionStart?: (execution: Execution) => void | Promise<void>;
  onExecutionComplete?: (execution: Execution) => void | Promise<void>;
  onExecutionFailed?: (execution: Execution) => void | Promise<void>;
  storeExecution?: (execution: Execution) => void | Promise<void>;
}

export interface ExecutionResult {
  execution: Execution;
  success: boolean;
}

/**
 * Workflow orchestrator class
 */
export class WorkflowOrchestrator {
  private workflows: Map<string, Workflow> = new Map();
  private executions: Map<string, Execution> = new Map();
  private options: WorkflowOrchestratorOptions;

  constructor(options: WorkflowOrchestratorOptions = {}) {
    this.options = options;
  }

  /**
   * Register a workflow
   */
  registerWorkflow(workflow: Workflow): void {
    this.workflows.set(workflow.id, workflow);

    // Register trigger listeners for this workflow
    for (const trigger of workflow.triggers) {
      triggerManager.registerTrigger(trigger);

      const listener: TriggerListener = async (event) => {
        if (workflow.status !== 'active') {
          return;
        }

        await this.executeWorkflow(workflow.id, {
          triggerType: event.type,
          triggerData: event.data,
          input: event.data,
        });
      };

      triggerManager.addListener(trigger.type, listener);
    }
  }

  /**
   * Unregister a workflow
   */
  unregisterWorkflow(workflowId: string): void {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      return;
    }

    // Remove trigger listeners
    for (const trigger of workflow.triggers) {
      triggerManager.unregisterTrigger(trigger.id);
    }

    this.workflows.delete(workflowId);
  }

  /**
   * Get a workflow by ID
   */
  getWorkflow(workflowId: string): Workflow | undefined {
    return this.workflows.get(workflowId);
  }

  /**
   * Get all workflows
   */
  getAllWorkflows(): Workflow[] {
    return Array.from(this.workflows.values());
  }

  /**
   * Get workflows by status
   */
  getWorkflowsByStatus(status: Workflow['status']): Workflow[] {
    return Array.from(this.workflows.values()).filter(
      (w) => w.status === status
    );
  }

  /**
   * Execute a workflow
   */
  async executeWorkflow(
    workflowId: string,
    input: {
      triggerType?: TriggerEvent['type'];
      triggerData?: Record<string, unknown>;
      input?: Record<string, unknown>;
    } = {}
  ): Promise<ExecutionResult> {
    const workflow = this.workflows.get(workflowId);

    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    if (workflow.status !== 'active') {
      throw new Error(`Workflow is not active: ${workflowId}`);
    }

    // Check conditions
    const conditionsMet = checkWorkflowConditions(
      workflow.conditions,
      input.input || input.triggerData || {}
    );

    if (!conditionsMet) {
      const execution: Execution = {
        id: this.generateId(),
        workflowId,
        status: 'cancelled',
        triggerType: input.triggerType,
        triggerData: input.triggerData,
        input: input.input,
        error: 'Conditions not met',
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
      };

      await this.storeExecution(execution);
      return { execution, success: false };
    }

    // Create execution record
    const execution: Execution = {
      id: this.generateId(),
      workflowId,
      status: 'running',
      triggerType: input.triggerType,
      triggerData: input.triggerData,
      input: input.input,
      startedAt: new Date().toISOString(),
      steps: [],
    };

    this.executions.set(execution.id, execution);
    await this.options.onExecutionStart?.(execution);
    await this.storeExecution(execution);

    try {
      // Execute actions
      const context: ActionExecutionContext = {
        workflowId,
        executionId: execution.id,
        input: input.input || input.triggerData || {},
        metadata: workflow.metadata,
      };

      const errorHandling = workflow.errorHandling || {
        retryOnFailure: true,
        notifyOnFailure: true,
        continueOnError: false,
      };

      const actionResults = await executeActions(
        workflow.actions,
        context,
        {
          stopOnError: !errorHandling.continueOnError,
        }
      );

      // Record step results
      execution.steps = workflow.actions.map((action, index) => ({
        actionId: action.id,
        status: actionResults[index].status,
        startedAt: execution.startedAt,
        completedAt: new Date().toISOString(),
        error: actionResults[index].error,
        output: actionResults[index].output,
      }));

      // Check if all actions succeeded
      const allSucceeded = actionResults.every((r) => r.success);

      if (allSucceeded) {
        execution.status = 'completed';
        execution.output = actionResults.reduce(
          (acc, result, index) => {
            acc[workflow.actions[index].id] = result.output;
            return acc;
          },
          {} as Record<string, unknown>
        );
      } else {
        execution.status = 'failed';
        execution.error = 'One or more actions failed';
      }

      execution.completedAt = new Date().toISOString();

      await this.options.onExecutionComplete?.(execution);
      await this.storeExecution(execution);

      return { execution, success: allSucceeded };
    } catch (error) {
      execution.status = 'failed';
      execution.error = error instanceof Error ? error.message : 'Unknown error';
      execution.completedAt = new Date().toISOString();

      await this.options.onExecutionFailed?.(execution);
      await this.storeExecution(execution);

      return { execution, success: false };
    }
  }

  /**
   * Get an execution by ID
   */
  getExecution(executionId: string): Execution | undefined {
    return this.executions.get(executionId);
  }

  /**
   * Get all executions for a workflow
   */
  getWorkflowExecutions(workflowId: string): Execution[] {
    return Array.from(this.executions.values()).filter(
      (e) => e.workflowId === workflowId
    );
  }

  /**
   * Store execution (can be overridden for persistence)
   */
  private async storeExecution(execution: Execution): Promise<void> {
    this.executions.set(execution.id, execution);
    await this.options.storeExecution?.(execution);
  }

  /**
   * Generate a unique ID
   */
  private generateId(): string {
    return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Clear all workflows and executions
   */
  clear(): void {
    this.workflows.clear();
    this.executions.clear();
  }
}

/**
 * Global workflow orchestrator instance
 */
export const workflowOrchestrator = new WorkflowOrchestrator();
