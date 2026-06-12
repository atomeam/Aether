/**
 * @aether/decimal - Decimal Arithmetic
 */

export class Decimal {
  private value: number;
  private precision: number;
  
  constructor(value: number | string, precision: number = 10) {
    this.precision = precision;
    this.value = typeof value === 'string' ? parseFloat(value) : value;
  }
  
  add(other: Decimal): Decimal {
    const result = this.value + other.value;
    return new Decimal(result.toFixed(this.precision));
  }
  
  subtract(other: Decimal): Decimal {
    const result = this.value - other.value;
    return new Decimal(result.toFixed(this.precision));
  }
  
  multiply(other: Decimal): Decimal {
    const result = this.value * other.value;
    return new Decimal(result.toFixed(this.precision));
  }
  
  divide(other: Decimal): Decimal {
    if (other.value === 0) {
      throw new Error('Division by zero');
    }
    const result = this.value / other.value;
    return new Decimal(result.toFixed(this.precision));
  }
  
  power(exponent: number): Decimal {
    const result = Math.pow(this.value, exponent);
    return new Decimal(result.toFixed(this.precision));
  }
  
  sqrt(): Decimal {
    if (this.value < 0) {
      throw new Error('Cannot calculate square root of negative number');
    }
    const result = Math.sqrt(this.value);
    return new Decimal(result.toFixed(this.precision));
  }
  
  abs(): Decimal {
    return new Decimal(Math.abs(this.value).toFixed(this.precision));
  }
  
  round(decimals?: number): Decimal {
    const precision = decimals ?? this.precision;
    const result = Math.round(this.value * Math.pow(10, precision)) / Math.pow(10, precision);
    return new Decimal(result.toFixed(precision));
  }
  
  floor(): Decimal {
    return new Decimal(Math.floor(this.value).toFixed(this.precision));
  }
  
  ceil(): Decimal {
    return new Decimal(Math.ceil(this.value).toFixed(this.precision));
  }
  
  modulo(other: Decimal): Decimal {
    const result = this.value % other.value;
    return new Decimal(result.toFixed(this.precision));
  }
  
  compareTo(other: Decimal): number {
    if (this.value < other.value) return -1;
    if (this.value > other.value) return 1;
    return 0;
  }
  
  equals(other: Decimal): boolean {
    return this.compareTo(other) === 0;
  }
  
  isGreaterThan(other: Decimal): boolean {
    return this.compareTo(other) > 0;
  }
  
  isLessThan(other: Decimal): boolean {
    return this.compareTo(other) < 0;
  }
  
  isZero(): boolean {
    return this.value === 0;
  }
  
  isNegative(): boolean {
    return this.value < 0;
  }
  
  isPositive(): boolean {
    return this.value > 0;
  }
  
  toNumber(): number {
    return this.value;
  }
  
  toString(): string {
    return this.value.toFixed(this.precision);
  }
  
  toFixed(decimals: number): string {
    return this.value.toFixed(decimals);
  }
  
  toPercentage(): string {
    return (this.value * 100).toFixed(this.precision) + '%';
  }
  
  static fromString(value: string, precision: number = 10): Decimal {
    return new Decimal(value, precision);
  }
  
  static fromNumber(value: number, precision: number = 10): Decimal {
    return new Decimal(value, precision);
  }
}

export function createDecimal(value: number | string, precision?: number): Decimal {
  return new Decimal(value, precision);
}