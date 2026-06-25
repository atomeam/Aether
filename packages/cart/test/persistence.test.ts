import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CartPersistence, createPersistentCart } from '../src/persistence.js';
import { CartManager } from '../src/cart-manager.js';

// Mock localStorage for Node.js environment
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

// Mock window object
global.window = {
  localStorage: localStorageMock,
} as any;

describe('CartPersistence', () => {
  let persistence: CartPersistence;

  beforeEach(() => {
    localStorageMock.clear();
    persistence = new CartPersistence({ storageKey: 'test_cart' });
  });

  describe('save and load', () => {
    it('should save and load cart', async () => {
      const cart = new CartManager('user123');
      cart.addItem({ productId: 'prod1', quantity: 2, price: 10, name: 'Product 1' });

      await persistence.save(cart.getCart());
      const loaded = await persistence.load();

      expect(loaded).toBeDefined();
      expect(loaded?.items.length).toBe(1);
      expect(loaded?.subtotal).toBe(20);
    });

    it('should return null when cart does not exist', async () => {
      const loaded = await persistence.load();
      expect(loaded).toBeNull();
    });

    it('should overwrite existing cart', async () => {
      const cart1 = new CartManager('user123');
      cart1.addItem({ productId: 'prod1', quantity: 2, price: 10, name: 'Product 1' });
      await persistence.save(cart1.getCart());

      const cart2 = new CartManager('user456');
      cart2.addItem({ productId: 'prod2', quantity: 3, price: 5, name: 'Product 2' });
      await persistence.save(cart2.getCart());

      const loaded = await persistence.load();
      expect(loaded?.userId).toBe('user456');
      expect(loaded?.items.length).toBe(1);
      expect(loaded?.items[0].productId).toBe('prod2');
    });
  });

  describe('clear', () => {
    it('should clear saved cart', async () => {
      const cart = new CartManager('user123');
      cart.addItem({ productId: 'prod1', quantity: 2, price: 10, name: 'Product 1' });

      await persistence.save(cart.getCart());
      await persistence.clear();
      const loaded = await persistence.load();

      expect(loaded).toBeNull();
    });

    it('should handle clearing non-existent cart', async () => {
      await expect(persistence.clear()).resolves.not.toThrow();
    });
  });

  describe('exists', () => {
    it('should return true when cart exists', async () => {
      const cart = new CartManager('user123');
      await persistence.save(cart.getCart());

      const exists = await persistence.exists();
      expect(exists).toBe(true);
    });

    it('should return false when cart does not exist', async () => {
      const exists = await persistence.exists();
      expect(exists).toBe(false);
    });
  });

  describe('TTL', () => {
    it('should not load expired cart', async () => {
      const cart = new CartManager('user123');
      cart.addItem({ productId: 'prod1', quantity: 2, price: 10, name: 'Product 1' });

      const cartData = cart.getCart();
      // Manually set updatedAt to past
      cartData.updatedAt = new Date(Date.now() - 2000 * 1000); // 2000 seconds ago

      const persistenceWithTTL = new CartPersistence({ storageKey: 'test_cart_ttl', ttl: 1000 });
      await persistenceWithTTL.save(cartData);

      const loaded = await persistenceWithTTL.load();
      expect(loaded).toBeNull();
    });

    it('should load non-expired cart', async () => {
      const cart = new CartManager('user123');
      cart.addItem({ productId: 'prod1', quantity: 2, price: 10, name: 'Product 1' });

      const persistenceWithTTL = new CartPersistence({ storageKey: 'test_cart_ttl', ttl: 3600 });
      await persistenceWithTTL.save(cart.getCart());

      const loaded = await persistenceWithTTL.load();
      expect(loaded).toBeDefined();
      expect(loaded?.items.length).toBe(1);
    });
  });

  describe('compression', () => {
    it('should save and load with compression', async () => {
      const persistenceCompressed = new CartPersistence({ storageKey: 'test_cart_compressed', compress: true });
      const cart = new CartManager('user123');
      cart.addItem({ productId: 'prod1', quantity: 2, price: 10, name: 'Product 1' });

      await persistenceCompressed.save(cart.getCart());
      const loaded = await persistenceCompressed.load();

      expect(loaded).toBeDefined();
      expect(loaded?.items.length).toBe(1);
    });
  });
});

describe('createPersistentCart', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it('should create new cart when none exists', async () => {
    const cart = await createPersistentCart('user123', { storageKey: 'test_persistent' });

    expect(cart).toBeInstanceOf(CartManager);
    expect(cart.getCart().userId).toBe('user123');
    expect(cart.getCart().items.length).toBe(0);
  });

  it('should restore existing cart', async () => {
    const cart1 = await createPersistentCart('user123', { storageKey: 'test_persistent_restore' });
    cart1.addItem({ productId: 'prod1', quantity: 2, price: 10, name: 'Product 1' });

    const cart2 = await createPersistentCart('user123', { storageKey: 'test_persistent_restore' });

    expect(cart2.getCart().items.length).toBe(1);
    expect(cart2.getCart().subtotal).toBe(20);
  });

  it('should auto-save on item added', async () => {
    const cart = await createPersistentCart('user123', { storageKey: 'test_auto_save' });
    cart.addItem({ productId: 'prod1', quantity: 2, price: 10, name: 'Product 1' });

    // Wait a bit for async save
    await new Promise(resolve => setTimeout(resolve, 10));

    const persistence = new CartPersistence({ storageKey: 'test_auto_save' });
    const loaded = await persistence.load();

    expect(loaded?.items.length).toBe(1);
  });

  it('should auto-save on item removed', async () => {
    const cart = await createPersistentCart('user123', { storageKey: 'test_auto_save_remove' });
    const item = cart.addItem({ productId: 'prod1', quantity: 2, price: 10, name: 'Product 1' });
    cart.removeItem(item.id);

    await new Promise(resolve => setTimeout(resolve, 10));

    const persistence = new CartPersistence({ storageKey: 'test_auto_save_remove' });
    const loaded = await persistence.load();

    expect(loaded?.items.length).toBe(0);
  });

  it('should auto-save on discount applied', async () => {
    const cart = await createPersistentCart('user123', { storageKey: 'test_auto_save_discount' });
    cart.addDiscountCode({ code: 'SAVE10', type: 'percentage', value: 10, minPurchase: 0 });
    cart.addItem({ productId: 'prod1', quantity: 2, price: 10, name: 'Product 1' });
    cart.applyDiscountCode('SAVE10');

    await new Promise(resolve => setTimeout(resolve, 10));

    const persistence = new CartPersistence({ storageKey: 'test_auto_save_discount' });
    const loaded = await persistence.load();

    expect(loaded?.discountCode).toBe('SAVE10');
  });
});
