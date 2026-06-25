import Handlebars from 'handlebars';
import { TypeOptions, GenerationResult, Language } from '../types.js';
import { typescriptTypeTemplate, javascriptTypeTemplate } from '../templates/type.js';

/**
 * Generate types based on options
 */
export async function generateType(options: TypeOptions): Promise<GenerationResult> {
  try {
    const template = options.language === Language.TYPESCRIPT
      ? typescriptTypeTemplate
      : javascriptTypeTemplate;

    const compiledTemplate = Handlebars.compile(template);

    const context = {
      name: options.name,
      language: options.language,
      properties: options.properties || [],
      exports: options.exports || [],
      hasTests: options.tests,
    };

    const content = compiledTemplate(context);
    const extension = options.language === Language.TYPESCRIPT ? 'ts' : 'js';
    const fileName = `${options.name}.${extension}`;

    const files = [
      {
        path: options.path || `src/types/${fileName}`,
        content,
      },
    ];

    // Generate test file if requested
    if (options.tests) {
      const testContent = generateTypeTest(options);
      files.push({
        path: options.path ? `${options.path}/${options.name}.test.${extension}` : `src/types/${options.name}.test.${extension}`,
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

function generateTypeTest(options: TypeOptions): string {
  const isTS = options.language === Language.TYPESCRIPT;
  const extension = isTS ? 'ts' : 'js';

  if (isTS) {
    return `import { describe, it, expect } from 'vitest';
import { ${options.name}, ${options.name}Create, ${options.name}Update } from './${options.name}.${extension}';

describe('${options.name} types', () => {
  it('should define base type', () => {
    const data: ${options.name} = {
      id: '1',
      // Add required properties
    };
    expect(data).toBeDefined();
  });

  it('should define create type', () => {
    const data: ${options.name}Create = {
      // Add required properties (without id)
    };
    expect(data).toBeDefined();
  });

  it('should define update type', () => {
    const data: ${options.name}Update = {};
    expect(data).toBeDefined();
  });
});
`;
  }

  return `import { describe, it, expect } from 'vitest';
import { ${options.name} } from './${options.name}.${extension}';

describe('${options.name} class', () => {
  it('should create instance', () => {
    const instance = new ${options.name}({});
    expect(instance).toBeDefined();
  });
});
`;
}
