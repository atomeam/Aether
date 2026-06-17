import type { AppEnv } from './env.js';

export interface NotionLinks {
  workspaceIndex: string;
  roster: string;
  roleCards: string;
}

export function getNotionLinks(env: AppEnv): NotionLinks {
  return {
    workspaceIndex: env.NOTION_WORKSPACE_INDEX_URL,
    roster: env.NOTION_ROSTER_URL,
    roleCards: env.NOTION_ROLE_CARDS_URL
  };
}
