/**
 * Notion API Client for Registry Sync
 * 
 * Handles upsert operations to Notion databases with idempotent behavior.
 */

interface NotionConfig {
  token: string;
  databaseUrl: string;
}

interface RegistryItem {
  name: string;
  kind: 'Workflow' | 'Wrapper' | 'Project' | 'Service' | 'Config' | 'Doc';
  status: 'Planned' | 'Active' | 'Stable';
  location: string;
  entryUrl?: string;
  owner: 'You (Operator)' | 'Devin' | 'OpenHands' | 'Cloud helper';
  lastVerified: Date;
  notes?: string;
}

interface NotionPage {
  id: string;
  properties: Record<string, any>;
}

interface NotionDatabaseQueryResponse {
  results: NotionPage[];
}

export class NotionRegistryClient {
  private token: string;
  private databaseId: string;
  private baseUrl = 'https://api.notion.com/v1';

  constructor(config: NotionConfig) {
    this.token = config.token;
    // Extract database ID from URL
    const match = config.databaseUrl.match(/([a-f0-9]{32})/);
    if (!match) {
      throw new Error('Invalid Notion database URL');
    }
    this.databaseId = match[1];
  }

  private async request(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Notion API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  /**
   * Query database for existing pages by name and kind
   */
  async findExistingItem(name: string, kind: string): Promise<NotionPage | null> {
    try {
      const response = await this.request(`/databases/${this.databaseId}/query`, {
        method: 'POST',
        body: JSON.stringify({
          filter: {
            and: [
              {
                property: 'Name',
                title: {
                  equals: name,
                },
              },
              {
                property: 'Kind',
                select: {
                  equals: kind,
                },
              },
            ],
          },
        }),
      });

      const results = response.results as NotionPage[];
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      // If query fails (e.g., property doesn't exist), return null
      console.warn('Notion query failed, assuming new item:', error);
      return null;
    }
  }

  /**
   * Create a new page in the database
   */
  async createItem(item: RegistryItem): Promise<string> {
    const properties = this.buildProperties(item);
    
    const response = await this.request('/pages', {
      method: 'POST',
      body: JSON.stringify({
        parent: {
          database_id: this.databaseId,
        },
        properties,
      }),
    });

    return response.id;
  }

  /**
   * Update an existing page
   */
  async updateItem(pageId: string, item: RegistryItem): Promise<void> {
    const properties = this.buildProperties(item);
    
    await this.request(`/pages/${pageId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        properties,
      }),
    });
  }

  /**
   * Upsert item (create if not exists, update if exists)
   */
  async upsertItem(item: RegistryItem): Promise<{ created: boolean; id: string }> {
    const existing = await this.findExistingItem(item.name, item.kind);
    
    if (existing) {
      await this.updateItem(existing.id, item);
      return { created: false, id: existing.id };
    } else {
      const id = await this.createItem(item);
      return { created: true, id };
    }
  }

  /**
   * Build Notion properties from RegistryItem
   */
  private buildProperties(item: RegistryItem): Record<string, any> {
    return {
      Name: {
        title: [
          {
            text: {
              content: item.name,
            },
          },
        ],
      },
      Kind: {
        select: {
          name: item.kind,
        },
      },
      Status: {
        status: {
          name: item.status,
        },
      },
      Location: {
        rich_text: [
          {
            text: {
              content: item.location,
            },
          },
        ],
      },
      ...(item.entryUrl && {
        'Entry URL': {
          url: item.entryUrl,
        },
      }),
      Owner: {
        select: {
          name: item.owner,
        },
      },
      'Last verified': {
        date: {
          start: item.lastVerified.toISOString().split('T')[0],
        },
      },
      ...(item.notes && {
        Notes: {
          rich_text: [
            {
              text: {
                content: item.notes,
              },
            },
          ],
        },
      }),
    };
  }

  /**
   * Test connection to Notion
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.request(`/databases/${this.databaseId}`);
      return true;
    } catch (error) {
      console.error('Notion connection test failed:', error);
      return false;
    }
  }
}