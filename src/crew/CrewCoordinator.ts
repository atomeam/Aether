import { CrewMember, CrewTask, CrewTaskResult, CrewCoordination, CoordinationStrategy, CrewStatus } from './CrewMember.js';
import { DevinCrewMember } from './members/DevinCrewMember.js';
import { CloudflareCrewMember } from './members/CloudflareCrewMember.js';
import { AIStudioCrewMember } from './members/AIStudioCrewMember.js';
import { ExecutionCrewMember } from './members/ExecutionCrewMember.js';
import { AnalysisCrewMember } from './members/AnalysisCrewMember.js';
import { MemorySpine } from '../core/memory_spine.js';

/**
 * Crew Coordinator - Manages the 4-member crew system
 * Coordinates task distribution, load balancing, and crew health
 */
export class CrewCoordinator {
  private coordination: CrewCoordination;
  private taskCounter = 0;
  private memory: MemorySpine;

  constructor() {
    this.memory = new MemorySpine();
    
    // Initialize with all core crew members
    const crewMembers: CrewMember[] = [
      new CloudflareCrewMember(), // Infrastructure (Priority 1)
      new AIStudioCrewMember(),   // Planning (Priority 2)
      new ExecutionCrewMember(),  // Execution (Priority 3)
      new AnalysisCrewMember(),   // Analysis (Priority 4)
      new DevinCrewMember(),      // Versatile Assistant
    ];

    this.coordination = {
      crewMembers,
      activeTasks: new Map(),
      taskQueue: [],
      coordinationStrategy: CoordinationStrategy.PRIORITY_BASED
    };

    this.startHealthMonitoring();
  }

  /**
   * Add a new task to the queue
   */
  async addTask(task: Omit<CrewTask, 'id' | 'createdAt'>): Promise<string> {
    const fullTask: CrewTask = {
      ...task,
      id: `task-${this.taskCounter++}`,
      createdAt: new Date()
    };

    this.coordination.taskQueue.push(fullTask);
    this.logTaskAdded(fullTask);

    // Process queue immediately
    await this.processTaskQueue();

    return fullTask.id;
  }

  /**
   * Process the task queue based on coordination strategy
   */
  private async processTaskQueue(): Promise<void> {
    while (this.coordination.taskQueue.length > 0) {
      const task = this.selectNextTask();
      if (!task) break;

      const crewMember = this.selectCrewMember(task);
      if (!crewMember) {
        // No available crew member, keep task in queue
        break;
      }

      // Remove from queue and add to active tasks
      this.coordination.taskQueue = this.coordination.taskQueue.filter(t => t.id !== task.id);
      this.coordination.activeTasks.set(task.id, task);

      // Execute task asynchronously
      this.executeTask(task, crewMember);
    }
  }

  /**
   * Select next task based on coordination strategy
   */
  private selectNextTask(): CrewTask | null {
    switch (this.coordination.coordinationStrategy) {
      case CoordinationStrategy.PRIORITY_BASED:
        return this.selectByPriority();
      case CoordinationStrategy.ROUND_ROBIN:
        return this.selectRoundRobin();
      case CoordinationStrategy.CAPABILITY_MATCH:
        return this.selectByCapability();
      case CoordinationStrategy.LOAD_BALANCED:
        return this.selectByLoadBalance();
      default:
        return this.coordination.taskQueue[0] || null;
    }
  }

  private selectByPriority(): CrewTask | null {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    const sortedTasks = [...this.coordination.taskQueue].sort((a, b) => 
      priorityOrder[a.priority] - priorityOrder[b.priority]
    );
    return sortedTasks[0] || null;
  }

  private selectRoundRobin(): CrewTask | null {
    // Simple round-robin: take first task
    return this.coordination.taskQueue[0] || null;
  }

  private selectByCapability(): CrewTask | null {
    // Select task that best matches available crew capabilities
    const availableCrew = this.getAvailableCrewMembers();
    if (availableCrew.length === 0) return null;

    for (const task of this.coordination.taskQueue) {
      const matchingCrew = availableCrew.find(crew =>
        this.canCrewHandleTask(crew, task)
      );
      if (matchingCrew) return task;
    }

    return this.coordination.taskQueue[0] || null;
  }

  private selectByLoadBalance(): CrewTask | null {
    // Select task for crew member with lowest load
    const availableCrew = this.getAvailableCrewMembers();
    if (availableCrew.length === 0) return null;

    const leastLoadedCrew = availableCrew.reduce((min, crew) =>
      this.getCrewLoad(crew) < this.getCrewLoad(min) ? crew : min
    );

    const taskForCrew = this.coordination.taskQueue.find(task =>
      this.canCrewHandleTask(leastLoadedCrew, task)
    );

    return taskForCrew || this.coordination.taskQueue[0] || null;
  }

  /**
   * Select best crew member for a task
   */
  private selectCrewMember(task: CrewTask): CrewMember | null {
    const availableCrew = this.getAvailableCrewMembers();
    
    // Filter by capability
    const capableCrew = availableCrew.filter(crew =>
      this.canCrewHandleTask(crew, task)
    );

    if (capableCrew.length === 0) return null;

    // Sort by priority (lower number = higher priority)
    capableCrew.sort((a, b) => a.priority - b.priority);

    // Select highest priority capable crew member
    return capableCrew[0];
  }

  /**
   * Check if crew member can handle task
   */
  private canCrewHandleTask(crew: CrewMember, task: CrewTask): boolean {
    // Check if crew member has the relevant capability
    const taskTypeToCapability: Record<string, string> = {
      'deploy_worker': 'worker_deployment',
      'route_request': 'ai_gateway_routing',
      'plan_workflow': 'workflow_planning',
      'decompose_task': 'task_decomposition',
      'execute_single': 'task_execution',
      'analyze_performance': 'performance_analysis',
      'analyze_logs': 'log_analysis'
    };

    const requiredCapability = taskTypeToCapability[task.type] || task.type;
    return crew.capabilities.includes(requiredCapability);
  }

  /**
   * Get available crew members (not busy or error)
   */
  private getAvailableCrewMembers(): CrewMember[] {
    return this.coordination.crewMembers.filter(crew =>
      crew.status !== 'busy' && crew.status !== 'error' && crew.status !== 'offline'
    );
  }

  /**
   * Get current load of a crew member
   */
  private getCrewLoad(crew: CrewMember): number {
    return Array.from(this.coordination.activeTasks.values()).filter(task =>
      task.assignedTo === crew.id
    ).length;
  }

  /**
   * Execute a task on a crew member
   */
  private async executeTask(task: CrewTask, crewMember: CrewMember): Promise<void> {
    task.assignedTo = crewMember.id;
    crewMember.status = CrewStatus.BUSY;

    this.logTaskStarted(task, crewMember);

    try {
      const result = await crewMember.execute(task);
      this.handleTaskResult(task, result);
    } catch (error) {
      const errorResult: CrewTaskResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTime: 0,
        crewMemberId: crewMember.id,
        timestamp: new Date()
      };
      this.handleTaskResult(task, errorResult);
    } finally {
      crewMember.status = CrewStatus.ACTIVE;
      this.coordination.activeTasks.delete(task.id);
      this.logTaskCompleted(task);

      // Process next tasks in queue
      await this.processTaskQueue();
    }
  }

  /**
   * Handle task result
   */
  private handleTaskResult(task: CrewTask, result: CrewTaskResult): void {
    // Record in memory
    this.memory.remember({
      type: 'task_result',
      content: {
        taskId: task.id,
        taskType: task.type,
        success: result.success,
        data: result.data,
        error: result.error,
        crewMemberId: result.crewMemberId
      },
      tags: ['task', task.type, result.crewMemberId]
    });

    if (result.success) {
      console.log(`✅ Task ${task.id} completed successfully by ${result.crewMemberId}`);
    } else {
      console.error(`❌ Task ${task.id} failed: ${result.error}`);
      // Could implement retry logic here
    }
  }

  /**
   * Get crew status
   */
  getCrewStatus(): any {
    return {
      crewMembers: this.coordination.crewMembers.map(crew => ({
        id: crew.id,
        name: crew.name,
        role: crew.role,
        status: crew.status,
        priority: crew.priority,
        capabilities: crew.capabilities,
        visuals: crew.visuals,
        currentLoad: this.getCrewLoad(crew)
      })),
      activeTasks: Array.from(this.coordination.activeTasks.values()).map(task => ({
        id: task.id,
        type: task.type,
        assignedTo: task.assignedTo,
        priority: task.priority
      })),
      queuedTasks: this.coordination.taskQueue.length,
      coordinationStrategy: this.coordination.coordinationStrategy
    };
  }

  /**
   * Set coordination strategy
   */
  setCoordinationStrategy(strategy: CoordinationStrategy): void {
    this.coordination.coordinationStrategy = strategy;
    console.log(`Coordination strategy changed to: ${strategy}`);
  }

  /**
   * Start health monitoring
   */
  private startHealthMonitoring(): void {
    setInterval(async () => {
      for (const crew of this.coordination.crewMembers) {
        const isHealthy = await crew.healthCheck();
        if (!isHealthy) {
          console.warn(`⚠️ Crew member ${crew.id} health check failed`);
          crew.status = CrewStatus.ERROR;
        } else if (crew.status === CrewStatus.ERROR) {
          console.log(`✅ Crew member ${crew.id} recovered`);
          crew.status = CrewStatus.ACTIVE;
        }
      }
    }, 30000); // Check every 30 seconds
  }

  /**
   * Logging methods
   */
  private logTaskAdded(task: CrewTask): void {
    console.log(`📋 Task added to queue: ${task.id} (${task.type}) - Priority: ${task.priority}`);
    this.memory.remember({
      type: 'state',
      content: { taskId: task.id, status: 'queued', type: task.type },
      tags: ['task_lifecycle', 'queued', task.id]
    });
  }

  private logTaskStarted(task: CrewTask, crew: CrewMember): void {
    console.log(`🚀 Task ${task.id} started by ${crew.name}`);
    this.memory.remember({
      type: 'state',
      content: { taskId: task.id, status: 'started', crewMemberId: crew.id },
      tags: ['task_lifecycle', 'started', task.id, crew.id]
    });
  }

  private logTaskCompleted(task: CrewTask): void {
    console.log(`✅ Task ${task.id} completed`);
    this.memory.remember({
      type: 'state',
      content: { taskId: task.id, status: 'completed' },
      tags: ['task_lifecycle', 'completed', task.id]
    });
  }
}