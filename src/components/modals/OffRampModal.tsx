import React, { useState } from 'react';
import {
  X,
  CreditCard,
  Building2,
  CheckCircle2,
  ShieldCheck,
  ChevronDown,
  ArrowRight,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useWallet } from '../../context/WalletContext';
import { formatFiat, formatCryptoAmount } from '../../services/cryptoPrices';
import type { Token } from '../../types/wallet';

interface OffRampModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OffRampModal: React.FC<OffRampModalProps> = ({ isOpen, onClose }) => {
  const { tokens, currency, executeFiatOfframp } = useWallet();

  // Store only the chosen symbol; the token itself is read live from context so
  // the balance shown and validated is always current.
  const [selectedSymbol, setSelectedSymbol] = useState(tokens[0]?.symbol);
  const selectedToken: Token = tokens.find((t) => t.symbol === selectedSymbol) ?? tokens[0];
  const [cryptoAmount, setCryptoAmount] = useState('');
  const [payoutMethod, setPayoutMethod] = useState<'bank' | 'card'>('bank');
  const [bankAccount] = useState('Example Bank');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const numCrypto = parseFloat(cryptoAmount) || 0;
  const fiatEstimate = numCrypto * (selectedToken.priceUsd || 0);
  const offrampFeeUsd = fiatEstimate * 0.01; // 1% provider fee
  const netPayoutUsd = Math.max(0, fiatEstimate - offrampFeeUsd);

  const handleExecuteOfframp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (numCrypto <= 0) {
      setError('Please enter a valid withdrawal amount');
      return;
    }

    if (numCrypto > selectedToken.balance) {
      setError(`Insufficient ${selectedToken.symbol} balance`);
      return;
    }

    setIsProcessing(true);
    try {
      await executeFiatOfframp({
        tokenSymbol: selectedToken.symbol,
        cryptoAmount: numCrypto,
        fiatAmount: netPayoutUsd,
        payoutMethod: payoutMethod === 'bank' ? bankAccount : 'Example Card',
      });

      setIsSuccess(true);
      confetti({
        particleCount: 110,
        spread: 75,
        origin: { y: 0.6 },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Off-ramp transfer failed. Please retry.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setCryptoAmount('');
    setError('');
    setIsSuccess(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CreditCard className="w-5 h-5 text-emerald-400" />
            <h3 className="text-lg font-bold text-white">Cash Out to Bank / Card</h3>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSuccess ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center text-emerald-400 mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-white">Withdrawal Complete</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                <strong>{formatFiat(netPayoutUsd, currency)}</strong> has been sent to your{' '}
                {payoutMethod === 'bank' ? 'bank account' : 'debit card'}.
              </p>
            </div>
            <button
              onClick={handleClose}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs transition-all"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleExecuteOfframp} className="space-y-3.5">
            {/* Asset to Sell */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-slate-400">
                <label className="font-semibold text-slate-300">Crypto to Sell</label>
                <span>
                  Available: {formatCryptoAmount(selectedToken.balance)} {selectedToken.symbol}
                </span>
              </div>

              <div className="relative">
                <select
                  value={selectedToken.symbol}
                  onChange={(e) => {
                    setSelectedSymbol(e.target.value);
                  }}
                  className="w-full pl-11 pr-10 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-white font-medium text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                >
                  {tokens.map((token) => (
                    <option key={token.id} value={token.symbol}>
                      {token.symbol} - {token.name}
                    </option>
                  ))}
                </select>
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                  <img
                    src={selectedToken.icon}
                    alt={selectedToken.symbol}
                    className="w-5 h-5 rounded-full"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                </div>
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* Amount */}
            <div className="space-y-1.5">
              <div className="relative flex items-center">
                <input
                  type="number"
                  step="any"
                  required
                  placeholder="0.00"
                  value={cryptoAmount}
                  onChange={(e) => {
                    setCryptoAmount(e.target.value);
                    if (error) setError('');
                  }}
                  className="w-full pl-4 pr-24 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-white text-lg font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <div className="absolute right-2.5 flex items-center space-x-1.5">
                  <button
                    type="button"
                    onClick={() => setCryptoAmount(selectedToken.balance.toString())}
                    className="px-2 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-xs font-bold rounded-lg transition-colors"
                  >
                    MAX
                  </button>
                  <span className="text-xs font-semibold text-slate-400">
                    {selectedToken.symbol}
                  </span>
                </div>
              </div>
            </div>

            {/* Payout Method */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Payout Destination</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPayoutMethod('bank')}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    payoutMethod === 'bank'
                      ? 'bg-emerald-600/15 border-emerald-500/40 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <Building2 className="w-4 h-4 text-emerald-400 mb-1" />
                  <div className="text-xs font-semibold">Bank Account</div>
                  <div className="text-[10px] text-slate-400">ACH / SEPA (0% fee)</div>
                </button>

                <button
                  type="button"
                  onClick={() => setPayoutMethod('card')}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    payoutMethod === 'card'
                      ? 'bg-emerald-600/15 border-emerald-500/40 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <CreditCard className="w-4 h-4 text-emerald-400 mb-1" />
                  <div className="text-xs font-semibold">Debit Card</div>
                  <div className="text-[10px] text-slate-400">Instant Visa/MC</div>
                </button>
              </div>
            </div>

            {/* Fee & Net Receipt */}
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl text-xs space-y-1.5">
              <div className="flex justify-between text-slate-400">
                <span>Gross Value</span>
                <span>{formatFiat(fiatEstimate, currency)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Off-ramp Provider Fee (1%)</span>
                <span>-{formatFiat(offrampFeeUsd, currency)}</span>
              </div>
              <div className="flex justify-between font-bold text-white border-t border-slate-800/80 pt-1.5">
                <span>You Receive</span>
                <span className="text-emerald-400">{formatFiat(netPayoutUsd, currency)}</span>
              </div>
            </div>

            <div className="flex items-center space-x-1.5 text-[11px] text-slate-500 justify-center">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Powered by MoonPay & Stripe Crypto Offramp</span>
            </div>

            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isProcessing}
              className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white font-semibold rounded-2xl shadow-xl shadow-emerald-600/25 flex items-center justify-center space-x-2 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {isProcessing ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Withdraw {formatFiat(netPayoutUsd, currency)}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
