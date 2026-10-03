import React, { useState } from 'react';
import {
  X,
  ArrowDownUp,
  Settings2,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useWallet } from '../../context/WalletContext';
import { formatFiat, formatCryptoAmount } from '../../services/cryptoPrices';
import type { Token } from '../../types/wallet';

interface SwapModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SwapModal: React.FC<SwapModalProps> = ({ isOpen, onClose }) => {
  const { tokens, currency, swapTokens } = useWallet();

  // Store only the chosen symbols; tokens are read live from context so
  // balances/prices stay current and price refreshes don't reset the selection.
  const [fromSymbol, setFromSymbol] = useState(tokens[0]?.symbol);
  const [toSymbol, setToSymbol] = useState((tokens[1] ?? tokens[0])?.symbol);
  const fromToken: Token = tokens.find((t) => t.symbol === fromSymbol) ?? tokens[0];
  const toToken: Token = tokens.find((t) => t.symbol === toSymbol) ?? tokens[1] ?? tokens[0];
  const [fromAmount, setFromAmount] = useState('');
  const [slippage, setSlippage] = useState<number>(0.5);
  const [showSettings, setShowSettings] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);
  const [error, setError] = useState('');
  const [txSuccess, setTxSuccess] = useState(false);

  if (!isOpen) return null;

  const numFromAmount = parseFloat(fromAmount) || 0;
  const exchangeRate =
    toToken.priceUsd > 0 ? (fromToken.priceUsd || 1) / toToken.priceUsd : 1;
  const estimatedToAmount = numFromAmount * exchangeRate;

  const handleFlipTokens = () => {
    setFromSymbol(toToken.symbol);
    setToSymbol(fromToken.symbol);
    setFromAmount('');
  };

  const handleExecuteSwap = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (numFromAmount <= 0) {
      setError('Please enter a valid swap amount');
      return;
    }

    if (numFromAmount > fromToken.balance) {
      setError(`Insufficient ${fromToken.symbol} balance`);
      return;
    }

    if (fromToken.id === toToken.id) {
      setError('Cannot swap between the same asset');
      return;
    }

    setIsSwapping(true);
    try {
      await swapTokens({
        fromSymbol: fromToken.symbol,
        toSymbol: toToken.symbol,
        fromAmount: numFromAmount,
        toAmount: estimatedToAmount,
        gasFeeUsd: 1.45,
      });

      setTxSuccess(true);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Swap execution failed. Please retry.');
    } finally {
      setIsSwapping(false);
    }
  };

  const handleCloseModal = () => {
    setFromAmount('');
    setError('');
    setTxSuccess(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <h3 className="text-lg font-bold text-white">Swap Assets</h3>
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
              title="Slippage Settings"
            >
              <Settings2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleCloseModal}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Slippage Settings Drawer */}
        {showSettings && (
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl space-y-2 text-xs">
            <div className="flex justify-between font-semibold text-slate-300">
              <span>Slippage Tolerance</span>
              <span className="text-purple-400 font-mono">{slippage}%</span>
            </div>
            <div className="flex space-x-2">
              {[0.1, 0.5, 1.0].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setSlippage(val)}
                  className={`flex-1 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                    slippage === val
                      ? 'bg-purple-600/20 border-purple-500/40 text-purple-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {val}%
                </button>
              ))}
            </div>
          </div>
        )}

        {txSuccess ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center text-emerald-400 mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-white">Swap Completed!</h4>
              <p className="text-xs text-slate-400 mt-1">
                You exchanged {formatCryptoAmount(numFromAmount)} {fromToken.symbol} for{' '}
                {formatCryptoAmount(estimatedToAmount)} {toToken.symbol}.
              </p>
            </div>
            <button
              onClick={handleCloseModal}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs transition-all"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleExecuteSwap} className="space-y-3">
            {/* FROM Card */}
            <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
              <div className="flex justify-between text-xs text-slate-400">
                <span>You Pay</span>
                <span>
                  Balance: {formatCryptoAmount(fromToken.balance)} {fromToken.symbol}
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  step="any"
                  required
                  placeholder="0.00"
                  value={fromAmount}
                  onChange={(e) => {
                    setFromAmount(e.target.value);
                    if (error) setError('');
                  }}
                  className="w-full bg-transparent text-xl font-bold text-white focus:outline-none placeholder-slate-600"
                />

                <select
                  value={fromToken.symbol}
                  onChange={(e) => {
                    setFromSymbol(e.target.value);
                  }}
                  className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold text-white cursor-pointer focus:outline-none"
                >
                  {tokens.map((t) => (
                    <option key={t.id} value={t.symbol}>
                      {t.symbol}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-between items-center text-xs text-slate-500">
                <span>≈ {formatFiat(numFromAmount * (fromToken.priceUsd || 0), currency)}</span>
                <button
                  type="button"
                  onClick={() => setFromAmount(fromToken.balance.toString())}
                  className="text-purple-400 hover:text-purple-300 font-bold"
                >
                  MAX
                </button>
              </div>
            </div>

            {/* Flip Button */}
            <div className="flex justify-center -my-2 relative z-10">
              <button
                type="button"
                onClick={handleFlipTokens}
                className="p-2 bg-slate-850 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 rounded-full shadow-lg transition-transform hover:rotate-180 duration-300"
              >
                <ArrowDownUp className="w-4 h-4" />
              </button>
            </div>

            {/* TO Card */}
            <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
              <div className="flex justify-between text-xs text-slate-400">
                <span>You Receive (Estimated)</span>
                <span>
                  Balance: {formatCryptoAmount(toToken.balance)} {toToken.symbol}
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  readOnly
                  placeholder="0.00"
                  value={estimatedToAmount > 0 ? formatCryptoAmount(estimatedToAmount) : ''}
                  className="w-full bg-transparent text-xl font-bold text-white focus:outline-none placeholder-slate-600"
                />

                <select
                  value={toToken.symbol}
                  onChange={(e) => {
                    setToSymbol(e.target.value);
                  }}
                  className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold text-white cursor-pointer focus:outline-none"
                >
                  {tokens.map((t) => (
                    <option key={t.id} value={t.symbol}>
                      {t.symbol}
                    </option>
                  ))}
                </select>
              </div>

              <div className="text-xs text-slate-500">
                ≈ {formatFiat(estimatedToAmount * (toToken.priceUsd || 0), currency)}
              </div>
            </div>

            {/* Route & Fee Breakdown */}
            <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-2xl text-[11px] space-y-1.5 text-slate-400 font-mono">
              <div className="flex justify-between">
                <span>Rate</span>
                <span>
                  1 {fromToken.symbol} ≈ {exchangeRate.toFixed(4)} {toToken.symbol}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Best Route</span>
                <span className="text-indigo-300">Uniswap v3 + 1inch (0.01% impact)</span>
              </div>
              <div className="flex justify-between">
                <span>Network Fee</span>
                <span>~{formatFiat(1.45, currency)}</span>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSwapping}
              className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 text-white font-semibold rounded-2xl shadow-xl shadow-purple-600/25 flex items-center justify-center space-x-2 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {isSwapping ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <span>Swap Tokens</span>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
