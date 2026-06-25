/**
 * @aether/collection-utils - Collection Utilities
 */

export class CollectionUtils {
  setUnion<T>(...sets: Set<T>[]): Set<T> {
    const result = new Set<T>();
    sets.forEach(set => set.forEach(item => result.add(item)));
    return result;
  }
  
  setIntersection<T>(...sets: Set<T>[]): Set<T> {
    if (sets.length === 0) return new Set();
    const [first, ...rest] = sets;
    const result = new Set(first);
    rest.forEach(set => {
      for (const item of result) {
        if (!set.has(item)) result.delete(item);
      }
    });
    return result;
  }
  
  setDifference<T>(a: Set<T>, b: Set<T>): Set<T> {
    const result = new Set(a);
    b.forEach(item => result.delete(item));
    return result;
  }
  
  setSymmetricDifference<T>(a: Set<T>, b: Set<T>): Set<T> {
    const union = this.setUnion(a, b);
    const intersection = this.setIntersection(a, b);
    return this.setDifference(union, intersection);
  }
  
  setIsSubset<T>(a: Set<T>, b: Set<T>): boolean {
    for (const item of a) {
      if (!b.has(item)) return false;
    }
    return true;
  }
  
  setIsSuperset<T>(a: Set<T>, b: Set<T>): boolean {
    return this.setIsSubset(b, a);
  }
  
  mapKeys<K, V, NK>(map: Map<K, V>, fn: (key: K) => NK): Map<NK, V> {
    const result = new Map<NK, V>();
    map.forEach((value, key) => result.set(fn(key), value));
    return result;
  }
  
  mapValues<K, V, NV>(map: Map<K, V>, fn: (value: V) => NV): Map<K, NV> {
    const result = new Map<K, NV>();
    map.forEach((value, key) => result.set(key, fn(value)));
    return result;
  }
  
  mapInvert<K, V>(map: Map<K, V>): Map<V, K> {
    const result = new Map<V, K>();
    map.forEach((value, key) => result.set(value, key));
    return result;
  }
  
  mapFilter<K, V>(map: Map<K, V>, predicate: (value: V, key: K) => boolean): Map<K, V> {
    const result = new Map<K, V>();
    map.forEach((value, key) => {
      if (predicate(value, key)) result.set(key, value);
    });
    return result;
  }
}

export const collectionUtils = new CollectionUtils();