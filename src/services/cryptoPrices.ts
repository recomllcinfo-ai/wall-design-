import type { Currency } from '../types/wallet';

export interface PriceData {
  symbol: string;
  priceUsd: number;
  change24h: number;
  sparkline: number[];
}

// Realistic baseline prices (used when API is offline)
const BASELINE_PRICES: Record<string, Omit<PriceData, 'symbol'>> = {
  BTC:  { priceUsd: 89250,  change24h: 2.18,  sparkline: [86200,87100,86900,88100,88900,89000,89250] },
  ETH:  { priceUsd: 3420,   change24h: 3.45,  sparkline: [3280,3310,3295,3350,3380,3405,3420] },
  BNB:  { priceUsd: 595,    change24h: 1.12,  sparkline: [582,585,581,588,590,593,595] },
  SOL:  { priceUsd: 184,    change24h: 6.80,  sparkline: [168,172,170,175,179,181,184] },
  XRP:  { priceUsd: 0.59,   change24h: -0.85, sparkline: [0.61,0.60,0.595,0.59,0.592,0.590,0.59] },
  ADA:  { priceUsd: 0.44,   change24h: 1.95,  sparkline: [0.42,0.425,0.43,0.43,0.435,0.44,0.44] },
  DOGE: { priceUsd: 0.115,  change24h: 4.30,  sparkline: [0.105,0.108,0.107,0.110,0.112,0.114,0.115] },
  AVAX: { priceUsd: 26.80,  change24h: 2.90,  sparkline: [25.5,25.9,25.7,26.2,26.5,26.7,26.80] },
  DOT:  { priceUsd: 5.85,   change24h: -1.20, sparkline: [6.1,6.0,5.95,5.90,5.88,5.86,5.85] },
  LINK: { priceUsd: 13.20,  change24h: 3.75,  sparkline: [12.4,12.6,12.5,12.8,13.0,13.1,13.20] },
  UNI:  { priceUsd: 8.40,   change24h: 2.10,  sparkline: [8.0,8.1,8.05,8.2,8.3,8.35,8.40] },
  MATIC:{ priceUsd: 0.58,   change24h: -1.20, sparkline: [0.61,0.60,0.59,0.59,0.58,0.585,0.58] },
  ATOM: { priceUsd: 7.20,   change24h: 0.55,  sparkline: [7.0,7.05,7.02,7.10,7.15,7.18,7.20] },
  LTC:  { priceUsd: 78.50,  change24h: 1.45,  sparkline: [76.0,76.8,76.5,77.2,77.8,78.1,78.50] },
  ARB:  { priceUsd: 0.85,   change24h: 4.12,  sparkline: [0.79,0.81,0.80,0.82,0.83,0.84,0.85] },
  OP:   { priceUsd: 1.95,   change24h: 5.30,  sparkline: [1.78,1.82,1.80,1.86,1.89,1.92,1.95] },
  INJ:  { priceUsd: 18.40,  change24h: 7.20,  sparkline: [16.5,17.0,16.8,17.5,18.0,18.2,18.40] },
  APT:  { priceUsd: 8.90,   change24h: 3.50,  sparkline: [8.3,8.5,8.4,8.6,8.7,8.8,8.90] },
  USDT: { priceUsd: 1.00,   change24h: 0.01,  sparkline: [1,1,0.999,1,1.001,1,1] },
  USDC: { priceUsd: 1.00,   change24h: -0.01, sparkline: [1,1,1,0.999,1,1,1] },
};

// DeFiLlama coin IDs mapped to our token symbols
const LLAMA_IDS: Record<string, string> = {
  'coingecko:bitcoin':             'BTC',
  'coingecko:ethereum':            'ETH',
  'coingecko:binancecoin':         'BNB',
  'coingecko:solana':              'SOL',
  'coingecko:ripple':              'XRP',
  'coingecko:cardano':             'ADA',
  'coingecko:dogecoin':            'DOGE',
  'coingecko:avalanche-2':         'AVAX',
  'coingecko:polkadot':            'DOT',
  'coingecko:chainlink':           'LINK',
  'coingecko:uniswap':             'UNI',
  'coingecko:matic-network':       'MATIC',
  'coingecko:cosmos':              'ATOM',
  'coingecko:litecoin':            'LTC',
  'coingecko:arbitrum':            'ARB',
  'coingecko:optimism':            'OP',
  'coingecko:injective-protocol':  'INJ',
  'coingecko:aptos':               'APT',
  'coingecko:tether':              'USDT',
  'coingecko:usd-coin':            'USDC',
};

export async function fetchLiveCryptoPrices(): Promise<Record<string, PriceData>> {
  // Build the full result from baseline first
  const result: Record<string, PriceData> = {};
  for (const [sym, data] of Object.entries(BASELINE_PRICES)) {
    result[sym] = { symbol: sym, ...data };
  }

  try {
    const ids = Object.keys(LLAMA_IDS).join(',');
    const [res, pctRes] = await Promise.all([
      fetch(`https://coins.llama.fi/prices/current/${ids}`, { cache: 'no-store' }),
      // Real 24h % change. Diffing live prices against the hard-coded baseline produced
      // wildly wrong figures (e.g. -90%) once the baseline went stale.
      fetch(`https://coins.llama.fi/percentage/${ids}?period=24h`, { cache: 'no-store' })
        .catch(() => null),
    ]);
    if (!res.ok) throw new Error('Price fetch failed');
    const json = await res.json();
    const coins = json.coins || {};
    const pcts: Record<string, number> = pctRes?.ok ? (await pctRes.json()).coins || {} : {};

    for (const [llamaId, sym] of Object.entries(LLAMA_IDS)) {
      const coin = coins[llamaId];
      if (coin?.price && result[sym]) {
        const live  = coin.price as number;
        const old   = result[sym].priceUsd;
        const pct   = pcts[llamaId];
        // Keep the baseline sparkline shape but rescale it to the live price level
        const scale = old > 0 ? live / old : 1;
        result[sym] = {
          ...result[sym],
          priceUsd:  live,
          sparkline: [...result[sym].sparkline.slice(0, -1).map(v => v * scale), live],
          change24h: typeof pct === 'number' && isFinite(pct) ? +pct.toFixed(2) : 0,
        };
      }
    }
  } catch {
    // Silent fallback to baseline prices — already set above
  }

  return result;
}

const FIAT_RATES: Record<Currency, { symbol: string; rate: number }> = {
  USD: { symbol: '$',  rate: 1.0  },
  EUR: { symbol: '€',  rate: 0.92 },
  GBP: { symbol: '£',  rate: 0.79 },
};

export function formatFiat(amountUsd: number, currency: Currency = 'USD'): string {
  const { rate } = FIAT_RATES[currency] ?? FIAT_RATES.USD;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: amountUsd < 1 && amountUsd > 0 ? 4 : 2,
  }).format(amountUsd * rate);
}

export function formatCryptoAmount(amount: number, decimals = 4): string {
  if (amount === 0) return '0.00';
  if (amount < 0.0001) return '<0.0001';
  return amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: decimals,
  });
}
