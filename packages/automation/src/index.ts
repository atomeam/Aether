/**
 * @aether/automation - Workflow automation engine
 * 
 * A comprehensive automation engine for workflow orchestration, trigger management,
 * action execution, condition evaluation, and error handling.
 * 
 * @version 1.0.0
 * 
 * @example
 * ```typescript
 * import { workflowOrchestrator, triggerManager } from '@aether/automation';
 * 
 * // Register a workflow
 * const workflow = {
 *   id: 'workflow-1',
 *   name: 'My Workflow',
 *   status: 'active',
 *   triggers: [{ id: 'trigger-1', type: 'webhook', config: { path: '/webhook' } }],
 *   actions: [{ id: 'action-1', type: 'http_request', config: { url: 'https://api.example.com' } }],
 * };
 * 
 * workflowOrchestrator.registerWorkflow(workflow);
 * 
 * // Emit a trigger event
 * await triggerManager.emit({
 *   type: 'webhook',
 *   data: { path: '/webhook' },
 *   timestamp: new Date().toISOString(),
 * });
 * ```
 */

// Types
export * from './types';

// Schemas
export * from './schemas';

// Core engines
export { evaluateCondition, evaluateConditionGroup, checkWorkflowConditions } from './condition-evaluator';
export { executeAction, executeActions, executeActionsParallel, registerActionHandler } from './action-executor';
export { TriggerManager, triggerManager, type TriggerListener } from './trigger-manager';
export { WorkflowOrchestrator, workflowOrchestrator } from './workflow-orchestrator';
export { ErrorHandler, errorHandler } from './error-handler';

// Re-export commonly used types
import type {
  Workflow,
  Execution,
  Trigger,
  Action,
  Condition,
  ConditionGroup,
  AutomationError,
  TriggerEvent,
} from './types';

export type {
  Workflow,
  Execution,
  Trigger,
  Action,
  Condition,
  ConditionGroup,
  AutomationError,
  TriggerEvent,
};
