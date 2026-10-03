import React, { useState } from 'react';
import { Search, TrendingUp, TrendingDown, ArrowUpRight, Wallet } from 'lucide-react';
import { useWallet } from '../../context/WalletContext';
import { formatFiat, formatCryptoAmount } from '../../services/cryptoPrices';
import type { Token } from '../../types/wallet';

interface TokenListProps {
  onSelectTokenToSend: (token: Token) => void;
  onOpenReceive: () => void;
}

export const TokenList: React.FC<TokenListProps> = ({ onSelectTokenToSend, onOpenReceive }) => {
  const { tokens, currency } = useWallet();
  const [searchQuery, setSearchQuery] = useState('');
  const [showZero, setShowZero] = useState(true);

  const filtered = tokens.filter(t => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.symbol.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBalance = showZero || t.balance > 0;
    return matchesSearch && matchesBalance;
  });

  const hasAnyBalance = tokens.some(t => t.balance > 0);

  // Render SVG sparkline
  const renderSparkline = (points?: number[], isPositive?: boolean) => {
    if (!points || points.length < 2) return null;
    const min = Math.min(...points), max = Math.max(...points);
    const range = max - min || 1;
    const W = 60, H = 24;
    const d = points.map((v, i) => {
      const x = (i / (points.length - 1)) * W;
      const y = H - ((v - min) / range) * (H - 4) - 2;
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    }).join(' ');
    return (
      <svg width={W} height={H} className="overflow-visible">
        <path d={d} fill="none" stroke={isPositive ? '#10b981' : '#f43f5e'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  };

  return (
    <div className="space-y-3">
      {/* Search + Filter */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          <input
            type="text"
            placeholder="Search assets..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-2 bg-slate-900/90 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        <div className="flex bg-slate-900 p-0.5 border border-slate-800 rounded-xl text-[11px] font-semibold shrink-0">
          <button
            onClick={() => setShowZero(true)}
            className={`px-2.5 py-1 rounded-lg transition-all ${showZero ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
          >
            All ({tokens.length})
          </button>
          <button
            onClick={() => setShowZero(false)}
            className={`px-2.5 py-1 rounded-lg transition-all ${!showZero ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Owned
          </button>
        </div>
      </div>

      {/* Empty portfolio call-to-action */}
      {!hasAnyBalance && !showZero && (
        <div className="py-10 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto">
            <Wallet className="w-7 h-7 text-indigo-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">No assets yet</p>
            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
              Your wallet is empty. Receive crypto to your address to get started.
            </p>
          </div>
          <button
            onClick={onOpenReceive}
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-all"
          >
            <ArrowUpRight className="w-3.5 h-3.5 rotate-180" />
            <span>Receive Crypto</span>
          </button>
        </div>
      )}

      {/* Token rows */}
      <div className="space-y-1.5">
        {filtered.map(token => {
          const isPositive = token.change24h >= 0;
          const fiatBalance = token.balance * token.priceUsd;
          const hasBalance = token.balance > 0;

          return (
            <div
              key={token.id}
              onClick={() => hasBalance && onSelectTokenToSend(token)}
              className={`group flex items-center justify-between p-3.5 bg-slate-900/60 border rounded-2xl transition-all duration-150
                ${hasBalance
                  ? 'border-slate-800/80 hover:bg-slate-800/80 hover:border-indigo-500/30 cursor-pointer active:scale-[0.99]'
                  : 'border-slate-900/80 opacity-70'
                }`}
            >
              {/* Icon + Name */}
              <div className="flex items-center space-x-3">
                <img
                  src={token.icon}
                  alt={token.symbol}
                  onError={e => { (e.target as HTMLImageElement).src = `https://placehold.co/36x36/1e2030/6366f1?text=${token.symbol[0]}`; }}
                  className="w-9 h-9 rounded-full bg-slate-800 p-0.5 border border-slate-700/50 object-contain"
                />
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="font-bold text-sm text-white group-hover:text-indigo-300 transition-colors">
                      {token.symbol}
                    </span>
                    <span className="text-[10px] text-slate-500 bg-slate-800/80 px-1.5 py-0.5 rounded font-mono hidden sm:inline">
                      {token.networkId}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1.5 mt-0.5">
                    <span className="text-xs text-slate-400">
                      {token.priceUsd > 0 ? formatFiat(token.priceUsd, currency) : '—'}
                    </span>
                    {token.priceUsd > 0 && (
                      <span className={`text-[10px] font-semibold flex items-center ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isPositive ? <TrendingUp className="w-2.5 h-2.5 mr-0.5" /> : <TrendingDown className="w-2.5 h-2.5 mr-0.5" />}
                        {isPositive ? '+' : ''}{token.change24h.toFixed(2)}%
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Sparkline */}
              <div className="hidden sm:block mx-4">
                {renderSparkline(token.sparkline, isPositive)}
              </div>

              {/* Balance */}
              <div className="text-right">
                {hasBalance ? (
                  <>
                    <div className="font-bold text-sm text-slate-100 font-mono">
                      {formatCryptoAmount(token.balance)} <span className="text-slate-400 font-normal">{token.symbol}</span>
                    </div>
                    <div className="text-xs text-slate-400">{formatFiat(fiatBalance, currency)}</div>
                  </>
                ) : (
                  <div className="text-xs text-slate-600 font-mono">0.00</div>
                )}
              </div>

              {/* Hover send arrow */}
              {hasBalance && (
                <ArrowUpRight className="w-4 h-4 text-indigo-400 ml-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
