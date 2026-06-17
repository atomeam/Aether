/**
 * DOOM WAD Processor Wrapper
 * 
 * This wrapper calls the existing devour_wad.py Python script without modifying the original.
 * It processes DOOM WAD files and creates cryptographic fingerprints.
 */

import { spawn } from 'child_process';
import * as path from 'path';
import { JobContext, JobResult } from '../backbone/shared/types/job';

export async function handler(context: JobContext): Promise<JobResult> {
  const { input, config, logger, runId } = context;
  
  try {
    logger.info('DOOM WAD processor wrapper started', { input });
    
    const scriptPath = path.join(process.cwd(), 'devour_wad.py');
    const wadFile = input.wadFile as string;
    const sourceUrl = input.sourceUrl as string;
    const outputFile = input.outputFile as string || 'wad_fingerprint.json';
    
    if (!wadFile) {
      throw new Error('Missing required input: wadFile');
    }
    
    const args = [scriptPath, wadFile];
    if (sourceUrl) args.push(sourceUrl);
    if (outputFile) args.push(outputFile);
    
    logger.info(`Executing Python script: python ${args.join(' ')}`);
    
    // Spawn the Python process
    const childProcess = spawn('python', args, {
      shell: true,
      stdio: 'pipe'
    });

    // Capture output
    let stdout = '';
    let stderr = '';

    childProcess.stdout?.on('data', (data) => {
      stdout += data.toString();
      logger.info('Python script stdout', { data: data.toString().trim() });
    });

    childProcess.stderr?.on('data', (data) => {
      stderr += data.toString();
      logger.error('Python script stderr', { data: data.toString().trim() });
    });

    // Wait for process completion
    const result = await new Promise<{ code: number | null; signal: NodeJS.Signals | null }>((resolve) => {
      childProcess.on('close', (code, signal) => {
        resolve({ code, signal });
      });
    });

    if (result.code === 0) {
      logger.info('DOOM WAD processor completed successfully');
      
      return {
        runId,
        status: 'completed',
        startTime: new Date(),
        endTime: new Date(),
        duration: 2000,
        output: {
          success: true,
          wadFile: wadFile,
          outputFile: outputFile,
          stdout: stdout.substring(0, 1000),
          exitCode: result.code
        }
      };
    } else {
      throw new Error(`DOOM WAD processor failed with exit code ${result.code}: ${stderr}`);
    }
  } catch (error) {
    logger.error('DOOM WAD processor wrapper failed', { error });
    
    return {
      runId,
      status: 'failed',
      startTime: new Date(),
      endTime: new Date(),
      duration: 0,
      error: error as Error
    };
  }
}
