/**
 * Game Matrix Substrate - Chess Types
 * Reference implementation for Chess game
 */

// ============================================================================
// Core Game State
// ============================================================================

export interface GameState {
  // Game metadata
  gameId: string;
  timestamp: number;
  tick: number;
  status: 'active' | 'paused' | 'checkmate' | 'stalemate' | 'draw' | 'resigned';
  
  // Chess-specific state
  board: Board;
  currentPlayer: 'white' | 'black';
  moveHistory: Move[];
  capturedPieces: Piece[];
  castlingRights: CastlingRights;
  enPassantTarget: Position | null;
  halfMoveClock: number; // For 50-move rule
  fullMoveNumber: number;
  gameMode: 'classic' | 'chaos' | 'multi_variant';
}

export interface Board {
  squares: Square[][]; // 8x8 board
}

export interface Square {
  piece: Piece | null;
  position: Position;
}

export interface Piece {
  type: 'pawn' | 'rook' | 'knight' | 'bishop' | 'queen' | 'king';
  color: 'white' | 'black';
  hasMoved: boolean;
}

export interface Position {
  file: number; // 0-7 (a-h)
  rank: number; // 0-7 (1-8)
}

export interface Move {
  from: Position;
  to: Position;
  piece: Piece;
  capturedPiece: Piece | null;
  special: 'normal' | 'castling' | 'en_passant' | 'promotion' | 'check' | 'checkmate';
  promotionPiece?: Piece;
}

export interface CastlingRights {
  whiteKingSide: boolean;
  whiteQueenSide: boolean;
  blackKingSide: boolean;
  blackQueenSide: boolean;
}

// ============================================================================
// Ruleset
// ============================================================================

export interface Ruleset {
  version: string;
  name: string;
  lastModified: number;
  rules: Rule[];
}

export interface Rule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  type: 'movement' | 'capture' | 'check' | 'castling' | 'en_passant' | 'promotion' | 'special';
  parameters: Record<string, any>;
}

// Default Chess ruleset
export const DEFAULT_RULESET: Ruleset = {
  version: '1.0.0',
  name: 'Classic Chess',
  lastModified: Date.now(),
  rules: [
    {
      id: 'movement',
      name: 'Standard Movement',
      description: 'Pieces move according to standard chess rules',
      enabled: true,
      type: 'movement',
      parameters: {
        pawnDoubleMove: true,
        knightLShape: true
      }
    },
    {
      id: 'capture',
      name: 'Capture Rules',
      description: 'Pieces capture by moving to opponent square',
      enabled: true,
      type: 'capture',
      parameters: {
        enPassant: true,
        pawnCaptureDiagonal: true
      }
    },
    {
      id: 'check',
      name: 'Check Detection',
      description: 'Game ends on checkmate',
      enabled: true,
      type: 'check',
      parameters: {
        checkmateEndsGame: true,
        stalemateEndsGame: true
      }
    },
    {
      id: 'castling',
      name: 'Castling',
      description: 'King and rook special move',
      enabled: true,
      type: 'castling',
      parameters: {
        kingHasNotMoved: true,
        rookHasNotMoved: true,
        pathClear: true,
        notInCheck: true
      }
    },
    {
      id: 'en_passant',
      name: 'En Passant',
      description: 'Pawn capture of pawn that just moved two squares',
      enabled: true,
      type: 'en_passant',
      parameters: {
        immediateCaptureOnly: true
      }
    },
    {
      id: 'promotion',
      name: 'Pawn Promotion',
      description: 'Pawn promotes when reaching last rank',
      enabled: true,
      type: 'promotion',
      parameters: {
        promoteToQueen: true,
        allowOtherPieces: true
      }
    }
  ]
};

// ============================================================================
// Mutation (NLI - Natural Language Interface)
// ============================================================================

export interface Mutation {
  id: string;
  timestamp: number;
  agentId: string;
  type: 'add_piece' | 'remove_piece' | 'modify_piece' | 'teleport_piece' | 'modify_board' | 'game_mode';
  description: string;
  parameters: Record<string, any>;
  confidence: number; // 0-1
}

export interface MutationResult {
  success: boolean;
  gameState: GameState;
  appliedMutations: Mutation[];
  errors: string[];
}

// ============================================================================
// 4-Power API Surface
// ============================================================================

// Power 1: get_state - Read-only state access
export interface GetStateRequest {
  agentId: string;
  timestamp: number;
  filters?: StateFilter;
}

export interface StateFilter {
  includeHistory?: boolean;
  includeRuleset?: boolean;
  moveRange?: [number, number];
}

export interface GetStateResponse {
  gameState: GameState;
  ruleset: Ruleset;
  metadata: {
    gameId: string;
    tick: number;
    timestamp: number;
  };
}

// Power 2: mutate (NLI) - Natural language state mutation
export interface MutateRequest {
  agentId: string;
  timestamp: number;
  mutation: string; // Natural language description
  context?: string;
}

export interface MutateResponse {
  result: MutationResult;
  parsedMutation: Mutation;
  confidence: number;
}

// Power 3: rewrite_rules - Modify game rules
export interface RewriteRulesRequest {
  agentId: string;
  timestamp: number;
  ruleChanges: RuleChange[];
}

export interface RuleChange {
  ruleId: string;
  action: 'enable' | 'disable' | 'modify' | 'add' | 'remove';
  parameters?: Record<string, any>;
}

export interface RewriteRulesResponse {
  success: boolean;
  ruleset: Ruleset;
  appliedChanges: RuleChange[];
  errors: string[];
}

// Power 4: submit_move - Standard gameplay action
export interface SubmitMoveRequest {
  agentId: string;
  timestamp: number;
  move: Move;
}

export interface SubmitMoveResponse {
  success: boolean;
  gameState: GameState;
  events: GameEvent[];
  errors: string[];
}

export interface GameEvent {
  type: 'move' | 'capture' | 'check' | 'checkmate' | 'stalemate' | 'castling' | 'en_passant' | 'promotion' | 'game_over' | 'piece_added' | 'piece_removed';
  timestamp: number;
  data: Record<string, any>;
}

// ============================================================================
// Agent Council Types
// ============================================================================

export interface CouncilAgent {
  id: string;
  name: string;
  role: 'director' | 'reality_warper' | 'player' | 'observer';
  capabilities: ('get_state' | 'mutate' | 'rewrite_rules' | 'submit_move')[];
}

export interface CouncilSession {
  id: string;
  gameId: string;
  agents: CouncilAgent[];
  activeAgent: string;
  turnOrder: string[];
  currentTurn: number;
  maxTurns: number;
}

// ============================================================================
// Error Types
// ============================================================================

export class SubstrateError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'SubstrateError';
  }
}

export const ErrorCodes = {
  INVALID_STATE: 'INVALID_STATE',
  INVALID_MUTATION: 'INVALID_MUTATION',
  RULE_VIOLATION: 'RULE_VIOLATION',
  AGENT_NOT_AUTHORIZED: 'AGENT_NOT_AUTHORIZED',
  GAME_OVER: 'GAME_OVER',
  INVALID_MOVE: 'INVALID_MOVE',
  ILLEGAL_MOVE: 'ILLEGAL_MOVE',
  KING_IN_CHECK: 'KING_IN_CHECK'
} as const;
