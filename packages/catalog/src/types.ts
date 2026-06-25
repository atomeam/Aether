import { z } from 'zod';

// Product Variant
export const ProductVariantSchema = z.object({
  id: z.string(),
  productId: z.string(),
  name: z.string(),
  sku: z.string(),
  price: z.number().nonnegative(),
  compareAtPrice: z.number().nonnegative().optional(),
  costPrice: z.number().nonnegative().optional(),
  weight: z.number().nonnegative().optional(),
  weightUnit: z.enum(['kg', 'g', 'lb', 'oz']).default('kg'),
  attributes: z.record(z.string()),
  available: z.boolean().default(true),
  stock: z.number().int().nonnegative().default(0),
  lowStockThreshold: z.number().int().nonnegative().default(10),
  images: z.array(z.string().url()).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type ProductVariant = z.infer<typeof ProductVariantSchema>;

// Product
export const ProductSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  description: z.string(),
  shortDescription: z.string().optional(),
  categoryId: z.string(),
  brand: z.string().optional(),
  tags: z.array(z.string()).default([]),
  images: z.array(z.string().url()).default([]),
  price: z.number().nonnegative(),
  compareAtPrice: z.number().nonnegative().optional(),
  costPrice: z.number().nonnegative().optional(),
  variants: z.array(ProductVariantSchema).default([]),
  attributes: z.record(z.string()).optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  active: z.boolean().default(true),
  featured: z.boolean().default(false),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Product = z.infer<typeof ProductSchema>;

// Category
export const CategorySchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  description: z.string().optional(),
  parentId: z.string().optional(),
  image: z.string().url().optional(),
  icon: z.string().optional(),
  active: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Category = z.infer<typeof CategorySchema>;

// Inventory Record
export const InventoryRecordSchema = z.object({
  id: z.string(),
  productId: z.string(),
  variantId: z.string().optional(),
  quantity: z.number().int(),
  location: z.string().optional(),
  reason: z.enum(['purchase', 'sale', 'return', 'adjustment', 'transfer']),
  referenceId: z.string().optional(),
  notes: z.string().optional(),
  createdAt: z.date(),
});

export type InventoryRecord = z.infer<typeof InventoryRecordSchema>;

// Search Filters
export const SearchFiltersSchema = z.object({
  query: z.string().optional(),
  categoryIds: z.array(z.string()).optional(),
  brand: z.string().optional(),
  tags: z.array(z.string()).optional(),
  minPrice: z.number().nonnegative().optional(),
  maxPrice: z.number().nonnegative().optional(),
  active: z.boolean().optional(),
  featured: z.boolean().optional(),
  inStock: z.boolean().optional(),
  attributes: z.record(z.string()).optional(),
  sortBy: z.enum(['name', 'price', 'createdAt', 'popularity']).optional(),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
  limit: z.number().int().positive().default(20),
  offset: z.number().int().nonnegative().default(0),
});

export type SearchFilters = z.infer<typeof SearchFiltersSchema>;

// Search Results
export const SearchResultsSchema = z.object({
  products: z.array(ProductSchema),
  total: z.number().int().nonnegative(),
  limit: z.number().int().positive(),
  offset: z.number().int().nonnegative(),
  hasMore: z.boolean(),
});

export type SearchResults = z.infer<typeof SearchResultsSchema>;

// Inventory Status
export const InventoryStatusSchema = z.object({
  productId: z.string(),
  variantId: z.string().optional(),
  available: z.boolean(),
  stock: z.number().int().nonnegative(),
  lowStock: z.boolean(),
  outOfStock: z.boolean(),
  reserved: z.number().int().nonnegative().default(0),
  locations: z.record(z.number().int().nonnegative()).optional(),
});

export type InventoryStatus = z.infer<typeof InventoryStatusSchema>;
