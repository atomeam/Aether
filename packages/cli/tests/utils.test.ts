import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import { detectPackageManager, createProjectStructure } from '../src/utils/project.js';
import { getPackageCommand } from '../src/utils/package.js';
import { PackageManager } from '../src/types.js';

describe('CLI Utils', () => {
  describe('detectPackageManager', () => {
    it('should detect npm from package-lock.json', async () => {
      vi.spyOn(fs, 'pathExists').mockResolvedValue(true);
      vi.spyOn(fs, 'pathExists').mockResolvedValueOnce(false); // pnpm
      vi.spyOn(fs, 'pathExists').mockResolvedValueOnce(false); // yarn
      vi.spyOn(fs, 'pathExists').mockResolvedValueOnce(false); // bun
      vi.spyOn(fs, 'pathExists').mockResolvedValueOnce(true); // npm

      const result = await detectPackageManager();
      expect(result).toBe(PackageManager.NPM);
    });

    it('should detect yarn from yarn.lock', async () => {
      vi.spyOn(fs, 'pathExists').mockResolvedValue(true);
      vi.spyOn(fs, 'pathExists').mockResolvedValueOnce(false); // pnpm
      vi.spyOn(fs, 'pathExists').mockResolvedValueOnce(true); // yarn

      const result = await detectPackageManager();
      expect(result).toBe(PackageManager.YARN);
    });

    it('should detect pnpm from pnpm-lock.yaml', async () => {
      vi.spyOn(fs, 'pathExists').mockResolvedValueOnce(true);

      const result = await detectPackageManager();
      expect(result).toBe(PackageManager.PNPM);
    });

    it('should detect bun from bun.lockb', async () => {
      vi.spyOn(fs, 'pathExists').mockResolvedValueOnce(false); // pnpm
      vi.spyOn(fs, 'pathExists').mockResolvedValueOnce(false); // yarn
      vi.spyOn(fs, 'pathExists').mockResolvedValueOnce(true); // bun

      const result = await detectPackageManager();
      expect(result).toBe(PackageManager.BUN);
    });

    it('should default to npm when no lockfile found', async () => {
      vi.spyOn(fs, 'pathExists').mockResolvedValue(false);

      const result = await detectPackageManager();
      expect(result).toBe(PackageManager.NPM);
    });
  });

  describe('getPackageCommand', () => {
    it('should return npm commands', () => {
      const commands = getPackageCommand(PackageManager.NPM, {
        dev: true,
        exact: true,
      });

      expect(commands.install).toBe('npm install');
      expect(commands.add).toBe('npm install');
      expect(commands.remove).toBe('npm uninstall');
      expect(commands.update).toBe('npm update');
      expect(commands.list).toBe('npm list');
      expect(commands.devFlag).toBe('--save-dev');
      expect(commands.exactFlag).toBe('--save-exact');
    });

    it('should return yarn commands', () => {
      const commands = getPackageCommand(PackageManager.YARN, {
        dev: true,
        exact: true,
      });

      expect(commands.install).toBe('yarn install');
      expect(commands.add).toBe('yarn add');
      expect(commands.remove).toBe('yarn remove');
      expect(commands.update).toBe('yarn upgrade');
      expect(commands.list).toBe('yarn list');
      expect(commands.devFlag).toBe('--dev');
      expect(commands.exactFlag).toBe('--exact');
    });

    it('should return pnpm commands', () => {
      const commands = getPackageCommand(PackageManager.PNPM, {
        dev: true,
        exact: true,
      });

      expect(commands.install).toBe('pnpm install');
      expect(commands.add).toBe('pnpm add');
      expect(commands.remove).toBe('pnpm remove');
      expect(commands.update).toBe('pnpm update');
      expect(commands.list).toBe('pnpm list');
      expect(commands.devFlag).toBe('--save-dev');
      expect(commands.exactFlag).toBe('--save-exact');
    });

    it('should return bun commands', () => {
      const commands = getPackageCommand(PackageManager.BUN, {
        dev: true,
        exact: true,
      });

      expect(commands.install).toBe('bun install');
      expect(commands.add).toBe('bun add');
      expect(commands.remove).toBe('bun remove');
      expect(commands.update).toBe('bun update');
      expect(commands.list).toBe('bun pm ls');
      expect(commands.devFlag).toBe('--dev');
      expect(commands.exactFlag).toBe('--exact');
    });

    it('should generate workspace flags correctly', () => {
      const npmCommands = getPackageCommand(PackageManager.NPM, {});
      expect(npmCommands.workspaceFlag('my-app')).toBe('-w my-app');

      const yarnCommands = getPackageCommand(PackageManager.YARN, {});
      expect(yarnCommands.workspaceFlag('my-app')).toBe('-W my-app');

      const pnpmCommands = getPackageCommand(PackageManager.PNPM, {});
      expect(pnpmCommands.workspaceFlag('my-app')).toBe('--filter my-app');

      const bunCommands = getPackageCommand(PackageManager.BUN, {});
      expect(bunCommands.workspaceFlag('my-app')).toBe('--workspace my-app');
    });
  });

  describe('createProjectStructure', () => {
    it('should create basic project structure', async () => {
      const tempDir = path.join(process.cwd(), 'temp-test-project');
      const options = {
        name: 'test-project',
        template: 'basic' as const,
        typescript: true,
        testing: false,
        linting: false,
        git: false,
      };

      const filesCreated = await createProjectStructure(tempDir, options);

      expect(filesCreated).toContain('package.json');
      expect(filesCreated).toContain('tsconfig.json');
      expect(filesCreated).toContain('.gitignore');
      expect(filesCreated).toContain('README.md');
      expect(filesCreated).toContain('src/index.ts');

      // Cleanup
      await fs.remove(tempDir);
    });

    it('should create project without TypeScript', async () => {
      const tempDir = path.join(process.cwd(), 'temp-test-project-no-ts');
      const options = {
        name: 'test-project',
        template: 'basic' as const,
        typescript: false,
        testing: false,
        linting: false,
        git: false,
      };

      const filesCreated = await createProjectStructure(tempDir, options);

      expect(filesCreated).not.toContain('tsconfig.json');
      expect(filesCreated).toContain('src/index.js');

      // Cleanup
      await fs.remove(tempDir);
    });
  });
});
