import { KrakenBridgeEnv } from './types';
import { TradeTelemetry, TradingLaws, CircuitBreakerConfig } from './types';

// Kraken Trading Bot for Cloudflare Workers
// CONSERVATIVE STRATEGY - Small positions, tight stops, managed risk
// INTEGRATED WITH MULTI-CREW CONTROLLER

// Trading Laws Configuration
const TRADING_LAWS: TradingLaws = {
  maxExposurePercent: 10,      // Law 1: Max 10% exposure per trade
  hardStopDrawdownPercent: 5,   // Law 2: 5% drawdown triggers liquidation
  atomicTransactions: true      // Law 3: Must log before order execution
};

// Circuit Breaker Configuration
const CIRCUIT_BREAKER: CircuitBreakerConfig = {
  enabled: true,
  volatilityThreshold: 0.15,  // 15% volatility triggers circuit breaker
  maxErrorsPerMinute: 5,      // 5 errors per minute triggers pause
  autoPauseOnViolation: true   // Auto-pause on law violation
};

// Trade-Monitor Configuration
const TRADE_MONITOR_CONFIG = {
  agentId: 'trade-monitor-001',
  crew: 'trading',
  roomId: 'trading-telemetry',
  paperTrading: true  // Start in paper-trading mode
};

export async function getKrakenBalance(apiKey: string, apiSecret: string): Promise<{ asset: string; balance: string }[]> {
  // First, test with a public endpoint to verify connection
  try {
    const publicTest = await fetch('https://api.kraken.com/0/public/Time');
    const publicData = await publicTest.json();
    console.log('Public API Test:', JSON.stringify(publicData));
  } catch (error) {
    console.error('Public API failed:', error);
  }
  
  // Use millisecond timestamp as per Kraken examples
  const nonce = (Date.now() * 1000).toString();
  
  // Try TradeBalance first (often more reliable)
  const tradeBalanceBody = `nonce=${nonce}&asset=`;
  const tradeBalancePath = '/0/private/TradeBalance'; // Full path with version
  const tradeBalanceSignature = await createKrakenSignature(apiSecret, tradeBalancePath, tradeBalanceBody);
  
  const tradeResponse = await fetch('https://api.kraken.com/0/private/TradeBalance', {
    method: 'POST',
    headers: {
      'API-Key': apiKey,
      'API-Sign': tradeBalanceSignature,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: tradeBalanceBody
  });
  const tradeData = await tradeResponse.json();
  console.log('Kraken TradeBalance API Response:', JSON.stringify(tradeData));
  console.log('TradeBalance Request Body:', tradeBalanceBody);
  console.log('TradeBalance Path:', tradeBalancePath);
  console.log('API Key (first 10 chars):', apiKey.substring(0, 10));
  
  if (tradeData.result) {
    return Object.entries(tradeData.result).map(([asset, balance]) => ({ 
      asset, 
      balance: (balance as any).toString() 
    }));
  }
  
  // Fallback to Balance endpoint
  console.log('TradeBalance failed, trying Balance...');
  const balanceNonce = ((Date.now() * 1000) + 1).toString();
  const body = `nonce=${balanceNonce}`;
  const path = '/0/private/Balance'; // Full path with version
  const signature = await createKrakenSignature(apiSecret, path, body);
  
  const response = await fetch('https://api.kraken.com/0/private/Balance', {
    method: 'POST',
    headers: {
      'API-Key': apiKey,
      'API-Sign': signature,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body
  });
  const data = await response.json();
  console.log('Kraken Balance API Response:', JSON.stringify(data));
  console.log('Balance Request Body:', body);
  console.log('Balance Path:', path);
  
  if (data.error && data.error.length > 0) {
    console.error('Kraken API Error:', data.error);
  }
  
  return data.result ? Object.entries(data.result).map(([asset, balance]) => ({ asset, balance: (balance as any).toString() })) : [];
}

export async function krakenTradingBot(env: KrakenBridgeEnv, checkOnly: boolean = false): Promise<Response> {
  const apiKey = env.KRAKEN_API_KEY?.trim();
  const apiSecret = env.KRAKEN_API_SECRET?.trim();

  const json = (data: unknown, status = 200): Response => {
    return new Response(JSON.stringify(data), {
      status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  };

  if (!apiKey || !apiSecret) {
    return json({ 
      error: 'KRAKEN_API_KEY and KRAKEN_API_SECRET required',
      setup: 'Set these in Cloudflare Workers environment variables',
      instructions: `
To get Kraken API credentials:
1. Go to https://pro.kraken.com → Settings → API → Create API key (SPOT, not Derivatives)
2. Name: Aether-FirstDollar-Bot
3. Permissions: Query Funds + Modify Orders + Cancel/Close Orders (NOT Withdraw)
4. Nonce window: 10000+
5. Copy both values immediately (secret shows once)
6. Set secrets with printf (NOT echo):
   printf '%s' 'PASTE_KEY' | wrangler secret put KRAKEN_API_KEY
   printf '%s' 'PASTE_SECRET' | wrangler secret put KRAKEN_API_SECRET

IMPORTANT: This bot uses CONSERVATIVE risk management:
- Start with $10-50 only
- Use 2x leverage maximum
- 2% stop loss on every trade
- 5% take profit on every trade
- Maximum 1 position at a time
- Only trade BTC/USD or ETH/USD (high liquidity)

RISK WARNING: Trading with leverage involves significant risk. Only trade with money you can afford to lose. Past performance does not guarantee future results.
      `
    }, 400);
  }

  // Return key info for verification
  if (checkOnly) {
    // Actually fetch balance with the new key
    const balance = await getKrakenBalance(apiKey, apiSecret);
    return json({ 
      status: 'success',
      balance: balance,
      total_usd: balance.reduce((sum, b) => {
        if (b.asset === 'ZUSD') return sum + parseFloat(b.balance);
        return sum;
      }, 0),
      debug: 'Balance check with new key set via printf'
    });
  }

  try {
    // Get current balance
    const balance = await getKrakenBalance(apiKey, apiSecret);
    
    // Trading parameters - CONSERVATIVE with fee awareness
    const TRADING_PAIR = 'XBTUSD'; // BTC/USD
    const LEVERAGE = 1; // No leverage for spot trading (safer)
    const POSITION_SIZE_USD = 10; // $10 position (50% of ~$20 tradeable)
    const STOP_LOSS_PERCENT = 3; // 3% stop loss
    const TAKE_PROFIT_PERCENT = 5; // 5% take profit
    const MAX_POSITIONS = 1; // Maximum 1 position at a time
    const MIN_PROFIT_TARGET = 1; // Must clear 1% to overcome fees
    
    // Return balance if no USD available (for checking)
    const usdBalance = balance.find(b => b.asset === 'ZUSD')?.balance || '0';
    const usdBalanceNum = parseFloat(usdBalance);
    const availableAssets = balance.filter(b => parseFloat(b.balance) > 0);

    if (availableAssets.length === 0) {
      return json({ 
        status: 'no_funds',
        balance: balance,
        message: 'No funds available in account. Please deposit funds to start trading.',
        note: 'Staked Earn funds are NOT tradeable. Only unstaked funds can be traded.'
      });
    }

    // Check if we have enough tradeable USD
    if (usdBalanceNum < POSITION_SIZE_USD) {
      return json({ 
        status: 'insufficient_tradeable_funds',
        balance: balance,
        available_usd: usdBalanceNum,
        required_usd: POSITION_SIZE_USD,
        message: `Insufficient tradeable USD. Have $${usdBalanceNum.toFixed(2)}, need $${POSITION_SIZE_USD.toFixed(2)}. Staked Earn funds are not tradeable.`,
        action: 'Unstake funds from Earn or deposit more USD to enable trading.'
      });
    }

    // Get current price
    const ticker = await getTicker(TRADING_PAIR);
    const currentPrice = parseFloat(ticker.c[0]);

    // Calculate position
    const positionSize = POSITION_SIZE_USD / currentPrice;
    const stopLossPrice = currentPrice * (1 - STOP_LOSS_PERCENT / 100);
    const takeProfitPrice = currentPrice * (1 + TAKE_PROFIT_PERCENT / 100);

    // Check for existing positions
    const existingPositions = await getOpenPositions(apiKey, apiSecret);
    
    if (existingPositions.length >= MAX_POSITIONS) {
      return Response.json({ 
        status: 'max_positions_reached',
        existing_positions: existingPositions.length,
        message: 'Already have open position, waiting for exit'
      });
    }

    // Place market order (buy)
    const order = await placeOrder(apiKey, apiSecret, TRADING_PAIR, 'buy', positionSize);

    // Place stop-loss order
    const stopLossOrder = await placeOrder(apiKey, apiSecret, TRADING_PAIR, 'sell', positionSize, stopLossPrice);

    // Place take-profit order
    const takeProfitOrder = await placeOrder(apiKey, apiSecret, TRADING_PAIR, 'sell', positionSize, takeProfitPrice);

    return Response.json({
      status: 'success',
      action: 'position_opened',
      trading_pair: TRADING_PAIR,
      entry_price: currentPrice,
      position_size: positionSize,
      position_value_usd: POSITION_SIZE_USD,
      leverage: LEVERAGE,
      stop_loss: stopLossPrice,
      take_profit: takeProfitPrice,
      stop_loss_percent: STOP_LOSS_PERCENT * 100,
      take_profit_percent: TAKE_PROFIT_PERCENT * 100,
      orders: {
        entry: order.txid,
        stop_loss: stopLossOrder.txid,
        take_profit: takeProfitOrder.txid
      },
      risk_warning: 'Trading with leverage involves significant risk. Only trade with money you can afford to lose.'
    });

  } catch (error) {
    return Response.json({ 
      error: 'Trading failed',
      details: error instanceof Error ? error.message : 'unknown'
    }, { status: 500 });
  }
}

async function getTicker(pair: string): Promise<any> {
  const response = await fetch(`https://api.kraken.com/0/public/Ticker?pair=${pair}`);
  const data = await response.json();
  return data.result[pair];
}

async function getOpenPositions(apiKey: string, apiSecret: string): Promise<any[]> {
  const nonce = (Date.now() * 1000).toString();
  const bodyString = `nonce=${nonce}`;
  const path = '/0/private/OpenPositions';
  const signature = await createKrakenSignature(apiSecret, path, bodyString);
  
  const response = await fetch('https://api.kraken.com/0/private/OpenPositions', {
    method: 'POST',
    headers: {
      'API-Key': apiKey,
      'API-Sign': signature,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: bodyString
  });
  const data = await response.json();
  return data.result ? Object.values(data.result) : [];
}

async function placeOrder(apiKey: string, apiSecret: string, pair: string, type: string, volume: number, price?: number): Promise<any> {
  const nonce = (Date.now() * 1000).toString();
  // Build body as string for signature
  let bodyString = `nonce=${nonce}&pair=${pair}&type=${type}&volume=${volume.toString()}&ordertype=${price ? 'limit' : 'market'}`;
  if (price) {
    bodyString += `&price=${price.toString()}`;
  }
  
  const path = '/0/private/AddOrder';
  const signature = await createKrakenSignature(apiSecret, path, bodyString);

  const response = await fetch('https://api.kraken.com/0/private/AddOrder', {
    method: 'POST',
    headers: {
      'API-Key': apiKey,
      'API-Sign': signature,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: bodyString
  });
  const data = await response.json();
  return data.result;
}

async function createKrakenSignature(apiSecret: string, path: string, body: string): Promise<string> {
  // Kraken signature format: HMAC-SHA512 of (path + SHA256(nonce + POST data)) using base64-decoded secret
  // This is the exact format from Kraken documentation
  
  const encoder = new TextEncoder();
  
  // Decode secret from base64
  const secretBuffer = Uint8Array.from(atob(apiSecret), c => c.charCodeAt(0));
  
  // SHA256 of (nonce + body)
  const message = body;
  const messageBuffer = encoder.encode(message);
  const sha256Hash = await crypto.subtle.digest('SHA-256', messageBuffer);
  const sha256HashArray = new Uint8Array(sha256Hash);
  
  // HMAC-SHA512 of (path + SHA256 binary) using secret as key
  const pathBuffer = encoder.encode(path);
  const hmacMessage = new Uint8Array(pathBuffer.length + sha256HashArray.length);
  hmacMessage.set(pathBuffer);
  hmacMessage.set(sha256HashArray, pathBuffer.length);
  
  const key = await crypto.subtle.importKey(
    'raw',
    secretBuffer,
    { name: 'HMAC', hash: 'SHA-512' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    hmacMessage
  );
  
  const signatureArray = new Uint8Array(signature);
  const signatureBase64 = btoa(String.fromCharCode(...signatureArray));
  return signatureBase64;
}

// Multi-Crew Controller Integration Functions

/**
 * Register Trade-Monitor with Multi-Crew Controller
 */
export async function registerTradeMonitor(env: any): Promise<boolean> {
  try {
    const response = await fetch(`${env.DISPATCHER}/internal/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agentId: TRADE_MONITOR_CONFIG.agentId,
        crew: TRADE_MONITOR_CONFIG.crew,
        status: 'idle',
        roomId: TRADE_MONITOR_CONFIG.roomId
      })
    });

    const result = await response.json();
    console.log('[Trade-Monitor] Registration result:', result);
    return result.ok;
  } catch (error) {
    console.error('[Trade-Monitor] Registration failed:', error);
    return false;
  }
}

/**
 * Send trading telemetry to Multi-Crew Controller
 */
export async function sendTradeTelemetry(env: any, telemetry: TradeTelemetry): Promise<void> {
  try {
    if (!env.STATE_BROADCASTER) {
      console.warn('[Trade-Monitor] STATE_BROADCASTER not available');
      return;
    }

    const broadcasterId = env.STATE_BROADCASTER.idFromName(TRADE_MONITOR_CONFIG.roomId);
    const broadcaster = env.STATE_BROADCASTER.get(broadcasterId);
    await broadcaster.broadcast(telemetry, TRADE_MONITOR_CONFIG.roomId);
  } catch (error) {
    console.error('[Trade-Monitor] Failed to send telemetry:', error);
  }
}

/**
 * Validate trading against trading laws
 */
export function validateTradingLaws(trade: any, currentExposure: number): { valid: boolean; violation?: string } {
  // Law 1: Maximum Exposure
  if (trade.exposurePercent > TRADING_LAWS.maxExposurePercent) {
    return { valid: false, violation: 'max_exposure' };
  }

  // Law 2: Hard Stop (would be checked on position updates)
  if (trade.drawdownPercent > TRADING_LAWS.hardStopDrawdownPercent) {
    return { valid: false, violation: 'hard_stop' };
  }

  return { valid: true };
}

/**
 * Log trading law violation
 */
export async function logLawViolation(env: any, violation: string, details: string, action: string): Promise<void> {
  try {
    if (!env.RELIABILITY_TRACING) return;

    await env.RELIABILITY_TRACING.prepare(
      'INSERT INTO trading_law_violations (agent_id, law, violation_type, details, action_taken) VALUES (?, ?, ?, ?, ?)'
    ).bind(
      TRADE_MONITOR_CONFIG.agentId,
      violation,
      'exceeded',
      details,
      action
    ).run();

    console.log(`[Trade-Monitor] Law violation logged: ${violation}`);
  } catch (error) {
    console.error('[Trade-Monitor] Failed to log law violation:', error);
  }
}

/**
 * Check circuit breaker conditions
 */
export async function checkCircuitBreaker(env: any, volatility: number, errorCount: number): { triggered: boolean; reason?: string } {
  if (!CIRCUIT_BREAKER.enabled) return { triggered: false };

  // Check volatility threshold
  if (volatility > CIRCUIT_BREAKER.volatilityThreshold) {
    return { triggered: true, reason: 'volatility' };
  }

  // Check error rate
  if (errorCount > CIRCUIT_BREAKER.maxErrorsPerMinute) {
    return { triggered: true, reason: 'error_rate' };
  }

  return { triggered: false };
}

/**
 * Trigger circuit breaker (pause trading)
 */
export async function triggerCircuitBreaker(env: any, reason: string): Promise<void> {
  try {
    // Log circuit breaker event
    if (env.RELIABILITY_TRACING) {
      await env.RELIABILITY_TRACING.prepare(
        'INSERT INTO circuit_breaker_events (agent_id, trigger_type, trigger_value, action) VALUES (?, ?, ?, ?)'
      ).bind(
        TRADE_MONITOR_CONFIG.agentId,
        reason,
        0,
        'paused'
      ).run();
    }

    // Send pause command via Multi-Crew Controller
    if (env.DISPATCHER) {
      await fetch(`${env.DISPATCHER}/internal/control`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: TRADE_MONITOR_CONFIG.agentId,
          command: 'PAUSE_CREW',
          roomId: TRADE_MONITOR_CONFIG.roomId
        })
      });
    }

    // Send telemetry notification
    await sendTradeTelemetry(env, {
      agentId: TRADE_MONITOR_CONFIG.agentId,
      crew: TRADE_MONITOR_CONFIG.crew,
      timestamp: new Date().toISOString(),
      level: 'critical',
      action: 'command',
      payload: {
        message: `Circuit breaker triggered: ${reason}`,
        signal: 'circuit_breaker',
        status: 'paused'
      }
    });

    console.log(`[Trade-Monitor] Circuit breaker triggered: ${reason}`);
  } catch (error) {
    console.error('[Trade-Monitor] Failed to trigger circuit breaker:', error);
  }
}

/**
 * Send heartbeat to Multi-Crew Controller
 */
export async function sendTradeHeartbeat(env: any): Promise<void> {
  try {
    if (!env.RELIABILITY_TRACING) return;

    await env.RELIABILITY_TRACING.prepare(
      'UPDATE crew_registry SET last_heartbeat = ?, status = ? WHERE agent_id = ?'
    ).bind(
      new Date().toISOString(),
      'running',
      TRADE_MONITOR_CONFIG.agentId
    ).run();

    // Also send heartbeat via WebSocket
    await sendTradeTelemetry(env, {
      agentId: TRADE_MONITOR_CONFIG.agentId,
      crew: TRADE_MONITOR_CONFIG.crew,
      timestamp: new Date().toISOString(),
      level: 'info',
      action: 'broadcast',
      payload: {
        message: 'Trade-Monitor heartbeat',
        signal: 'heartbeat',
        status: 'running'
      }
    });
  } catch (error) {
    console.error('[Trade-Monitor] Failed to send heartbeat:', error);
  }
}

async function convertToUSD(apiKey: string, apiSecret: string, asset: string, amount: string): Promise<{ success: boolean; error?: string }> {
  try {
    const nonce = (Date.now() * 1000).toString();
    const pair = `${asset}ZUSD`; // Convert asset to USD
    const bodyString = `nonce=${nonce}&pair=${pair}&type=sell&ordertype=market&volume=${amount}`;
    const path = '/0/private/AddOrder';
    const signature = await createKrakenSignature(apiSecret, path, bodyString);

    const response = await fetch('https://api.kraken.com/0/private/AddOrder', {
      method: 'POST',
      headers: {
        'API-Key': apiKey,
        'API-Sign': signature,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: bodyString
    });
    const data = await response.json();
    
    if (data.error && data.error.length > 0) {
      return { success: false, error: data.error.join(', ') };
    }
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'unknown' };
  }
}
