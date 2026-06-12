import { z } from 'zod';

// Cart Item
export const CartItemSchema = z.object({
  id: z.string(),
  productId: z.string(),
  variantId: z.string().optional(),
  quantity: z.number().int().positive(),
  price: z.number().nonnegative(),
  name: z.string(),
  image: z.string().url().optional(),
  attributes: z.record(z.string()).optional(),
  addedAt: z.date(),
});

export type CartItem = z.infer<typeof CartItemSchema>;

// Discount Code
export const DiscountCodeSchema = z.object({
  code: z.string().toUpperCase(),
  type: z.enum(['percentage', 'fixed', 'free_shipping']),
  value: z.number().nonnegative(),
  minPurchase: z.number().nonnegative().default(0),
  maxDiscount: z.number().nonnegative().optional(),
  usageLimit: z.number().int().positive().optional(),
  usageCount: z.number().int().nonnegative().default(0),
  expiresAt: z.date().optional(),
  applicableProducts: z.array(z.string()).optional(),
  applicableCategories: z.array(z.string()).optional(),
  createdAt: z.date(),
});

export type DiscountCode = z.infer<typeof DiscountCodeSchema>;

// Cart
export const CartSchema = z.object({
  id: z.string(),
  userId: z.string().optional(),
  items: z.array(CartItemSchema),
  discountCode: z.string().optional(),
  subtotal: z.number().nonnegative(),
  discountAmount: z.number().nonnegative().default(0),
  taxAmount: z.number().nonnegative().default(0),
  shippingAmount: z.number().nonnegative().default(0),
  total: z.number().nonnegative(),
  currency: z.string().default('USD'),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Cart = z.infer<typeof CartSchema>;

// Cart Analytics
export const CartAnalyticsSchema = z.object({
  cartId: z.string(),
  totalItems: z.number().int().nonnegative(),
  totalQuantity: z.number().int().nonnegative(),
  averageItemPrice: z.number().nonnegative(),
  mostExpensiveItem: z.number().nonnegative(),
  leastExpensiveItem: z.number().nonnegative(),
  categoryBreakdown: z.record(z.number().int().nonnegative()),
  timeSinceLastUpdate: z.number().nonnegative(), // in minutes
  abandonmentRisk: z.enum(['low', 'medium', 'high']),
});

export type CartAnalytics = z.infer<typeof CartAnalyticsSchema>;

// Cart Events
export const CartEventSchema = z.object({
  type: z.enum([
    'item_added',
    'item_removed',
    'item_updated',
    'discount_applied',
    'discount_removed',
    'cart_cleared',
    'cart_restored',
  ]),
  cartId: z.string(),
  itemId: z.string().optional(),
  timestamp: z.date(),
  metadata: z.record(z.any()).optional(),
});

export type CartEvent = z.infer<typeof CartEventSchema>;

// Persistence Options
export const PersistenceOptionsSchema = z.object({
  storageKey: z.string().default('aether_cart'),
  ttl: z.number().int().positive().optional(), // time to live in seconds
  compress: z.boolean().default(false),
});

export type PersistenceOptions = z.infer<typeof PersistenceOptionsSchema>;
