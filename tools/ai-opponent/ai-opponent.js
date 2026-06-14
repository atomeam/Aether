/**
 * AI Game Opponent System
 * AI agents that can play against human players in substrate games
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// AI Opponent Engine
// ============================================================================

class AIOpponent {
  constructor(gameType = 'snake') {
    this.gameType = gameType;
    this.difficulty = 'medium';
    this.moveHistory = [];
    this.performance = {
      wins: 0,
      losses: 0,
      draws: 0,
      gamesPlayed: 0
    };
    this.statsPath = path.resolve(__dirname, 'ai-opponent-stats.json');
    this.loadStats();
  }

  // Get AI move for Snake
  getSnakeMove(gameState) {
    const snake = gameState.snakes[0];
    const food = gameState.food;
    const walls = gameState.walls || [];
    
    if (!snake || !food) {
      return { direction: 'right' };
    }
    
    const head = snake.body[0];
    
    // Simple AI: move towards food
    const dx = food.x - head.x;
    const dy = food.y - head.y;
    
    let direction = 'right';
    
    if (Math.abs(dx) > Math.abs(dy)) {
      direction = dx > 0 ? 'right' : 'left';
    } else {
      direction = dy > 0 ? 'down' : 'up';
    }
    
    // Avoid walls and self-collision
    const nextPos = this.getNextPosition(head, direction);
    if (this.isCollision(nextPos, snake.body, walls)) {
      // Try alternative direction
      const alternatives = ['up', 'down', 'left', 'right'].filter(d => d !== direction);
      for (const alt of alternatives) {
        const altPos = this.getNextPosition(head, alt);
        if (!this.isCollision(altPos, snake.body, walls)) {
          direction = alt;
          break;
        }
      }
    }
    
    this.moveHistory.push({ direction, timestamp: Date.now() });
    
    return { direction, snakeId: 0 };
  }

  // Get AI move for Chess
  getChessMove(gameState) {
    // Simple AI: random legal move
    const board = gameState.board.squares;
    const currentPlayer = gameState.currentPlayer;
    
    const possibleMoves = [];
    
    for (let rank = 0; rank < 8; rank++) {
      for (let file = 0; file < 8; file++) {
        const square = board[rank][file];
        if (square.piece && square.piece.color === currentPlayer) {
          // Add all possible moves for this piece
          const moves = this.getPieceMoves(square, board, rank, file);
          possibleMoves.push(...moves);
        }
      }
    }
    
    if (possibleMoves.length === 0) {
      return null; // No moves available
    }
    
    // Select random move (could be improved with minimax)
    const randomMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
    
    this.moveHistory.push({ move: randomMove, timestamp: Date.now() });
    
    return randomMove;
  }

  getPieceMoves(square, board, rank, file) {
    const moves = [];
    const piece = square.piece;
    
    // Simplified move generation (not complete chess rules)
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

  getNextPosition(current, direction) {
    const moves = {
      'up': { x: current.x, y: current.y - 1 },
      'down': { x: current.x, y: current.y + 1 },
      'left': { x: current.x - 1, y: current.y },
      'right': { x: current.x + 1, y: current.y }
    };
    
    return moves[direction] || current;
  }

  isCollision(position, snakeBody, walls) {
    // Check wall collision
    for (const wall of walls) {
      if (wall.x === position.x && wall.y === position.y) {
        return true;
      }
    }
    
    // Check self collision
    for (const segment of snakeBody) {
      if (segment.x === position.x && segment.y === position.y) {
        return true;
      }
    }
    
    return false;
  }

  // Set AI difficulty
  setDifficulty(level) {
    this.difficulty = level;
  }

  // Record game result
  recordGameResult(result) {
    this.performance.gamesPlayed++;
    
    if (result === 'win') {
      this.performance.wins++;
    } else if (result === 'loss') {
      this.performance.losses++;
    } else {
      this.performance.draws++;
    }
    
    this.saveStats();
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

  loadStats() {
    if (fs.existsSync(this.statsPath)) {
      const data = fs.readFileSync(this.statsPath, 'utf8');
      this.performance = JSON.parse(data);
    }
  }

  saveStats() {
    fs.writeFileSync(this.statsPath, JSON.stringify(this.performance, null, 2));
  }

  resetStats() {
    this.performance = {
      wins: 0,
      losses: 0,
      draws: 0,
      gamesPlayed: 0
    };
    this.saveStats();
  }
}

// ============================================================================
// CLI Interface
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  const gameType = args[1] || 'snake';
  const opponent = new AIOpponent(gameType);

  switch (command) {
    case 'move':
      if (args[2]) {
        const gameState = JSON.parse(args[2]);
        const move = gameType === 'snake' 
          ? opponent.getSnakeMove(gameState)
          : opponent.getChessMove(gameState);
        console.log('🎮 AI Move:');
        console.log(JSON.stringify(move, null, 2));
      } else {
        console.error('Usage: node ai-opponent.js move <game-type> <game-state-json>');
      }
      break;

    case 'difficulty':
      if (args[2]) {
        opponent.setDifficulty(args[2]);
        console.log(`✅ Difficulty set to ${args[2]}`);
      } else {
        console.error('Usage: node ai-opponent.js difficulty <level>');
      }
      break;

    case 'result':
      if (args[2]) {
        opponent.recordGameResult(args[2]);
        console.log(`✅ Game result recorded: ${args[2]}`);
      } else {
        console.error('Usage: node ai-opponent.js result <win|loss|draw>');
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
      console.log('🤖 AI Game Opponent System');
      console.log('');
      console.log('Commands:');
      console.log('  move          - Get AI move for current game state');
      console.log('  difficulty    - Set AI difficulty level');
      console.log('  result        - Record game result');
      console.log('  performance  - Show AI performance stats');
      console.log('  reset         - Reset AI stats');
      console.log('');
      console.log('Examples:');
      console.log('  node ai-opponent.js move snake \'{"snakes":[...], "food":{...}}\'');
      console.log('  node ai-opponent.js difficulty hard');
      console.log('  node ai-opponent.js result win');
      console.log('  node ai-opponent.js performance');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  AIOpponent
};
