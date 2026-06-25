/**
 * Tests for query builder
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { QueryBuilder } from '../src/query-builder';
import { PostgresAdapter } from '../src/adapters/postgresql';

describe('QueryBuilder', () => {
  let builder: QueryBuilder;
  let mockDatabase: PostgresAdapter;

  beforeEach(() => {
    mockDatabase = new PostgresAdapter({
      type: 'postgresql',
      host: 'localhost',
      port: 5432,
      database: 'test',
      username: 'user',
      password: 'pass',
    });
    builder = new QueryBuilder(mockDatabase);
  });

  it('should build basic SELECT query', () => {
    builder.select('*').from('users');
    const sql = builder.build();
    expect(sql).toBe('SELECT * FROM users');
  });

  it('should build SELECT with specific columns', () => {
    builder.select(['id', 'name', 'email']).from('users');
    const sql = builder.build();
    expect(sql).toBe('SELECT id, name, email FROM users');
  });

  it('should build SELECT with WHERE clause', () => {
    builder.select('*').from('users').where({
      column: 'id',
      operator: '=',
      value: 1,
    });
    const sql = builder.build();
    expect(sql).toBe('SELECT * FROM users WHERE id = $1');
    expect(builder.getParams()).toEqual([1]);
  });

  it('should build SELECT with multiple WHERE conditions', () => {
    builder
      .select('*')
      .from('users')
      .where([
        { column: 'id', operator: '=', value: 1 },
        { column: 'name', operator: '=', value: 'John', logical: 'AND' },
      ]);
    const sql = builder.build();
    expect(sql).toBe('SELECT * FROM users WHERE id = $1 AND name = $2');
    expect(builder.getParams()).toEqual([1, 'John']);
  });

  it('should build SELECT with JOIN', () => {
    builder
      .select('*')
      .from('users')
      .join({
        type: 'INNER',
        table: 'posts',
        on: 'users.id = posts.user_id',
      });
    const sql = builder.build();
    expect(sql).toBe('SELECT * FROM users INNER JOIN posts ON users.id = posts.user_id');
  });

  it('should build SELECT with ORDER BY', () => {
    builder.select('*').from('users').orderBy({ column: 'name', direction: 'ASC' });
    const sql = builder.build();
    expect(sql).toBe('SELECT * FROM users ORDER BY name ASC');
  });

  it('should build SELECT with LIMIT', () => {
    builder.select('*').from('users').limit(10);
    const sql = builder.build();
    expect(sql).toBe('SELECT * FROM users LIMIT 10');
  });

  it('should build SELECT with OFFSET', () => {
    builder.select('*').from('users').offset(5);
    const sql = builder.build();
    expect(sql).toBe('SELECT * FROM users OFFSET 5');
  });

  it('should build SELECT with LIMIT and OFFSET', () => {
    builder.select('*').from('users').limit(10).offset(5);
    const sql = builder.build();
    expect(sql).toBe('SELECT * FROM users LIMIT 10 OFFSET 5');
  });

  it('should build SELECT with GROUP BY', () => {
    builder.select('COUNT(*)').from('users').groupBy('department');
    const sql = builder.build();
    expect(sql).toBe('SELECT COUNT(*) FROM users GROUP BY department');
  });

  it('should build complex query', () => {
    builder
      .select(['users.id', 'users.name', 'COUNT(posts.id) as post_count'])
      .from('users')
      .join({
        type: 'LEFT',
        table: 'posts',
        on: 'users.id = posts.user_id',
      })
      .where({ column: 'users.active', operator: '=', value: true })
      .groupBy('users.id')
      .orderBy({ column: 'post_count', direction: 'DESC' })
      .limit(10);

    const sql = builder.build();
    expect(sql).toContain('SELECT users.id, users.name, COUNT(posts.id) as post_count');
    expect(sql).toContain('FROM users');
    expect(sql).toContain('LEFT JOIN posts');
    expect(sql).toContain('WHERE users.active = $1');
    expect(sql).toContain('GROUP BY users.id');
    expect(sql).toContain('ORDER BY post_count DESC');
    expect(sql).toContain('LIMIT 10');
  });

  it('should clone query builder', () => {
    builder.select('*').from('users').where({ column: 'id', operator: '=', value: 1 });
    const cloned = builder.clone();

    cloned.where({ column: 'name', operator: '=', value: 'John', logical: 'AND' });

    expect(builder.build()).toBe('SELECT * FROM users WHERE id = $1');
    expect(cloned.build()).toContain('name = $2');
  });

  it('should throw error when FROM is not set', () => {
    builder.select('*');
    expect(() => builder.build()).toThrow('FROM table is required');
  });
});
