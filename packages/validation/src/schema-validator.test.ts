/**
 * Tests for schema validators
 */

import { describe, it, expect } from 'vitest';
import {
  StringSchema,
  NumberSchema,
  BooleanSchema,
  ArraySchema,
  ObjectSchema,
  UnionSchema,
  LiteralSchema,
  OptionalSchema,
  NullableSchema,
  ValidationErrorException,
} from './schema-validator';

describe('StringSchema', () => {
  it('validates a valid string', () => {
    const schema = new StringSchema();
    const result = schema.validate('hello');
    expect(result.success).toBe(true);
    expect(result.data).toBe('hello');
  });

  it('rejects non-string values', () => {
    const schema = new StringSchema();
    const result = schema.validate(123);
    expect(result.success).toBe(false);
    expect(result.errors?.[0].code).toBe('invalid_type');
  });

  it('validates minimum length', () => {
    const schema = new StringSchema().minLength(5);
    const result = schema.validate('hi');
    expect(result.success).toBe(false);
    expect(result.errors?.[0].code).toBe('too_small');
  });

  it('validates maximum length', () => {
    const schema = new StringSchema().maxLength(5);
    const result = schema.validate('hello world');
    expect(result.success).toBe(false);
    expect(result.errors?.[0].code).toBe('too_large');
  });

  it('validates pattern', () => {
    const schema = new StringSchema().pattern(/^[a-z]+$/);
    const result = schema.validate('Hello123');
    expect(result.success).toBe(false);
    expect(result.errors?.[0].code).toBe('invalid_string');
  });

  it('supports custom validators', () => {
    const schema = new StringSchema().custom((value) => {
      return value.startsWith('test') || 'Must start with test';
    });
    const result = schema.validate('invalid');
    expect(result.success).toBe(false);
    expect(result.errors?.[0].message).toBe('Must start with test');
  });

  it('chains validators', () => {
    const schema = new StringSchema()
      .minLength(3)
      .maxLength(10)
      .pattern(/^[a-z]+$/);
    
    const result = schema.validate('abc');
    expect(result.success).toBe(true);
  });
});

describe('NumberSchema', () => {
  it('validates a valid number', () => {
    const schema = new NumberSchema();
    const result = schema.validate(42);
    expect(result.success).toBe(true);
    expect(result.data).toBe(42);
  });

  it('rejects non-number values', () => {
    const schema = new NumberSchema();
    const result = schema.validate('42');
    expect(result.success).toBe(false);
    expect(result.errors?.[0].code).toBe('invalid_type');
  });

  it('rejects NaN', () => {
    const schema = new NumberSchema();
    const result = schema.validate(NaN);
    expect(result.success).toBe(false);
  });

  it('validates minimum value', () => {
    const schema = new NumberSchema().min(10);
    const result = schema.validate(5);
    expect(result.success).toBe(false);
    expect(result.errors?.[0].code).toBe('too_small');
  });

  it('validates maximum value', () => {
    const schema = new NumberSchema().max(10);
    const result = schema.validate(15);
    expect(result.success).toBe(false);
    expect(result.errors?.[0].code).toBe('too_large');
  });

  it('validates integer constraint', () => {
    const schema = new NumberSchema().integer();
    const result = schema.validate(3.14);
    expect(result.success).toBe(false);
    expect(result.errors?.[0].code).toBe('not_integer');
  });

  it('validates positive constraint', () => {
    const schema = new NumberSchema().positive();
    const result = schema.validate(-5);
    expect(result.success).toBe(false);
    expect(result.errors?.[0].code).toBe('not_positive');
  });

  it('supports custom validators', () => {
    const schema = new NumberSchema().custom((value) => {
      return value % 2 === 0 || 'Must be even';
    });
    const result = schema.validate(3);
    expect(result.success).toBe(false);
    expect(result.errors?.[0].message).toBe('Must be even');
  });
});

describe('BooleanSchema', () => {
  it('validates true', () => {
    const schema = new BooleanSchema();
    const result = schema.validate(true);
    expect(result.success).toBe(true);
    expect(result.data).toBe(true);
  });

  it('validates false', () => {
    const schema = new BooleanSchema();
    const result = schema.validate(false);
    expect(result.success).toBe(true);
    expect(result.data).toBe(false);
  });

  it('rejects non-boolean values', () => {
    const schema = new BooleanSchema();
    const result = schema.validate('true');
    expect(result.success).toBe(false);
    expect(result.errors?.[0].code).toBe('invalid_type');
  });
});

describe('ArraySchema', () => {
  it('validates a valid array', () => {
    const schema = new ArraySchema(new StringSchema());
    const result = schema.validate(['a', 'b', 'c']);
    expect(result.success).toBe(true);
    expect(result.data).toEqual(['a', 'b', 'c']);
  });

  it('rejects non-array values', () => {
    const schema = new ArraySchema(new StringSchema());
    const result = schema.validate('not an array');
    expect(result.success).toBe(false);
    expect(result.errors?.[0].code).toBe('invalid_type');
  });

  it('validates array items', () => {
    const schema = new ArraySchema(new NumberSchema());
    const result = schema.validate([1, 2, 'invalid']);
    expect(result.success).toBe(false);
  });

  it('validates minimum length', () => {
    const schema = new ArraySchema(new StringSchema()).minLength(3);
    const result = schema.validate(['a', 'b']);
    expect(result.success).toBe(false);
    expect(result.errors?.[0].code).toBe('too_small');
  });

  it('validates maximum length', () => {
    const schema = new ArraySchema(new StringSchema()).maxLength(2);
    const result = schema.validate(['a', 'b', 'c']);
    expect(result.success).toBe(false);
    expect(result.errors?.[0].code).toBe('too_large');
  });

  it('validates unique items', () => {
    const schema = new ArraySchema(new StringSchema()).unique();
    const result = schema.validate(['a', 'b', 'a']);
    expect(result.success).toBe(false);
    expect(result.errors?.[0].code).toBe('not_unique');
  });
});

describe('ObjectSchema', () => {
  it('validates a valid object', () => {
    const schema = new ObjectSchema({
      name: { required: true, validator: new StringSchema() },
      age: { required: true, validator: new NumberSchema() },
    });
    
    const result = schema.validate({ name: 'John', age: 30 });
    expect(result.success).toBe(true);
    expect(result.data).toEqual({ name: 'John', age: 30 });
  });

  it('rejects non-object values', () => {
    const schema = new ObjectSchema({});
    const result = schema.validate('not an object');
    expect(result.success).toBe(false);
    expect(result.errors?.[0].code).toBe('invalid_type');
  });

  it('validates required fields', () => {
    const schema = new ObjectSchema({
      name: { required: true, validator: new StringSchema() },
    });
    
    const result = schema.validate({});
    expect(result.success).toBe(false);
    expect(result.errors?.[0].code).toBe('invalid_type');
  });

  it('uses default values', () => {
    const schema = new ObjectSchema({
      name: { required: false, default: 'Anonymous' },
    });
    
    const result = schema.validate({});
    expect(result.success).toBe(true);
    expect(result.data).toEqual({ name: 'Anonymous' });
  });

  it('validates in strict mode', () => {
    const schema = new ObjectSchema({
      name: { required: true, validator: new StringSchema() },
    }).strict();
    
    const result = schema.validate({ name: 'John', extra: 'field' });
    expect(result.success).toBe(false);
    expect(result.errors?.[0].code).toBe('unrecognized_keys');
  });

  it('allows extra fields in non-strict mode', () => {
    const schema = new ObjectSchema({
      name: { required: true, validator: new StringSchema() },
    });
    
    const result = schema.validate({ name: 'John', extra: 'field' });
    expect(result.success).toBe(true);
  });
});

describe('UnionSchema', () => {
  it('validates with first matching schema', () => {
    const schema = new UnionSchema([
      new StringSchema(),
      new NumberSchema(),
    ]);
    
    const result = schema.validate('hello');
    expect(result.success).toBe(true);
    expect(result.data).toBe('hello');
  });

  it('validates with second matching schema', () => {
    const schema = new UnionSchema([
      new StringSchema(),
      new NumberSchema(),
    ]);
    
    const result = schema.validate(42);
    expect(result.success).toBe(true);
    expect(result.data).toBe(42);
  });

  it('rejects when no schema matches', () => {
    const schema = new UnionSchema([
      new StringSchema(),
      new NumberSchema(),
    ]);
    
    const result = schema.validate(true);
    expect(result.success).toBe(false);
    expect(result.errors?.[0].code).toBe('invalid_union');
  });
});

describe('LiteralSchema', () => {
  it('validates exact string match', () => {
    const schema = new LiteralSchema('hello');
    const result = schema.validate('hello');
    expect(result.success).toBe(true);
    expect(result.data).toBe('hello');
  });

  it('validates exact number match', () => {
    const schema = new LiteralSchema(42);
    const result = schema.validate(42);
    expect(result.success).toBe(true);
    expect(result.data).toBe(42);
  });

  it('validates exact boolean match', () => {
    const schema = new LiteralSchema(true);
    const result = schema.validate(true);
    expect(result.success).toBe(true);
    expect(result.data).toBe(true);
  });

  it('rejects non-matching values', () => {
    const schema = new LiteralSchema('hello');
    const result = schema.validate('world');
    expect(result.success).toBe(false);
    expect(result.errors?.[0].code).toBe('invalid_literal');
  });
});

describe('OptionalSchema', () => {
  it('validates present values', () => {
    const schema = new OptionalSchema(new StringSchema());
    const result = schema.validate('hello');
    expect(result.success).toBe(true);
    expect(result.data).toBe('hello');
  });

  it('accepts undefined', () => {
    const schema = new OptionalSchema(new StringSchema());
    const result = schema.validate(undefined);
    expect(result.success).toBe(true);
    expect(result.data).toBe(undefined);
  });

  it('accepts null', () => {
    const schema = new OptionalSchema(new StringSchema());
    const result = schema.validate(null);
    expect(result.success).toBe(true);
    expect(result.data).toBe(undefined);
  });
});

describe('NullableSchema', () => {
  it('validates present values', () => {
    const schema = new NullableSchema(new StringSchema());
    const result = schema.validate('hello');
    expect(result.success).toBe(true);
    expect(result.data).toBe('hello');
  });

  it('accepts null', () => {
    const schema = new NullableSchema(new StringSchema());
    const result = schema.validate(null);
    expect(result.success).toBe(true);
    expect(result.data).toBe(null);
  });

  it('rejects undefined', () => {
    const schema = new NullableSchema(new StringSchema());
    const result = schema.validate(undefined);
    expect(result.success).toBe(false);
  });
});

describe('parse and safeParse', () => {
  it('parse throws on invalid data', () => {
    const schema = new StringSchema();
    expect(() => schema.parse(123)).toThrow(ValidationErrorException);
  });

  it('parse returns data on success', () => {
    const schema = new StringSchema();
    const result = schema.parse('hello');
    expect(result).toBe('hello');
  });

  it('safeParse returns result object', () => {
    const schema = new StringSchema();
    const result = schema.safeParse('hello');
    expect(result.success).toBe(true);
    expect(result.data).toBe('hello');
  });

  it('safeParse returns errors on failure', () => {
    const schema = new StringSchema();
    const result = schema.safeParse(123);
    expect(result.success).toBe(false);
    expect(result.errors).toBeDefined();
  });
});
