import React from 'react';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency, formatPercentage } from '../../lib/formatters';
import { PiggyBank, ArrowRight } from 'lucide-react';
import { CategoryIcon } from '../common/CategoryIcon';

export const BudgetStatusCard: React.FC = () => {
  const { budgets, settings, setActiveTab } = useFinance();

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <PiggyBank className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">Joriy Oy Byudjet Sarfi</h3>
          </div>
          <button
            onClick={() => setActiveTab('budgets')}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
          >
            Barchasi <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {budgets.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            Ushbu oy uchun byudjet limitlari belgilanmagan.
          </div>
        ) : (
          <div className="space-y-3.5">
            {budgets.slice(0, 4).map((b) => {
              const usage = Math.min(b.usage_percentage, 100);
              const isExceeded = b.status === 'exceeded';
              const isWarning = b.status === 'warning';

              return (
                <div key={b.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className="p-1 rounded-md text-white shrink-0"
                        style={{ backgroundColor: b.category_color }}
                      >
                        <CategoryIcon name={b.category_icon} className="w-3 h-3" />
                      </div>
                      <span className="font-semibold text-slate-800 truncate">{b.category_name}</span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`font-bold ${isExceeded ? 'text-rose-600' : isWarning ? 'text-amber-600' : 'text-slate-900'}`}>
                        {formatCurrency(b.spent_amount, settings.currency)}
                      </span>
                      <span className="text-[10px] text-slate-400"> / {formatCurrency(b.limit_amount, settings.currency)}</span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isExceeded
                          ? 'bg-rose-500'
                          : isWarning
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${usage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
