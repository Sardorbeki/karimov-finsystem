import React, { useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { isDateInRange } from '../../lib/calculations';
import { formatCurrency, formatDate } from '../../lib/formatters';
import { CategoryIcon } from '../common/CategoryIcon';

export const TopExpensesBar: React.FC = () => {
  const { expenses, categories, filterRange, settings } = useFinance();

  const topItems = useMemo(() => {
    const active = expenses.filter((e) => !e.is_deleted && isDateInRange(e.date, filterRange));
    return [...active]
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)
      .map((e) => {
        const cat = categories.find((c) => c.id === e.category_id);
        return {
          ...e,
          categoryName: cat?.name || 'Boshqa',
          categoryColor: cat?.color || '#94a3b8',
          categoryIcon: cat?.icon || 'Tag'
        };
      });
  }, [expenses, categories, filterRange]);

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
      <div className="mb-4">
        <h3 className="text-sm font-bold text-slate-900">Eng Katta Yakkalik Xarajatlar</h3>
        <p className="text-xs text-slate-500">Tanlangan davrdagi top 5 xarajatlar ro'yxati</p>
      </div>

      {topItems.length === 0 ? (
        <div className="h-44 flex items-center justify-center text-xs text-slate-400">
          Xarajatlar mavjud emas
        </div>
      ) : (
        <div className="space-y-3">
          {topItems.map((item, idx) => (
            <div key={item.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100/70 transition-colors">
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-5 text-center text-xs font-bold text-slate-400">#{idx + 1}</span>
                <div
                  className="p-2 rounded-lg text-white"
                  style={{ backgroundColor: item.categoryColor }}
                >
                  <CategoryIcon name={item.categoryIcon} className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-800 truncate">{item.description || item.categoryName}</p>
                  <p className="text-[10px] text-slate-400">{formatDate(item.date)} • {item.categoryName}</p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="text-xs font-bold text-rose-600">
                  -{formatCurrency(item.amount, settings.currency)}
                </span>
                <p className="text-[10px] text-slate-400">{item.payment_method}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
