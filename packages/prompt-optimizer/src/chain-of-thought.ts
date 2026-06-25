import {
  ChainOfThoughtPrompt,
  CoTConfig,
  ChainOfThoughtPromptSchema,
  CoTConfigSchema
} from './types';

export class ChainOfThoughtGenerator {
  private config: CoTConfig;

  constructor(config: Partial<CoTConfig> = {}) {
    this.config = {
      enableReasoning: config.enableReasoning ?? true,
      maxSteps: config.maxSteps ?? 5,
      stepDelimiter: config.stepDelimiter ?? '\n\n',
      showReasoning: config.showReasoning ?? true
    };

    CoTConfigSchema.parse(this.config);
  }

  generatePrompt(basePrompt: string, task: string): ChainOfThoughtPrompt {
    const reasoningSteps = this.generateReasoningSteps(task);
    const prompt: ChainOfThoughtPrompt = {
      basePrompt,
      reasoningSteps,
      finalAnswerFormat: 'Answer:'
    };

    ChainOfThoughtPromptSchema.parse(prompt);
    return prompt;
  }

  formatPrompt(cotPrompt: ChainOfThoughtPrompt, input: string): string {
    if (!this.config.enableReasoning) {
      return `${cotPrompt.basePrompt}\n\n${input}`;
    }

    let prompt = cotPrompt.basePrompt;

    if (this.config.showReasoning) {
      prompt += '\n\nThink step by step:';
      for (const step of cotPrompt.reasoningSteps) {
        prompt += `${this.config.stepDelimiter}${step}`;
      }
    }

    prompt += `\n\n${input}`;
    if (cotPrompt.finalAnswerFormat) {
      prompt += `\n\n${cotPrompt.finalAnswerFormat}`;
    }

    return prompt;
  }

  parseReasoning(response: string): {
    reasoning: string[];
    answer: string;
  } {
    const delimiter = this.config.stepDelimiter;
    const parts = response.split(delimiter);

    // Last part is usually the answer
    const answer = parts[parts.length - 1].trim();
    const reasoning = parts.slice(0, -1).map((p) => p.trim());

    return { reasoning, answer };
  }

  updateConfig(config: Partial<CoTConfig>): void {
    this.config = { ...this.config, ...config };
    CoTConfigSchema.parse(this.config);
  }

  getConfig(): CoTConfig {
    return { ...this.config };
  }

  private generateReasoningSteps(task: string): string[] {
    // Generate generic reasoning steps based on task type
    const steps: string[] = [];

    if (task.toLowerCase().includes('solve') || task.toLowerCase().includes('calculate')) {
      steps.push('1. Understand the problem');
      steps.push('2. Identify the key information');
      steps.push('3. Determine the approach');
      steps.push('4. Perform the calculation');
      steps.push('5. Verify the result');
    } else if (task.toLowerCase().includes('analyze') || task.toLowerCase().includes('explain')) {
      steps.push('1. Identify the main components');
      steps.push('2. Examine relationships');
      steps.push('3. Consider implications');
      steps.push('4. Draw conclusions');
    } else if (task.toLowerCase().includes('write') || task.toLowerCase().includes('create')) {
      steps.push('1. Understand the requirements');
      steps.push('2. Plan the structure');
      steps.push('3. Draft the content');
      steps.push('4. Review and refine');
    } else {
      // Generic steps
      steps.push('1. Understand the task');
      steps.push('2. Break down the problem');
      steps.push('3. Consider different approaches');
      steps.push('4. Formulate the solution');
      steps.push('5. Verify the answer');
    }

    // Limit to max steps
    return steps.slice(0, this.config.maxSteps);
  }
}
