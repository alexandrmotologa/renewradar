import React from 'react';
import { Ghost, ArrowRight } from 'lucide-react';
import { Currency, GhostRecommendation } from '../types/index.js';

interface GhostHunterCardProps {
  recommendations: GhostRecommendation[];
  currency: Currency;
  onInspectCategory: (category: string) => void;
}

export const GhostHunterCard: React.FC<GhostHunterCardProps> = ({
  recommendations,
  currency,
  onInspectCategory,
}) => {
  if (!recommendations || recommendations.length === 0) return null;

  return (
    <div className="rounded-3xl p-4 glass-card border border-purple-500/30 relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute top-0 right-0 -mr-10 -mt-10 w-32 h-32 rounded-full bg-purple-500/10 blur-2xl pointer-events-none" />

      <div className="flex items-center space-x-2 mb-2">
        <div className="w-7 h-7 rounded-lg bg-purple-500/20 border border-purple-500/40 flex items-center justify-center">
          <Ghost className="w-4 h-4 text-purple-300" />
        </div>
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-purple-300">
            Ghost Hunter &bull; Redundancy Alert
          </h3>
        </div>
      </div>

      <div className="space-y-2 mt-2">
        {recommendations.map((rec, i) => (
          <div
            key={i}
            className="p-3 rounded-2xl bg-obsidian-950/70 border border-obsidian-700/60"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-slate-200 font-medium">
                  {rec.message}
                </p>
                <div className="flex items-center space-x-1.5 mt-2">
                  {rec.services.map((svc) => (
                    <span
                      key={svc}
                      className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-obsidian-800 text-slate-300 border border-obsidian-700"
                    >
                      {svc}
                    </span>
                  ))}
                </div>
              </div>

              <button
                onClick={() => onInspectCategory(rec.category)}
                className="p-1.5 rounded-lg bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 transition-colors shrink-0 ml-2"
                title="Review services"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-2 pt-2 border-t border-obsidian-800 flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Total: {rec.total_monthly_cost.toFixed(2)} {currency}/mo</span>
              <span className="font-bold text-emerald-400">Save up to {rec.potential_savings.toFixed(2)} {currency}/mo</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
