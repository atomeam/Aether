# Data Integrity Framework

## Overview

This document establishes the data integrity framework for the Aether project. It defines the three types of randomness/data generation and provides clear guidelines for when each is appropriate.

## The Three Types of Randomness

### 1. Fake Data (NEVER ALLOWED)

**Definition:** Pretending to have real data when you don't.

**Examples:**
- Fake user counts, fake revenue numbers, fake API responses
- Hardcoded values that should come from APIs
- Mock data presented as real in production code
- Fake financial metrics, fake analytics data

**When to Use:** NEVER

**Alternatives:**
- Use real external APIs (USGS, NOAA, Open-Meteo, etc.)
- Use real database queries
- Use real user data (with proper authentication)
- If data is unavailable, show "No data available" instead of fake data

**Examples of Fake Data:**
```typescript
// BAD - Fake user count
const userCount = 12345; // This is fake

// BAD - Fake revenue
const revenue = 500000; // This is fake

// BAD - Fake API response
const apiResponse = { status: "success", data: [...] }; // This is fake
```

### 2. Simulated Data (OK - it's the feature)

**Definition:** Generating data for a purpose. This is the actual feature, not fake data.

**Examples:**
- UAP detection system simulating UAP anomalies (that's the whole point!)
- Game physics, particle systems, procedural generation
- Feature simulations (detecting gravitational waves, EM fields, etc.)
- Monte Carlo simulations for risk assessment
- Procedural content generation

**When to Use:** When the simulation IS the feature

**Examples of Simulated Data:**
```typescript
// OK - UAP detection simulation (this is the feature)
const uapAnomaly = detectUAPAnomaly(sensorData);

// OK - Gravitational wave detection (this is the feature)
const gravitationalWaves = detectGravitationalWaves(data);

// OK - Game physics (this is the feature)
const physics = simulatePhysics(objects);
```

### 3. Algorithmic Randomness (OK - it's math)

**Definition:** Legitimate mathematical operations using randomness.

**Examples:**
- Bootstrap resampling for statistics
- P-value calculations
- Monte Carlo simulations
- Random sampling, shuffling
- Random index selection
- Statistical algorithms

**When to Use:** When implementing statistical or mathematical algorithms

**Examples of Algorithmic Randomness:**
```typescript
// OK - Bootstrap resampling
const resampled = resampleWithReplacement(data);

// OK - P-value calculation
const pValue = calculatePValue(observed, bootstrapMetrics);

// OK - Random sampling
const sample = data[Math.floor(Math.random() * data.length)];
```

## The Golden Rule

**Context matters.** The same tool (`Math.random()`) can be used for:
- Legitimate statistics (OK)
- Feature implementation (OK)
- Pretending to have data you don't (NOT OK)

**Always ask:** "What is the purpose of this randomness?"

## Guardrails

### Pre-Commit Check
```bash
.\.devin\skills\real-vs-simulated\skill.ps1 -Audit
```

This check:
- Scans for fake data patterns
- Excludes legitimate algorithmic randomness
- Excludes feature simulations
- Blocks commits with fake data

### What It Flags
- Fake data keywords (fake, mock, simulated) when not in comments
- Hardcoded values that should come from APIs
- Fake financial data, fake analytics data
- Mock data presented as real

### What It Allows
- Bootstrap resampling
- P-value calculations
- Monte Carlo simulations
- UAP detection simulation (feature)
- Gravitational wave detection (feature)
- Statistical sampling
- Comments documenting compliance fixes

## Real External APIs Available

When you need real data, use these public APIs:

### USGS Earthquake API
- URL: https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson
- Data: Real-time earthquake data
- Auth: None required

### NOAA Solar Wind API
- URL: https://services.swpc.noaa.gov/json/solar-wind.json
- Data: Real-time solar activity
- Auth: None required

### Open-Meteo Weather API
- URL: https://api.open-meteo.com/v1/forecast
- Data: Real-time weather data
- Auth: None required

### Many More
- NASA APIs
- ESA APIs
- Government databases
- Open data portals

## Compliance Workflow

1. **Data Integrity Check** (MANDATORY)
   - Distinguishes between fake data, simulated data, and algorithmic randomness
   - Blocks commits with fake data when real data is available
   - Allows legitimate feature simulations and statistical algorithms

2. **Frontend-Backend Sync** (MANDATORY)
   - Ensures UI matches backend APIs
   - Auto-generates components for missing endpoints
   - Blocks commits if frontend is out of sync

## The Mantra

**Real work is easier than simulated work. Just do it.**

## Examples

### Bad (Fake Data)
```typescript
// Fake user count
const userCount = 12345; // This is fake - use real API instead

// Fake revenue
const revenue = 500000; // This is fake - use real database instead
```

### Good (Simulated Data - Feature)
```typescript
// UAP detection simulation (this is the feature)
const uapAnomaly = detectUAPAnomaly(sensorData);

// Gravitational wave detection (this is the feature)
const gravitationalWaves = detectGravitationalWaves(data);
```

### Good (Algorithmic Randomness - Math)
```typescript
// Bootstrap resampling
const resampled = resampleWithReplacement(data);

// P-value calculation
const pValue = calculatePValue(observed, bootstrapMetrics);
```

### Good (Real Data)
```typescript
// Real earthquake data
const earthquakes = await fetch('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson');

// Real weather data
const weather = await fetch('https://api.open-meteo.com/v1/forecast?latitude=40.7&longitude=-74.0');
```

## Summary

- **Fake Data:** NEVER (pretending to have data you don't)
- **Simulated Data:** OK (when the simulation IS the feature)
- **Algorithmic Randomness:** OK (when implementing statistical/math algorithms)
- **Real Data:** ALWAYS PREFERRED (use real external APIs when available)

**Context matters. Purpose matters.**