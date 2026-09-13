import React from 'react';
import { Trophy, ArrowUpRight } from 'lucide-react';
import { Currency } from '../types/index.js';

interface LifetimeSavedBannerProps {
  amount: number;
  currency: Currency;
  onViewArchived: () => void;
}

export const LifetimeSavedBanner: React.FC<LifetimeSavedBannerProps> = ({
  amount,
  currency,
  onViewArchived,
}) => {
  if (amount <= 0) return null;

  return (
    <div className="relative overflow-hidden rounded-2xl p-3.5 bg-gradient-to-r from-emerald-950/80 via-obsidian-900 to-obsidian-900 border border-emerald-500/40 shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
            <Trophy className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Lifetime Saved
              </span>
              <span className="text-sm font-extrabold text-white">
                {amount.toFixed(2)} {currency}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Money kept in your pocket by dodging auto-renewals
            </p>
          </div>
        </div>

        <button
          onClick={onViewArchived}
          className="p-1.5 rounded-lg bg-obsidian-800 hover:bg-obsidian-700 text-slate-300 hover:text-white border border-obsidian-700 transition-colors"
          title="View Cancelled Subscriptions"
        >
          <ArrowUpRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
