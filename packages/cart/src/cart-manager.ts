import {
  Cart,
  CartItem,
  DiscountCode,
  CartEvent,
  CartAnalytics,
  CartSchema,
  CartItemSchema,
  DiscountCodeSchema,
  CartEventSchema,
} from './types.js';

export class CartManager {
  private cart: Cart;
  private discountCodes: Map<string, DiscountCode> = new Map();
  private eventLog: CartEvent[] = [];
  private eventListeners: Map<string, ((event: CartEvent) => void)[]> = new Map();

  constructor(userId?: string) {
    this.cart = {
      id: this.generateId(),
      userId,
      items: [],
      subtotal: 0,
      discountAmount: 0,
      taxAmount: 0,
      shippingAmount: 0,
      total: 0,
      currency: 'USD',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  private generateId(): string {
    return `cart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private logEvent(type: CartEvent['type'], itemId?: string, metadata?: Record<string, any>): void {
    const event: CartEvent = {
      type,
      cartId: this.cart.id,
      itemId,
      timestamp: new Date(),
      metadata,
    };
    this.eventLog.push(event);
    this.notifyListeners(event);
  }

  private notifyListeners(event: CartEvent): void {
    const listeners = this.eventListeners.get(event.type) || [];
    listeners.forEach((listener) => listener(event));
  }

  on(eventType: CartEvent['type'], listener: (event: CartEvent) => void): void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }
    this.eventListeners.get(eventType)!.push(listener);
  }

  off(eventType: CartEvent['type'], listener: (event: CartEvent) => void): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  // Cart Management
  getCart(): Cart {
    return { ...this.cart };
  }

  addItem(item: Omit<CartItem, 'id' | 'addedAt'>): CartItem {
    const existingItem = this.cart.items.find(
      (i) => i.productId === item.productId && i.variantId === item.variantId
    );

    if (existingItem) {
      existingItem.quantity += item.quantity;
      this.logEvent('item_updated', existingItem.id, { quantity: existingItem.quantity });
    } else {
      const newItem: CartItem = {
        ...item,
        id: this.generateId(),
        addedAt: new Date(),
      };
      this.cart.items.push(newItem);
      this.logEvent('item_added', newItem.id);
    }

    this.recalculate();
    return existingItem || this.cart.items[this.cart.items.length - 1];
  }

  removeItem(itemId: string): boolean {
    const index = this.cart.items.findIndex((i) => i.id === itemId);
    if (index === -1) return false;

    this.cart.items.splice(index, 1);
    this.logEvent('item_removed', itemId);
    this.recalculate();
    return true;
  }

  updateItemQuantity(itemId: string, quantity: number): boolean {
    const item = this.cart.items.find((i) => i.id === itemId);
    if (!item) return false;

    if (quantity <= 0) {
      return this.removeItem(itemId);
    }

    item.quantity = quantity;
    this.logEvent('item_updated', itemId, { quantity });
    this.recalculate();
    return true;
  }

  clearCart(): void {
    this.cart.items = [];
    this.cart.discountCode = undefined;
    this.cart.discountAmount = 0;
    this.logEvent('cart_cleared');
    this.recalculate();
  }

  // Cart Calculations
  private recalculate(): void {
    this.cart.subtotal = this.cart.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    this.cart.discountAmount = this.calculateDiscount();
    this.cart.total = Math.max(
      0,
      this.cart.subtotal - this.cart.discountAmount + this.cart.taxAmount + this.cart.shippingAmount
    );

    this.cart.updatedAt = new Date();
  }

  private calculateDiscount(): number {
    if (!this.cart.discountCode) return 0;

    const discount = this.discountCodes.get(this.cart.discountCode);
    if (!discount) return 0;

    let discountAmount = 0;

    if (discount.type === 'percentage') {
      discountAmount = this.cart.subtotal * (discount.value / 100);
    } else if (discount.type === 'fixed') {
      discountAmount = discount.value;
    } else if (discount.type === 'free_shipping') {
      this.cart.shippingAmount = 0;
      return 0;
    }

    // Apply max discount limit
    if (discount.maxDiscount) {
      discountAmount = Math.min(discountAmount, discount.maxDiscount);
    }

    return Math.min(discountAmount, this.cart.subtotal);
  }

  setTaxRate(taxRate: number): void {
    const taxableAmount = Math.max(0, this.cart.subtotal - this.cart.discountAmount);
    this.cart.taxAmount = taxableAmount * (taxRate / 100);
    this.recalculate();
  }

  setShippingAmount(amount: number): void {
    this.cart.shippingAmount = amount;
    this.recalculate();
  }

  // Discount Codes
  addDiscountCode(discount: Omit<DiscountCode, 'createdAt'>): void {
    const fullDiscount: DiscountCode = {
      ...discount,
      createdAt: new Date(),
    };
    this.discountCodes.set(discount.code.toUpperCase(), fullDiscount);
  }

  applyDiscountCode(code: string): boolean {
    const discount = this.discountCodes.get(code.toUpperCase());
    if (!discount) return false;

    // Check expiration
    if (discount.expiresAt && discount.expiresAt < new Date()) {
      return false;
    }

    // Check usage limit
    if (discount.usageLimit && discount.usageCount >= discount.usageLimit) {
      return false;
    }

    // Check minimum purchase
    if (this.cart.subtotal < discount.minPurchase) {
      return false;
    }

    this.cart.discountCode = code.toUpperCase();
    discount.usageCount++;
    this.logEvent('discount_applied', undefined, { code });
    this.recalculate();
    return true;
  }

  removeDiscountCode(): void {
    if (this.cart.discountCode) {
      this.logEvent('discount_removed', undefined, { code: this.cart.discountCode });
    }
    this.cart.discountCode = undefined;
    this.cart.discountAmount = 0;
    this.recalculate();
  }

  getDiscountCode(code: string): DiscountCode | undefined {
    return this.discountCodes.get(code.toUpperCase());
  }

  getAllDiscountCodes(): DiscountCode[] {
    return Array.from(this.discountCodes.values());
  }

  // Cart Analytics
  getAnalytics(): CartAnalytics {
    const now = new Date();
    const timeSinceLastUpdate = (now.getTime() - this.cart.updatedAt.getTime()) / (1000 * 60); // minutes

    const totalItems = this.cart.items.length;
    const totalQuantity = this.cart.items.reduce((sum, item) => sum + item.quantity, 0);

    const prices = this.cart.items.map((item) => item.price);
    const averageItemPrice = prices.length > 0
      ? prices.reduce((sum, price) => sum + price, 0) / prices.length
      : 0;
    const mostExpensiveItem = prices.length > 0 ? Math.max(...prices) : 0;
    const leastExpensiveItem = prices.length > 0 ? Math.min(...prices) : 0;

    // Simple category breakdown (would need product data for real implementation)
    const categoryBreakdown: Record<string, number> = {};
    this.cart.items.forEach((item) => {
      const category = item.attributes?.category || 'uncategorized';
      categoryBreakdown[category] = (categoryBreakdown[category] || 0) + item.quantity;
    });

    // Calculate abandonment risk
    let abandonmentRisk: 'low' | 'medium' | 'high' = 'low';
    if (timeSinceLastUpdate > 1440) abandonmentRisk = 'high'; // > 24 hours
    else if (timeSinceLastUpdate > 60) abandonmentRisk = 'medium'; // > 1 hour

    return {
      cartId: this.cart.id,
      totalItems,
      totalQuantity,
      averageItemPrice,
      mostExpensiveItem,
      leastExpensiveItem,
      categoryBreakdown,
      timeSinceLastUpdate,
      abandonmentRisk,
    };
  }

  getEventLog(): CartEvent[] {
    return [...this.eventLog];
  }

  clearEventLog(): void {
    this.eventLog = [];
  }

  // Cart Restoration
  restoreCart(cartData: Cart): void {
    const validatedCart = CartSchema.parse(cartData);
    this.cart = validatedCart;
    this.logEvent('cart_restored');
  }

  toJSON(): Cart {
    return this.getCart();
  }

  static fromJSON(cartData: Cart): CartManager {
    const manager = new CartManager(cartData.userId);
    manager.restoreCart(cartData);
    return manager;
  }
}
