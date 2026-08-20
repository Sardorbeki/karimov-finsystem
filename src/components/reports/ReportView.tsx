import React, { useState, useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency, formatPercentage } from '../../lib/formatters';
import {
  FileText,
  Download,
  Printer,
  TrendingUp,
  TrendingDown,
  Wallet,
  Percent,
  Calendar,
  Layers,
  ArrowDownLeft,
  ArrowUpRight,
  Sparkles,
  FileSpreadsheet,
  Loader2,
  Check
} from 'lucide-react';
import { exportReportsModuleExcel, exportFullMasterExcel } from '../../lib/excelExportEngine';

export const ReportView: React.FC = () => {
  const { incomes, expenses, debts, debtPayments, budgets, categories, settings, summary } = useFinance();
  const [selectedYear, setSelectedYear] = useState('2026');

  // Compute 12-month report table
  const monthlyReports = useMemo(() => {
    const months = [
      { code: '01', name: 'Yanvar' },
      { code: '02', name: 'Fevral' },
      { code: '03', name: 'Mart' },
      { code: '04', name: 'Aprel' },
      { code: '05', name: 'May' },
      { code: '06', name: 'Iyun' },
      { code: '07', name: 'Iyul' },
      { code: '08', name: 'Avgust' },
      { code: '09', name: 'Sentyabr' },
      { code: '10', name: 'Oktyabr' },
      { code: '11', name: 'Noyabr' },
      { code: '12', name: 'Dekabr' }
    ];

    let cumulativeBalance = 0;

    return months.map((m) => {
      const prefix = `${selectedYear}-${m.code}`;

      // Incomes
      const monthIncomes = incomes.filter(
        (i) => !i.is_deleted && i.date.startsWith(prefix)
      );
      const incTotal = monthIncomes.reduce((sum, i) => sum + i.amount, 0);

      // Expenses
      const monthExpenses = expenses.filter(
        (e) => !e.is_deleted && e.date.startsWith(prefix)
      );
      const expTotal = monthExpenses.reduce((sum, e) => sum + e.amount, 0);

      const netBalance = incTotal - expTotal;
      const savingsRate = incTotal > 0 ? (Math.max(0, netBalance) / incTotal) * 100 : 0;
      cumulativeBalance += netBalance;

      // Debt payments in this month
      const repaymentsCollected = debtPayments
        .filter((p) => p.payment_date.startsWith(prefix))
        .filter((p) => {
          const d = debts.find((item) => item.id === p.debt_id);
          return d && d.type === 'given';
        })
        .reduce((sum, p) => sum + p.amount, 0);

      const repaymentsMade = debtPayments
        .filter((p) => p.payment_date.startsWith(prefix))
        .filter((p) => {
          const d = debts.find((item) => item.id === p.debt_id);
          return d && d.type === 'received';
        })
        .reduce((sum, p) => sum + p.amount, 0);

      const cashInflow = incTotal + repaymentsCollected;
      const cashOutflow = expTotal + repaymentsMade;
      const netCashFlow = cashInflow - cashOutflow;

      return {
        monthCode: prefix,
        monthName: m.name,
        income: incTotal,
        expense: expTotal,
        netBalance,
        savingsRate,
        cumulativeBalance,
        cashInflow,
        cashOutflow,
        netCashFlow,
        incomeCount: monthIncomes.length,
        expenseCount: monthExpenses.length
      };
    });
  }, [incomes, expenses, debts, debtPayments, selectedYear]);

  // Annual Totals
  const annualTotals = useMemo(() => {
    const inc = monthlyReports.reduce((s, m) => s + m.income, 0);
    const exp = monthlyReports.reduce((s, m) => s + m.expense, 0);
    const net = inc - exp;
    const savings = inc > 0 ? (Math.max(0, net) / inc) * 100 : 0;
    const cashIn = monthlyReports.reduce((s, m) => s + m.cashInflow, 0);
    const cashOut = monthlyReports.reduce((s, m) => s + m.cashOutflow, 0);
    const netCash = cashIn - cashOut;

    return {
      totalIncome: inc,
      totalExpense: exp,
      netBalance: net,
      savingsRate: savings,
      cashInflow: cashIn,
      cashOutflow: cashOut,
      netCashFlow: netCash
    };
  }, [monthlyReports]);

  // Category Annual Breakdown
  const categoryBreakdown = useMemo(() => {
    const activeExpenses = expenses.filter(
      (e) => !e.is_deleted && e.date.startsWith(selectedYear)
    );
    const expCats = categories.filter((c) => c.type === 'expense');

    return expCats.map((cat) => {
      const total = activeExpenses
        .filter((e) => e.category_id === cat.id)
        .reduce((sum, e) => sum + e.amount, 0);
      const percent = annualTotals.totalExpense > 0 ? (total / annualTotals.totalExpense) * 100 : 0;

      return {
        id: cat.id,
        name: cat.name,
        color: cat.color,
        icon: cat.icon,
        total,
        percent
      };
    }).sort((a, b) => b.total - a.total);
  }, [expenses, categories, selectedYear, annualTotals.totalExpense]);

  const [isExporting, setIsExporting] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const handleExportModuleExcel = async () => {
    try {
      setIsExporting(true);
      await exportReportsModuleExcel({
        monthlyReports,
        annualTotals,
        categoryBreakdown,
        year: selectedYear
      });
      setSuccessToast(`${selectedYear}-yil Oylik & Yillik Hisobotlar Excel fayli yuklab olindi!`);
      setTimeout(() => setSuccessToast(null), 3500);
    } catch (err: any) {
      alert('Excel exportda xatolik: ' + err.message);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportFullMaster = async () => {
    try {
      setIsExporting(true);
      await exportFullMasterExcel({
        summary,
        incomes,
        expenses,
        debts,
        debtPayments,
        budgets,
        categories,
        year: selectedYear
      });
      setSuccessToast('2026 Master Excel 2.0 to\'liq kitobi muvaffaqiyatli yuklab olindi!');
      setTimeout(() => setSuccessToast(null), 3500);
    } catch (err: any) {
      alert('Master Excel exportda xatolik: ' + err.message);
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {successToast && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-bold flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{successToast}</span>
          </div>
          <button onClick={() => setSuccessToast(null)} className="text-emerald-700">✕</button>
        </div>
      )}

      {/* Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs print:hidden">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FileText className="w-6 h-6 text-indigo-600" />
            <h2 className="text-xl font-bold text-slate-900">Yillik va Oylik Moliyaviy Hisobotlar</h2>
          </div>
          <p className="text-xs text-slate-500">
            Daromadlar, xarajatlar, jamg'arish koeffitsienti va pul oqimlari (Cash Flow) chuqur tahlili
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              <option value="2026">2026-yil</option>
              <option value="2027">2027-yil</option>
              <option value="2025">2025-yil</option>
            </select>
          </div>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition-colors shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Chop etish / PDF</span>
          </button>

          <button
            onClick={handleExportModuleExcel}
            disabled={isExporting}
            className="flex items-center gap-2 px-3.5 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition-colors shadow-xs disabled:opacity-50"
            title="Aynan ushbu yillik hisobot jadvalini Excel formatida yuklab olish"
          >
            {isExporting ? (
              <Loader2 className="w-3.5 h-3.5 text-emerald-600 animate-spin" />
            ) : (
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            )}
            <span>Hisobot Excel (.xlsx)</span>
          </button>

          <button
            onClick={handleExportFullMaster}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-semibold rounded-xl shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50"
            title="Barcha sahifali to'liq Master Excel 2.0 faylini yuklab olish"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>To'liq Master Excel 2.0</span>
          </button>
        </div>
      </div>

      {/* Annual Summary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white rounded-3xl border border-emerald-100 shadow-xs">
          <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">{selectedYear}-yil Jami Daromad</span>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {formatCurrency(annualTotals.totalIncome, settings.currency)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Yillik barcha daromadlar yig'indisi</p>
        </div>

        <div className="p-5 bg-white rounded-3xl border border-rose-100 shadow-xs">
          <span className="text-xs font-semibold text-rose-700 uppercase tracking-wider">{selectedYear}-yil Jami Xarajat</span>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {formatCurrency(annualTotals.totalExpense, settings.currency)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Yillik barcha xarajatlar yig'indisi</p>
        </div>

        <div className="p-5 bg-white rounded-3xl border border-indigo-100 shadow-xs">
          <span className="text-xs font-semibold text-indigo-700 uppercase tracking-wider">Yillik Sof Qoldiq (Foyda)</span>
          <div className="text-2xl font-black text-indigo-600 mt-1">
            {formatCurrency(annualTotals.netBalance, settings.currency)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Daromad - Xarajat (Sof jamg'arma)</p>
        </div>

        <div className="p-5 bg-white rounded-3xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">O'rtacha Jamg'arma Foizi</span>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {formatPercentage(annualTotals.savingsRate)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Yillik o'rtacha tejash darajasi</p>
        </div>
      </div>

      {/* Monthly Consolidated Financial Statement Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-900">
            {selectedYear}-yil Oylar Kesimidagi Konsolidatsiyalangan Moliyaviy Jadval
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Har bir oy bo'yicha daromad, xarajat, sof balans, jamg'arish foizi va likvidlik
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3.5">Oy</th>
                <th className="px-4 py-3.5 text-right">Daromad</th>
                <th className="px-4 py-3.5 text-right">Xarajat</th>
                <th className="px-4 py-3.5 text-right">Sof Qoldiq</th>
                <th className="px-4 py-3.5 text-right">Tejash %</th>
                <th className="px-4 py-3.5 text-right">Pul Kirimi (Inflow)</th>
                <th className="px-4 py-3.5 text-right">Pul Chiqimi (Outflow)</th>
                <th className="px-4 py-3.5 text-right">Kumulyativ Balans</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {monthlyReports.map((m) => (
                <tr key={m.monthCode} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-4 py-3.5 font-bold text-slate-900 whitespace-nowrap">
                    {m.monthName}
                  </td>
                  <td className="px-4 py-3.5 text-right font-semibold text-emerald-600 whitespace-nowrap">
                    {formatCurrency(m.income, settings.currency)}
                  </td>
                  <td className="px-4 py-3.5 text-right font-semibold text-rose-600 whitespace-nowrap">
                    {formatCurrency(m.expense, settings.currency)}
                  </td>
                  <td
                    className={`px-4 py-3.5 text-right font-bold whitespace-nowrap ${
                      m.netBalance >= 0 ? 'text-indigo-600' : 'text-rose-600'
                    }`}
                  >
                    {formatCurrency(m.netBalance, settings.currency)}
                  </td>
                  <td className="px-4 py-3.5 text-right font-semibold text-slate-600 whitespace-nowrap">
                    {m.income > 0 ? `${m.savingsRate.toFixed(1)}%` : '-'}
                  </td>
                  <td className="px-4 py-3.5 text-right text-slate-600 whitespace-nowrap">
                    {formatCurrency(m.cashInflow, settings.currency)}
                  </td>
                  <td className="px-4 py-3.5 text-right text-slate-600 whitespace-nowrap">
                    {formatCurrency(m.cashOutflow, settings.currency)}
                  </td>
                  <td
                    className={`px-4 py-3.5 text-right font-black whitespace-nowrap ${
                      m.cumulativeBalance >= 0 ? 'text-slate-900' : 'text-rose-600'
                    }`}
                  >
                    {formatCurrency(m.cumulativeBalance, settings.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
            {/* Total Footer */}
            <tfoot className="bg-slate-900 text-white font-bold text-xs">
              <tr>
                <td className="px-4 py-4 uppercase">Jami Yillik:</td>
                <td className="px-4 py-4 text-right text-emerald-400">
                  {formatCurrency(annualTotals.totalIncome, settings.currency)}
                </td>
                <td className="px-4 py-4 text-right text-rose-400">
                  {formatCurrency(annualTotals.totalExpense, settings.currency)}
                </td>
                <td className="px-4 py-4 text-right text-indigo-300">
                  {formatCurrency(annualTotals.netBalance, settings.currency)}
                </td>
                <td className="px-4 py-4 text-right text-slate-200">
                  {annualTotals.savingsRate.toFixed(1)}%
                </td>
                <td className="px-4 py-4 text-right text-slate-300">
                  {formatCurrency(annualTotals.cashInflow, settings.currency)}
                </td>
                <td className="px-4 py-4 text-right text-slate-300">
                  {formatCurrency(annualTotals.cashOutflow, settings.currency)}
                </td>
                <td className="px-4 py-4 text-right text-white">
                  {formatCurrency(annualTotals.netBalance, settings.currency)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Annual Category Breakdown */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <h3 className="text-base font-bold text-slate-900 mb-1">
          {selectedYear}-yil Kategoriyalar Bo'yicha Yillik Sarf Tarkibi
        </h3>
        <p className="text-xs text-slate-500 mb-6">
          Har bir yo'nalishning yillik byudjetdagi foiz ulushi
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categoryBreakdown.map((cat) => (
            <div key={cat.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                <span className="truncate">{cat.name}</span>
                <span className="text-rose-600">{cat.percent.toFixed(1)}%</span>
              </div>
              <div className="text-xs font-semibold text-slate-700">
                {formatCurrency(cat.total, settings.currency)}
              </div>
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${Math.min(cat.percent, 100)}%`, backgroundColor: cat.color }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
