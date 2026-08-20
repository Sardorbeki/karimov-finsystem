import React, { useState } from 'react';
import { PeriodFilter } from '../../types';
import { Calendar, Check } from 'lucide-react';

interface DateRangeSelectorProps {
  currentPeriod: PeriodFilter;
  startDate: string;
  endDate: string;
  onPeriodChange: (period: PeriodFilter, customStart?: string, customEnd?: string) => void;
}

export const DateRangeSelector: React.FC<DateRangeSelectorProps> = ({
  currentPeriod,
  startDate,
  endDate,
  onPeriodChange
}) => {
  const [isCustomOpen, setIsCustomOpen] = useState(false);
  const [customStart, setCustomStart] = useState(startDate);
  const [customEnd, setCustomEnd] = useState(endDate);

  const periods: Array<{ id: PeriodFilter; label: string }> = [
    { id: 'today', label: 'Bugun' },
    { id: 'this_week', label: 'Shu hafta' },
    { id: 'this_month', label: 'Shu oy' },
    { id: 'last_30_days', label: "So'nggi 30 kun" },
    { id: 'this_year', label: 'Shu yil' },
    { id: 'all', label: 'Barchasi' }
  ];

  const handleCustomApply = () => {
    if (customStart && customEnd) {
      onPeriodChange('custom', customStart, customEnd);
      setIsCustomOpen(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200/80">
      {periods.map((p) => {
        const isActive = currentPeriod === p.id && !isCustomOpen;
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => {
              setIsCustomOpen(false);
              onPeriodChange(p.id);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              isActive
                ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            {p.label}
          </button>
        );
      })}

      <div className="relative">
        <button
          type="button"
          onClick={() => setIsCustomOpen(!isCustomOpen)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            currentPeriod === 'custom' || isCustomOpen
              ? 'bg-white text-indigo-700 shadow-xs font-semibold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Boshqa davr</span>
        </button>

        {isCustomOpen && (
          <div className="absolute right-0 top-full mt-2 z-30 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 p-4 animate-in fade-in slide-in-from-top-2">
            <h4 className="text-xs font-semibold text-slate-800 uppercase tracking-wider mb-3">
              Oraliq sanani tanlang
            </h4>
            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Boshlanish sanasi</label>
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-800"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Tugash sanasi</label>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-800"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsCustomOpen(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Yopish
              </button>
              <button
                type="button"
                onClick={handleCustomApply}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors"
              >
                <Check className="w-3.5 h-3.5" />
                Qo'llash
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
