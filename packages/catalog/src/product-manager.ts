import {
  Product,
  ProductVariant,
  ProductSchema,
  ProductVariantSchema,
  SearchFilters,
  SearchResults,
  SearchFiltersSchema,
} from './types.js';

export class ProductManager {
  private products: Map<string, Product> = new Map();
  private variants: Map<string, ProductVariant> = new Map();

  private generateId(): string {
    return `prod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Product Management
  createProduct(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Product {
    const newProduct: Product = {
      ...product,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    ProductSchema.parse(newProduct);
    this.products.set(newProduct.id, newProduct);

    // Index variants
    newProduct.variants.forEach((variant) => {
      this.variants.set(variant.id, variant);
    });

    return newProduct;
  }

  getProduct(id: string): Product | undefined {
    return this.products.get(id);
  }

  getProductBySlug(slug: string): Product | undefined {
    return Array.from(this.products.values()).find((p) => p.slug === slug);
  }

  getAllProducts(): Product[] {
    return Array.from(this.products.values());
  }

  updateProduct(id: string, updates: Partial<Omit<Product, 'id' | 'createdAt'>>): Product | null {
    const product = this.products.get(id);
    if (!product) return null;

    const updatedProduct: Product = {
      ...product,
      ...updates,
      id: product.id,
      createdAt: product.createdAt,
      updatedAt: new Date(),
    };

    ProductSchema.parse(updatedProduct);
    this.products.set(id, updatedProduct);

    // Re-index variants
    updatedProduct.variants.forEach((variant) => {
      this.variants.set(variant.id, variant);
    });

    return updatedProduct;
  }

  deleteProduct(id: string): boolean {
    const product = this.products.get(id);
    if (!product) return false;

    // Remove variants from index
    product.variants.forEach((variant) => {
      this.variants.delete(variant.id);
    });

    return this.products.delete(id);
  }

  // Product Variants
  addVariant(productId: string, variant: Omit<ProductVariant, 'id' | 'productId' | 'createdAt' | 'updatedAt'>): ProductVariant | null {
    const product = this.products.get(productId);
    if (!product) return null;

    const newVariant: ProductVariant = {
      ...variant,
      id: this.generateId(),
      productId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    ProductVariantSchema.parse(newVariant);
    product.variants.push(newVariant);
    product.updatedAt = new Date();
    this.variants.set(newVariant.id, newVariant);

    return newVariant;
  }

  getVariant(id: string): ProductVariant | undefined {
    return this.variants.get(id);
  }

  getVariantBySku(sku: string): ProductVariant | undefined {
    return Array.from(this.variants.values()).find((v) => v.sku === sku);
  }

  updateVariant(id: string, updates: Partial<Omit<ProductVariant, 'id' | 'productId' | 'createdAt'>>): ProductVariant | null {
    const variant = this.variants.get(id);
    if (!variant) return null;

    const updatedVariant: ProductVariant = {
      ...variant,
      ...updates,
      id: variant.id,
      productId: variant.productId,
      createdAt: variant.createdAt,
      updatedAt: new Date(),
    };

    ProductVariantSchema.parse(updatedVariant);
    this.variants.set(id, updatedVariant);

    // Update product
    const product = this.products.get(variant.productId);
    if (product) {
      const index = product.variants.findIndex((v) => v.id === id);
      if (index !== -1) {
        product.variants[index] = updatedVariant;
        product.updatedAt = new Date();
      }
    }

    return updatedVariant;
  }

  deleteVariant(id: string): boolean {
    const variant = this.variants.get(id);
    if (!variant) return false;

    const product = this.products.get(variant.productId);
    if (product) {
      product.variants = product.variants.filter((v) => v.id !== id);
      product.updatedAt = new Date();
    }

    return this.variants.delete(id);
  }

  // Product Search
  searchProducts(filters: Partial<SearchFilters> = {}): SearchResults {
    const validatedFilters = SearchFiltersSchema.parse(filters);
    let results = Array.from(this.products.values());

    // Filter by query
    if (validatedFilters.query) {
      const query = validatedFilters.query.toLowerCase();
      results = results.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query) ||
          p.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    // Filter by category
    if (validatedFilters.categoryIds && validatedFilters.categoryIds.length > 0) {
      results = results.filter((p) => validatedFilters.categoryIds!.includes(p.categoryId));
    }

    // Filter by brand
    if (validatedFilters.brand) {
      results = results.filter((p) => p.brand === validatedFilters.brand);
    }

    // Filter by tags
    if (validatedFilters.tags && validatedFilters.tags.length > 0) {
      results = results.filter((p) =>
        validatedFilters.tags!.some((tag) => p.tags.includes(tag))
      );
    }

    // Filter by price range
    if (validatedFilters.minPrice !== undefined) {
      results = results.filter((p) => p.price >= validatedFilters.minPrice!);
    }
    if (validatedFilters.maxPrice !== undefined) {
      results = results.filter((p) => p.price <= validatedFilters.maxPrice!);
    }

    // Filter by active status
    if (validatedFilters.active !== undefined) {
      results = results.filter((p) => p.active === validatedFilters.active);
    }

    // Filter by featured
    if (validatedFilters.featured !== undefined) {
      results = results.filter((p) => p.featured === validatedFilters.featured);
    }

    // Filter by stock
    if (validatedFilters.inStock !== undefined) {
      results = results.filter((p) => {
        if (p.variants.length > 0) {
          return p.variants.some((v) => v.available && v.stock > 0);
        }
        return p.active;
      });
    }

    // Filter by attributes
    if (validatedFilters.attributes) {
      results = results.filter((p) => {
        if (!p.attributes) return false;
        return Object.entries(validatedFilters.attributes!).every(
          ([key, value]) => p.attributes![key] === value
        );
      });
    }

    // Sort
    if (validatedFilters.sortBy) {
      results.sort((a, b) => {
        let comparison = 0;
        switch (validatedFilters.sortBy) {
          case 'name':
            comparison = a.name.localeCompare(b.name);
            break;
          case 'price':
            comparison = a.price - b.price;
            break;
          case 'createdAt':
            comparison = a.createdAt.getTime() - b.createdAt.getTime();
            break;
          case 'popularity':
            // Placeholder - would need actual popularity data
            comparison = 0;
            break;
        }
        return validatedFilters.sortOrder === 'desc' ? -comparison : comparison;
      });
    }

    const total = results.length;
    const offset = validatedFilters.offset || 0;
    const limit = validatedFilters.limit || 20;

    const paginatedResults = results.slice(offset, offset + limit);

    return {
      products: paginatedResults,
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
    };
  }

  // Utility Methods
  getProductsByCategory(categoryId: string): Product[] {
    return Array.from(this.products.values()).filter((p) => p.categoryId === categoryId);
  }

  getFeaturedProducts(limit = 10): Product[] {
    return Array.from(this.products.values())
      .filter((p) => p.featured && p.active)
      .slice(0, limit);
  }

  getRelatedProducts(productId: string, limit = 4): Product[] {
    const product = this.products.get(productId);
    if (!product) return [];

    return Array.from(this.products.values())
      .filter((p) => p.id !== productId && p.categoryId === product.categoryId && p.active)
      .slice(0, limit);
  }

  getTotalProductCount(): number {
    return this.products.size;
  }

  clearAll(): void {
    this.products.clear();
    this.variants.clear();
  }
}
