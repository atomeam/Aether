/**
 * @aether/date-utils - Date Utilities
 */

export class DateUtils {
  format(date: Date, format: string = 'YYYY-MM-DD'): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return format
      .replace('YYYY', String(year))
      .replace('MM', month)
      .replace('DD', day)
      .replace('HH', hours)
      .replace('mm', minutes)
      .replace('ss', seconds);
  }
  
  addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }
  
  addHours(date: Date, hours: number): Date {
    const result = new Date(date);
    result.setHours(result.getHours() + hours);
    return result;
  }
  
  addMinutes(date: Date, minutes: number): Date {
    const result = new Date(date);
    result.setMinutes(result.getMinutes() + minutes);
    return result;
  }
  
  diffDays(date1: Date, date2: Date): number {
    const oneDay = 24 * 60 * 60 * 1000;
    return Math.round((date2.getTime() - date1.getTime()) / oneDay);
  }
  
  diffHours(date1: Date, date2: Date): number {
    const oneHour = 60 * 60 * 1000;
    return Math.round((date2.getTime() - date1.getTime()) / oneHour);
  }
  
  isToday(date: Date): boolean {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }
  
  isTomorrow(date: Date): boolean {
    const tomorrow = this.addDays(new Date(), 1);
    return date.toDateString() === tomorrow.toDateString();
  }
  
  isYesterday(date: Date): boolean {
    const yesterday = this.addDays(new Date(), -1);
    return date.toDateString() === yesterday.toDateString();
  }
  
  startOfDay(date: Date): Date {
    const result = new Date(date);
    result.setHours(0, 0, 0, 0);
    return result;
  }
  
  endOfDay(date: Date): Date {
    const result = new Date(date);
    result.setHours(23, 59, 59, 999);
    return result;
  }
  
  startOfWeek(date: Date): Date {
    const result = new Date(date);
    const day = result.getDay();
    const diff = result.getDate() - day + (day === 0 ? -6 : 1);
    result.setDate(diff);
    result.setHours(0, 0, 0, 0);
    return result;
  }
  
  endOfWeek(date: Date): Date {
    const result = this.startOfWeek(date);
    result.setDate(result.getDate() + 6);
    result.setHours(23, 59, 59, 999);
    return result;
  }
  
  startOfMonth(date: Date): Date {
    const result = new Date(date);
    result.setDate(1);
    result.setHours(0, 0, 0, 0);
    return result;
  }
  
  endOfMonth(date: Date): Date {
    const result = new Date(date);
    result.setMonth(result.getMonth() + 1, 0);
    result.setHours(23, 59, 59, 999);
    return result;
  }
}

export const dateUtils = new DateUtils();