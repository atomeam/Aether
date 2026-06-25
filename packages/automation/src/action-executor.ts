/**
 * @aether/automation - Action execution engine
 * 
 * Executes actions with retry logic and timeout handling
 * 
 * @version 1.0.0
 */

import type { Action, ExecutionStatus } from './types';

export interface ActionExecutionContext {
  workflowId: string;
  executionId: string;
  input: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface ActionResult {
  success: boolean;
  output?: Record<string, unknown>;
  error?: string;
  status: ExecutionStatus;
}

export interface ActionHandler {
  (action: Action, context: ActionExecutionContext): Promise<ActionResult>;
}

/**
 * Default action handlers registry
 */
const actionHandlers: Record<string, ActionHandler> = {
  // HTTP request handler
  http_request: async (action, context) => {
    const { url, method = 'GET', headers = {}, body } = action.config as {
      url: string;
      method?: string;
      headers?: Record<string, string>;
      body?: unknown;
    };

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
          status: 'failed',
        };
      }

      return {
        success: true,
        output: data as Record<string, unknown>,
        status: 'completed',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        status: 'failed',
      };
    }
  },

  // Email handler (placeholder - needs actual email service integration)
  email: async (action, context) => {
    const { to, subject, body } = action.config as {
      to: string;
      subject: string;
      body: string;
    };

    // Placeholder implementation
    console.log(`[Email] To: ${to}, Subject: ${subject}`);

    return {
      success: true,
      output: { messageId: 'placeholder-id' },
      status: 'completed',
    };
  },

  // Database handler (placeholder - needs actual database integration)
  database: async (action, context) => {
    const { query, params = [] } = action.config as {
      query: string;
      params?: unknown[];
    };

    // Placeholder implementation
    console.log(`[Database] Query: ${query}, Params: ${JSON.stringify(params)}`);

    return {
      success: true,
      output: { rows: [], affectedRows: 0 },
      status: 'completed',
    };
  },

  // Notification handler (placeholder)
  notification: async (action, context) => {
    const { channel, message } = action.config as {
      channel: string;
      message: string;
    };

    console.log(`[Notification] Channel: ${channel}, Message: ${message}`);

    return {
      success: true,
      output: { notificationId: 'placeholder-id' },
      status: 'completed',
    };
  },

  // Transform handler - data transformation
  transform: async (action, context) => {
    const { transform } = action.config as {
      transform: (data: unknown) => unknown;
    };

    try {
      const result = transform(context.input);
      return {
        success: true,
        output: result as Record<string, unknown>,
        status: 'completed',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Transform failed',
        status: 'failed',
      };
    }
  },

  // Custom handler - user-provided function
  custom: async (action, context) => {
    const { handler } = action.config as {
      handler: (context: ActionExecutionContext) => Promise<ActionResult>;
    };

    try {
      return await handler(context);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Custom handler failed',
        status: 'failed',
      };
    }
  },
};

/**
 * Register a custom action handler
 */
export function registerActionHandler(
  type: string,
  handler: ActionHandler
): void {
  actionHandlers[type] = handler;
}

/**
 * Execute an action with retry logic
 */
export async function executeAction(
  action: Action,
  context: ActionExecutionContext
): Promise<ActionResult> {
  const handler = actionHandlers[action.type];

  if (!handler) {
    return {
      success: false,
      error: `No handler registered for action type: ${action.type}`,
      status: 'failed',
    };
  }

  const retryPolicy = action.retryPolicy || {
    maxRetries: 3,
    backoffMs: 1000,
    maxBackoffMs: 30000,
  };

  let lastError: string | undefined;
  let attempt = 0;

  while (attempt <= retryPolicy.maxRetries) {
    attempt++;

    try {
      // Execute with timeout
      const result = await Promise.race([
        handler(action, context),
        new Promise<ActionResult>((_, reject) =>
          setTimeout(
            () => reject(new Error('Action timeout')),
            action.timeoutMs
          )
        ),
      ]);

      if (result.success) {
        return result;
      }

      lastError = result.error;

      // Don't retry on success
      if (result.success) {
        return result;
      }
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Unknown error';
    }

    // Calculate backoff with exponential backoff
    if (attempt <= retryPolicy.maxRetries) {
      const backoff = Math.min(
        retryPolicy.backoffMs * Math.pow(2, attempt - 1),
        retryPolicy.maxBackoffMs
      );
      await new Promise((resolve) => setTimeout(resolve, backoff));
    }
  }

  return {
    success: false,
    error: lastError || 'Action failed after retries',
    status: 'failed',
  };
}

/**
 * Execute multiple actions in sequence
 */
export async function executeActions(
  actions: Action[],
  context: ActionExecutionContext,
  options: { stopOnError?: boolean } = {}
): Promise<ActionResult[]> {
  const results: ActionResult[] = [];

  for (const action of actions) {
    const result = await executeAction(action, context);
    results.push(result);

    if (!result.success && options.stopOnError) {
      break;
    }
  }

  return results;
}

/**
 * Execute multiple actions in parallel
 */
export async function executeActionsParallel(
  actions: Action[],
  context: ActionExecutionContext
): Promise<ActionResult[]> {
  return Promise.all(
    actions.map((action) => executeAction(action, context))
  );
}
