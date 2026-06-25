/**
 * @aether/vector - Vector Operations
 */

export class Vector {
  constructor(public x: number, public y: number, public z: number = 0) {}
  
  add(v: Vector): Vector {
    return new Vector(this.x + v.x, this.y + v.y, this.z + v.z);
  }
  
  subtract(v: Vector): Vector {
    return new Vector(this.x - v.x, this.y - v.y, this.z - v.z);
  }
  
  multiply(scalar: number): Vector {
    return new Vector(this.x * scalar, this.y * scalar, this.z * scalar);
  }
  
  divide(scalar: number): Vector {
    return new Vector(this.x / scalar, this.y / scalar, this.z / scalar);
  }
  
  dot(v: Vector): number {
    return this.x * v.x + this.y * v.y + this.z * v.z;
  }
  
  cross(v: Vector): Vector {
    return new Vector(
      this.y * v.z - this.z * v.y,
      this.z * v.x - this.x * v.z,
      this.x * v.y - this.y * v.x
    );
  }
  
  magnitude(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
  }
  
  normalize(): Vector {
    const mag = this.magnitude();
    return mag === 0 ? new Vector(0, 0, 0) : this.divide(mag);
  }
  
  distanceTo(v: Vector): number {
    return this.subtract(v).magnitude();
  }
  
  angleTo(v: Vector): number {
    const dot = this.dot(v);
    const mag = this.magnitude() * v.magnitude();
    return Math.acos(dot / mag);
  }
  
  clone(): Vector {
    return new Vector(this.x, this.y, this.z);
  }
  
  static zero(): Vector {
    return new Vector(0, 0, 0);
  }
  
  static one(): Vector {
    return new Vector(1, 1, 1);
  }
  
  static fromArray(arr: number[]): Vector {
    return new Vector(arr[0] || 0, arr[1] || 0, arr[2] || 0);
  }
  
  toArray(): number[] {
    return [this.x, this.y, this.z];
  }
}

export function createVector(x: number, y: number, z?: number): Vector {
  return new Vector(x, y, z);
}