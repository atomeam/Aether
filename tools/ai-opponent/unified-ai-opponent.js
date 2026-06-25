/**
 * Unified AI Opponent Interface
 * Works with multiple game substrates
 */

class UnifiedAIOpponent {
  constructor(gameType = 'snake') {
    this.gameType = gameType;
    this.difficulty = 'medium';
    this.performance = {
      wins: 0,
      losses: 0,
      draws: 0,
      gamesPlayed: 0
    };
  }

  // Get AI move for any game type
  getMove(gameState) {
    switch (this.gameType) {
      case 'snake':
        return this.getSnakeMove(gameState);
      case 'chess':
        return this.getChessMove(gameState);
      default:
        throw new Error(`Unknown game type: ${this.gameType}`);
    }
  }

  // Snake AI logic
  getSnakeMove(gameState) {
    const snake = gameState.snakes[0];
    const food = gameState.food;
    const head = snake.body[0];
    
    const dx = food.x - head.x;
    const dy = food.y - head.y;
    
    let direction = Math.abs(dx) > Math.abs(dy) 
      ? (dx > 0 ? 'right' : 'left')
      : (dy > 0 ? 'down' : 'up');

    // Simple collision avoidance
    const nextPos = this.getNextSnakePosition(head, direction);
    if (this.isSnakeCollision(nextPos, snake.body, gameState.walls)) {
      const alternatives = ['up', 'down', 'left', 'right'].filter(d => d !== direction);
      for (const alt of alternatives) {
        const altPos = this.getNextSnakePosition(head, alt);
        if (!this.isSnakeCollision(altPos, snake.body, gameState.walls)) {
          direction = alt;
          break;
        }
      }
    }

    return { direction, snakeId: 0 };
  }

  getNextSnakePosition(current, direction) {
    const moves = {
      'up': { x: current.x, y: current.y - 1 },
      'down': { x: current.x, y: current.y + 1 },
      'left': { x: current.x - 1, y: current.y },
      'right': { x: current.x + 1, y: current.y }
    };
    return moves[direction];
  }

  isSnakeCollision(position, snakeBody, walls) {
    for (const wall of walls) {
      if (wall.x === position.x && wall.y === position.y) return true;
    }
    for (const segment of snakeBody) {
      if (segment.x === position.x && segment.y === position.y) return true;
    }
    return false;
  }

  // Chess AI logic
  getChessMove(gameState) {
    const board = gameState.board.squares;
    const currentPlayer = gameState.currentPlayer;
    
    const possibleMoves = [];
    
    for (let rank = 0; rank < 8; rank++) {
      for (let file = 0; file < 8; file++) {
        const square = board[rank][file];
        if (square.piece && square.piece.color === currentPlayer) {
          const moves = this.getChessPieceMoves(square, board, rank, file);
          possibleMoves.push(...moves);
        }
      }
    }
    
    if (possibleMoves.length === 0) return null;
    
    // Select move based on difficulty
    switch (this.difficulty) {
      case 'easy':
        return possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
      case 'medium':
        return this.selectMediumMove(possibleMoves, gameState);
      case 'hard':
        return this.selectHardMove(possibleMoves, gameState);
      default:
        return possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
    }
  }

  getChessPieceMoves(square, board, rank, file) {
    const moves = [];
    const piece = square.piece;
    
    const directions = {
      'pawn': [[0, 1], [0, 2], [1, 1], [-1, 1]],
      'rook': [[0, 1], [0, -1], [1, 0], [-1, 0]],
      'knight': [[2, 1], [2, -1], [-2, 1], [-2, -1], [1, 2], [1, -2], [-1, 2], [-1, -2]],
      'bishop': [[1, 1], [1, -1], [-1, 1], [-1, -1]],
      'queen': [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [1, -1], [-1, 1], [-1, -1]],
      'king': [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [1, -1], [-1, 1], [-1, -1]]
    };
    
    const pieceDirections = directions[piece.type] || [];
    
    for (const [dr, df] of pieceDirections) {
      const newRank = rank + dr;
      const newFile = file + df;
      
      if (newRank >= 0 && newRank < 8 && newFile >= 0 && newFile < 8) {
        const targetSquare = board[newRank][newFile];
        
        if (!targetSquare.piece || targetSquare.piece.color !== piece.color) {
          moves.push({
            from: { rank, file },
            to: { rank: newRank, file: newFile },
            piece: piece,
            capturedPiece: targetSquare.piece || null,
            special: 'normal'
          });
        }
      }
    }
    
    return moves;
  }

  selectMediumMove(moves, gameState) {
    // Prefer moves that capture pieces
    const captures = moves.filter(m => m.capturedPiece);
    if (captures.length > 0) {
      return captures[Math.floor(Math.random() * captures.length)];
    }
    return moves[Math.floor(Math.random() * moves.length)];
  }

  selectHardMove(moves, gameState) {
    // Simple evaluation: prefer captures and center control
    const scoredMoves = moves.map(move => {
      let score = 0;
      
      // Capture bonus
      if (move.capturedPiece) {
        const pieceValues = { 'pawn': 1, 'knight': 3, 'bishop': 3, 'rook': 5, 'queen': 9, 'king': 0 };
        score += pieceValues[move.capturedPiece.type] || 0;
      }
      
      // Center control bonus
      const centerSquares = [
        { rank: 3, file: 3 }, { rank: 3, file: 4 },
        { rank: 4, file: 3 }, { rank: 4, file: 4 }
      ];
      if (centerSquares.some(c => c.rank === move.to.rank && c.file === move.to.file)) {
        score += 0.5;
      }
      
      return { move, score };
    });
    
    scoredMoves.sort((a, b) => b.score - a.score);
    return scoredMoves[0]?.move || moves[0];
  }

  setDifficulty(level) {
    this.difficulty = level;
  }

  recordGameResult(result) {
    this.performance.gamesPlayed++;
    
    if (result === 'win') {
      this.performance.wins++;
    } else if (result === 'loss') {
      this.performance.losses++;
    } else {
      this.performance.draws++;
    }
  }

  getPerformance() {
    const winRate = this.performance.gamesPlayed > 0 
      ? (this.performance.wins / this.performance.gamesPlayed * 100).toFixed(2) + '%'
      : '0%';
    
    return {
      ...this.performance,
      winRate,
      currentDifficulty: this.difficulty
    };
  }

  resetStats() {
    this.performance = {
      wins: 0,
      losses: 0,
      draws: 0,
      gamesPlayed: 0
    };
  }
}

// CLI Interface
function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  const gameType = args[1] || 'snake';
  const opponent = new UnifiedAIOpponent(gameType);

  switch (command) {
    case 'move':
      if (args[2]) {
        const gameState = JSON.parse(args[2]);
        const move = opponent.getMove(gameState);
        console.log('🎮 AI Move:');
        console.log(JSON.stringify(move, null, 2));
      } else {
        console.error('Usage: node unified-ai-opponent.js move <game-type> <game-state-json>');
      }
      break;

    case 'difficulty':
      if (args[2]) {
        opponent.setDifficulty(args[2]);
        console.log(`✅ Difficulty set to ${args[2]}`);
      } else {
        console.error('Usage: node unified-ai-opponent.js difficulty <level>');
      }
      break;

    case 'result':
      if (args[2]) {
        opponent.recordGameResult(args[2]);
        console.log(`✅ Game result recorded: ${args[2]}`);
      } else {
        console.error('Usage: node unified-ai-opponent.js result <win|loss|draw>');
      }
      break;

    case 'performance':
      const perf = opponent.getPerformance();
      console.log('📊 AI Performance:');
      console.log(JSON.stringify(perf, null, 2));
      break;

    case 'reset':
      opponent.resetStats();
      console.log('✅ Stats reset');
      break;

    default:
      console.log('🤖 Unified AI Opponent System');
      console.log('');
      console.log('Commands:');
      console.log('  move          - Get AI move for current game state');
      console.log('  difficulty    - Set AI difficulty level');
      console.log('  result        - Record game result');
      console.log('  performance  - Show AI performance stats');
      console.log('  reset         - Reset AI stats');
      console.log('');
      console.log('Supported Games: snake, chess');
      console.log('Difficulty Levels: easy, medium, hard');
      console.log('');
      console.log('Examples:');
      console.log('  node unified-ai-opponent.js move snake \'{"snakes":[...], "food":{...}}\'');
      console.log('  node unified-ai-opponent.js difficulty hard');
      console.log('  node unified-ai-opponent.js result win');
      console.log('  node unified-ai-opponent.js performance');
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  UnifiedAIOpponent
};
