/**
 * HomeBase Wrapper
 * 
 * This wrapper calls the existing HomeBase dashboard without modifying the original project.
 * It performs health checks on the HomeBase service.
 */

import * as path from 'path';
import { JobContext, JobResult } from '../backbone/shared/types/job';

export async function handler(context: JobContext): Promise<JobResult> {
  const { input, config, logger, runId } = context;
  
  try {
    logger.info('HomeBase wrapper started', { input });
    
    // Check HomeBase service health
    const homeBasePath = path.join(process.cwd(), '..', 'HomeBase');
    const homeBaseUrl = 'http://localhost:5173'; // Default Vite port
    
    logger.info(`Checking HomeBase at ${homeBaseUrl} (path: ${homeBasePath})`);
    
    // Make actual HTTP request to HomeBase
    let healthStatus;
    try {
      const response = await fetch(homeBaseUrl);
      healthStatus = {
        status: response.ok ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        services: {
          frontend: response.ok ? 'healthy' : 'unhealthy',
          build: 'unknown'
        },
        source: 'homebase_wrapper',
        httpStatus: response.status
      };
    } catch (fetchError) {
      healthStatus = {
        status: 'unreachable',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        services: {
          frontend: 'unreachable',
          build: 'unknown'
        },
        source: 'homebase_wrapper',
        error: (fetchError as Error).message
      };
    }
    
    logger.info('HomeBase health check completed', { healthStatus });
    
    return {
      runId,
      status: 'completed',
      startTime: new Date(),
      endTime: new Date(),
      duration: 1000,
      output: healthStatus
    };
  } catch (error) {
    logger.error('HomeBase wrapper failed', { 
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
