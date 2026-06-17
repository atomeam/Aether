/**
 * Aether Backend Wrapper
 * 
 * This wrapper performs health checks on the Aether backend without modifying the original project.
 * It checks if the Aether backend service is running and accessible.
 */

import * as path from 'path';
import { JobContext, JobResult } from '../backbone/shared/types/job';

export async function handler(context: JobContext): Promise<JobResult> {
  const { input, config, logger, runId } = context;
  
  try {
    logger.info('Aether backend wrapper started', { input });
    
    const aetherPath = path.join(process.cwd(), '..', 'Aether');
    const aetherBackendUrl = 'http://localhost:3000'; // Default Aether backend port
    
    logger.info(`Checking Aether backend at ${aetherBackendUrl} (path: ${aetherPath})`);
    
    // Check if Aether backend is running by making HTTP request
    let healthStatus;
    try {
      const response = await fetch(aetherBackendUrl);
      healthStatus = {
        status: response.ok ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        services: {
          backend: response.ok ? 'healthy' : 'unhealthy',
          api: response.ok ? 'healthy' : 'unhealthy'
        },
        source: 'aether_backend_wrapper',
        httpStatus: response.status
      };
    } catch (fetchError) {
      healthStatus = {
        status: 'unreachable',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        services: {
          backend: 'unreachable',
          api: 'unreachable'
        },
        source: 'aether_backend_wrapper',
        error: (fetchError as Error).message
      };
    }
    
    logger.info('Aether backend health check completed', { healthStatus });
    
    return {
      runId,
      status: 'completed',
      startTime: new Date(),
      endTime: new Date(),
      duration: 1000,
      output: healthStatus
    };
  } catch (error) {
    logger.error('Aether backend wrapper failed', { 
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
