/**
 * Tests for business rule validators
 */

import { describe, it, expect } from 'vitest';
import {
  BusinessRuleValidatorSchema,
  AsyncValidatorSchema,
  CustomValidatorBuilder,
  CommonBusinessRules,
  CommonAsyncValidators,
} from './business-rule-validator';

describe('BusinessRuleValidatorSchema', () => {
  it('validates with no rules', () => {
    const schema = new BusinessRuleValidatorSchema<string>();
    const result = schema.validate('hello');
    expect(result.success).toBe(true);
  });

  it('validates with a passing rule', () => {
    const schema = new BusinessRuleValidatorSchema<string>();
    schema.addRule((value) => value.length > 3);
    
    const result = schema.validate('hello');
    expect(result.success).toBe(true);
  });

  it('fails with a failing rule', () => {
    const schema = new BusinessRuleValidatorSchema<string>();
    schema.addRule((value) => value.length > 10);
    
    const result = schema.validate('hello');
    expect(result.success).toBe(false);
    expect(result.errors?.[0].code).toBe('business_rule_failed');
  });

  it('uses custom error message from rule', () => {
    const schema = new BusinessRuleValidatorSchema<string>();
    schema.addRule((value) => value.length > 10 || 'Too short');
    
    const result = schema.validate('hello');
    expect(result.success).toBe(false);
    expect(result.errors?.[0].message).toBe('Too short');
  });

  it('validates with multiple rules', () => {
    const schema = new BusinessRuleValidatorSchema<string>();
    schema.addRule((value) => value.length > 3);
    schema.addRule((value) => value.length < 20);
    schema.addRule((value) => /^[a-z]+$/.test(value));
    
    const result = schema.validate('hello');
    expect(result.success).toBe(true);
  });

  it('fails on first rule with abortEarly', () => {
    const schema = new BusinessRuleValidatorSchema<string>({ abortEarly: true });
    schema.addRule((value) => value.length > 10 || 'Too short');
    schema.addRule((value) => /^[a-z]+$/.test(value) || 'Invalid chars');
    
    const result = schema.validate('hello');
    expect(result.success).toBe(false);
    expect(result.errors?.length).toBe(1);
  });

  it('fails on all rules without abortEarly', () => {
    const schema = new BusinessRuleValidatorSchema<string>({ abortEarly: false });
    schema.addRule((value) => value.length > 10 || 'Too short');
    schema.addRule((value) => /^[a-z]+$/.test(value) || 'Invalid chars');
    
    const result = schema.validate('hello123');
    expect(result.success).toBe(false);
    expect(result.errors?.length).toBe(2);
  });
});

describe('AsyncValidatorSchema', () => {
  it('validates async with no validators', async () => {
    const schema = new AsyncValidatorSchema<string>();
    const result = await schema.validateAsync('hello');
    expect(result.success).toBe(true);
  });

  it('validates async with passing validator', async () => {
    const schema = new AsyncValidatorSchema<string>();
    schema.addValidator(async (value) => value.length > 3);
    
    const result = await schema.validateAsync('hello');
    expect(result.success).toBe(true);
  });

  it('fails async with failing validator', async () => {
    const schema = new AsyncValidatorSchema<string>();
    schema.addValidator(async (value) => value.length > 10 || 'Too short');
    
    const result = await schema.validateAsync('hello');
    expect(result.success).toBe(false);
    expect(result.errors?.[0].code).toBe('async_validation_failed');
  });

  it('supports async parse', async () => {
    const schema = new AsyncValidatorSchema<string>();
    schema.addValidator(async (value) => value.length > 3);
    
    const result = await schema.parseAsync('hello');
    expect(result).toBe('hello');
  });

  it('async parse throws on failure', async () => {
    const schema = new AsyncValidatorSchema<string>();
    schema.addValidator(async (value) => value.length > 10);
    
    await expect(schema.parseAsync('hello')).rejects.toThrow();
  });

  it('safeParseAsync returns result', async () => {
    const schema = new AsyncValidatorSchema<string>();
    schema.addValidator(async (value) => value.length > 3);
    
    const result = await schema.safeParseAsync('hello');
    expect(result.success).toBe(true);
  });
});

describe('CustomValidatorBuilder', () => {
  it('builds a validator with single rule', () => {
    const builder = new CustomValidatorBuilder<string>();
    builder.addValidator('minLength', (value) => value.length > 3, 'Too short');
    
    const schema = builder.build();
    const result = schema.validate('hi');
    
    expect(result.success).toBe(false);
    expect(result.errors?.[0].message).toBe('Too short');
  });

  it('builds a validator with multiple rules', () => {
    const builder = new CustomValidatorBuilder<string>();
    builder.addValidator('minLength', (value) => value.length > 3, 'Too short');
    builder.addValidator('maxLength', (value) => value.length < 20, 'Too long');
    
    const schema = builder.build();
    const result = schema.validate('hello');
    
    expect(result.success).toBe(true);
  });

  it('uses config object', () => {
    const builder = new CustomValidatorBuilder<string>();
    builder.add({
      name: 'custom',
      validate: (value) => value.startsWith('test'),
      message: 'Must start with test',
    });
    
    const schema = builder.build();
    const result = schema.validate('invalid');
    
    expect(result.success).toBe(false);
    expect(result.errors?.[0].message).toBe('Must start with test');
  });
});

describe('CommonBusinessRules', () => {
  it('validates email', () => {
    expect(CommonBusinessRules.email('test@example.com')).toBe(true);
    expect(CommonBusinessRules.email('invalid')).toBe(false);
  });

  it('validates URL', () => {
    expect(CommonBusinessRules.url('https://example.com')).toBe(true);
    expect(CommonBusinessRules.url('not-a-url')).toBe(false);
  });

  it('validates UUID', () => {
    expect(CommonBusinessRules.uuid('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
    expect(CommonBusinessRules.uuid('not-a-uuid')).toBe(false);
  });

  it('validates credit card (Luhn algorithm)', () => {
    // Valid test card number
    expect(CommonBusinessRules.creditCard('4532015112830366')).toBe(true);
    expect(CommonBusinessRules.creditCard('1234567890123456')).toBe(false);
  });

  it('validates phone number', () => {
    expect(CommonBusinessRules.phoneNumber('+1 (555) 123-4567')).toBe(true);
    expect(CommonBusinessRules.phoneNumber('123')).toBe(false);
  });

  it('validates ISO date', () => {
    expect(CommonBusinessRules.isoDate('2024-01-01T00:00:00Z')).toBe(true);
    expect(CommonBusinessRules.isoDate('not-a-date')).toBe(false);
  });

  it('validates strong password', () => {
    expect(CommonBusinessRules.strongPassword('StrongP@ss1')).toBe(true);
    expect(CommonBusinessRules.strongPassword('weak')).toBe(false);
  });

  it('validates username', () => {
    expect(CommonBusinessRules.username('user_123')).toBe(true);
    expect(CommonBusinessRules.username('user@123')).toBe(false);
  });

  it('validates hex color', () => {
    expect(CommonBusinessRules.hexColor('#ffffff')).toBe(true);
    expect(CommonBusinessRules.hexColor('#fff')).toBe(true);
    expect(CommonBusinessRules.hexColor('white')).toBe(false);
  });

  it('validates IPv4', () => {
    expect(CommonBusinessRules.ipv4('192.168.1.1')).toBe(true);
    expect(CommonBusinessRules.ipv4('256.256.256.256')).toBe(false);
  });

  it('validates IPv6', () => {
    expect(CommonBusinessRules.ipv6('2001:0db8:85a3:0000:0000:8a2e:0370:7334')).toBe(true);
    expect(CommonBusinessRules.ipv6('not-ipv6')).toBe(false);
  });
});

describe('CommonAsyncValidators', () => {
  it('existsInDatabase validator', async () => {
    const checkFn = async (value: string) => value === 'exists';
    const validator = CommonAsyncValidators.existsInDatabase(checkFn);
    
    const result1 = await validator('exists');
    expect(result1).toBe(true);
    
    const result2 = await validator('not-exists');
    expect(result2).toBe('Value does not exist in database');
  });

  it('isUnique validator', async () => {
    const checkFn = async (value: string) => value !== 'duplicate';
    const validator = CommonAsyncValidators.isUnique(checkFn);
    
    const result1 = await validator('unique');
    expect(result1).toBe(true);
    
    const result2 = await validator('duplicate');
    expect(result2).toBe('Value must be unique');
  });

  it('externalValidation validator', async () => {
    const validateFn = async (value: string) => {
      return value === 'valid' || 'External validation failed';
    };
    const validator = CommonAsyncValidators.externalValidation(validateFn);
    
    const result1 = await validator('valid');
    expect(result1).toBe(true);
    
    const result2 = await validator('invalid');
    expect(result2).toBe('External validation failed');
  });
});
