import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface MemoryEntry {
  id: string;
  type: 'fact' | 'preference' | 'state' | 'task_result';
  content: any;
  tags: string[];
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface MemoryState {
  longTerm: MemoryEntry[];
  shortTerm: MemoryEntry[];
  knowledge: Record<string, any>;
}

/**
 * MemorySpine - Central knowledge and state management for ALPHA
 * Provides persistence for crew learning and project context.
 */
export class MemorySpine {
  private memoryPath: string;
  private state: MemoryState;

  constructor(projectRoot: string = path.join(__dirname, '../..')) {
    this.memoryPath = path.join(projectRoot, '.memory.json');
    this.state = this.loadMemory();
  }

  /**
   * Load memory from disk
   */
  private loadMemory(): MemoryState {
    try {
      if (fs.existsSync(this.memoryPath)) {
        const data = fs.readFileSync(this.memoryPath, 'utf-8');
        const parsed = JSON.parse(data);
        // Revive dates
        parsed.longTerm.forEach((m: any) => m.timestamp = new Date(m.timestamp));
        parsed.shortTerm.forEach((m: any) => m.timestamp = new Date(m.timestamp));
        return parsed;
      }
    } catch (error) {
      console.error('Failed to load memory:', error);
    }

    return {
      longTerm: [],
      shortTerm: [],
      knowledge: {}
    };
  }

  /**
   * Save memory to disk
   */
  private saveMemory(): void {
    try {
      fs.writeFileSync(this.memoryPath, JSON.stringify(this.state, null, 2), 'utf-8');
    } catch (error) {
      console.error('Failed to save memory:', error);
    }
  }

  /**
   * Store a new memory entry
   */
  async remember(entry: Omit<MemoryEntry, 'id' | 'timestamp'>, persistent: boolean = true): Promise<string> {
    const fullEntry: MemoryEntry = {
      ...entry,
      id: `mem-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    };

    if (persistent) {
      this.state.longTerm.push(fullEntry);
      this.saveMemory();
    } else {
      this.state.shortTerm.push(fullEntry);
    }

    return fullEntry.id;
  }

  /**
   * Retrieve memories based on criteria
   */
  async recall(criteria: { tags?: string[]; type?: string; limit?: number }): Promise<MemoryEntry[]> {
    let results = [...this.state.longTerm, ...this.state.shortTerm];

    if (criteria.tags && criteria.tags.length > 0) {
      results = results.filter(m => 
        criteria.tags!.some(tag => m.tags.includes(tag))
      );
    }

    if (criteria.type) {
      results = results.filter(m => m.type === criteria.type);
    }

    // Sort by timestamp descending
    results.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    if (criteria.limit) {
      results = results.slice(0, criteria.limit);
    }

    return results;
  }

  /**
   * Store or update a piece of general knowledge
   */
  setKnowledge(key: string, value: any): void {
    this.state.knowledge[key] = value;
    this.saveMemory();
  }

  /**
   * Retrieve a piece of general knowledge
   */
  getKnowledge(key: string): any {
    return this.state.knowledge[key];
  }

  /**
   * Clear short-term memory
   */
  clearShortTerm(): void {
    this.state.shortTerm = [];
  }

  /**
   * Get full state (for backup or analysis)
   */
  getState(): MemoryState {
    return { ...this.state };
  }
}

export const memorySpine = new MemorySpine();
export default MemorySpine;