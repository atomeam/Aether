/**
 * Chess Visual Renderer
 * Canvas-based renderer for Chess substrate
 */

export interface ChessRendererConfig {
  canvas: HTMLCanvasElement;
  cellSize: number;
  colors: {
    lightSquare: string;
    darkSquare: string;
    whitePiece: string;
    blackPiece: string;
    highlight: string;
    lastMove: string;
  };
}

export class ChessRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private config: ChessRendererConfig;
  private pieceSymbols: Record<string, string> = {
    king: '♔',
    queen: '♕',
    rook: '♖',
    bishop: '♗',
    knight: '♘',
    pawn: '♙'
  };

  constructor(config: ChessRendererConfig) {
    this.canvas = config.canvas;
    this.ctx = this.canvas.getContext('2d')!;
    this.config = config;
  }

  render(gameState: any): void {
    const { width, height } = this.canvas;
    const { cellSize, colors } = this.config;
    const board = gameState.board.squares;

    // Clear canvas
    this.ctx.fillStyle = '#2a2a2a';
    this.ctx.fillRect(0, 0, width, height);

    // Draw board
    for (let rank = 0; rank < 8; rank++) {
      for (let file = 0; file < 8; file++) {
        const isLight = (file + rank) % 2 === 0;
        this.ctx.fillStyle = isLight ? colors.lightSquare : colors.darkSquare;
        this.ctx.fillRect(file * cellSize, rank * cellSize, cellSize, cellSize);
      }
    }

    // Highlight last move
    if (gameState.moveHistory.length > 0) {
      const lastMove = gameState.moveHistory[gameState.moveHistory.length - 1];
      this.ctx.fillStyle = colors.lastMove;
      this.ctx.fillRect(lastMove.from.file * cellSize, lastMove.from.rank * cellSize, cellSize, cellSize);
      this.ctx.fillRect(lastMove.to.file * cellSize, lastMove.to.rank * cellSize, cellSize, cellSize);
    }

    // Draw pieces
    this.ctx.font = `${cellSize - 4}px Arial`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';

    for (let rank = 0; rank < 8; rank++) {
      for (let file = 0; file < 8; file++) {
        const square = board[rank][file];
        if (square.piece) {
          const piece = square.piece;
          this.ctx.fillStyle = piece.color === 'white' ? colors.whitePiece : colors.blackPiece;
          this.ctx.fillText(
            this.pieceSymbols[piece.type],
            file * cellSize + cellSize / 2,
            rank * cellSize + cellSize / 2
          );
        }
      }
    }

    // Draw game info
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = '16px monospace';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`Turn: ${gameState.currentPlayer}`, 10, 20);
    this.ctx.fillText(`Status: ${gameState.status}`, 10, 40);
    this.ctx.fillText(`Move: ${gameState.fullMoveNumber}`, 10, 60);

    // Draw captured pieces
    if (gameState.capturedPieces.length > 0) {
      this.ctx.fillText(`Captured: ${gameState.capturedPieces.length}`, 10, 80);
    }
  }
}
