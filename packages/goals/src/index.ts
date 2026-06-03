/**
 * Goals / Intent Layer
 *
 * Top-down direction for the agent system.
 * Objectives, priorities, and current focus above the reactive loop.
 * NOTE: fs, path, and crypto not compatible with Workers
 * Goals storage needs to use KV/R2 in Workers environment
 */

// import fs from 'fs';
// import path from 'path';
// import crypto from 'crypto';

// Goal definition
export interface Goal {
  id: string;
  title: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: 'active' | 'completed' | 'paused' | 'archived';
  focus: string; // Current area of focus (e.g., "fix-auth", "performance", "security")
  outcomes: string[];
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
}

// Goals storage path
// const GOALS_PATH = path.resolve(process.cwd(), '../../logs/goals.jsonl');

function ensureDir() {
  // NOTE: fs and path not compatible with Workers
  // const dir = path.dirname(GOALS_PATH);
  // if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// Create a new goal
export function createGoal(options: {
  title: string;
  description?: string;
  priority?: Goal['priority'];
  focus?: string;
  outcomes?: string[];
}): Goal {
  // NOTE: fs and path not compatible with Workers
  // Goals storage needs to use KV/R2 in Workers environment
  // ensureDir();

  const goal: Goal = {
    id: Math.random().toString(36).substring(2, 15),
    title: options.title,
    description: options.description || '',
    priority: options.priority || 'medium',
    status: 'active',
    focus: options.focus || 'general',
    outcomes: options.outcomes || [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  // fs.appendFileSync(GOALS_PATH, JSON.stringify(goal) + '\n');
  return goal;
}

// Get active goals
export function getActiveGoals(limit = 10): Goal[] {
  // NOTE: fs and path not compatible with Workers
  // Goals storage needs to use KV/R2 in Workers environment
  // if (!fs.existsSync(GOALS_PATH)) return [];
  // const content = fs.readFileSync(GOALS_PATH, 'utf-8');
  // const goals = content.trim().split('\n').filter(Boolean).map(line => JSON.parse(line) as Goal);

  return []
    .sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    })
    .slice(0, limit);
}

// Get current focus area
export function getCurrentFocus(): string {
  const active = getActiveGoals(1);
  return active.length > 0 ? active[0].focus : 'general';
}

// Check if task aligns with goals
export function alignsWithGoals(taskPattern: string): { aligned: boolean; goalId?: string; reasoning: string } {
  const active = getActiveGoals(3);

  if (active.length === 0) {
    return { aligned: true, reasoning: 'No active goals - default allow' };
  }

  for (const goal of active) {
    // Check if focus matches
    if (taskPattern.toLowerCase().includes(goal.focus.toLowerCase())) {
      return { aligned: true, goalId: goal.id, reasoning: `Matches goal focus: ${goal.focus}` };
    }

    // Check outcomes
    for (const outcome of goal.outcomes) {
      if (taskPattern.toLowerCase().includes(outcome.toLowerCase())) {
        return { aligned: true, goalId: goal.id, reasoning: `Matches goal outcome: ${outcome}` };
      }
    }
  }

  return {
    aligned: false,
    reasoning: `No active goal matches: ${taskPattern}`
  };
}

// Complete a goal
export function completeGoal(id: string): Goal | null {
  // NOTE: fs and path not compatible with Workers
  // Goals storage needs to use KV/R2 in Workers environment
  return null;
}

// Pause a goal
export function pauseGoal(id: string): Goal | null {
  // NOTE: fs and path not compatible with Workers
  // Goals storage needs to use KV/R2 in Workers environment
  return null;
}

// Get goals by focus area
export function getGoalsByFocus(focus: string): Goal[] {
  // NOTE: fs and path not compatible with Workers
  // Goals storage needs to use KV/R2 in Workers environment
  return [];
}

// List all unique focus areas
export function getFocusAreas(): string[] {
  // NOTE: fs and path not compatible with Workers
  // Goals storage needs to use KV/R2 in Workers environment
  return [];
}