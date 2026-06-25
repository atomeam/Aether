/**
 * @aether/linked-list - Singly Linked List
 */

export class Node<T> {
  constructor(public value: T, public next: Node<T> | null = null) {}
}

export class LinkedList<T> {
  private head: Node<T> | null = null;
  private tail: Node<T> | null = null;
  private length: number = 0;
  
  append(value: T): void {
    const newNode = new Node(value);
    if (!this.head) {
      this.head = newNode;
      this.tail = newNode;
    } else {
      this.tail!.next = newNode;
      this.tail = newNode;
    }
    this.length++;
  }
  
  prepend(value: T): void {
    const newNode = new Node(value, this.head);
    this.head = newNode;
    if (!this.tail) {
      this.tail = newNode;
    }
    this.length++;
  }
  
  remove(value: T): boolean {
    if (!this.head) return false;
    
    if (this.head.value === value) {
      this.head = this.head.next;
      if (!this.head) this.tail = null;
      this.length--;
      return true;
    }
    
    let current = this.head;
    while (current.next) {
      if (current.next.value === value) {
        current.next = current.next.next;
        if (!current.next) this.tail = current;
        this.length--;
        return true;
      }
      current = current.next;
    }
    return false;
  }
  
  find(value: T): T | undefined {
    let current = this.head;
    while (current) {
      if (current.value === value) return current.value;
      current = current.next;
    }
    return undefined;
  }
  
  toArray(): T[] {
    const result: T[] = [];
    let current = this.head;
    while (current) {
      result.push(current.value);
      current = current.next;
    }
    return result;
  }
  
  size(): number {
    return this.length;
  }
  
  isEmpty(): boolean {
    return this.length === 0;
  }
  
  clear(): void {
    this.head = null;
    this.tail = null;
    this.length = 0;
  }
}

export function createLinkedList<T>(): LinkedList<T> {
  return new LinkedList<T>();
}