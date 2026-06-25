/**
 * 4-Power API Implementation for Chess
 * Implements get_state, mutate (NLI), rewrite_rules, submit_move
 */

import {
  ChessEngine
} from '../engine/chess-engine';

import {
  GameState,
  Ruleset,
  GetStateRequest,
  GetStateResponse,
  MutateRequest,
  MutateResponse,
  RewriteRulesRequest,
  RewriteRulesResponse,
  SubmitMoveRequest,
  SubmitMoveResponse,
  Mutation,
  MutationResult,
  RuleChange,
  GameEvent,
  SubstrateError,
  ErrorCodes,
  Piece,
  Position,
  DEFAULT_RULESET
} from '../types/index';

// ============================================================================
// Substrate API
// ============================================================================

export class SubstrateAPI {
  private engine: ChessEngine;
  private mutationHistory: Mutation[] = [];

  constructor(engine: ChessEngine) {
    this.engine = engine;
  }

  // ========================================================================
  // Power 1: get_state - Read-only state access
  // ========================================================================

  public getState(request: GetStateRequest): GetStateResponse {
    const gameState = this.engine.getState();
    const ruleset = this.engine.getRuleset();

    return {
      gameState,
      ruleset,
      metadata: {
        gameId: gameState.gameId,
        tick: gameState.tick,
        timestamp: gameState.timestamp
      }
    };
  }

  // ========================================================================
  // Power 2: mutate (NLI) - Natural language state mutation
  // ========================================================================

  public async mutate(request: MutateRequest): Promise<MutateResponse> {
    const gameState = this.engine.getState();

    // Parse natural language mutation
    const parsedMutation = this.parseMutation(request.mutation, gameState);
    parsedMutation.agentId = request.agentId;
    
    // Apply mutation
    const result = this.applyMutation(parsedMutation, gameState);

    // Update engine state if successful
    if (result.success) {
      this.engine.setState(result.gameState);
      this.mutationHistory.push(parsedMutation);
    }

    return {
      result,
      parsedMutation,
      confidence: parsedMutation.confidence
    };
  }

  private parseMutation(description: string, gameState: GameState): Mutation {
    const lowerDesc = description.toLowerCase();
    let type: Mutation['type'] = 'add_piece';
    let parameters: Record<string, any> = {};
    let confidence = 0.8;

    if (lowerDesc.includes('add') && lowerDesc.includes('queen')) {
      type = 'add_piece';
      parameters = {
        pieceType: 'queen',
        color: gameState.currentPlayer,
        position: { file: 3, rank: 3 }
      };
    } else if (lowerDesc.includes('add') && lowerDesc.includes('knight')) {
      type = 'add_piece';
      parameters = {
        pieceType: 'knight',
        color: gameState.currentPlayer,
        position: { file: 2, rank: 2 }
      };
    } else if (lowerDesc.includes('remove') && lowerDesc.includes('piece')) {
      type = 'remove_piece';
      parameters = { position: { file: 3, rank: 3 } };
    } else if (lowerDesc.includes('teleport') && lowerDesc.includes('king')) {
      type = 'teleport_piece';
      parameters = {
        pieceType: 'king',
        color: gameState.currentPlayer,
        targetPosition: { file: 4, rank: 4 }
      };
    } else if (lowerDesc.includes('mode')) {
      type = 'game_mode';
      if (lowerDesc.includes('chaos')) {
        parameters = { mode: 'chaos' };
      }
    } else {
      confidence = 0.3;
    }

    return {
      id: `mutation-${Date.now()}`,
      timestamp: Date.now(),
      agentId: 'unknown',
      type,
      description,
      parameters,
      confidence
    };
  }

  private applyMutation(mutation: Mutation, gameState: GameState): MutationResult {
    const errors: string[] = [];
    let newState = JSON.parse(JSON.stringify(gameState));

    try {
      switch (mutation.type) {
        case 'add_piece':
          const newPiece: Piece = {
            type: mutation.parameters.pieceType || 'queen',
            color: mutation.parameters.color || 'white',
            hasMoved: false
          };
          const pos = mutation.parameters.position;
          newState.board.squares[pos.rank][pos.file].piece = newPiece;
          break;

        case 'remove_piece':
          const removePos = mutation.parameters.position;
          newState.board.squares[removePos.rank][removePos.file].piece = null;
          break;

        case 'teleport_piece':
          const targetPos = mutation.parameters.targetPosition;
          for (let rank = 0; rank < 8; rank++) {
            for (let file = 0; file < 8; file++) {
              const square = newState.board.squares[rank][file];
              if (square.piece && square.piece.type === mutation.parameters.pieceType) {
                newState.board.squares[targetPos.rank][targetPos.file].piece = square.piece;
                square.piece = null;
              }
            }
          }
          break;

        case 'game_mode':
          newState.gameMode = mutation.parameters.mode;
          break;

        default:
          errors.push(`Unknown mutation type: ${mutation.type}`);
      }
    } catch (error) {
      errors.push(`Mutation failed: ${error}`);
    }

    return {
      success: errors.length === 0,
      gameState: newState,
      appliedMutations: [mutation],
      errors
    };
  }

  // ========================================================================
  // Power 3: rewrite_rules - Modify game rules
  // ========================================================================

  public rewriteRules(request: RewriteRulesRequest): RewriteRulesResponse {
    const ruleset = this.engine.getRuleset();
    const errors: string[] = [];
    const appliedChanges: RuleChange[] = [];

    for (const change of request.ruleChanges) {
      try {
        switch (change.action) {
          case 'enable':
            const ruleToEnable = ruleset.rules.find(r => r.id === change.ruleId);
            if (ruleToEnable) {
              ruleToEnable.enabled = true;
              appliedChanges.push(change);
            }
            break;

          case 'disable':
            const ruleToDisable = ruleset.rules.find(r => r.id === change.ruleId);
            if (ruleToDisable) {
              ruleToDisable.enabled = false;
              appliedChanges.push(change);
            }
            break;

          case 'modify':
            const ruleToModify = ruleset.rules.find(r => r.id === change.ruleId);
            if (ruleToModify && change.parameters) {
              ruleToModify.parameters = { ...ruleToModify.parameters, ...change.parameters };
              appliedChanges.push(change);
            }
            break;

          case 'add':
            ruleset.rules.push({
              id: change.ruleId,
              name: change.parameters?.name || 'New Rule',
              description: change.parameters?.description || '',
              enabled: true,
              type: change.parameters?.type || 'special',
              parameters: change.parameters?.parameters || {}
            });
            appliedChanges.push(change);
            break;

          case 'remove':
            ruleset.rules = ruleset.rules.filter(r => r.id !== change.ruleId);
            appliedChanges.push(change);
            break;
        }
      } catch (error) {
        errors.push(`Failed to apply change to ${change.ruleId}: ${error}`);
      }
    }

    ruleset.lastModified = Date.now();
    this.engine.updateRuleset(ruleset);

    return {
      success: errors.length === 0,
      ruleset,
      appliedChanges,
      errors
    };
  }

  // ========================================================================
  // Power 4: submit_move - Standard gameplay action
  // ========================================================================

  public submitMove(request: SubmitMoveRequest): SubmitMoveResponse {
    const gameState = this.engine.getState();
    const errors: string[] = [];
    const events: GameEvent[] = [];

    if (gameState.status !== 'active') {
      errors.push('Game is not active');
      return {
        success: false,
        gameState,
        events,
        errors
      };
    }

    const moveSuccess = this.engine.submitMove(request.move);

    if (!moveSuccess) {
      errors.push('Invalid move');
    }

    const newState = this.engine.getState();
    events.push(...this.engine.getEvents());
    this.engine.clearEvents();

    return {
      success: moveSuccess,
      gameState: newState,
      events,
      errors
    };
  }

  // ========================================================================
  // Utility Methods
  // ========================================================================

  public getMutationHistory(): Mutation[] {
    return [...this.mutationHistory];
  }
}
