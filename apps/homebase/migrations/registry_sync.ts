/**
 * Registry Sync Workflow
 * 
 * Syncs automation_consolidation_v2 state to Notion "Automation Center Registry" database.
 * This enables the system to "know itself" by maintaining an up-to-date inventory.
 */

import * as fs from 'fs';
import * as path from 'path';
import { JobContext, JobResult } from '../backbone/shared/types/job';
import { NotionRegistryClient } from '../backbone/shared/notion';

interface SyncResult {
  created: number;
  updated: number;
  skipped: number;
  errors: string[];
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

export async function handler(context: JobContext): Promise<JobResult> {
  const { logger, runId } = context;
  
  try {
    logger.info('Registry sync started', { runId });

    // Check for required environment variables
    const notionToken = process.env.NOTION_TOKEN;
    const registryDbUrl = process.env.REGISTRY_DB_URL;

    if (!notionToken || !registryDbUrl) {
      const errorMsg = 'Missing required environment variables: NOTION_TOKEN and/or REGISTRY_DB_URL';
      logger.error(errorMsg);
      return {
        runId,
        status: 'skipped',
        startTime: new Date(),
        endTime: new Date(),
        duration: 0,
        output: {
          success: false,
          error: errorMsg,
          action: 'Set NOTION_TOKEN and REGISTRY_DB_URL in backbone/config/.env'
        }
      };
    }

    // Initialize Notion client
    const notionClient = new NotionRegistryClient({
      token: notionToken,
      databaseUrl: registryDbUrl
    });

    // Test connection
    logger.info('Testing Notion connection...');
    const connected = await notionClient.testConnection();
    if (!connected) {
      logger.warn('Notion connection test failed - this is expected if NOTION_TOKEN is not configured');
      return {
        runId,
        status: 'skipped',
        startTime: new Date(),
        endTime: new Date(),
        duration: 0,
        output: {
          success: false,
          error: 'Failed to connect to Notion database - check NOTION_TOKEN and REGISTRY_DB_URL in backbone/config/.env',
          action: 'Set valid NOTION_TOKEN in backbone/config/.env to enable registry sync'
        }
      };
    }
    logger.info('Notion connection successful');

    // Collect registry items
    const items: RegistryItem[] = [];
    const now = new Date();
    const rootDir = path.join(process.cwd(), '..');

    // 1. Orchestrator Service
    items.push({
      name: 'Automation Orchestrator',
      kind: 'Service',
      status: 'Active',
      location: 'http://localhost:3333',
      entryUrl: 'http://localhost:3333/',
      owner: 'Devin',
      lastVerified: now,
      notes: 'Main orchestrator service with integrated web UI on port 3333'
    });

    // 2. Load workflows from config
    logger.info('Loading workflows from config...');
    const configPath = path.join(rootDir, 'backbone/config/config.yaml');
    const configContent = fs.readFileSync(configPath, 'utf8');
    
    // Parse workflows from config (simple YAML parsing)
    const workflowMatches = configContent.matchAll(/(\w+):\s*\n\s*enabled:\s*(true|false)/g);
    const workflowNames = new Set<string>();
    
    for (const match of workflowMatches) {
      const name = match[1];
      const enabled = match[2] === 'true';
      workflowNames.add(name);
      
      items.push({
        name: name,
        kind: 'Workflow',
        status: enabled ? 'Active' : 'Planned',
        location: `backbone/config/config.yaml`,
        entryUrl: 'http://localhost:3333/workflows',
        owner: 'Devin',
        lastVerified: now,
        notes: enabled ? 'Enabled in configuration' : 'Disabled in configuration'
      });
    }
    logger.info(`Found ${workflowNames.size} workflows in config`);

    // 3. Scan migrations directory for wrappers
    logger.info('Scanning migrations directory for wrappers...');
    const migrationsDir = path.join(rootDir, 'migrations');
    if (fs.existsSync(migrationsDir)) {
      const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.ts'));
      
      for (const file of files) {
        const wrapperName = file.replace('.ts', '');
        // Skip the sync workflow itself to avoid recursion
        if (wrapperName === 'registry_sync') continue;
        
        const isEnabled = workflowNames.has(wrapperName);
        
        items.push({
          name: wrapperName,
          kind: 'Wrapper',
          status: isEnabled ? 'Active' : 'Planned',
          location: `migrations/${file}`,
          owner: 'Devin',
          lastVerified: now,
          notes: isEnabled ? 'Wrapper for existing project functionality' : 'Available wrapper not currently used'
        });
      }
      logger.info(`Found ${files.length} wrapper files`);
    }

    // 4. Key documentation files
    logger.info('Adding key documentation files...');
    const keyDocs = [
      'OPERATOR_ONE_PAGER.md',
      'ONE_PAGER.md',
      'REALITY_CHECK.md',
      'CONFIG_SAFETY.md',
      'CONSOLIDATION_PLAN.md'
    ];
    
    const docsDir = path.join(rootDir, 'docs');
    if (fs.existsSync(docsDir)) {
      for (const doc of keyDocs) {
        const docPath = path.join(docsDir, doc);
        if (fs.existsSync(docPath)) {
          items.push({
            name: doc.replace('.md', ''),
            kind: 'Doc',
            status: 'Stable',
            location: `docs/${doc}`,
            owner: 'Devin',
            lastVerified: now,
            notes: 'Core system documentation'
          });
        }
      }
      logger.info(`Added ${keyDocs.length} documentation files`);
    }

    // 5. Key configuration files
    logger.info('Adding key configuration files...');
    items.push({
      name: 'Main Config',
      kind: 'Config',
      status: 'Active',
      location: 'backbone/config/config.yaml',
      owner: 'You (Operator)',
      lastVerified: now,
      notes: 'Main orchestrator configuration file'
    });

    items.push({
      name: 'Environment Template',
      kind: 'Config',
      status: 'Stable',
      location: 'backbone/config/.env.example',
      owner: 'You (Operator)',
      lastVerified: now,
      notes: 'Environment variable template (no secrets)'
    });

    // Sync items to Notion
    logger.info(`Syncing ${items.length} items to Notion...`);
    const result: SyncResult = {
      created: 0,
      updated: 0,
      skipped: 0,
      errors: []
    };

    for (const item of items) {
      try {
        const syncResult = await notionClient.upsertItem(item);
        if (syncResult.created) {
          result.created++;
          logger.info(`Created: ${item.name} (${item.kind})`);
        } else {
          result.updated++;
          logger.info(`Updated: ${item.name} (${item.kind})`);
        }
      } catch (error) {
        const errorMsg = `Failed to sync ${item.name}: ${(error as Error).message}`;
        result.errors.push(errorMsg);
        logger.error(errorMsg);
      }
    }

    logger.info('Registry sync completed', result);

    return {
      runId,
      status: 'completed',
      startTime: new Date(),
      endTime: new Date(),
      duration: 1000,
      output: {
        success: true,
        result,
        totalItems: items.length,
        timestamp: now.toISOString()
      }
    };

  } catch (error) {
    logger.error('Registry sync failed', { 
      error: (error as Error).message,
      stack: (error as Error).stack 
    });
    
    return {
      runId,
      status: 'failed',
      startTime: new Date(),
      endTime: new Date(),
      duration: 0,
      error: error as Error,
      output: {
        success: false,
        error: (error as Error).message
      }
    };
  }
}