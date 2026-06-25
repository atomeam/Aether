import Handlebars from 'handlebars';
import { SchemaOptions, GenerationResult, Language } from '../types.js';
import { zodSchemaTemplate, yupSchemaTemplate, joiSchemaTemplate, classValidatorTemplate } from '../templates/schema.js';

/**
 * Generate a schema based on options
 */
export async function generateSchema(options: SchemaOptions): Promise<GenerationResult> {
  try {
    const template = getTemplate(options.schemaType);
    const compiledTemplate = Handlebars.compile(template);

    const context = {
      name: options.name,
      language: options.language,
      schemaType: options.schemaType,
      fields: options.fields || [],
      hasExports: options.exports,
      hasTests: options.tests,
    };

    const content = compiledTemplate(context);
    const extension = options.language === Language.TYPESCRIPT ? 'ts' : 'js';
    const fileName = `${options.name}Schema.${extension}`;

    const files = [
      {
        path: options.path || `src/schemas/${fileName}`,
        content,
      },
    ];

    // Generate test file if requested
    if (options.tests) {
      const testContent = generateSchemaTest(options);
      files.push({
        path: options.path ? `${options.path}/${options.name}Schema.test.${extension}` : `src/schemas/${options.name}Schema.test.${extension}`,
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

function getTemplate(schemaType: string): string {
  switch (schemaType) {
    case 'zod':
      return zodSchemaTemplate;
    case 'yup':
      return yupSchemaTemplate;
    case 'joi':
      return joiSchemaTemplate;
    case 'class-validator':
      return classValidatorTemplate;
    default:
      return zodSchemaTemplate;
  }
}

function generateSchemaTest(options: SchemaOptions): string {
  const isTS = options.language === Language.TYPESCRIPT;
  const extension = isTS ? 'ts' : 'js';

  if (options.schemaType === 'zod') {
    return `import { describe, it, expect } from 'vitest';
import { ${options.name}Schema } from './${options.name}Schema.${extension}';

describe('${options.name}Schema', () => {
  it('should validate valid data', () => {
    const result = ${options.name}Schema.safeParse({
      // Add valid test data
    });
    expect(result.success).toBe(true);
  });

  it('should reject invalid data', () => {
    const result = ${options.name}Schema.safeParse({
      // Add invalid test data
    });
    expect(result.success).toBe(false);
  });
});
`;
  }

  return `import { describe, it, expect } from 'vitest';
import { ${options.name}Schema } from './${options.name}Schema.${extension}';

describe('${options.name}Schema', () => {
  it('should validate valid data', () => {
    // Add test implementation
    expect(true).toBe(true);
  });
});
`;
}
