/**
 * @aether/binary-tree - Binary Tree
 */

export class TreeNode<T> {
  constructor(
    public value: T,
    public left: TreeNode<T> | null = null,
    public right: TreeNode<T> | null = null
  ) {}
}

export class BinaryTree<T> {
  private root: TreeNode<T> | null = null;
  
  insert(value: T): void {
    const newNode = new TreeNode(value);
    if (!this.root) {
      this.root = newNode;
      return;
    }
    this.insertNode(this.root, newNode);
  }
  
  private insertNode(node: TreeNode<T>, newNode: TreeNode<T>): void {
    if (newNode.value < node.value) {
      if (!node.left) {
        node.left = newNode;
      } else {
        this.insertNode(node.left, newNode);
      }
    } else {
      if (!node.right) {
        node.right = newNode;
      } else {
        this.insertNode(node.right, newNode);
      }
    }
  }
  
  search(value: T): T | undefined {
    return this.searchNode(this.root, value);
  }
  
  private searchNode(node: TreeNode<T> | null, value: T): T | undefined {
    if (!node) return undefined;
    if (value === node.value) return node.value;
    if (value < node.value) return this.searchNode(node.left, value);
    return this.searchNode(node.right, value);
  }
  
  inorderTraversal(): T[] {
    const result: T[] = [];
    this.inorder(this.root, result);
    return result;
  }
  
  private inorder(node: TreeNode<T> | null, result: T[]): void {
    if (node) {
      this.inorder(node.left, result);
      result.push(node.value);
      this.inorder(node.right, result);
    }
  }
  
  preorderTraversal(): T[] {
    const result: T[] = [];
    this.preorder(this.root, result);
    return result;
  }
  
  private preorder(node: TreeNode<T> | null, result: T[]): void {
    if (node) {
      result.push(node.value);
      this.preorder(node.left, result);
      this.preorder(node.right, result);
    }
  }
  
  postorderTraversal(): T[] {
    const result: T[] = [];
    this.postorder(this.root, result);
    return result;
  }
  
  private postorder(node: TreeNode<T> | null, result: T[]): void {
    if (node) {
      this.postorder(node.left, result);
      this.postorder(node.right, result);
      result.push(node.value);
    }
  }
}

export function createBinaryTree<T>(): BinaryTree<T> {
  return new BinaryTree<T>();
}