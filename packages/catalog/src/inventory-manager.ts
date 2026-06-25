import {
  InventoryRecord,
  InventoryStatus,
  InventoryRecordSchema,
  InventoryStatusSchema,
} from './types.js';

export class InventoryManager {
  private records: Map<string, InventoryRecord> = new Map();
  private stock: Map<string, number> = new Map(); // productId/variantId -> quantity
  private reserved: Map<string, number> = new Map(); // productId/variantId -> reserved quantity

  private generateId(): string {
    return `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getStockKey(productId: string, variantId?: string): string {
    return variantId ? `${productId}:${variantId}` : productId;
  }

  // Inventory Records
  createRecord(record: Omit<InventoryRecord, 'id' | 'createdAt'>): InventoryRecord {
    const newRecord: InventoryRecord = {
      ...record,
      id: this.generateId(),
      createdAt: new Date(),
    };

    InventoryRecordSchema.parse(newRecord);
    this.records.set(newRecord.id, newRecord);

    // Update stock
    const key = this.getStockKey(record.productId, record.variantId);
    const currentStock = this.stock.get(key) || 0;
    this.stock.set(key, currentStock + record.quantity);

    return newRecord;
  }

  getRecord(id: string): InventoryRecord | undefined {
    return this.records.get(id);
  }

  getRecordsByProduct(productId: string): InventoryRecord[] {
    return Array.from(this.records.values()).filter((r) => r.productId === productId);
  }

  getRecordsByVariant(variantId: string): InventoryRecord[] {
    return Array.from(this.records.values()).filter((r) => r.variantId === variantId);
  }

  getAllRecords(): InventoryRecord[] {
    return Array.from(this.records.values());
  }

  // Stock Management
  getStock(productId: string, variantId?: string): number {
    const key = this.getStockKey(productId, variantId);
    return this.stock.get(key) || 0;
  }

  setStock(productId: string, quantity: number, variantId?: string): void {
    const key = this.getStockKey(productId, variantId);
    this.stock.set(key, quantity);
  }

  adjustStock(productId: string, quantity: number, variantId?: string, reason?: string): InventoryRecord {
    const key = this.getStockKey(productId, variantId);
    const currentStock = this.stock.get(key) || 0;
    const newStock = currentStock + quantity;

    this.stock.set(key, newStock);

    return this.createRecord({
      productId,
      variantId,
      quantity,
      reason: (reason || 'adjustment') as any,
    });
  }

  reserveStock(productId: string, quantity: number, variantId?: string): boolean {
    const key = this.getStockKey(productId, variantId);
    const currentStock = this.stock.get(key) || 0;
    const currentReserved = this.reserved.get(key) || 0;
    const available = currentStock - currentReserved;

    if (available < quantity) {
      return false;
    }

    this.reserved.set(key, currentReserved + quantity);
    return true;
  }

  releaseReservedStock(productId: string, quantity: number, variantId?: string): void {
    const key = this.getStockKey(productId, variantId);
    const currentReserved = this.reserved.get(key) || 0;
    this.reserved.set(key, Math.max(0, currentReserved - quantity));
  }

  commitReservedStock(productId: string, quantity: number, variantId?: string): InventoryRecord {
    const key = this.getStockKey(productId, variantId);
    const currentReserved = this.reserved.get(key) || 0;
    this.reserved.set(key, Math.max(0, currentReserved - quantity));

    return this.createRecord({
      productId,
      variantId,
      quantity: -quantity,
      reason: 'sale',
    });
  }

  // Inventory Status
  getInventoryStatus(productId: string, variantId?: string, lowStockThreshold = 10): InventoryStatus {
    const key = this.getStockKey(productId, variantId);
    const stock = this.stock.get(key) || 0;
    const reserved = this.reserved.get(key) || 0;
    const available = stock - reserved;

    return {
      productId,
      variantId,
      available: available > 0,
      stock,
      lowStock: stock > 0 && stock <= lowStockThreshold,
      outOfStock: stock === 0,
      reserved,
    };
  }

  getLowStockProducts(threshold = 10): Array<{ productId: string; variantId?: string; stock: number }> {
    const lowStock: Array<{ productId: string; variantId?: string; stock: number }> = [];

    this.stock.forEach((stock, key) => {
      if (stock > 0 && stock <= threshold) {
        const [productId, variantId] = key.split(':');
        lowStock.push({ productId, variantId, stock });
      }
    });

    return lowStock;
  }

  getOutOfStockProducts(): Array<{ productId: string; variantId?: string }> {
    const outOfStock: Array<{ productId: string; variantId?: string }> = [];

    this.stock.forEach((stock, key) => {
      if (stock === 0) {
        const [productId, variantId] = key.split(':');
        outOfStock.push({ productId, variantId });
      }
    });

    return outOfStock;
  }

  // Stock Transfers
  transferStock(
    productId: string,
    fromLocation: string,
    toLocation: string,
    quantity: number,
    variantId?: string
  ): { fromRecord: InventoryRecord; toRecord: InventoryRecord } {
    const fromRecord = this.createRecord({
      productId,
      variantId,
      quantity: -quantity,
      location: fromLocation,
      reason: 'transfer',
    });

    const toRecord = this.createRecord({
      productId,
      variantId,
      quantity,
      location: toLocation,
      reason: 'transfer',
    });

    return { fromRecord, toRecord };
  }

  // Utility Methods
  clearAll(): void {
    this.records.clear();
    this.stock.clear();
    this.reserved.clear();
  }
}
