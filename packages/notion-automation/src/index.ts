/**
 * Notion Automation Package
 * 
 * Create pages, databases, update content, and automate documentation.
 */

import { z } from 'zod';

// Input schemas
export const CreatePageSchema = z.object({
  parent: z.union([
    z.object({ database_id: z.string() }),
    z.object({ page_id: z.string() }),
  ]),
  properties: z.record(z.any()),
  children: z.array(z.any()).optional(),
});

export const UpdatePageSchema = z.object({
  pageId: z.string(),
  properties: z.record(z.any()).optional(),
  archived: z.boolean().optional(),
});

export const QueryDatabaseSchema = z.object({
  databaseId: z.string(),
  filter: z.any().optional(),
  sorts: z.array(z.any()).optional(),
});

export const AppendBlockSchema = z.object({
  blockId: z.string(),
  children: z.array(z.any()),
});

// Notion API helpers using raw fetch
const NOTION_API = 'https://api.notion.com/v1';

async function notionFetch(path: string, options: RequestInit = {}) {
  const token = process.env.NOTION_TOKEN;
  
  if (!token) {
    throw new Error('NOTION_TOKEN environment variable is required');
  }
  
  const response = await fetch(`${NOTION_API}${path}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    },
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Notion API error ${response.status}: ${error}`);
  }
  
  return response.json();
}

// Create a page
export async function createPage(input: z.infer<typeof CreatePageSchema>) {
  const { parent, properties, children } = CreatePageSchema.parse(input);
  
  return notionFetch('/pages', {
    method: 'POST',
    body: JSON.stringify({ parent, properties, children }),
  });
}

// Update a page
export async function updatePage(input: z.infer<typeof UpdatePageSchema>) {
  const { pageId, properties, archived } = UpdatePageSchema.parse(input);
  
  return notionFetch(`/pages/${pageId}`, {
    method: 'PATCH',
    body: JSON.stringify({ properties, archived }),
  });
}

// Query a database
export async function queryDatabase(input: z.infer<typeof QueryDatabaseSchema>) {
  const { databaseId, filter, sorts } = QueryDatabaseSchema.parse(input);
  
  const body: any = {};
  if (filter) body.filter = filter;
  if (sorts) body.sorts = sorts;
  
  return notionFetch(`/databases/${databaseId}/query`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

// Append blocks to a page
export async function appendBlock(input: z.infer<typeof AppendBlockSchema>) {
  const { blockId, children } = AppendBlockSchema.parse(input);
  
  return notionFetch(`/blocks/${blockId}/children`, {
    method: 'PATCH',
    body: JSON.stringify({ children }),
  });
}

// Get page content
export async function getPage(pageId: string) {
  return notionFetch(`/pages/${pageId}`);
}

// Get database info
export async function getDatabase(databaseId: string) {
  return notionFetch(`/databases/${databaseId}`);
}

// Search Notion
export async function search(query: string, filter?: any) {
  const body: any = { query };
  if (filter) body.filter = filter;
  
  return notionFetch('/search', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

// Export schemas for validation
export const schemas = {
  createPage: CreatePageSchema,
  updatePage: UpdatePageSchema,
  queryDatabase: QueryDatabaseSchema,
  appendBlock: AppendBlockSchema,
};
