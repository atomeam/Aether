/**
 * File system utilities for documentation generation
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import { glob } from 'glob';

export class FileUtils {
  /**
   * Read a file with error handling
   */
  static async readFile(filePath: string): Promise<string> {
    try {
      return await fs.readFile(filePath, 'utf-8');
    } catch (error) {
      throw new Error(`Failed to read file ${filePath}: ${error}`);
    }
  }

  /**
   * Write a file with directory creation
   */
  static async writeFile(filePath: string, content: string): Promise<void> {
    try {
      await fs.ensureDir(path.dirname(filePath));
      await fs.writeFile(filePath, content, 'utf-8');
    } catch (error) {
      throw new Error(`Failed to write file ${filePath}: ${error}`);
    }
  }

  /**
   * Check if a file exists
   */
  static async exists(filePath: string): Promise<boolean> {
    return fs.pathExists(filePath);
  }

  /**
   * Get all TypeScript files in a directory
   */
  static async getTypeScriptFiles(dir: string): Promise<string[]> {
    return glob('**/*.ts', {
      cwd: dir,
      ignore: ['**/*.test.ts', '**/*.spec.ts', '**/node_modules/**', '**/dist/**'],
      absolute: true,
    });
  }

  /**
   * Get all React/JSX files in a directory
   */
  static async getReactFiles(dir: string): Promise<string[]> {
    return glob('**/*.{tsx,jsx}', {
      cwd: dir,
      ignore: ['**/*.test.tsx', '**/*.spec.tsx', '**/node_modules/**', '**/dist/**'],
      absolute: true,
    });
  }

  /**
   * Get all package.json files in a directory
   */
  static async getPackageFiles(dir: string): Promise<string[]> {
    return glob('**/package.json', {
      cwd: dir,
      ignore: ['**/node_modules/**'],
      absolute: true,
    });
  }

  /**
   * Parse a package.json file
   */
  static async parsePackageJson(filePath: string): Promise<any> {
    const content = await this.readFile(filePath);
    return JSON.parse(content);
  }

  /**
   * Get the relative path from base to target
   */
  static getRelativePath(base: string, target: string): string {
    return path.relative(base, target);
  }

  /**
   * Ensure a directory exists
   */
  static async ensureDir(dirPath: string): Promise<void> {
    await fs.ensureDir(dirPath);
  }

  /**
   * Copy a file
   */
  static async copyFile(source: string, destination: string): Promise<void> {
    await fs.ensureDir(path.dirname(destination));
    await fs.copy(source, destination);
  }

  /**
   * Delete a file or directory
   */
  static async delete(filePath: string): Promise<void> {
    await fs.remove(filePath);
  }

  /**
   * Get file stats
   */
  static async getStats(filePath: string): Promise<fs.Stats> {
    return fs.stat(filePath);
  }

  /**
   * Read directory contents
   */
  static async readDir(dirPath: string): Promise<string[]> {
    return fs.readdir(dirPath);
  }
}
