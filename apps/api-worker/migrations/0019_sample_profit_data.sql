-- Sample data for bootstrap analysis to make Profit Engine functional
-- This migration is idempotent - can be run multiple times
INSERT OR IGNORE INTO agent_actions (id, agent_id, action_taken, status, timestamp, details, revenue, cost, conversions, strategy_id) VALUES
('sample_001', 'profit_engine', 'transaction', 'completed', '2026-06-01T00:00:00Z', '{"type": "sale"}', 1000.00, 500.00, 1, 'default'),
('sample_002', 'profit_engine', 'transaction', 'completed', '2026-06-01T01:00:00Z', '{"type": "sale"}', 1200.00, 600.00, 1, 'default'),
('sample_003', 'profit_engine', 'transaction', 'completed', '2026-06-01T02:00:00Z', '{"type": "sale"}', 800.00, 400.00, 1, 'default'),
('sample_004', 'profit_engine', 'transaction', 'completed', '2026-06-01T03:00:00Z', '{"type": "sale"}', 1500.00, 750.00, 2, 'default'),
('sample_005', 'profit_engine', 'transaction', 'completed', '2026-06-01T04:00:00Z', '{"type": "sale"}', 1100.00, 550.00, 1, 'default'),
('sample_006', 'profit_engine', 'transaction', 'completed', '2026-06-01T05:00:00Z', '{"type": "sale"}', 900.00, 450.00, 1, 'default'),
('sample_007', 'profit_engine', 'transaction', 'completed', '2026-06-01T06:00:00Z', '{"type": "sale"}', 1300.00, 650.00, 1, 'default'),
('sample_008', 'profit_engine', 'transaction', 'completed', '2026-06-01T07:00:00Z', '{"type": "sale"}', 1400.00, 700.00, 2, 'default'),
('sample_009', 'profit_engine', 'transaction', 'completed', '2026-06-01T08:00:00Z', '{"type": "sale"}', 1050.00, 525.00, 1, 'default'),
('sample_010', 'profit_engine', 'transaction', 'completed', '2026-06-01T09:00:00Z', '{"type": "sale"}', 1250.00, 625.00, 1, 'default'),
('sample_011', 'profit_engine', 'transaction', 'completed', '2026-06-01T10:00:00Z', '{"type": "sale"}', 1150.00, 575.00, 1, 'default'),
('sample_012', 'profit_engine', 'transaction', 'completed', '2026-06-01T11:00:00Z', '{"type": "sale"}', 1350.00, 675.00, 1, 'default'),
('sample_013', 'profit_engine', 'transaction', 'completed', '2026-06-01T12:00:00Z', '{"type": "sale"}', 950.00, 475.00, 1, 'default'),
('sample_014', 'profit_engine', 'transaction', 'completed', '2026-06-01T13:00:00Z', '{"type": "sale"}', 1450.00, 725.00, 2, 'default'),
('sample_015', 'profit_engine', 'transaction', 'completed', '2026-06-01T14:00:00Z', '{"type": "sale"}', 1000.00, 500.00, 1, 'default');
