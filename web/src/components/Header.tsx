import React from 'react';
import { Settings, Plus, ShieldCheck } from 'lucide-react';
import { useTelegram } from '../hooks/useTelegram.js';

interface HeaderProps {
  onOpenAddModal: () => void;
  onOpenSettingsModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenAddModal, onOpenSettingsModal }) => {
  const { user, isTelegram, haptic } = useTelegram();

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-obsidian-600/60 px-4 py-3">
      <div className="max-w-md mx-auto flex items-center justify-between">
        
        {/* Brand & Mascot Emblem */}
        <div className="flex items-center space-x-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-2xl bg-obsidian-800 border border-obsidian-600/80 shadow-glow-cyan overflow-hidden group">
            <img 
              src="/logo.svg" 
              alt="RenewRadar Owl" 
              className="w-8 h-8 object-contain transition-transform duration-300 group-hover:scale-110" 
            />
            <div className="absolute inset-0 rounded-2xl border border-cyan-glow/20 pointer-events-none" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="text-base font-bold tracking-tight text-white">RenewRadar</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-glow border border-cyan-500/20">
                Active
              </span>
            </div>
            <div className="flex items-center space-x-1 text-[11px] text-slate-400">
              <ShieldCheck className="w-3 h-3 text-cyan-400" />
              <span>{isTelegram ? `@${user.username || user.first_name}` : 'Sandbox Operator'}</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              haptic('light');
              onOpenSettingsModal();
            }}
            className="p-2 rounded-xl bg-obsidian-800/80 hover:bg-obsidian-700 text-slate-300 hover:text-white border border-obsidian-600 transition-colors"
            title="Settings & Export"
          >
            <Settings className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              haptic('medium');
              onOpenAddModal();
            }}
            className="flex items-center space-x-1 px-3 py-2 rounded-xl bg-gradient-to-r from-cyan-neon to-cyan-deep text-obsidian-950 font-semibold text-xs shadow-glow-cyan hover:opacity-95 transition-opacity"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add</span>
          </button>
        </div>

      </div>
    </header>
  );
};
