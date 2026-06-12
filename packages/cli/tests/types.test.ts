import { describe, it, expect } from 'vitest';
import {
  CommandType,
  ProjectTemplate,
  DeploymentTarget,
  PackageManager,
  ScaffoldOptionsSchema,
  PackageOptionsSchema,
  DeployOptionsSchema,
  DevOptionsSchema,
  GenerateOptionsSchema,
  CLIConfigSchema,
} from '../src/types.js';

describe('CLI Types', () => {
  describe('ScaffoldOptionsSchema', () => {
    it('should validate valid scaffold options', () => {
      const result = ScaffoldOptionsSchema.safeParse({
        name: 'my-project',
        template: ProjectTemplate.BASIC,
        packageManager: PackageManager.NPM,
        typescript: true,
        testing: true,
        linting: true,
        git: true,
      });

      expect(result.success).toBe(true);
    });

    it('should reject invalid project name', () => {
      const result = ScaffoldOptionsSchema.safeParse({
        name: '',
        template: ProjectTemplate.BASIC,
      });

      expect(result.success).toBe(false);
    });

    it('should apply default values', () => {
      const result = ScaffoldOptionsSchema.safeParse({
        name: 'my-project',
        template: ProjectTemplate.BASIC,
      });

      if (result.success) {
        expect(result.data.typescript).toBe(true);
        expect(result.data.testing).toBe(true);
        expect(result.data.linting).toBe(true);
        expect(result.data.git).toBe(true);
      }
    });
  });

  describe('PackageOptionsSchema', () => {
    it('should validate valid package options', () => {
      const result = PackageOptionsSchema.safeParse({
        action: 'add',
        packages: ['lodash', 'axios'],
        dev: false,
        exact: false,
      });

      expect(result.success).toBe(true);
    });

    it('should reject invalid action', () => {
      const result = PackageOptionsSchema.safeParse({
        action: 'invalid',
      });

      expect(result.success).toBe(false);
    });
  });

  describe('DeployOptionsSchema', () => {
    it('should validate valid deploy options', () => {
      const result = DeployOptionsSchema.safeParse({
        target: DeploymentTarget.VERCEL,
        environment: 'production',
        build: true,
        preview: false,
        force: false,
      });

      expect(result.success).toBe(true);
    });

    it('should apply default environment', () => {
      const result = DeployOptionsSchema.safeParse({
        target: DeploymentTarget.VERCEL,
      });

      if (result.success) {
        expect(result.data.environment).toBe('production');
        expect(result.data.build).toBe(true);
        expect(result.data.preview).toBe(false);
        expect(result.data.force).toBe(false);
      }
    });
  });

  describe('DevOptionsSchema', () => {
    it('should validate valid dev options', () => {
      const result = DevOptionsSchema.safeParse({
        port: 3000,
        host: 'localhost',
        open: false,
        hot: true,
        inspect: false,
      });

      expect(result.success).toBe(true);
    });

    it('should reject invalid port', () => {
      const result = DevOptionsSchema.safeParse({
        port: 99999,
      });

      expect(result.success).toBe(false);
    });

    it('should apply default values', () => {
      const result = DevOptionsSchema.safeParse({});

      if (result.success) {
        expect(result.data.port).toBe(3000);
        expect(result.data.host).toBe('localhost');
        expect(result.data.open).toBe(false);
        expect(result.data.hot).toBe(true);
        expect(result.data.inspect).toBe(false);
      }
    });
  });

  describe('GenerateOptionsSchema', () => {
    it('should validate valid generate options', () => {
      const result = GenerateOptionsSchema.safeParse({
        type: 'component',
        name: 'Button',
        framework: 'react',
        language: 'typescript',
        styling: 'css',
      });

      expect(result.success).toBe(true);
    });

    it('should reject empty name', () => {
      const result = GenerateOptionsSchema.safeParse({
        type: 'component',
        name: '',
      });

      expect(result.success).toBe(false);
    });

    it('should apply default language', () => {
      const result = GenerateOptionsSchema.safeParse({
        type: 'component',
        name: 'Button',
      });

      if (result.success) {
        expect(result.data.language).toBe('typescript');
      }
    });
  });

  describe('CLIConfigSchema', () => {
    it('should validate valid CLI config', () => {
      const result = CLIConfigSchema.safeParse({
        defaultPackageManager: PackageManager.NPM,
        defaultDeploymentTarget: DeploymentTarget.VERCEL,
        defaultTemplate: ProjectTemplate.BASIC,
        autoConfirm: false,
        verbose: false,
        color: true,
      });

      expect(result.success).toBe(true);
    });

    it('should apply default values', () => {
      const result = CLIConfigSchema.safeParse({});

      if (result.success) {
        expect(result.data.autoConfirm).toBe(false);
        expect(result.data.verbose).toBe(false);
        expect(result.data.color).toBe(true);
      }
    });
  });
});
