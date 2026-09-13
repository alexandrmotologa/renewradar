import React, { useState } from 'react';
import { 
  Bot, 
  Tv, 
  Cloud, 
  Dumbbell, 
  Sparkles, 
  ExternalLink, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Search,
  Users
} from 'lucide-react';
import { Category, Subscription } from '../types/index.js';
import { useTelegram } from '../hooks/useTelegram.js';

interface SubscriptionListProps {
  subscriptions: Subscription[];
  onSelectSubscription: (subscription: Subscription) => void;
  onDelete: (id: string) => Promise<boolean>;
  onUpdate: (id: string, updates: any) => Promise<boolean>;
}

export const SubscriptionList: React.FC<SubscriptionListProps> = ({
  subscriptions,
  onSelectSubscription,
  onDelete,
  onUpdate,
}) => {
  const { haptic } = useTelegram();
  const [activeTab, setActiveTab] = useState<'ALL' | 'TRIALS' | 'ARCHIVED' | Category>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const getCategoryIcon = (category: Category) => {
    switch (category) {
      case 'AI_TOOLS': return <Bot className="w-4 h-4 text-cyan-glow" />;
      case 'STREAMING': return <Tv className="w-4 h-4 text-purple-400" />;
      case 'WORK': return <Cloud className="w-4 h-4 text-blue-400" />;
      case 'FITNESS': return <Dumbbell className="w-4 h-4 text-emerald-400" />;
      default: return <Sparkles className="w-4 h-4 text-slate-400" />;
    }
  };

  const filteredSubscriptions = subscriptions.filter((sub) => {
    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchesName = sub.name.toLowerCase().includes(q);
      const matchesNotes = (sub.notes || '').toLowerCase().includes(q);
      if (!matchesName && !matchesNotes) return false;
    }

    if (activeTab === 'ARCHIVED') {
      return sub.status === 'CANCELLED' || sub.status === 'PAUSED';
    }

    // Otherwise exclude archived from regular tabs
    if (sub.status === 'CANCELLED') return false;

    if (activeTab === 'ALL') return true;
    if (activeTab === 'TRIALS') return sub.is_free_trial === 1;
    return sub.category === activeTab;
  });

  const now = Date.now();
  const hourMs = 60 * 60 * 1000;
  const dayMs = 24 * hourMs;

  return (
    <div className="space-y-3">
      
      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search subscriptions or notes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-3 py-2 rounded-2xl bg-obsidian-900 border border-obsidian-700/80 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-cyan-glow transition-colors"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
          >
            Clear
          </button>
        )}
      </div>

      {/* Category & Filter Tabs */}
      <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: 'ALL', label: 'All', count: subscriptions.filter(s => s.status === 'ACTIVE').length },
          { id: 'TRIALS', label: 'Free Trials', count: subscriptions.filter(s => s.is_free_trial === 1 && s.status === 'ACTIVE').length },
          { id: 'AI_TOOLS', label: 'AI', count: subscriptions.filter(s => s.category === 'AI_TOOLS' && s.status === 'ACTIVE').length },
          { id: 'STREAMING', label: 'Streaming', count: subscriptions.filter(s => s.category === 'STREAMING' && s.status === 'ACTIVE').length },
          { id: 'WORK', label: 'Work', count: subscriptions.filter(s => s.category === 'WORK' && s.status === 'ACTIVE').length },
          { id: 'FITNESS', label: 'Fitness', count: subscriptions.filter(s => s.category === 'FITNESS' && s.status === 'ACTIVE').length },
          { id: 'ARCHIVED', label: 'Archived', count: subscriptions.filter(s => s.status === 'CANCELLED').length },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              haptic('selection');
              setActiveTab(tab.id as any);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center space-x-1.5 ${
              activeTab === tab.id
                ? 'bg-cyan-500/20 text-cyan-glow border border-cyan-500/40 shadow-glow-cyan'
                : 'bg-obsidian-800/80 text-slate-400 hover:text-slate-200 border border-obsidian-700/60'
            }`}
          >
            <span>{tab.label}</span>
            {tab.count > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                activeTab === tab.id ? 'bg-cyan-400/30 text-white' : 'bg-obsidian-700 text-slate-400'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Subscription Cards List */}
      {filteredSubscriptions.length === 0 ? (
        <div className="rounded-3xl p-8 text-center glass-card border border-obsidian-700/60">
          <Clock className="w-8 h-8 text-slate-500 mx-auto mb-2" />
          <h4 className="text-sm font-semibold text-slate-300">No subscriptions found</h4>
          <p className="text-xs text-slate-400 mt-1">
            {searchQuery ? 'Try a different search term' : 'Tap the + Add button above to register your recurring services.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredSubscriptions.map((sub) => {
            const diffMs = sub.next_billing_date - now;
            const hoursRemaining = Math.max(0, Math.round(diffMs / hourMs));
            const daysRemaining = Math.max(0, Math.ceil(diffMs / dayMs));
            const isTrial = sub.is_free_trial === 1;
            const isUrgent = isTrial && hoursRemaining <= 48 && hoursRemaining > 0;
            const isCancelled = sub.status === 'CANCELLED';

            return (
              <div
                key={sub.id}
                onClick={() => {
                  haptic('light');
                  onSelectSubscription(sub);
                }}
                className={`relative overflow-hidden rounded-2xl p-3.5 glass-card cursor-pointer transition-all hover:border-cyan-glow/40 ${
                  isUrgent 
                    ? 'border-amber-500/60 alert-ring' 
                    : isCancelled
                    ? 'border-obsidian-800 opacity-75'
                    : 'border-obsidian-700/60'
                }`}
              >
                <div className="flex items-start justify-between">
                  {/* Service Details */}
                  <div className="flex items-start space-x-3 min-w-0">
                    <div className="w-10 h-10 rounded-2xl bg-obsidian-800 border border-obsidian-700 flex items-center justify-center shrink-0">
                      {getCategoryIcon(sub.category)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2">
                        <h3 className={`text-sm font-bold truncate ${isCancelled ? 'line-through text-slate-400' : 'text-white'}`}>
                          {sub.name}
                        </h3>
                        {isTrial && (
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${
                            isUrgent 
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
                              : 'bg-cyan-500/10 text-cyan-glow border-cyan-500/30'
                          }`}>
                            Free Trial
                          </span>
                        )}
                        {sub.shared_with_count > 1 && (
                          <span className="flex items-center space-x-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                            <Users className="w-2.5 h-2.5 mr-0.5" />
                            <span>1/{sub.shared_with_count}</span>
                          </span>
                        )}
                      </div>

                      {/* Renewal Countdown Badge */}
                      <div className="flex items-center space-x-1.5 mt-1 text-[11px]">
                        {isCancelled ? (
                          <span className="text-rose-400 font-medium">
                            Cancelled (Saved {sub.saved_amount} {sub.currency})
                          </span>
                        ) : isUrgent ? (
                          <span className="flex items-center text-amber-400 font-bold">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Expires in {hoursRemaining}h!
                          </span>
                        ) : (
                          <span className="text-slate-400">
                            Renews in {daysRemaining === 1 ? '1 day' : `${daysRemaining} days`}
                          </span>
                        )}
                        <span className="text-slate-600">&bull;</span>
                        <span className="text-slate-400 lowercase">{sub.billing_cycle}</span>
                      </div>
                    </div>
                  </div>

                  {/* Price and Actions */}
                  <div className="text-right shrink-0" onClick={(e) => e.stopPropagation()}>
                    <div className="text-sm font-extrabold text-white">
                      {sub.amount.toFixed(2)} {sub.currency}
                    </div>

                    <div className="flex items-center justify-end space-x-1 mt-1.5">
                      {isTrial && (
                        <button
                          onClick={() => {
                            haptic('medium');
                            onUpdate(sub.id, { is_free_trial: false });
                          }}
                          className="p-1 rounded-lg hover:bg-obsidian-700 text-slate-400 hover:text-emerald-400 transition-colors"
                          title="Keep subscription (mark as active)"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {sub.cancel_url && (
                        <a
                          href={sub.cancel_url}
                          target="_blank"
                          rel="noreferrer"
                          onClick={() => haptic('light')}
                          className="p-1 rounded-lg hover:bg-obsidian-700 text-slate-400 hover:text-cyan-glow transition-colors"
                          title="Open Cancellation Link"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}

                      <button
                        onClick={() => {
                          if (confirm(`Remove ${sub.name} from RenewRadar?`)) {
                            onDelete(sub.id);
                          }
                        }}
                        className="p-1 rounded-lg hover:bg-obsidian-700 text-slate-400 hover:text-rose-400 transition-colors"
                        title="Delete Subscription"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
