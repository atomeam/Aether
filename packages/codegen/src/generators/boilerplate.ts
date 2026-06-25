import Handlebars from 'handlebars';
import { BoilerplateOptions, GenerationResult, Language } from '../types.js';
import { classTemplate, functionTemplate, hookTemplate, serviceTemplate, repositoryTemplate } from '../templates/boilerplate.js';

/**
 * Generate boilerplate based on options
 */
export async function generateBoilerplate(options: BoilerplateOptions): Promise<GenerationResult> {
  try {
    const template = getTemplate(options.template);
    const compiledTemplate = Handlebars.compile(template);

    const context = {
      name: options.name,
      language: options.language,
      template: options.template,
      features: options.features || [],
      hasTests: options.tests,
    };

    const content = compiledTemplate(context);
    const extension = options.language === Language.TYPESCRIPT ? 'ts' : 'js';
    const fileName = `${options.name}.${extension}`;

    const files = [
      {
        path: options.path || `src/${options.template}s/${fileName}`,
        content,
      },
    ];

    // Generate test file if requested
    if (options.tests) {
      const testContent = generateBoilerplateTest(options);
      files.push({
        path: options.path ? `${options.path}/${options.name}.test.${extension}` : `src/${options.template}s/${options.name}.test.${extension}`,
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

function getTemplate(template: string): string {
  switch (template) {
    case 'class':
      return classTemplate;
    case 'function':
      return functionTemplate;
    case 'hook':
      return hookTemplate;
    case 'service':
      return serviceTemplate;
    case 'repository':
      return repositoryTemplate;
    default:
      return classTemplate;
  }
}

function generateBoilerplateTest(options: BoilerplateOptions): string {
  const isTS = options.language === Language.TYPESCRIPT;
  const extension = isTS ? 'ts' : 'js';

  return `import { describe, it, expect, beforeEach } from 'vitest';
import { ${options.name} } from './${options.name}.${extension}';

describe('${options.name}', () => {
  let instance: ${options.name};

  beforeEach(() => {
    instance = new ${options.name}();
  });

  it('should initialize', () => {
    expect(instance).toBeDefined();
  });

  it('should perform its function', () => {
    // Add test implementation
    expect(true).toBe(true);
  });
});
`;
}
