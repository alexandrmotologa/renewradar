import React, { useState } from 'react';
import { Flame, AlertTriangle, Radio, Users } from 'lucide-react';
import { Currency, StatsResponse } from '../types/index.js';

interface BurnRateHeroProps {
  stats: StatsResponse | null;
  currentCurrency: Currency;
  onCurrencyChange: (currency: Currency) => void;
}

export const BurnRateHero: React.FC<BurnRateHeroProps> = ({
  stats,
  currentCurrency,
  onCurrencyChange,
}) => {
  const currencies: Currency[] = ['EUR', 'USD', 'RON', 'GBP'];
  const [viewMode, setViewMode] = useState<'TOTAL' | 'NET'>('TOTAL');

  const getCurrencySymbol = (curr: Currency) => {
    switch (curr) {
      case 'EUR': return '€';
      case 'USD': return '$';
      case 'GBP': return '£';
      case 'RON': return 'lei';
    }
  };

  const hasShared = (stats?.my_net_monthly_burn ?? 0) < (stats?.total_monthly_burn ?? 0);
  const monthlyBurn = viewMode === 'NET' && hasShared
    ? (stats?.my_net_monthly_burn ?? 0)
    : (stats?.total_monthly_burn ?? 0);

  const yearlyBurn = viewMode === 'NET' && hasShared
    ? (stats?.my_net_yearly_burn ?? 0)
    : (stats?.total_yearly_burn ?? 0);

  const count = stats?.subscription_count ?? 0;
  const expiringTrials = stats?.expiring_trials_count ?? 0;

  return (
    <div className="relative overflow-hidden rounded-3xl p-5 bg-gradient-to-b from-obsidian-800 to-obsidian-900 border border-obsidian-600/80 shadow-2xl">
      
      {/* Background Decorative Radar Grid */}
      <div className="absolute top-0 right-0 -mr-12 -mt-12 w-48 h-48 rounded-full border border-cyan-glow/10 pointer-events-none" />
      <div className="absolute top-0 right-0 -mr-6 -mt-6 w-36 h-36 rounded-full border border-cyan-glow/15 pointer-events-none" />
      <div className="absolute top-3 right-3 text-cyan-400/20">
        <Radio className="w-16 h-16 animate-pulse-subtle" />
      </div>

      <div className="relative z-10">
        {/* Top Currency Switcher & Tag */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-obsidian-700/80 border border-obsidian-600 text-xs text-slate-300">
            <Flame className="w-3.5 h-3.5 text-amber-warning fill-amber-warning" />
            <span className="font-semibold tracking-wide uppercase text-[11px]">Monthly Burn Rate</span>
          </div>

          <div className="flex items-center bg-obsidian-950/80 p-0.5 rounded-xl border border-obsidian-700">
            {currencies.map((curr) => (
              <button
                key={curr}
                onClick={() => onCurrencyChange(curr)}
                className={`px-2 py-1 text-[10px] font-bold rounded-lg transition-all ${
                  currentCurrency === curr
                    ? 'bg-gradient-to-r from-cyan-neon to-cyan-deep text-obsidian-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {curr}
              </button>
            ))}
          </div>
        </div>

        {/* Primary Burn Rate Metric */}
        <div className="flex items-baseline space-x-2 my-2">
          <span className="text-4xl font-extrabold tracking-tight text-white">
            {monthlyBurn.toFixed(2)}
          </span>
          <span className="text-xl font-bold text-cyan-glow">
            {getCurrencySymbol(currentCurrency)}
          </span>
          <span className="text-xs text-slate-400 font-medium">/ month</span>
        </div>

        {/* Family Split Toggle if Shared Subscriptions Exist */}
        {hasShared && (
          <div className="flex items-center space-x-2 my-2">
            <div className="flex items-center bg-obsidian-950/80 p-1 rounded-xl border border-obsidian-700 text-xs">
              <button
                onClick={() => setViewMode('TOTAL')}
                className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold transition-all ${
                  viewMode === 'TOTAL'
                    ? 'bg-obsidian-800 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Total Billed
              </button>
              <button
                onClick={() => setViewMode('NET')}
                className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold transition-all flex items-center space-x-1 ${
                  viewMode === 'NET'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Users className="w-3 h-3 mr-0.5" />
                <span>My Share ({stats?.my_net_monthly_burn.toFixed(2)} {getCurrencySymbol(currentCurrency)})</span>
              </button>
            </div>
          </div>
        )}

        {/* Annual Projection Details */}
        <div className="flex items-center justify-between text-xs text-slate-400 pt-1 pb-3 border-b border-obsidian-700/60">
          <div>
            <span>Annual projection: </span>
            <span className="font-semibold text-slate-200">
              {yearlyBurn.toFixed(2)} {getCurrencySymbol(currentCurrency)}/yr
            </span>
          </div>
          <div className="font-medium text-slate-300">
            {count} {count === 1 ? 'service' : 'services'} tracked
          </div>
        </div>

        {/* High-Priority Trial Expiry Alert Banner */}
        {expiringTrials > 0 && (
          <div className="mt-3.5 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start space-x-2.5 animate-pulse-subtle">
            <AlertTriangle className="w-4 h-4 text-amber-warning shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-bold text-amber-200">
                {expiringTrials} free trial expiring in &le; 48 hours!
              </span>
              <p className="text-amber-300/80 text-[11px] mt-0.5">
                Watchdog is active. Cancel now to avoid automatic recurring charges.
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
