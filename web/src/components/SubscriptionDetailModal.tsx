import React, { useState } from 'react';
import { 
  X, 
  ExternalLink, 
  Trash2, 
  Users, 
  Calendar, 
  ShieldAlert, 
  CheckCircle2, 
  RotateCcw,
  Smartphone,
  Globe
} from 'lucide-react';
import { Subscription } from '../types/index.js';
import { useTelegram } from '../hooks/useTelegram.js';

interface SubscriptionDetailModalProps {
  subscription: Subscription | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (id: string, updates: any) => Promise<boolean>;
  onCancelSub: (id: string, savedAmount?: number) => Promise<boolean>;
  onReactivateSub: (id: string) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
}

export const SubscriptionDetailModal: React.FC<SubscriptionDetailModalProps> = ({
  subscription,
  isOpen,
  onClose,
  onUpdate,
  onCancelSub,
  onReactivateSub,
  onDelete,
}) => {
  const { haptic } = useTelegram();
  const [splitCount, setSplitCount] = useState<number>(subscription?.shared_with_count || 1);
  const [isEditingSplit, setIsEditingSplit] = useState(false);

  if (!isOpen || !subscription) return null;

  const isCancelled = subscription.status === 'CANCELLED';
  const isTrial = subscription.is_free_trial === 1;

  const now = Date.now();
  const diffMs = subscription.next_billing_date - now;
  const daysRemaining = Math.max(0, Math.ceil(diffMs / (24 * 60 * 60 * 1000)));

  const handleUpdateSplit = async () => {
    haptic('medium');
    await onUpdate(subscription.id, { shared_with_count: splitCount });
    setIsEditingSplit(false);
  };

  const handleCancelClick = async () => {
    haptic('warning');
    const monthlyVal = subscription.amount;
    const defaultSaved = Number((monthlyVal * 3).toFixed(2));
    if (confirm(`Mark ${subscription.name} as Cancelled? This will record ${defaultSaved} ${subscription.currency} to your Lifetime Money Saved counter!`)) {
      await onCancelSub(subscription.id, defaultSaved);
      onClose();
    }
  };

  const handleReactivateClick = async () => {
    haptic('medium');
    await onReactivateSub(subscription.id);
    onClose();
  };

  const handleDeleteClick = async () => {
    haptic('heavy');
    if (confirm(`Permanently delete ${subscription.name} from your records?`)) {
      await onDelete(subscription.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-obsidian-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-obsidian-900 border border-obsidian-700 shadow-2xl p-5">
        
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-obsidian-700/80">
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-bold text-white">{subscription.name}</h2>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                isCancelled
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  : isTrial
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              }`}>
                {subscription.status}
              </span>
            </div>
            <span className="text-xs text-slate-400 capitalize">{subscription.category.toLowerCase().replace('_', ' ')}</span>
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

        <div className="space-y-4 my-4">
          
          {/* Price & Billing Cycle Card */}
          <div className="p-4 rounded-2xl bg-obsidian-950/80 border border-obsidian-700/60 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Billing Rate
              </span>
              <div className="flex items-baseline space-x-1.5 mt-0.5">
                <span className="text-2xl font-extrabold text-white">
                  {subscription.amount.toFixed(2)}
                </span>
                <span className="text-sm font-bold text-cyan-glow">
                  {subscription.currency}
                </span>
                <span className="text-xs text-slate-400 lowercase">/ {subscription.billing_cycle}</span>
              </div>
            </div>

            <div className="text-right">
              <div className="flex items-center space-x-1 text-xs text-slate-400">
                <Calendar className="w-3.5 h-3.5 text-cyan-glow" />
                <span>{isCancelled ? 'Cancelled on' : 'Renews in'}</span>
              </div>
              <span className="text-xs font-bold text-slate-200 mt-0.5 block">
                {isCancelled ? 'N/A' : `${daysRemaining} days`}
              </span>
            </div>
          </div>

          {/* Family / Shared Split Box */}
          <div className="p-3.5 rounded-2xl bg-obsidian-950/60 border border-obsidian-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-cyan-glow" />
                <span className="text-xs font-bold text-slate-200">Cost Sharing / Family Split</span>
              </div>
              {!isEditingSplit && (
                <button
                  onClick={() => setIsEditingSplit(true)}
                  className="text-xs font-semibold text-cyan-glow hover:underline"
                >
                  Edit
                </button>
              )}
            </div>

            {isEditingSplit ? (
              <div className="flex items-center space-x-2 mt-2.5">
                <span className="text-xs text-slate-400">Split between</span>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={splitCount}
                  onChange={(e) => setSplitCount(parseInt(e.target.value, 10) || 1)}
                  className="w-16 px-2 py-1 rounded-lg bg-obsidian-800 border border-obsidian-700 text-white text-xs text-center font-bold"
                />
                <span className="text-xs text-slate-400">people</span>
                <button
                  onClick={handleUpdateSplit}
                  className="px-2.5 py-1 rounded-lg bg-cyan-500/20 text-cyan-glow text-xs font-bold border border-cyan-500/40"
                >
                  Save
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between mt-2 text-xs text-slate-400">
                <span>
                  {subscription.shared_with_count > 1
                    ? `Shared with ${subscription.shared_with_count} people`
                    : 'Personal subscription (not shared)'}
                </span>
                {subscription.shared_with_count > 1 && (
                  <span className="font-bold text-emerald-400">
                    Your share: {(subscription.amount / subscription.shared_with_count).toFixed(2)} {subscription.currency}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Anti-Dark-Pattern Cancellation Shield */}
          <div className="p-4 rounded-2xl bg-gradient-to-b from-obsidian-800 to-obsidian-900 border border-obsidian-700">
            <div className="flex items-center space-x-2 mb-2">
              <ShieldAlert className="w-4 h-4 text-amber-warning" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-200">
                Anti-Dark-Pattern Cancellation Shield
              </h3>
            </div>

            {/* Platform Badge */}
            <div className="flex items-center space-x-1.5 mb-2.5">
              {subscription.platform === 'APPLE' ? (
                <span className="flex items-center space-x-1 text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-200 border border-slate-700">
                  <Smartphone className="w-3 h-3 text-cyan-glow" />
                  <span>Apple Subscriptions</span>
                </span>
              ) : subscription.platform === 'GOOGLE' ? (
                <span className="flex items-center space-x-1 text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-200 border border-slate-700">
                  <Smartphone className="w-3 h-3 text-emerald-400" />
                  <span>Google Play</span>
                </span>
              ) : (
                <span className="flex items-center space-x-1 text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-200 border border-slate-700">
                  <Globe className="w-3 h-3 text-blue-400" />
                  <span>Web Portal</span>
                </span>
              )}
            </div>

            {/* Step-by-Step Instructions */}
            {subscription.cancellation_steps ? (
              <div className="p-3 rounded-xl bg-obsidian-950/80 border border-obsidian-800 text-xs text-slate-300 font-mono whitespace-pre-line leading-relaxed mb-3">
                {subscription.cancellation_steps}
              </div>
            ) : (
              <p className="text-xs text-slate-400 mb-3">
                No custom cancellation steps saved. Open the direct cancellation link below.
              </p>
            )}

            {/* Direct Cancellation URL */}
            {subscription.cancel_url && (
              <a
                href={subscription.cancel_url}
                target="_blank"
                rel="noreferrer"
                onClick={() => haptic('light')}
                className="w-full flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl bg-obsidian-950 hover:bg-obsidian-800 text-cyan-glow border border-cyan-500/30 text-xs font-bold transition-all"
              >
                <span>Open Direct Cancellation Portal</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>

          {/* Notes */}
          {subscription.notes && (
            <div className="p-3 rounded-2xl bg-obsidian-950/60 border border-obsidian-800 text-xs text-slate-400">
              <span className="font-semibold text-slate-300 block mb-0.5">Notes:</span>
              {subscription.notes}
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2 pt-2">
            {!isCancelled ? (
              <button
                onClick={handleCancelClick}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500/20 to-rose-500/20 text-amber-300 hover:text-amber-200 border border-amber-500/40 font-bold text-xs flex items-center justify-center space-x-2 transition-all"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Mark as Cancelled & Record Savings</span>
              </button>
            ) : (
              <button
                onClick={handleReactivateClick}
                className="w-full py-3 rounded-2xl bg-emerald-500/20 text-emerald-300 hover:text-emerald-200 border border-emerald-500/40 font-bold text-xs flex items-center justify-center space-x-2 transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reactivate Subscription</span>
              </button>
            )}

            <button
              onClick={handleDeleteClick}
              className="w-full py-2.5 rounded-2xl bg-obsidian-800 hover:bg-obsidian-700 text-slate-400 hover:text-rose-400 border border-obsidian-700 text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Permanently</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
