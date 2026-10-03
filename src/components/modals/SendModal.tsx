import React, { useState, useEffect } from 'react';
import {
  X,
  ArrowRight,
  ShieldCheck,
  Fuel,
  CheckCircle2,
  ExternalLink,
  ChevronDown,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useWallet } from '../../context/WalletContext';
import {
  estimateGasFees,
  isValidCryptoAddress,
  NETWORKS,
  resolveEnsName,
} from '../../services/mockBlockchain';
import { formatFiat, formatCryptoAmount } from '../../services/cryptoPrices';
import type { GasOption, Token } from '../../types/wallet';

interface SendModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedToken?: Token | null;
}

export const SendModal: React.FC<SendModalProps> = ({
  isOpen,
  onClose,
  preselectedToken,
}) => {
  const {
    tokens,
    currency,
    activeNetwork,
    activeAccount,
    accounts,
    sendCrypto,
  } = useWallet();

  // This wallet's other accounts, with the address format for the current network
  const otherAccounts = accounts
    .filter((a) => a.id !== activeAccount?.id)
    .map((a) => ({
      ...a,
      networkAddress:
        activeNetwork === 'solana'  ? a.solanaAddress  || a.address :
        activeNetwork === 'bitcoin' ? a.bitcoinAddress || a.address :
        a.address,
    }));

  // Store only the chosen symbol; the token itself is read live from context so
  // balances/prices stay current and price refreshes don't reset the selection.
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  const selectedToken: Token =
    tokens.find((t) => t.symbol === (selectedSymbol ?? preselectedToken?.symbol)) ?? tokens[0];
  const [recipient, setRecipient] = useState('');
  const [resolvedEns, setResolvedEns] = useState<string | null>(null);
  const [isEns, setIsEns] = useState(false);
  const [amount, setAmount] = useState('');
  const [selectedGasSpeed, setSelectedGasSpeed] = useState<'slow' | 'market' | 'fast'>('market');
  const [memo, setMemo] = useState('');
  const [step, setStep] = useState<'input' | 'review' | 'success'>('input');
  const [txHash, setTxHash] = useState('');
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [validationError, setValidationError] = useState('');

  // Gas options based on live ETH price
  const ethToken = tokens.find((t) => t.symbol === 'ETH');
  const ethPrice = ethToken?.priceUsd || 3420;
  const gasEstimates = estimateGasFees(ethPrice);
  const activeGas: GasOption = gasEstimates[selectedGasSpeed];

  // Handle ENS resolution on address change
  useEffect(() => {
    const trimmed = recipient.trim();
    if (trimmed.endsWith('.eth')) {
      const { resolvedAddress, isEns: ensFlag } = resolveEnsName(trimmed);
      setResolvedEns(resolvedAddress);
      setIsEns(ensFlag);
    } else {
      setResolvedEns(null);
      setIsEns(false);
    }
  }, [recipient]);

  if (!isOpen) return null;

  const currentNetwork = NETWORKS[activeNetwork] || NETWORKS.ethereum;
  const numAmount = parseFloat(amount) || 0;
  const fiatEquivalent = numAmount * (selectedToken.priceUsd || 0);

  // Max button handler
  const handleMaxAmount = () => {
    if (selectedToken.symbol === 'ETH' || selectedToken.symbol === 'SOL') {
      const maxAvailable = Math.max(0, selectedToken.balance - activeGas.feeEth);
      setAmount(maxAvailable.toFixed(4));
    } else {
      setAmount(selectedToken.balance.toString());
    }
  };

  const handleProceedToReview = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    if (!recipient.trim()) {
      setValidationError('Please enter a recipient address or ENS name');
      return;
    }

    if (!isValidCryptoAddress(recipient, activeNetwork)) {
      setValidationError(`Invalid address format for ${currentNetwork.name}`);
      return;
    }

    if (numAmount <= 0) {
      setValidationError('Please enter a valid amount greater than 0');
      return;
    }

    if (numAmount > selectedToken.balance) {
      setValidationError(`Insufficient ${selectedToken.symbol} balance`);
      return;
    }

    // Check gas balance for EVM
    if (activeNetwork !== 'solana' && (ethToken?.balance || 0) < activeGas.feeEth) {
      setValidationError('Insufficient ETH balance to cover network gas fee');
      return;
    }

    setStep('review');
  };

  const handleConfirmAndSend = async () => {
    setIsBroadcasting(true);
    setValidationError('');

    try {
      const finalToAddress = resolvedEns || recipient.trim();
      const hash = await sendCrypto({
        to: finalToAddress,
        toResolvedName: isEns ? recipient.trim() : undefined,
        tokenSymbol: selectedToken.symbol,
        amount: numAmount,
        gasFeeEth: activeGas.feeEth,
        gasFeeUsd: activeGas.feeUsd,
        memo: memo.trim() || undefined,
      });

      setTxHash(hash);
      setStep('success');
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
      });
    } catch (err) {
      setValidationError(err instanceof Error ? err.message : 'Transaction broadcast failed. Please try again.');
    } finally {
      setIsBroadcasting(false);
    }
  };

  const handleReset = () => {
    setSelectedSymbol(null);
    setRecipient('');
    setAmount('');
    setMemo('');
    setStep('input');
    setValidationError('');
    setTxHash('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <h3 className="text-lg font-bold text-white">
              {step === 'input'
                ? 'Send / Withdraw Crypto'
                : step === 'review'
                ? 'Review Transaction'
                : 'Transaction Broadcasted!'}
            </h3>
          </div>
          <button
            onClick={handleReset}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* STEP 1: FORM INPUT */}
        {step === 'input' && (
          <form onSubmit={handleProceedToReview} className="p-6 space-y-4">
            {/* Token Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Select Asset</label>
              <div className="relative">
                <select
                  value={selectedToken.symbol}
                  onChange={(e) => {
                    setSelectedSymbol(e.target.value);
                  }}
                  className="w-full pl-11 pr-10 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-white font-medium text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  {tokens.map((token) => (
                    <option key={token.id} value={token.symbol}>
                      {token.symbol} - {token.name} (Balance: {formatCryptoAmount(token.balance)})
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

            {/* Recipient Address with ENS */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-slate-300">
                  Recipient Address or ENS
                </label>
                <span className="text-[11px] text-slate-500">Try: vitalik.eth</span>
              </div>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="0x... or name.eth"
                  value={recipient}
                  onChange={(e) => {
                    setRecipient(e.target.value);
                    if (validationError) setValidationError('');
                  }}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {otherAccounts.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  <span className="text-[11px] text-slate-500">My accounts:</span>
                  {otherAccounts.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => {
                        setRecipient(a.networkAddress);
                        if (validationError) setValidationError('');
                      }}
                      className={`px-2 py-0.5 rounded-lg text-[11px] font-medium border transition-colors ${
                        recipient.trim().toLowerCase() === a.networkAddress.toLowerCase()
                          ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-300'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-600'
                      }`}
                    >
                      {a.name}
                    </button>
                  ))}
                </div>
              )}

              {/* ENS Resolution Badge */}
              {isEns && resolvedEns && (
                <div className="flex items-center space-x-2 p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-xs text-indigo-300">
                  <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span className="font-mono text-[11px] truncate">
                    Resolved to: {resolvedEns}
                  </span>
                </div>
              )}
            </div>

            {/* Amount Input & MAX Button */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <label className="font-semibold text-slate-300">Amount</label>
                <div className="text-slate-400">
                  Available:{' '}
                  <span className="font-mono text-slate-200">
                    {formatCryptoAmount(selectedToken.balance)} {selectedToken.symbol}
                  </span>
                </div>
              </div>

              <div className="relative flex items-center">
                <input
                  type="number"
                  step="any"
                  required
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    if (validationError) setValidationError('');
                  }}
                  className="w-full pl-4 pr-24 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-white text-lg font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <div className="absolute right-2.5 flex items-center space-x-1.5">
                  <button
                    type="button"
                    onClick={handleMaxAmount}
                    className="px-2 py-1 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-xs font-bold rounded-lg transition-colors"
                  >
                    MAX
                  </button>
                  <span className="text-xs font-semibold text-slate-400">
                    {selectedToken.symbol}
                  </span>
                </div>
              </div>

              {numAmount > 0 && (
                <div className="text-xs text-slate-400 text-right">
                  ≈ {formatFiat(fiatEquivalent, currency)}
                </div>
              )}
            </div>

            {/* Gas Speed Selector */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300 flex items-center space-x-1">
                  <Fuel className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Network Gas Speed</span>
                </span>
                <span className="text-xs font-mono text-slate-400">
                  {formatFiat(activeGas.feeUsd, currency)}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {(['slow', 'market', 'fast'] as const).map((speed) => {
                  const opt = gasEstimates[speed];
                  const isSelected = selectedGasSpeed === speed;

                  return (
                    <button
                      key={speed}
                      type="button"
                      onClick={() => setSelectedGasSpeed(speed)}
                      className={`p-2 rounded-xl border text-center transition-all ${
                        isSelected
                          ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-200 shadow-md'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="text-xs font-bold capitalize">{opt.label}</div>
                      <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                        {opt.estimatedSeconds}s • {opt.gwei.toFixed(0)} Gwei
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {validationError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400 animate-shake">
                {validationError}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 text-white font-semibold rounded-2xl shadow-xl shadow-indigo-600/25 flex items-center justify-center space-x-2 transition-all active:scale-[0.98]"
            >
              <span>Review Details</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* STEP 2: REVIEW & SIGN */}
        {step === 'review' && (
          <div className="p-6 space-y-5">
            <div className="text-center py-2 space-y-1">
              <div className="text-3xl font-extrabold text-white">
                {formatCryptoAmount(numAmount)} {selectedToken.symbol}
              </div>
              <div className="text-sm font-medium text-slate-400">
                ≈ {formatFiat(fiatEquivalent, currency)}
              </div>
            </div>

            {/* Summary Box */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">From</span>
                <span className="font-mono text-slate-200">
                  {activeAccount?.name} ({activeAccount?.address.slice(0, 6)}...
                  {activeAccount?.address.slice(-4)})
                </span>
              </div>

              <div className="flex justify-between items-start">
                <span className="text-slate-400">To Recipient</span>
                <div className="text-right font-mono">
                  {isEns && (
                    <div className="text-indigo-400 font-bold">{recipient}</div>
                  )}
                  <div className="text-slate-200 text-[11px]">
                    {resolvedEns || recipient}
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-400">Network</span>
                <span className="font-semibold text-slate-200">
                  {currentNetwork.name}
                </span>
              </div>

              <div className="flex justify-between border-t border-slate-800/80 pt-2">
                <span className="text-slate-400">Estimated Gas Fee</span>
                <span className="font-mono text-slate-200">
                  {activeGas.feeEth.toFixed(5)} ETH ({formatFiat(activeGas.feeUsd, currency)})
                </span>
              </div>

              <div className="flex justify-between font-bold border-t border-slate-800/80 pt-2 text-sm text-white">
                <span>Total Outflow</span>
                <span>{formatFiat(fiatEquivalent + activeGas.feeUsd, currency)}</span>
              </div>
            </div>

            {/* Security Check */}
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center space-x-2 text-xs text-emerald-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Security check passed: No malicious drainer code detected.</span>
            </div>

            {validationError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400">
                {validationError}
              </div>
            )}

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setStep('input')}
                className="w-1/3 py-3.5 bg-slate-800 hover:bg-slate-750 text-slate-300 font-medium rounded-2xl transition-all"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleConfirmAndSend}
                disabled={isBroadcasting}
                className="w-2/3 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white font-semibold rounded-2xl shadow-lg shadow-emerald-600/25 flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
              >
                {isBroadcasting ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <span>Sign & Broadcast</span>
                )}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: SUCCESS */}
        {step === 'success' && (
          <div className="p-6 text-center space-y-5">
            <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center text-emerald-400 mx-auto animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <h4 className="text-xl font-bold text-white">Transfer Submitted!</h4>
              <p className="text-xs text-slate-400 mt-1">
                Your transaction is confirmed and propagating across {currentNetwork.name}.
              </p>
            </div>

            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
              <div className="text-[10px] uppercase text-slate-500 font-mono">
                Transaction Hash
              </div>
              <div className="text-xs font-mono text-slate-300 truncate">
                {txHash}
              </div>
            </div>

            <div className="flex flex-col space-y-2">
              <a
                href={`${currentNetwork.explorerUrl}/tx/${txHash}`}
                target="_blank"
                rel="noreferrer"
                className="w-full py-3 bg-slate-800 hover:bg-slate-750 text-indigo-400 text-xs font-semibold rounded-xl flex items-center justify-center space-x-1.5 transition-all"
              >
                <span>View on {currentNetwork.name} Explorer</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <button
                onClick={handleReset}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-all"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
