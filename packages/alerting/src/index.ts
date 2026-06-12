/**
 * @aether/alerting - Alerting
 */

export class Alerting {
  alert(level: string, message: string): void {
    console.log(`[ALERT] ${level}: ${message}`);
  }
}

export const alerting = new Alerting();