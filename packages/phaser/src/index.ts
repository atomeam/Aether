/**
 * @aether/phaser - Phaser
 */

export class Phaser {
  private phase = 0;
  private parties: number;
  private callbacks: Array<(phase: number) => void> = [];
  
  constructor(parties: number) {
    this.parties = parties;
  }
  
  async arrive(): Promise<number> {
    this.phase++;
    if (this.phase >= this.parties) {
      this.phase = 0;
      this.callbacks.forEach(cb => cb(this.phase));
      this.callbacks = [];
      return this.phase;
    }
    
    return new Promise(resolve => {
      this.callbacks.push(resolve);
    });
  }
}

export const phaser = new Phaser(3);