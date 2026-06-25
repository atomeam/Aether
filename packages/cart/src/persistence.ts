import { Cart, PersistenceOptions, PersistenceOptionsSchema } from './types.js';
import { CartManager } from './cart-manager.js';

export class CartPersistence {
  private options: PersistenceOptions;

  constructor(options: Partial<PersistenceOptions> = {}) {
    this.options = PersistenceOptionsSchema.parse(options);
  }

  async save(cart: Cart): Promise<void> {
    const data = JSON.stringify(cart);
    
    if (typeof window !== 'undefined' && window.localStorage) {
      // Browser environment - use localStorage
      try {
        if (this.options.compress) {
          // Simple compression - could use a real compression library
          const compressed = this.simpleCompress(data);
          window.localStorage.setItem(this.options.storageKey, compressed);
        } else {
          window.localStorage.setItem(this.options.storageKey, data);
        }
      } catch (error) {
        console.error('Failed to save cart to localStorage:', error);
        throw new Error('Failed to save cart to storage');
      }
    } else {
      // Node.js environment - use file system (simplified)
      const fs = await import('fs/promises');
      const path = await import('path');
      
      const filePath = path.join(process.cwd(), '.cache', `${this.options.storageKey}.json`);
      const dir = path.dirname(filePath);
      
      try {
        await fs.mkdir(dir, { recursive: true });
        await fs.writeFile(filePath, data, 'utf-8');
      } catch (error) {
        console.error('Failed to save cart to file system:', error);
        throw new Error('Failed to save cart to storage');
      }
    }
  }

  async load(): Promise<Cart | null> {
    try {
      let data: string | null = null;

      if (typeof window !== 'undefined' && window.localStorage) {
        // Browser environment
        const stored = window.localStorage.getItem(this.options.storageKey);
        if (stored) {
          data = this.options.compress ? this.simpleDecompress(stored) : stored;
        }
      } else {
        // Node.js environment
        const fs = await import('fs/promises');
        const path = await import('path');
        
        const filePath = path.join(process.cwd(), '.cache', `${this.options.storageKey}.json`);
        
        try {
          data = await fs.readFile(filePath, 'utf-8');
        } catch (error) {
          // File doesn't exist, return null
          return null;
        }
      }

      if (!data) return null;

      const cart = JSON.parse(data);
      
      // Check TTL if set
      if (this.options.ttl) {
        const age = (Date.now() - new Date(cart.updatedAt).getTime()) / 1000;
        if (age > this.options.ttl) {
          await this.clear();
          return null;
        }
      }

      return cart;
    } catch (error) {
      console.error('Failed to load cart from storage:', error);
      return null;
    }
  }

  async clear(): Promise<void> {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(this.options.storageKey);
    } else {
      const fs = await import('fs/promises');
      const path = await import('path');
      
      const filePath = path.join(process.cwd(), '.cache', `${this.options.storageKey}.json`);
      
      try {
        await fs.unlink(filePath);
      } catch (error) {
        // File doesn't exist, ignore
      }
    }
  }

  async exists(): Promise<boolean> {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(this.options.storageKey) !== null;
    } else {
      const fs = await import('fs/promises');
      const path = await import('path');
      
      const filePath = path.join(process.cwd(), '.cache', `${this.options.storageKey}.json`);
      
      try {
        await fs.access(filePath);
        return true;
      } catch {
        return false;
      }
    }
  }

  // Simple compression/decompression (for demo purposes)
  // In production, use a proper compression library like pako or lz-string
  private simpleCompress(data: string): string {
    // Base64 encode as a simple form of "compression"
    return Buffer.from(data).toString('base64');
  }

  private simpleDecompress(data: string): string {
    return Buffer.from(data, 'base64').toString('utf-8');
  }
}

// Helper function to create a cart manager with persistence
export async function createPersistentCart(
  userId?: string,
  options?: Partial<PersistenceOptions>
): Promise<CartManager> {
  const persistence = new CartPersistence(options);
  const savedCart = await persistence.load();

  const manager = savedCart
    ? CartManager.fromJSON(savedCart)
    : new CartManager(userId);

  // Auto-save on changes
  manager.on('item_added', async () => {
    await persistence.save(manager.getCart());
  });
  manager.on('item_removed', async () => {
    await persistence.save(manager.getCart());
  });
  manager.on('item_updated', async () => {
    await persistence.save(manager.getCart());
  });
  manager.on('discount_applied', async () => {
    await persistence.save(manager.getCart());
  });
  manager.on('discount_removed', async () => {
    await persistence.save(manager.getCart());
  });
  manager.on('cart_cleared', async () => {
    await persistence.save(manager.getCart());
  });

  return manager;
}
