/**
 * @aether/complex-number - Complex Number Operations
 */

export class ComplexNumber {
  constructor(public real: number, public imag: number) {}
  
  add(other: ComplexNumber): ComplexNumber {
    return new ComplexNumber(this.real + other.real, this.imag + other.imag);
  }
  
  subtract(other: ComplexNumber): ComplexNumber {
    return new ComplexNumber(this.real - other.real, this.imag - other.imag);
  }
  
  multiply(other: ComplexNumber): ComplexNumber {
    const real = this.real * other.real - this.imag * other.imag;
    const imag = this.real * other.imag + this.imag * other.real;
    return new ComplexNumber(real, imag);
  }
  
  divide(other: ComplexNumber): ComplexNumber {
    const denom = other.real * other.real + other.imag * other.imag;
    const real = (this.real * other.real + this.imag * other.imag) / denom;
    const imag = (this.imag * other.real - this.real * other.imag) / denom;
    return new ComplexNumber(real, imag);
  }
  
  magnitude(): number {
    return Math.sqrt(this.real * this.real + this.imag * this.imag);
  }
  
  magnitudeSquared(): number {
    return this.real * this.real + this.imag * this.imag;
  }
  
  conjugate(): ComplexNumber {
    return new ComplexNumber(this.real, -this.imag);
  }
  
  phase(): number {
    return Math.atan2(this.imag, this.real);
  }
  
  power(n: number): ComplexNumber {
    if (n === 0) return new ComplexNumber(1, 0);
    if (n < 0) return new ComplexNumber(1, 0).divide(this.power(-n));
    
    let result = new ComplexNumber(1, 0);
    for (let i = 0; i < n; i++) {
      result = result.multiply(this);
    }
    return result;
  }
  
  sqrt(): ComplexNumber {
    const r = this.magnitude();
    const theta = this.phase();
    const sqrtR = Math.sqrt(r);
    const newReal = sqrtR * Math.cos(theta / 2);
    const newImag = sqrtR * Math.sin(theta / 2);
    return new ComplexNumber(newReal, newImag);
  }
  
  exp(): ComplexNumber {
    const expReal = Math.exp(this.real);
    return new ComplexNumber(expReal * Math.cos(this.imag), expReal * Math.sin(this.imag));
  }
  
  log(): ComplexNumber {
    return new ComplexNumber(Math.log(this.magnitude()), this.phase());
  }
  
  sin(): ComplexNumber {
    return new ComplexNumber(
      Math.sin(this.real) * Math.cosh(this.imag),
      Math.cos(this.real) * Math.sinh(this.imag)
    );
  }
  
  cos(): ComplexNumber {
    return new ComplexNumber(
      Math.cos(this.real) * Math.cosh(this.imag),
      -Math.sin(this.real) * Math.sinh(this.imag)
    );
  }
  
  tan(): ComplexNumber {
    return this.sin().divide(this.cos());
  }
  
  equals(other: ComplexNumber, tolerance: number = 0.0001): boolean {
    return Math.abs(this.real - other.real) < tolerance && 
           Math.abs(this.imag - other.imag) < tolerance;
  }
  
  toString(): string {
    if (this.imag === 0) return this.real.toString();
    if (this.real === 0) return `${this.imag}i`;
    const sign = this.imag >= 0 ? '+' : '';
    return `${this.real}${sign}${this.imag}i`;
  }
  
  toArray(): [number, number] {
    return [this.real, this.imag];
  }
  
  static fromPolar(r: number, theta: number): ComplexNumber {
    return new ComplexNumber(r * Math.cos(theta), r * Math.sin(theta));
  }
  
  static fromArray(arr: [number, number]): ComplexNumber {
    return new ComplexNumber(arr[0], arr[1]);
  }
}

export function createComplexNumber(real: number, imag: number): ComplexNumber {
  return new ComplexNumber(real, imag);
}

export function fromPolar(r: number, theta: number): ComplexNumber {
  return ComplexNumber.fromPolar(r, theta);
}