# @aether/prompt-optimizer

A production-ready prompt engineering optimization library with A/B testing, metrics tracking, and template system.

## Features

- **A/B Testing Framework**: Test multiple prompt variants with weighted distribution
- **Performance Metrics Tracking**: Track success rate, latency, quality, and cost
- **Prompt Template System**: Create and manage reusable prompt templates with variables
- **Few-Shot Example Management**: Manage and select few-shot examples with multiple strategies
- **Chain-of-Thought Generation**: Generate CoT prompts for complex reasoning tasks
- **TypeScript Types**: Full TypeScript support with Zod schemas
- **Comprehensive Tests**: Full test coverage with Vitest

## Installation

```bash
npm install @aether/prompt-optimizer
```

## Quick Start

### Prompt Templates

```typescript
import { TemplateEngine } from '@aether/prompt-optimizer';

const engine = new TemplateEngine();

// Create a template
const template = engine.createTemplate(
  'greeting',
  'Hello {{name}}, you are {{age}} years old.',
  'A simple greeting template',
  ['greeting', 'personal']
);

// Compile with variables
const compiled = engine.compile(template.id, [
  { name: 'name', value: 'Alice' },
  { name: 'age', value: '30' }
]);

console.log(compiled.text);
// Output: "Hello Alice, you are 30 years old."
```

### A/B Testing

```typescript
import { ABTestingEngine } from '@aether/prompt-optimizer';

const abTest = new ABTestingEngine();

// Create an A/B test
const test = abTest.createTest(
  'Greeting A/B Test',
  [
    { name: 'Variant A', prompt: 'Hello {{name}}!', weight: 0.5 },
    { name: 'Variant B', prompt: 'Hi there, {{name}}!', weight: 0.5 }
  ],
  'Testing different greeting styles'
);

// Select a variant for each request
const variant = abTest.selectVariant(test.id);
console.log(`Selected: ${variant.name}`);

// Record results
abTest.recordResult(test.id, {
  variantId: variant.id,
  success: true,
  latency: 1200,
  quality: 0.9,
  cost: 0.001,
  timestamp: new Date()
});

// Get performance metrics
const metrics = abTest.getPerformanceMetrics(test.id);
console.log(`Success rate: ${(metrics.successRate * 100).toFixed(2)}%`);
console.log(`Best variant: ${metrics.bestVariant}`);
```

### Few-Shot Learning

```typescript
import { FewShotManager } from '@aether/prompt-optimizer';

const fewShot = new FewShotManager();

// Add examples
fewShot.addExamples('sentiment', [
  { input: 'I love this product!', output: 'positive' },
  { input: 'This is terrible.', output: 'negative' },
  { input: 'It\'s okay, not great.', output: 'neutral' }
]);

// Select examples for a new input
const selected = fewShot.selectExamples(
  { examples: fewShot.getExamples('sentiment'), selectionStrategy: 'similarity' },
  'I really like this item!'
);

// Format prompt with examples
const prompt = fewShot.formatPrompt(
  'Classify the sentiment of the following text:',
  selected,
  'I really like this item!'
);

console.log(prompt);
```

### Chain-of-Thought

```typescript
import { ChainOfThoughtGenerator } from '@aether/prompt-optimizer';

const cot = new ChainOfThoughtGenerator({
  enableReasoning: true,
  maxSteps: 5,
  showReasoning: true
});

// Generate CoT prompt
const cotPrompt = cot.generatePrompt(
  'You are a helpful assistant.',
  'solve this math problem'
);

// Format for input
const formatted = cot.formatPrompt(cotPrompt, 'What is 15 * 23?');
console.log(formatted);

// Parse reasoning from response
const response = await llm.generate(formatted);
const { reasoning, answer } = cot.parseReasoning(response);
console.log('Reasoning:', reasoning);
console.log('Answer:', answer);
```

### Metrics Tracking

```typescript
import { MetricsTracker } from '@aether/prompt-optimizer';

const tracker = new MetricsTracker();

// Record results
tracker.recordResult('prompt-1', {
  success: true,
  latency: 1000,
  quality: 0.85,
  cost: 0.002,
  timestamp: new Date()
});

// Get metrics
const metrics = tracker.getMetrics('prompt-1');
console.log(`Success rate: ${(metrics.successRate * 100).toFixed(2)}%`);
console.log(`Average quality: ${metrics.averageQuality.toFixed(2)}`);

// Compare multiple prompts
const comparison = tracker.comparePrompts(['prompt-1', 'prompt-2']);
console.log(`Best prompt: ${comparison.best}`);
console.log('Rankings:', comparison.rankings);
```

## API Reference

### TemplateEngine

#### Methods

- `createTemplate(name, template, description?, tags?)` - Create a new template
- `compile(templateId, variables)` - Compile template with variables
- `getTemplate(id)` - Get a template by ID
- `getAllTemplates()` - Get all templates
- `updateTemplate(id, updates)` - Update a template
- `deleteTemplate(id)` - Delete a template
- `searchTemplates(query)` - Search templates by name, description, or tags

### ABTestingEngine

#### Methods

- `createTest(name, variants, description?)` - Create an A/B test
- `selectVariant(testId)` - Select a variant based on weights
- `recordResult(testId, result)` - Record a test result
- `getTest(testId)` - Get a test by ID
- `getAllTests()` - Get all tests
- `getResults(testId)` - Get all results for a test
- `getPerformanceMetrics(testId)` - Get performance metrics
- `concludeTest(testId, winnerId?)` - Conclude a test and select winner
- `pauseTest(testId)` - Pause a test
- `resumeTest(testId)` - Resume a paused test
- `deleteTest(testId)` - Delete a test

### FewShotManager

#### Methods

- `addExamples(category, examples)` - Add examples to a category
- `getExamples(category)` - Get examples from a category
- `selectExamples(config, input, category?)` - Select examples using a strategy
- `formatPrompt(basePrompt, examples, input, format?)` - Format prompt with examples
- `deleteCategory(category)` - Delete a category
- `getAllCategories()` - Get all category names

### ChainOfThoughtGenerator

#### Methods

- `generatePrompt(basePrompt, task)` - Generate a CoT prompt
- `formatPrompt(cotPrompt, input)` - Format CoT prompt for input
- `parseReasoning(response)` - Parse reasoning from LLM response
- `updateConfig(config)` - Update CoT configuration
- `getConfig()` - Get current configuration

### MetricsTracker

#### Methods

- `recordResult(promptId, result)` - Record a result for a prompt
- `getMetrics(promptId)` - Get metrics for a prompt
- `getAllMetrics()` - Get metrics for all prompts
- `getResults(promptId)` - Get all results for a prompt
- `clearResults(promptId)` - Clear results for a prompt
- `clearAll()` - Clear all results
- `comparePrompts(promptIds)` - Compare multiple prompts

## Types

```typescript
interface PromptTemplate {
  id: string;
  name: string;
  template: string;
  variables: string[];
  description?: string;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

interface PromptVariable {
  name: string;
  value: string;
  type?: 'string' | 'number' | 'boolean' | 'array';
}

interface ABTest {
  id: string;
  name: string;
  description?: string;
  variants: PromptVariant[];
  status: 'active' | 'paused' | 'completed';
  createdAt: Date;
  updatedAt: Date;
  winner?: string;
}

interface FewShotExample {
  input: string;
  output: string;
  metadata?: Record<string, any>;
}

interface CoTConfig {
  enableReasoning: boolean;
  maxSteps?: number;
  stepDelimiter?: string;
  showReasoning?: boolean;
}
```

## Testing

```bash
npm test
npm run test:coverage
npm run test:ui
```

## License

MIT
