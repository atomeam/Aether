/**
 * Kraken API Client — reads KRAKEN_API_KEY + KRAKEN_API_SECRET from env,
 * with fallback for local dev. Store secrets as base64 in wrangler.
 */

import * as crypto from 'node:crypto';

// Cloudflare Workers env binding — set via: wrangler secret put KRAKEN_API_KEY
// @ts-ignore - env is injected by CF Workers runtime
const API_KEY = typeof env !== 'undefined' ? (env.KRAKEN_API_KEY ?? '') : '';
// @ts-ignore
const SECRET_B64 = typeof env !== 'undefined' ? (env.KRAKEN_API_SECRET ?? '') : '';

// Fallback for local dev only (tokens from Kraken account)
const DEV_API_KEY = '70gllMYdRuxUEPo3459khbbmFnHzsyh36jBJoGYR01731DW844kEe3Qh';
const DEV_SECRET_B64 = 'VKFETK_vJLubsrcNXdQibFhorXuoUJRf7BJRUHBWZQ0Lr4CJ_s8nCq-38pwSOCw84ICy_KkqEo57GHuc8vrX8oZ'
  + 'TkHhwMwOA_8JK8qkqBx-nYYQ'; // base64 of the hex secret

const _API_KEY = API_KEY || DEV_API_KEY;
const _SECRET_HEX = SECRET_B64
  ? Buffer.from(SECRET_B64, 'base64').toString('hex')
  : '551a464ceef24b9bdbb6ac7d5d8426e5c68abd7a8502945ef1325117045650d0b0685f5289eb383ed83c9eb77f93a0c45e21c34e803bf092bca94a8139ec61e0';

function krakenSign(path: string, postData: string): string {
  const nonce = Date.now() * 1000 + Math.floor(Math.random() * 999999);
  const msgHash = crypto.createHash('sha256').update(nonce.toString() + postData).digest();
  const msg = path + msgHash;
  return crypto.createHmac('sha512', Buffer.from(SECRET_HEX, 'hex')).update(msg).digest('base64');
}

async function krakenPrivate(path: string, data: Record<string, string> = {}): Promise<unknown> {
  const nonce = Date.now() * 1000 + Math.floor(Math.random() * 999999);
  const postData = 'nonce=' + nonce + Object.entries(data).map(([k, v]) => `&${k}=${v}`).join('');
  const sign = krakenSign(path, postData);

  const res = await fetch(`https://api.kraken.com${path}`, {
    method: 'POST',
    headers: { 'API-Key': API_KEY, 'API-Sign': sign, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: postData,
  });

  if (!res.ok) throw new Error(`Kraken API error: ${res.status}`);
  const json = await res.json() as { error: string[]; result?: unknown };
  if (json.error?.length) throw new Error(`Kraken error: ${json.error.join(', ')}`);
  return json.result;
}

// ── Deposit ──────────────────────────────────────────────────────────────────

/** Get USDC deposit address on Base chain (0 fee, $2.50 min). */
export async function getUSDCBaseDepositAddress(): Promise<string> {
  const result = await krakenPrivate('/0/private/DepositAddresses', {
    asset: 'USDC',
    method: 'USDC - Base (Unified)',
  }) as Array<{ address: string; expiretm: number }>;
  return result[0]?.address ?? '';
}

// ── Balance ─────────────────────────────────────────────────────────────────

/** Get total account equity in USD. */
export async function getEquityUSD(): Promise<number> {
  const result = await krakenPrivate('/0/private/TradeBalance') as {
    e: string; // equity
    tb: string; // trade balance
    eb: string; // equivalent balance
  };
  return parseFloat(result.e || '0');
}

/** Get USDC balance only. */
export async function getUSDCBalance(): Promise<number> {
  const result = await krakenPrivate('/0/private/Balance') as Record<string, string>;
  return parseFloat(result.USDC || '0');
}

// ── Trading ─────────────────────────────────────────────────────────────────

/** Sell USDC for USD at market price. Returns filled price. */
export async function sellUSDCForUSD(amount: number): Promise<string> {
  const result = await krakenPrivate('/0/private/AddOrder', {
    pair: 'USDCUSD',
    type: 'sell',
    ordertype: 'market',
    volume: amount.toString(),
  }) as { txid: string[] };
  return result.txid?.[0] ?? '';
}

// ── Withdrawal ─────────────────────────────────────────────────────────────

/** Withdraw USD to bank via ACH (0 fee, $100K/day limit, $500K/month). */
export async function withdrawToBankUSD(amount: number): Promise<string> {
  // Find ACH method id
  const methods = await krakenPrivate('/0/private/WithdrawMethods', { asset: 'ZUSD' }) as Array<{
    method_id: string;
    method: string;
    fee: string;
    minimum: string;
  }>;
  const ach = methods.find(m => m.method.includes('ACH') || m.method.includes('Plaid'));
  if (!ach) throw new Error('ACH withdrawal method not found');

  const result = await krakenPrivate('/0/private/Withdraw', {
    asset: 'ZUSD',
    amount: amount.toString(),
    key: ach.method_id,
  }) as { refid: string };
  return result.refid;
}

// ── Health check ────────────────────────────────────────────────────────────

export interface KrakenHealth {
  connected: boolean;
  equityUSD: number;
  usdcBalance: number;
  krakenUSD: number;
  depositAddress: string;
}

export async function checkKrakenHealth(): Promise<KrakenHealth> {
  try {
    const [balance, equity, address] = await Promise.all([
      krakenPrivate('/0/private/Balance') as Promise<Record<string, string>>,
      krakenPrivate('/0/private/TradeBalance') as Promise<{ e: string }>,
      getUSDCBaseDepositAddress(),
    ]);
    const usdBalance = parseFloat(balance.USD || '0') || parseFloat(balance.ZUSD || '0') || 0;
    return {
      connected: true,
      equityUSD: parseFloat((equity as { e: string }).e || '0'),
      usdcBalance: parseFloat(balance.USDC || '0'),
      krakenUSD: usdBalance,
      depositAddress: address,
    };
  } catch {
    return { connected: false, equityUSD: 0, usdcBalance: 0, krakenUSD: 0, depositAddress: '' };
  }
}