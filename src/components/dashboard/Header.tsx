import React, { useState } from 'react';
import {
  ChevronDown,
  Copy,
  Check,
  Lock,
  Settings,
  Plus,
  Monitor,
  Smartphone,
  RefreshCw,
} from 'lucide-react';
import { useWallet } from '../../context/WalletContext';
import { NETWORKS } from '../../services/mockBlockchain';
import type { Account, NetworkId, Currency } from '../../types/wallet';

interface HeaderProps {
  onOpenSettings: () => void;
  onOpenReceive: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSettings }) => {
  const {
    activeAccount,
    accounts,
    activeNetwork,
    setActiveNetwork,
    switchAccount,
    createAdditionalAccount,
    lockVault,
    currency,
    setCurrency,
    isExtensionView,
    setIsExtensionView,
    refreshLivePrices,
    isLivePriceLoading,
  } = useWallet();

  const [showNetworkMenu, setShowNetworkMenu] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  const currentNetwork = NETWORKS[activeNetwork] || NETWORKS.ethereum;

  // Solana and Bitcoin use their own address formats; every other network is EVM
  const addressForNetwork = (acc: Account) =>
    activeNetwork === 'solana'  ? acc.solanaAddress  || acc.address :
    activeNetwork === 'bitcoin' ? acc.bitcoinAddress || acc.address :
    acc.address;

  const handleCopyAddress = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!activeAccount) return;
    navigator.clipboard.writeText(addressForNetwork(activeAccount));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const truncateAddress = (addr: string) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const getDisplayAddress = () => {
    if (!activeAccount) return '';
    return addressForNetwork(activeAccount);
  };

  return (
    <header className="relative z-30 flex items-center justify-between px-4 py-3 bg-slate-900/80 border-b border-slate-800 backdrop-blur-md">
      {/* Left: Network Switcher */}
      <div className="relative">
        <button
          onClick={() => {
            setShowNetworkMenu(!showNetworkMenu);
            setShowAccountMenu(false);
          }}
          className="flex items-center space-x-2 px-3 py-1.5 bg-slate-800/90 hover:bg-slate-750 border border-slate-700/60 rounded-xl transition-all text-xs font-medium text-slate-200"
        >
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: currentNetwork.color }}
          />
          <span className="hidden sm:inline font-semibold">{currentNetwork.name}</span>
          <span className="sm:hidden font-semibold">{currentNetwork.nativeCurrency.symbol}</span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
        </button>

        {showNetworkMenu && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowNetworkMenu(false)}
            />
            <div className="absolute left-0 mt-2 w-56 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-1.5 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="text-[10px] uppercase font-bold text-slate-500 px-3 py-1.5 tracking-wider">
                Select Network
              </div>
              {Object.values(NETWORKS).map((net) => (
                <button
                  key={net.id}
                  onClick={() => {
                    setActiveNetwork(net.id as NetworkId);
                    setShowNetworkMenu(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    activeNetwork === net.id
                      ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                      : 'text-slate-300 hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: net.color }}
                    />
                    <span>{net.name}</span>
                  </div>
                  {activeNetwork === net.id && (
                    <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded font-mono">
                      Active
                    </span>
                  )}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Center: Active Account Pill & Copy */}
      <div className="relative">
        {/* Pill wraps two sibling buttons — nesting <button> in <button> is invalid HTML */}
        <div className="flex items-center px-3 py-1.5 bg-slate-950/70 hover:bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-full transition-all group">
          <button
            onClick={() => {
              setShowAccountMenu(!showAccountMenu);
              setShowNetworkMenu(false);
            }}
            className="flex items-center space-x-2"
          >
            {/* Avatar Dot */}
            <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-indigo-500 to-pink-500 flex items-center justify-center text-[10px] font-bold text-white uppercase">
              {activeAccount?.name?.slice(0, 1) || 'A'}
            </div>

            <div className="flex items-center space-x-1 text-xs">
              <span className="font-semibold text-slate-200 hidden sm:inline">
                {activeAccount?.name}
              </span>
              <span className="text-slate-400 font-mono">
                ({truncateAddress(getDisplayAddress())})
              </span>
            </div>
          </button>

          <button
            onClick={handleCopyAddress}
            title="Copy address"
            className="p-1 ml-1 text-slate-500 hover:text-indigo-400 transition-colors"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
          <button
            onClick={() => {
              setShowAccountMenu(!showAccountMenu);
              setShowNetworkMenu(false);
            }}
            aria-label="Switch account"
            className="text-slate-500"
          >
            <ChevronDown className="w-3 h-3" />
          </button>
        </div>

        {showAccountMenu && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowAccountMenu(false)}
            />
            <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-64 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="text-[10px] uppercase font-bold text-slate-500 px-3 py-1 tracking-wider">
                My Accounts
              </div>
              <div className="space-y-1 max-h-48 overflow-y-auto my-1">
                {accounts.map((acc) => (
                  <button
                    key={acc.id}
                    onClick={() => {
                      switchAccount(acc.id);
                      setShowAccountMenu(false);
                    }}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left text-xs transition-all ${
                      activeAccount?.id === acc.id
                        ? 'bg-indigo-600/20 border border-indigo-500/30'
                        : 'hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-slate-200">{acc.name}</div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {truncateAddress(addressForNetwork(acc))}
                      </div>
                    </div>
                    {activeAccount?.id === acc.id && (
                      <Check className="w-4 h-4 text-indigo-400" />
                    )}
                  </button>
                ))}
              </div>

              <div className="border-t border-slate-800 pt-1.5 mt-1">
                <button
                  onClick={() => {
                    createAdditionalAccount();
                    setShowAccountMenu(false);
                  }}
                  className="w-full flex items-center justify-center space-x-1.5 py-2 px-3 bg-slate-800 hover:bg-slate-750 text-indigo-400 text-xs font-semibold rounded-xl transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add New Account</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Right: Quick actions & Controls */}
      <div className="flex items-center space-x-1 sm:space-x-2">
        {/* Live Refresh */}
        <button
          onClick={refreshLivePrices}
          disabled={isLivePriceLoading}
          title="Refresh live prices"
          className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${isLivePriceLoading ? 'animate-spin text-indigo-400' : ''}`} />
        </button>

        {/* Currency Switcher */}
        <select
          value={currency}
          onChange={(e) => setCurrency(e.target.value as Currency)}
          className="bg-slate-800 text-slate-300 text-xs font-medium rounded-lg px-2 py-1 border border-slate-700 focus:outline-none cursor-pointer hover:bg-slate-750 transition-colors"
        >
          <option value="USD">USD ($)</option>
          <option value="EUR">EUR (€)</option>
          <option value="GBP">GBP (£)</option>
        </select>

        {/* Viewport Mode Toggle (Extension vs Full) */}
        <button
          onClick={() => setIsExtensionView(!isExtensionView)}
          title={isExtensionView ? 'Switch to Full Dashboard' : 'Switch to Extension Popup'}
          className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-lg transition-all hidden md:flex items-center space-x-1"
        >
          {isExtensionView ? <Monitor className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
        </button>

        {/* Settings */}
        <button
          onClick={onOpenSettings}
          title="Settings"
          className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-all"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* Lock Vault */}
        <button
          onClick={lockVault}
          title="Lock Vault"
          className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-all"
        >
          <Lock className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
