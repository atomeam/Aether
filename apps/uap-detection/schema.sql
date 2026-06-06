-- UAP Detection Database Schema
-- Stores all 15 UAP/UFO detection system data

CREATE TABLE IF NOT EXISTS uap_anomalies (
  id TEXT PRIMARY KEY,
  timestamp TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  category TEXT NOT NULL,
  confidence REAL NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  location TEXT NOT NULL, -- JSON string
  data TEXT NOT NULL, -- Full anomaly data as JSON
  processed BOOLEAN DEFAULT FALSE,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_timestamp ON uap_anomalies(timestamp);
CREATE INDEX IF NOT EXISTS idx_severity ON uap_anomalies(severity);
CREATE INDEX IF NOT EXISTS idx_category ON uap_anomalies(category);
CREATE INDEX IF NOT EXISTS idx_confidence ON uap_anomalies(confidence);

-- Gravitational wave data
CREATE TABLE IF NOT EXISTS gravitational_waves (
  id TEXT PRIMARY KEY,
  anomaly_id TEXT NOT NULL,
  strain REAL NOT NULL,
  frequency REAL NOT NULL,
  amplitude REAL NOT NULL,
  source_ra REAL NOT NULL,
  source_dec REAL NOT NULL,
  source_distance REAL NOT NULL,
  timestamp TEXT NOT NULL,
  FOREIGN KEY (anomaly_id) REFERENCES uap_anomalies(id)
);

-- Electromagnetic field data
CREATE TABLE IF NOT EXISTS electromagnetic_fields (
  id TEXT PRIMARY KEY,
  anomaly_id TEXT NOT NULL,
  elf REAL NOT NULL,
  vlf REAL NOT NULL,
  magnetic_field REAL NOT NULL,
  pulse_detected BOOLEAN NOT NULL,
  plasma_field REAL NOT NULL,
  timestamp TEXT NOT NULL,
  FOREIGN KEY (anomaly_id) REFERENCES uap_anomalies(id)
);

-- Propulsion signatures
CREATE TABLE IF NOT EXISTS propulsion_signatures (
  id TEXT PRIMARY KEY,
  anomaly_id TEXT NOT NULL,
  antigravity_field REAL NOT NULL,
  zero_point_energy REAL NOT NULL,
  quantum_vacuum_fluctuation REAL NOT NULL,
  exhaust_composition TEXT NOT NULL,
  thrust_vector TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  FOREIGN KEY (anomaly_id) REFERENCES uap_anomalies(id)
);

-- Thermal data
CREATE TABLE IF NOT EXISTS thermal_data (
  id TEXT PRIMARY KEY,
  anomaly_id TEXT NOT NULL,
  heat_signature REAL NOT NULL,
  infrared_anomaly BOOLEAN NOT NULL,
  thermal_gradient REAL NOT NULL,
  stealth_masking REAL NOT NULL,
  timestamp TEXT NOT NULL,
  FOREIGN KEY (anomaly_id) REFERENCES uap_anomalies(id)
);

-- Radar data
CREATE TABLE IF NOT EXISTS radar_data (
  id TEXT PRIMARY KEY,
  anomaly_id TEXT NOT NULL,
  rcs REAL NOT NULL,
  doppler_shift REAL NOT NULL,
  stealth_detected BOOLEAN NOT NULL,
  frequency REAL NOT NULL,
  timestamp TEXT NOT NULL,
  FOREIGN KEY (anomaly_id) REFERENCES uap_anomalies(id)
);

-- Temporal data
CREATE TABLE IF NOT EXISTS temporal_data (
  id TEXT PRIMARY KEY,
  anomaly_id TEXT NOT NULL,
  time_dilation REAL NOT NULL,
  chronometric_displacement REAL NOT NULL,
  temporal_rift BOOLEAN NOT NULL,
  causality_violation BOOLEAN NOT NULL,
  timestamp TEXT NOT NULL,
  FOREIGN KEY (anomaly_id) REFERENCES uap_anomalies(id)
);

-- Quantum data
CREATE TABLE IF NOT EXISTS quantum_data (
  id TEXT PRIMARY KEY,
  anomaly_id TEXT NOT NULL,
  entanglement REAL NOT NULL,
  coherence REAL NOT NULL,
  teleportation_signature REAL NOT NULL,
  superposition REAL NOT NULL,
  timestamp TEXT NOT NULL,
  FOREIGN KEY (anomaly_id) REFERENCES uap_anomalies(id)
);

-- Dimensional data
CREATE TABLE IF NOT EXISTS dimensional_data (
  id TEXT PRIMARY KEY,
  anomaly_id TEXT NOT NULL,
  interdimensional_rift REAL NOT NULL,
  parallel_universe_bleed REAL NOT NULL,
  spatial_distortion REAL NOT NULL,
  hyperdimensional_map TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  FOREIGN KEY (anomaly_id) REFERENCES uap_anomalies(id)
);

-- Biological data
CREATE TABLE IF NOT EXISTS biological_data (
  id TEXT PRIMARY KEY,
  anomaly_id TEXT NOT NULL,
  non_human_markers TEXT NOT NULL,
  exotic_dna TEXT NOT NULL,
  psychometric_field REAL NOT NULL,
  consciousness_pattern TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  FOREIGN KEY (anomaly_id) REFERENCES uap_anomalies(id)
);

-- Trajectory data
CREATE TABLE IF NOT EXISTS trajectory_data (
  id TEXT PRIMARY KEY,
  anomaly_id TEXT NOT NULL,
  non_ballistic BOOLEAN NOT NULL,
  instant_acceleration REAL NOT NULL,
  right_angle_turns INTEGER NOT NULL,
  hypersonic_velocity REAL NOT NULL,
  timestamp TEXT NOT NULL,
  FOREIGN KEY (anomaly_id) REFERENCES uap_anomalies(id)
);

-- Material data
CREATE TABLE IF NOT EXISTS material_data (
  id TEXT PRIMARY KEY,
  anomaly_id TEXT NOT NULL,
  metamaterial TEXT NOT NULL,
  isotopic_ratio REAL NOT NULL,
  unknown_elements TEXT NOT NULL,
  memory_metal BOOLEAN NOT NULL,
  timestamp TEXT NOT NULL,
  FOREIGN KEY (anomaly_id) REFERENCES uap_anomalies(id)
);

-- Communication data
CREATE TABLE IF NOT EXISTS communication_data (
  id TEXT PRIMARY KEY,
  anomaly_id TEXT NOT NULL,
  neural_interface BOOLEAN NOT NULL,
  telepathic_signal REAL NOT NULL,
  subconscious_pattern TEXT NOT NULL,
  direct_consciousness BOOLEAN NOT NULL,
  timestamp TEXT NOT NULL,
  FOREIGN KEY (anomaly_id) REFERENCES uap_anomalies(id)
);

-- Energy data
CREATE TABLE IF NOT EXISTS energy_data (
  id TEXT PRIMARY KEY,
  anomaly_id TEXT NOT NULL,
  ambient_absorption REAL NOT NULL,
  zero_point_extraction REAL NOT NULL,
  free_energy_device BOOLEAN NOT NULL,
  overunity REAL NOT NULL,
  timestamp TEXT NOT NULL,
  FOREIGN KEY (anomaly_id) REFERENCES uap_anomalies(id)
);

-- Teleportation data
CREATE TABLE IF NOT EXISTS teleportation_data (
  id TEXT PRIMARY KEY,
  anomaly_id TEXT NOT NULL,
  matter_displacement REAL NOT NULL,
  quantum_tunneling REAL NOT NULL,
  spatial_jump BOOLEAN NOT NULL,
  instantaneous_transport BOOLEAN NOT NULL,
  timestamp TEXT NOT NULL,
  FOREIGN KEY (anomaly_id) REFERENCES uap_anomalies(id)
);

-- Reality data
CREATE TABLE IF NOT EXISTS reality_data (
  id TEXT PRIMARY KEY,
  anomaly_id TEXT NOT NULL,
  simulation_glitch REAL NOT NULL,
  matrix_anomaly REAL NOT NULL,
  reality_bending REAL NOT NULL,
  physics_violation BOOLEAN NOT NULL,
  timestamp TEXT NOT NULL,
  FOREIGN KEY (anomaly_id) REFERENCES uap_anomalies(id)
);