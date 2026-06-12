import { describe, it, expect, beforeEach } from 'vitest';
import { CartManager } from '../src/cart-manager.js';
import type { CartItem, DiscountCode } from '../src/types.js';

describe('CartManager', () => {
  let cart: CartManager;

  beforeEach(() => {
    cart = new CartManager('user123');
  });

  describe('Cart Management', () => {
    it('should create a new cart with default values', () => {
      const cartData = cart.getCart();
      expect(cartData.id).toBeDefined();
      expect(cartData.userId).toBe('user123');
      expect(cartData.items).toEqual([]);
      expect(cartData.subtotal).toBe(0);
      expect(cartData.total).toBe(0);
      expect(cartData.currency).toBe('USD');
    });

    it('should add an item to the cart', () => {
      const item: Omit<CartItem, 'id' | 'addedAt'> = {
        productId: 'prod1',
        quantity: 2,
        price: 10,
        name: 'Test Product',
      };

      const addedItem = cart.addItem(item);
      expect(addedItem.id).toBeDefined();
      expect(addedItem.quantity).toBe(2);
      expect(addedItem.price).toBe(10);

      const cartData = cart.getCart();
      expect(cartData.items.length).toBe(1);
      expect(cartData.subtotal).toBe(20);
    });

    it('should update quantity of existing item', () => {
      const item: Omit<CartItem, 'id' | 'addedAt'> = {
        productId: 'prod1',
        quantity: 2,
        price: 10,
        name: 'Test Product',
      };

      cart.addItem(item);
      cart.addItem({ ...item, quantity: 3 });

      const cartData = cart.getCart();
      expect(cartData.items.length).toBe(1);
      expect(cartData.items[0].quantity).toBe(5);
      expect(cartData.subtotal).toBe(50);
    });

    it('should add different variants as separate items', () => {
      const item: Omit<CartItem, 'id' | 'addedAt'> = {
        productId: 'prod1',
        variantId: 'var1',
        quantity: 1,
        price: 10,
        name: 'Test Product',
      };

      cart.addItem(item);
      cart.addItem({ ...item, variantId: 'var2' });

      const cartData = cart.getCart();
      expect(cartData.items.length).toBe(2);
    });

    it('should remove an item from the cart', () => {
      const item: Omit<CartItem, 'id' | 'addedAt'> = {
        productId: 'prod1',
        quantity: 2,
        price: 10,
        name: 'Test Product',
      };

      const addedItem = cart.addItem(item);
      const removed = cart.removeItem(addedItem.id);

      expect(removed).toBe(true);
      expect(cart.getCart().items.length).toBe(0);
    });

    it('should return false when removing non-existent item', () => {
      const removed = cart.removeItem('non-existent');
      expect(removed).toBe(false);
    });

    it('should update item quantity', () => {
      const item: Omit<CartItem, 'id' | 'addedAt'> = {
        productId: 'prod1',
        quantity: 2,
        price: 10,
        name: 'Test Product',
      };

      const addedItem = cart.addItem(item);
      const updated = cart.updateItemQuantity(addedItem.id, 5);

      expect(updated).toBe(true);
      expect(cart.getCart().items[0].quantity).toBe(5);
      expect(cart.getCart().subtotal).toBe(50);
    });

    it('should remove item when quantity is set to 0', () => {
      const item: Omit<CartItem, 'id' | 'addedAt'> = {
        productId: 'prod1',
        quantity: 2,
        price: 10,
        name: 'Test Product',
      };

      const addedItem = cart.addItem(item);
      cart.updateItemQuantity(addedItem.id, 0);

      expect(cart.getCart().items.length).toBe(0);
    });

    it('should clear the cart', () => {
      const item: Omit<CartItem, 'id' | 'addedAt'> = {
        productId: 'prod1',
        quantity: 2,
        price: 10,
        name: 'Test Product',
      };

      cart.addItem(item);
      cart.clearCart();

      const cartData = cart.getCart();
      expect(cartData.items).toEqual([]);
      expect(cartData.subtotal).toBe(0);
      expect(cartData.discountCode).toBeUndefined();
    });
  });

  describe('Cart Calculations', () => {
    it('should calculate subtotal correctly', () => {
      cart.addItem({ productId: 'prod1', quantity: 2, price: 10, name: 'Product 1' });
      cart.addItem({ productId: 'prod2', quantity: 3, price: 5, name: 'Product 2' });

      expect(cart.getCart().subtotal).toBe(35);
    });

    it('should apply tax rate', () => {
      cart.addItem({ productId: 'prod1', quantity: 2, price: 10, name: 'Product 1' });
      cart.setTaxRate(10);

      expect(cart.getCart().taxAmount).toBe(2);
      expect(cart.getCart().total).toBe(22);
    });

    it('should set shipping amount', () => {
      cart.addItem({ productId: 'prod1', quantity: 2, price: 10, name: 'Product 1' });
      cart.setShippingAmount(5);

      expect(cart.getCart().shippingAmount).toBe(5);
      expect(cart.getCart().total).toBe(25);
    });

    it('should calculate total with tax and shipping', () => {
      cart.addItem({ productId: 'prod1', quantity: 2, price: 10, name: 'Product 1' });
      cart.setTaxRate(10);
      cart.setShippingAmount(5);

      expect(cart.getCart().total).toBe(27);
    });
  });

  describe('Discount Codes', () => {
    beforeEach(() => {
      cart.addDiscountCode({
        code: 'SAVE10',
        type: 'percentage',
        value: 10,
        minPurchase: 0,
      });

      cart.addDiscountCode({
        code: 'FIXED20',
        type: 'fixed',
        value: 20,
        minPurchase: 50,
        maxDiscount: 15,
      });

      cart.addDiscountCode({
        code: 'FREESHIP',
        type: 'free_shipping',
        value: 0,
        minPurchase: 0,
      });
    });

    it('should add discount code', () => {
      const discount = cart.getDiscountCode('SAVE10');
      expect(discount).toBeDefined();
      expect(discount?.code).toBe('SAVE10');
      expect(discount?.type).toBe('percentage');
    });

    it('should apply percentage discount', () => {
      cart.addItem({ productId: 'prod1', quantity: 2, price: 10, name: 'Product 1' });
      cart.applyDiscountCode('SAVE10');

      expect(cart.getCart().discountCode).toBe('SAVE10');
      expect(cart.getCart().discountAmount).toBe(2);
      expect(cart.getCart().total).toBe(18);
    });

    it('should apply fixed discount', () => {
      cart.addItem({ productId: 'prod1', quantity: 5, price: 10, name: 'Product 1' });
      cart.applyDiscountCode('FIXED20');

      expect(cart.getCart().discountAmount).toBe(15); // max discount applied
      expect(cart.getCart().total).toBe(35);
    });

    it('should not apply fixed discount below min purchase', () => {
      cart.addItem({ productId: 'prod1', quantity: 2, price: 10, name: 'Product 1' });
      const applied = cart.applyDiscountCode('FIXED20');

      expect(applied).toBe(false);
      expect(cart.getCart().discountAmount).toBe(0);
    });

    it('should apply free shipping discount', () => {
      cart.addItem({ productId: 'prod1', quantity: 2, price: 10, name: 'Product 1' });
      cart.setShippingAmount(5);
      cart.applyDiscountCode('FREESHIP');

      expect(cart.getCart().shippingAmount).toBe(0);
      expect(cart.getCart().total).toBe(20);
    });

    it('should remove discount code', () => {
      cart.addItem({ productId: 'prod1', quantity: 2, price: 10, name: 'Product 1' });
      cart.applyDiscountCode('SAVE10');
      cart.removeDiscountCode();

      expect(cart.getCart().discountCode).toBeUndefined();
      expect(cart.getCart().discountAmount).toBe(0);
      expect(cart.getCart().total).toBe(20);
    });

    it('should not apply expired discount code', () => {
      cart.addDiscountCode({
        code: 'EXPIRED',
        type: 'percentage',
        value: 10,
        minPurchase: 0,
        expiresAt: new Date('2020-01-01'),
      });

      cart.addItem({ productId: 'prod1', quantity: 2, price: 10, name: 'Product 1' });
      const applied = cart.applyDiscountCode('EXPIRED');

      expect(applied).toBe(false);
    });

    it('should not apply discount code after usage limit', () => {
      cart.addDiscountCode({
        code: 'LIMITED',
        type: 'percentage',
        value: 10,
        minPurchase: 0,
        usageLimit: 1,
        usageCount: 1,
      });

      cart.addItem({ productId: 'prod1', quantity: 2, price: 10, name: 'Product 1' });
      const applied = cart.applyDiscountCode('LIMITED');

      expect(applied).toBe(false);
    });

    it('should be case-insensitive for discount codes', () => {
      cart.addItem({ productId: 'prod1', quantity: 2, price: 10, name: 'Product 1' });
      const applied = cart.applyDiscountCode('save10');

      expect(applied).toBe(true);
      expect(cart.getCart().discountCode).toBe('SAVE10');
    });
  });

  describe('Cart Analytics', () => {
    it('should calculate analytics for empty cart', () => {
      const analytics = cart.getAnalytics();

      expect(analytics.totalItems).toBe(0);
      expect(analytics.totalQuantity).toBe(0);
      expect(analytics.averageItemPrice).toBe(0);
      expect(analytics.mostExpensiveItem).toBe(0);
      expect(analytics.leastExpensiveItem).toBe(0);
    });

    it('should calculate analytics for cart with items', () => {
      cart.addItem({ productId: 'prod1', quantity: 2, price: 10, name: 'Product 1', attributes: { category: 'electronics' } });
      cart.addItem({ productId: 'prod2', quantity: 1, price: 20, name: 'Product 2', attributes: { category: 'electronics' } });
      cart.addItem({ productId: 'prod3', quantity: 3, price: 5, name: 'Product 3', attributes: { category: 'books' } });

      const analytics = cart.getAnalytics();

      expect(analytics.totalItems).toBe(3);
      expect(analytics.totalQuantity).toBe(6);
      expect(analytics.averageItemPrice).toBeCloseTo(11.67, 2);
      expect(analytics.mostExpensiveItem).toBe(20);
      expect(analytics.leastExpensiveItem).toBe(5);
      expect(analytics.categoryBreakdown).toEqual({
        electronics: 3,
        books: 3,
      });
    });

    it('should calculate abandonment risk', () => {
      const analytics = cart.getAnalytics();
      expect(['low', 'medium', 'high']).toContain(analytics.abandonmentRisk);
    });
  });

  describe('Event System', () => {
    it('should log item_added event', () => {
      cart.addItem({ productId: 'prod1', quantity: 2, price: 10, name: 'Product 1' });
      const events = cart.getEventLog();

      expect(events.length).toBe(1);
      expect(events[0].type).toBe('item_added');
    });

    it('should log item_removed event', () => {
      const item = cart.addItem({ productId: 'prod1', quantity: 2, price: 10, name: 'Product 1' });
      cart.removeItem(item.id);
      const events = cart.getEventLog();

      expect(events.length).toBe(2);
      expect(events[1].type).toBe('item_removed');
    });

    it('should log item_updated event', () => {
      const item = cart.addItem({ productId: 'prod1', quantity: 2, price: 10, name: 'Product 1' });
      cart.updateItemQuantity(item.id, 5);
      const events = cart.getEventLog();

      expect(events.length).toBe(2);
      expect(events[1].type).toBe('item_updated');
    });

    it('should log discount_applied event', () => {
      cart.addDiscountCode({ code: 'SAVE10', type: 'percentage', value: 10, minPurchase: 0 });
      cart.addItem({ productId: 'prod1', quantity: 2, price: 10, name: 'Product 1' });
      cart.applyDiscountCode('SAVE10');
      const events = cart.getEventLog();

      expect(events.some(e => e.type === 'discount_applied')).toBe(true);
    });

    it('should notify event listeners', () => {
      let called = false;
      cart.on('item_added', () => {
        called = true;
      });

      cart.addItem({ productId: 'prod1', quantity: 2, price: 10, name: 'Product 1' });
      expect(called).toBe(true);
    });

    it('should remove event listeners', () => {
      let called = false;
      const listener = () => {
        called = true;
      };

      cart.on('item_added', listener);
      cart.off('item_added', listener);
      cart.addItem({ productId: 'prod1', quantity: 2, price: 10, name: 'Product 1' });

      expect(called).toBe(false);
    });

    it('should clear event log', () => {
      cart.addItem({ productId: 'prod1', quantity: 2, price: 10, name: 'Product 1' });
      cart.clearEventLog();

      expect(cart.getEventLog().length).toBe(0);
    });
  });

  describe('Cart Restoration', () => {
    it('should restore cart from JSON', () => {
      const item: Omit<CartItem, 'id' | 'addedAt'> = {
        productId: 'prod1',
        quantity: 2,
        price: 10,
        name: 'Product 1',
      };

      cart.addItem(item);
      const cartData = cart.toJSON();

      const newCart = CartManager.fromJSON(cartData);
      expect(newCart.getCart().items.length).toBe(1);
      expect(newCart.getCart().subtotal).toBe(20);
    });

    it('should restore cart with discount code', () => {
      cart.addDiscountCode({ code: 'SAVE10', type: 'percentage', value: 10, minPurchase: 0 });
      cart.addItem({ productId: 'prod1', quantity: 2, price: 10, name: 'Product 1' });
      cart.applyDiscountCode('SAVE10');

      const cartData = cart.toJSON();
      const newCart = CartManager.fromJSON(cartData);

      expect(newCart.getCart().discountCode).toBe('SAVE10');
      expect(newCart.getCart().discountAmount).toBe(2);
    });
  });
});
