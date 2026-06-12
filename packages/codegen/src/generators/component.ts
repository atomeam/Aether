import Handlebars from 'handlebars';
import { ComponentOptions, GenerationResult, Framework, Language, Styling } from '../types.js';
import { reactComponentTemplate, vueComponentTemplate, svelteComponentTemplate, solidComponentTemplate, vanillaComponentTemplate } from '../templates/component.js';

/**
 * Generate a component based on options
 */
export async function generateComponent(options: ComponentOptions): Promise<GenerationResult> {
  try {
    const template = getTemplate(options.framework);
    const compiledTemplate = Handlebars.compile(template);

    const context = {
      name: options.name,
      framework: options.framework,
      language: options.language,
      styling: options.styling,
      props: options.props || [],
      hooks: options.hooks || [],
      hasState: options.state,
      hasTests: options.tests,
      hasStorybook: options.storybook,
    };

    const content = compiledTemplate(context);
    const extension = getFileExtension(options.framework, options.language);
    const fileName = `${options.name}.${extension}`;

    const files = [
      {
        path: options.path || `src/components/${fileName}`,
        content,
      },
    ];

    // Generate test file if requested
    if (options.tests) {
      const testContent = generateComponentTest(options);
      files.push({
        path: options.path ? `${options.path}/${options.name}.test.${options.language === Language.TYPESCRIPT ? 'tsx' : 'jsx'}` : `src/components/${options.name}.test.${options.language === Language.TYPESCRIPT ? 'tsx' : 'jsx'}`,
        content: testContent,
      });
    }

    // Generate Storybook story if requested
    if (options.storybook) {
      const storyContent = generateComponentStory(options);
      files.push({
        path: options.path ? `${options.path}/${options.name}.stories.${options.language === Language.TYPESCRIPT ? 'tsx' : 'jsx'}` : `src/components/${options.name}.stories.${options.language === Language.TYPESCRIPT ? 'tsx' : 'jsx'}`,
        content: storyContent,
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

function getTemplate(framework: Framework): string {
  switch (framework) {
    case Framework.REACT:
      return reactComponentTemplate;
    case Framework.VUE:
      return vueComponentTemplate;
    case Framework.SVELTE:
      return svelteComponentTemplate;
    case Framework.SOLID:
      return solidComponentTemplate;
    case Framework.NONE:
    default:
      return vanillaComponentTemplate;
  }
}

function getFileExtension(framework: Framework, language: Language): string {
  const langExt = language === Language.TYPESCRIPT ? 'ts' : 'js';

  switch (framework) {
    case Framework.REACT:
    case Framework.SOLID:
      return `${langExt}x`;
    case Framework.VUE:
      return 'vue';
    case Framework.SVELTE:
      return 'svelte';
    case Framework.NONE:
    default:
      return langExt;
  }
}

function generateComponentTest(options: ComponentOptions): string {
  const isTS = options.language === Language.TYPESCRIPT;
  const ext = isTS ? 'tsx' : 'jsx';

  if (options.framework === Framework.REACT) {
    return `import { describe, it, expect } from 'vitest';
${isTS ? "import { render, screen } from '@testing-library/react';" : ''}
import { ${options.name} } from './${options.name}.${ext}';

describe('${options.name}', () => {
  it('should render', () => {
${isTS ? `    render(<${options.name} />);` : `    // Add test implementation`}
    expect(true).toBe(true);
  });
});
`;
  }

  return `import { describe, it, expect } from 'vitest';
import { ${options.name} } from './${options.name}.${isTS ? 'ts' : 'js'}';

describe('${options.name}', () => {
  it('should render', () => {
    // Add test implementation
    expect(true).toBe(true);
  });
});
`;
}

function generateComponentStory(options: ComponentOptions): string {
  const isTS = options.language === Language.TYPESCRIPT;
  const ext = isTS ? 'tsx' : 'jsx';

  if (options.framework === Framework.REACT) {
    return `import type { Meta, StoryObj } from '@storybook/react';
import { ${options.name} } from './${options.name}.${ext}';

const meta: Meta<typeof ${options.name}> = {
  title: 'Components/${options.name}',
  component: ${options.name},
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ${options.name}>;

export const Default: Story = {
  args: {},
};
`;
  }

  return `// Storybook story for ${options.name}
// Add framework-specific story implementation
`;
}
