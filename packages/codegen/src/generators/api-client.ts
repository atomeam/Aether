import Handlebars from 'handlebars';
import { ApiClientOptions, GenerationResult, Language } from '../types.js';
import { typescriptApiClientTemplate, javascriptApiClientTemplate } from '../templates/api-client.js';

/**
 * Generate an API client based on options
 */
export async function generateApiClient(options: ApiClientOptions): Promise<GenerationResult> {
  try {
    const template = options.language === Language.TYPESCRIPT
      ? typescriptApiClientTemplate
      : javascriptApiClientTemplate;

    const compiledTemplate = Handlebars.compile(template);

    const context = {
      name: options.name,
      baseUrl: options.baseUrl || '/api',
      language: options.language,
      endpoints: options.endpoints || [],
      hasAuth: options.auth !== 'none',
      authType: options.auth,
      hasErrorHandling: options.errorHandling,
      hasRetry: options.retry,
      hasTests: options.tests,
    };

    const content = compiledTemplate(context);
    const extension = options.language === Language.TYPESCRIPT ? 'ts' : 'js';
    const fileName = `${options.name}Client.${extension}`;

    const files = [
      {
        path: options.path || `src/api/${fileName}`,
        content,
      },
    ];

    // Generate test file if requested
    if (options.tests) {
      const testContent = generateApiClientTest(options);
      files.push({
        path: options.path ? `${options.path}/${options.name}Client.test.${extension}` : `src/api/${options.name}Client.test.${extension}`,
        content: testContent,
      });
    }

    return {
      success: true,
      files,
    };
  } catch (error) {
    return {
      success: false,
      files: [],
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    };
  }
}

function generateApiClientTest(options: ApiClientOptions): string {
  const isTS = options.language === Language.TYPESCRIPT;
  const extension = isTS ? 'ts' : 'js';

  return `import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ${options.name}Client } from './${options.name}Client.${extension}';

describe('${options.name}Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with base URL', () => {
    const client = new ${options.name}Client('${options.baseUrl || '/api'}');
    expect(client).toBeDefined();
  });

  it('should make API calls', async () => {
    // Add test implementation
    expect(true).toBe(true);
  });
});
`;
}
