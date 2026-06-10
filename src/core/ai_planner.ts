/**
 * AI Planner - Intelligent Planning Module
 * 
 * Uses AI to automatically generate execution plans based on natural language objectives.
 * Integrates with the Orchestrator to provide intelligent step sequencing.
 */

import { IntegrationManager } from './integration_manager';
import { OrchestratorStep } from './orchestrator';

export interface PlanRequest {
  objective: string;
  context?: Record<string, unknown>;
  availableIntegrations?: string[];
  constraints?: {
    maxSteps?: number;
    timeout?: number;
    preferredServices?: string[];
  };
}

export interface PlanResponse {
  steps: OrchestratorStep[];
  reasoning: string;
  estimatedDuration: number;
  confidence: number;
  alternativePlans?: {
    description: string;
    steps: OrchestratorStep[];
  }[];
}

export interface AIPlannerConfig {
  defaultAI?: string;
  maxRetries?: number;
  timeout?: number;
}

export class AIPlanner {
  private integrationManager: IntegrationManager;
  private config: AIPlannerConfig;

  constructor(integrationManager: IntegrationManager, config?: AIPlannerConfig) {
    this.integrationManager = integrationManager;
    this.config = config || {
      defaultAI: 'openai',
      maxRetries: 3,
      timeout: 30000,
    };
  }

  /**
   * Generate an execution plan using AI
   */
  async generatePlan(request: PlanRequest): Promise<PlanResponse> {
    const availableIntegrations = request.availableIntegrations || 
      this.integrationManager.listIntegrations()
        .filter(i => i.enabled)
        .map(i => i.name);

    // System prompt for the AI
    const systemPrompt = this.buildSystemPrompt(availableIntegrations);
    
    // User prompt with the objective
    const userPrompt = this.buildUserPrompt(request);

    try {
      // Call the AI service to generate the plan
      const aiResponse = await this.callAI(systemPrompt, userPrompt);
      
      // Parse the AI response into a structured plan
      const plan = this.parseAIResponse(aiResponse, request);
      
      return plan;
    } catch (error) {
      console.error('AI planning failed, falling back to template-based planning:', error);
      return this.generateFallbackPlan(request, availableIntegrations);
    }
  }

  /**
   * Build the system prompt for the AI
   */
  private buildSystemPrompt(availableIntegrations: string[]): string {
    return `You are an expert AI workflow orchestrator. Your task is to break down objectives into executable steps using available AI services and integrations.

Available Integrations:
${availableIntegrations.map(name => `- ${name}`).join('\n')}

Step Types:
- ai: Use AI services (chat, generation, analysis)
- api: Call external APIs
- local: Execute local operations (file I/O, commands)
- conditional: Branch based on conditions

Response Format (JSON):
{
  "steps": [
    {
      "id": "step_1",
      "type": "ai|api|local|conditional",
      "service": "service_name",
      "action": "specific_action",
      "params": { ... },
      "enabled": true
    }
  ],
  "reasoning": "explanation of the plan",
  "estimatedDuration": 30,
  "confidence": 0.9
}

Guidelines:
1. Break complex objectives into 3-7 steps
2. Use the most appropriate service for each step
3. Include error handling and conditional logic when needed
4. Estimate realistic durations
5. Provide clear reasoning for your choices`;
  }

  /**
   * Build the user prompt with the objective
   */
  private buildUserPrompt(request: PlanRequest): string {
    let prompt = `Objective: ${request.objective}\n`;
    
    if (request.context) {
      prompt += `\nContext:\n${JSON.stringify(request.context, null, 2)}\n`;
    }
    
    if (request.constraints) {
      prompt += `\nConstraints:\n`;
      if (request.constraints.maxSteps) {
        prompt += `- Maximum steps: ${request.constraints.maxSteps}\n`;
      }
      if (request.constraints.preferredServices) {
        prompt += `- Preferred services: ${request.constraints.preferredServices.join(', ')}\n`;
      }
    }
    
    return prompt;
  }

  /**
   * Call the AI service to generate the plan
   */
  private async callAI(systemPrompt: string, userPrompt: string): Promise<string> {
    const aiService = this.config.defaultAI || 'openai';
    
    try {
      const response = await this.integrationManager.route({
        integration: aiService,
        endpoint: '/chat/completions',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: {
          model: this.getModelForService(aiService),
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.7,
          response_format: { type: 'json_object' },
        },
      });

      if (response.success && response.data) {
        const content = (response.data as any).choices?.[0]?.message?.content;
        if (content) {
          return content;
        }
      }
      
      throw new Error('Invalid AI response');
    } catch (error) {
      console.error(`Failed to call AI service ${aiService}:`, error);
      throw error;
    }
  }

  /**
   * Get the appropriate model for each AI service
   */
  private getModelForService(service: string): string {
    const models: Record<string, string> = {
      'openai': 'gpt-4-turbo-preview',
      'anthropic': 'claude-3-sonnet-20240229',
      'google-ai': 'gemini-pro',
      'cohere': 'command',
    };
    return models[service] || 'gpt-4-turbo-preview';
  }

  /**
   * Parse the AI response into a structured plan
   */
  private parseAIResponse(aiResponse: string, request: PlanRequest): PlanResponse {
    try {
      const parsed = JSON.parse(aiResponse);
      
      return {
        steps: (parsed.steps || []).map((step: any) => ({
          ...step,
          id: step.id || `step_${Math.random().toString(36).substr(2, 9)}`,
        })),
        reasoning: parsed.reasoning || 'AI-generated plan',
        estimatedDuration: parsed.estimatedDuration || 30,
        confidence: parsed.confidence || 0.8,
        alternativePlans: parsed.alternativePlans || [],
      };
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      throw new Error('Invalid AI response format');
    }
  }

  /**
   * Generate a fallback plan when AI planning fails
   */
  private generateFallbackPlan(request: PlanRequest, availableIntegrations: string[]): PlanResponse {
    // Simple heuristic-based planning
    const steps: OrchestratorStep[] = [];
    const objective = request.objective.toLowerCase();

    // Analyze objective and generate appropriate steps
    if (objective.includes('analyze') || objective.includes('process')) {
      steps.push({
        id: 'step_1',
        type: 'ai',
        action: 'analyze',
        params: { objective: request.objective },
      });
    }

    if (objective.includes('generate') || objective.includes('create')) {
      steps.push({
        id: 'step_1',
        type: 'ai',
        action: 'generate',
        params: { objective: request.objective },
      });
    }

    if (objective.includes('write') || objective.includes('save')) {
      steps.push({
        id: 'step_2',
        type: 'local',
        action: 'write_file',
        params: { path: './output/result.txt' },
      });
    }

    // Add at least one step if none were generated
    if (steps.length === 0) {
      steps.push({
        id: 'step_1',
        type: 'ai',
        action: 'chat',
        params: { prompt: request.objective },
      });
    }

    return {
      steps,
      reasoning: 'Fallback plan generated using heuristic analysis',
      estimatedDuration: steps.length * 10,
      confidence: 0.5,
    };
  }

  /**
   * Validate a plan before execution
   */
  async validatePlan(plan: PlanResponse): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    for (const step of plan.steps) {
      // Check if service is available
      const integration = this.integrationManager.getIntegration(step.service);
      if (!integration) {
        errors.push(`Service "${step.service}" not found`);
      } else if (!integration.enabled) {
        errors.push(`Service "${step.service}" is disabled`);
      }

      // Validate step structure
      if (!step.action) {
        errors.push(`Step ${step.id} missing action`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Optimize an existing plan
   */
  async optimizePlan(plan: PlanResponse, request: PlanRequest): Promise<PlanResponse> {
    const optimizationPrompt = `Optimize this execution plan for the given objective:

Objective: ${request.objective}

Current Plan:
${JSON.stringify(plan.steps, null, 2)}

Provide an optimized version that:
1. Reduces execution time
2. Minimizes API calls
3. Improves reliability
4. Maintains the same functionality

Response in the same JSON format.`;

    try {
      const optimizedResponse = await this.callAI(
        this.buildSystemPrompt(request.availableIntegrations || []),
        optimizationPrompt
      );
      
      return this.parseAIResponse(optimizedResponse, request);
    } catch (error) {
      console.error('Plan optimization failed, returning original:', error);
      return plan;
    }
  }
}

/**
 * Factory function to create an AIPlanner
 */
export function createAIPlanner(
  integrationManager: IntegrationManager,
  config?: AIPlannerConfig
): AIPlanner {
  return new AIPlanner(integrationManager, config);
}

export default AIPlanner;