import { BridgeEnv } from '../types';

// Kraken Trading Bot for Cloudflare Workers
// CONSERVATIVE STRATEGY - Small positions, tight stops, managed risk

export async function krakenTradingBot(env: BridgeEnv): Promise<Response> {
  const apiKey = env.KRAKEN_API_KEY;
  const apiSecret = env.KRAKEN_API_SECRET;

  if (!apiKey || !apiSecret) {
    return Response.json({ 
      error: 'KRAKEN_API_KEY and KRAKEN_API_SECRET required',
      setup: 'Set these in Cloudflare Workers environment variables',
      instructions: `
To get Kraken API credentials:
1. Go to https://www.kraken.com/u/settings/api
2. Create new API key
3. Enable "Query" and "Trade" permissions
4. Set KRAKEN_API_KEY in Cloudflare Workers environment variables
5. Set KRAKEN_API_SECRET in Cloudflare Workers environment variables

IMPORTANT: This bot uses CONSERVATIVE risk management:
- Start with $10-50 only
- Use 2x leverage maximum
- 2% stop loss on every trade
- 5% take profit on every trade
- Maximum 1 position at a time
- Only trade BTC/USD or ETH/USD (high liquidity)

RISK WARNING: Trading with leverage involves significant risk. Only trade with money you can afford to lose. Past performance does not guarantee future results.
      `
    }, { status: 400 });
  }

  // Trading parameters - CONSERVATIVE
  const TRADING_PAIR = 'XBTUSD'; // BTC/USD
  const LEVERAGE = 2; // 2x leverage (conservative)
  const POSITION_SIZE_USD = 10; // Start with $10
  const STOP_LOSS_PERCENT = 0.02; // 2% stop loss
  const TAKE_PROFIT_PERCENT = 0.05; // 5% take profit
  const MAX_POSITIONS = 1; // Only 1 position at a time

  try {
    // Get current balance
    const balance = await getBalance(apiKey, apiSecret);
    const usdBalance = balance.find(b => b.asset === 'ZUSD')?.balance || '0';
    const usdBalanceNum = parseFloat(usdBalance);

    if (usdBalanceNum < POSITION_SIZE_USD) {
      return Response.json({ 
        status: 'insufficient_balance',
        balance: usdBalanceNum,
        required: POSITION_SIZE_USD,
        message: 'Need at least $10 to start trading'
      });
    }

    // Get current price
    const ticker = await getTicker(TRADING_PAIR);
    const currentPrice = parseFloat(ticker.c[0]);

    // Calculate position
    const positionSize = POSITION_SIZE_USD / currentPrice;
    const stopLossPrice = currentPrice * (1 - STOP_LOSS_PERCENT);
    const takeProfitPrice = currentPrice * (1 + TAKE_PROFIT_PERCENT);

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

async function getBalance(apiKey: string, apiSecret: string): Promise<any[]> {
  const nonce = Date.now().toString();
  const body = `nonce=${nonce}`;
  const path = '/0/private/Balance';
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
  return data.result ? Object.entries(data.result).map(([asset, balance]) => ({ asset, balance: (balance as any).toString() })) : [];
}

async function getTicker(pair: string): Promise<any> {
  const response = await fetch(`https://api.kraken.com/0/public/Ticker?pair=${pair}`);
  const data = await response.json();
  return data.result[pair];
}

async function getOpenPositions(apiKey: string, apiSecret: string): Promise<any[]> {
  const nonce = Date.now().toString();
  const body = `nonce=${nonce}`;
  const path = '/0/private/OpenPositions';
  const signature = await createKrakenSignature(apiSecret, path, body);
  
  const response = await fetch('https://api.kraken.com/0/private/OpenPositions', {
    method: 'POST',
    headers: {
      'API-Key': apiKey,
      'API-Sign': signature,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body
  });
  const data = await response.json();
  return data.result ? Object.values(data.result) : [];
}

async function placeOrder(apiKey: string, apiSecret: string, pair: string, type: string, volume: number, price?: number): Promise<any> {
  const nonce = Date.now().toString();
  const body = new URLSearchParams({
    nonce,
    pair,
    type,
    volume: volume.toString(),
    ordertype: price ? 'limit' : 'market',
    ...(price && { price: price.toString() })
  });
  const bodyString = body.toString();
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
  // Kraken signature format: HMAC-SHA512 of (path + SHA256(nonce + body)) using base64-decoded secret
  const encoder = new TextEncoder();
  
  // Decode secret from base64
  const secretBuffer = Uint8Array.from(atob(apiSecret), c => c.charCodeAt(0));
  
  // SHA256 of (nonce + body)
  const message = body;
  const messageBuffer = encoder.encode(message);
  const sha256Hash = await crypto.subtle.digest('SHA-256', messageBuffer);
  const sha256HashArray = new Uint8Array(sha256Hash);
  
  // HMAC-SHA512 of (path + SHA256 hash) using secret as key
  const hmacMessage = encoder.encode(path);
  const hmacMessageWithHash = new Uint8Array(hmacMessage.length + sha256HashArray.length);
  hmacMessageWithHash.set(hmacMessage);
  hmacMessageWithHash.set(sha256HashArray, hmacMessage.length);
  
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
    hmacMessageWithHash
  );
  
  const signatureArray = new Uint8Array(signature);
  const signatureBase64 = btoa(String.fromCharCode(...signatureArray));
  return signatureBase64;
}
