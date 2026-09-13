import { useState } from 'react';
import { LayoutDashboard, Layers, Calendar, Plus } from 'lucide-react';
import { useSubscriptions } from './hooks/useSubscriptions.js';
import { useTelegram } from './hooks/useTelegram.js';
import { Header } from './components/Header.js';
import { BurnRateHero } from './components/BurnRateHero.js';
import { CategoryDonut } from './components/CategoryDonut.js';
import { SubscriptionList } from './components/SubscriptionList.js';
import { RenewalCalendar } from './components/RenewalCalendar.js';
import { AddSubscriptionModal } from './components/AddSubscriptionModal.js';
import { SettingsModal } from './components/SettingsModal.js';

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
    deleteSubscription,
    changeCurrency,
    exportData,
    importData,
  } = useSubscriptions();

  const [activeView, setActiveView] = useState<'DASHBOARD' | 'SUBSCRIPTIONS' | 'CALENDAR'>('DASHBOARD');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

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

            <CategoryDonut stats={stats} currency={currency} />

            {/* Quick Preview of Subscriptions */}
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
                  View all ({subscriptions.length})
                </button>
              </div>

              <SubscriptionList
                subscriptions={subscriptions.slice(0, 4)}
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

            <RenewalCalendar subscriptions={subscriptions} />
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
