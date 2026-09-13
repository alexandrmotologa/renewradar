import { useState } from 'react';
import { LayoutDashboard, Layers, Calendar, Plus } from 'lucide-react';
import { useSubscriptions } from './hooks/useSubscriptions.js';
import { useTelegram } from './hooks/useTelegram.js';
import { Header } from './components/Header.js';
import { BurnRateHero } from './components/BurnRateHero.js';
import { LifetimeSavedBanner } from './components/LifetimeSavedBanner.js';
import { GhostHunterCard } from './components/GhostHunterCard.js';
import { CategoryDonut } from './components/CategoryDonut.js';
import { SubscriptionList } from './components/SubscriptionList.js';
import { RenewalCalendar } from './components/RenewalCalendar.js';
import { AddSubscriptionModal } from './components/AddSubscriptionModal.js';
import { SubscriptionDetailModal } from './components/SubscriptionDetailModal.js';
import { SettingsModal } from './components/SettingsModal.js';
import { Subscription } from './types/index.js';

export function App() {
  const { haptic } = useTelegram();
  const {
    subscriptions,
    stats,
    presets,
    currency,
    loading,
    error,
    refresh,
    addSubscription,
    updateSubscription,
    cancelSubscription,
    reactivateSubscription,
    deleteSubscription,
    changeCurrency,
    exportData,
    importData,
  } = useSubscriptions();

  const [activeView, setActiveView] = useState<'DASHBOARD' | 'SUBSCRIPTIONS' | 'CALENDAR'>('DASHBOARD');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);

  return (
    <div className="min-h-screen bg-obsidian-950 text-slate-100 flex flex-col pb-20">
      
      {/* Top Header */}
      <Header
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
      />

      {/* Top Loading Indicator */}
      {loading && (
        <div className="w-full h-0.5 bg-obsidian-950 overflow-hidden">
          <div className="w-1/2 h-full bg-cyan-glow animate-pulse" />
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 w-full max-w-md mx-auto px-4 py-4 space-y-4">
        
        {/* Error notification */}
        {error && (
          <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
            {error}
          </div>
        )}

        {/* View 1: DASHBOARD */}
        {activeView === 'DASHBOARD' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <BurnRateHero
              stats={stats}
              currentCurrency={currency}
              onCurrencyChange={changeCurrency}
            />

            {/* Lifetime Money Saved Banner */}
            {stats && stats.lifetime_saved > 0 && (
              <LifetimeSavedBanner
                amount={stats.lifetime_saved}
                currency={currency}
                onViewArchived={() => {
                  haptic('selection');
                  setActiveView('SUBSCRIPTIONS');
                }}
              />
            )}

            {/* Ghost Hunter Redundancy Detector */}
            {stats && stats.ghost_recommendations && stats.ghost_recommendations.length > 0 && (
              <GhostHunterCard
                recommendations={stats.ghost_recommendations}
                currency={currency}
                onInspectCategory={() => {
                  haptic('selection');
                  setActiveView('SUBSCRIPTIONS');
                }}
              />
            )}

            <CategoryDonut stats={stats} currency={currency} />

            {/* Active Subscriptions Quick List */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Active Services
                </span>
                <button
                  onClick={() => {
                    haptic('selection');
                    setActiveView('SUBSCRIPTIONS');
                  }}
                  className="text-xs font-semibold text-cyan-glow hover:underline"
                >
                  View all ({subscriptions.filter(s => s.status === 'ACTIVE').length})
                </button>
              </div>

              <SubscriptionList
                subscriptions={subscriptions}
                onSelectSubscription={(sub) => setSelectedSubscription(sub)}
                onDelete={deleteSubscription}
                onUpdate={updateSubscription}
              />
            </div>
          </div>
        )}

        {/* View 2: SUBSCRIPTIONS */}
        {activeView === 'SUBSCRIPTIONS' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">All Subscriptions</h2>
                <p className="text-xs text-slate-400">Manage and track your recurring expenses</p>
              </div>
              <button
                onClick={() => {
                  haptic('medium');
                  setIsAddModalOpen(true);
                }}
                className="p-2 rounded-xl bg-cyan-500/20 text-cyan-glow border border-cyan-500/40"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <SubscriptionList
              subscriptions={subscriptions}
              onSelectSubscription={(sub) => setSelectedSubscription(sub)}
              onDelete={deleteSubscription}
              onUpdate={updateSubscription}
            />
          </div>
        )}

        {/* View 3: CALENDAR */}
        {activeView === 'CALENDAR' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div>
              <h2 className="text-lg font-bold text-white">Renewal Calendar</h2>
              <p className="text-xs text-slate-400">Upcoming invoice dates across all services</p>
            </div>

            <RenewalCalendar subscriptions={subscriptions.filter(s => s.status === 'ACTIVE')} />
          </div>
        )}

      </main>

      {/* Bottom Navigation Dock */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 glass-panel border-t border-obsidian-700/80 px-4 py-2">
        <div className="max-w-md mx-auto grid grid-cols-3 gap-1">
          
          <button
            onClick={() => {
              haptic('selection');
              setActiveView('DASHBOARD');
            }}
            className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition-all ${
              activeView === 'DASHBOARD'
                ? 'text-cyan-glow font-bold'
                : 'text-slate-400 hover:text-slate-200 font-medium'
            }`}
          >
            <LayoutDashboard className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">Dashboard</span>
          </button>

          <button
            onClick={() => {
              haptic('selection');
              setActiveView('SUBSCRIPTIONS');
            }}
            className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition-all ${
              activeView === 'SUBSCRIPTIONS'
                ? 'text-cyan-glow font-bold'
                : 'text-slate-400 hover:text-slate-200 font-medium'
            }`}
          >
            <Layers className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">Services</span>
          </button>

          <button
            onClick={() => {
              haptic('selection');
              setActiveView('CALENDAR');
            }}
            className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition-all ${
              activeView === 'CALENDAR'
                ? 'text-cyan-glow font-bold'
                : 'text-slate-400 hover:text-slate-200 font-medium'
            }`}
          >
            <Calendar className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">Calendar</span>
          </button>

        </div>
      </nav>

      {/* Modals */}
      <AddSubscriptionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={addSubscription}
        presets={presets}
        defaultCurrency={currency}
      />

      <SubscriptionDetailModal
        subscription={selectedSubscription}
        isOpen={Boolean(selectedSubscription)}
        onClose={() => setSelectedSubscription(null)}
        onUpdate={updateSubscription}
        onCancelSub={cancelSubscription}
        onReactivateSub={reactivateSubscription}
        onDelete={deleteSubscription}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        currency={currency}
        onCurrencyChange={changeCurrency}
        onExport={exportData}
        onImport={importData}
        onRefresh={refresh}
      />

    </div>
  );
}

export default App;
