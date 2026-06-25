import {
  Category,
  CategorySchema,
} from './types.js';

export class CategoryManager {
  private categories: Map<string, Category> = new Map();

  private generateId(): string {
    return `cat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Category Management
  createCategory(category: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>): Category {
    const newCategory: Category = {
      ...category,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    CategorySchema.parse(newCategory);
    this.categories.set(newCategory.id, newCategory);

    return newCategory;
  }

  getCategory(id: string): Category | undefined {
    return this.categories.get(id);
  }

  getCategoryBySlug(slug: string): Category | undefined {
    return Array.from(this.categories.values()).find((c) => c.slug === slug);
  }

  getAllCategories(): Category[] {
    return Array.from(this.categories.values());
  }

  updateCategory(id: string, updates: Partial<Omit<Category, 'id' | 'createdAt'>>): Category | null {
    const category = this.categories.get(id);
    if (!category) return null;

    const updatedCategory: Category = {
      ...category,
      ...updates,
      id: category.id,
      createdAt: category.createdAt,
      updatedAt: new Date(),
    };

    CategorySchema.parse(updatedCategory);
    this.categories.set(id, updatedCategory);

    return updatedCategory;
  }

  deleteCategory(id: string): boolean {
    return this.categories.delete(id);
  }

  // Category Hierarchy
  getSubcategories(parentId: string): Category[] {
    return Array.from(this.categories.values()).filter((c) => c.parentId === parentId);
  }

  getParentCategory(categoryId: string): Category | undefined {
    const category = this.categories.get(categoryId);
    if (!category || !category.parentId) return undefined;
    return this.categories.get(category.parentId);
  }

  getCategoryPath(categoryId: string): Category[] {
    const path: Category[] = [];
    let current = this.categories.get(categoryId);

    while (current) {
      path.unshift(current);
      current = current.parentId ? this.categories.get(current.parentId) : undefined;
    }

    return path;
  }

  getCategoryTree(): CategoryTree[] {
    const rootCategories = Array.from(this.categories.values()).filter((c) => !c.parentId);
    return rootCategories.map((cat) => this.buildCategoryTree(cat));
  }

  private buildCategoryTree(category: Category): CategoryTree {
    const children = this.getSubcategories(category.id).map((child) =>
      this.buildCategoryTree(child)
    );

    return {
      ...category,
      children,
    };
  }

  // Utility Methods
  getActiveCategories(): Category[] {
    return Array.from(this.categories.values()).filter((c) => c.active);
  }

  clearAll(): void {
    this.categories.clear();
  }
}

// Category Tree Type (includes children)
export interface CategoryTree extends Category {
  children: CategoryTree[];
}
