/**
 * Project Control Workflow
 * 
 * Provides basic project control: start, stop, and status check for projects.
 * Can be called with action parameter: 'start', 'stop', 'status', or 'restart'
 */

import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { JobContext, JobResult } from '../backbone/shared/types/job';

const execAsync = promisify(exec);

interface ProjectConfig {
  name: string;
  path: string;
  startCommand: string;
  port: number;
  processName: string;
}

const projects: ProjectConfig[] = [
  {
    name: 'Aether',
    path: path.join(process.cwd(), '..', 'Aether'),
    startCommand: 'npm run dev:backend',
    port: 3000,
    processName: 'node'
  },
  {
    name: 'HomeBase',
    path: path.join(process.cwd(), '..', 'HomeBase'),
    startCommand: 'npm run dev',
    port: 5173,
    processName: 'node'
  },
  {
    name: 'ALPHA-1',
    path: path.join(process.cwd(), '..', 'ALPHA-1'),
    startCommand: 'npm run dev',
    port: 8080,
    processName: 'node'
  }
];

export async function handler(context: JobContext): Promise<JobResult> {
  const { input, config, logger, runId } = context;
  
  try {
    logger.info('Project control workflow started', { input });
    
    const action = input.action as string || 'status';
    const targetProject = input.project as string;
    
    logger.info(`Executing action: ${action}`, { targetProject });
    
    if (targetProject) {
      // Single project operation
      const project = projects.find(p => p.name.toLowerCase() === targetProject.toLowerCase());
      if (!project) {
        throw new Error(`Project not found: ${targetProject}`);
      }
      
      const result = await executeProjectAction(project, action, logger);
      
      return {
        runId,
        status: 'completed',
        startTime: new Date(),
        endTime: new Date(),
        duration: 5000,
        output: result
      };
    } else {
      // All projects operation
      const results = [];
      
      for (const project of projects) {
        try {
          const result = await executeProjectAction(project, action, logger);
          results.push(result);
        } catch (error) {
          results.push({
            project: project.name,
            action,
            success: false,
            error: (error as Error).message
          });
        }
      }
      
      return {
        runId,
        status: 'completed',
        startTime: new Date(),
        endTime: new Date(),
        duration: 10000,
        output: {
          action,
          results
        }
      };
    }
  } catch (error) {
    logger.error('Project control workflow failed', { 
      error: (error as Error).message,
      stack: (error as Error).stack 
    });
    
    return {
      runId,
      status: 'failed',
      startTime: new Date(),
      endTime: new Date(),
      duration: 0,
      error: error as Error,
      output: {
        success: false,
        error: (error as Error).message
      }
    };
  }
}

async function executeProjectAction(project: ProjectConfig, action: string, logger: any): Promise<any> {
  logger.info(`Executing ${action} on ${project.name}`);
  
  switch (action.toLowerCase()) {
    case 'start':
      return await startProject(project, logger);
    case 'stop':
      return await stopProject(project, logger);
    case 'restart':
      await stopProject(project, logger);
      await new Promise(resolve => setTimeout(resolve, 2000));
      return await startProject(project, logger);
    case 'status':
      return await checkProjectStatus(project, logger);
    default:
      throw new Error(`Unknown action: ${action}`);
  }
}

async function startProject(project: ProjectConfig, logger: any): Promise<any> {
  try {
    // Check if already running
    const status = await checkProjectStatus(project, logger);
    if (status.isRunning) {
      logger.info(`${project.name} is already running`);
      return {
        project: project.name,
        action: 'start',
        success: true,
        message: 'Already running',
        status
      };
    }
    
    logger.info(`Starting ${project.name}`, { command: project.startCommand });
    
    // Start the project in background
    const startProcess = exec(`cd "${project.path}" && ${project.startCommand}`, {
      detached: true,
      stdio: 'ignore',
      shell: true
    });
    
    startProcess.unref();
    
    // Wait for startup
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Verify it started
    const newStatus = await checkProjectStatus(project, logger);
    
    return {
      project: project.name,
      action: 'start',
      success: newStatus.isRunning,
      message: newStatus.isRunning ? 'Started successfully' : 'Started but not yet responding',
      status: newStatus
    };
  } catch (error) {
    logger.error(`Failed to start ${project.name}`, { error });
    return {
      project: project.name,
      action: 'start',
      success: false,
      error: (error as Error).message
    };
  }
}

async function stopProject(project: ProjectConfig, logger: any): Promise<any> {
  try {
    logger.info(`Stopping ${project.name}`);
    
    // Kill process on port
    await killProcessOnPort(project.port);
    
    // Wait for shutdown
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Verify it stopped
    const status = await checkProjectStatus(project, logger);
    
    return {
      project: project.name,
      action: 'stop',
      success: !status.isRunning,
      message: !status.isRunning ? 'Stopped successfully' : 'May still be running',
      status
    };
  } catch (error) {
    logger.error(`Failed to stop ${project.name}`, { error });
    return {
      project: project.name,
      action: 'stop',
      success: false,
      error: (error as Error).message
    };
  }
}

async function checkProjectStatus(project: ProjectConfig, logger: any): Promise<any> {
  try {
    const response = await fetch(`http://localhost:${project.port}`, {
      method: 'HEAD',
      signal: AbortSignal.timeout(5000)
    });
    
    return {
      project: project.name,
      isRunning: response.ok,
      url: `http://localhost:${project.port}`,
      httpStatus: response.status
    };
  } catch (error) {
    return {
      project: project.name,
      isRunning: false,
      url: `http://localhost:${project.port}`,
      error: (error as Error).message
    };
  }
}

async function killProcessOnPort(port: number): Promise<void> {
  try {
    const { stdout } = await execAsync(`netstat -ano | findstr :${port}`);
    const lines = stdout.trim().split('\n');
    
    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 5) {
        const pid = parts[parts.length - 1];
        if (pid && pid !== '0') {
          try {
            await execAsync(`taskkill //F //PID ${pid}`);
          } catch (killError) {
            // Ignore kill errors
          }
        }
      }
    }
  } catch (error) {
    // Ignore errors
  }
}