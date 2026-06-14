/**
 * LLM-based NLI Parser for Substrate
 * Uses language models to parse natural language mutations
 */

export interface LLMParseRequest {
  mutation: string;
  context: string;
  gameState: any;
  supportedMutations: string[];
}

export interface LLMParseResponse {
  parsedMutation: {
    type: string;
    parameters: Record<string, any>;
    confidence: number;
  };
  reasoning: string;
  alternatives: Array<{
    type: string;
    parameters: Record<string, any>;
    confidence: number;
  }>;
}

export interface LLMProvider {
  name: string;
  parse(request: LLMParseRequest): Promise<LLMParseResponse>;
}

export class OpenAIParser implements LLMProvider {
  name = 'OpenAI';
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async parse(request: LLMParseRequest): Promise<LLMParseResponse> {
    const systemPrompt = `You are a game mutation parser for the Game Matrix Substrate.
Parse natural language mutations into structured JSON.

Supported mutation types: ${request.supportedMutations.join(', ')}

Context: ${request.context}

Current game state: ${JSON.stringify(request.gameState, null, 2)}

Return JSON with this structure:
{
  "parsedMutation": {
    "type": "mutation_type",
    "parameters": { ... },
    "confidence": 0.0-1.0
  },
  "reasoning": "explanation of parsing decision",
  "alternatives": [...]
}`;

    const userPrompt = `Parse this mutation: "${request.mutation}"`;

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.3,
          response_format: { type: 'json_object' }
        })
      });

      const data = await response.json() as any;
      return JSON.parse(data.choices[0].message.content);
    } catch (error) {
      // Fallback to simple parsing if LLM fails
      return this.fallbackParse(request);
    }
  }

  private fallbackParse(request: LLMParseRequest): LLMParseResponse {
    const lower = request.mutation.toLowerCase();
    let type = 'unknown';
    let parameters: Record<string, any> = {};
    let confidence = 0.5;

    if (lower.includes('add') && lower.includes('snake')) {
      type = 'add_snake';
      parameters = { color: '#00FF00' };
      confidence = 0.7;
    } else if (lower.includes('add') && lower.includes('item')) {
      type = 'add_item';
      parameters = { name: 'Mystery Item' };
      confidence = 0.7;
    } else if (lower.includes('add') && lower.includes('queen')) {
      type = 'add_piece';
      parameters = { pieceType: 'queen' };
      confidence = 0.7;
    }

    return {
      parsedMutation: { type, parameters, confidence },
      reasoning: 'LLM unavailable, using keyword-based fallback',
      alternatives: []
    };
  }
}

export class AnthropicParser implements LLMProvider {
  name = 'Anthropic';
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async parse(request: LLMParseRequest): Promise<LLMParseResponse> {
    const systemPrompt = `You are a game mutation parser for the Game Matrix Substrate.
Parse natural language mutations into structured JSON.

Supported mutation types: ${request.supportedMutations.join(', ')}

Context: ${request.context}

Current game state: ${JSON.stringify(request.gameState, null, 2)}

Return JSON with this structure:
{
  "parsedMutation": {
    "type": "mutation_type",
    "parameters": { ... },
    "confidence": 0.0-1.0
  },
  "reasoning": "explanation of parsing decision",
  "alternatives": [...]
}`;

    const userPrompt = `Parse this mutation: "${request.mutation}"`;

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-opus-20240229',
          max_tokens: 1024,
          messages: [
            { role: 'user', content: systemPrompt + '\n\n' + userPrompt }
          ]
        })
      });

      const data = await response.json() as any;
      return JSON.parse(data.content[0].text);
    } catch (error) {
      return this.fallbackParse(request);
    }
  }

  private fallbackParse(request: LLMParseRequest): LLMParseResponse {
    const lower = request.mutation.toLowerCase();
    let type = 'unknown';
    let parameters: Record<string, any> = {};
    let confidence = 0.5;

    if (lower.includes('add') && lower.includes('snake')) {
      type = 'add_snake';
      parameters = { color: '#00FF00' };
      confidence = 0.7;
    } else if (lower.includes('add') && lower.includes('item')) {
      type = 'add_item';
      parameters = { name: 'Mystery Item' };
      confidence = 0.7;
    }

    return {
      parsedMutation: { type, parameters, confidence },
      reasoning: 'LLM unavailable, using keyword-based fallback',
      alternatives: []
    };
  }
}

export class LLMParser {
  private provider: LLMProvider;

  constructor(provider: LLMProvider) {
    this.provider = provider;
  }

  async parse(request: LLMParseRequest): Promise<LLMParseResponse> {
    return this.provider.parse(request);
  }

  setProvider(provider: LLMProvider): void {
    this.provider = provider;
  }
}

// Factory function to create parser based on environment
export function createLLMParser(): LLMParser {
  const apiKey = process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY;
  
  if (!apiKey) {
    console.warn('No LLM API key found, using simple parser');
    return new LLMParser(new SimpleParser());
  }

  if (process.env.OPENAI_API_KEY) {
    return new LLMParser(new OpenAIParser(process.env.OPENAI_API_KEY));
  }

  if (process.env.ANTHROPIC_API_KEY) {
    return new LLMParser(new AnthropicParser(process.env.ANTHROPIC_API_KEY));
  }

  return new LLMParser(new SimpleParser());
}

class SimpleParser implements LLMProvider {
  name = 'Simple';

  async parse(request: LLMParseRequest): Promise<LLMParseResponse> {
    const lower = request.mutation.toLowerCase();
    let type = 'unknown';
    let parameters: Record<string, any> = {};
    let confidence = 0.5;

    if (lower.includes('add') && lower.includes('snake')) {
      type = 'add_snake';
      parameters = { color: '#00FF00' };
      confidence = 0.7;
    } else if (lower.includes('add') && lower.includes('item')) {
      type = 'add_item';
      parameters = { name: 'Mystery Item' };
      confidence = 0.7;
    } else if (lower.includes('add') && lower.includes('dragon')) {
      type = 'add_dragon';
      parameters = { name: 'New Dragon' };
      confidence = 0.7;
    } else if (lower.includes('add') && lower.includes('queen')) {
      type = 'add_piece';
      parameters = { pieceType: 'queen' };
      confidence = 0.7;
    } else if (lower.includes('teleport')) {
      type = 'teleport_player';
      parameters = { targetX: 80, targetY: 56 };
      confidence = 0.6;
    }

    return {
      parsedMutation: { type, parameters, confidence },
      reasoning: 'Simple keyword-based parsing',
      alternatives: []
    };
  }
}
