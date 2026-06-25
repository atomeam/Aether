/**
 * @aether/fraction - Fraction Arithmetic
 */

export class Fraction {
  constructor(public numerator: number, public denominator: number) {
    if (denominator === 0) {
      throw new Error('Denominator cannot be zero');
    }
    this.normalize();
  }
  
  private normalize(): void {
    if (this.denominator < 0) {
      this.numerator = -this.numerator;
      this.denominator = -this.denominator;
    }
    
    const gcd = this.gcd(Math.abs(this.numerator), Math.abs(this.denominator));
    this.numerator /= gcd;
    this.denominator /= gcd;
  }
  
  private gcd(a: number, b: number): number {
    return b === 0 ? a : this.gcd(b, a % b);
  }
  
  add(other: Fraction): Fraction {
    const num = this.numerator * other.denominator + other.numerator * this.denominator;
    const den = this.denominator * other.denominator;
    return new Fraction(num, den);
  }
  
  subtract(other: Fraction): Fraction {
    const num = this.numerator * other.denominator - other.numerator * this.denominator;
    const den = this.denominator * other.denominator;
    return new Fraction(num, den);
  }
  
  multiply(other: Fraction): Fraction {
    return new Fraction(this.numerator * other.numerator, this.denominator * other.denominator);
  }
  
  divide(other: Fraction): Fraction {
    return new Fraction(this.numerator * other.denominator, this.denominator * other.numerator);
  }
  
  negate(): Fraction {
    return new Fraction(-this.numerator, this.denominator);
  }
  
  reciprocal(): Fraction {
    return new Fraction(this.denominator, this.numerator);
  }
  
  power(n: number): Fraction {
    if (n === 0) return new Fraction(1, 1);
    if (n < 0) return this.reciprocal().power(-n);
    
    let result = new Fraction(1, 1);
    for (let i = 0; i < n; i++) {
      result = result.multiply(this);
    }
    return result;
  }
  
  absoluteValue(): Fraction {
    return new Fraction(Math.abs(this.numerator), this.denominator);
  }
  
  toDecimal(): number {
    return this.numerator / this.denominator;
  }
  
  toPercentage(): number {
    return (this.numerator / this.denominator) * 100;
  }
  
  equals(other: Fraction): boolean {
    return this.numerator === other.numerator && this.denominator === other.denominator;
  }
  
  compare(other: Fraction): number {
    const thisValue = this.toDecimal();
    const otherValue = other.toDecimal();
    return thisValue - otherValue;
  }
  
  isLessThan(other: Fraction): boolean {
    return this.compare(other) < 0;
  }
  
  isGreaterThan(other: Fraction): boolean {
    return this.compare(other) > 0;
  }
  
  isInteger(): boolean {
    return this.denominator === 1;
  }
  
  isProper(): boolean {
    return Math.abs(this.numerator) < this.denominator;
  }
  
  toMixedNumber(): { whole: number; fraction: Fraction } {
    const whole = Math.floor(this.numerator / this.denominator);
    const remainder = this.numerator % this.denominator;
    return {
      whole,
      fraction: new Fraction(remainder, this.denominator)
    };
  }
  
  toString(): string {
    if (this.denominator === 1) return this.numerator.toString();
    return `${this.numerator}/${this.denominator}`;
  }
  
  static fromDecimal(decimal: number, precision: number = 10): Fraction {
    const denominator = Math.pow(10, precision);
    const numerator = Math.round(decimal * denominator);
    return new Fraction(numerator, denominator);
  }
  
  static fromMixedNumber(whole: number, numerator: number, denominator: number): Fraction {
    const newNumerator = whole * denominator + numerator;
    return new Fraction(newNumerator, denominator);
  }
}

export function createFraction(numerator: number, denominator: number): Fraction {
  return new Fraction(numerator, denominator);
}

export function fromDecimal(decimal: number, precision?: number): Fraction {
  return Fraction.fromDecimal(decimal, precision);
}