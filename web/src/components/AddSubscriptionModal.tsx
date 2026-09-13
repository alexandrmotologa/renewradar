import React, { useState } from 'react';
import { X, Sparkles, Calendar, Link } from 'lucide-react';
import { 
  BillingCycle, 
  Category, 
  CreateSubscriptionInput, 
  Currency, 
  PresetTemplate 
} from '../types/index.js';
import { useTelegram } from '../hooks/useTelegram.js';

interface AddSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (data: CreateSubscriptionInput) => Promise<boolean>;
  presets: PresetTemplate[];
  defaultCurrency: Currency;
}

export const AddSubscriptionModal: React.FC<AddSubscriptionModalProps> = ({
  isOpen,
  onClose,
  onAdd,
  presets,
  defaultCurrency,
}) => {
  const { haptic } = useTelegram();
  const now = new Date();
  const defaultNextDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<Currency>(defaultCurrency);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('MONTHLY');
  const [category, setCategory] = useState<Category>('STREAMING');
  const [isFreeTrial, setIsFreeTrial] = useState(false);
  const [trialDays, setTrialDays] = useState(14);
  const [nextBillingDate, setNextBillingDate] = useState(defaultNextDate);
  const [cancelUrl, setCancelUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSelectPreset = (preset: PresetTemplate) => {
    haptic('selection');
    setName(preset.name);
    setAmount(preset.defaultAmount.toString());
    setCurrency(preset.defaultCurrency);
    setBillingCycle(preset.defaultCycle);
    setCategory(preset.category);
    setCancelUrl(preset.cancelUrl || '');
  };

  const handleSetTrialDays = (days: number) => {
    haptic('light');
    setTrialDays(days);
    const target = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    setNextBillingDate(target.toISOString().split('T')[0]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !amount) return;

    setSubmitting(true);
    const parsedAmount = parseFloat(amount);
    const billingTimestamp = new Date(nextBillingDate).getTime();

    const success = await onAdd({
      name,
      amount: parsedAmount,
      currency,
      billing_cycle: billingCycle,
      category,
      next_billing_date: billingTimestamp,
      is_free_trial: isFreeTrial,
      trial_duration_days: isFreeTrial ? trialDays : 0,
      cancel_url: cancelUrl || undefined,
    });

    setSubmitting(false);
    if (success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-obsidian-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-obsidian-900 border border-obsidian-700 shadow-2xl p-5">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-obsidian-700/80">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-cyan-glow" />
            <h2 className="text-base font-bold text-white">Add Subscription</h2>
          </div>
          <button
            onClick={() => {
              haptic('light');
              onClose();
            }}
            className="p-1.5 rounded-full bg-obsidian-800 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Presets Carousel */}
        {presets.length > 0 && (
          <div className="my-3">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
              Quick Templates
            </label>
            <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
              {presets.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  className="px-2.5 py-1.5 rounded-xl bg-obsidian-800 hover:bg-obsidian-700 text-slate-300 hover:text-white text-xs font-semibold whitespace-nowrap border border-obsidian-700 transition-all flex items-center space-x-1"
                >
                  <span>{preset.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 mt-2">
          {/* Service Name */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Service Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Netflix, ChatGPT Plus, Spotify"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-obsidian-950 border border-obsidian-700 text-white text-sm focus:outline-none focus:border-cyan-glow"
            />
          </div>

          {/* Amount & Currency */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Price *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-obsidian-950 border border-obsidian-700 text-white text-sm focus:outline-none focus:border-cyan-glow font-mono font-bold"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as Currency)}
                className="w-full px-3 py-2 rounded-xl bg-obsidian-950 border border-obsidian-700 text-white text-sm focus:outline-none focus:border-cyan-glow font-bold"
              >
                <option value="EUR">EUR (€)</option>
                <option value="USD">USD ($)</option>
                <option value="RON">RON (lei)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>
          </div>

          {/* Category & Billing Cycle */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                className="w-full px-3 py-2 rounded-xl bg-obsidian-950 border border-obsidian-700 text-white text-xs focus:outline-none focus:border-cyan-glow"
              >
                <option value="AI_TOOLS">AI Tools</option>
                <option value="STREAMING">Streaming</option>
                <option value="WORK">Work & Cloud</option>
                <option value="FITNESS">Fitness</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Billing Cycle
              </label>
              <select
                value={billingCycle}
                onChange={(e) => setBillingCycle(e.target.value as BillingCycle)}
                className="w-full px-3 py-2 rounded-xl bg-obsidian-950 border border-obsidian-700 text-white text-xs focus:outline-none focus:border-cyan-glow"
              >
                <option value="MONTHLY">Monthly</option>
                <option value="YEARLY">Yearly</option>
                <option value="WEEKLY">Weekly</option>
              </select>
            </div>
          </div>

          {/* Free Trial Toggle */}
          <div className="p-3 rounded-2xl bg-obsidian-950/70 border border-obsidian-700/80">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-white block">This is a Free Trial</span>
                <span className="text-[11px] text-slate-400">Watchdog will alert you before renewal</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  haptic('medium');
                  const nextVal = !isFreeTrial;
                  setIsFreeTrial(nextVal);
                  if (nextVal) {
                    handleSetTrialDays(14);
                  }
                }}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                  isFreeTrial ? 'bg-cyan-neon' : 'bg-obsidian-700'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    isFreeTrial ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Trial Quick Duration Buttons */}
            {isFreeTrial && (
              <div className="mt-3 pt-2.5 border-t border-obsidian-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Trial Duration
                </span>
                <div className="flex items-center space-x-2">
                  {[7, 14, 30].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => handleSetTrialDays(d)}
                      className={`flex-1 py-1 text-xs font-bold rounded-lg border transition-all ${
                        trialDays === d
                          ? 'bg-cyan-500/20 text-cyan-glow border-cyan-500/40'
                          : 'bg-obsidian-800 text-slate-400 border-obsidian-700'
                      }`}
                    >
                      {d} Days
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Next Billing / Trial Expiration Date */}
          <div>
            <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1 mb-1">
              <Calendar className="w-3.5 h-3.5 text-cyan-glow" />
              <span>{isFreeTrial ? 'Trial Ends On *' : 'Next Renewal Date *'}</span>
            </label>
            <input
              type="date"
              required
              value={nextBillingDate}
              onChange={(e) => setNextBillingDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-obsidian-950 border border-obsidian-700 text-white text-sm focus:outline-none focus:border-cyan-glow"
            />
          </div>

          {/* Cancellation URL */}
          <div>
            <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1 mb-1">
              <Link className="w-3.5 h-3.5 text-slate-400" />
              <span>Cancellation Link (Optional)</span>
            </label>
            <input
              type="url"
              placeholder="https://service.com/account/cancel"
              value={cancelUrl}
              onChange={(e) => setCancelUrl(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-obsidian-950 border border-obsidian-700 text-white text-xs focus:outline-none focus:border-cyan-glow"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-cyan-neon to-cyan-deep text-obsidian-950 font-bold text-sm shadow-glow-cyan hover:opacity-95 transition-opacity disabled:opacity-50 mt-2"
          >
            {submitting ? 'Saving...' : 'Save Subscription'}
          </button>
        </form>

      </div>
    </div>
  );
};
