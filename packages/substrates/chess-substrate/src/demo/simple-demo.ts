/**
 * Chess Substrate - Simple Demo
 * Basic demonstration of the 4-power API for Chess
 */

import { ChessEngine } from '../engine/chess-engine';
import { SubstrateAPI } from '../api/substrate-api';

async function runSimpleDemo() {
  console.log('=== Chess Substrate - Simple Demo ===\n');

  // Initialize engine and API
  const engine = new ChessEngine();
  const api = new SubstrateAPI(engine);

  // Get initial state
  console.log('1. Get Initial State');
  const stateResponse = api.getState({
    agentId: 'demo-agent',
    timestamp: Date.now()
  });
  console.log(`   Game ID: ${stateResponse.metadata.gameId}`);
  console.log(`   Current Player: ${stateResponse.gameState.currentPlayer}`);
  console.log(`   Status: ${stateResponse.gameState.status}`);
  console.log(`   Full Move Number: ${stateResponse.gameState.fullMoveNumber}\n`);

  // Submit move (e2-e4 pawn push)
  console.log('2. Submit Move (e2-e4 pawn push)');
  const moveResponse = api.submitMove({
    agentId: 'demo-agent',
    timestamp: Date.now(),
    move: {
      from: { file: 4, rank: 6 },
      to: { file: 4, rank: 4 },
      piece: { type: 'pawn', color: 'white', hasMoved: false },
      capturedPiece: null,
      special: 'normal'
    }
  });
  console.log(`   Success: ${moveResponse.success}`);
  console.log(`   Current Player: ${moveResponse.gameState.currentPlayer}`);
  console.log(`   Full Move Number: ${moveResponse.gameState.fullMoveNumber}\n`);

  // Apply mutation (add queen)
  console.log('3. Apply Mutation (add queen)');
  const mutateResponse = await api.mutate({
    agentId: 'demo-agent',
    timestamp: Date.now(),
    mutation: 'add a queen to the board'
  });
  console.log(`   Success: ${mutateResponse.result.success}`);
  console.log(`   Confidence: ${mutateResponse.confidence}\n`);

  // Rewrite rules (disable castling)
  console.log('4. Rewrite Rules (disable castling)');
  const rulesResponse = api.rewriteRules({
    agentId: 'demo-agent',
    timestamp: Date.now(),
    ruleChanges: [
      {
        ruleId: 'castling',
        action: 'disable'
      }
    ]
  });
  console.log(`   Success: ${rulesResponse.success}`);
  console.log(`   Applied changes: ${rulesResponse.appliedChanges.length}\n`);

  // Get final state
  console.log('5. Get Final State');
  const finalState = api.getState({
    agentId: 'demo-agent',
    timestamp: Date.now()
  });
  console.log(`   Game Mode: ${finalState.gameState.gameMode}`);
  console.log(`   Status: ${finalState.gameState.status}`);
  console.log(`   Move History: ${finalState.gameState.moveHistory.length} moves`);
  console.log(`   Rules: ${finalState.ruleset.rules.filter(r => r.enabled).length} enabled\n`);

  console.log('=== Demo Complete ===');
}

runSimpleDemo().catch(console.error);
