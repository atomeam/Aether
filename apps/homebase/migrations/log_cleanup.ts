/**
 * Log Cleanup Workflow
 * 
 * Compresses log files older than 1 day and deletes compressed logs older than 30 days.
 * Helps manage disk space and keeps logs organized.
 */

import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { JobContext, JobResult } from '../backbone/shared/types/job';

const execAsync = promisify(exec);

interface CleanupResult {
  directory: string;
  compressedCount: number;
  deletedCount: number;
  freedSpaceMB: string;
  errors: string[];
}

export async function handler(context: JobContext): Promise<JobResult> {
  const { input, config, logger, runId } = context;
  
  try {
    logger.info('Log cleanup workflow started', { input });
    
    const projectRoot = path.join(process.cwd(), '..');
    
    // Log directories to clean
    const logDirectories = [
      path.join(projectRoot, 'Aether', 'logs'),
      path.join(projectRoot, 'ALPHA', 'logs'),
      path.join(projectRoot, 'ALPHA-1', 'logs'),
      path.join(projectRoot, 'HomeBase', 'logs'),
      path.join(projectRoot, 'automation_consolidation_v2', 'logs'),
      path.join(projectRoot, 'automation_consolidation_v2', 'backbone', 'logs')
    ];
    
    const cleanupResults: CleanupResult[] = [];
    let totalCompressed = 0;
    let totalDeleted = 0;
    let totalFreedSpace = 0;
    
    for (const logDir of logDirectories) {
      const result: CleanupResult = {
        directory: logDir,
        compressedCount: 0,
        deletedCount: 0,
        freedSpaceMB: '0',
        errors: []
      };
      
      try {
        // Check if directory exists
        if (!fs.existsSync(logDir)) {
          logger.info(`Log directory does not exist: ${logDir}`);
          cleanupResults.push(result);
          continue;
        }
        
        logger.info(`Processing log directory: ${logDir}`);
        
        // Get all log files
        const files = fs.readdirSync(logDir);
        const now = Date.now();
        const oneDayMs = 24 * 60 * 60 * 1000;
        const thirtyDaysMs = 30 * oneDayMs;
        
        for (const file of files) {
          const filePath = path.join(logDir, file);
          const stats = fs.statSync(filePath);
          const age = now - stats.mtimeMs;
          
          // Skip directories
          if (stats.isDirectory()) continue;
          
          // Compress log files older than 1 day (but not already compressed)
          if (age > oneDayMs && !file.endsWith('.gz') && !file.endsWith('.zip')) {
            try {
              const compressedPath = `${filePath}.gz`;
              
              // Use gzip to compress
              await execAsync(`gzip -c "${filePath}" > "${compressedPath}"`);
              
              // If compression successful, delete original
              if (fs.existsSync(compressedPath)) {
                const originalSize = stats.size;
                const compressedSize = fs.statSync(compressedPath).size;
                fs.unlinkSync(filePath);
                
                result.compressedCount++;
                totalCompressed++;
                totalFreedSpace += (originalSize - compressedSize);
                
                logger.info(`Compressed log file: ${file}`, {
                  originalSize: (originalSize / 1024).toFixed(2) + 'KB',
                  compressedSize: (compressedSize / 1024).toFixed(2) + 'KB'
                });
              }
            } catch (compressError) {
              result.errors.push(`Failed to compress ${file}: ${(compressError as Error).message}`);
              logger.warn(`Failed to compress ${file}`, { error: compressError });
            }
          }
          
          // Delete compressed logs older than 30 days
          if (age > thirtyDaysMs && (file.endsWith('.gz') || file.endsWith('.zip'))) {
            try {
              const fileSize = stats.size;
              fs.unlinkSync(filePath);
              
              result.deletedCount++;
              totalDeleted++;
              totalFreedSpace += fileSize;
              
              logger.info(`Deleted old log: ${file}`, {
                age: Math.floor(age / oneDayMs) + ' days',
                size: (fileSize / 1024).toFixed(2) + 'KB'
              });
            } catch (deleteError) {
              result.errors.push(`Failed to delete ${file}: ${(deleteError as Error).message}`);
              logger.warn(`Failed to delete ${file}`, { error: deleteError });
            }
          }
        }
        
        result.freedSpaceMB = (totalFreedSpace / (1024 * 1024)).toFixed(2);
        
      } catch (error) {
        result.errors.push(`Directory processing error: ${(error as Error).message}`);
        logger.error(`Failed to process log directory: ${logDir}`, { error });
      }
      
      cleanupResults.push(result);
    }
    
    const summary = {
      timestamp: new Date().toISOString(),
      totalDirectories: logDirectories.length,
      totalCompressed,
      totalDeleted,
      totalFreedSpaceMB: (totalFreedSpace / (1024 * 1024)).toFixed(2),
      cleanupResults
    };
    
    logger.info('Log cleanup workflow completed', summary);
    
    return {
      runId,
      status: 'completed',
      startTime: new Date(),
      endTime: new Date(),
      duration: 3000,
      output: summary
    };
  } catch (error) {
    logger.error('Log cleanup workflow failed', { 
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