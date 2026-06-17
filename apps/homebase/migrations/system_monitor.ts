/**
 * System Monitor Workflow
 * 
 * Monitors system resources including disk space, memory, and CPU usage
 * Provides alerts when resources exceed thresholds
 */

import { JobContext, JobResult } from '../backbone/shared/types/job';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface SystemMetrics {
  timestamp: string;
  diskUsage: {
    drive: string;
    total: number;
    used: number;
    available: number;
    percentUsed: number;
  }[];
  memory: {
    total: number;
    used: number;
    free: number;
    percentUsed: number;
  };
  alerts: string[];
}

export async function handler(context: JobContext): Promise<JobResult> {
  const { input, config, logger, runId } = context;
  
  try {
    logger.info('System monitor started', { input });
    
    const metrics: SystemMetrics = {
      timestamp: new Date().toISOString(),
      diskUsage: [],
      memory: {
        total: 0,
        used: 0,
        free: 0,
        percentUsed: 0
      },
      alerts: []
    };

    // Get disk usage (Windows) - simplified approach
    try {
      const { stdout } = await execAsync('powershell "Get-PSDrive -PSProvider FileSystem | Select-Object Name,Used,Free | ConvertTo-Json"');
      const drives = JSON.parse(stdout);
      
      if (Array.isArray(drives)) {
        for (const drive of drives) {
          if (drive.Name && drive.Used !== undefined && drive.Free !== undefined) {
            const total = drive.Used + drive.Free;
            const percentUsed = total > 0 ? (drive.Used / total) * 100 : 0;

            metrics.diskUsage.push({
              drive: drive.Name,
              total: total,
              used: drive.Used,
              available: drive.Free,
              percentUsed: Math.round(percentUsed)
            });

            // Alert if disk usage > 80%
            if (percentUsed > 80) {
              metrics.alerts.push(`Disk ${drive.Name} usage critical: ${percentUsed.toFixed(1)}%`);
            }
          }
        }
      }
    } catch (error) {
      logger.warn('Failed to get disk usage, using fallback', { error });
      // Fallback: basic check
      metrics.diskUsage.push({
        drive: 'C',
        total: 0,
        used: 0,
        available: 0,
        percentUsed: 0
      });
    }

    // Get memory usage (Windows) - simplified approach
    try {
      const { stdout } = await execAsync('powershell "Get-CimInstance Win32_OperatingSystem | Select-Object TotalVisibleMemorySize,FreePhysicalMemory | ConvertTo-Json"');
      const osInfo = JSON.parse(stdout);
      
      if (osInfo.TotalVisibleMemorySize && osInfo.FreePhysicalMemory) {
        const totalMemory = osInfo.TotalVisibleMemorySize;
        const freeMemory = osInfo.FreePhysicalMemory;
        const usedMemory = totalMemory - freeMemory;
        
        metrics.memory = {
          total: totalMemory,
          used: usedMemory,
          free: freeMemory,
          percentUsed: totalMemory > 0 ? (usedMemory / totalMemory) * 100 : 0
        };

        // Alert if memory usage > 85%
        if (metrics.memory.percentUsed > 85) {
          metrics.alerts.push(`Memory usage critical: ${metrics.memory.percentUsed.toFixed(1)}%`);
        }
      }
    } catch (error) {
      logger.warn('Failed to get memory usage, using fallback', { error });
      // Fallback: basic check
      metrics.memory = {
        total: 0,
        used: 0,
        free: 0,
        percentUsed: 0
      };
    }

    logger.info('System monitor completed', { metrics, alertCount: metrics.alerts.length });

    return {
      runId,
      status: 'completed',
      startTime: new Date(),
      endTime: new Date(),
      duration: 3000,
      output: metrics
    };
  } catch (error) {
    logger.error('System monitor failed', { 
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