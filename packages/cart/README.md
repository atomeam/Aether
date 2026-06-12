# @aether/cart

A comprehensive shopping cart management library for e-commerce applications. Features cart management, persistence, calculations, discount codes, and analytics.

## Features

- **Cart Management**: Add, update, remove items with automatic quantity aggregation
- **Cart Persistence**: Save and restore cart state across sessions (localStorage or file system)
- **Cart Calculations**: Automatic subtotal, tax, shipping, and total calculations
- **Discount Codes**: Support for percentage, fixed, and free shipping discounts
- **Cart Analytics**: Track cart metrics, abandonment risk, and category breakdowns
- **Event System**: Listen to cart events for real-time updates
- **TypeScript**: Full type safety with TypeScript
- **Zod Schemas**: Runtime validation with Zod schemas

## Installation

```bash
npm install @aether/cart
```

## Quick Start

```typescript
import { CartManager } from '@aether/cart';

// Create a new cart
const cart = new CartManager('user123');

// Add items
cart.addItem({
  productId: 'prod1',
  quantity: 2,
  price: 29.99,
  name: 'T-Shirt',
  image: 'https://example.com/tshirt.jpg',
  attributes: { size: 'M', color: 'blue' }
});

// Get cart data
const cartData = cart.getCart();
console.log(cartData.total); // 59.98
```

## Usage

### Cart Management

#### Adding Items

```typescript
cart.addItem({
  productId: 'prod1',
  variantId: 'var1', // optional
  quantity: 2,
  price: 29.99,
  name: 'T-Shirt',
  image: 'https://example.com/tshirt.jpg',
  attributes: { size: 'M', color: 'blue' }
});
```

If an item with the same `productId` and `variantId` already exists, the quantity will be increased.

#### Updating Items

```typescript
// Update quantity
cart.updateItemQuantity('item-id', 5);

// Remove item
cart.removeItem('item-id');

// Clear entire cart
cart.clearCart();
```

### Cart Calculations

```typescript
// Set tax rate (percentage)
cart.setTaxRate(10); // 10% tax

// Set shipping amount
cart.setShippingAmount(5.99);

// Get calculated totals
const cartData = cart.getCart();
console.log(cartData.subtotal);      // Sum of item prices
console.log(cartData.taxAmount);     // Calculated tax
console.log(cartData.shippingAmount); // Shipping cost
console.log(cartData.total);         // Final total
```

### Discount Codes

#### Creating Discount Codes

```typescript
cart.addDiscountCode({
  code: 'SAVE10',
  type: 'percentage',
  value: 10,
  minPurchase: 0,
  maxDiscount: 50, // optional
  usageLimit: 100, // optional
  expiresAt: new Date('2024-12-31'), // optional
  applicableProducts: ['prod1', 'prod2'], // optional
  applicableCategories: ['clothing'] // optional
});
```

#### Applying Discounts

```typescript
// Apply discount code
const applied = cart.applyDiscountCode('SAVE10');

if (applied) {
  console.log('Discount applied!');
  console.log(cart.getCart().discountAmount);
}

// Remove discount
cart.removeDiscountCode();
```

#### Discount Types

- **percentage**: Percentage off subtotal (e.g., 10% off)
- **fixed**: Fixed amount off (e.g., $20 off)
- **free_shipping**: Waives shipping cost

### Cart Persistence

```typescript
import { createPersistentCart } from '@aether/cart';

// Create cart with automatic persistence
const cart = await createPersistentCart('user123', {
  storageKey: 'my_cart',
  ttl: 3600, // Optional: expire after 1 hour
  compress: false // Optional: compress stored data
});

// Cart automatically saves on changes
cart.addItem({ productId: 'prod1', quantity: 2, price: 29.99, name: 'Product' });
// Cart is automatically persisted
```

#### Manual Persistence

```typescript
import { CartPersistence } from '@aether/cart';

const persistence = new CartPersistence({ storageKey: 'my_cart' });

// Save cart
await persistence.save(cart.getCart());

// Load cart
const savedCart = await persistence.load();

// Clear saved cart
await persistence.clear();

// Check if cart exists
const exists = await persistence.exists();
```

### Cart Analytics

```typescript
const analytics = cart.getAnalytics();

console.log(analytics.totalItems);           // Number of unique items
console.log(analytics.totalQuantity);        // Total quantity of all items
console.log(analytics.averageItemPrice);     // Average price per item
console.log(analytics.mostExpensiveItem);    // Highest price item
console.log(analytics.leastExpensiveItem);   // Lowest price item
console.log(analytics.categoryBreakdown);    // Items per category
console.log(analytics.timeSinceUpdate);      // Minutes since last update
console.log(analytics.abandonmentRisk);      // 'low' | 'medium' | 'high'
```

### Event System

Listen to cart events for real-time updates:

```typescript
// Listen to item additions
cart.on('item_added', (event) => {
  console.log('Item added:', event.itemId);
});

// Listen to discount applications
cart.on('discount_applied', (event) => {
  console.log('Discount applied:', event.metadata?.code);
});

// Remove listener
cart.off('item_added', listener);
```

#### Available Events

- `item_added`: When an item is added to the cart
- `item_removed`: When an item is removed from the cart
- `item_updated`: When an item quantity is updated
- `discount_applied`: When a discount code is applied
- `discount_removed`: When a discount code is removed
- `cart_cleared`: When the cart is cleared
- `cart_restored`: When a cart is restored from storage

### Cart Restoration

```typescript
// Serialize cart
const cartData = cart.toJSON();

// Restore cart
const restoredCart = CartManager.fromJSON(cartData);
```

## API Reference

### CartManager

#### Constructor

```typescript
constructor(userId?: string)
```

#### Methods

- `getCart(): Cart` - Get current cart state
- `addItem(item: Omit<CartItem, 'id' | 'addedAt'>): CartItem` - Add item to cart
- `removeItem(itemId: string): boolean` - Remove item from cart
- `updateItemQuantity(itemId: string, quantity: number): boolean` - Update item quantity
- `clearCart(): void` - Clear all items from cart
- `setTaxRate(taxRate: number): void` - Set tax rate (percentage)
- `setShippingAmount(amount: number): void` - Set shipping amount
- `addDiscountCode(discount: Omit<DiscountCode, 'createdAt'>): void` - Add discount code
- `applyDiscountCode(code: string): boolean` - Apply discount code
- `removeDiscountCode(): void` - Remove discount code
- `getDiscountCode(code: string): DiscountCode | undefined` - Get discount code details
- `getAllDiscountCodes(): DiscountCode[]` - Get all discount codes
- `getAnalytics(): CartAnalytics` - Get cart analytics
- `getEventLog(): CartEvent[]` - Get event log
- `clearEventLog(): void` - Clear event log
- `on(eventType: CartEvent['type'], listener: Function): void` - Add event listener
- `off(eventType: CartEvent['type'], listener: Function): void` - Remove event listener
- `toJSON(): Cart` - Serialize cart to JSON
- `static fromJSON(cartData: Cart): CartManager` - Restore cart from JSON

### CartPersistence

#### Constructor

```typescript
constructor(options?: Partial<PersistenceOptions>)
```

#### Methods

- `save(cart: Cart): Promise<void>` - Save cart to storage
- `load(): Promise<Cart | null>` - Load cart from storage
- `clear(): Promise<void>` - Clear saved cart
- `exists(): Promise<boolean>` - Check if cart exists

## Types

### CartItem

```typescript
interface CartItem {
  id: string;
  productId: string;
  variantId?: string;
  quantity: number;
  price: number;
  name: string;
  image?: string;
  attributes?: Record<string, string>;
  addedAt: Date;
}
```

### DiscountCode

```typescript
interface DiscountCode {
  code: string;
  type: 'percentage' | 'fixed' | 'free_shipping';
  value: number;
  minPurchase: number;
  maxDiscount?: number;
  usageLimit?: number;
  usageCount: number;
  expiresAt?: Date;
  applicableProducts?: string[];
  applicableCategories?: string[];
  createdAt: Date;
}
```

### Cart

```typescript
interface Cart {
  id: string;
  userId?: string;
  items: CartItem[];
  discountCode?: string;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  shippingAmount: number;
  total: number;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
}
```

## License

MIT
