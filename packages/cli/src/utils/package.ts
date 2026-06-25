import { PackageManager } from '../types.js';

/**
 * Get the appropriate command for a package manager
 */
export function getPackageCommand(
  packageManager: PackageManager,
  options: { dev?: boolean; exact?: boolean; workspace?: string }
) {
  const commands: Record<PackageManager, any> = {
    [PackageManager.NPM]: {
      install: 'npm install',
      add: 'npm install',
      remove: 'npm uninstall',
      update: 'npm update',
      list: 'npm list',
      devFlag: '--save-dev',
      exactFlag: '--save-exact',
      workspaceFlag: (ws: string) => `-w ${ws}`,
    },
    [PackageManager.YARN]: {
      install: 'yarn install',
      add: 'yarn add',
      remove: 'yarn remove',
      update: 'yarn upgrade',
      list: 'yarn list',
      devFlag: '--dev',
      exactFlag: '--exact',
      workspaceFlag: (ws: string) => `-W ${ws}`,
    },
    [PackageManager.PNPM]: {
      install: 'pnpm install',
      add: 'pnpm add',
      remove: 'pnpm remove',
      update: 'pnpm update',
      list: 'pnpm list',
      devFlag: '--save-dev',
      exactFlag: '--save-exact',
      workspaceFlag: (ws: string) => `--filter ${ws}`,
    },
    [PackageManager.BUN]: {
      install: 'bun install',
      add: 'bun add',
      remove: 'bun remove',
      update: 'bun update',
      list: 'bun pm ls',
      devFlag: '--dev',
      exactFlag: '--exact',
      workspaceFlag: (ws: string) => `--workspace ${ws}`,
    },
  };

  return commands[packageManager];
}
