import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency } from '../../lib/formatters';
import { ArrowDownLeft, ArrowUpRight, Coins } from 'lucide-react';

export const CashFlowChart: React.FC = () => {
  const { summary, settings } = useFinance();

  const totalInflow = summary.total_income + summary.total_debt_received_initial + summary.total_debt_repayments_collected;
  const totalOutflow = summary.total_expense + summary.total_debt_given_initial + summary.total_debt_repayments_made;

  const data = [
    {
      name: 'Pul Kirimi (Inflow)',
      Asosiy: summary.total_income,
      Qarz_Qaytarish: summary.total_debt_repayments_collected,
      Olingan_Qarz: summary.total_debt_received_initial,
      total: totalInflow
    },
    {
      name: 'Pul Chiqimi (Outflow)',
      Asosiy: summary.total_expense,
      Qarz_Berish: summary.total_debt_given_initial,
      Qarz_Tolash: summary.total_debt_repayments_made,
      total: totalOutflow
    }
  ];

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <Coins className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">Haqiqiy Pul Oqimi (Cash Flow)</h3>
          </div>
          <p className="text-xs text-slate-500">
            Qarz berish/olish va qaytarishlar hisobga olingan to'liq likvidlik
          </p>
        </div>

        <div className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2">
          <span className="text-xs text-slate-500">Sof Pul Oqimi:</span>
          <span
            className={`text-xs font-bold ${
              summary.net_cash_flow >= 0 ? 'text-emerald-600' : 'text-rose-600'
            }`}
          >
            {formatCurrency(summary.net_cash_flow, settings.currency)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl">
          <div className="flex items-center justify-between text-xs text-emerald-800 font-medium mb-1">
            <span className="flex items-center gap-1.5">
              <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600" />
              Jami Pul Kirimi (Cash In)
            </span>
            <span className="font-bold text-emerald-900">{formatCurrency(totalInflow, settings.currency)}</span>
          </div>
          <div className="text-[11px] text-emerald-700/80 space-y-0.5 mt-2">
            <div className="flex justify-between">
              <span>• Sof Daromadlar:</span>
              <span className="font-medium">{formatCurrency(summary.total_income, settings.currency)}</span>
            </div>
            <div className="flex justify-between">
              <span>• Qaytarib olingan qarzlar:</span>
              <span className="font-medium">{formatCurrency(summary.total_debt_repayments_collected, settings.currency)}</span>
            </div>
          </div>
        </div>

        <div className="p-3 bg-rose-50/70 border border-rose-100 rounded-xl">
          <div className="flex items-center justify-between text-xs text-rose-800 font-medium mb-1">
            <span className="flex items-center gap-1.5">
              <ArrowUpRight className="w-3.5 h-3.5 text-rose-600" />
              Jami Pul Chiqimi (Cash Out)
            </span>
            <span className="font-bold text-rose-900">{formatCurrency(totalOutflow, settings.currency)}</span>
          </div>
          <div className="text-[11px] text-rose-700/80 space-y-0.5 mt-2">
            <div className="flex justify-between">
              <span>• Sof Xarajatlar:</span>
              <span className="font-medium">{formatCurrency(summary.total_expense, settings.currency)}</span>
            </div>
            <div className="flex justify-between">
              <span>• Qarzga to'langan to'lovlar:</span>
              <span className="font-medium">{formatCurrency(summary.total_debt_repayments_made, settings.currency)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
