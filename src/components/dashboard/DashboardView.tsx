import React from 'react';
import { KPICards } from './KPICards';
import { FinancialOverviewChart } from './FinancialOverviewChart';
import { ExpenseCategoryDonut } from './ExpenseCategoryDonut';
import { DebtSummaryCard } from './DebtSummaryCard';
import { BudgetStatusCard } from './BudgetStatusCard';
import { RecentTransactions } from './RecentTransactions';
import { KeepAliveStatusBar } from '../common/KeepAliveStatusBar';
import { useFinance } from '../../context/FinanceContext';
import { AlertCircle, ArrowRight, TrendingUp, TrendingDown, HandCoins } from 'lucide-react';
import { formatCurrency } from '../../lib/formatters';

export const DashboardView: React.FC = () => {
  const { summary, settings, setActiveTab, setIsQuickAddOpen, setQuickAddType } = useFinance();

  const handleOpenQuick = (type: 'income' | 'expense' | 'debt') => {
    setQuickAddType(type);
    setIsQuickAddOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Real-time Anti-Sleep Heartbeat & Desktop App Bar */}
      <KeepAliveStatusBar />

      {/* Quick Action Buttons & CFO Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Moliyaviy Umumiy Holat</h3>
            <p className="text-xs text-slate-500">Kirim, chiqim va qarzlar holati</p>
          </div>
          <button
            onClick={() => setActiveTab('pro-analytics')}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 rounded-lg text-xs font-bold transition-all"
          >
            <span>CFO Reyting: {summary.financial_health_grade} ({summary.financial_health_score}/100)</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('pro-analytics')}
            className="flex sm:hidden items-center gap-1 px-2.5 py-1.5 bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-bold rounded-xl"
          >
            <span>Pro Tahlil</span>
          </button>

          <button
            onClick={() => handleOpenQuick('income')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-semibold rounded-xl transition-all"
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+ Daromad</span>
          </button>

          <button
            onClick={() => handleOpenQuick('expense')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold rounded-xl transition-all"
          >
            <TrendingDown className="w-3.5 h-3.5" />
            <span>+ Xarajat</span>
          </button>

          <button
            onClick={() => handleOpenQuick('debt')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 text-xs font-semibold rounded-xl transition-all"
          >
            <HandCoins className="w-3.5 h-3.5" />
            <span>+ Qarz</span>
          </button>
        </div>
      </div>

      {/* High Priority Alerts (Overdue debts) */}
      {summary.overdue_debts_count > 0 && (
        <div
          onClick={() => setActiveTab('debts')}
          className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between cursor-pointer hover:bg-rose-100/70 transition-all shadow-xs"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-100 text-rose-600 rounded-xl">
              <AlertCircle className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-rose-900">
                {summary.overdue_debts_count} ta qarzning qaytarish muddati o'tib ketgan!
              </h4>
              <p className="text-[11px] text-rose-700 mt-0.5">
                Muddati o'tgan summa:{' '}
                <span className="font-bold">{formatCurrency(summary.overdue_debts_amount, settings.currency)}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs font-bold text-rose-700">
            <span>Ko'rish</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>
      )}

      {/* 4 Essential Core KPI Cards + Compact indicators */}
      <KPICards />

      {/* Main Charts: Overview & Expense Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <FinancialOverviewChart />
        </div>
        <div>
          <ExpenseCategoryDonut />
        </div>
      </div>

      {/* Debt & Budget Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <DebtSummaryCard />
        <BudgetStatusCard />
      </div>

      {/* Recent Activity Log */}
      <RecentTransactions />
    </div>
  );
};
