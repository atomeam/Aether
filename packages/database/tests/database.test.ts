/**
 * Tests for database adapters
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PostgresAdapter } from '../src/adapters/postgresql';
import { MysqlAdapter } from '../src/adapters/mysql';
import { SqliteAdapter } from '../src/adapters/sqlite';
import { MongoAdapter } from '../src/adapters/mongodb';
import { DatabaseConfigSchema } from '../src/schemas';

describe('Database Adapters', () => {
  describe('Configuration Validation', () => {
    it('should validate PostgreSQL config', () => {
      const config = {
        type: 'postgresql' as const,
        host: 'localhost',
        port: 5432,
        database: 'test',
        username: 'user',
        password: 'pass',
      };

      const validated = DatabaseConfigSchema.parse(config);
      expect(validated.type).toBe('postgresql');
      expect(validated.database).toBe('test');
    });

    it('should validate MySQL config', () => {
      const config = {
        type: 'mysql' as const,
        host: 'localhost',
        port: 3306,
        database: 'test',
        username: 'user',
        password: 'pass',
      };

      const validated = DatabaseConfigSchema.parse(config);
      expect(validated.type).toBe('mysql');
    });

    it('should validate SQLite config', () => {
      const config = {
        type: 'sqlite' as const,
        database: './test.db',
      };

      const validated = DatabaseConfigSchema.parse(config);
      expect(validated.type).toBe('sqlite');
    });

    it('should validate MongoDB config', () => {
      const config = {
        type: 'mongodb' as const,
        host: 'localhost',
        port: 27017,
        database: 'test',
        username: 'user',
        password: 'pass',
      };

      const validated = DatabaseConfigSchema.parse(config);
      expect(validated.type).toBe('mongodb');
    });

    it('should reject invalid config', () => {
      const config = {
        type: 'invalid' as any,
        database: 'test',
      };

      expect(() => DatabaseConfigSchema.parse(config)).toThrow();
    });
  });

  describe('PostgreSQL Adapter', () => {
    let adapter: PostgresAdapter;

    beforeEach(() => {
      adapter = new PostgresAdapter({
        type: 'postgresql',
        host: 'localhost',
        port: 5432,
        database: 'test',
        username: 'user',
        password: 'pass',
      });
    });

    it('should create adapter instance', () => {
      expect(adapter).toBeInstanceOf(PostgresAdapter);
    });

    it('should return config', () => {
      const config = adapter.getConfig();
      expect(config.type).toBe('postgresql');
      expect(config.database).toBe('test');
    });

    it('should not be connected initially', () => {
      expect(adapter.isConnected()).toBe(false);
    });
  });

  describe('MySQL Adapter', () => {
    let adapter: MysqlAdapter;

    beforeEach(() => {
      adapter = new MysqlAdapter({
        type: 'mysql',
        host: 'localhost',
        port: 3306,
        database: 'test',
        username: 'user',
        password: 'pass',
      });
    });

    it('should create adapter instance', () => {
      expect(adapter).toBeInstanceOf(MysqlAdapter);
    });

    it('should return config', () => {
      const config = adapter.getConfig();
      expect(config.type).toBe('mysql');
    });
  });

  describe('SQLite Adapter', () => {
    let adapter: SqliteAdapter;

    beforeEach(() => {
      adapter = new SqliteAdapter({
        type: 'sqlite',
        database: ':memory:',
      });
    });

    it('should create adapter instance', () => {
      expect(adapter).toBeInstanceOf(SqliteAdapter);
    });

    it('should return config', () => {
      const config = adapter.getConfig();
      expect(config.type).toBe('sqlite');
    });
  });

  describe('MongoDB Adapter', () => {
    let adapter: MongoAdapter;

    beforeEach(() => {
      adapter = new MongoAdapter({
        type: 'mongodb',
        host: 'localhost',
        port: 27017,
        database: 'test',
        username: 'user',
        password: 'pass',
      });
    });

    it('should create adapter instance', () => {
      expect(adapter).toBeInstanceOf(MongoAdapter);
    });

    it('should return config', () => {
      const config = adapter.getConfig();
      expect(config.type).toBe('mongodb');
    });
  });
});
