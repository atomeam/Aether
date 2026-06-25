/**
 * @aether/sorting-algorithms - Sorting Algorithms
 */

export class SortingAlgorithms {
  quickSort<T>(arr: T[], compare: (a: T, b: T) => number): T[] {
    if (arr.length <= 1) return [...arr];
    
    const pivot = arr[Math.floor(arr.length / 2)];
    const left: T[] = [];
    const right: T[] = [];
    
    for (let i = 0; i < arr.length; i++) {
      if (i === Math.floor(arr.length / 2)) continue;
      if (compare(arr[i], pivot) < 0) {
        left.push(arr[i]);
      } else {
        right.push(arr[i]);
      }
    }
    
    return [...this.quickSort(left, compare), pivot, ...this.quickSort(right, compare)];
  }
  
  mergeSort<T>(arr: T[], compare: (a: T, b: T) => number): T[] {
    if (arr.length <= 1) return [...arr];
    
    const mid = Math.floor(arr.length / 2);
    const left = this.mergeSort(arr.slice(0, mid), compare);
    const right = this.mergeSort(arr.slice(mid), compare);
    
    return this.merge(left, right, compare);
  }
  
  private merge<T>(left: T[], right: T[], compare: (a: T, b: T) => number): T[] {
    const result: T[] = [];
    let i = 0, j = 0;
    
    while (i < left.length && j < right.length) {
      if (compare(left[i], right[j]) <= 0) {
        result.push(left[i++]);
      } else {
        result.push(right[j++]);
      }
    }
    
    return [...result, ...left.slice(i), ...right.slice(j)];
  }
  
  heapSort<T>(arr: T[], compare: (a: T, b: T) => number): T[] {
    const result = [...arr];
    const n = result.length;
    
    // Build max heap
    for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
      this.heapify(result, n, i, compare);
    }
    
    // Extract elements from heap
    for (let i = n - 1; i > 0; i--) {
      [result[0], result[i]] = [result[i], result[0]];
      this.heapify(result, i, 0, compare);
    }
    
    return result;
  }
  
  private heapify<T>(arr: T[], n: number, i: number, compare: (a: T, b: T) => number): void {
    let largest = i;
    const left = 2 * i + 1;
    const right = 2 * i + 2;
    
    if (left < n && compare(arr[left], arr[largest]) > 0) {
      largest = left;
    }
    
    if (right < n && compare(arr[right], arr[largest]) > 0) {
      largest = right;
    }
    
    if (largest !== i) {
      [arr[i], arr[largest]] = [arr[largest], arr[i]];
      this.heapify(arr, n, largest, compare);
    }
  }
  
  insertionSort<T>(arr: T[], compare: (a: T, b: T) => number): T[] {
    const result = [...arr];
    
    for (let i = 1; i < result.length; i++) {
      const key = result[i];
      let j = i - 1;
      
      while (j >= 0 && compare(result[j], key) > 0) {
        result[j + 1] = result[j];
        j--;
      }
      
      result[j + 1] = key;
    }
    
    return result;
  }
  
  selectionSort<T>(arr: T[], compare: (a: T, b: T) => number): T[] {
    const result = [...arr];
    
    for (let i = 0; i < result.length - 1; i++) {
      let minIdx = i;
      
      for (let j = i + 1; j < result.length; j++) {
        if (compare(result[j], result[minIdx]) < 0) {
          minIdx = j;
        }
      }
      
      [result[i], result[minIdx]] = [result[minIdx], result[i]];
    }
    
    return result;
  }
  
  bubbleSort<T>(arr: T[], compare: (a: T, b: T) => number): T[] {
    const result = [...arr];
    
    for (let i = 0; i < result.length - 1; i++) {
      for (let j = 0; j < result.length - i - 1; j++) {
        if (compare(result[j], result[j + 1]) > 0) {
          [result[j], result[j + 1]] = [result[j + 1], result[j]];
        }
      }
    }
    
    return result;
  }
  
  countingSort(arr: number[]): number[] {
    if (arr.length === 0) return [];
    
    const max = Math.max(...arr);
    const min = Math.min(...arr);
    const count = new Array(max - min + 1).fill(0);
    
    for (const num of arr) {
      count[num - min]++;
    }
    
    const result: number[] = [];
    for (let i = 0; i < count.length; i++) {
      for (let j = 0; j < count[i]; j++) {
        result.push(i + min);
      }
    }
    
    return result;
  }
  
  radixSort(arr: number[]): number[] {
    if (arr.length === 0) return [];
    
    const max = Math.max(...arr);
    const maxDigits = Math.floor(Math.log10(max)) + 1;
    
    let result = [...arr];
    
    for (let d = 0; d < maxDigits; d++) {
      const buckets: number[][] = Array.from({ length: 10 }, () => []);
      
      for (const num of result) {
        const digit = Math.floor(num / Math.pow(10, d)) % 10;
        buckets[digit].push(num);
      }
      
      result = buckets.flat();
    }
    
    return result;
  }
  
  bucketSort(arr: number[], bucketSize: number = 5): number[] {
    if (arr.length === 0) return [];
    
    const max = Math.max(...arr);
    const min = Math.min(...arr);
    const bucketCount = Math.floor((max - min) / bucketSize) + 1;
    const buckets: number[][] = Array.from({ length: bucketCount }, () => []);
    
    for (const num of arr) {
      const idx = Math.floor((num - min) / bucketSize);
      buckets[idx].push(num);
    }
    
    for (const bucket of buckets) {
      this.insertionSort(bucket, (a, b) => a - b);
    }
    
    return buckets.flat();
  }
  
  shellSort<T>(arr: T[], compare: (a: T, b: T) => number): T[] {
    const result = [...arr];
    const gaps = [701, 301, 132, 57, 23, 10, 4, 1];
    
    for (const gap of gaps) {
      for (let i = gap; i < result.length; i++) {
        const temp = result[i];
        let j;
        
        for (j = i; j >= gap && compare(result[j - gap], temp) > 0; j -= gap) {
          result[j] = result[j - gap];
        }
        
        result[j] = temp;
      }
    }
    
    return result;
  }
}

export const sortingAlgorithms = new SortingAlgorithms();