/**
 * @aether/timeout - Timeout
 */

export class Timeout {
  async execute<T>(fn: () => Promise<T>, timeoutMs: number): Promise<T> {
    return Promise.race([
      fn(),
      new Promise<T>((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), timeoutMs)
      )
    ]);
  }
}

export const timeout = new Timeout();