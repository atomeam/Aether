/**
 * Migration system for database schema management
 */

import type { IMigrationRunner, MigrationStatus, Migration, MigrationOptions } from '../types/index';
import type { IDatabase } from '../types/index';
import { v4 as uuidv4 } from 'uuid';

export class MigrationRunner implements IMigrationRunner {
  private database: IDatabase;
  private options: Required<MigrationOptions>;

  constructor(database: IDatabase, options?: MigrationOptions) {
    this.database = database;
    this.options = {
      table: options?.table || 'migrations',
      directory: options?.directory || './migrations',
    };
  }

  async up(): Promise<void> {
    await this.ensureMigrationTable();
    const pending = await this.getPending();

    for (const migrationId of pending) {
      const migration = await this.loadMigration(migrationId);
      await this.applyMigration(migration);
    }
  }

  async down(): Promise<void> {
    await this.ensureMigrationTable();
    const applied = await this.getApplied();

    if (applied.length === 0) {
      return;
    }

    const lastMigrationId = applied[applied.length - 1];
    const migration = await this.loadMigration(lastMigrationId);
    await this.revertMigration(migration);
  }

  async status(): Promise<MigrationStatus[]> {
    await this.ensureMigrationTable();
    const applied = await this.getApplied();
    const allMigrations = await this.getAllMigrations();

    return allMigrations.map(migration => ({
      id: migration.id,
      name: migration.name,
      applied: applied.includes(migration.id),
      appliedAt: applied.includes(migration.id) ? migration.appliedAt : undefined,
    }));
  }

  async create(name: string): Promise<string> {
    const id = uuidv4();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${timestamp}-${name}.sql`;
    const content = this.generateMigrationTemplate(name, id);

    // In a real implementation, this would write to a file
    // For now, we'll return the content
    return content;
  }

  async getApplied(): Promise<string[]> {
    try {
      const result = await this.database.query<{ id: string }>(
        `SELECT id FROM ${this.options.table} ORDER BY applied_at ASC`,
      );
      return result.rows.map(row => row.id);
    } catch (error) {
      return [];
    }
  }

  async getPending(): Promise<string[]> {
    const applied = await this.getApplied();
    const allMigrations = await this.getAllMigrations();
    return allMigrations.filter(m => !applied.includes(m.id)).map(m => m.id);
  }

  private async ensureMigrationTable(): Promise<void> {
    const createTableSql = `
      CREATE TABLE IF NOT EXISTS ${this.options.table} (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `;

    try {
      await this.database.query(createTableSql);
    } catch (error) {
      // Table might already exist
    }
  }

  private async applyMigration(migration: Migration): Promise<void> {
    await this.database.query(migration.up);

    const insertSql = `
      INSERT INTO ${this.options.table} (id, name, applied_at)
      VALUES ($1, $2, CURRENT_TIMESTAMP)
    `;

    await this.database.query(insertSql, [migration.id, migration.name]);
  }

  private async revertMigration(migration: Migration): Promise<void> {
    await this.database.query(migration.down);

    const deleteSql = `DELETE FROM ${this.options.table} WHERE id = $1`;
    await this.database.query(deleteSql, [migration.id]);
  }

  private async loadMigration(id: string): Promise<Migration> {
    // In a real implementation, this would load from a file
    // For now, we'll return a mock migration
    return {
      id,
      name: 'mock-migration',
      up: '-- UP SQL',
      down: '-- DOWN SQL',
    };
  }

  private async getAllMigrations(): Promise<Migration[]> {
    // In a real implementation, this would scan the migration directory
    // For now, we'll return migrations from the database
    const result = await this.database.query<{ id: string; name: string; applied_at: string }>(
      `SELECT id, name, applied_at FROM ${this.options.table} ORDER BY applied_at ASC`,
    );

    return result.rows.map(row => ({
      id: row.id,
      name: row.name,
      up: '-- UP SQL',
      down: '-- DOWN SQL',
      appliedAt: new Date(row.applied_at),
    }));
  }

  private generateMigrationTemplate(name: string, id: string): string {
    return `-- Migration: ${name}
-- ID: ${id}
-- Created: ${new Date().toISOString()}

-- UP
-- Add your migration SQL here

-- DOWN
-- Add your rollback SQL here
`;
  }
}
