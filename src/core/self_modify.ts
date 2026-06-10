/**
 * SelfModifier - Direct Filesystem Operations for ALPHA Self-Modification
 * 
 * Enables ALPHA to modify its own code, configuration, and structure.
 * Provides direct filesystem access for reading, writing, and executing commands.
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Types for self-modification operations
export interface FileOperation {
  type: 'read_file' | 'write_file' | 'edit_file' | 'delete_file' | 'remove_file';
  path: string;
  content?: string;
  oldString?: string;
  newString?: string;
}

export interface CommandOperation {
  type: 'execute';
  command: string;
  cwd?: string;
}

export type SelfModificationOperation = FileOperation | CommandOperation;

export interface ModificationResult {
  success: boolean;
  operation: SelfModificationOperation;
  output?: string;
  error?: string;
  timestamp: Date;
}

export interface BatchModificationResult {
  success: boolean;
  results: ModificationResult[];
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  timestamp: Date;
}

// Logger interface
export interface Logger {
  info: (message: string, ...args: unknown[]) => void;
  warn: (message: string, ...args: unknown[]) => void;
  error: (message: string, ...args: unknown[]) => void;
  debug: (message: string, ...args: unknown[]) => void;
}

// Default console logger
const defaultLogger: Logger = {
  info: (message: string, ...args: unknown[]) => console.log(`[INFO] SelfModifier: ${message}`, ...args),
  warn: (message: string, ...args: unknown[]) => console.warn(`[WARN] SelfModifier: ${message}`, ...args),
  error: (message: string, ...args: unknown[]) => console.error(`[ERROR] SelfModifier: ${message}`, ...args),
  debug: (message: string, ...args: unknown[]) => console.log(`[DEBUG] SelfModifier: ${message}`, ...args),
};

/**
 * SelfModifier Class
 * 
 * Provides direct filesystem access for ALPHA to modify its own code, config, and structure.
 */
export class SelfModifier {
  private projectRoot: string;
  private logger: Logger;
  private modificationHistory: ModificationResult[] = [];

  /**
   * Create a new SelfModifier instance
   * @param projectRoot - Root directory of the ALPHA project
   * @param logger - Optional custom logger
   */
  constructor(projectRoot: string = path.join(__dirname, '../..'), logger?: Logger) {
    this.projectRoot = path.resolve(projectRoot);
    this.logger = logger || defaultLogger;
    this.logger.info(`SelfModifier initialized with project root: ${this.projectRoot}`);
  }

  /**
   * Read a file from the project
   * @param relativePath - Relative path from project root
   * @returns File contents
   */
  async readFile(relativePath: string): Promise<string> {
    const fullPath = this.resolvePath(relativePath);
    
    this.logger.info(`Reading file: ${relativePath}`);
    
    try {
      const content = fs.readFileSync(fullPath, 'utf-8');
      this.logger.debug(`File read successfully: ${relativePath} (${content.length} chars)`);
      return content;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to read file: ${relativePath}`, errorMessage);
      throw new Error(`Failed to read file ${relativePath}: ${errorMessage}`);
    }
  }

  /**
   * Write content to a file
   * @param relativePath - Relative path from project root
   * @param content - Content to write
   */
  async writeFile(relativePath: string, content: string): Promise<void> {
    const fullPath = this.resolvePath(relativePath);
    
    this.logger.info(`Writing file: ${relativePath}`);
    
    try {
      // Ensure directory exists
      const dir = path.dirname(fullPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        this.logger.debug(`Created directory: ${dir}`);
      }
      
      fs.writeFileSync(fullPath, content, 'utf-8');
      this.logger.info(`File written successfully: ${relativePath}`);
      
      // Record in history
      this.modificationHistory.push({
        success: true,
        operation: { type: 'write_file', path: relativePath, content },
        output: `Wrote ${content.length} characters`,
        timestamp: new Date()
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to write file: ${relativePath}`, errorMessage);
      
      // Record failure in history
      this.modificationHistory.push({
        success: false,
        operation: { type: 'write_file', path: relativePath, content },
        error: errorMessage,
        timestamp: new Date()
      });
      
      throw new Error(`Failed to write file ${relativePath}: ${errorMessage}`);
    }
  }

  /**
   * Edit a file by replacing a string
   * @param relativePath - Relative path from project root
   * @param oldString - String to replace
   * @param newString - Replacement string
   */
  async editFile(relativePath: string, oldString: string, newString: string): Promise<void> {
    const fullPath = this.resolvePath(relativePath);
    
    this.logger.info(`Editing file: ${relativePath}`);
    
    try {
      const content = fs.readFileSync(fullPath, 'utf-8');
      
      if (!content.includes(oldString)) {
        throw new Error(`Old string not found in file: ${relativePath}`);
      }
      
      const newContent = content.replace(oldString, newString);
      fs.writeFileSync(fullPath, newContent, 'utf-8');
      
      this.logger.info(`File edited successfully: ${relativePath}`);
      
      // Record in history
      this.modificationHistory.push({
        success: true,
        operation: { type: 'edit_file', path: relativePath, oldString, newString },
        output: `Replaced string`,
        timestamp: new Date()
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to edit file: ${relativePath}`, errorMessage);
      
      // Record failure in history
      this.modificationHistory.push({
        success: false,
        operation: { type: 'edit_file', path: relativePath, oldString, newString },
        error: errorMessage,
        timestamp: new Date()
      });
      
      throw new Error(`Failed to edit file ${relativePath}: ${errorMessage}`);
    }
  }

  /**
   * Delete a file
   * @param relativePath - Relative path from project root
   */
  async deleteFile(relativePath: string): Promise<void> {
    const fullPath = this.resolvePath(relativePath);
    
    this.logger.info(`Deleting file: ${relativePath}`);
    
    try {
      if (!fs.existsSync(fullPath)) {
        throw new Error(`File not found: ${relativePath}`);
      }
      
      fs.unlinkSync(fullPath);
      this.logger.info(`File deleted successfully: ${relativePath}`);
      
      // Record in history
      this.modificationHistory.push({
        success: true,
        operation: { type: 'delete_file', path: relativePath },
        output: `File deleted`,
        timestamp: new Date()
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to delete file: ${relativePath}`, errorMessage);
      
      // Record failure in history
      this.modificationHistory.push({
        success: false,
        operation: { type: 'delete_file', path: relativePath },
        error: errorMessage,
        timestamp: new Date()
      });
      
      throw new Error(`Failed to delete file ${relativePath}: ${errorMessage}`);
    }
  }

  /**
   * Execute a shell command
   * @param command - Command to execute
   * @param cwd - Working directory (defaults to project root)
   * @returns Command output
   */
  async executeCommand(command: string, cwd?: string): Promise<string> {
    const workingDir = cwd ? this.resolvePath(cwd) : this.projectRoot;
    
    this.logger.info(`Executing command: ${command}`);
    
    try {
      const output = execSync(command, {
        cwd: workingDir,
        encoding: 'utf-8',
        stdio: 'pipe'
      });
      
      this.logger.info(`Command executed successfully`);
      this.logger.debug(`Command output: ${output}`);
      
      // Record in history
      this.modificationHistory.push({
        success: true,
        operation: { type: 'execute', command, cwd },
        output: output.trim(),
        timestamp: new Date()
      });
      
      return output;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Command failed: ${command}`, errorMessage);
      
      // Record failure in history
      this.modificationHistory.push({
        success: false,
        operation: { type: 'execute', command, cwd },
        error: errorMessage,
        timestamp: new Date()
      });
      
      throw new Error(`Command failed: ${command} - ${errorMessage}`);
    }
  }

  /**
   * Execute a batch of modification operations
   * @param operations - Array of operations to execute
   * @returns Batch result
   */
  async executeBatch(operations: SelfModificationOperation[]): Promise<BatchModificationResult> {
    this.logger.info(`Executing batch of ${operations.length} operations`);
    
    const results: ModificationResult[] = [];
    let successfulCount = 0;
    let failedCount = 0;

    for (const operation of operations) {
      try {
        let result: ModificationResult;
        
        switch (operation.type) {
          case 'read_file':
            const content = await this.readFile(operation.path);
            result = {
              success: true,
              operation,
              output: content,
              timestamp: new Date()
            };
            break;
            
          case 'write_file':
            await this.writeFile(operation.path, operation.content || '');
            result = this.modificationHistory[this.modificationHistory.length - 1];
            break;
            
          case 'edit_file':
            await this.editFile(operation.path, operation.oldString || '', operation.newString || '');
            result = this.modificationHistory[this.modificationHistory.length - 1];
            break;
            
          case 'delete_file':
          case 'remove_file':
            await this.deleteFile(operation.path);
            result = this.modificationHistory[this.modificationHistory.length - 1];
            break;
            
          case 'execute':
            const output = await this.executeCommand(operation.command, operation.cwd);
            result = this.modificationHistory[this.modificationHistory.length - 1];
            break;
            
          default:
            throw new Error(`Unknown operation type: ${(operation as any).type}`);
        }
        
        results.push(result);
        if (result.success) successfulCount++;
        else failedCount++;
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.push({
          success: false,
          operation,
          error: errorMessage,
          timestamp: new Date()
        });
        failedCount++;
      }
    }

    const batchResult: BatchModificationResult = {
      success: failedCount === 0,
      results,
      totalOperations: operations.length,
      successfulOperations: successfulCount,
      failedOperations: failedCount,
      timestamp: new Date()
    };

    this.logger.info(`Batch completed: ${successfulCount}/${operations.length} successful`);
    return batchResult;
  }

  /**
   * Get modification history
   */
  getHistory(): ModificationResult[] {
    return [...this.modificationHistory];
  }

  /**
   * Clear modification history
   */
  clearHistory(): void {
    this.modificationHistory = [];
    this.logger.info('Modification history cleared');
  }

  /**
   * Resolve a relative path to an absolute path
   * @param relativePath - Relative path from project root
   * @returns Absolute path
   */
  private resolvePath(relativePath: string): string {
    const resolved = path.resolve(this.projectRoot, relativePath);
    
    // Security check: ensure the resolved path is within the project root
    const normalizedResolved = path.normalize(resolved);
    const normalizedRoot = path.normalize(this.projectRoot);
    
    if (!normalizedResolved.startsWith(normalizedRoot)) {
      throw new Error(`Path traversal detected: ${relativePath} resolves outside project root`);
    }
    
    return normalizedResolved;
  }

  /**
   * Get project root
   */
  getProjectRoot(): string {
    return this.projectRoot;
  }
}

/**
 * Factory function to create a pre-configured SelfModifier
 */
export function createSelfModifier(
  projectRoot?: string,
  logger?: Logger
): SelfModifier {
  return new SelfModifier(projectRoot, logger);
}

export default SelfModifier;