/**
 * Chess Engine
 * Core game logic for Chess - Substrate implementation
 */

import {
  GameState,
  Board,
  Square,
  Piece,
  Position,
  Move,
  CastlingRights,
  Ruleset,
  Rule,
  GameEvent,
  SubstrateError,
  ErrorCodes,
  DEFAULT_RULESET
} from '../types/index';

// ============================================================================
// Engine Configuration
// ============================================================================

const BOARD_SIZE = 8;

// ============================================================================
// Game Engine
// ============================================================================

export class ChessEngine {
  private gameState: GameState;
  private ruleset: Ruleset;
  private eventLog: GameEvent[] = [];

  constructor() {
    this.gameState = this.createInitialState();
    this.ruleset = JSON.parse(JSON.stringify(DEFAULT_RULESET));
  }

  // ========================================================================
  // State Management
  // ========================================================================

  private createInitialState(): GameState {
    return {
      gameId: this.generateGameId(),
      timestamp: Date.now(),
      tick: 0,
      status: 'active',
      board: this.createInitialBoard(),
      currentPlayer: 'white',
      moveHistory: [],
      capturedPieces: [],
      castlingRights: {
        whiteKingSide: true,
        whiteQueenSide: true,
        blackKingSide: true,
        blackQueenSide: true
      },
      enPassantTarget: null,
      halfMoveClock: 0,
      fullMoveNumber: 1,
      gameMode: 'classic'
    };
  }

  private generateGameId(): string {
    return `chess-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private createInitialBoard(): Board {
    const squares: Square[][] = [];
    
    for (let rank = 0; rank < BOARD_SIZE; rank++) {
      squares[rank] = [];
      for (let file = 0; file < BOARD_SIZE; file++) {
        squares[rank][file] = {
          piece: this.getInitialPiece(file, rank),
          position: { file, rank }
        };
      }
    }

    return { squares };
  }

  private getInitialPiece(file: number, rank: number): Piece | null {
    // Pawns
    if (rank === 1) {
      return { type: 'pawn', color: 'black', hasMoved: false };
    }
    if (rank === 6) {
      return { type: 'pawn', color: 'white', hasMoved: false };
    }

    // Back rank pieces
    if (rank === 0 || rank === 7) {
      const color = rank === 0 ? 'black' : 'white';
      const pieces: Piece['type'][] = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];
      return { type: pieces[file], color, hasMoved: false };
    }

    return null;
  }

  // ========================================================================
  // Core Game Loop
  // ========================================================================

  public tick(): GameState {
    if (this.gameState.status !== 'active') {
      return this.gameState;
    }

    this.gameState.tick++;
    this.gameState.timestamp = Date.now();

    // Check for checkmate/stalemate
    this.checkGameEnd();

    return this.gameState;
  }

  private checkGameEnd(): void {
    const checkRule = this.getRule('check');
    if (!checkRule?.enabled) return;

    if (this.isCheckmate(this.gameState.currentPlayer)) {
      this.gameState.status = 'checkmate';
      this.addEvent({
        type: 'checkmate',
        timestamp: Date.now(),
        data: { winner: this.gameState.currentPlayer === 'white' ? 'black' : 'white' }
      });
    } else if (this.isStalemate()) {
      this.gameState.status = 'stalemate';
      this.addEvent({
        type: 'stalemate',
        timestamp: Date.now(),
        data: {}
      });
    }
  }

  // ========================================================================
  // Movement and Validation
  // ========================================================================

  public submitMove(move: Move): boolean {
    if (this.gameState.status !== 'active') {
      return false;
    }

    // Validate move
    if (!this.isValidMove(move)) {
      return false;
    }

    // Execute move
    this.executeMove(move);

    // Switch player
    this.gameState.currentPlayer = this.gameState.currentPlayer === 'white' ? 'black' : 'white';
    
    // Update full move number after black moves
    if (this.gameState.currentPlayer === 'white') {
      this.gameState.fullMoveNumber++;
    }

    // Tick engine
    this.gameState = this.tick();

    return true;
  }

  private isValidMove(move: Move): boolean {
    const { from, to, piece } = move;

    // Check bounds
    if (!this.isOnBoard(from) || !this.isOnBoard(to)) {
      return false;
    }

    // Check piece exists at from
    const fromSquare = this.gameState.board.squares[from.rank][from.file];
    if (!fromSquare.piece || fromSquare.piece.type !== piece.type) {
      return false;
    }

    // Check correct color
    if (fromSquare.piece.color !== this.gameState.currentPlayer) {
      return false;
    }

    // Check destination not own piece
    const toSquare = this.gameState.board.squares[to.rank][to.file];
    if (toSquare.piece && toSquare.piece.color === this.gameState.currentPlayer) {
      return false;
    }

    // Check piece-specific movement rules
    if (!this.isValidPieceMove(piece, from, to)) {
      return false;
    }

    // Check if move leaves king in check
    if (this.wouldBeInCheck(move)) {
      return false;
    }

    return true;
  }

  private isOnBoard(pos: Position): boolean {
    return pos.file >= 0 && pos.file < BOARD_SIZE && pos.rank >= 0 && pos.rank < BOARD_SIZE;
  }

  private isValidPieceMove(piece: Piece, from: Position, to: Position): boolean {
    const dx = to.file - from.file;
    const dy = to.rank - from.rank;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    switch (piece.type) {
      case 'pawn':
        const direction = piece.color === 'white' ? -1 : 1;
        const startRank = piece.color === 'white' ? 6 : 1;
        
        // Forward move
        if (dx === 0) {
          if (dy === direction) {
            // Single forward
            return !this.gameState.board.squares[to.rank][to.file].piece;
          }
          if (dy === direction * 2 && from.rank === startRank) {
            // Double forward
            return !this.gameState.board.squares[to.rank][to.file].piece &&
                   !this.gameState.board.squares[from.rank + direction][from.file].piece;
          }
        }
        // Diagonal capture
        if (absDx === 1 && dy === direction) {
          const targetPiece = this.gameState.board.squares[to.rank][to.file].piece;
          if (targetPiece && targetPiece.color !== piece.color) {
            return true;
          }
          // En passant
          if (this.gameState.enPassantTarget &&
              to.file === this.gameState.enPassantTarget.file &&
              to.rank === this.gameState.enPassantTarget.rank) {
            return true;
          }
        }
        return false;

      case 'rook':
        return dx === 0 || dy === 0; // Straight lines

      case 'knight':
        return (absDx === 2 && absDy === 1) || (absDx === 1 && absDy === 2); // L-shape

      case 'bishop':
        return absDx === absDy; // Diagonals

      case 'queen':
        return dx === 0 || dy === 0 || absDx === absDy; // Rook + Bishop

      case 'king':
        return absDx <= 1 && absDy <= 1; // One square any direction

      default:
        return false;
    }
  }

  private wouldBeInCheck(move: Move): boolean {
    // Simulate move and check if king is in check
    const tempBoard = JSON.parse(JSON.stringify(this.gameState.board));
    
    // Execute move on temp board
    const fromSquare = tempBoard.squares[move.from.rank][move.from.file];
    const toSquare = tempBoard.squares[move.to.rank][move.to.file];
    
    toSquare.piece = fromSquare.piece;
    fromSquare.piece = null;

    // Find king position
    const kingPos = this.findKing(this.gameState.currentPlayer, tempBoard);
    if (!kingPos) return false;

    // Check if any opponent piece can attack king
    const opponent = this.gameState.currentPlayer === 'white' ? 'black' : 'white';
    for (let rank = 0; rank < BOARD_SIZE; rank++) {
      for (let file = 0; file < BOARD_SIZE; file++) {
        const square = tempBoard.squares[rank][file];
        if (square.piece && square.piece.color === opponent) {
          if (this.canAttack(square.piece, { file, rank }, kingPos, tempBoard)) {
            return true;
          }
        }
      }
    }

    return false;
  }

  private findKing(color: 'white' | 'black', board: Board): Position | null {
    for (let rank = 0; rank < BOARD_SIZE; rank++) {
      for (let file = 0; file < BOARD_SIZE; file++) {
        const square = board.squares[rank][file];
        if (square.piece && square.piece.type === 'king' && square.piece.color === color) {
          return { file, rank };
        }
      }
    }
    return null;
  }

  private canAttack(piece: Piece, from: Position, to: Position, board: Board): boolean {
    // Simplified attack check (same as movement rules)
    const dx = to.file - from.file;
    const dy = to.rank - from.rank;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    switch (piece.type) {
      case 'pawn':
        const direction = piece.color === 'white' ? -1 : 1;
        return absDx === 1 && dy === direction;

      case 'rook':
        return dx === 0 || dy === 0;

      case 'knight':
        return (absDx === 2 && absDy === 1) || (absDx === 1 && absDy === 2);

      case 'bishop':
        return absDx === absDy;

      case 'queen':
        return dx === 0 || dy === 0 || absDx === absDy;

      case 'king':
        return absDx <= 1 && absDy <= 1;

      default:
        return false;
    }
  }

  private executeMove(move: Move): void {
    const fromSquare = this.gameState.board.squares[move.from.rank][move.from.file];
    const toSquare = this.gameState.board.squares[move.to.rank][move.to.file];

    // Handle capture
    if (toSquare.piece) {
      this.gameState.capturedPieces.push(toSquare.piece);
      this.addEvent({
        type: 'capture',
        timestamp: Date.now(),
        data: { captured: toSquare.piece, by: move.piece }
      });
    }

    // Move piece
    toSquare.piece = fromSquare.piece;
    fromSquare.piece = null;

    // Mark piece as moved
    if (toSquare.piece) {
      toSquare.piece.hasMoved = true;
    }

    // Handle en passant
    if (move.special === 'en_passant') {
      const captureRank = move.from.rank;
      const captureFile = move.to.file;
      const capturedPawn = this.gameState.board.squares[captureRank][captureFile].piece;
      if (capturedPawn) {
        this.gameState.capturedPieces.push(capturedPawn);
        this.gameState.board.squares[captureRank][captureFile].piece = null;
      }
    }

    // Handle promotion
    if (move.special === 'promotion' && move.promotionPiece) {
      toSquare.piece = move.promotionPiece;
    }

    // Update en passant target
    if (move.piece.type === 'pawn' && Math.abs(move.to.rank - move.from.rank) === 2) {
      this.gameState.enPassantTarget = {
        file: move.from.file,
        rank: (move.from.rank + move.to.rank) / 2
      };
    } else {
      this.gameState.enPassantTarget = null;
    }

    // Add to history
    this.gameState.moveHistory.push(move);

    this.addEvent({
      type: 'move',
      timestamp: Date.now(),
      data: { from: move.from, to: move.to, piece: move.piece }
    });
  }

  private isCheckmate(color: 'white' | 'black'): boolean {
    return this.isInCheck(color) && !this.hasLegalMoves(color);
  }

  private isStalemate(): boolean {
    return !this.isInCheck(this.gameState.currentPlayer) && !this.hasLegalMoves(this.gameState.currentPlayer);
  }

  private isInCheck(color: 'white' | 'black'): boolean {
    const kingPos = this.findKing(color, this.gameState.board);
    if (!kingPos) return false;

    const opponent = color === 'white' ? 'black' : 'white';
    for (let rank = 0; rank < BOARD_SIZE; rank++) {
      for (let file = 0; file < BOARD_SIZE; file++) {
        const square = this.gameState.board.squares[rank][file];
        if (square.piece && square.piece.color === opponent) {
          if (this.canAttack(square.piece, { file, rank }, kingPos, this.gameState.board)) {
            return true;
          }
        }
      }
    }
    return false;
  }

  private hasLegalMoves(color: 'white' | 'black'): boolean {
    // Check all pieces for legal moves
    for (let rank = 0; rank < BOARD_SIZE; rank++) {
      for (let file = 0; file < BOARD_SIZE; file++) {
        const square = this.gameState.board.squares[rank][file];
        if (square.piece && square.piece.color === color) {
          // Try all possible destinations
          for (let toRank = 0; toRank < BOARD_SIZE; toRank++) {
            for (let toFile = 0; toFile < BOARD_SIZE; toFile++) {
              const move: Move = {
                from: { file, rank },
                to: { file: toFile, rank: toRank },
                piece: square.piece,
                capturedPiece: this.gameState.board.squares[toRank][toFile].piece,
                special: 'normal'
              };
              if (this.isValidMove(move)) {
                return true;
              }
            }
          }
        }
      }
    }
    return false;
  }

  // ========================================================================
  // Rule Management
  // ========================================================================

  private getRule(ruleId: string): Rule | undefined {
    return this.ruleset.rules.find(r => r.id === ruleId);
  }

  public updateRuleset(ruleset: Ruleset): void {
    this.ruleset = ruleset;
  }

  public getRuleset(): Ruleset {
    return this.ruleset;
  }

  // ========================================================================
  // Direct State Access (for 4-power API layer)
  // ========================================================================

  public getState(): GameState {
    return JSON.parse(JSON.stringify(this.gameState));
  }

  public setState(state: GameState): void {
    this.gameState = JSON.parse(JSON.stringify(state));
  }

  public getEvents(): GameEvent[] {
    return [...this.eventLog];
  }

  public clearEvents(): void {
    this.eventLog = [];
  }

  private addEvent(event: GameEvent): void {
    this.eventLog.push(event);
  }
}
