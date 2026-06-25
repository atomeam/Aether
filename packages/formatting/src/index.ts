/**
 * @aether/formatting - Formatting
 */

export class Formatting {
  formatCurrency(amount: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
  }
  
  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-US').format(date);
  }
  
  formatNumber(num: number): string {
    return new Intl.NumberFormat('en-US').format(num);
  }
}

export const formatting = new Formatting();