/**
 * Secrets Manager
 * 
 * Encrypted secret storage (in-file for dev, integrate with vault in prod).
 */

import crypto from 'crypto';

// Secret entry
export interface Secret {
  key: string;
  value: string; // Encrypted
  createdAt: number;
  updatedAt: number;
}

// Simple encryption (in prod, use proper vault)
const ALGORITHM = 'aes-256-gcm';
const KEY = process.env.SECRET_KEY || crypto.randomBytes(32).toString('hex');

function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(KEY.slice(0, 32)), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function decrypt(encrypted: string): string {
  const [ivHex, data] = encrypted.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(KEY.slice(0, 32)), iv);
  let decrypted = decipher.update(data, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
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