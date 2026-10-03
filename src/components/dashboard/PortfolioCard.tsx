import React, { useState } from 'react';
import {
  ArrowUpRight,
  ArrowDownLeft,
  ArrowLeftRight,
  CreditCard,
  TrendingUp,
  Eye,
  EyeOff,
  Activity,
} from 'lucide-react';
import { useWallet } from '../../context/WalletContext';
import { formatFiat } from '../../services/cryptoPrices';

interface PortfolioCardProps {
  onOpenSend: () => void;
  onOpenReceive: () => void;
  onOpenSwap: () => void;
  onOpenOfframp: () => void;
}

export const PortfolioCard: React.FC<PortfolioCardProps> = ({
  onOpenSend,
  onOpenReceive,
  onOpenSwap,
  onOpenOfframp,
}) => {
  const { tokens, currency, isLivePriceLoading } = useWallet();
  const [hideBalance, setHideBalance] = useState(false);

  // Compute total USD value across all tokens
  const totalUsd = tokens.reduce((sum, t) => sum + t.balance * t.priceUsd, 0);

  // Compute weighted 24h change %
  const totalChangeUsd = tokens.reduce((sum, t) => {
    const value = t.balance * t.priceUsd;
    const oldPrice = t.priceUsd / (1 + t.change24h / 100);
    const oldValue = t.balance * oldPrice;
    return sum + (value - oldValue);
  }, 0);

  const weightedChangePercent = totalUsd > 0 ? (totalChangeUsd / (totalUsd - totalChangeUsd)) * 100 : 0;
  const isPositive = weightedChangePercent >= 0;

  return (
    <div className="relative overflow-hidden rounded-3xl p-6 bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/20 shadow-2xl">
      {/* Background glow effects */}
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-48 h-48 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top row: Label & Live Feed Indicator */}
      <div className="relative z-10 flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Total Net Worth
          </span>
          <button
            onClick={() => setHideBalance(!hideBalance)}
            className="text-slate-500 hover:text-slate-300 transition-colors p-1"
            title={hideBalance ? 'Show balance' : 'Hide balance'}
          >
            {hideBalance ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
        </div>

        <div className="flex items-center space-x-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
          <span className={`w-1.5 h-1.5 rounded-full bg-emerald-400 ${isLivePriceLoading ? 'animate-ping' : ''}`} />
          <span className="text-[10px] font-medium text-emerald-300 flex items-center space-x-1">
            <Activity className="w-3 h-3 inline mr-0.5" />
            Live Market Feed
          </span>
        </div>
      </div>

      {/* Big Balance Number */}
      <div className="relative z-10 mb-4">
        {hideBalance ? (
          <div className="text-3xl sm:text-4xl font-extrabold text-slate-300 tracking-wider">
            $•••••••••
          </div>
        ) : (
          <div className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            {formatFiat(totalUsd, currency)}
          </div>
        )}

        {/* 24h PnL badge */}
        {!hideBalance && (
          <div className="flex items-center space-x-2 mt-2">
            <div
              className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-lg text-xs font-semibold ${
                isPositive
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
              }`}
            >
              <TrendingUp
                className={`w-3.5 h-3.5 ${!isPositive ? 'rotate-180 text-rose-400' : ''}`}
              />
              <span>
                {isPositive ? '+' : ''}
                {weightedChangePercent.toFixed(2)}%
              </span>
            </div>
            <span className="text-xs text-slate-400">
              ({isPositive ? '+' : ''}
              {formatFiat(totalChangeUsd, currency)} today)
            </span>
          </div>
        )}
      </div>

      {/* 4 Action Buttons */}
      <div className="relative z-10 grid grid-cols-4 gap-2 sm:gap-3 pt-2">
        {/* Send / Withdraw */}
        <button
          onClick={onOpenSend}
          className="flex flex-col items-center justify-center p-3 bg-indigo-600/90 hover:bg-indigo-500 text-white rounded-2xl shadow-lg shadow-indigo-600/25 transition-all active:scale-95 group"
        >
          <div className="p-2 bg-white/15 rounded-xl mb-1.5 group-hover:-translate-y-0.5 transition-transform">
            <ArrowUpRight className="w-5 h-5 text-white" />
          </div>
          <span className="text-xs font-semibold">Send</span>
        </button>

        {/* Receive */}
        <button
          onClick={onOpenReceive}
          className="flex flex-col items-center justify-center p-3 bg-slate-800/90 hover:bg-slate-750 text-slate-200 border border-slate-700/60 rounded-2xl transition-all active:scale-95 group"
        >
          <div className="p-2 bg-slate-700/60 rounded-xl mb-1.5 group-hover:-translate-y-0.5 transition-transform">
            <ArrowDownLeft className="w-5 h-5 text-slate-300" />
          </div>
          <span className="text-xs font-semibold">Receive</span>
        </button>

        {/* Swap */}
        <button
          onClick={onOpenSwap}
          className="flex flex-col items-center justify-center p-3 bg-slate-800/90 hover:bg-slate-750 text-slate-200 border border-slate-700/60 rounded-2xl transition-all active:scale-95 group"
        >
          <div className="p-2 bg-slate-700/60 rounded-xl mb-1.5 group-hover:-translate-y-0.5 transition-transform">
            <ArrowLeftRight className="w-5 h-5 text-purple-400" />
          </div>
          <span className="text-xs font-semibold">Swap</span>
        </button>

        {/* Cash Out / Off-ramp */}
        <button
          onClick={onOpenOfframp}
          className="flex flex-col items-center justify-center p-3 bg-slate-800/90 hover:bg-slate-750 text-slate-200 border border-slate-700/60 rounded-2xl transition-all active:scale-95 group"
        >
          <div className="p-2 bg-slate-700/60 rounded-xl mb-1.5 group-hover:-translate-y-0.5 transition-transform">
            <CreditCard className="w-5 h-5 text-emerald-400" />
          </div>
          <span className="text-xs font-semibold">Cash Out</span>
        </button>
      </div>
    </div>
  );
};
