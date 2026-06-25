/**
 * Fixture management for test data
 */

import type { FixtureConfig, FixtureData } from './types.js';
import { FixtureConfigSchema, FixtureDataSchema } from './types.js';
import { promises as fs } from 'fs';
import { join, extname } from 'path';

export class FixtureManager {
  private config: FixtureConfig;
  private fixtures: Map<string, FixtureData> = new Map();

  constructor(config: Partial<FixtureConfig> = {}) {
    this.config = FixtureConfigSchema.parse(config);
  }

  /**
   * Load a fixture by name
   */
  async load(name: string): Promise<FixtureData> {
    const cached = this.fixtures.get(name);
    if (cached) {
      return cached;
    }

    const filePath = this.getFixturePath(name);
    const content = await fs.readFile(filePath, 'utf-8');
    const data = this.parseContent(content, filePath);

    this.fixtures.set(name, FixtureDataSchema.parse(data));
    return this.fixtures.get(name)!;
  }

  /**
   * Load multiple fixtures
   */
  async loadMany(names: string[]): Promise<Map<string, FixtureData>> {
    const results = new Map<string, FixtureData>();
    for (const name of names) {
      results.set(name, await this.load(name));
    }
    return results;
  }

  /**
   * Load all fixtures from directory
   */
  async loadAll(): Promise<Map<string, FixtureData>> {
    const files = await fs.readdir(this.config.directory);
    const fixtureFiles = files.filter((f) => this.isFixtureFile(f));

    const results = new Map<string, FixtureData>();
    for (const file of fixtureFiles) {
      const name = this.getFixtureName(file);
      results.set(name, await this.load(name));
    }

    return results;
  }

  /**
   * Save a fixture
   */
  async save(name: string, data: FixtureData): Promise<void> {
    const filePath = this.getFixturePath(name);
    const content = this.stringifyContent(data);
    await fs.writeFile(filePath, content, 'utf-8');

    this.fixtures.set(name, FixtureDataSchema.parse(data));
  }

  /**
   * Get fixture by name (from cache)
   */
  get(name: string): FixtureData | undefined {
    return this.fixtures.get(name);
  }

  /**
   * Set fixture in cache
   */
  set(name: string, data: FixtureData): void {
    this.fixtures.set(name, FixtureDataSchema.parse(data));
  }

  /**
   * Check if fixture exists
   */
  has(name: string): boolean {
    return this.fixtures.has(name);
  }

  /**
   * Remove fixture from cache
   */
  remove(name: string): void {
    this.fixtures.delete(name);
  }

  /**
   * Clear all fixtures from cache
   */
  clear(): void {
    this.fixtures.clear();
  }

  /**
   * Get all fixture names
   */
  getNames(): string[] {
    return Array.from(this.fixtures.keys());
  }

  /**
   * Get fixture file path
   */
  private getFixturePath(name: string): string {
    const ext = this.getFileExtension();
    return join(this.config.directory, `${name}${ext}`);
  }

  /**
   * Get fixture name from file name
   */
  private getFixtureName(filename: string): string {
    const ext = this.getFileExtension();
    return filename.replace(ext, '');
  }

  /**
   * Check if file is a fixture file
   */
  private isFixtureFile(filename: string): boolean {
    const ext = this.getFileExtension();
    return filename.endsWith(ext);
  }

  /**
   * Get file extension based on parser
   */
  private getFileExtension(): string {
    switch (this.config.parser) {
      case 'json':
        return '.json';
      case 'yaml':
        return '.yaml';
      case 'js':
        return '.js';
      default:
        return '.json';
    }
  }

  /**
   * Parse content based on parser
   */
  private parseContent(content: string, filePath: string): unknown {
    switch (this.config.parser) {
      case 'json':
        return JSON.parse(content);
      case 'yaml':
        // Simplified YAML parsing (in real implementation, use a YAML library)
        return JSON.parse(content);
      case 'js':
        // Simplified JS parsing (in real implementation, use eval or require)
        return JSON.parse(content);
      default:
        return JSON.parse(content);
    }
  }

  /**
   * Stringify content based on parser
   */
  private stringifyContent(data: unknown): string {
    switch (this.config.parser) {
      case 'json':
        return JSON.stringify(data, null, 2);
      case 'yaml':
        // Simplified YAML stringification (in real implementation, use a YAML library)
        return JSON.stringify(data, null, 2);
      case 'js':
        // Simplified JS stringification
        return `export default ${JSON.stringify(data, null, 2)};`;
      default:
        return JSON.stringify(data, null, 2);
    }
  }

  /**
   * Create a fixture template
   */
  createTemplate(name: string, template: FixtureData): void {
    this.set(name, template);
  }

  /**
   * Clone a fixture with modifications
   */
  clone(name: string, modifications: Partial<FixtureData>): FixtureData {
    const original = this.get(name);
    if (!original) {
      throw new Error(`Fixture not found: ${name}`);
    }

    const cloned = JSON.parse(JSON.stringify(original));
    return { ...cloned, ...modifications };
  }
}

export { FixtureConfig };
