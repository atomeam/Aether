/**
 * @aether/automation - Error handling system
 * 
 * Centralized error handling with classification and recovery strategies
 * 
 * @version 1.0.0
 */

import type {
  AutomationError,
  ErrorType,
  Workflow,
  Execution,
} from './types';

export interface ErrorContext {
  workflowId?: string;
  executionId?: string;
  actionId?: string;
  additionalData?: Record<string, unknown>;
}

export interface ErrorRecoveryStrategy {
  canRecover: boolean;
  action: 'retry' | 'skip' | 'abort' | 'fallback';
  fallbackAction?: () => Promise<void>;
}

/**
 * Error handler class
 */
export class ErrorHandler {
  private errorLog: AutomationError[] = [];

  /**
   * Classify an error into a type
   */
  classifyError(error: unknown, context?: ErrorContext): ErrorType {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();

      // Network errors
      if (
        message.includes('network') ||
        message.includes('fetch') ||
        message.includes('econnrefused') ||
        message.includes('timeout')
      ) {
        return 'network';
      }

      // Validation errors
      if (
        message.includes('validation') ||
        message.includes('invalid') ||
        message.includes('schema')
      ) {
        return 'validation';
      }

      // Rate limit errors
      if (
        message.includes('rate limit') ||
        message.includes('429') ||
        message.includes('too many requests')
      ) {
        return 'rate_limit';
      }

      // Timeout errors
      if (message.includes('timeout') || message.includes('timed out')) {
        return 'timeout';
      }
    }

    return 'unknown';
  }

  /**
   * Create an automation error
   */
  createError(
    error: unknown,
    type: ErrorType,
    context?: ErrorContext
  ): AutomationError {
    const message = error instanceof Error ? error.message : String(error);
    const code = error instanceof Error ? error.name : undefined;

    return {
      type,
      message,
      code,
      details: context?.additionalData,
      timestamp: new Date().toISOString(),
      workflowId: context?.workflowId,
      executionId: context?.executionId,
      actionId: context?.actionId,
    };
  }

  /**
   * Log an error
   */
  logError(error: AutomationError): void {
    this.errorLog.push(error);
    console.error(`[Automation Error] ${error.type}: ${error.message}`, error);
  }

  /**
   * Get error log
   */
  getErrorLog(): AutomationError[] {
    return [...this.errorLog];
  }

  /**
   * Get errors by workflow
   */
  getErrorsByWorkflow(workflowId: string): AutomationError[] {
    return this.errorLog.filter((e) => e.workflowId === workflowId);
  }

  /**
   * Get errors by execution
   */
  getErrorsByExecution(executionId: string): AutomationError[] {
    return this.errorLog.filter((e) => e.executionId === executionId);
  }

  /**
   * Clear error log
   */
  clearErrorLog(): void {
    this.errorLog = [];
  }

  /**
   * Determine recovery strategy for an error
   */
  getRecoveryStrategy(
    error: AutomationError,
    workflow?: Workflow
  ): ErrorRecoveryStrategy {
    const errorHandling = workflow?.errorHandling;

    switch (error.type) {
      case 'network':
      case 'timeout':
        // Network and timeout errors are usually recoverable with retry
        return {
          canRecover: true,
          action: errorHandling?.retryOnFailure ? 'retry' : 'abort',
        };

      case 'rate_limit':
        // Rate limit errors need backoff
        return {
          canRecover: true,
          action: 'retry',
        };

      case 'validation':
        // Validation errors are not recoverable
        return {
          canRecover: false,
          action: 'abort',
        };

      case 'execution':
        // Execution errors depend on configuration
        return {
          canRecover: errorHandling?.continueOnError || false,
          action: errorHandling?.continueOnError ? 'skip' : 'abort',
        };

      default:
        // Unknown errors - be conservative
        return {
          canRecover: false,
          action: 'abort',
        };
    }
  }

  /**
   * Handle an error with appropriate recovery
   */
  async handleError(
    error: unknown,
    context?: ErrorContext,
    workflow?: Workflow
  ): Promise<ErrorRecoveryStrategy> {
    const type = this.classifyError(error, context);
    const automationError = this.createError(error, type, context);

    this.logError(automationError);

    const strategy = this.getRecoveryStrategy(automationError, workflow);

    // Execute fallback action if provided
    if (strategy.action === 'fallback' && strategy.fallbackAction) {
      try {
        await strategy.fallbackAction();
      } catch (fallbackError) {
        console.error('Fallback action failed:', fallbackError);
      }
    }

    return strategy;
  }

  /**
   * Send error notification (placeholder)
   */
  async notifyError(error: AutomationError): Promise<void> {
    // Placeholder for notification service integration
    console.log(`[Error Notification] ${error.type}: ${error.message}`);

    // In production, this would integrate with:
    // - Email service
    // - Slack/Discord webhook
    // - PagerDuty
    // - Custom notification system
  }
}

/**
 * Global error handler instance
 */
export const errorHandler = new ErrorHandler();
