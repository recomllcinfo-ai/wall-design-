import React from 'react';
import {
  ArrowUpRight,
  ArrowDownLeft,
  ArrowLeftRight,
  CreditCard,
  CheckCircle2,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { useWallet } from '../../context/WalletContext';
import { NETWORKS } from '../../services/mockBlockchain';
import { formatFiat, formatCryptoAmount } from '../../services/cryptoPrices';

export const ActivityList: React.FC = () => {
  const { transactions, currency, activeNetwork } = useWallet();

  const currentNetwork = NETWORKS[activeNetwork] || NETWORKS.ethereum;

  const getTxIcon = (type: string) => {
    switch (type) {
      case 'send':
        return <ArrowUpRight className="w-4 h-4 text-rose-400" />;
      case 'receive':
        return <ArrowDownLeft className="w-4 h-4 text-emerald-400" />;
      case 'swap':
        return <ArrowLeftRight className="w-4 h-4 text-purple-400" />;
      case 'offramp':
        return <CreditCard className="w-4 h-4 text-amber-400" />;
      default:
        return <ArrowUpRight className="w-4 h-4 text-indigo-400" />;
    }
  };

  const formatTimestamp = (ts: number) => {
    const diffMs = Date.now() - ts;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const truncate = (str: string) => {
    if (!str) return '';
    return `${str.slice(0, 6)}...${str.slice(-4)}`;
  };

  return (
    <div className="space-y-3">
      {transactions.length === 0 ? (
        <div className="p-8 text-center bg-slate-900/50 rounded-2xl border border-slate-800 space-y-2">
          <Clock className="w-8 h-8 text-slate-600 mx-auto" />
          <p className="text-sm font-semibold text-slate-300">No Activity Yet</p>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            Your on-chain transfers, swaps, and withdrawals will appear here in real-time.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {transactions.map((tx) => {
            const isSend = tx.type === 'send' || tx.type === 'offramp';
            const explorerUrl = `${currentNetwork.explorerUrl}/tx/${tx.hash}`;

            return (
              <div
                key={tx.id}
                className="flex items-center justify-between p-3.5 bg-slate-900/60 border border-slate-800 rounded-2xl transition-all hover:border-slate-700"
              >
                {/* Left: Icon + Type + Time / Address */}
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
                      tx.type === 'send'
                        ? 'bg-rose-500/10 border-rose-500/20'
                        : tx.type === 'receive'
                        ? 'bg-emerald-500/10 border-emerald-500/20'
                        : tx.type === 'swap'
                        ? 'bg-purple-500/10 border-purple-500/20'
                        : 'bg-amber-500/10 border-amber-500/20'
                    }`}
                  >
                    {getTxIcon(tx.type)}
                  </div>

                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-sm text-white capitalize">
                        {tx.type === 'send' ? 'Sent' : tx.type === 'receive' ? 'Received' : tx.type === 'swap' ? 'Swapped' : 'Withdrawal'}
                      </span>
                      {tx.status === 'pending' ? (
                        <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px] font-medium animate-pulse">
                          <Clock className="w-2.5 h-2.5" />
                          <span>Pending</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 text-[10px] font-medium">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          <span>Confirmed</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-2 text-xs text-slate-400 mt-0.5">
                      <span>{formatTimestamp(tx.timestamp)}</span>
                      <span>•</span>
                      <span className="font-mono text-slate-400">
                        {tx.toResolvedName
                          ? tx.toResolvedName
                          : isSend
                          ? `To: ${truncate(tx.to)}`
                          : `From: ${truncate(tx.from)}`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Amount & Explorer Link */}
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <div
                      className={`font-bold text-sm font-mono ${
                        tx.type === 'receive' ? 'text-emerald-400' : 'text-slate-100'
                      }`}
                    >
                      {tx.type === 'receive' ? '+' : '-'}
                      {formatCryptoAmount(tx.amount)} {tx.tokenSymbol}
                    </div>
                    <div className="text-xs text-slate-400 font-medium">
                      {formatFiat(tx.fiatValueUsd, currency)}
                    </div>
                  </div>

                  <a
                    href={explorerUrl}
                    target="_blank"
                    rel="noreferrer"
                    title="View on Block Explorer"
                    className="p-1.5 text-slate-500 hover:text-indigo-400 hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
