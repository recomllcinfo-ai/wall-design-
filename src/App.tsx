import React, { useState } from 'react';
import { Coins, History, Sparkles, Smartphone, Monitor, ShieldCheck } from 'lucide-react';
import { WalletProvider, useWallet } from './context/WalletContext';
import { AuthScreen }      from './components/auth/AuthScreen';
import { OnboardingWizard } from './components/auth/OnboardingWizard';
import { Header }          from './components/dashboard/Header';
import { PortfolioCard }   from './components/dashboard/PortfolioCard';
import { TokenList }       from './components/dashboard/TokenList';
import { NFTGallery }      from './components/dashboard/NFTGallery';
import { ActivityList }    from './components/dashboard/ActivityList';
import { SendModal }       from './components/modals/SendModal';
import { ReceiveModal }    from './components/modals/ReceiveModal';
import { SwapModal }       from './components/modals/SwapModal';
import { OffRampModal }    from './components/modals/OffRampModal';
import { SettingsModal }   from './components/modals/SettingsModal';
import { ToastContainer }  from './components/ui/ToastContainer';
import type { Token }      from './types/wallet';

// ─── Main wallet shell ────────────────────────────────────────────────────────
const WalletMain: React.FC = () => {
  const { vaultStatus, isExtensionView, setIsExtensionView, notifications, dismissNotification } = useWallet();

  const [activeTab, setActiveTab] = useState<'tokens' | 'activity' | 'nfts'>('tokens');

  const [isSendOpen,     setIsSendOpen]     = useState(false);
  const [isReceiveOpen,  setIsReceiveOpen]  = useState(false);
  const [isSwapOpen,     setIsSwapOpen]     = useState(false);
  const [isOfframpOpen,  setIsOfframpOpen]  = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedToken,  setSelectedToken]  = useState<Token | null>(null);

  const handleSelectTokenToSend = (token: Token) => {
    setSelectedToken(token);
    setIsSendOpen(true);
  };

  const handleOpenSend = () => {
    setSelectedToken(null);
    setIsSendOpen(true);
  };

  // ── Screens ─────────────────────────────────────────────────────────────────
  if (vaultStatus === 'loading') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (vaultStatus === 'signed_out') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col">
        <div className="flex-1 flex flex-col justify-center items-center p-4">
          <AuthScreen />
        </div>
      </div>
    );
  }

  if (vaultStatus === 'needs_wallet') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col">
        <div className="flex-1 flex flex-col justify-center items-center p-4">
          <OnboardingWizard />
        </div>
      </div>
    );
  }

  // ── Dashboard content ────────────────────────────────────────────────────────
  const dashboardContent = (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 select-none">
      {/* Global toast notifications */}
      <ToastContainer notifications={notifications} onDismiss={dismissNotification} />

      {/* Header */}
      <Header
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenReceive={() => setIsReceiveOpen(true)}
      />

      {/* Main scrollable body */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 max-w-2xl mx-auto w-full">

        {/* Portfolio card */}
        <PortfolioCard
          onOpenSend={handleOpenSend}
          onOpenReceive={() => setIsReceiveOpen(true)}
          onOpenSwap={() => setIsSwapOpen(true)}
          onOpenOfframp={() => setIsOfframpOpen(true)}
        />

        {/* Tab bar */}
        <div className="flex bg-slate-900/90 p-1 rounded-2xl border border-slate-800 text-xs font-semibold">
          {[
            { key: 'tokens',   icon: <Coins    className="w-3.5 h-3.5" />, label: 'Assets & Prices' },
            { key: 'activity', icon: <History  className="w-3.5 h-3.5" />, label: 'Activity'        },
            { key: 'nfts',     icon: <Sparkles className="w-3.5 h-3.5" />, label: 'NFTs'           },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={`flex-1 flex items-center justify-center space-x-1.5 py-2.5 rounded-xl transition-all ${
                activeTab === tab.key
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="pb-4">
          {activeTab === 'tokens'   && <TokenList onSelectTokenToSend={handleSelectTokenToSend} onOpenReceive={() => setIsReceiveOpen(true)} />}
          {activeTab === 'activity' && <ActivityList />}
          {activeTab === 'nfts'     && <NFTGallery />}
        </div>
      </main>

      {/* Modals */}
      <SendModal    isOpen={isSendOpen}     onClose={() => setIsSendOpen(false)}     preselectedToken={selectedToken} />
      <ReceiveModal isOpen={isReceiveOpen}  onClose={() => setIsReceiveOpen(false)}  />
      <SwapModal    isOpen={isSwapOpen}     onClose={() => setIsSwapOpen(false)}     />
      <OffRampModal isOpen={isOfframpOpen}  onClose={() => setIsOfframpOpen(false)}  />
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );

  // ── Extension popup frame ─────────────────────────────────────────────────
  if (isExtensionView) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 sm:p-8">
        <div className="mb-4 flex items-center space-x-3 bg-slate-900 border border-slate-800 px-4 py-2 rounded-2xl text-xs">
          <div className="flex items-center space-x-1.5 text-indigo-400 font-semibold">
            <Smartphone className="w-4 h-4" />
            <span>Extension / Mobile Popup View (380 × 640)</span>
          </div>
          <button
            onClick={() => setIsExtensionView(false)}
            className="flex items-center space-x-1 text-slate-400 hover:text-white px-2 py-1 bg-slate-800 rounded-lg transition-colors text-[11px] font-medium"
          >
            <Monitor className="w-3.5 h-3.5 mr-1" />
            Full Dashboard
          </button>
        </div>

        {/* Phone bezel */}
        <div className="w-[380px] h-[640px] rounded-[36px] bg-slate-900 p-2.5 shadow-2xl shadow-indigo-500/10 border-4 border-slate-800 flex flex-col overflow-hidden">
          <div className="w-24 h-4 bg-slate-950 rounded-full mx-auto mb-1.5 flex items-center justify-center">
            <div className="w-8 h-1 bg-slate-800 rounded-full" />
          </div>
          <div className="flex-1 rounded-[26px] overflow-hidden border border-slate-800 flex flex-col">
            {dashboardContent}
          </div>
        </div>
      </div>
    );
  }

  // ── Full dashboard ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <div className="hidden lg:flex items-center justify-between px-6 py-1.5 bg-indigo-950/30 border-b border-indigo-500/15 text-xs">
        <div className="flex items-center space-x-2 text-indigo-300/70 font-medium">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Apex Wallet — Non-Custodial Multi-Chain Interface</span>
        </div>
        <button
          onClick={() => setIsExtensionView(true)}
          className="flex items-center space-x-1.5 text-indigo-300 hover:text-white px-3 py-1 bg-indigo-900/40 hover:bg-indigo-800/50 border border-indigo-700/40 rounded-lg transition-all"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Extension Popup View</span>
        </button>
      </div>
      <div className="flex-1 flex flex-col">{dashboardContent}</div>
    </div>
  );
};

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <WalletProvider>
      <WalletMain />
    </WalletProvider>
  );
}
