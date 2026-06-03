/**
 * Secrets Manager
 *
 * Encrypted secret storage (in-file for dev, integrate with vault in prod).
 * NOTE: crypto not compatible with Workers
 * Use crypto.subtle in Workers environment
 */

// import crypto from 'crypto';

// Secret entry
export interface Secret {
  key: string;
  value: string; // Encrypted
  createdAt: number;
  updatedAt: number;
}

// Simple encryption (in prod, use proper vault)
const ALGORITHM = 'aes-256-gcm';
// NOTE: crypto.randomBytes not compatible with Workers
// const KEY = process.env.SECRET_KEY || crypto.randomBytes(32).toString('hex');
const KEY = process.env.SECRET_KEY || Math.random().toString(36).substring(2, 34);

function encrypt(text: string): string {
  // NOTE: crypto not compatible with Workers
  // Use crypto.subtle in Workers environment
  // For now, return base64 encoded text (not secure, just placeholder)
  return Buffer.from(text).toString('base64');
}

function decrypt(encrypted: string): string {
  // NOTE: crypto not compatible with Workers
  // Use crypto.subtle in Workers environment
  // For now, decode base64 (not secure, just placeholder)
  return Buffer.from(encrypted, 'base64').toString('utf-8');
}

// Store (in-memory for now)
const secrets = new Map<string, Secret>();

export function setSecret(key: string, value: string) {
  const now = Date.now();
  const existing = secrets.get(key);
  
  secrets.set(key, {
    key,
    value: encrypt(value),
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  });
}

export function getSecret(key: string): string | null {
  const secret = secrets.get(key);
  if (!secret) return null;
  return decrypt(secret.value);
}

export function deleteSecret(key: string): boolean {
  return secrets.delete(key);
}

export function listSecrets(): string[] {
  return Array.from(secrets.keys());
}

export function hasSecret(key: string): boolean {
  return secrets.has(key);
}

// Bulk set (for init)
export function loadSecrets(secrets_: Record<string, string>) {
  for (const [key, value] of Object.entries(secrets_)) {
    setSecret(key, value);
  }
}