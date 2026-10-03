import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { fetchLiveCryptoPrices, type PriceData } from '../services/cryptoPrices';
import {
  EMPTY_NFTS,
  generateRandomBitcoinAddress,
  generateRandomEvmAddress,
  generateRandomSolanaAddress,
  NETWORKS,
  SUPPORTED_TOKENS,
} from '../services/mockBlockchain';
import type {
  Account,
  Currency,
  NetworkId,
  NFT,
  Token,
  Transaction,
  VaultStatus,
  WalletNotification,
} from '../types/wallet';

// ─── Context shape ────────────────────────────────────────────────────────────
interface WalletContextType {
  vaultStatus: VaultStatus;
  userEmail: string | null;
  accounts: Account[];
  activeAccount: Account | null;
  activeNetwork: NetworkId;
  currency: Currency;
  tokens: Token[];
  nfts: NFT[];
  transactions: Transaction[];
  mnemonic: string[];
  autoLockMinutes: number;
  isExtensionView: boolean;
  isLivePriceLoading: boolean;
  lastPriceUpdate: Date | null;
  notifications: WalletNotification[];

  // Actions
  setCurrency: (c: Currency) => void;
  setActiveNetwork: (n: NetworkId) => void;
  setIsExtensionView: (v: boolean) => void;
  setAutoLockMinutes: (m: number) => void;
  signIn: (email: string, pass: string) => Promise<string | null>;
  signUp: (email: string, pass: string) => Promise<{ error: string | null; needsConfirmation: boolean }>;
  createWallet: (words: string[]) => Promise<void>;
  importWallet: (phraseOrKey: string) => Promise<void>;
  lockVault: () => void;
  switchAccount: (id: string) => void;
  createAdditionalAccount: (name?: string) => void;
  sendCrypto: (params: {
    to: string; tokenSymbol: string; amount: number;
    gasFeeEth: number; gasFeeUsd: number; memo?: string; toResolvedName?: string;
  }) => Promise<string>;
  swapTokens: (params: {
    fromSymbol: string; toSymbol: string; fromAmount: number; toAmount: number; gasFeeUsd: number;
  }) => Promise<string>;
  executeFiatOfframp: (params: {
    tokenSymbol: string; cryptoAmount: number; fiatAmount: number; payoutMethod: string;
  }) => Promise<string>;
  refreshLivePrices: () => Promise<void>;
  resetAllData: () => void;
  dismissNotification: (id: string) => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

// ─── Local (per-device) preferences ──────────────────────────────────────────
// Wallet data lives in Supabase; only UI preferences stay in the browser.
const SK = {
  ACTIVE_ID: 'apexv_active_account_id',
  NETWORK:   'apexv_active_network',
  CURRENCY:  'apexv_currency',
};

function readStorage(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return null; }
}
function writeStorage(key: string, value: string) {
  try { localStorage.setItem(key, value); } catch { /* storage unavailable */ }
}

// ─── Row mapping ─────────────────────────────────────────────────────────────
interface AccountRow {
  id: string; name: string; address: string; solana_address: string | null;
  bitcoin_address: string | null; derivation_path: string; is_demo: boolean;
}
interface TransactionRow {
  id: string; account_id: string; hash: string; type: Transaction['type']; status: Transaction['status'];
  from_address: string; to_address: string; amount: number | string; token_symbol: string;
  fiat_value_usd: number | string; network_id: NetworkId; gas_fee_eth: number | string;
  gas_fee_usd: number | string; memo: string | null; to_resolved_name: string | null; created_at: string;
}

const toAccount = (r: AccountRow): Account => ({
  id: r.id,
  name: r.name,
  address: r.address,
  solanaAddress: r.solana_address ?? undefined,
  bitcoinAddress: r.bitcoin_address ?? undefined,
  derivationPath: r.derivation_path,
  isDemo: r.is_demo,
});

const toTransaction = (r: TransactionRow): Transaction => ({
  id: r.id,
  accountId: r.account_id,
  hash: r.hash,
  type: r.type,
  status: r.status,
  from: r.from_address,
  to: r.to_address,
  amount: Number(r.amount),
  tokenSymbol: r.token_symbol,
  fiatValueUsd: Number(r.fiat_value_usd),
  timestamp: Date.parse(r.created_at),
  networkId: r.network_id,
  gasFeeEth: Number(r.gas_fee_eth),
  gasFeeUsd: Number(r.gas_fee_usd),
  memo: r.memo ?? undefined,
  toResolvedName: r.to_resolved_name ?? undefined,
});

const errorMessage = (e: unknown) =>
  e && typeof e === 'object' && 'message' in e ? String((e as { message: unknown }).message) : 'Request failed';

// ─── Build the zero-balance token list ───────────────────────────────────────
function buildTokenList(prices: Record<string, PriceData>): Token[] {
  return SUPPORTED_TOKENS.map(t => ({
    ...t,
    balance: 0,
    priceUsd:  prices[t.symbol]?.priceUsd  ?? 0,
    change24h: prices[t.symbol]?.change24h ?? 0,
    sparkline: prices[t.symbol]?.sparkline ?? [],
  }));
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session,           setSession]            = useState<Session | null>(null);
  const [authReady,         setAuthReady]          = useState(false);
  const [dataLoaded,        setDataLoaded]         = useState(false);
  const [accounts,          setAccounts]           = useState<Account[]>([]);
  const [activeAccountId,   setActiveAccountId]    = useState<string | null>(() => readStorage(SK.ACTIVE_ID));
  const [activeNetwork,     setActiveNetworkState] = useState<NetworkId>(() => {
    const saved = readStorage(SK.NETWORK) as NetworkId | null;
    return saved && NETWORKS[saved] ? saved : 'ethereum';
  });
  const [currency,          setCurrencyState]      = useState<Currency>(() => (readStorage(SK.CURRENCY) as Currency | null) ?? 'USD');
  const [nfts]                                     = useState<NFT[]>(EMPTY_NFTS);
  const [allTransactions,   setAllTransactions]    = useState<Transaction[]>([]);
  const [balancesByAccount, setBalancesByAccount]  = useState<Record<string, Record<string, number>>>({});
  // The recovery phrase is only held in memory right after creation; it is never stored
  const [mnemonic,          setMnemonic]           = useState<string[]>([]);
  const [autoLockMinutes,   setAutoLockMinutes]    = useState<number>(15);
  const [isExtensionView,   setIsExtensionView]    = useState<boolean>(false);
  const [isLivePriceLoading,setIsLivePriceLoading] = useState<boolean>(false);
  const [lastPriceUpdate,   setLastPriceUpdate]    = useState<Date | null>(null);
  const [notifications,     setNotifications]      = useState<WalletNotification[]>([]);
  const [marketTokens,      setMarketTokens]       = useState<Token[]>(() => buildTokenList({}));

  const userId = session?.user.id ?? null;

  const activeAccount = useMemo(
    () => accounts.find(a => a.id === activeAccountId) ?? accounts[0] ?? null,
    [accounts, activeAccountId]
  );

  // What the UI sees: market data merged with the active account's balances
  const activeBalances = activeAccount ? balancesByAccount[activeAccount.id] : undefined;
  const tokens = useMemo(
    () => marketTokens.map(t => ({ ...t, balance: activeBalances?.[t.symbol] ?? 0 })),
    [marketTokens, activeBalances]
  );

  const transactions = useMemo(
    () => allTransactions.filter(tx => tx.accountId === activeAccount?.id),
    [allTransactions, activeAccount]
  );

  const vaultStatus: VaultStatus =
    !authReady ? 'loading' :
    !session ? 'signed_out' :
    !dataLoaded ? 'loading' :
    accounts.length === 0 ? 'needs_wallet' :
    'unlocked';

  // ── Notifications ──────────────────────────────────────────────────────────
  const addNotification = useCallback((
    type: WalletNotification['type'],
    title: string,
    message: string
  ) => {
    const notif: WalletNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      type, title, message, timestamp: Date.now(),
    };
    setNotifications(prev => [notif, ...prev.slice(0, 4)]);
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== notif.id)), 5000);
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // ── Auth session ───────────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setAuthReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // ── Load wallet data for the signed-in user ────────────────────────────────
  const loadWalletData = useCallback(async () => {
    const [accRes, balRes, txRes] = await Promise.all([
      supabase.from('wallet_accounts').select('*').order('created_at'),
      supabase.from('balances').select('account_id, symbol, amount'),
      supabase.from('transactions').select('*').order('created_at', { ascending: false }).limit(500),
    ]);
    if (accRes.error || balRes.error || txRes.error) {
      console.error('Load error:', accRes.error ?? balRes.error ?? txRes.error);
      addNotification('error', 'Sync Failed', 'Could not load wallet data. Check your connection.');
      return;
    }
    setAccounts((accRes.data as AccountRow[]).map(toAccount));
    const balances: Record<string, Record<string, number>> = {};
    for (const b of balRes.data as { account_id: string; symbol: string; amount: number | string }[]) {
      (balances[b.account_id] ??= {})[b.symbol] = Number(b.amount);
    }
    setBalancesByAccount(balances);
    setAllTransactions((txRes.data as TransactionRow[]).map(toTransaction));
    setDataLoaded(true);
  }, [addNotification]);

  useEffect(() => {
    if (!userId) {
      setAccounts([]);
      setBalancesByAccount({});
      setAllTransactions([]);
      setDataLoaded(false);
      return;
    }
    loadWalletData();

    // Incoming transfers (from another account or another user) show up live
    const channel = supabase
      .channel(`wallet-${userId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'transactions' }, () => {
        loadWalletData();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId, loadWalletData]);

  // ── Persist local preferences ──────────────────────────────────────────────
  useEffect(() => { if (activeAccount) writeStorage(SK.ACTIVE_ID, activeAccount.id); }, [activeAccount]);
  useEffect(() => { writeStorage(SK.NETWORK,  activeNetwork); }, [activeNetwork]);
  useEffect(() => { writeStorage(SK.CURRENCY, currency);      }, [currency]);

  // ── Live price polling ──────────────────────────────────────────────────────
  const refreshLivePrices = useCallback(async () => {
    setIsLivePriceLoading(true);
    try {
      const prices = await fetchLiveCryptoPrices();
      setMarketTokens(prev => prev.map(t => {
        const p = prices[t.symbol];
        if (!p) return t;
        return { ...t, priceUsd: p.priceUsd, change24h: p.change24h, sparkline: p.sparkline };
      }));
      setLastPriceUpdate(new Date());
    } finally {
      setIsLivePriceLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshLivePrices();
    const id = setInterval(refreshLivePrices, 30_000);
    return () => clearInterval(id);
  }, [refreshLivePrices]);

  // ── Auth actions ───────────────────────────────────────────────────────────
  const signIn = async (email: string, pass: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: pass });
    return error ? error.message : null;
  };

  const signUp = async (email: string, pass: string) => {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password: pass,
      options: { emailRedirectTo: window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" ? window.location.origin : "https://apexoffshore.online" },
    });
    if (error) return { error: error.message, needsConfirmation: false };
    // With email confirmation enabled, Supabase returns no session until the link is clicked
    return { error: null, needsConfirmation: !data.session };
  };

  const lockVault = () => {
    setMnemonic([]);
    supabase.auth.signOut();
  };

  // ── Accounts ────────────────────────────────────────────────────────────────
  const insertAccount = async (idx: number, name: string): Promise<Account> => {
    const { data, error } = await supabase
      .from('wallet_accounts')
      .insert({
        name,
        address:         generateRandomEvmAddress(),
        solana_address:  generateRandomSolanaAddress(),
        bitcoin_address: generateRandomBitcoinAddress(),
        derivation_path: `m/44'/60'/0'/0/${idx}`,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    const acc = toAccount(data as AccountRow);
    setAccounts(prev => [...prev, acc]);
    setActiveAccountId(acc.id);
    return acc;
  };

  const createWallet = async (words: string[]) => {
    await insertAccount(0, 'Account 1');
    setMnemonic(words);
    addNotification('success', 'Wallet Created', 'Your new wallet is ready. Receive crypto to get started.');
  };

  const importWallet = async (phraseOrKey: string) => {
    const words = phraseOrKey.trim().split(/\s+/);
    await insertAccount(accounts.length, 'Imported Account');
    if (words.length >= 12) setMnemonic(words);
    addNotification('success', 'Wallet Imported', 'Your wallet has been imported. It starts with a zero balance.');
  };

  const switchAccount = (id: string) => {
    if (accounts.some(a => a.id === id)) setActiveAccountId(id);
  };

  const createAdditionalAccount = async (name?: string) => {
    try {
      const acc = await insertAccount(accounts.length, name ?? `Account ${accounts.length + 1}`);
      addNotification('info', 'New Account Added', `${acc.name} is ready. It starts with a zero balance.`);
    } catch (e) {
      addNotification('error', 'Could Not Add Account', errorMessage(e));
    }
  };

  // ── Money movement (validated and applied atomically in the database) ──────
  const requireAccount = () => {
    if (!activeAccount) throw new Error('No active account');
    return activeAccount;
  };

  const sendCrypto = async (params: {
    to: string; tokenSymbol: string; amount: number;
    gasFeeEth: number; gasFeeUsd: number; memo?: string; toResolvedName?: string;
  }): Promise<string> => {
    const acc = requireAccount();
    const token = tokens.find(t => t.symbol === params.tokenSymbol);
    if (!token) throw new Error(`Unknown token: ${params.tokenSymbol}`);
    const sendNetwork = token.networkId;
    const isEvm = sendNetwork !== 'solana' && sendNetwork !== 'bitcoin';
    const { data, error } = await supabase.rpc('transfer', {
      p_from:     acc.id,
      p_to:       params.to,
      p_symbol:   params.tokenSymbol,
      p_amount:   params.amount,
      p_network:  sendNetwork,
      p_gas_eth:  isEvm ? params.gasFeeEth : 0,
      p_gas_usd:  params.gasFeeUsd,
      p_fiat_usd: (token?.priceUsd ?? 0) * params.amount,
      p_memo:     params.memo ?? null,
      p_to_name:  params.toResolvedName ?? null,
    });
    if (error) throw new Error(error.message);
    await loadWalletData();
    addNotification('success', 'Transfer Sent', `${params.amount} ${params.tokenSymbol} is on its way.`);
    return data as string;
  };

  const swapTokens = async (params: {
    fromSymbol: string; toSymbol: string; fromAmount: number; toAmount: number; gasFeeUsd: number;
  }): Promise<string> => {
    const acc = requireAccount();
    const fromToken = tokens.find(t => t.symbol === params.fromSymbol);
    const { data, error } = await supabase.rpc('swap_tokens', {
      p_account:     acc.id,
      p_from_symbol: params.fromSymbol,
      p_to_symbol:   params.toSymbol,
      p_from_amount: params.fromAmount,
      p_to_amount:   params.toAmount,
      p_network:     activeNetwork,
      p_gas_usd:     params.gasFeeUsd,
      p_fiat_usd:    (fromToken?.priceUsd ?? 0) * params.fromAmount,
    });
    if (error) throw new Error(error.message);
    await loadWalletData();
    addNotification('success', 'Swap Executed', `Swapped ${params.fromAmount} ${params.fromSymbol} → ${params.toSymbol}.`);
    return data as string;
  };

  const executeFiatOfframp = async (params: {
    tokenSymbol: string; cryptoAmount: number; fiatAmount: number; payoutMethod: string;
  }): Promise<string> => {
    const acc = requireAccount();
    const { data, error } = await supabase.rpc('fiat_offramp', {
      p_account:  acc.id,
      p_symbol:   params.tokenSymbol,
      p_amount:   params.cryptoAmount,
      p_fiat_usd: params.fiatAmount,
      p_payout:   params.payoutMethod,
      p_network:  activeNetwork,
    });
    if (error) throw new Error(error.message);
    await loadWalletData();
    addNotification('success', 'Withdrawal Initiated', `Funds are being sent to ${params.payoutMethod}.`);
    return data as string;
  };

  // Signs out and clears this device's preferences. Server-side data is kept.
  const resetAllData = () => {
    Object.values(SK).forEach(k => { try { localStorage.removeItem(k); } catch { /* ignore */ } });
    setActiveAccountId(null);
    lockVault();
  };

  const setActiveNetwork = (n: NetworkId) => setActiveNetworkState(n);
  const setCurrency      = (c: Currency)  => setCurrencyState(c);

  return (
    <WalletContext.Provider value={{
      vaultStatus, userEmail: session?.user.email ?? null,
      accounts, activeAccount, activeNetwork, currency,
      tokens, nfts, transactions, mnemonic, autoLockMinutes,
      isExtensionView, isLivePriceLoading, lastPriceUpdate, notifications,
      setCurrency, setActiveNetwork, setIsExtensionView, setAutoLockMinutes,
      signIn, signUp, createWallet, importWallet, lockVault,
      switchAccount, createAdditionalAccount,
      sendCrypto, swapTokens, executeFiatOfframp,
      refreshLivePrices, resetAllData, dismissNotification,
    }}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet must be used within WalletProvider');
  return ctx;
};
