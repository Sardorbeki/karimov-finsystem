import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Percent,
  PiggyBank,
  Calculator
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency, formatPercentage } from '../../lib/formatters';

export const KPICards: React.FC = () => {
  const { summary, settings, setActiveTab } = useFinance();

  return (
    <div className="space-y-2.5 font-sans">
      {/* 4 Main Core Excel KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Balance Card (Net Balance) */}
        <div
          id="kpi_balance"
          onClick={() => setActiveTab('reports')}
          className="bg-white p-3.5 sm:p-4 rounded-lg border-2 border-[#107c41] shadow-xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wide">
              Joriy Balans (Sof Qoldiq)
            </span>
            <div className="px-1.5 py-0.5 rounded bg-[#e8f4ed] text-[#107c41] text-[10px] font-mono font-bold">
              =DAROMAD-XARAJAT
            </div>
          </div>
          <div>
            <div className={`text-xl sm:text-2xl font-bold tracking-tight font-mono ${summary.net_balance >= 0 ? 'text-[#107c41]' : 'text-[#c5221f]'}`}>
              {formatCurrency(summary.net_balance, settings.currency)}
            </div>
            <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#107c41]"></span>
              <span>Erkin tasarrufdagi sof mablag'</span>
            </p>
          </div>
        </div>

        {/* Income Card */}
        <div
          id="kpi_income"
          onClick={() => setActiveTab('incomes')}
          className="bg-white p-3.5 sm:p-4 rounded-lg border border-[#cbd5e1] hover:border-[#107c41] shadow-xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wide">
              Jami Daromad
            </span>
            <div className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-mono font-bold">
              =SUM(Kirimlar)
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold text-[#107c41] tracking-tight font-mono">
              +{formatCurrency(summary.total_income, settings.currency)}
            </div>
            <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>Barcha kirim operatsiyalari</span>
            </p>
          </div>
        </div>

        {/* Expense Card */}
        <div
          id="kpi_expense"
          onClick={() => setActiveTab('expenses')}
          className="bg-white p-3.5 sm:p-4 rounded-lg border border-[#cbd5e1] hover:border-rose-400 shadow-xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wide">
              Jami Xarajat
            </span>
            <div className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 text-[10px] font-mono font-bold">
              =SUM(Chiqimlar)
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold text-[#c5221f] tracking-tight font-mono">
              -{formatCurrency(summary.total_expense, settings.currency)}
            </div>
            <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-rose-500"></span>
              <span>Barcha chiqim operatsiyalari</span>
            </p>
          </div>
        </div>

        {/* Debt Given Remaining Card */}
        <div
          id="kpi_debt_given"
          onClick={() => setActiveTab('debts')}
          className="bg-white p-3.5 sm:p-4 rounded-lg border border-[#cbd5e1] hover:border-amber-400 shadow-xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wide">
              Qarzlar Qoldig'i
            </span>
            <div className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 text-[10px] font-mono font-bold">
              =Qoldiq
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight font-mono">
              {formatCurrency(summary.total_debt_given_remaining, settings.currency)}
            </div>
            <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500"></span>
              <span>Qaytarilishi kutilayotgan summa</span>
            </p>
          </div>
        </div>
      </div>

      {/* Secondary Compact Spreadsheet Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <div
          onClick={() => setActiveTab('reports')}
          className="px-3 py-2 bg-white border border-[#cbd5e1] rounded flex items-center justify-between cursor-pointer hover:bg-emerald-50/50 transition-colors"
        >
          <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
            <Percent className="w-3.5 h-3.5 text-[#107c41]" />
            <span>Tejash koeffitsiyenti:</span>
          </div>
          <span className="font-bold text-[#107c41] font-mono">{formatPercentage(summary.savings_rate)}</span>
        </div>

        <div
          onClick={() => setActiveTab('budgets')}
          className="px-3 py-2 bg-white border border-[#cbd5e1] rounded flex items-center justify-between cursor-pointer hover:bg-emerald-50/50 transition-colors"
        >
          <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
            <PiggyBank className="w-3.5 h-3.5 text-[#107c41]" />
            <span>Byudjet ijrosi:</span>
          </div>
          <span className="font-bold text-slate-900 font-mono">{formatPercentage(summary.budget_usage_total_percent)}</span>
        </div>

        <div
          onClick={() => setActiveTab('debts')}
          className="px-3 py-2 bg-white border border-[#cbd5e1] rounded flex items-center justify-between cursor-pointer hover:bg-emerald-50/50 transition-colors"
        >
          <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
            <ArrowUpRight className="w-3.5 h-3.5 text-amber-600" />
            <span>Berilgan qarz:</span>
          </div>
          <span className="font-bold text-amber-800 font-mono">{formatCurrency(summary.total_debt_given_remaining, settings.currency)}</span>
        </div>

        <div
          onClick={() => setActiveTab('debts')}
          className="px-3 py-2 bg-white border border-[#cbd5e1] rounded flex items-center justify-between cursor-pointer hover:bg-emerald-50/50 transition-colors"
        >
          <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
            <ArrowDownLeft className="w-3.5 h-3.5 text-purple-600" />
            <span>Olingan qarz:</span>
          </div>
          <span className="font-bold text-purple-800 font-mono">{formatCurrency(summary.total_debt_received_remaining, settings.currency)}</span>
        </div>
      </div>
    </div>
  );
};
