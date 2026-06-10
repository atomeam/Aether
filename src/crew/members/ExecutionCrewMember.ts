import { CrewMember, CrewRole, CrewStatus, CrewTask, CrewTaskResult } from '../CrewMember.js';

/**
 * Execution Crew Member - Task Execution
 * Priority: 3
 * Handles: Running individual tasks, managing state, error handling
 * Identity: EXEC - Efficient executor that gets things done
 */
export class ExecutionCrewMember implements CrewMember {
  id = 'execution-3';
  name = 'EXEC';
  role = CrewRole.EXECUTION;
  status = CrewStatus.ACTIVE;
  capabilities = [
    'task_execution',
    'state_management',
    'error_handling',
    'retry_logic',
    'progress_tracking',
    'resource_management'
  ];
  priority = 3;

  visuals = {
    color: 'text-orange-400',
    symbol: '⚒',
    theme: 'mechanical-forge',
    avatarUrl: '/avatars/forge-agent.png'
  };

  private activeExecutions = new Map<string, any>();
  private maxConcurrentTasks = 5;

  async execute(task: CrewTask): Promise<CrewTaskResult> {
    const startTime = Date.now();

    try {
      switch (task.type) {
        case 'execute_single':
          return await this.executeSingleTask(task);
        case 'execute_batch':
          return await this.executeBatchTasks(task);
        case 'monitor_progress':
          return await this.monitorProgress(task);
        case 'handle_error':
          return await this.handleError(task);
        case 'manage_state':
          return await this.manageState(task);
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

  private async executeSingleTask(task: CrewTask): Promise<CrewTaskResult> {
    const startTime = Date.now();
    const { taskToExecute, context } = task.payload;

    // Check if we have capacity
    if (this.activeExecutions.size >= this.maxConcurrentTasks) {
      return {
        success: false,
        error: 'Maximum concurrent tasks reached',
        executionTime: Date.now() - startTime,
        crewMemberId: this.id,
        timestamp: new Date()
      };
    }

    // Register task
    const executionId = `${task.id}-${Date.now()}`;
    this.activeExecutions.set(executionId, {
      task: taskToExecute,
      status: 'running',
      startTime: Date.now()
    });

    try {
      // Simulate task execution with actual logic
      const result = await this.performTaskExecution(taskToExecute, context);

      this.activeExecutions.delete(executionId);

      return {
        success: true,
        data: {
          result,
          executionId,
          executionTime: Date.now() - startTime,
          message: 'EXEC: Task executed efficiently and on schedule'
        },
        executionTime: Date.now() - startTime,
        crewMemberId: this.id,
        timestamp: new Date()
      };
    } catch (error) {
      this.activeExecutions.delete(executionId);
      throw error;
    }
  }

  private async executeBatchTasks(task: CrewTask): Promise<CrewTaskResult> {
    const startTime = Date.now();
    const { tasks, context } = task.payload;

    const results = [];
    const batchSize = 3; // Process 3 tasks at a time

    for (let i = 0; i < tasks.length; i += batchSize) {
      const batch = tasks.slice(i, i + batchSize);
      const batchPromises = batch.map(singleTask => 
        this.performTaskExecution(singleTask, context)
      );

      const batchResults = await Promise.allSettled(batchPromises);
      results.push(...batchResults.map((result, index) => ({
        task: batch[index].id,
        success: result.status === 'fulfilled',
        result: result.status === 'fulfilled' ? result.value : result.reason
      })));
    }

    return {
      success: true,
      data: {
        results,
        totalTasks: tasks.length,
        successfulTasks: results.filter(r => r.success).length,
        failedTasks: results.filter(r => !r.success).length
      },
      executionTime: Date.now() - startTime,
      crewMemberId: this.id,
      timestamp: new Date()
    };
  }

  private async monitorProgress(task: CrewTask): Promise<CrewTaskResult> {
    const startTime = Date.now();
    const { executionId } = task.payload;

    const execution = this.activeExecutions.get(executionId);

    if (!execution) {
      return {
        success: false,
        error: 'Execution not found',
        executionTime: Date.now() - startTime,
        crewMemberId: this.id,
        timestamp: new Date()
      };
    }

    return {
      success: true,
      data: {
        executionId,
        status: execution.status,
        elapsedTime: Date.now() - execution.startTime,
        task: execution.task
      },
      executionTime: Date.now() - startTime,
      crewMemberId: this.id,
      timestamp: new Date()
    };
  }

  private async handleError(task: CrewTask): Promise<CrewTaskResult> {
    const startTime = Date.now();
    const { error, task: failedTask, retryCount } = task.payload;

    const maxRetries = 3;
    const shouldRetry = retryCount < maxRetries;

    if (shouldRetry) {
      return {
        success: true,
        data: {
          action: 'retry',
          retryCount: retryCount + 1,
          message: `Retrying task (attempt ${retryCount + 1}/${maxRetries})`
        },
        executionTime: Date.now() - startTime,
        crewMemberId: this.id,
        timestamp: new Date()
      };
    } else {
      return {
        success: false,
        data: {
          action: 'fail',
          message: 'Max retries reached, marking task as failed',
          error
        },
        executionTime: Date.now() - startTime,
        crewMemberId: this.id,
        timestamp: new Date()
      };
    }
  }

  private async manageState(task: CrewTask): Promise<CrewTaskResult> {
    const startTime = Date.now();
    const { operation, stateKey, stateValue } = task.payload;

    // In-memory state management (in production, use Redis or similar)
    const stateStore = new Map<string, any>();

    switch (operation) {
      case 'get':
        const value = stateStore.get(stateKey);
        return {
          success: true,
          data: { value },
          executionTime: Date.now() - startTime,
          crewMemberId: this.id,
          timestamp: new Date()
        };

      case 'set':
        stateStore.set(stateKey, stateValue);
        return {
          success: true,
          data: { key: stateKey, set: true },
          executionTime: Date.now() - startTime,
          crewMemberId: this.id,
          timestamp: new Date()
        };

      case 'delete':
        stateStore.delete(stateKey);
        return {
          success: true,
          data: { key: stateKey, deleted: true },
          executionTime: Date.now() - startTime,
          crewMemberId: this.id,
          timestamp: new Date()
        };

      default:
        throw new Error(`Unknown state operation: ${operation}`);
    }
  }

  private async performTaskExecution(taskToExecute: any, context: any): Promise<any> {
    // Execute real tasks via API calls
    try {
      switch (taskToExecute.type) {
        case 'api_call':
          return await this.executeApiCall(taskToExecute, context);
        case 'data_processing':
          return await this.executeDataProcessing(taskToExecute, context);
        case 'file_operation':
          return await this.executeFileOperation(taskToExecute, context);
        case 'crew_task':
          return await this.executeCrewTask(taskToExecute, context);
        default:
          return await this.executeGenericTask(taskToExecute, context);
      }
    } catch (error) {
      console.error('EXEC: Task execution failed:', error);
      return { status: 'error', error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  private async executeApiCall(task: any, context: any): Promise<any> {
    const { url, method = 'GET', body, headers = {} } = task;
    
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: body ? JSON.stringify(body) : undefined
    });

    const data = await response.json();
    
    return {
      status: 'success',
      data,
      statusCode: response.status,
      executionTime: Date.now()
    };
  }

  private async executeDataProcessing(task: any, context: any): Promise<any> {
    const { operation, data } = task;
    
    // Simulate data processing operations
    let result;
    switch (operation) {
      case 'filter':
        result = data.filter((item: any) => item.active !== false);
        break;
      case 'transform':
        result = data.map((item: any) => ({ ...item, processed: true }));
        break;
      case 'aggregate':
        result = {
          count: data.length,
          sum: data.reduce((acc: number, item: any) => acc + (item.value || 0), 0),
          avg: data.reduce((acc: number, item: any) => acc + (item.value || 0), 0) / data.length
        };
        break;
      default:
        result = data;
    }
    
    return {
      status: 'success',
      operation,
      result,
      processedCount: Array.isArray(result) ? result.length : 1
    };
  }

  private async executeFileOperation(task: any, context: any): Promise<any> {
    const { operation, file, content } = task;
    
    // In a real implementation, this would interact with the file system
    // For now, simulate file operations
    return {
      status: 'success',
      operation,
      file,
      result: `${operation} completed on ${file}`,
      timestamp: new Date().toISOString()
    };
  }

  private async executeCrewTask(task: any, context: any): Promise<any> {
    const { crewMemberId, taskType } = task;
    
    // Send task to specific crew member via coordinator
    // This would integrate with the CrewCoordinator
    return {
      status: 'success',
      message: `Task ${taskType} delegated to ${crewMemberId}`,
      delegated: true,
      timestamp: new Date().toISOString()
    };
  }

  private async executeGenericTask(task: any, context: any): Promise<any> {
    // Simulate generic task execution
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
    
    return {
      status: 'success',
      message: 'Task completed',
      taskType: task.type || 'generic',
      executionTime: Date.now()
    };
  }

  async healthCheck(): Promise<boolean> {
    return this.activeExecutions.size < this.maxConcurrentTasks;
  }
}