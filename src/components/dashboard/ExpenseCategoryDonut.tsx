import React, { useMemo } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { useFinance } from '../../context/FinanceContext';
import { isDateInRange } from '../../lib/calculations';
import { formatCurrency, formatPercentage } from '../../lib/formatters';
import { CategoryIcon } from '../common/CategoryIcon';

export const ExpenseCategoryDonut: React.FC = () => {
  const { expenses, categories, filterRange, settings, summary } = useFinance();

  const categoryData = useMemo(() => {
    const activeExpenses = expenses.filter((e) => !e.is_deleted && isDateInRange(e.date, filterRange));
    const totalSpent = activeExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    const expenseCategories = categories.filter((c) => c.type === 'expense');

    const grouped = expenseCategories.map((cat) => {
      const catTotal = activeExpenses
        .filter((e) => e.category_id === cat.id)
        .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

      const percent = totalSpent > 0 ? (catTotal / totalSpent) * 100 : 0;

      return {
        id: cat.id,
        name: cat.name,
        icon: cat.icon,
        color: cat.color,
        amount: catTotal,
        percent
      };
    })
    .filter((item) => item.amount > 0)
    .sort((a, b) => b.amount - a.amount);

    return { items: grouped, total: totalSpent };
  }, [expenses, categories, filterRange]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1">
          <p className="font-semibold">{data.name}</p>
          <p className="text-emerald-400 font-bold">{formatCurrency(data.amount, settings.currency)}</p>
          <p className="text-slate-400">Jami xarajatdan: {formatPercentage(data.percent)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
      <div>
        <h3 className="text-sm font-bold text-slate-900 mb-1">Xarajatlar Kategoriya Bo'yicha</h3>
        <p className="text-xs text-slate-500 mb-4">Tanlangan davr xarajatlar taqsimoti</p>
      </div>

      {categoryData.items.length === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-xs">
          Tanlangan davr uchun xarajatlar mavjud emas
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="w-48 h-48 relative shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData.items}
                  dataKey="amount"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                >
                  {categoryData.items.map((entry) => (
                    <Cell key={entry.id} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[10px] text-slate-400 font-medium uppercase">Jami</span>
              <span className="text-xs font-bold text-slate-900">
                {categoryData.total >= 1000000
                  ? `${(categoryData.total / 1000000).toFixed(1)}M`
                  : formatCurrency(categoryData.total, settings.currency)}
              </span>
            </div>
          </div>

          <div className="flex-1 w-full space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
            {categoryData.items.slice(0, 5).map((item) => (
              <div key={item.id} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-slate-700 truncate">{item.name}</span>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-semibold text-slate-900">
                    {formatCurrency(item.amount, settings.currency)}
                  </span>
                  <span className="text-[11px] text-slate-400 ml-1.5">({item.percent.toFixed(0)}%)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
