import React, { useState, useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency, formatDate } from '../../lib/formatters';
import { TrendingUp, TrendingDown, HandCoins, ArrowRight, Search } from 'lucide-react';
import { CategoryIcon } from '../common/CategoryIcon';

export const RecentTransactions: React.FC = () => {
  const { incomes, expenses, debtPayments, debts, categories, settings, setActiveTab } = useFinance();
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense' | 'repayment'>('all');
  const [search, setSearch] = useState('');

  const transactions = useMemo(() => {
    const list: Array<{
      id: string;
      type: 'income' | 'expense' | 'repayment';
      date: string;
      title: string;
      categoryName: string;
      categoryIcon: string;
      categoryColor: string;
      amount: number;
      paymentMethod: string;
    }> = [];

    // Incomes
    incomes
      .filter((i) => !i.is_deleted)
      .forEach((i) => {
        const cat = categories.find((c) => c.id === i.category_id);
        list.push({
          id: i.id,
          type: 'income',
          date: i.date,
          title: i.description || cat?.name || 'Daromad',
          categoryName: cat?.name || 'Boshqa',
          categoryIcon: cat?.icon || 'TrendingUp',
          categoryColor: cat?.color || '#10b981',
          amount: i.amount,
          paymentMethod: i.payment_method
        });
      });

    // Expenses
    expenses
      .filter((e) => !e.is_deleted)
      .forEach((e) => {
        const cat = categories.find((c) => c.id === e.category_id);
        list.push({
          id: e.id,
          type: 'expense',
          date: e.date,
          title: e.description || cat?.name || 'Xarajat',
          categoryName: cat?.name || 'Boshqa',
          categoryIcon: cat?.icon || 'TrendingDown',
          categoryColor: cat?.color || '#ef4444',
          amount: e.amount,
          paymentMethod: e.payment_method
        });
      });

    // Debt repayments
    debtPayments.forEach((p) => {
      const parentDebt = debts.find((d) => d.id === p.debt_id);
      list.push({
        id: p.id,
        type: 'repayment',
        date: p.payment_date,
        title: `Qarz to'lovi: ${parentDebt ? parentDebt.counterparty : 'Hamkor'}`,
        categoryName: parentDebt ? (parentDebt.type === 'given' ? 'Qarz qaytarildi' : 'Qarz to\'landi') : 'Qarz',
        categoryIcon: 'HandCoins',
        categoryColor: parentDebt?.type === 'given' ? '#059669' : '#8b5cf6',
        amount: p.amount,
        paymentMethod: p.payment_method
      });
    });

    // Sort by date desc
    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [incomes, expenses, debtPayments, debts, categories]);

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      if (filterType !== 'all' && t.type !== filterType) return false;
      if (search) {
        const q = search.toLowerCase();
        const matchTitle = t.title.toLowerCase().includes(q);
        const matchCat = t.categoryName.toLowerCase().includes(q);
        if (!matchTitle && !matchCat) return false;
      }
      return true;
    });
  }, [transactions, filterType, search]);

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900">So'nggi Tranzaksiyalar Lentasi</h3>
          <p className="text-xs text-slate-500">Barcha daromad, xarajat va qarz qaytarishlari</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Qidirish..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 w-36 sm:w-44"
            />
          </div>

          {/* Type filters */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-medium">
            <button
              onClick={() => setFilterType('all')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                filterType === 'all' ? 'bg-white text-indigo-700 font-semibold shadow-xs' : 'text-slate-600'
              }`}
            >
              Barchasi
            </button>
            <button
              onClick={() => setFilterType('income')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                filterType === 'income' ? 'bg-white text-emerald-700 font-semibold shadow-xs' : 'text-slate-600'
              }`}
            >
              Daromad
            </button>
            <button
              onClick={() => setFilterType('expense')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                filterType === 'expense' ? 'bg-white text-rose-700 font-semibold shadow-xs' : 'text-slate-600'
              }`}
            >
              Xarajat
            </button>
          </div>
        </div>
      </div>

      <div className="divide-y divide-slate-100">
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            Tranzaksiyalar topilmadi
          </div>
        ) : (
          filtered.slice(0, 7).map((t) => {
            const isIncome = t.type === 'income';
            const isExpense = t.type === 'expense';

            return (
              <div key={t.id} className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50/70 px-2 rounded-xl transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="p-2.5 rounded-xl text-white shrink-0 shadow-xs"
                    style={{ backgroundColor: t.categoryColor }}
                  >
                    <CategoryIcon name={t.categoryIcon} className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">{t.title}</p>
                    <p className="text-[11px] text-slate-500">
                      {formatDate(t.date)} • {t.categoryName} • {t.paymentMethod}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span
                    className={`text-xs font-bold ${
                      isIncome
                        ? 'text-emerald-600'
                        : isExpense
                        ? 'text-rose-600'
                        : 'text-indigo-600'
                    }`}
                  >
                    {isIncome ? '+' : isExpense ? '-' : '⇄ '}{formatCurrency(t.amount, settings.currency)}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
