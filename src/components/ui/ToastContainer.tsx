import React from 'react';
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from 'lucide-react';
import type { WalletNotification } from '../../types/wallet';

interface ToastProps {
  notifications: WalletNotification[];
  onDismiss: (id: string) => void;
}

const ICONS = {
  success: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
  info:    <Info         className="w-5 h-5 text-indigo-400  shrink-0" />,
  warning: <AlertTriangle className="w-5 h-5 text-amber-400  shrink-0" />,
  error:   <XCircle      className="w-5 h-5 text-rose-400    shrink-0" />,
};

const BORDERS = {
  success: 'border-emerald-500/30 bg-emerald-500/10',
  info:    'border-indigo-500/30  bg-indigo-500/10',
  warning: 'border-amber-500/30   bg-amber-500/10',
  error:   'border-rose-500/30    bg-rose-500/10',
};

export const ToastContainer: React.FC<ToastProps> = ({ notifications, onDismiss }) => {
  if (!notifications.length) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {notifications.map(n => (
        <div
          key={n.id}
          className={`
            pointer-events-auto flex items-start space-x-3 p-3.5 rounded-2xl
            border backdrop-blur-xl shadow-2xl shadow-black/40
            ${BORDERS[n.type]}
            animate-slideIn
          `}
          style={{ animation: 'slideIn 0.25s ease-out' }}
        >
          {ICONS[n.type]}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white leading-tight">{n.title}</p>
            <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">{n.message}</p>
          </div>
          <button
            onClick={() => onDismiss(n.id)}
            className="text-slate-400 hover:text-white p-0.5 rounded-lg hover:bg-white/10 transition-colors shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};
