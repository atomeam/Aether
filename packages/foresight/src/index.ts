/**
 * Foresight
 * 
 * Reflector emits predictions.
 * System scores its own foresight when windows expire.
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// Prediction
export interface Prediction {
  id: string;
  pattern: string;
  predictedOutcome: 'success' | 'failure' | 'noop';
  predictedConfidence: number;
  actualOutcome?: 'success' | 'failure' | 'noop';
  actualConfidence?: number;
  scoredAt?: number;
  windowDays: number;
  createdAt: number;
}

// Score predictions after window expires
export function scorePredictions(windowDays = 7): { scored: number; accuracy: number } {
  const PREDICTIONS_PATH = path.resolve(process.cwd(), '../../logs/predictions.jsonl');
  
  if (!fs.existsSync(PREDICTIONS_PATH)) {
    return { scored: 0, accuracy: 0 };
  }
  
  const content = fs.readFileSync(PREDICTIONS_PATH, 'utf-8');
  const predictions = content.trim().split('\n').filter(Boolean).map(line => JSON.parse(line) as Prediction);
  
  const now = Date.now();
  const windowMs = windowDays * 24 * 60 * 60 * 1000;
  
  let correct = 0;
  let scored = 0;
  
  const newLines: string[] = [];
  
  for (const pred of predictions) {
    const age = now - pred.createdAt;
    
    // Score if window expired and not yet scored
    if (age >= windowMs && !pred.scoredAt) {
      // In production, get actual outcome from lessons
      // For now, simulate based on confidence
      const actual = pred.predictedConfidence > 0.5 ? 'success' : 'failure';
      const isCorrect = actual === pred.predictedOutcome;
      
      pred.actualOutcome = actual;
      pred.actualConfidence = isCorrect ? 1.0 : 0.0;
      pred.scoredAt = now;
      
      scored++;
      if (isCorrect) correct++;
    }
    
    newLines.push(JSON.stringify(pred));
  }
  
  fs.writeFileSync(PREDICTIONS_PATH, newLines.join('\n') + '\n');
  
  return {
    scored,
    accuracy: scored > 0 ? correct / scored : 0,
  };
}

// Make a prediction (called by Reflector)
export function predict(pattern: string, predictedOutcome: 'success' | 'failure' | 'noop', confidence: number, windowDays = 7): Prediction {
  const PREDICTIONS_PATH = path.resolve(process.cwd(), '../../logs/predictions.jsonl');
  
  const prediction: Prediction = {
    id: crypto.randomUUID(),
    pattern,
    predictedOutcome,
    predictedConfidence: confidence,
    windowDays,
    createdAt: Date.now(),
  };
  
  const dir = path.dirname(PREDICTIONS_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  
  fs.appendFileSync(PREDICTIONS_PATH, JSON.stringify(prediction) + '\n');
  return prediction;
}

// Get pending predictions
export function getPending(): Prediction[] {
  const PREDICTIONS_PATH = path.resolve(process.cwd(), '../../logs/predictions.jsonl');
  
  if (!fs.existsSync(PREDICTIONS_PATH)) return [];
  
  const content = fs.readFileSync(PREDICTIONS_PATH, 'utf-8');
  return content.trim().split('\n').filter(Boolean).map(line => JSON.parse(line) as Prediction);
}