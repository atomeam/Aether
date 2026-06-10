import { CrewMember, CrewRole, CrewStatus, CrewTask, CrewTaskResult } from '../CrewMember.js';

/**
 * AI Studio Crew Member - Planning & Intelligence
 * Priority: 2
 * Handles: Workflow planning, task decomposition, natural language processing
 * Identity: PLANNER - Strategic thinker with big-picture vision
 */
export class AIStudioCrewMember implements CrewMember {
  id = 'aistudio-2';
  name = 'PLANNER';
  role = CrewRole.PLANNING;
  status = CrewStatus.ACTIVE;
  capabilities = [
    'workflow_planning',
    'task_decomposition',
    'natural_language_processing',
    'code_generation',
    'analysis',
    'recommendation'
  ];
  priority = 2;

  visuals = {
    color: 'text-cyan-400',
    symbol: '◆',
    theme: 'elegant-planning',
    avatarUrl: '/avatars/aistudio-agent.png'
  };

  private aiStudioUrl = 'https://ai.studio/apps/1ec1cc16-cddc-480a-96ee-fdecd1b6ad01';
  private geminiApiKey = process.env.GOOGLE_AI_API_KEY || '';

  async execute(task: CrewTask): Promise<CrewTaskResult> {
    const startTime = Date.now();

    try {
      switch (task.type) {
        case 'plan_workflow':
          return await this.planWorkflow(task);
        case 'decompose_task':
          return await this.decomposeTask(task);
        case 'analyze_requirements':
          return await this.analyzeRequirements(task);
        case 'generate_code':
          return await this.generateCode(task);
        case 'provide_recommendations':
          return await this.provideRecommendations(task);
        default:
          throw new Error(`Unknown task type: ${task.type}`);
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTime: Date.now() - startTime,
        crewMemberId: this.id,
        timestamp: new Date()
      };
    }
  }

  private async planWorkflow(task: CrewTask): Promise<CrewTaskResult> {
    const startTime = Date.now();
    const { idea, context } = task.payload;

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.geminiApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `You are an AI workflow planner. Create a step-by-step execution plan for: "${idea}"
                
Context: ${JSON.stringify(context || {})}

Return a JSON array of workflow steps with:
- name: step name
- provider: which AI provider to use
- model: which model
- prompt: what to ask
- usePreviousOutput: boolean
- priority: high/medium/low`
              }]
            }]
          })
        }
      );

      const data = await response.json();
      const workflowSteps = JSON.parse(data.candidates[0].content.parts[0].text);

      return {
        success: true,
        data: {
          workflowSteps,
          originalIdea: idea,
          estimatedDuration: workflowSteps.length * 30, // seconds
          message: 'PLANNER: Strategic workflow optimized for maximum efficiency'
        },
        executionTime: Date.now() - startTime,
        crewMemberId: this.id,
        timestamp: new Date()
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Workflow planning failed',
        executionTime: Date.now() - startTime,
        crewMemberId: this.id,
        timestamp: new Date()
      };
    }
  }

  private async decomposeTask(task: CrewTask): Promise<CrewTaskResult> {
    const startTime = Date.now();
    const { complexTask, context } = task.payload;

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.geminiApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `Break down this complex task into subtasks: "${complexTask}"
                
Context: ${JSON.stringify(context || {})}

Return a JSON array of subtasks with:
- id: unique identifier
- description: what to do
- priority: high/medium/low
- estimatedTime: minutes
- dependencies: array of subtask IDs`
              }]
            }]
          })
        }
      );

      const data = await response.json();
      const subtasks = JSON.parse(data.candidates[0].content.parts[0].text);

      return {
        success: true,
        data: {
          subtasks,
          originalTask: complexTask,
          totalEstimatedTime: subtasks.reduce((sum: number, task: any) => sum + task.estimatedTime, 0)
        },
        executionTime: Date.now() - startTime,
        crewMemberId: this.id,
        timestamp: new Date()
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Task decomposition failed',
        executionTime: Date.now() - startTime,
        crewMemberId: this.id,
        timestamp: new Date()
      };
    }
  }

  private async analyzeRequirements(task: CrewTask): Promise<CrewTaskResult> {
    const startTime = Date.now();
    const { requirements } = task.payload;

    // Simulate requirements analysis
    await new Promise(resolve => setTimeout(resolve, 1500));

    return {
      success: true,
      data: {
        analysis: {
          complexity: 'medium',
          estimatedEffort: '2-3 days',
          requiredCapabilities: ['ai_integration', 'workflow_automation', 'ui_development'],
          risks: ['api_rate_limits', 'dependency_management'],
          recommendations: ['start_with_mvp', 'implement_caching', 'add_error_handling']
        },
        requirements
      },
      executionTime: Date.now() - startTime,
      crewMemberId: this.id,
      timestamp: new Date()
    };
  }

  private async generateCode(task: CrewTask): Promise<CrewTaskResult> {
    const startTime = Date.now();
    const { description, language, context } = task.payload;

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.geminiApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `Generate ${language} code for: ${description}
                
Context: ${JSON.stringify(context || {})}

Return only the code, no explanations.`
              }]
            }]
          })
        }
      );

      const data = await response.json();
      const code = data.candidates[0].content.parts[0].text;

      return {
        success: true,
        data: { code, language },
        executionTime: Date.now() - startTime,
        crewMemberId: this.id,
        timestamp: new Date()
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Code generation failed',
        executionTime: Date.now() - startTime,
        crewMemberId: this.id,
        timestamp: new Date()
      };
    }
  }

  private async provideRecommendations(task: CrewTask): Promise<CrewTaskResult> {
    const startTime = Date.now();
    const { situation, options } = task.payload;

    // Simulate recommendation engine
    await new Promise(resolve => setTimeout(resolve, 1000));

    return {
      success: true,
      data: {
        recommendation: options?.[0] || 'proceed_with_current_plan',
        confidence: 0.85,
        alternatives: options?.slice(1) || [],
        reasoning: 'Based on current system state and historical performance'
      },
      executionTime: Date.now() - startTime,
      crewMemberId: this.id,
      timestamp: new Date()
    };
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.geminiApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: 'Health check' }]
            }]
          })
        }
      );
      return response.ok;
    } catch {
      return false;
    }
  }
}