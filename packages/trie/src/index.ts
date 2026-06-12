/**
 * @aether/trie - Trie Data Structure
 */

export class TrieNode {
  children: Map<string, TrieNode> = new Map();
  isEndOfWord: boolean = false;
}

export class Trie {
  private root: TrieNode = new TrieNode();
  
  insert(word: string): void {
    let node = this.root;
    for (const char of word) {
      if (!node.children.has(char)) {
        node.children.set(char, new TrieNode());
      }
      node = node.children.get(char)!;
    }
    node.isEndOfWord = true;
  }
  
  search(word: string): boolean {
    let node = this.root;
    for (const char of word) {
      if (!node.children.has(char)) return false;
      node = node.children.get(char)!;
    }
    return node.isEndOfWord;
  }
  
  startsWith(prefix: string): boolean {
    let node = this.root;
    for (const char of prefix) {
      if (!node.children.has(char)) return false;
      node = node.children.get(char)!;
    }
    return true;
  }
  
  getAllWordsWithPrefix(prefix: string): string[] {
    const words: string[] = [];
    let node = this.root;
    
    for (const char of prefix) {
      if (!node.children.has(char)) return words;
      node = node.children.get(char)!;
    }
    
    this.collectWords(node, prefix, words);
    return words;
  }
  
  private collectWords(node: TrieNode, prefix: string, words: string[]): void {
    if (node.isEndOfWord) {
      words.push(prefix);
    }
    for (const [char, child] of node.children) {
      this.collectWords(child, prefix + char, words);
    }
  }
}

export function createTrie(): Trie {
  return new Trie();
}