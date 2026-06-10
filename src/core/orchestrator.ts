/**
 * Orchestrator - Central Task Execution Service
 * 
 * Ties together IntegrationManager and VictusBridge into a single, cohesive task execution workflow.
 * Accepts an objective, maintains an internal plan array of steps, and provides an execution loop.
 */

import { fileURLToPath } from 'url';
import path from 'path';
import { IntegrationManager, RouteRequest, RouteResponse } from './integration_manager';
import { VictusBridge, VictusCommand, VictusResponse } from './victus_bridge';
import { AIPlanner, PlanRequest, PlanResponse } from './ai_planner';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Types for Orchestrator
export type StepType = 'api' | 'local' | 'conditional' | 'ai';
export type StepStatus = 'pending' | 'completed' | 'failed' | 'skipped';

export interface OrchestratorStep {
  id?: string;
  type: StepType;
  action: string;
  service?: string; // AI service or integration name
  params?: Record<string, unknown>;
  condition?: {
    // Condition for conditional steps
    dependsOn: string; // Step ID to check
    status: StepStatus;
    value?: unknown;
  };
  retry?: {
    maxAttempts: number;
    backoffMs?: number;
  };
}

export interface OrchestratorConfig {
  continueOnError?: boolean;
  stopOnFailure?: boolean;
  defaultTimeout?: number;
}

export interface OrchestratorResult {
  stepId?: string;
  success: boolean;
  data?: unknown;
  error?: string;
  duration?: number;
  timestamp: Date;
}

export interface PlanResult {
  objective: string;
  steps: OrchestratorResult[];
  success: boolean;
  totalSteps: number;
  completedSteps: number;
  failedSteps: number;
  duration: number;
}

export interface OrchestratorState {
  objective: string;
  plan: OrchestratorStep[];
  executing: boolean;
  currentStepIndex: number;
}

// Logger interface
export interface Logger {
  info: (message: string, ...args: unknown[]) => void;
  warn: (message: string, ...args: unknown[]) => void;
  error: (message: string, ...args: unknown[]) => void;
  debug: (message: string, ...args: unknown[]) => void;
}

// Default console logger
const defaultLogger: Logger = {
  info: (message: string, ...args: unknown[]) => console.log(`[INFO] Orchestrator: ${message}`, ...args),
  warn: (message: string, ...args: unknown[]) => console.warn(`[WARN] Orchestrator: ${message}`, ...args),
  error: (message: string, ...args: unknown[]) => console.error(`[ERROR] Orchestrator: ${message}`, ...args),
  debug: (message: string, ...args: unknown[]) => console.log(`[DEBUG] Orchestrator: ${message}`, ...args),
};

/**
 * Orchestrator Class
 * 
 * Central orchestrator that sequences multi-step tasks across external APIs and local operations.
 */
export class Orchestrator {
  private integrationManager: IntegrationManager;
  private victusBridge: VictusBridge;
  private aiPlanner: AIPlanner;
  private config: OrchestratorConfig;
  private state: OrchestratorState;
  private logger: Logger;

  /**
   * Create a new Orchestrator instance
   * @param integrationManager - IntegrationManager instance for external APIs
   * @param victusBridge - VictusBridge instance for local operations
   * @param config - Optional configuration
   * @param logger - Optional custom logger
   */
  constructor(
    integrationManager: IntegrationManager,
    victusBridge: VictusBridge,
    config?: OrchestratorConfig,
    logger?: Logger
  ) {
    this.integrationManager = integrationManager;
    this.victusBridge = victusBridge;
    this.aiPlanner = new AIPlanner(integrationManager, {
      defaultAI: 'openai',
      maxRetries: 3,
      timeout: 30000,
    });
    this.config = config || {
      continueOnError: false,
      stopOnFailure: true,
      defaultTimeout: 30000,
    };
    this.logger = logger || defaultLogger;
    this.state = {
      objective: '',
      plan: [],
      executing: false,
      currentStepIndex: -1,
    };
  }

  /**
   * Set the mission objective
   * @param objective - Description of the objective/mission
   */
  setObjective(objective: string): void {
    this.state.objective = objective;
    this.logger.info(`Objective set: ${objective}`);
  }

  /**
   * Get current objective
   */
  getObjective(): string {
    return this.state.objective;
  }

  /**
   * Add a single step to the plan
   * @param step - The step to add
   */
  addStep(step: OrchestratorStep): void {
    // Assign ID if not provided
    const stepWithId = {
      ...step,
      id: step.id || `step_${this.state.plan.length}`,
    };
    this.state.plan.push(stepWithId);
    this.logger.info(`Added step: ${stepWithId.id} (${step.type}: ${step.action})`);
  }

  /**
   * Set entire plan at once
   * @param steps - Array of steps
   */
  setPlan(steps: OrchestratorStep[]): void {
    this.state.plan = steps.map((step, index) => ({
      ...step,
      id: step.id || `step_${index}`,
    }));
    this.logger.info(`Plan set with ${steps.length} steps`);
  }

  /**
   * Get current plan
   */
  getPlan(): OrchestratorStep[] {
    return [...this.state.plan];
  }

  /**
   * Clear the plan
   */
  clearPlan(): void {
    this.state.plan = [];
    this.logger.info('Plan cleared');
  }

  /**
   * Get plan length
   */
  getPlanLength(): number {
    return this.state.plan.length;
  }

  /**
   * Execute a single step via appropriate service
   * @param step - The step to execute
   * @returns Result of the execution
   */
  async executeStep(step: OrchestratorStep): Promise<OrchestratorResult> {
    const startTime = Date.now();
    const stepId = step.id || 'unknown';

    this.logger.info(`Executing step: ${stepId} (${step.type}: ${step.action})`);

    try {
      let result: unknown;

      if (step.type === 'api') {
        // Route to IntegrationManager
        const request: RouteRequest = {
          integration: step.action, // action is the integration name
          endpoint: (step.params?.endpoint as string) || '/',
          method: (step.params?.method as 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH') || 'GET',
          headers: step.params?.headers as Record<string, string> | undefined,
          body: step.params?.body,
        };
        const response: RouteResponse = await this.integrationManager.route(request);
        result = response;
      } else if (step.type === 'ai') {
        // Route to AI service via IntegrationManager
        const serviceName = step.service || step.action;
        const request: RouteRequest = {
          integration: serviceName,
          endpoint: step.params?.endpoint as string || '/chat/completions',
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: step.params || {},
        };
        const response: RouteResponse = await this.integrationManager.route(request);
        result = response;
      } else if (step.type === 'local') {
        // Route to VictusBridge based on action
        const action = step.action;
        
        if (action === 'read_file') {
          const response = await this.victusBridge.readFile(step.params?.path as string);
          result = response;
        } else if (action === 'write_file') {
          const response = await this.victusBridge.writeFile(
            step.params?.path as string,
            step.params?.content as string
          );
          result = response;
        } else if (action === 'execute') {
          const response = await this.victusBridge.executeCommand(step.params?.command as string);
          result = response;
        } else {
          // Generic command forwarding
          const victusCommand: VictusCommand = {
            operation: action,
            args: step.params,
          };
          result = await this.victusBridge.forwardCommand(victusCommand);
        }
      } else if (step.type === 'conditional') {
        // Conditional steps handled by executePlan
        this.logger.debug(`Conditional step ${stepId} deferred to execution context`);
        result = { success: true, conditional: true };
      } else {
        throw new Error(`Unknown step type: ${step.type}`);
      }

      const duration = Date.now() - startTime;
      
      return {
        stepId,
        success: true,
        data: result,
        duration,
        timestamp: new Date(),
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      this.logger.error(`Step ${stepId} failed:`, errorMessage);
      
      return {
        stepId,
        success: false,
        error: errorMessage,
        duration,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Execute the entire plan sequentially
   * @returns Final result with all step results and summary
   */
  async executePlan(): Promise<PlanResult> {
    if (this.state.plan.length === 0) {
      return {
        objective: this.state.objective,
        steps: [],
        success: true,
        totalSteps: 0,
        completedSteps: 0,
        failedSteps: 0,
        duration: 0,
      };
    }

    this.state.executing = true;
    const startTime = Date.now();
    
    this.logger.info(`Executing plan: ${this.state.objective} (${this.state.plan.length} steps)`);

    const results: OrchestratorResult[] = [];
    let completedSteps = 0;
    let failedSteps = 0;

    for (let i = 0; i < this.state.plan.length; i++) {
      const step = this.state.plan[i];
      this.state.currentStepIndex = i;

      // Check if this is a conditional step
      if (step.type === 'conditional' && step.condition) {
        const dependsOnStep = results.find(r => r.stepId === step.condition?.dependsOn);
        const shouldSkip = dependsOnStep?.stepId && 
          (step.condition.status === 'completed' ? !dependsOnStep.success : dependsOnStep.success);
        
        if (shouldSkip) {
          results.push({
            stepId: step.id,
            success: true,
            data: { skipped: true, reason: 'condition_not_met' },
            duration: 0,
            timestamp: new Date(),
          });
          continue;
        }
      }

      // Handle retries if configured
      let attempts = 0;
      const maxAttempts = step.retry?.maxAttempts || 1;
      let stepResult: OrchestratorResult;
      
      do {
        stepResult = await this.executeStep(step);
        attempts++;
        
        if (!stepResult.success && attempts < maxAttempts) {
          const backoffMs = step.retry?.backoffMs || 1000;
          this.logger.warn(`Step ${step.id} failed, retrying in ${backoffMs}ms... (attempt ${attempts}/${maxAttempts})`);
          await new Promise(resolve => setTimeout(resolve, backoffMs));
        }
      } while (!stepResult.success && attempts < maxAttempts);

      results.push(stepResult);

      if (stepResult.success) {
        completedSteps++;
      } else {
        failedSteps++;
        
        // Stop on failure if configured
        if (this.config.stopOnFailure) {
          this.logger.warn(`Step ${step.id} failed, stopping execution`);
          break;
        }
      }
    }

    this.state.executing = false;
    const totalDuration = Date.now() - startTime;
    const success = failedSteps === 0 || this.config.continueOnError;

    this.logger.info(`Plan execution complete: ${completedSteps}/${this.state.plan.length} steps successful`);

    return {
      objective: this.state.objective,
      steps: results,
      success,
      totalSteps: this.state.plan.length,
      completedSteps,
      failedSteps,
      duration: totalDuration,
    };
  }

  /**
   * Check if currently executing
   */
  isExecuting(): boolean {
    return this.state.executing;
  }

  /**
   * Get current step index
   */
  getCurrentStepIndex(): number {
    return this.state.currentStepIndex;
  }

  /**
   * Get state snapshot
   */
  getState(): OrchestratorState {
    return { ...this.state };
  }

  /**
   * Auto-generate a plan using AI based on the objective
   * @param request - Planning request with objective and constraints
   * @returns Generated plan with reasoning
   */
  async autoPlan(request: PlanRequest): Promise<PlanResponse> {
    this.logger.info(`Auto-generating plan for objective: ${request.objective}`);
    
    try {
      const plan = await this.aiPlanner.generatePlan(request);
      
      // Validate the generated plan
      const validation = await this.aiPlanner.validatePlan(plan);
      
      if (!validation.valid) {
        this.logger.warn('Generated plan has validation errors:', validation.errors);
        // Still set the plan but log warnings
      }
      
      // Set the objective and plan
      this.setObjective(request.objective);
      this.setPlan(plan.steps);
      
      this.logger.info(`Auto-generated ${plan.steps.length} steps with ${plan.confidence} confidence`);
      this.logger.debug(`Plan reasoning: ${plan.reasoning}`);
      
      return plan;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Auto-planning failed:', errorMessage);
      throw error;
    }
  }

  /**
   * Execute an objective with auto-planning
   * @param objective - Natural language objective
   * @param context - Optional context for planning
   * @returns Execution result
   */
  async executeWithAutoPlan(
    objective: string,
    context?: Record<string, unknown>
  ): Promise<PlanResult> {
    this.logger.info(`Executing objective with auto-planning: ${objective}`);
    
    try {
      // Generate plan automatically
      const plan = await this.autoPlan({
        objective,
        context,
        availableIntegrations: this.integrationManager.listIntegrations()
          .filter(i => i.enabled)
          .map(i => i.name),
      });
      
      // Execute the generated plan
      return await this.executePlan();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Auto-plan execution failed:', errorMessage);
      
      return {
        objective,
        steps: [],
        success: false,
        totalSteps: 0,
        completedSteps: 0,
        failedSteps: 1,
        duration: 0,
      };
    }
  }

  /**
   * Optimize the current plan using AI
   * @returns Optimized plan
   */
  async optimizeCurrentPlan(): Promise<PlanResponse> {
    if (this.state.plan.length === 0) {
      throw new Error('No plan to optimize');
    }
    
    this.logger.info('Optimizing current plan');
    
    const currentPlan: PlanResponse = {
      steps: this.state.plan,
      reasoning: 'Current plan',
      estimatedDuration: this.state.plan.length * 10,
      confidence: 0.7,
    };
    
    const request: PlanRequest = {
      objective: this.state.objective,
      availableIntegrations: this.integrationManager.listIntegrations()
        .filter(i => i.enabled)
        .map(i => i.name),
    };
    
    try {
      const optimized = await this.aiPlanner.optimizePlan(currentPlan, request);
      this.setPlan(optimized.steps);
      this.logger.info('Plan optimized successfully');
      return optimized;
    } catch (error) {
      this.logger.error('Plan optimization failed:', error);
      return currentPlan;
    }
  }
}

/**
 * Factory function to create a pre-configured Orchestrator
 */
export function createOrchestrator(
  integrationManager: IntegrationManager,
  victusBridge: VictusBridge,
  config?: OrchestratorConfig,
  logger?: Logger
): Orchestrator {
  return new Orchestrator(integrationManager, victusBridge, config, logger);
}

export default Orchestrator;