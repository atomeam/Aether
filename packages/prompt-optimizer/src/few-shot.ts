import {
  FewShotExample,
  FewShotConfig,
  FewShotExampleSchema,
  FewShotConfigSchema
} from './types';

export class FewShotManager {
  private examples: Map<string, FewShotExample[]> = new Map();

  addExamples(category: string, examples: FewShotExample[]): void {
    for (const example of examples) {
      FewShotExampleSchema.parse(example);
    }

    const existing = this.examples.get(category) || [];
    this.examples.set(category, [...existing, ...examples]);
  }

  getExamples(category: string): FewShotExample[] {
    return this.examples.get(category) || [];
  }

  selectExamples(
    config: FewShotConfig,
    input: string,
    category?: string
  ): FewShotExample[] {
    FewShotConfigSchema.parse(config);

    let pool = config.examples;

    // If category is provided, use category-specific examples
    if (category && this.examples.has(category)) {
      pool = [...config.examples, ...this.examples.get(category)!];
    }

    const maxExamples = config.maxExamples || pool.length;
    const strategy = config.selectionStrategy || 'random';

    switch (strategy) {
      case 'random':
        return this.selectRandom(pool, maxExamples);
      case 'similarity':
        return this.selectBySimilarity(pool, input, maxExamples);
      case 'recent':
        return this.selectRecent(pool, maxExamples);
      default:
        return pool.slice(0, maxExamples);
    }
  }

  formatPrompt(
    basePrompt: string,
    examples: FewShotExample[],
    input: string,
    format: 'inline' | 'block' = 'block'
  ): string {
    if (examples.length === 0) {
      return basePrompt;
    }

    let examplesText = '';

    if (format === 'block') {
      examplesText = '\n\nExamples:\n';
      for (const example of examples) {
        examplesText += `\nInput: ${example.input}\nOutput: ${example.output}\n`;
      }
      examplesText += '\n';
    } else {
      // Inline format
      examplesText = examples
        .map((e) => `Example: ${e.input} -> ${e.output}`)
        .join('\n');
      examplesText += '\n\n';
    }

    return `${basePrompt}${examplesText}Input: ${input}\nOutput:`;
  }

  deleteCategory(category: string): boolean {
    return this.examples.delete(category);
  }

  getAllCategories(): string[] {
    return Array.from(this.examples.keys());
  }

  private selectRandom(examples: FewShotExample[], count: number): FewShotExample[] {
    const shuffled = [...examples].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  private selectBySimilarity(
    examples: FewShotExample[],
    input: string,
    count: number
  ): FewShotExample[] {
    // Simple similarity based on word overlap
    const inputWords = new Set(input.toLowerCase().split(/\s+/));

    const scored = examples.map((example) => {
      const exampleWords = new Set(example.input.toLowerCase().split(/\s+/));
      const intersection = new Set([...inputWords].filter((x) => exampleWords.has(x)));
      const similarity = intersection.size / Math.max(inputWords.size, exampleWords.size);
      return { example, similarity };
    });

    scored.sort((a, b) => b.similarity - a.similarity);
    return scored.slice(0, count).map((s) => s.example);
  }

  private selectRecent(examples: FewShotExample[], count: number): FewShotExample[] {
    // Assume examples are already in order, take the most recent
    return examples.slice(-count);
  }
}
