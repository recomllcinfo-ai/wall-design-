import React, { useState } from 'react';
import {
  X,
  Key,
  Clock,
  Globe,
  Trash2,
  Copy,
  Check,
  Lock,
} from 'lucide-react';
import { useWallet } from '../../context/WalletContext';
import { NETWORKS } from '../../services/mockBlockchain';
import type { Currency } from '../../types/wallet';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const {
    mnemonic,
    currency,
    setCurrency,
    autoLockMinutes,
    setAutoLockMinutes,
    resetAllData,
  } = useWallet();

  const [activeTab, setActiveTab] = useState<'general' | 'security' | 'networks'>('general');
  const [passwordForReveal, setPasswordForReveal] = useState('');
  const [isRevealed, setIsRevealed] = useState(false);
  const [revealError, setRevealError] = useState('');
  const [copiedPhrase, setCopiedPhrase] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  if (!isOpen) return null;

  const handleRevealPhrase = (e: React.FormEvent) => {
    e.preventDefault();
    setRevealError('');
    if (!passwordForReveal) {
      setRevealError('Enter your password to reveal phrase');
      return;
    }
    // Reveal phrase
    setIsRevealed(true);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(mnemonic.join(' '));
    setCopiedPhrase(true);
    setTimeout(() => setCopiedPhrase(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-lg font-bold text-white">Wallet Settings</h3>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-950 p-1 rounded-2xl border border-slate-800 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('general')}
            className={`flex-1 py-2 rounded-xl transition-all ${
              activeTab === 'general'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            General
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`flex-1 py-2 rounded-xl transition-all ${
              activeTab === 'security'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Security & Backup
          </button>
          <button
            onClick={() => setActiveTab('networks')}
            className={`flex-1 py-2 rounded-xl transition-all ${
              activeTab === 'networks'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Networks
          </button>
        </div>

        {/* TAB 1: GENERAL */}
        {activeTab === 'general' && (
          <div className="space-y-4 py-2">
            {/* Currency Preference */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
                <Globe className="w-3.5 h-3.5 text-indigo-400" />
                <span>Default Currency</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['USD', 'EUR', 'GBP'] as Currency[]).map((cur) => (
                  <button
                    key={cur}
                    type="button"
                    onClick={() => setCurrency(cur)}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                      currency === cur
                        ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {cur} ({cur === 'USD' ? '$' : cur === 'EUR' ? '€' : '£'})
                  </button>
                ))}
              </div>
            </div>

            {/* Auto-Lock Timer */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                <span>Auto-Lock Timer</span>
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {[5, 15, 30, 60].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setAutoLockMinutes(mins)}
                    className={`py-2 px-2 rounded-xl border text-xs font-semibold transition-all ${
                      autoLockMinutes === mins
                        ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {mins}m
                  </button>
                ))}
              </div>
            </div>

            {/* Reset / Erase Vault */}
            <div className="pt-4 border-t border-slate-800/80">
              {!showResetConfirm ? (
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(true)}
                  className="w-full py-2.5 px-3 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs font-semibold rounded-xl flex items-center justify-center space-x-1.5 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Sign Out & Clear This Device</span>
                </button>
              ) : (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-2xl space-y-2">
                  <div className="text-xs font-bold text-rose-300">
                    Sign out and clear this device?
                  </div>
                  <p className="text-[11px] text-rose-400">
                    Local preferences are cleared. Your accounts, balances and history stay safe on the server — sign in again to see them.
                  </p>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => {
                        resetAllData();
                        onClose();
                      }}
                      className="flex-1 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg"
                    >
                      Yes, Sign Out
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowResetConfirm(false)}
                      className="flex-1 py-1.5 bg-slate-800 text-slate-300 text-xs font-medium rounded-lg"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: SECURITY & RECOVERY PHRASE */}
        {activeTab === 'security' && (
          <div className="space-y-4 py-2">
            <div>
              <h4 className="text-xs font-bold text-white flex items-center space-x-1.5">
                <Key className="w-3.5 h-3.5 text-indigo-400" />
                <span>Show Secret Recovery Phrase</span>
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Never share this with anyone. Anyone with your phrase can steal all your assets.
              </p>
            </div>

            {!isRevealed ? (
              <form onSubmit={handleRevealPhrase} className="space-y-3">
                <div className="relative">
                  <input
                    type="password"
                    placeholder="Enter Master Password"
                    value={passwordForReveal}
                    onChange={(e) => setPasswordForReveal(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                {revealError && (
                  <div className="text-xs text-rose-400">{revealError}</div>
                )}

                <button
                  type="submit"
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl flex items-center justify-center space-x-1.5 transition-all"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Reveal Phrase</span>
                </button>
              </form>
            ) : (
              <div className="space-y-3 animate-fadeIn">
                <div className="grid grid-cols-3 gap-2 p-3 bg-slate-950 border border-slate-800 rounded-2xl text-xs font-mono">
                  {mnemonic.length > 0 ? (
                    mnemonic.map((word, i) => (
                      <div key={i} className="flex space-x-1 text-indigo-200">
                        <span className="text-slate-600">{i + 1}.</span>
                        <span>{word}</span>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-3 text-slate-500 text-center py-2">
                      (No mnemonic saved in active session)
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center">
                  <button
                    onClick={handleCopy}
                    className="flex items-center space-x-1.5 text-xs text-indigo-400 hover:text-indigo-300 py-1.5 px-3 bg-indigo-950/40 rounded-xl border border-indigo-800/40 transition-all"
                  >
                    {copiedPhrase ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedPhrase ? 'Copied' : 'Copy Phrase'}</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsRevealed(false);
                      setPasswordForReveal('');
                    }}
                    className="text-xs text-slate-400 hover:text-slate-200"
                  >
                    Hide Phrase
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: NETWORKS */}
        {activeTab === 'networks' && (
          <div className="space-y-3 py-2 max-h-64 overflow-y-auto">
            {Object.values(NETWORKS).map((net) => (
              <div
                key={net.id}
                className="p-3 bg-slate-950 border border-slate-800 rounded-2xl space-y-1 text-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 font-bold text-white">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: net.color }}
                    />
                    <span>{net.name}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {net.nativeCurrency.symbol}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 font-mono truncate">
                  RPC: {net.rpcUrl}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
