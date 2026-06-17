/**
 * Project Health Check Workflow
 * 
 * Monitors health status across all major projects (Aether, ALPHA, ALPHA-1, HomeBase)
 * Checks if services are running, disk usage, and basic project integrity
 */

import * as path from 'path';
import * as fs from 'fs';
import { JobContext, JobResult } from '../backbone/shared/types/job';

interface ProjectHealth {
  name: string;
  path: string;
  exists: boolean;
  hasPackageJson: boolean;
  serviceRunning: boolean;
  serviceUrl?: string;
  diskUsage?: number;
  status: 'healthy' | 'unhealthy' | 'unknown';
}

export async function handler(context: JobContext): Promise<JobResult> {
  const { input, config, logger, runId } = context;
  
  try {
    logger.info('Project health check started', { input });
    
    const projects = [
      { name: 'Aether', path: path.join(process.cwd(), '..', 'Aether'), url: 'http://localhost:3000' },
      { name: 'ALPHA', path: path.join(process.cwd(), '..', 'ALPHA'), url: 'http://localhost:3000' },
      { name: 'ALPHA-1', path: path.join(process.cwd(), '..', 'ALPHA-1'), url: 'http://localhost:8080' },
      { name: 'HomeBase', path: path.join(process.cwd(), '..', 'HomeBase'), url: 'http://localhost:5173' },
    ];

    const healthResults: ProjectHealth[] = [];

    for (const project of projects) {
      const health: ProjectHealth = {
        name: project.name,
        path: project.path,
        exists: false,
        hasPackageJson: false,
        serviceRunning: false,
        serviceUrl: project.url,
        status: 'unknown'
      };

      // Check if project directory exists
      health.exists = fs.existsSync(project.path);
      
      if (health.exists) {
        // Check for package.json
        const packageJsonPath = path.join(project.path, 'package.json');
        health.hasPackageJson = fs.existsSync(packageJsonPath);

        // Check disk usage
        try {
          const stats = fs.statSync(project.path);
          health.diskUsage = stats.size;
        } catch (error) {
          logger.warn(`Failed to get disk usage for ${project.name}`, { error });
        }

        // Check if service is running
        if (project.url) {
          try {
            const response = await fetch(project.url, { method: 'HEAD' });
            health.serviceRunning = response.ok;
          } catch (fetchError) {
            health.serviceRunning = false;
          }
        }

        // Determine overall status
        health.status = (health.exists && health.hasPackageJson) ? 'healthy' : 'unhealthy';
      } else {
        health.status = 'unhealthy';
      }

      healthResults.push(health);
      logger.info(`Health check for ${project.name}`, { health });
    }

    const overallHealth = {
      timestamp: new Date().toISOString(),
      totalProjects: projects.length,
      healthyProjects: healthResults.filter(p => p.status === 'healthy').length,
      unhealthyProjects: healthResults.filter(p => p.status === 'unhealthy').length,
      projects: healthResults
    };

    logger.info('Project health check completed', { overallHealth });

    return {
      runId,
      status: 'completed',
      startTime: new Date(),
      endTime: new Date(),
      duration: 2000,
      output: overallHealth
    };
  } catch (error) {
    logger.error('Project health check failed', { 
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