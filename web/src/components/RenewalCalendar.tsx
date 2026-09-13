import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { Subscription } from '../types/index.js';
import { useTelegram } from '../hooks/useTelegram.js';

interface RenewalCalendarProps {
  subscriptions: Subscription[];
}

export const RenewalCalendar: React.FC<RenewalCalendarProps> = ({ subscriptions }) => {
  const { haptic } = useTelegram();
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Days in month
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Find renewals for each day of the month
  const getRenewalsForDay = (day: number) => {
    return subscriptions.filter((sub) => {
      const d = new Date(sub.next_billing_date);
      return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
    });
  };

  const handlePrevMonth = () => {
    haptic('selection');
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    haptic('selection');
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const selectedRenewals = selectedDay ? getRenewalsForDay(selectedDay) : [];

  return (
    <div className="rounded-3xl p-4 glass-card border border-obsidian-600/80">
      
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <CalendarIcon className="w-4 h-4 text-cyan-glow" />
          <span className="text-sm font-bold text-white">
            {monthNames[month]} {year}
          </span>
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={handlePrevMonth}
            className="p-1.5 rounded-xl bg-obsidian-800 hover:bg-obsidian-700 text-slate-300"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={handleNextMonth}
            className="p-1.5 rounded-xl bg-obsidian-800 hover:bg-obsidian-700 text-slate-300"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Day Labels */}
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-500 mb-2">
        <span>SU</span><span>MO</span><span>TU</span><span>WE</span><span>TH</span><span>FR</span><span>SA</span>
      </div>

      {/* Day Cells */}
      <div className="grid grid-cols-7 gap-1">
        {/* Empty cells before month start */}
        {Array.from({ length: firstDayIndex }).map((_, i) => (
          <div key={`empty-${i}`} className="h-9" />
        ))}

        {/* Days */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const renewals = getRenewalsForDay(day);
          const hasRenewals = renewals.length > 0;
          const hasTrial = renewals.some((r) => r.is_free_trial === 1);
          const isSelected = selectedDay === day;

          return (
            <button
              key={day}
              onClick={() => {
                haptic('light');
                setSelectedDay(day);
              }}
              className={`h-9 rounded-xl flex flex-col items-center justify-center text-xs font-semibold relative transition-all ${
                isSelected
                  ? 'bg-cyan-500/20 text-cyan-glow border border-cyan-500/50'
                  : hasRenewals
                  ? 'bg-obsidian-800 text-white hover:bg-obsidian-700'
                  : 'text-slate-400 hover:bg-obsidian-800/40'
              }`}
            >
              <span>{day}</span>
              {hasRenewals && (
                <span
                  className={`w-1.5 h-1.5 rounded-full absolute bottom-1 ${
                    hasTrial ? 'bg-amber-warning animate-pulse' : 'bg-cyan-glow'
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Selected Day Renewal Details */}
      {selectedDay && selectedRenewals.length > 0 && (
        <div className="mt-4 pt-3 border-t border-obsidian-700/80 animate-in fade-in">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
            Invoices on {monthNames[month]} {selectedDay}
          </span>
          <div className="space-y-1.5">
            {selectedRenewals.map((sub) => (
              <div
                key={sub.id}
                className="flex items-center justify-between p-2 rounded-xl bg-obsidian-950/70 border border-obsidian-700/60 text-xs"
              >
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-white">{sub.name}</span>
                  {sub.is_free_trial === 1 && (
                    <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold">
                      Trial Expiring
                    </span>
                  )}
                </div>
                <span className="font-mono font-bold text-cyan-glow">
                  {sub.amount.toFixed(2)} {sub.currency}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
