import React from 'react';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency, formatDate, getDebtStatusLabel } from '../../lib/formatters';
import { HandCoins, ArrowRight, AlertCircle, CheckCircle } from 'lucide-react';

export const DebtSummaryCard: React.FC = () => {
  const { debts, settings, setActiveTab } = useFinance();

  const activeDebts = debts.filter((d) => !d.is_deleted && d.remaining_amount > 0);
  const overdueDebts = activeDebts.filter((d) => d.is_overdue);

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <HandCoins className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">Faol Qarzlar Xulosasi</h3>
          </div>
          <button
            onClick={() => setActiveTab('debts')}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
          >
            Barchasi <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {overdueDebts.length > 0 && (
          <div className="mb-3 p-2.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-xs font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>
              {overdueDebts.length} ta qarzning qaytarish muddati o'tib ketgan!
            </span>
          </div>
        )}

        <div className="space-y-2.5">
          {activeDebts.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs flex flex-col items-center">
              <CheckCircle className="w-8 h-8 text-emerald-400 mb-1" />
              <span>Barcha qarzlar to'langan! Faol qarzlar yo'q.</span>
            </div>
          ) : (
            activeDebts.slice(0, 4).map((d) => {
              const statusInfo = getDebtStatusLabel(d.computed_status);
              return (
                <div
                  key={d.id}
                  onClick={() => setActiveTab('debts')}
                  className="p-2.5 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100/80 transition-colors cursor-pointer flex items-center justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-800 truncate">{d.counterparty}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium ${
                          d.type === 'given' ? 'bg-amber-100 text-amber-800' : 'bg-purple-100 text-purple-800'
                        }`}
                      >
                        {d.type === 'given' ? 'Berilgan' : 'Olingan'}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Muddat: {formatDate(d.due_date)}{' '}
                      {d.is_overdue && (
                        <span className="text-rose-600 font-bold">({d.overdue_days} kun o'tdi)</span>
                      )}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-bold text-slate-900">
                      {formatCurrency(d.remaining_amount, settings.currency)}
                    </span>
                    <p className="text-[10px] text-slate-400">
                      Dastlabki: {formatCurrency(d.initial_amount, settings.currency)}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
