import React from 'react';
import { Sparkles } from 'lucide-react';
import { useWallet } from '../../context/WalletContext';
import { formatFiat } from '../../services/cryptoPrices';

export const NFTGallery: React.FC = () => {
  const { nfts, currency, activeNetwork } = useWallet();

  const filteredNfts = nfts.filter(
    (n) => n.networkId === activeNetwork || activeNetwork === 'ethereum'
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <h3 className="text-sm font-bold text-white">Digital Collectibles</h3>
        </div>
        <span className="text-xs text-slate-400 font-mono">
          {filteredNfts.length} Items
        </span>
      </div>

      {filteredNfts.length === 0 ? (
        <div className="p-8 text-center bg-slate-900/50 rounded-2xl border border-slate-800 space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mx-auto">
            <Sparkles className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-slate-300">No NFTs Found</p>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            Your NFTs and digital art will automatically appear here when received on this chain.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {filteredNfts.map((nft) => (
            <div
              key={nft.id}
              className="group overflow-hidden rounded-2xl bg-slate-900 border border-slate-800 hover:border-purple-500/40 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/10"
            >
              <div className="relative aspect-square overflow-hidden bg-slate-950">
                <img
                  src={nft.image}
                  alt={nft.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-slate-950/80 backdrop-blur-md text-[10px] font-mono text-purple-300 border border-purple-500/30">
                  {nft.tokenId}
                </div>
              </div>

              <div className="p-3 space-y-1">
                <div className="text-[11px] text-slate-400 truncate">{nft.collection}</div>
                <div className="text-xs font-bold text-white truncate group-hover:text-purple-300 transition-colors">
                  {nft.name}
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[11px]">
                  <span className="text-slate-500">Floor</span>
                  <span className="font-semibold text-slate-200">
                    {formatFiat(nft.floorPriceUsd, currency)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
