/**
 * MCP Tool Registry
 * 
 * Sandboxed tools for the Executor agent.
 */

export interface Tool {
  name: string;
  description: string;
  execute: (args: Record<string, unknown>) => Promise<unknown>;
}

// File read tool
const fileReadTool: Tool = {
  name: 'file_read',
  description: 'Read contents of a file',
  async execute(args) {
    const path = args.path as string;
    if (!path) throw new Error('path required');

    // Security: Only allow reads within workspace
    if (!path.includes('/workspace/project/Aether')) {
      throw new Error('Access denied: path must be in workspace');
    }

    // NOTE: fs/promises not compatible with Workers
    // File operations need to use R2 in Workers environment
    // const fs = await import('fs/promises');
    // const content = await fs.readFile(path, 'utf-8');
    throw new Error('File read not available in Workers environment');
    // return { path, content, length: content.length };
  }
};

// File write tool
const fileWriteTool: Tool = {
  name: 'file_write',
  description: 'Write content to a file',
  async execute(args) {
    const path = args.path as string;
    const content = args.content as string;

    if (!path || content === undefined) throw new Error('path and content required');

    // Security: Only allow writes within workspace
    if (!path.includes('/workspace/project/Aether')) {
      throw new Error('Access denied: path must be in workspace');
    }

    // NOTE: fs/promises not compatible with Workers
    // File operations need to use R2 in Workers environment
    // const fs = await import('fs/promises');
    // await fs.writeFile(path, content, 'utf-8');
    throw new Error('File write not available in Workers environment');
    // return { path, written: true };
  }
};

// Git status tool
const gitStatusTool: Tool = {
  name: 'git_status',
  description: 'Check git repository status',
  async execute(args) {
    // NOTE: child_process and util not compatible with Workers
    // Git operations need to use Workers-compatible solution or be disabled
    throw new Error('Git operations not available in Workers environment');
    // const { exec } = await import('child_process');
    // const { promisify } = await import('util');
    // const execAsync = promisify(exec.exec);
    // const cwd = args.cwd as string || process.cwd();
    // const { stdout } = await execAsync('git status --short', { cwd });
    // return { status: stdout || 'clean', cwd };
  }
};

// Git commit tool
const gitCommitTool: Tool = {
  name: 'git_commit',
  description: 'Create a git commit',
  async execute(args) {
    // NOTE: child_process and util not compatible with Workers
    // Git operations need to use Workers-compatible solution or be disabled
    throw new Error('Git operations not available in Workers environment');
    // const message = args.message as string;
    // if (!message) throw new Error('message required');
    // const { exec } = await import('child_process');
    // const { promisify } = await import('util');
    // const execAsync = promisify(exec.exec);
    // const cwd = args.cwd as string || process.cwd();
    // await execAsync('git add -A', { cwd });
    // const { stdout } = await execAsync(`git commit -m "${message}"`, { cwd });
    // return { message, output: stdout };
  }
};

// Git diff tool
const gitDiffTool: Tool = {
  name: 'git_diff',
  description: 'Show uncommitted changes',
  async execute(args) {
    // NOTE: child_process not compatible with Workers
    // Git operations need to use Workers-compatible solution or be disabled
    throw new Error('Git operations not available in Workers environment');
  }
};

// HTTP request tool
const httpRequestTool: Tool = {
  name: 'http_request',
  description: 'Make an HTTP request (GET/HEAD only)',
  async execute(args) {
    const url = args.url as string;
    const method = (args.method as string) || 'GET';
    
    if (!url) throw new Error('url required');
    
    // Security: Only allow safe methods
    if (!['GET', 'HEAD'].includes(method)) {
      throw new Error('Only GET and HEAD allowed');
    }
    
    const response = await fetch(url, { method });
    
    return {
      url,
      status: response.status,
      ok: response.ok
    };
  }
};

// Tool registry
export const toolRegistry: Record<string, Tool> = {
  file_read: fileReadTool,
  file_write: fileWriteTool,
  git_status: gitStatusTool,
  git_commit: gitCommitTool,
  git_diff: gitDiffTool,
  http_request: httpRequestTool
};

// Get available tools
export function getTools() {
  return Object.values(toolRegistry).map(t => ({ name: t.name, description: t.description }));
}

// Execute a tool by name
export async function executeTool(name: string, args: Record<string, unknown>) {
  const tool = toolRegistry[name];
  if (!tool) throw new Error(`Unknown tool: ${name}`);
  return tool.execute(args);
}
// Lessons write tool
const lessonsWriteTool: Tool = {
  name: 'lessons_write',
  description: 'Write a lesson to the Lessons DB',
  async execute(args) {
    const { reflect } = await import('./src/agents/reflector.js');
    const result = await reflect({
      pattern: args.pattern as string,
      suggestion: args.suggestion as string,
      action: args.action as string,
      outcome: args.outcome as 'success' | 'failure' | 'noop',
      confidence: args.confidence as number,
    });
    return result;
  }
};

// Add to registry
toolRegistry.lessons_write = lessonsWriteTool;

// Get agent state tool (loop detection + rate limiting)
const getAgentStateTool: Tool = {
  name: 'get_agent_state',
  description: 'Retrieve execution counts and failure rates for loop detection',
  async execute(args) {
    const metrics = await import('@aether/metrics');
    
    const runId = args.runId as string;
    const targetPath = args.targetPath as string;
    
    if (!runId && !targetPath) {
      throw new Error('runId or targetPath required');
    }
    
    // Check run-specific metrics
    const runKey = runId ? `runs.${runId}` : null;
    const pathKey = targetPath ? `paths.${targetPath}` : null;
    
    const results: Record<string, unknown> = {};
    
    if (runKey) {
      const total = metrics.getGauge(`${runKey}.total`) || 0;
      const failures = metrics.getGauge(`${runKey}.failures`) || 0;
      const success = metrics.getGauge(`${runKey}.success`) || 0;
      
      results.runId = {
        total,
        failures,
        success,
        consecutive_failures: failures,
        last_action: total > 0 ? 'success' : 'idle',
      };
    }
    
    if (pathKey) {
      const writes = metrics.getGauge(`${pathKey}.writes`) || 0;
      const lastWrite = metrics.getGauge(`${pathKey}.last_write`) || 0;
      const now = Date.now();
      const writesPerMin = now - lastWrite < 60000 ? writes : 0;
      
      results.targetPath = {
        writes,
        writes_per_minute: writesPerMin,
        last_write: lastWrite,
      };
    }
    
    // Check circuit breaker state
    results.circuit_breaker = {
      state: 'closed', // TODO: wire to @aether/operations
      failure_threshold: 3,
    };
    
    return results;
  }
};

// Add to registry
toolRegistry.get_agent_state = getAgentStateTool;

// Workflow trigger tool
const triggerWorkflowTool: Tool = {
  name: 'trigger_workflow',
  description: 'Trigger a predefined workflow',
  async execute(args) {
    const { runWorkflow, getWorkflow } = await import('@aether/workflow');
    
    const workflowName = args.workflow as string;
    const context = args.context as Record<string, unknown> || {};
    
    if (!workflowName) {
      throw new Error('workflow name required');
    }
    
    const workflow = getWorkflow(workflowName);
    if (!workflow) {
      throw new Error(`Unknown workflow: ${workflowName}`);
    }
    
    const result = await runWorkflow(workflow, context);
    return result;
  }
};

toolRegistry.trigger_workflow = triggerWorkflowTool;
toolRegistry.list_workflows = {
  name: 'list_workflows',
  description: 'List available workflows',
  execute: async () => {
    const { listWorkflows } = await import('@aether/workflow');
    return { workflows: listWorkflows() };
  }
} as Tool;

// Chaos injection tool
const chaosInjectTool: Tool = {
  name: 'chaos_inject',
  description: 'Inject a synthetic failure pattern to train the agent loop',
  async execute(args) {
    const { executeChaos } = await import('@aether/chaos');
    
    const scenario = args.scenario as 'broken_package_json' | 'corrupted_env_var' | 'invalid_syntax' | 'missing_dep' | 'network_timeout';
    const targetPath = args.targetPath as string;
    
    if (!scenario) {
      throw new Error('scenario required');
    }
    
    return executeChaos(scenario, targetPath);
  }
};

// List chaos scenarios tool
const listChaosScenariosTool: Tool = {
  name: 'list_chaos_scenarios',
  description: 'List available chaos scenarios for immunity testing',
  async execute() {
    const { getScenarios } = await import('@aether/chaos');
    return { scenarios: getScenarios() };
  }
};

// Add to registry
toolRegistry.chaos_inject = chaosInjectTool;
toolRegistry.list_chaos_scenarios = listChaosScenariosTool;
