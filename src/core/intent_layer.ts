import { Orchestrator } from './orchestrator.js';
import { CrewCoordinator } from '../crew/CrewCoordinator.js';
import { MemorySpine } from './memory_spine.js';

export interface Intent {
  type: 'workflow' | 'task' | 'inquiry' | 'modification';
  objective: string;
  priority: 'high' | 'medium' | 'low';
  context?: any;
}

/**
 * UnifiedIntentLayer - The primary entry point for all user requests
 * Routes natural language intents to the appropriate system (Orchestrator or Crew).
 */
export class UnifiedIntentLayer {
  private orchestrator: Orchestrator;
  private crewCoordinator: CrewCoordinator;
  private memory: MemorySpine;

  constructor(
    orchestrator: Orchestrator,
    crewCoordinator: CrewCoordinator,
    memory: MemorySpine
  ) {
    this.orchestrator = orchestrator;
    this.crewCoordinator = crewCoordinator;
    this.memory = memory;
  }

  /**
   * Process a natural language intent
   */
  async processIntent(message: string, context?: any): Promise<any> {
    console.log(`[INTENT] Parsing user intent: "${message.substring(0, 50)}..."`);

    // 1. Analyze intent type
    const intent = await this.parseIntent(message, context);

    // 2. Remember the intent
    await this.memory.remember({
      type: 'state',
      content: { intent, message },
      tags: ['intent', intent.type]
    });

    // 3. Route to appropriate subsystem
    switch (intent.type) {
      case 'workflow':
        return await this.orchestrator.executeWithAutoPlan(intent.objective, intent.context);
      
      case 'task':
        const taskId = await this.crewCoordinator.addTask({
          type: 'execute_single',
          description: intent.objective,
          payload: { taskToExecute: { type: 'generic', objective: intent.objective }, context: intent.context },
          priority: intent.priority
        });
        return { success: true, taskId, message: 'Intent routed to Crew System' };

      case 'modification':
        // Route to self-modification logic (often via Forge)
        return { success: true, action: 'modification_queued', objective: intent.objective };

      default:
        return { success: true, message: 'Inquiry received and acknowledged' };
    }
  }

  /**
   * Use simple heuristics (or AI) to parse the intent
   */
  private async parseIntent(message: string, context?: any): Promise<Intent> {
    const lower = message.toLowerCase();
    
    let type: Intent['type'] = 'inquiry';
    if (lower.includes('workflow') || lower.includes('plan') || lower.includes('automate')) {
      type = 'workflow';
    } else if (lower.includes('task') || lower.includes('do') || lower.includes('run')) {
      type = 'task';
    } else if (lower.includes('modify') || lower.includes('change') || lower.includes('update')) {
      type = 'modification';
    }

    return {
      type,
      objective: message,
      priority: 'medium',
      context
    };
  }
}

export default UnifiedIntentLayer;