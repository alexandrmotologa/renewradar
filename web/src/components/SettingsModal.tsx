import React, { useRef, useState } from 'react';
import { X, Download, Upload, Shield, RefreshCw, FileSpreadsheet, Calendar, Bell, Check } from 'lucide-react';
import { Currency } from '../types/index.js';
import { useTelegram } from '../hooks/useTelegram.js';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currency: Currency;
  onCurrencyChange: (currency: Currency) => void;
  onExport: (format: 'json' | 'csv') => void;
  onImport: (items: any[]) => Promise<boolean>;
  onRefresh: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  currency,
  onCurrencyChange,
  onExport,
  onImport,
  onRefresh,
}) => {
  const { haptic } = useTelegram();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [copiedIcal, setCopiedIcal] = useState(false);
  const [selectedThresholds, setSelectedThresholds] = useState<number[]>([168, 48, 24, 2]);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        const subs = parsed.subscriptions || parsed;
        if (Array.isArray(subs)) {
          const ok = await onImport(subs);
          if (ok) {
            alert(`✓ Successfully restored ${subs.length} subscriptions!`);
            onClose();
          }
        }
      } catch (err) {
        alert('Invalid JSON backup file format.');
      }
    };
    reader.readAsText(file);
  };

  const handleDownloadIcs = () => {
    haptic('light');
    window.open('/api/calendar.ics', '_blank');
  };

  const handleCopyIcalUrl = () => {
    haptic('medium');
    const icalUrl = `${window.location.origin}/api/calendar.ics`;
    navigator.clipboard.writeText(icalUrl);
    setCopiedIcal(true);
    setTimeout(() => setCopiedIcal(false), 2000);
  };

  const toggleThreshold = (hours: number) => {
    haptic('selection');
    if (selectedThresholds.includes(hours)) {
      setSelectedThresholds(selectedThresholds.filter(h => h !== hours));
    } else {
      setSelectedThresholds([...selectedThresholds, hours]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-obsidian-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-obsidian-900 border border-obsidian-700 shadow-2xl p-5">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-obsidian-700/80">
          <h2 className="text-base font-bold text-white">Settings & Integrations</h2>
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
          
          {/* Display Currency */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1.5">
              Default Display Currency
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {(['EUR', 'USD', 'RON', 'GBP'] as Currency[]).map((curr) => (
                <button
                  key={curr}
                  onClick={() => onCurrencyChange(curr)}
                  className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                    currency === curr
                      ? 'bg-gradient-to-r from-cyan-neon to-cyan-deep text-obsidian-950 border-transparent shadow-sm'
                      : 'bg-obsidian-800 text-slate-300 border-obsidian-700 hover:bg-obsidian-700'
                  }`}
                >
                  {curr}
                </button>
              ))}
            </div>
          </div>

          {/* Calendar Sync Integration */}
          <div className="pt-2 border-t border-obsidian-800">
            <div className="flex items-center space-x-2 mb-1.5">
              <Calendar className="w-4 h-4 text-cyan-glow" />
              <label className="text-xs font-bold text-slate-300">
                Apple & Google Calendar Sync (.ics)
              </label>
            </div>
            <p className="text-[11px] text-slate-400 mb-2">
              Subscribe once to see all renewal dates and alarms directly in your calendar.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleDownloadIcs}
                className="py-2 px-3 rounded-xl bg-obsidian-800 hover:bg-obsidian-700 text-slate-200 border border-obsidian-700 text-xs font-semibold flex items-center justify-center space-x-1.5"
              >
                <Download className="w-3.5 h-3.5 text-cyan-glow" />
                <span>Download .ics</span>
              </button>
              <button
                onClick={handleCopyIcalUrl}
                className="py-2 px-3 rounded-xl bg-obsidian-800 hover:bg-obsidian-700 text-slate-200 border border-obsidian-700 text-xs font-semibold flex items-center justify-center space-x-1.5"
              >
                {copiedIcal ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Calendar className="w-3.5 h-3.5 text-cyan-glow" />}
                <span>{copiedIcal ? 'Copied URL!' : 'Copy Feed URL'}</span>
              </button>
            </div>
          </div>

          {/* Watchdog Alert Threshold Preferences */}
          <div className="pt-2 border-t border-obsidian-800">
            <div className="flex items-center space-x-2 mb-1.5">
              <Bell className="w-4 h-4 text-amber-warning" />
              <label className="text-xs font-bold text-slate-300">
                Watchdog Alert Schedule
              </label>
            </div>
            <p className="text-[11px] text-slate-400 mb-2">
              Select when you want high-priority Telegram warnings before a trial expires:
            </p>
            <div className="flex items-center space-x-1.5">
              {[
                { h: 168, label: '7d' },
                { h: 72, label: '3d' },
                { h: 48, label: '48h' },
                { h: 24, label: '24h' },
                { h: 2, label: '2h' },
              ].map((th) => {
                const isSelected = selectedThresholds.includes(th.h);
                return (
                  <button
                    key={th.h}
                    onClick={() => toggleThreshold(th.h)}
                    className={`flex-1 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                      isSelected
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                        : 'bg-obsidian-800 text-slate-400 border-obsidian-700'
                    }`}
                  >
                    {th.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Backup & Export */}
          <div className="pt-2 border-t border-obsidian-800">
            <label className="text-xs font-bold text-slate-300 block mb-2">
              Data Ownership & Portability
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onExport('json')}
                className="flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-xl bg-obsidian-800 hover:bg-obsidian-700 text-slate-200 border border-obsidian-700 text-xs font-semibold transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-cyan-glow" />
                <span>Export JSON</span>
              </button>

              <button
                onClick={() => onExport('csv')}
                className="flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-xl bg-obsidian-800 hover:bg-obsidian-700 text-slate-200 border border-obsidian-700 text-xs font-semibold transition-colors"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                <span>Export CSV</span>
              </button>
            </div>

            {/* Import JSON */}
            <input
              type="file"
              accept=".json"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => {
                haptic('medium');
                fileInputRef.current?.click();
              }}
              className="w-full mt-2 flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-xl bg-obsidian-800 hover:bg-obsidian-700 text-slate-200 border border-obsidian-700 text-xs font-semibold transition-colors"
            >
              <Upload className="w-3.5 h-3.5 text-cyan-glow" />
              <span>Restore from Backup (JSON)</span>
            </button>
          </div>

          {/* Sync & Refresh */}
          <div className="pt-2 border-t border-obsidian-800">
            <button
              onClick={() => {
                haptic('light');
                onRefresh();
              }}
              className="w-full flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl bg-obsidian-950 text-slate-400 hover:text-white border border-obsidian-800 text-xs font-medium transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Sync with Server</span>
            </button>
          </div>

          {/* Privacy Footnote */}
          <div className="p-3 rounded-2xl bg-obsidian-950/60 border border-obsidian-800 flex items-start space-x-2 text-[11px] text-slate-400">
            <Shield className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-300">Zero-Banking Privacy</span>
              <p className="mt-0.5 text-[10px] text-slate-500">
                RenewRadar never asks for bank credentials. Your data is stored locally in your SQLite database.
              </p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
