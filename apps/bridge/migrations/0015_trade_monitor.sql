-- Trade-Monitor Schema Extension
-- Adds trading-specific tables for the Trade-Monitor crew

-- Trading Positions: Track current positions and exposure
CREATE TABLE IF NOT EXISTS trading_positions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  agent_id TEXT NOT NULL,
  ticker TEXT NOT NULL,
  side TEXT NOT NULL, -- buy, sell
  quantity REAL NOT NULL,
  entry_price REAL NOT NULL,
  current_price REAL,
  pnl REAL DEFAULT 0,
  exposure_percent REAL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'open', -- open, closed, liquidated
  order_id TEXT,
  opened_at TEXT NOT NULL DEFAULT (datetime('now')),
  closed_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Trading Signals: Log trading signals and decisions
CREATE TABLE IF NOT EXISTS trading_signals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  agent_id TEXT NOT NULL,
  ticker TEXT NOT NULL,
  signal_type TEXT NOT NULL, -- buy, sell, hold, liquidate
  confidence REAL,
  reason TEXT,
  executed BOOLEAN DEFAULT FALSE,
  executed_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Trading Laws Violations: Log when trading laws are violated
CREATE TABLE IF NOT EXISTS trading_law_violations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  agent_id TEXT NOT NULL,
  law TEXT NOT NULL, -- max_exposure, hard_stop, atomic_transactions
  violation_type TEXT NOT NULL, -- exceeded, triggered, failed
  details TEXT,
  action_taken TEXT, -- paused, liquidated, blocked
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Circuit Breaker Events: Log circuit breaker activations
CREATE TABLE IF NOT EXISTS circuit_breaker_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  agent_id TEXT NOT NULL,
  trigger_type TEXT NOT NULL, -- volatility, error_rate, law_violation
  trigger_value REAL,
  action TEXT NOT NULL, -- paused, liquidated_all
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_trading_positions_agent_id ON trading_positions(agent_id);
CREATE INDEX IF NOT EXISTS idx_trading_positions_ticker ON trading_positions(ticker);
CREATE INDEX IF NOT EXISTS idx_trading_positions_status ON trading_positions(status);
CREATE INDEX IF NOT EXISTS idx_trading_signals_agent_id ON trading_signals(agent_id);
CREATE INDEX IF NOT EXISTS idx_trading_signals_ticker ON trading_signals(ticker);
CREATE INDEX IF NOT EXISTS idx_trading_law_violations_agent_id ON trading_law_violations(agent_id);
CREATE INDEX IF NOT EXISTS idx_circuit_breaker_events_agent_id ON circuit_breaker_events(agent_id);