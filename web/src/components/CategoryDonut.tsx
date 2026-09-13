import React from 'react';
import { Category, Currency, StatsResponse } from '../types/index.js';

interface CategoryBreakdownProps {
  stats: StatsResponse | null;
  currency: Currency;
}

const CATEGORY_CONFIG: Record<Category, { label: string; color: string; bg: string }> = {
  AI_TOOLS: { label: 'AI Tools', color: '#00f5ff', bg: 'bg-cyan-400' },
  STREAMING: { label: 'Streaming', color: '#a855f7', bg: 'bg-purple-400' },
  WORK: { label: 'Work & Cloud', color: '#3b82f6', bg: 'bg-blue-400' },
  FITNESS: { label: 'Fitness', color: '#10b981', bg: 'bg-emerald-400' },
  OTHER: { label: 'Other', color: '#94a3b8', bg: 'bg-slate-400' },
};

export const CategoryDonut: React.FC<CategoryBreakdownProps> = ({ stats, currency }) => {
  const totalBurn = stats?.total_monthly_burn || 0;
  const breakdown = stats?.category_breakdown || {
    AI_TOOLS: 0,
    STREAMING: 0,
    WORK: 0,
    FITNESS: 0,
    OTHER: 0,
  };

  const categories = Object.keys(breakdown) as Category[];

  return (
    <div className="rounded-3xl p-4 glass-card border border-obsidian-600/80">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Spending Breakdown
        </span>
        <span className="text-[11px] text-slate-400 font-medium">
          Monthly Share
        </span>
      </div>

      {/* Segmented Progress Bar */}
      <div className="w-full h-3 rounded-full bg-obsidian-950 overflow-hidden flex p-0.5 border border-obsidian-700/60 mb-3.5">
        {categories.map((cat) => {
          const amount = breakdown[cat] || 0;
          if (amount <= 0 || totalBurn <= 0) return null;
          const percentage = (amount / totalBurn) * 100;
          const config = CATEGORY_CONFIG[cat];

          return (
            <div
              key={cat}
              className={`h-full first:rounded-l-full last:rounded-r-full ${config.bg} transition-all duration-500`}
              style={{ width: `${percentage}%` }}
              title={`${config.label}: ${amount.toFixed(2)} ${currency} (${percentage.toFixed(0)}%)`}
            />
          );
        })}
      </div>

      {/* Legend Badges */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        {categories.map((cat) => {
          const amount = breakdown[cat] || 0;
          if (amount <= 0) return null;
          const percentage = totalBurn > 0 ? ((amount / totalBurn) * 100).toFixed(0) : '0';
          const config = CATEGORY_CONFIG[cat];

          return (
            <div
              key={cat}
              className="flex items-center justify-between p-2 rounded-xl bg-obsidian-800/60 border border-obsidian-700/40"
            >
              <div className="flex items-center space-x-1.5 min-w-0">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: config.color }}
                />
                <span className="text-[11px] font-medium text-slate-300 truncate">
                  {config.label}
                </span>
              </div>
              <div className="text-right shrink-0">
                <span className="text-[11px] font-bold text-white">
                  {amount.toFixed(0)} {currency}
                </span>
                <span className="text-[10px] text-slate-400 ml-1">
                  ({percentage}%)
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
