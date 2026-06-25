/**
 * @aether/matrix - Matrix Operations
 */

export class Matrix {
  constructor(public data: number[][], public rows: number, public cols: number) {
    if (data.length !== rows || data[0].length !== cols) {
      throw new Error('Invalid matrix dimensions');
    }
  }
  
  static identity(size: number): Matrix {
    const data: number[][] = [];
    for (let i = 0; i < size; i++) {
      data[i] = [];
      for (let j = 0; j < size; j++) {
        data[i][j] = i === j ? 1 : 0;
      }
    }
    return new Matrix(data, size, size);
  }
  
  static zero(rows: number, cols: number): Matrix {
    const data: number[][] = [];
    for (let i = 0; i < rows; i++) {
      data[i] = new Array(cols).fill(0);
    }
    return new Matrix(data, rows, cols);
  }
  
  add(m: Matrix): Matrix {
    if (this.rows !== m.rows || this.cols !== m.cols) {
      throw new Error('Matrix dimensions must match');
    }
    
    const result: number[][] = [];
    for (let i = 0; i < this.rows; i++) {
      result[i] = [];
      for (let j = 0; j < this.cols; j++) {
        result[i][j] = this.data[i][j] + m.data[i][j];
      }
    }
    
    return new Matrix(result, this.rows, this.cols);
  }
  
  subtract(m: Matrix): Matrix {
    if (this.rows !== m.rows || this.cols !== m.cols) {
      throw new Error('Matrix dimensions must match');
    }
    
    const result: number[][] = [];
    for (let i = 0; i < this.rows; i++) {
      result[i] = [];
      for (let j = 0; j < this.cols; j++) {
        result[i][j] = this.data[i][j] - m.data[i][j];
      }
    }
    
    return new Matrix(result, this.rows, this.cols);
  }
  
  multiply(m: Matrix): Matrix {
    if (this.cols !== m.rows) {
      throw new Error('Matrix dimensions incompatible for multiplication');
    }
    
    const result: number[][] = [];
    for (let i = 0; i < this.rows; i++) {
      result[i] = [];
      for (let j = 0; j < m.cols; j++) {
        let sum = 0;
        for (let k = 0; k < this.cols; k++) {
          sum += this.data[i][k] * m.data[k][j];
        }
        result[i][j] = sum;
      }
    }
    
    return new Matrix(result, this.rows, m.cols);
  }
  
  multiplyScalar(scalar: number): Matrix {
    const result: number[][] = [];
    for (let i = 0; i < this.rows; i++) {
      result[i] = [];
      for (let j = 0; j < this.cols; j++) {
        result[i][j] = this.data[i][j] * scalar;
      }
    }
    
    return new Matrix(result, this.rows, this.cols);
  }
  
  transpose(): Matrix {
    const result: number[][] = [];
    for (let i = 0; i < this.cols; i++) {
      result[i] = [];
      for (let j = 0; j < this.rows; j++) {
        result[i][j] = this.data[j][i];
      }
    }
    
    return new Matrix(result, this.cols, this.rows);
  }
  
  determinant(): number {
    if (this.rows !== this.cols) {
      throw new Error('Matrix must be square');
    }
    
    if (this.rows === 1) return this.data[0][0];
    if (this.rows === 2) {
      return this.data[0][0] * this.data[1][1] - this.data[0][1] * this.data[1][0];
    }
    
    // Recursive expansion for larger matrices
    let det = 0;
    for (let i = 0; i < this.cols; i++) {
      const sign = Math.pow(-1, i);
      const minor = this.minor(0, i);
      det += sign * this.data[0][i] * minor.determinant();
    }
    
    return det;
  }
  
  minor(row: number, col: number): Matrix {
    const result: number[][] = [];
    for (let i = 0; i < this.rows; i++) {
      if (i === row) continue;
      result[result.length] = [];
      for (let j = 0; j < this.cols; j++) {
        if (j === col) continue;
        result[result.length - 1].push(this.data[i][j]);
      }
    }
    
    return new Matrix(result, this.rows - 1, this.cols - 1);
  }
  
  inverse(): Matrix {
    const det = this.determinant();
    if (det === 0) {
      throw new Error('Matrix is not invertible');
    }
    
    if (this.rows === 1) {
      return new Matrix([[1 / this.data[0][0]]], 1, 1);
    }
    
    const cofactors: number[][] = [];
    for (let i = 0; i < this.rows; i++) {
      cofactors[i] = [];
      for (let j = 0; j < this.cols; j++) {
        const sign = Math.pow(-1, i + j);
        cofactors[i][j] = sign * this.minor(i, j).determinant();
      }
    }
    
    const adjugate = new Matrix(cofactors, this.rows, this.cols).transpose();
    return adjugate.multiplyScalar(1 / det);
  }
  
  clone(): Matrix {
    const result: number[][] = [];
    for (let i = 0; i < this.rows; i++) {
      result[i] = [...this.data[i]];
    }
    return new Matrix(result, this.rows, this.cols);
  }
}

export function createMatrix(data: number[][]): Matrix {
  const rows = data.length;
  const cols = data[0].length;
  return new Matrix(data, rows, cols);
}

export function createIdentityMatrix(size: number): Matrix {
  return Matrix.identity(size);
}

export function createZeroMatrix(rows: number, cols: number): Matrix {
  return Matrix.zero(rows, cols);
}