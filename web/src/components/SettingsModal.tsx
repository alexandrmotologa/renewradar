import React, { useRef } from 'react';
import { X, Download, Upload, Shield, RefreshCw, FileSpreadsheet } from 'lucide-react';
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

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-obsidian-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-obsidian-900 border border-obsidian-700 shadow-2xl p-5">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-obsidian-700/80">
          <h2 className="text-base font-bold text-white">Settings & Data Portability</h2>
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
                RenewRadar never asks for bank credentials or third-party data aggregator connections. Your subscriptions stay in your local SQLite storage.
              </p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
