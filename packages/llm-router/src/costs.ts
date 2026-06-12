import { Model, CostMetrics } from './types';

// Cost per 1k tokens (input/output) in USD
export const MODEL_COSTS: Record<Model, CostMetrics> = {
  // OpenAI pricing (as of 2024)
  [Model.GPT_4]: {
    inputCostPer1k: 0.03,
    outputCostPer1k: 0.06
  },
  [Model.GPT_4_TURBO]: {
    inputCostPer1k: 0.01,
    outputCostPer1k: 0.03
  },
  [Model.GPT_3_5_TURBO]: {
    inputCostPer1k: 0.0005,
    outputCostPer1k: 0.0015
  },
  // Anthropic pricing (as of 2024)
  [Model.CLAUDE_3_OPUS]: {
    inputCostPer1k: 0.015,
    outputCostPer1k: 0.075
  },
  [Model.CLAUDE_3_SONNET]: {
    inputCostPer1k: 0.003,
    outputCostPer1k: 0.015
  },
  [Model.CLAUDE_3_HAIKU]: {
    inputCostPer1k: 0.00025,
    outputCostPer1k: 0.00125
  },
  // Google pricing (as of 2024)
  [Model.GEMINI_PRO]: {
    inputCostPer1k: 0.0005,
    outputCostPer1k: 0.0015
  },
  [Model.GEMINI_ULTRA]: {
    inputCostPer1k: 0.01,
    outputCostPer1k: 0.03
  }
};

export function calculateCost(
  model: Model,
  inputTokens: number,
  outputTokens: number
): number {
  const costs = MODEL_COSTS[model];
  const inputCost = (inputTokens / 1000) * costs.inputCostPer1k;
  const outputCost = (outputTokens / 1000) * costs.outputCostPer1k;
  return inputCost + outputCost;
}

export function estimateTokens(text: string): number {
  // Rough estimate: ~4 characters per token
  return Math.ceil(text.length / 4);
}
