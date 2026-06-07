/**
 * DDoS Protection Middleware
 * 
 * IP-based DDoS protection with automatic blocking
 */

import { Request, Response, NextFunction } from 'express';
import { allow, checkLimit, RateLimitConfig, resetLimit } from '@aether/rate-limiter';

// DDoS protection configuration
const DDOS_CONFIG: RateLimitConfig = {
  windowMs: 10000, // 10 seconds
  maxRequests: 100, // 100 requests per 10 seconds
};

// Block list (blocked IPs with expiration)
const blockedIPs = new Map<string, { blockedAt: number; expiresAt: number; reason: string }>();

// Violation tracking (IP -> violation count)
const violations = new Map<string, { count: number; lastViolation: number }>();

// Block duration in milliseconds
const BLOCK_DURATION = 300000; // 5 minutes

// Max violations before permanent block
const MAX_VIOLATIONS = 3;

// Get client IP
function getClientIP(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  const realIp = req.headers['x-real-ip'];
  
  if (forwarded && typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIp && typeof realIp === 'string') {
    return realIp;
  }
  
  return req.ip || 'unknown';
}

// Check if IP is blocked
function isIPBlocked(ip: string): boolean {
  const blockInfo = blockedIPs.get(ip);
  
  if (!blockInfo) {
    return false;
  }
  
  // Check if block has expired
  if (Date.now() > blockInfo.expiresAt) {
    blockedIPs.delete(ip);
    return false;
  }
  
  return true;
}

// Block an IP
function blockIP(ip: string, reason: string) {
  const now = Date.now();
  blockedIPs.set(ip, {
    blockedAt: now,
    expiresAt: now + BLOCK_DURATION,
    reason,
  });
  
  console.error(`[DDOS_PROTECTION] Blocked IP ${ip} for ${BLOCK_DURATION / 1000}s. Reason: ${reason}`);
}

// Record a violation
function recordViolation(ip: string) {
  const now = Date.now();
  const violation = violations.get(ip) || { count: 0, lastViolation: 0 };
  
  // Reset count if last violation was more than 1 hour ago
  if (now - violation.lastViolation > 3600000) {
    violation.count = 0;
  }
  
  violation.count++;
  violation.lastViolation = now;
  violations.set(ip, violation);
  
  // Check if should be permanently blocked
  if (violation.count >= MAX_VIOLATIONS) {
    blockIP(ip, `Too many violations (${violation.count})`);
  }
  
  return violation.count;
}

// Get rate limit key for DDoS protection
function getDDoSKey(req: Request): string {
  const ip = getClientIP(req);
  return `ddos:${ip}`;
}

// DDoS protection middleware
export function ddosProtection(req: Request, res: Response, next: NextFunction) {
  const ip = getClientIP(req);
  
  // Check if IP is blocked
  if (isIPBlocked(ip)) {
    const blockInfo = blockedIPs.get(ip)!;
    const remainingTime = Math.ceil((blockInfo.expiresAt - Date.now()) / 1000);
    
    return res.status(403).json({
      error: 'Forbidden',
      message: 'IP address blocked due to suspicious activity',
      reason: blockInfo.reason,
      retryAfter: remainingTime,
    });
  }
  
  // Check rate limit
  const key = getDDoSKey(req);
  const result = checkLimit(key, DDOS_CONFIG);
  
  if (!result.allowed) {
    // Rate limit exceeded - record violation
    const violationCount = recordViolation(ip);
    
    return res.status(429).json({
      error: 'Too Many Requests',
      message: 'DDoS protection triggered',
      violationCount,
      retryAfter: Math.ceil(result.resetMs / 1000),
    });
  }
  
  // Allow the request
  allow(key, DDOS_CONFIG);
  next();
}

// Get DDoS protection status
export function getDDoSStatus() {
  return {
    blockedIPs: Array.from(blockedIPs.entries()).map(([ip, info]) => ({
      ip,
      blockedAt: new Date(info.blockedAt).toISOString(),
      expiresAt: new Date(info.expiresAt).toISOString(),
      reason: info.reason,
      remainingSeconds: Math.ceil((info.expiresAt - Date.now()) / 1000),
    })),
    violations: Array.from(violations.entries()).map(([ip, info]) => ({
      ip,
      count: info.count,
      lastViolation: new Date(info.lastViolation).toISOString(),
    })),
    config: DDOS_CONFIG,
  };
}

// Unblock an IP (admin function)
export function unblockIP(ip: string) {
  blockedIPs.delete(ip);
  violations.delete(ip);
  
  // Reset rate limit for this IP
  const key = `ddos:${ip}`;
  resetLimit(key);
  
  console.log(`[DDOS_PROTECTION] Unblocked IP ${ip}`);
}

// Clear all blocks (admin function)
export function clearAllBlocks() {
  const count = blockedIPs.size;
  blockedIPs.clear();
  violations.clear();
  
  console.log(`[DDOS_PROTECTION] Cleared ${count} blocked IPs`);
  
  return count;
}
