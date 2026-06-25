/**
 * Database mocking for data persistence
 */

import type { DatabaseMockConfig, QueryResult, DatabaseOperation } from './types.js';
import { DatabaseMockConfigSchema, QueryResultSchema, DatabaseOperationSchema } from './types.js';

export class DatabaseMock {
  private config: DatabaseMockConfig;
  private tables: Map<string, Map<string, any>> = new Map();
  private sequences: Map<string, number> = new Map();
  private queryLog: DatabaseOperation[] = [];

  constructor(config: Partial<DatabaseMockConfig> = {}) {
    this.config = DatabaseMockConfigSchema.parse(config);
  }

  /**
   * Execute a SELECT query
   */
  async select(table: string, where?: Record<string, unknown>): Promise<QueryResult> {
    const operation: DatabaseOperation = { type: 'SELECT', table, where };
    this.logOperation(operation);

    await this.applyDelay();

    const tableData = this.tables.get(table);
    if (!tableData) {
      return { rows: [], rowCount: 0, affectedRows: 0 };
    }

    let rows = Array.from(tableData.values());

    if (where) {
      rows = rows.filter((row) => this.matchesWhere(row, where));
    }

    if (this.config.enableLogging) {
      console.log(`[DatabaseMock] SELECT FROM ${table} WHERE ${JSON.stringify(where)} -> ${rows.length} rows`);
    }

    return QueryResultSchema.parse({
      rows,
      rowCount: rows.length,
      affectedRows: 0,
    });
  }

  /**
   * Execute an INSERT query
   */
  async insert(table: string, data: Record<string, unknown>): Promise<QueryResult> {
    const operation: DatabaseOperation = { type: 'INSERT', table, data };
    this.logOperation(operation);

    await this.applyDelay();

    if (!this.tables.has(table)) {
      this.tables.set(table, new Map());
    }

    const tableData = this.tables.get(table)!;
    const id = this.generateId(table);
    const row = { id, ...data };

    tableData.set(String(id), row);

    if (this.config.enableLogging) {
      console.log(`[DatabaseMock] INSERT INTO ${table} -> id: ${id}`);
    }

    return QueryResultSchema.parse({
      rows: [row],
      rowCount: 1,
      affectedRows: 1,
    });
  }

  /**
   * Execute an UPDATE query
   */
  async update(table: string, data: Record<string, unknown>, where: Record<string, unknown>): Promise<QueryResult> {
    const operation: DatabaseOperation = { type: 'UPDATE', table, data, where };
    this.logOperation(operation);

    await this.applyDelay();

    const tableData = this.tables.get(table);
    if (!tableData) {
      return { rows: [], rowCount: 0, affectedRows: 0 };
    }

    let affectedRows = 0;
    const updatedRows: any[] = [];

    for (const [id, row] of tableData.entries()) {
      if (this.matchesWhere(row, where)) {
        const updated = { ...row, ...data };
        tableData.set(id, updated);
        updatedRows.push(updated);
        affectedRows++;
      }
    }

    if (this.config.enableLogging) {
      console.log(`[DatabaseMock] UPDATE ${table} WHERE ${JSON.stringify(where)} -> ${affectedRows} rows`);
    }

    return QueryResultSchema.parse({
      rows: updatedRows,
      rowCount: updatedRows.length,
      affectedRows,
    });
  }

  /**
   * Execute a DELETE query
   */
  async delete(table: string, where: Record<string, unknown>): Promise<QueryResult> {
    const operation: DatabaseOperation = { type: 'DELETE', table, where };
    this.logOperation(operation);

    await this.applyDelay();

    const tableData = this.tables.get(table);
    if (!tableData) {
      return { rows: [], rowCount: 0, affectedRows: 0 };
    }

    let affectedRows = 0;
    const deletedIds: string[] = [];

    for (const [id, row] of tableData.entries()) {
      if (this.matchesWhere(row, where)) {
        deletedIds.push(id);
        affectedRows++;
      }
    }

    deletedIds.forEach((id) => tableData.delete(id));

    if (this.config.enableLogging) {
      console.log(`[DatabaseMock] DELETE FROM ${table} WHERE ${JSON.stringify(where)} -> ${affectedRows} rows`);
    }

    return QueryResultSchema.parse({
      rows: [],
      rowCount: 0,
      affectedRows,
    });
  }

  /**
   * Execute a raw operation
   */
  async execute(operation: DatabaseOperation): Promise<QueryResult> {
    const validated = DatabaseOperationSchema.parse(operation);

    switch (validated.type) {
      case 'SELECT':
        return this.select(validated.table, validated.where);
      case 'INSERT':
        return this.insert(validated.table, validated.data);
      case 'UPDATE':
        return this.update(validated.table, validated.data, validated.where!);
      case 'DELETE':
        return this.delete(validated.table, validated.where!);
    }
  }

  /**
   * Check if row matches where clause
   */
  private matchesWhere(row: any, where: Record<string, unknown>): boolean {
    for (const [key, value] of Object.entries(where)) {
      if (row[key] !== value) {
        return false;
      }
    }
    return true;
  }

  /**
   * Generate ID for new row
   */
  private generateId(table: string): number {
    const key = `${table}_id`;
    const current = this.sequences.get(key) || 0;
    const next = current + 1;
    this.sequences.set(key, next);
    return next;
  }

  /**
   * Apply configured delay
   */
  private async applyDelay(): Promise<void> {
    if (this.config.delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.config.delay));
    }
  }

  /**
   * Log operation
   */
  private logOperation(operation: DatabaseOperation): void {
    this.queryLog.push(operation);
  }

  /**
   * Get query log
   */
  getQueryLog(): DatabaseOperation[] {
    return [...this.queryLog];
  }

  /**
   * Clear query log
   */
  clearQueryLog(): void {
    this.queryLog = [];
  }

  /**
   * Get all data for a table
   */
  getTableData(table: string): Map<string, any> {
    return this.tables.get(table) || new Map();
  }

  /**
   * Set data for a table
   */
  setTableData(table: string, data: Record<string, any>[]): void {
    const tableData = new Map();
    data.forEach((row) => {
      const id = row.id || this.generateId(table);
      tableData.set(String(id), { id, ...row });
    });
    this.tables.set(table, tableData);
  }

  /**
   * Clear all tables
   */
  clearTables(): void {
    this.tables.clear();
    this.sequences.clear();
  }

  /**
   * Clear a specific table
   */
  clearTable(table: string): void {
    this.tables.delete(table);
    this.sequences.delete(`${table}_id`);
  }

  /**
   * Reset to initial state
   */
  reset(): void {
    this.clearTables();
    this.clearQueryLog();
  }
}

export { DatabaseMockConfig, QueryResult };
