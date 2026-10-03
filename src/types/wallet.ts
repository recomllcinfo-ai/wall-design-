export type NetworkId = 'bitcoin' | 'ethereum' | 'bnb' | 'arbitrum' | 'base' | 'polygon' | 'solana' | 'optimism' | 'avalanche' | 'cosmos';

export interface Network {
  id: NetworkId;
  name: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  rpcUrl: string;
  explorerUrl: string;
  icon: string;
  color: string;
  isTestnet?: boolean;
}

export interface Token {
  id: string;
  symbol: string;
  name: string;
  decimals: number;
  balance: number;
  priceUsd: number;
  change24h: number;
  icon: string;
  contractAddress?: string;
  networkId: NetworkId;
  sparkline?: number[];
  coingeckoId?: string;
}

export interface NFT {
  id: string;
  name: string;
  collection: string;
  image: string;
  floorPriceEth: number;
  floorPriceUsd: number;
  networkId: NetworkId;
  tokenId: string;
}

export type TransactionType = 'send' | 'receive' | 'swap' | 'approve' | 'offramp';
export type TransactionStatus = 'confirmed' | 'pending' | 'failed';

export interface Transaction {
  id: string;
  accountId?: string; // owning account
  hash: string;
  type: TransactionType;
  status: TransactionStatus;
  from: string;
  to: string;
  amount: number;
  tokenSymbol: string;
  fiatValueUsd: number;
  timestamp: number;
  networkId: NetworkId;
  gasFeeEth: number;
  gasFeeUsd: number;
  nonce?: number;
  memo?: string;
  toResolvedName?: string;
}

export interface Account {
  id: string;
  name: string;
  address: string;
  solanaAddress?: string;
  bitcoinAddress?: string;
  derivationPath: string;
  isDemo?: boolean;
}

export interface GasOption {
  speed: 'slow' | 'market' | 'fast';
  label: string;
  gwei: number;
  estimatedSeconds: number;
  feeEth: number;
  feeUsd: number;
}

// loading: checking session · signed_out: show login · needs_wallet: signed in, no accounts yet
export type VaultStatus = 'loading' | 'signed_out' | 'needs_wallet' | 'unlocked';
export type Currency = 'USD' | 'EUR' | 'GBP';

export interface SwapRoute {
  fromToken: Token;
  toToken: Token;
  fromAmount: number;
  toAmount: number;
  rate: number;
  priceImpact: number;
  slippage: number;
  networkFeeUsd: number;
  provider: '0x' | '1inch' | 'Uniswap v3' | 'Jupiter';
}

export interface WalletNotification {
  id: string;
  type: 'success' | 'info' | 'error' | 'warning';
  title: string;
  message: string;
  timestamp: number;
}
