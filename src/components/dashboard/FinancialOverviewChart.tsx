import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency } from '../../lib/formatters';

export const FinancialOverviewChart: React.FC = () => {
  const { incomes, expenses, settings } = useFinance();
  const [chartType, setChartType] = useState<'both' | 'bars' | 'balance'>('both');

  // Compute monthly data for 2026 or all available data
  const monthlyData = useMemo(() => {
    const months = [
      'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
      'Iyul', 'Avgust', 'Sentyabr', 'Oktyabr', 'Noyabr', 'Dekabr'
    ];

    const currentYear = '2026';
    const result = months.map((monthName, idx) => {
      const monthNum = String(idx + 1).padStart(2, '0');
      const prefix = `${currentYear}-${monthNum}`;

      const incTotal = incomes
        .filter((i) => !i.is_deleted && i.date.startsWith(prefix))
        .reduce((sum, i) => sum + (Number(i.amount) || 0), 0);

      const expTotal = expenses
        .filter((e) => !e.is_deleted && e.date.startsWith(prefix))
        .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

      const netBalance = incTotal - expTotal;

      return {
        month: monthName,
        monthCode: prefix,
        Daromad: incTotal,
        Xarajat: expTotal,
        Balans: netBalance
      };
    });

    return result;
  }, [incomes, expenses]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-800 text-xs space-y-1.5 min-w-44">
          <p className="font-semibold text-slate-300 border-b border-slate-800 pb-1">{label} (2026)</p>
          {payload.map((entry: any, index: number) => (
            <div key={`item-${index}`} className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                <span className="text-slate-400">{entry.name}:</span>
              </span>
              <span className="font-bold text-white">
                {formatCurrency(entry.value, settings.currency)}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Oylik Daromad, Xarajat va Sof Balans Dinamikasi</h3>
          <p className="text-xs text-slate-500">2026-yil oylar kesimida umumiy ko'rsatkichlar</p>
        </div>

        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-medium">
          <button
            onClick={() => setChartType('both')}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              chartType === 'both' ? 'bg-white text-indigo-700 font-semibold shadow-xs' : 'text-slate-600'
            }`}
          >
            Barchasi
          </button>
          <button
            onClick={() => setChartType('bars')}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              chartType === 'bars' ? 'bg-white text-indigo-700 font-semibold shadow-xs' : 'text-slate-600'
            }`}
          >
            Daromad/Xarajat
          </button>
          <button
            onClick={() => setChartType('balance')}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              chartType === 'balance' ? 'bg-white text-indigo-700 font-semibold shadow-xs' : 'text-slate-600'
            }`}
          >
            Faqat Balans
          </button>
        </div>
      </div>

      <div className="w-full h-72">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
            <YAxis
              tick={{ fontSize: 11, fill: '#64748b' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(val) => {
                if (val >= 1000000) return `${(val / 1000000).toFixed(0)}M`;
                if (val <= -1000000) return `${(val / 1000000).toFixed(0)}M`;
                if (val >= 1000) return `${(val / 1000).toFixed(0)}k`;
                return val;
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />

            {(chartType === 'both' || chartType === 'bars') && (
              <>
                <Bar dataKey="Daromad" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={28} />
                <Bar dataKey="Xarajat" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={28} />
              </>
            )}

            {(chartType === 'both' || chartType === 'balance') && (
              <Line
                type="monotone"
                dataKey="Balans"
                stroke="#6366f1"
                strokeWidth={3}
                dot={{ r: 4, fill: '#6366f1' }}
                activeDot={{ r: 6 }}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
