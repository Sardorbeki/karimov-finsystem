import React, { useState, useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency, formatPercentage } from '../../lib/formatters';
import {
  PiggyBank,
  Plus,
  Edit2,
  AlertTriangle,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  X,
  Check,
  Calendar,
  Sparkles,
  Copy,
  FileSpreadsheet,
  Loader2,
  Search,
  ArrowUpDown
} from 'lucide-react';
import { CategoryIcon } from '../common/CategoryIcon';
import { Pagination } from '../common/Pagination';
import { exportBudgetsModuleExcel } from '../../lib/excelExportEngine';

export const BudgetView: React.FC = () => {
  const { budgets, categories, expenses, settings, setBudgetLimit } = useFinance();

  const [selectedMonth, setSelectedMonth] = useState('2026-08');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'ok' | 'warning' | 'exceeded'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCategoryForBudget, setSelectedCategoryForBudget] = useState<{ id: string; name: string; currentLimit: number } | null>(null);
  const [inputLimit, setInputLimit] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const expenseCategories = useMemo(() => {
    return categories.filter((c) => c.type === 'expense');
  }, [categories]);

  // Months of 2026
  const months = [
    { code: '2026-01', name: 'Yanvar 2026' },
    { code: '2026-02', name: 'Fevral 2026' },
    { code: '2026-03', name: 'Mart 2026' },
    { code: '2026-04', name: 'Aprel 2026' },
    { code: '2026-05', name: 'May 2026' },
    { code: '2026-06', name: 'Iyun 2026' },
    { code: '2026-07', name: 'Iyul 2026' },
    { code: '2026-08', name: 'Avgust 2026' },
    { code: '2026-09', name: 'Sentyabr 2026' },
    { code: '2026-10', name: 'Oktyabr 2026' },
    { code: '2026-11', name: 'Noyabr 2026' },
    { code: '2026-12', name: 'Dekabr 2026' }
  ];

  // Budget status for the selected month
  const monthBudgetData = useMemo(() => {
    const monthExpenses = expenses.filter(
      (e) => !e.is_deleted && e.date.startsWith(selectedMonth)
    );

    let totalLimit = 0;
    let totalSpent = 0;

    const items = expenseCategories.map((cat) => {
      const existing = budgets.find((b) => b.category_id === cat.id && b.month === selectedMonth);
      const limit = existing ? existing.limit_amount : 0;

      const spent = monthExpenses
        .filter((e) => e.category_id === cat.id)
        .reduce((sum, e) => sum + e.amount, 0);

      totalLimit += limit;
      totalSpent += spent;

      const usage = limit > 0 ? (spent / limit) * 100 : 0;
      let status: 'ok' | 'warning' | 'exceeded' = 'ok';
      if (usage > 100) status = 'exceeded';
      else if (usage >= 80) status = 'warning';

      return {
        categoryId: cat.id,
        categoryName: cat.name,
        categoryColor: cat.color,
        categoryIcon: cat.icon,
        limit,
        spent,
        remaining: Math.max(0, limit - spent),
        overspent: Math.max(0, spent - limit),
        usage,
        status
      };
    });

    const totalUsage = totalLimit > 0 ? (totalSpent / totalLimit) * 100 : 0;

    return {
      items,
      totalLimit,
      totalSpent,
      totalRemaining: Math.max(0, totalLimit - totalSpent),
      totalOverspent: Math.max(0, totalSpent - totalLimit),
      totalUsage
    };
  }, [expenseCategories, budgets, expenses, selectedMonth]);

  // Filtered budget items
  const filteredBudgetItems = useMemo(() => {
    return monthBudgetData.items.filter((item) => {
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        if (!item.categoryName.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [monthBudgetData.items, statusFilter, search]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredBudgetItems.length / pageSize) || 1;
  const paginatedBudgetItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredBudgetItems.slice(start, start + pageSize);
  }, [filteredBudgetItems, currentPage, pageSize]);

  const handleOpenEdit = (item: { categoryId: string; categoryName: string; limit: number }) => {
    setSelectedCategoryForBudget({
      id: item.categoryId,
      name: item.categoryName,
      currentLimit: item.limit
    });
    setInputLimit(item.limit > 0 ? item.limit.toString() : '');
    setError(null);
    setIsEditModalOpen(true);
  };

  const handleSaveBudget = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategoryForBudget) return;

    const val = parseFloat(inputLimit.replace(/\s+/g, ''));
    if (isNaN(val) || val < 0) {
      setError('Iltimos, musbat son kiriting (yoki 0)');
      return;
    }

    setBudgetLimit(selectedCategoryForBudget.id, selectedMonth, val);
    setIsEditModalOpen(false);
    setSuccessToast(`"${selectedCategoryForBudget.name}" byudjeti yangilandi!`);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const handleCopyPreviousMonth = () => {
    const currentIdx = months.findIndex((m) => m.code === selectedMonth);
    if (currentIdx <= 0) return;
    const prevMonth = months[currentIdx - 1].code;

    const prevBudgets = budgets.filter((b) => b.month === prevMonth);
    if (prevBudgets.length === 0) {
      alert(`${months[currentIdx - 1].name} oyida saqlangan byudjet ma'lumotlari topilmadi.`);
      return;
    }

    prevBudgets.forEach((b) => {
      setBudgetLimit(b.category_id, selectedMonth, b.limit_amount);
    });

    setSuccessToast(`${months[currentIdx - 1].name} byudjet rejalari joriy oyga muvaffaqiyatli ko'chirildi!`);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  const handleExportExcel = async () => {
    try {
      setIsExporting(true);
      const computedList: any[] = monthBudgetData.items.map((item) => ({
        id: item.categoryId,
        category_id: item.categoryId,
        month: selectedMonth,
        limit_amount: item.limit,
        spent_amount: item.spent,
        remaining_amount: item.remaining,
        overspent_amount: item.overspent,
        usage_percentage: item.usage,
        status: item.status,
        category_name: item.categoryName,
        category_color: item.categoryColor,
        category_icon: item.categoryIcon
      }));

      await exportBudgetsModuleExcel(
        computedList,
        months.find((m) => m.code === selectedMonth)?.name || selectedMonth
      );
      setSuccessToast('Byudjet rejasi jadvali Excel formatida yuklab olindi!');
      setTimeout(() => setSuccessToast(null), 3500);
    } catch (err: any) {
      alert('Excel exportda xatolik: ' + err.message);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-5">
      {successToast && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-bold flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{successToast}</span>
          </div>
          <button onClick={() => setSuccessToast(null)} className="text-emerald-700">✕</button>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
              <PiggyBank className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Oylik Byudjet Rejasi</h2>
          </div>
          <p className="text-xs text-slate-500">
            Xarajat kategoriyalari bo'yicha oylik limitlar rejasi, haqiqiy xarajatlar tahlili va nazorat jadvali
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Month Selector */}
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            <Calendar className="w-4 h-4 text-emerald-700" />
            <select
              value={selectedMonth}
              onChange={(e) => {
                setSelectedMonth(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent text-xs font-bold text-slate-800 focus:outline-hidden cursor-pointer"
            >
              {months.map((m) => (
                <option key={m.code} value={m.code}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleExportExcel}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition-colors shadow-xs disabled:opacity-50"
            title="Tanlangan oy byudjetini Excel formatida yuklab olish"
          >
            {isExporting ? (
              <Loader2 className="w-3.5 h-3.5 text-emerald-600 animate-spin" />
            ) : (
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            )}
            <span>{isExporting ? 'Excel...' : 'Excel (.xlsx)'}</span>
          </button>

          <button
            onClick={handleCopyPreviousMonth}
            className="flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition-colors shadow-xs"
            title="Oldingi oydagi limitlarni nusxalash"
          >
            <Copy className="w-3.5 h-3.5 text-slate-500" />
            <span>Oldingi oydan ko'chirish</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Banner */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              {months.find((m) => m.code === selectedMonth)?.name} umumiy byudjet holati
            </span>
            <div className="flex items-baseline gap-3 mt-1">
              <span className="text-2xl font-black text-slate-900">
                {formatCurrency(monthBudgetData.totalSpent, settings.currency)}
              </span>
              <span className="text-sm font-bold text-slate-400">
                / {formatCurrency(monthBudgetData.totalLimit, settings.currency)}
              </span>
            </div>
          </div>

          <div className="sm:text-right">
            <span
              className={`text-xl font-black ${
                monthBudgetData.totalUsage > 100
                  ? 'text-rose-600'
                  : monthBudgetData.totalUsage >= 80
                  ? 'text-amber-600'
                  : 'text-emerald-600'
              }`}
            >
              {formatPercentage(monthBudgetData.totalUsage)}
            </span>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              {monthBudgetData.totalUsage > 100
                ? `Limit ${formatCurrency(monthBudgetData.totalOverspent, settings.currency)} ga oshib ketdi!`
                : `Qoldiq limit: ${formatCurrency(monthBudgetData.totalRemaining, settings.currency)}`}
            </p>
          </div>
        </div>

        {/* Global Progress Bar */}
        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              monthBudgetData.totalUsage > 100
                ? 'bg-rose-500'
                : monthBudgetData.totalUsage >= 80
                ? 'bg-amber-500'
                : 'bg-emerald-500'
            }`}
            style={{ width: `${Math.min(monthBudgetData.totalUsage, 100)}%` }}
          />
        </div>
      </div>

      {/* Control Bar: Filters & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Status filters */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => {
              setStatusFilter('all');
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              statusFilter === 'all' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Barchasi ({monthBudgetData.items.length})
          </button>
          <button
            onClick={() => {
              setStatusFilter('ok');
              setCurrentPage(1);
            }}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all ${
              statusFilter === 'ok' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Normada</span>
          </button>
          <button
            onClick={() => {
              setStatusFilter('warning');
              setCurrentPage(1);
            }}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all ${
              statusFilter === 'warning' ? 'bg-white text-amber-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Xavf (≥80%)</span>
          </button>
          <button
            onClick={() => {
              setStatusFilter('exceeded');
              setCurrentPage(1);
            }}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all ${
              statusFilter === 'exceeded' ? 'bg-white text-rose-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Oshib ketgan</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Kategoriya bo'yicha qidiruv..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Structured Budget Table (Ro'yxat / Jadval ko'rinishi) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-4 w-12 text-center">№</th>
                <th className="py-3 px-4">Kategoriya</th>
                <th className="py-3 px-4 text-right">Oylik Reja Limit</th>
                <th className="py-3 px-4 text-right">Haqiqiy Xarajat</th>
                <th className="py-3 px-4 text-right">Qoldiq Summa</th>
                <th className="py-3 px-4 w-44">Bajarilish %</th>
                <th className="py-3 px-4 text-center">Holat</th>
                <th className="py-3 px-4 text-center w-24">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {paginatedBudgetItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Byudjet rejalari topilmadi
                  </td>
                </tr>
              ) : (
                paginatedBudgetItems.map((item, idx) => {
                  const rowNumber = (currentPage - 1) * pageSize + idx + 1;
                  const isExceeded = item.status === 'exceeded';
                  const isWarning = item.status === 'warning';

                  return (
                    <tr
                      key={item.categoryId}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      <td className="py-3 px-4 text-center font-mono text-[11px] text-slate-400 font-semibold">
                        {rowNumber}
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0 shadow-2xs"
                            style={{ backgroundColor: item.categoryColor }}
                          >
                            <CategoryIcon name={item.categoryIcon} className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 group-hover:text-[#107c41] transition-colors">
                              {item.categoryName}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-800">
                        {item.limit > 0 ? (
                          formatCurrency(item.limit, settings.currency)
                        ) : (
                          <span className="text-slate-400 font-normal italic">Belgilanmagan</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold text-rose-700">
                        {formatCurrency(item.spent, settings.currency)}
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold">
                        {item.limit > 0 ? (
                          isExceeded ? (
                            <span className="text-rose-600">
                              -{formatCurrency(item.overspent, settings.currency)}
                            </span>
                          ) : (
                            <span className="text-emerald-700">
                              {formatCurrency(item.remaining, settings.currency)}
                            </span>
                          )
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px] font-bold">
                            <span
                              className={
                                isExceeded
                                  ? 'text-rose-600'
                                  : isWarning
                                  ? 'text-amber-600'
                                  : 'text-slate-700'
                              }
                            >
                              {item.limit > 0 ? formatPercentage(item.usage) : '0%'}
                            </span>
                          </div>
                          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                isExceeded
                                  ? 'bg-rose-500'
                                  : isWarning
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                              }`}
                              style={{ width: `${Math.min(item.usage, 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${
                            item.limit === 0
                              ? 'bg-slate-100 text-slate-500 border-slate-200'
                              : isExceeded
                              ? 'bg-rose-100 text-rose-800 border-rose-200'
                              : isWarning
                              ? 'bg-amber-100 text-amber-800 border-amber-200'
                              : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                          }`}
                        >
                          {item.limit === 0
                            ? 'Limitsiz'
                            : isExceeded
                            ? 'Oshib ketdi'
                            : isWarning
                            ? 'Xavf (≥80%)'
                            : 'Normada'}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() =>
                            handleOpenEdit({
                              categoryId: item.categoryId,
                              categoryName: item.categoryName,
                              limit: item.limit
                            })
                          }
                          className="px-2.5 py-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors flex items-center gap-1 mx-auto"
                          title="Limitni o'zgartirish"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Limit</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Standard Pagination with 10 - 1000 rows limit */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredBudgetItems.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          itemLabel="byudjet rejasi"
        />
      </div>

      {/* Edit Budget Modal */}
      {isEditModalOpen && selectedCategoryForBudget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
                  <PiggyBank className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Byudjet Limitini Belgilash</h3>
                  <p className="text-[11px] text-slate-400">{selectedCategoryForBudget.name}</p>
                </div>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-semibold">
                {error}
              </div>
            )}

            <form onSubmit={handleSaveBudget} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Oylik Maksimal Limit ({settings.currency})
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  autoFocus
                  required
                  value={inputLimit}
                  onChange={(e) => setInputLimit(e.target.value)}
                  placeholder="0 (Limit bekor qilish uchun 0 kiriting)"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Agar limit kerak bo'lmasa, 0 qiymatini kiriting
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold rounded-xl transition-colors"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#107c41] hover:bg-[#0e6837] text-white text-xs font-bold rounded-xl shadow-sm transition-all"
                >
                  Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
