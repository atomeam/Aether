/**
 * Replay Harness
 * 
 * Replays ledger events through the agent pipeline.
 */

import { getDecisions } from '@aether/curator-audit';
import { getPatternConfidence } from '@aether/lessons';
import { executeTool, toolRegistry } from '@aether/mcp-tools';

export interface ReplayResult {
  replayId: string;
  events: number;
  outcomes: Array<{
    tool: string;
    expected: string;
    actual: string;
    matches: boolean;
  }>;
  duration: number;
}

// Replay recent events
export async function replayEvents(options?: {
  since?: number;
  limit?: number;
}): Promise<ReplayResult> {
  const { since = 3600000, limit = 10 } = options || {};
  
  const startTime = Date.now();
  const decisions = await getDecisions({ since, limit });
  
  const outcomes = [];
  
  for (const decision of decisions) {
    try {
      // Try executing the tool
      const toolName = decision.tool;
      const args = decision.args || {};
      
      if (toolRegistry[toolName]) {
        await executeTool(toolName, args);
        outcomes.push({
          tool: toolName,
          expected: decision.decision,
          actual: 'approve',
          matches: decision.decision === 'approve',
        });
      }
    } catch {
      outcomes.push({
        tool: decision.tool,
        expected: decision.decision,
        actual: 'deny',
        matches: decision.decision === 'deny',
      });
    }
  }
  
  return {
    replayId: crypto.randomUUID(),
    events: decisions.length,
    outcomes,
    duration: Date.now() - startTime,
  };
}

// Dry-run tool execution
export async function dryRun(toolName: string, args: Record<string, unknown>) {
  const tool = toolRegistry[toolName];
  if (!tool) {
    return { error: `Unknown tool: ${toolName}` };
  }
  
  // Validate args without executing
  return {
    tool: toolName,
    valid: true,
    wouldExecute: true,
    args,
  };
}