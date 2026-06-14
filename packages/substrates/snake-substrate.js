/**
 * Snake Substrate with Integrated Rendering and AI
 * Complete game engine with visual rendering and AI opponent
 */

class SnakeGame {
  constructor(width = 20, height = 20) {
    this.width = width;
    this.height = height;
    this.reset();
  }

  reset() {
    this.snake = [
      { x: 5, y: 5 },
      { x: 4, y: 5 },
      { x: 3, y: 5 }
    ];
    this.direction = 'right';
    this.food = this.generateFood();
    this.score = 0;
    this.gameOver = false;
    this.tickCount = 0;
  }

  generateFood() {
    let food;
    do {
      food = {
        x: Math.floor(Math.random() * this.width),
        y: Math.floor(Math.random() * this.height)
      };
    } while (this.isCollision(food, this.snake));
    return food;
  }

  isCollision(pos, snake) {
    return snake.some(segment => segment.x === pos.x && segment.y === pos.y);
  }

  tick() {
    if (this.gameOver) return;

    this.tickCount++;

    // Move snake
    const head = { ...this.snake[0] };
    switch (this.direction) {
      case 'up': head.y--; break;
      case 'down': head.y++; break;
      case 'left': head.x--; break;
      case 'right': head.x++; break;
    }

    // Check wall collision
    if (head.x < 0 || head.x >= this.width || head.y < 0 || head.y >= this.height) {
      this.gameOver = true;
      return;
    }

    // Check self collision
    if (this.isCollision(head, this.snake)) {
      this.gameOver = true;
      return;
    }

    this.snake.unshift(head);

    // Check food collision
    if (head.x === this.food.x && head.y === this.food.y) {
      this.score += 10;
      this.food = this.generateFood();
    } else {
      this.snake.pop();
    }
  }

  setDirection(newDirection) {
    const opposites = {
      'up': 'down',
      'down': 'up',
      'left': 'right',
      'right': 'left'
    };

    if (opposites[this.direction] !== newDirection) {
      this.direction = newDirection;
    }
  }

  // AI Move Logic
  getAIMove() {
    const head = this.snake[0];
    const moves = ['up', 'down', 'left', 'right'];
    
    // Simple AI: move towards food
    const dx = this.food.x - head.x;
    const dy = this.food.y - head.y;
    
    let preferredMove;
    if (Math.abs(dx) > Math.abs(dy)) {
      preferredMove = dx > 0 ? 'right' : 'left';
    } else {
      preferredMove = dy > 0 ? 'down' : 'up';
    }

    // Check if preferred move is safe
    const nextPos = this.getNextPosition(head, preferredMove);
    if (!this.isMoveSafe(nextPos)) {
      // Try alternative moves
      const alternatives = moves.filter(m => m !== preferredMove);
      for (const alt of alternatives) {
        const altPos = this.getNextPosition(head, alt);
        if (this.isMoveSafe(altPos)) {
          preferredMove = alt;
          break;
        }
      }
    }

    return preferredMove;
  }

  getNextPosition(current, direction) {
    const moves = {
      'up': { x: current.x, y: current.y - 1 },
      'down': { x: current.x, y: current.y + 1 },
      'left': { x: current.x - 1, y: current.y },
      'right': { x: current.x + 1, y: current.y }
    };
    return moves[direction];
  }

  isMoveSafe(pos) {
    // Check walls
    if (pos.x < 0 || pos.x >= this.width || pos.y < 0 || pos.y >= this.height) {
      return false;
    }
    // Check self collision (ignore tail as it will move)
    const bodyWithoutTail = this.snake.slice(0, -1);
    return !this.isCollision(pos, bodyWithoutTail);
  }

  // Render to ASCII
  renderASCII() {
    const grid = Array(this.height).fill(null).map(() => Array(this.width).fill(' '));

    // Place snake
    this.snake.forEach((segment, index) => {
      if (index === 0) {
        grid[segment.y][segment.x] = '@'; // Head
      } else {
        grid[segment.y][segment.x] = '#'; // Body
      }
    });

    // Place food
    grid[this.food.y][this.food.x] = '*';

    // Render grid
    let output = '\n';
    output += `Score: ${this.score} | Ticks: ${this.tickCount}\n`;
    output += '+'.repeat(this.width + 2) + '\n';
    grid.forEach(row => {
      output += '|' + row.join('') + '|\n';
    });
    output += '+'.repeat(this.width + 2) + '\n';

    return output;
  }

  // Render to HTML
  renderHTML() {
    const cellSize = 20;
    const canvasWidth = this.width * cellSize;
    const canvasHeight = this.height * cellSize;

    let html = `
<!DOCTYPE html>
<html>
<head>
  <title>Snake Game</title>
  <style>
    body { 
      display: flex; 
      flex-direction: column; 
      align-items: center; 
      background: #1a1a2e; 
      color: white; 
      font-family: monospace;
    }
    canvas { 
      border: 2px solid #667eea; 
      background: #0a0a0a;
    }
    .info { margin: 20px; }
    .controls { margin: 20px; }
    button { 
      padding: 10px 20px; 
      margin: 5px; 
      background: #667eea; 
      color: white; 
      border: none; 
      cursor: pointer;
    }
  </style>
</head>
<body>
  <div class="info">
    <h2>Snake Game</h2>
    <p>Score: <span id="score">0</span> | Ticks: <span id="ticks">0</span></p>
  </div>
  <canvas id="gameCanvas" width="${canvasWidth}" height="${canvasHeight}"></canvas>
  <div class="controls">
    <button onclick="startGame()">Start</button>
    <button onclick="pauseGame()">Pause</button>
    <button onclick="resetGame()">Reset</button>
    <button onclick="aiMove()">AI Move</button>
  </div>
  <script>
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const cellSize = ${cellSize};
    let gameInterval;
    let gameData = ${JSON.stringify(this.getState())};

    function render() {
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw snake
      gameData.snake.forEach((segment, index) => {
        ctx.fillStyle = index === 0 ? '#667eea' : '#764ba2';
        ctx.fillRect(
          segment.x * cellSize, 
          segment.y * cellSize, 
          cellSize - 2, 
          cellSize - 2
        );
      });

      // Draw food
      ctx.fillStyle = '#10b981';
      ctx.fillRect(
        gameData.food.x * cellSize,
        gameData.food.y * cellSize,
        cellSize - 2,
        cellSize - 2
      );

      // Update info
      document.getElementById('score').textContent = gameData.score;
      document.getElementById('ticks').textContent = gameData.tickCount;
    }

    function startGame() {
      if (gameInterval) clearInterval(gameInterval);
      gameInterval = setInterval(() => {
        gameData = tickGame(gameData);
        render();
      }, 100);
    }

    function pauseGame() {
      if (gameInterval) {
        clearInterval(gameInterval);
        gameInterval = null;
      }
    }

    function resetGame() {
      pauseGame();
      gameData = ${JSON.stringify(this.getState())};
      render();
    }

    function aiMove() {
      const move = getAIMove(gameData);
      gameData.direction = move;
      gameData = tickGame(gameData);
      render();
    }

    function tickGame(data) {
      const head = { ...data.snake[0] };
      switch (data.direction) {
        case 'up': head.y--; break;
        case 'down': head.y++; break;
        case 'left': head.x--; break;
        case 'right': head.x++; break;
      }

      if (head.x < 0 || head.x >= ${this.width} || head.y < 0 || head.y >= ${this.height}) {
        return data;
      }

      if (data.snake.some(s => s.x === head.x && s.y === head.y)) {
        return data;
      }

      data.snake.unshift(head);

      if (head.x === data.food.x && head.y === data.food.y) {
        data.score += 10;
        data.food = generateFood(data);
      } else {
        data.snake.pop();
      }

      data.tickCount++;
      return data;
    }

    function getAIMove(data) {
      const head = data.snake[0];
      const dx = data.food.x - head.x;
      const dy = data.food.y - head.y;
      
      let move = Math.abs(dx) > Math.abs(dy) 
        ? (dx > 0 ? 'right' : 'left')
        : (dy > 0 ? 'down' : 'up');

      return move;
    }

    function generateFood(data) {
      let food;
      do {
        food = {
          x: Math.floor(Math.random() * ${this.width}),
          y: Math.floor(Math.random() * ${this.height})
        };
      } while (data.snake.some(s => s.x === food.x && s.y === food.y));
      return food;
    }

    // Initial render
    render();
  </script>
</body>
</html>
`;

    return html;
  }

  getState() {
    return {
      snake: this.snake,
      direction: this.direction,
      food: this.food,
      score: this.score,
      gameOver: this.gameOver,
      tickCount: this.tickCount,
      width: this.width,
      height: this.height
    };
  }

  setState(state) {
    this.snake = state.snake;
    this.direction = state.direction;
    this.food = state.food;
    this.score = state.score;
    this.gameOver = state.gameOver;
    this.tickCount = state.tickCount;
  }
}

// CLI Interface
function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  const game = new SnakeGame();

  switch (command) {
    case 'play':
      console.log('🎮 Snake Game - Use arrow keys to control');
      console.log('Press Ctrl+C to exit\n');
      
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      rl.on('line', (input) => {
        switch (input.trim()) {
          case 'w': game.setDirection('up'); break;
          case 's': game.setDirection('down'); break;
          case 'a': game.setDirection('left'); break;
          case 'd': game.setDirection('right'); break;
          case 'q': process.exit(0);
        }
        game.tick();
        console.clear();
        console.log(game.renderASCII());
      });

      console.log(game.renderASCII());
      console.log('\nControls: w=up, s=down, a=left, d=right, q=quit');
      break;

    case 'ai':
      console.log('🤖 AI Playing Snake\n');
      for (let i = 0; i < 100; i++) {
        if (game.gameOver) break;
        const move = game.getAIMove();
        game.setDirection(move);
        game.tick();
        console.log(game.renderASCII());
        // Simple delay
        const start = Date.now();
        while (Date.now() - start < 100) {}
      }
      console.log(`\nGame Over! Final Score: ${game.score}`);
      break;

    case 'html':
      const html = game.renderHTML();
      console.log('📄 HTML renderer generated');
      console.log('Save to snake-game.html and open in browser');
      process.stdout.write(html);
      break;

    case 'state':
      console.log(JSON.stringify(game.getState(), null, 2));
      break;

    default:
      console.log('🎮 Snake Substrate');
      console.log('');
      console.log('Commands:');
      console.log('  play   - Play with keyboard controls');
      console.log('  ai     - Watch AI play');
      console.log('  html   - Generate HTML renderer');
      console.log('  state  - Get current game state');
      console.log('');
      console.log('Examples:');
      console.log('  node snake-substrate.js play');
      console.log('  node snake-substrate.js ai');
      console.log('  node snake-substrate.js html > snake-game.html');
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  SnakeGame
};
