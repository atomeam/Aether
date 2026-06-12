/**
 * Tests for Environment Manager
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { EnvironmentManager, AETHER_ENV_VARIABLES } from '../src/env/manager';
import { writeFileSync, unlinkSync, existsSync } from 'fs';

describe('EnvironmentManager', () => {
  let manager: EnvironmentManager;
  const testEnvPath = '.test.env';

  beforeEach(() => {
    manager = new EnvironmentManager('dev');
  });

  afterEach(() => {
    if (existsSync(testEnvPath)) {
      unlinkSync(testEnvPath);
    }
  });

  describe('constructor', () => {
    it('should create manager with default environment', () => {
      const defaultManager = new EnvironmentManager();
      expect(defaultManager).toBeDefined();
    });

    it('should create manager with specified environment', () => {
      const stagingManager = new EnvironmentManager('staging');
      expect(stagingManager).toBeDefined();
    });
  });

  describe('add', () => {
    it('should add environment variable', () => {
      manager.add({
        name: 'TEST_VAR',
        value: 'test-value',
        required: true,
        description: 'Test variable',
        environment: ['dev'],
        isSecret: false
      });

      expect(manager.get('TEST_VAR')).toBeDefined();
      expect(manager.getValue('TEST_VAR')).toBe('test-value');
    });

    it('should add multiple variables', () => {
      manager.add({
        name: 'VAR1',
        value: 'value1',
        required: true,
        description: 'Variable 1',
        environment: ['dev'],
        isSecret: false
      });

      manager.add({
        name: 'VAR2',
        value: 'value2',
        required: false,
        description: 'Variable 2',
        environment: ['dev'],
        isSecret: true
      });

      expect(manager.count()).toBe(2);
    });
  });

  describe('get', () => {
    it('should return undefined for non-existent variable', () => {
      expect(manager.get('NON_EXISTENT')).toBeUndefined();
    });

    it('should return variable if it exists', () => {
      manager.add({
        name: 'TEST_VAR',
        value: 'test-value',
        required: true,
        description: 'Test variable',
        environment: ['dev'],
        isSecret: false
      });

      const variable = manager.get('TEST_VAR');
      expect(variable).toBeDefined();
      expect(variable?.name).toBe('TEST_VAR');
    });
  });

  describe('getValue', () => {
    it('should return undefined for non-existent variable', () => {
      expect(manager.getValue('NON_EXISTENT')).toBeUndefined();
    });

    it('should return value if variable exists', () => {
      manager.add({
        name: 'TEST_VAR',
        value: 'test-value',
        required: true,
        description: 'Test variable',
        environment: ['dev'],
        isSecret: false
      });

      expect(manager.getValue('TEST_VAR')).toBe('test-value');
    });
  });

  describe('validate', () => {
    it('should return valid when all required variables are set', () => {
      manager.add({
        name: 'REQUIRED_VAR',
        value: 'value',
        required: true,
        description: 'Required variable',
        environment: ['dev'],
        isSecret: false
      });

      const result = manager.validate();
      expect(result.valid).toBe(true);
      expect(result.missing).toHaveLength(0);
    });

    it('should return invalid when required variable is missing', () => {
      manager.add({
        name: 'REQUIRED_VAR',
        value: '',
        required: true,
        description: 'Required variable',
        environment: ['dev'],
        isSecret: false
      });

      const result = manager.validate();
      expect(result.valid).toBe(false);
      expect(result.missing).toContain('REQUIRED_VAR');
    });

    it('should not check optional variables', () => {
      manager.add({
        name: 'OPTIONAL_VAR',
        value: '',
        required: false,
        description: 'Optional variable',
        environment: ['dev'],
        isSecret: false
      });

      const result = manager.validate();
      expect(result.valid).toBe(true);
    });
  });

  describe('getVariablesForEnvironment', () => {
    it('should return variables for specific environment', () => {
      manager.add({
        name: 'DEV_VAR',
        value: 'dev-value',
        required: true,
        description: 'Dev variable',
        environment: ['dev'],
        isSecret: false
      });

      manager.add({
        name: 'PROD_VAR',
        value: 'prod-value',
        required: true,
        description: 'Prod variable',
        environment: ['prod'],
        isSecret: false
      });

      const devVars = manager.getVariablesForEnvironment('dev');
      expect(devVars).toHaveLength(1);
      expect(devVars[0].name).toBe('DEV_VAR');

      const prodVars = manager.getVariablesForEnvironment('prod');
      expect(prodVars).toHaveLength(1);
      expect(prodVars[0].name).toBe('PROD_VAR');
    });

    it('should return variables for multiple environments', () => {
      manager.add({
        name: 'SHARED_VAR',
        value: 'shared-value',
        required: true,
        description: 'Shared variable',
        environment: ['dev', 'staging', 'prod'],
        isSecret: false
      });

      const devVars = manager.getVariablesForEnvironment('dev');
      const stagingVars = manager.getVariablesForEnvironment('staging');
      const prodVars = manager.getVariablesForEnvironment('prod');

      expect(devVars).toHaveLength(1);
      expect(stagingVars).toHaveLength(1);
      expect(prodVars).toHaveLength(1);
    });
  });

  describe('generateEnvFile', () => {
    it('should generate env file for specific environment', () => {
      manager.add({
        name: 'TEST_VAR',
        value: 'test-value',
        required: true,
        description: 'Test variable',
        environment: ['dev'],
        isSecret: false
      });

      manager.generateEnvFile('dev', testEnvPath);

      expect(existsSync(testEnvPath)).toBe(true);
    });

    it('should mark secrets with comment prefix', () => {
      manager.add({
        name: 'SECRET_KEY',
        value: 'secret-value',
        required: true,
        description: 'Secret key',
        environment: ['dev'],
        isSecret: true
      });

      manager.generateEnvFile('dev', testEnvPath);

      const content = require('fs').readFileSync(testEnvPath, 'utf-8');
      expect(content).toContain('# SECRET_KEY=secret-value');
    });
  });

  describe('remove', () => {
    it('should remove variable', () => {
      manager.add({
        name: 'TEST_VAR',
        value: 'test-value',
        required: true,
        description: 'Test variable',
        environment: ['dev'],
        isSecret: false
      });

      expect(manager.count()).toBe(1);

      const removed = manager.remove('TEST_VAR');
      expect(removed).toBe(true);
      expect(manager.count()).toBe(0);
    });

    it('should return false for non-existent variable', () => {
      const removed = manager.remove('NON_EXISTENT');
      expect(removed).toBe(false);
    });
  });

  describe('clear', () => {
    it('should clear all variables', () => {
      manager.add({
        name: 'VAR1',
        value: 'value1',
        required: true,
        description: 'Variable 1',
        environment: ['dev'],
        isSecret: false
      });

      manager.add({
        name: 'VAR2',
        value: 'value2',
        required: true,
        description: 'Variable 2',
        environment: ['dev'],
        isSecret: false
      });

      expect(manager.count()).toBe(2);

      manager.clear();
      expect(manager.count()).toBe(0);
    });
  });

  describe('AETHER_ENV_VARIABLES', () => {
    it('should contain predefined variables', () => {
      expect(AETHER_ENV_VARIABLES).toBeDefined();
      expect(AETHER_ENV_VARIABLES.length).toBeGreaterThan(0);
    });

    it('should contain required variables', () => {
      const varNames = AETHER_ENV_VARIABLES.map(v => v.name);
      expect(varNames).toContain('NODE_ENV');
      expect(varNames).toContain('GEMINI_API_KEY');
      expect(varNames).toContain('CF_API_TOKEN');
      expect(varNames).toContain('VERCEL_TOKEN');
    });

    it('should have all variables with valid structure', () => {
      AETHER_ENV_VARIABLES.forEach(variable => {
        expect(variable.name).toBeDefined();
        expect(variable.required).toBeDefined();
        expect(variable.description).toBeDefined();
        expect(variable.environment).toBeDefined();
        expect(variable.isSecret).toBeDefined();
      });
    });
  });
});
