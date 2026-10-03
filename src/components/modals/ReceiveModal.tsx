import React, { useState } from 'react';
import { X, Copy, Check, AlertTriangle, Share2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useWallet } from '../../context/WalletContext';
import { NETWORKS } from '../../services/mockBlockchain';

interface ReceiveModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ReceiveModal: React.FC<ReceiveModalProps> = ({ isOpen, onClose }) => {
  const { activeAccount, activeNetwork } = useWallet();

  const [copied, setCopied] = useState(false);

  if (!isOpen || !activeAccount) return null;

  const currentNetwork = NETWORKS[activeNetwork] ?? NETWORKS.ethereum;
  const address =
    activeNetwork === 'solana'  ? activeAccount.solanaAddress  ?? activeAccount.address :
    activeNetwork === 'bitcoin' ? activeAccount.bitcoinAddress ?? activeAccount.address :
    activeAccount.address;

  const handleCopy = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: 'My Wallet Address', text: address }); return; }
      catch { /* fallback */ }
    }
    handleCopy();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="relative w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden p-6 space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white">Receive Funds</h3>
            <p className="text-xs text-slate-400">Share your address to receive crypto</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* QR Code */}
        <div className="flex flex-col items-center justify-center p-5 bg-white rounded-3xl shadow-inner mx-auto max-w-[200px]">
          <QRCodeSVG value={address} size={168} level="H" includeMargin={false} />
        </div>

        {/* Address row */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>{activeAccount.name}</span>
            <span
              className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
              style={{ backgroundColor: `${currentNetwork.color}20`, color: currentNetwork.color }}
            >
              {currentNetwork.name}
            </span>
          </div>

          <div
            onClick={handleCopy}
            className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-2xl cursor-pointer transition-colors group"
          >
            <span className="font-mono text-xs text-slate-300 break-all select-all pr-2">{address}</span>
            <div className="p-1.5 bg-slate-800 rounded-xl group-hover:bg-slate-700 transition-colors shrink-0">
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
            </div>
          </div>
        </div>

        {/* Network warning */}
        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start space-x-2 text-xs text-amber-300">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <span>
            Only send <strong>{currentNetwork.nativeCurrency.name}</strong> and tokens on{' '}
            <strong>{currentNetwork.name}</strong> to this address.
          </span>
        </div>

        {/* Action buttons */}
        <div className="flex space-x-2">
          <button
            onClick={handleCopy}
            className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl flex items-center justify-center space-x-1.5 transition-all"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied!' : 'Copy Address'}</span>
          </button>
          <button onClick={handleShare} className="p-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-xl transition-all">
            <Share2 className="w-4 h-4" />
          </button>
        </div>

        <p className="text-[11px] text-slate-500 text-center">
          Transfers from other accounts in this app arrive here instantly.
        </p>
      </div>
    </div>
  );
};
