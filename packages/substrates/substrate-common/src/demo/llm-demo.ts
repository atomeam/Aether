/**
 * LLM Parser Demo
 * Demonstrates LLM-based NLI parsing for substrate
 */

import { createLLMParser, LLMParseRequest } from '../index';

async function runLLMParserDemo() {
  console.log('=== LLM Parser Demo ===\n');

  // Create parser (will use simple parser if no API key)
  const parser = createLLMParser();
  console.log(`Using parser: ${parser['provider'].name}\n`);

  // Test parsing mutations
  const mutations = [
    'add a second snake with blue color',
    'add a mystery item near the player',
    'teleport the player to a random position',
    'add a queen to the board'
  ];

  const supportedMutations = ['add_snake', 'add_item', 'teleport_player', 'add_piece'];

  for (const mutation of mutations) {
    console.log(`Parsing: "${mutation}"`);
    
    const request: LLMParseRequest = {
      mutation,
      context: 'Game state available',
      gameState: { currentLevel: 1, players: [{ id: 0, x: 80, y: 56 }] },
      supportedMutations
    };

    const response = await parser.parse(request);
    
    console.log(`  Type: ${response.parsedMutation.type}`);
    console.log(`  Parameters: ${JSON.stringify(response.parsedMutation.parameters)}`);
    console.log(`  Confidence: ${response.parsedMutation.confidence}`);
    console.log(`  Reasoning: ${response.reasoning}\n`);
  }

  console.log('=== Demo Complete ===');
}

runLLMParserDemo().catch(console.error);
