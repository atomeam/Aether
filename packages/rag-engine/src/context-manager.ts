import { ContextWindow, ContextManager, ContextWindowSchema } from './types';

export class SimpleContextManager implements ContextManager {
  private window: ContextWindow;
  private contexts: Map<string, { text: string; length: number }> = new Map();

  constructor(maxLength: number, reservedForSystem: number = 0, reservedForQuery: number = 0) {
    this.window = {
      maxLength,
      currentLength: 0,
      reservedForSystem,
      reservedForQuery
    };

    ContextWindowSchema.parse(this.window);
  }

  addContext(text: string): boolean {
    const length = this.estimateTokens(text);
    const availableSpace = this.getRemainingSpace();

    if (length > availableSpace) {
      return false;
    }

    const id = this.generateId();
    this.contexts.set(id, { text, length });
    this.window.currentLength += length;
    return true;
  }

  removeContext(id: string): void {
    const context = this.contexts.get(id);
    if (context) {
      this.window.currentLength -= context.length;
      this.contexts.delete(id);
    }
  }

  getContext(): string {
    const texts = Array.from(this.contexts.values()).map((c) => c.text);
    return texts.join('\n\n');
  }

  getRemainingSpace(): number {
    const reserved = this.window.reservedForSystem + this.window.reservedForQuery;
    return this.window.maxLength - this.window.currentLength - reserved;
  }

  reset(): void {
    this.contexts.clear();
    this.window.currentLength = 0;
  }

  getCurrentLength(): number {
    return this.window.currentLength;
  }

  getMaxLength(): number {
    return this.window.maxLength;
  }

  setReservedForSystem(length: number): void {
    this.window.reservedForSystem = length;
  }

  setReservedForQuery(length: number): void {
    this.window.reservedForQuery = length;
  }

  getContextCount(): number {
    return this.contexts.size;
  }

  private estimateTokens(text: string): number {
    // Rough estimate: ~4 characters per token
    return Math.ceil(text.length / 4);
  }

  private generateId(): string {
    return `ctx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
