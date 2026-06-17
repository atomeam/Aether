/**
 * Auto-Restart Workflow
 * 
 * Monitors critical services and automatically restarts them if they fail.
 * Sends notifications when restarts occur.
 */

import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { JobContext, JobResult } from '../backbone/shared/types/job';

const execAsync = promisify(exec);

interface ServiceCheck {
  name: string;
  url: string;
  port: number;
  processName: string;
  startCommand: string;
  workingDirectory: string;
}

interface ServiceStatus {
  name: string;
  url: string;
  isRunning: boolean;
  responseTime?: number;
  restarted: boolean;
  error?: string;
}

export async function handler(context: JobContext): Promise<JobResult> {
  const { input, config, logger, runId } = context;
  
  try {
    logger.info('Auto-restart workflow started', { input });
    
    const projectRoot = path.join(process.cwd(), '..');
    
    // Services to monitor
    const services: ServiceCheck[] = [
      {
        name: 'Aether Backend',
        url: 'http://localhost:3000',
        port: 3000,
        processName: 'node',
        startCommand: 'npm run dev:backend',
        workingDirectory: path.join(projectRoot, 'Aether')
      },
      {
        name: 'HomeBase',
        url: 'http://localhost:5173',
        port: 5173,
        processName: 'node',
        startCommand: 'npm run dev',
        workingDirectory: path.join(projectRoot, 'HomeBase')
      },
      {
        name: 'ALPHA-1 Backend',
        url: 'http://localhost:8080',
        port: 8080,
        processName: 'node',
        startCommand: 'npm run dev',
        workingDirectory: path.join(projectRoot, 'ALPHA-1')
      }
    ];
    
    let restartCount = 0;
    const serviceStatuses: ServiceStatus[] = [];
    
    for (const service of services) {
      const status: ServiceStatus = {
        name: service.name,
        url: service.url,
        isRunning: false,
        restarted: false
      };
      
      try {
        logger.info(`Checking service: ${service.name}`, { url: service.url });
        
        // Check if service is responding
        const startTime = Date.now();
        const response = await fetch(service.url, { 
          method: 'HEAD',
          signal: AbortSignal.timeout(10000) // 10 second timeout
        });
        const responseTime = Date.now() - startTime;
        
        status.isRunning = response.ok;
        status.responseTime = responseTime;
        
        if (response.ok) {
          logger.info(`Service ${service.name} is running`, { 
            responseTime: `${responseTime}ms` 
          });
        } else {
          logger.warn(`Service ${service.name} is not responding correctly`, { 
            status: response.status 
          });
        }
        
      } catch (error) {
        status.isRunning = false;
        status.error = (error as Error).message;
        logger.warn(`Service ${service.name} check failed`, { error: (error as Error).message });
        
        // Service is down, attempt restart
        logger.info(`Attempting to restart ${service.name}`);
        
        try {
          // First, try to find and kill existing process
          await killProcessOnPort(service.port);
          
          // Wait a moment
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Start the service
          logger.info(`Starting ${service.name}`, { 
            command: service.startCommand,
            directory: service.workingDirectory 
          });
          
          // Start in background
          const startProcess = exec(`cd "${service.workingDirectory}" && ${service.startCommand}`, {
            detached: true,
            stdio: 'ignore'
          });
          
          startProcess.unref();
          
          // Wait for service to start
          await new Promise(resolve => setTimeout(resolve, 5000));
          
          // Check if it's now running
          try {
            const restartCheck = await fetch(service.url, { 
              method: 'HEAD',
              signal: AbortSignal.timeout(5000)
            });
            
            if (restartCheck.ok) {
              status.restarted = true;
              status.isRunning = true;
              restartCount++;
              logger.info(`Successfully restarted ${service.name}`);
            } else {
              logger.warn(`Restarted ${service.name} but still not responding`);
            }
          } catch (restartError) {
            logger.warn(`Restart attempt failed for ${service.name}`, { error: restartError });
          }
          
        } catch (restartError) {
          status.error = `Restart failed: ${(restartError as Error).message}`;
          logger.error(`Failed to restart ${service.name}`, { error: restartError });
        }
      }
      
      serviceStatuses.push(status);
    }
    
    const summary = {
      timestamp: new Date().toISOString(),
      totalServices: services.length,
      runningServices: serviceStatuses.filter(s => s.isRunning).length,
      stoppedServices: serviceStatuses.filter(s => !s.isRunning).length,
      restartedCount,
      serviceStatuses
    };
    
    logger.info('Auto-restart workflow completed', summary);
    
    return {
      runId,
      status: 'completed',
      startTime: new Date(),
      endTime: new Date(),
      duration: 10000,
      output: summary
    };
  } catch (error) {
    logger.error('Auto-restart workflow failed', { 
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

async function killProcessOnPort(port: number): Promise<void> {
  try {
    // Find process using the port
    const { stdout } = await execAsync(`netstat -ano | findstr :${port}`);
    const lines = stdout.trim().split('\n');
    
    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 5) {
        const pid = parts[parts.length - 1]; // Last column is PID
        if (pid && pid !== '0') {
          try {
            await execAsync(`taskkill //F //PID ${pid}`);
            console.log(`Killed process ${pid} on port ${port}`);
          } catch (killError) {
            console.log(`Failed to kill process ${pid}: ${killError}`);
          }
        }
      }
    }
  } catch (error) {
    console.log(`No process found on port ${port} or error killing process`);
  }
}