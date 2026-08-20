import React, { useState, useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { Expense } from '../../types';
import { formatCurrency, formatDate, toInputDateFormat } from '../../lib/formatters';
import { isDateInRange } from '../../lib/calculations';
import {
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  TrendingDown,
  Download,
  BarChart3,
  ListOrdered,
  Calendar,
  X,
  Check,
  PieChart as PieChartIcon,
  LayoutList,
  Table as TableIcon,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  CheckSquare,
  Square
} from 'lucide-react';
import { CategoryIcon } from '../common/CategoryIcon';
import { Pagination } from '../common/Pagination';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { exportExpensesModuleExcel } from '../../lib/excelExportEngine';
import { FileSpreadsheet, Loader2 } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export const ExpenseView: React.FC = () => {
  const { expenses, categories, settings, addExpense, updateExpense, deleteExpense, bulkDeleteExpenses, filterRange } = useFinance();

  // Tab mode: 'list', 'table', or 'analytics'
  const [viewMode, setViewMode] = useState<'list' | 'table' | 'analytics'>('table');

  // Filters
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Sorting state
  const [sortField, setSortField] = useState<'date' | 'amount' | 'category' | 'description' | 'payment_method'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkDeleteConfirmOpen, setIsBulkDeleteConfirmOpen] = useState(false);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // Form states
  const [formDate, setFormDate] = useState(toInputDateFormat());
  const [formCategoryId, setFormCategoryId] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPaymentMethod, setFormPaymentMethod] = useState('Plastik karta');
  const [formError, setFormError] = useState<string | null>(null);

  const expenseCategories = useMemo(() => {
    return categories.filter((c) => c.type === 'expense');
  }, [categories]);

  const handleSort = (field: 'date' | 'amount' | 'category' | 'description' | 'payment_method') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.length === paginatedExpenses.length && paginatedExpenses.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedExpenses.map((e) => e.id));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleExecuteBulkDelete = () => {
    if (selectedIds.length > 0) {
      bulkDeleteExpenses(selectedIds);
      setSelectedIds([]);
      setIsBulkDeleteConfirmOpen(false);
      setSuccessToast(`${selectedIds.length} ta xarajat muvaffaqiyatli o'chirildi!`);
      setTimeout(() => setSuccessToast(null), 3000);
    }
  };

  const handleOpenModal = (expense?: Expense) => {
    if (expense) {
      setEditingExpense(expense);
      setFormDate(expense.date.split('T')[0]);
      setFormCategoryId(expense.category_id);
      setFormAmount(expense.amount.toString());
      setFormDescription(expense.description || '');
      setFormPaymentMethod(expense.payment_method || 'Plastik karta');
    } else {
      setEditingExpense(null);
      setFormDate(toInputDateFormat());
      setFormCategoryId(expenseCategories[0]?.id || '');
      setFormAmount('');
      setFormDescription('');
      setFormPaymentMethod('Plastik karta');
    }
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const parsedAmount = parseFloat(formAmount.replace(/\s+/g, ''));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setFormError('Iltimos, to\'g\'ri musbat summa kiriting.');
      return;
    }
    if (!formCategoryId) {
      setFormError('Iltimos, kategoriyani tanlang.');
      return;
    }

    if (editingExpense) {
      updateExpense({
        ...editingExpense,
        date: formDate,
        category_id: formCategoryId,
        amount: parsedAmount,
        description: formDescription.trim(),
        payment_method: formPaymentMethod
      });
    } else {
      addExpense({
        date: formDate,
        category_id: formCategoryId,
        amount: parsedAmount,
        description: formDescription.trim(),
        payment_method: formPaymentMethod
      });
    }

    setIsModalOpen(false);
  };

  // Filtered and Sorted expenses
  const filteredExpenses = useMemo(() => {
    const list = expenses.filter((item) => {
      if (item.is_deleted) return false;
      if (!isDateInRange(item.date, filterRange)) return false;
      if (categoryFilter && item.category_id !== categoryFilter) return false;
      if (minAmount && item.amount < parseFloat(minAmount)) return false;
      if (maxAmount && item.amount > parseFloat(maxAmount)) return false;
      if (search) {
        const q = search.toLowerCase();
        const cat = categories.find((c) => c.id === item.category_id);
        const matchDesc = item.description?.toLowerCase().includes(q);
        const matchCat = cat?.name.toLowerCase().includes(q);
        if (!matchDesc && !matchCat) return false;
      }
      return true;
    });

    return list.sort((a, b) => {
      let comparison = 0;
      if (sortField === 'date') {
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
      } else if (sortField === 'amount') {
        comparison = a.amount - b.amount;
      } else if (sortField === 'category') {
        const catA = categories.find((c) => c.id === a.category_id)?.name || '';
        const catB = categories.find((c) => c.id === b.category_id)?.name || '';
        comparison = catA.localeCompare(catB);
      } else if (sortField === 'description') {
        comparison = (a.description || '').localeCompare(b.description || '');
      } else if (sortField === 'payment_method') {
        comparison = (a.payment_method || '').localeCompare(b.payment_method || '');
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [expenses, filterRange, categoryFilter, minAmount, maxAmount, search, categories, sortField, sortOrder]);

  const totalFilteredAmount = useMemo(() => {
    return filteredExpenses.reduce((sum, item) => sum + item.amount, 0);
  }, [filteredExpenses]);

  const totalPages = Math.ceil(filteredExpenses.length / pageSize);
  const paginatedExpenses = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredExpenses.slice(start, start + pageSize);
  }, [filteredExpenses, currentPage]);

  const [isExporting, setIsExporting] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const handleExportExcel = async () => {
    try {
      setIsExporting(true);
      const catName = categoryFilter
        ? (categories.find((c) => c.id === categoryFilter)?.name || 'Kategoriya')
        : 'Barcha Kategoriyalar';
      const filterTitle = `${catName} (${formatDate(filterRange.start_date)} - ${formatDate(filterRange.end_date)})`;

      await exportExpensesModuleExcel(filteredExpenses, categories, filterTitle);
      setSuccessToast('Xarajatlar Excel fayli muvaffaqiyatli yuklab olindi!');
      setTimeout(() => setSuccessToast(null), 3500);
    } catch (err: any) {
      alert('Excel exportda xatolik: ' + err.message);
    } finally {
      setIsExporting(false);
    }
  };

  // Analytics aggregations
  const categoryAnalytics = useMemo(() => {
    const catMap: Record<string, { name: string; color: string; icon: string; count: number; total: number }> = {};
    filteredExpenses.forEach((e) => {
      const cat = categories.find((c) => c.id === e.category_id);
      const catName = cat?.name || 'Boshqa';
      if (!catMap[catName]) {
        catMap[catName] = {
          name: catName,
          color: cat?.color || '#ef4444',
          icon: cat?.icon || 'Tag',
          count: 0,
          total: 0
        };
      }
      catMap[catName].count += 1;
      catMap[catName].total += e.amount;
    });

    return Object.values(catMap).sort((a, b) => b.total - a.total);
  }, [filteredExpenses, categories]);

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

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-rose-100/80 text-rose-700 rounded-2xl">
            <TrendingDown className="w-7 h-7" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Tanlangan Davr Xarajati
            </span>
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {formatCurrency(totalFilteredAmount, settings.currency)}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Jami {filteredExpenses.length} ta xarajat qaydi
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* View mode toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'list' ? 'bg-white text-rose-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutList className="w-3.5 h-3.5" />
              <span>Ro'yxat</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'table' ? 'bg-white text-rose-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Jadval</span>
            </button>
            <button
              onClick={() => setViewMode('analytics')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'analytics' ? 'bg-white text-rose-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Analitika</span>
            </button>
          </div>

          <button
            onClick={handleExportExcel}
            disabled={isExporting}
            className="flex items-center gap-2 px-3.5 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition-colors shadow-xs disabled:opacity-50"
            title="Aynan ko'rib turgan filterlangan xarajatlarni Excel formatida yuklab olish"
          >
            {isExporting ? (
              <Loader2 className="w-3.5 h-3.5 text-rose-600 animate-spin" />
            ) : (
              <FileSpreadsheet className="w-3.5 h-3.5 text-rose-600" />
            )}
            <span>{isExporting ? 'Excel...' : 'Excel (.xlsx)'}</span>
          </button>

          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs font-semibold rounded-xl shadow-md shadow-rose-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Yangi Xarajat</span>
          </button>
        </div>
      </div>

      {viewMode === 'analytics' ? (
        /* Analytics View */
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-1">Kategoriyalar Bo'yicha Xarajatlar Taqsimoti</h3>
            <p className="text-xs text-slate-500 mb-6">Tanlangan davr xarajatlar hajmi</p>

            <div className="w-full h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryAnalytics} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="name"
                    angle={-25}
                    textAnchor="end"
                    interval={0}
                    tick={{ fontSize: 10, fill: '#64748b' }}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    tickFormatter={(val) => (val >= 1000000 ? `${(val / 1000000).toFixed(1)}M` : `${val / 1000}k`)}
                  />
                  <Tooltip
                    formatter={(val: any) => [formatCurrency(Number(val), settings.currency), 'Xarajat']}
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                  />
                  <Bar dataKey="total" fill="#f43f5e" radius={[6, 6, 0, 0]} maxBarSize={45} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categoryAnalytics.map((cat) => {
              const percent = totalFilteredAmount > 0 ? (cat.total / totalFilteredAmount) * 100 : 0;
              return (
                <div key={cat.name} className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="p-3 rounded-xl text-white shrink-0 shadow-2xs"
                      style={{ backgroundColor: cat.color }}
                    >
                      <CategoryIcon name={cat.icon} className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-slate-800 truncate">{cat.name}</h4>
                      <p className="text-[10px] text-slate-400">{cat.count} ta tranzaksiya</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-bold text-slate-900">{formatCurrency(cat.total, settings.currency)}</span>
                    <p className="text-[10px] text-rose-600 font-semibold">{percent.toFixed(1)}%</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* List or Table View */
        <div className="space-y-4">
          {/* Filters */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Izoh yoki kategoriya qidirish..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                />
              </div>

              {/* Category */}
              <div>
                <select
                  value={categoryFilter}
                  onChange={(e) => {
                    setCategoryFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                >
                  <option value="">Barcha xarajat kategoriyalari</option>
                  {expenseCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Min Amount */}
              <div>
                <input
                  type="number"
                  placeholder="Min summa (so'm)..."
                  value={minAmount}
                  onChange={(e) => {
                    setMinAmount(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                />
              </div>

              {/* Max Amount */}
              <div>
                <input
                  type="number"
                  placeholder="Max summa (so'm)..."
                  value={maxAmount}
                  onChange={(e) => {
                    setMaxAmount(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>

            {(categoryFilter || minAmount || maxAmount || search) && (
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
                <span>Filtr qo'llanilgan ({filteredExpenses.length} ta natija)</span>
                <button
                  onClick={() => {
                    setCategoryFilter('');
                    setMinAmount('');
                    setMaxAmount('');
                    setSearch('');
                    setCurrentPage(1);
                  }}
                  className="text-rose-600 hover:text-rose-700 font-semibold"
                >
                  Filtrlarni tozalash
                </button>
              </div>
            )}
          </div>

          {viewMode === 'list' ? (
            /* Primary List Format */
            <div className="space-y-2.5">
              {/* Bulk Action Bar for List */}
              {selectedIds.length > 0 && (
                <div className="p-3 bg-slate-900 text-white rounded-2xl flex items-center justify-between shadow-lg animate-in slide-in-from-top-2">
                  <div className="flex items-center gap-2 text-xs font-bold">
                    <span className="px-2 py-0.5 bg-rose-600 rounded-md">{selectedIds.length} ta tanlandi</span>
                    <span className="text-slate-300">Ommaviy amalni tanlang:</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsBulkDeleteConfirmOpen(true)}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Ommaviy O'chirish</span>
                    </button>
                    <button
                      onClick={() => setSelectedIds([])}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-colors"
                    >
                      Bekor qilish
                    </button>
                  </div>
                </div>
              )}

              {paginatedExpenses.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center text-xs text-slate-400">
                  Xarajat ma'lumotlari topilmadi
                </div>
              ) : (
                paginatedExpenses.map((item) => {
                  const cat = categories.find((c) => c.id === item.category_id);
                  const isSelected = selectedIds.includes(item.id);
                  return (
                    <div
                      key={item.id}
                      className={`bg-white rounded-2xl border p-4 shadow-xs hover:border-rose-200 hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group ${
                        isSelected ? 'border-rose-500 bg-rose-50/20 ring-1 ring-rose-500' : 'border-slate-200/80'
                      }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <button
                          onClick={() => handleToggleSelect(item.id)}
                          className="text-slate-400 hover:text-rose-600 shrink-0"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-5 h-5 text-rose-600" />
                          ) : (
                            <Square className="w-5 h-5 text-slate-300" />
                          )}
                        </button>
                        <div
                          className="p-3 rounded-2xl text-white shrink-0 shadow-xs"
                          style={{ backgroundColor: cat?.color || '#ef4444' }}
                        >
                          <CategoryIcon name={cat?.icon || 'ShoppingCart'} className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-900 text-sm">
                              {cat?.name || 'Boshqa xarajat'}
                            </span>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                              {item.payment_method}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 mt-0.5">
                            {item.description ? item.description : "Izohsiz xarajat"}
                          </p>
                          <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            <span>{formatDate(item.date)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 shrink-0 gap-1.5">
                        <div className="text-base sm:text-lg font-black text-rose-600 tracking-tight">
                          -{formatCurrency(item.amount, settings.currency)}
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleOpenModal(item)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Tahrirlash"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteTargetId(item.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="O'chirish"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}

              <div className="bg-white rounded-2xl border border-slate-200/80 p-2 shadow-xs">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={filteredExpenses.length}
                  pageSize={pageSize}
                  onPageChange={setCurrentPage}
                  onPageSizeChange={setPageSize}
                  itemLabel="xarajat"
                />
              </div>
            </div>
          ) : (
            /* Table Format */
            <div className="bg-white rounded-xl border border-[#cbd5e1] shadow-xs overflow-hidden font-sans">
              {/* Excel Spreadsheet Formula Bar Header & Bulk actions */}
              <div className="bg-[#f8fafc] px-4 py-2 border-b border-[#cbd5e1] flex items-center justify-between text-xs text-slate-600 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold bg-[#e2e8f0] px-2 py-0.5 rounded text-slate-700">fx</span>
                  <span className="font-mono text-slate-700 font-semibold">=SUM(G2:G{paginatedExpenses.length + 1})</span>
                  {selectedIds.length > 0 && (
                    <div className="flex items-center gap-2 ml-4">
                      <span className="px-2 py-0.5 bg-rose-100 text-rose-800 font-bold rounded">
                        {selectedIds.length} ta belgilandi
                      </span>
                      <button
                        onClick={() => setIsBulkDeleteConfirmOpen(true)}
                        className="px-2 py-0.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>O'chirish</span>
                      </button>
                    </div>
                  )}
                </div>
                <div className="text-[11px] font-mono text-slate-500">
                  Jami tanlangan xarajat: <strong className="text-[#c5221f] font-bold">-{formatCurrency(totalFilteredAmount, settings.currency)}</strong>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#f1f5f9] text-slate-700 font-bold uppercase text-[11px]">
                    <tr className="border-b border-[#cbd5e1]">
                      <th className="w-10 px-2 py-2.5 text-center bg-[#e2e8f0] border-r border-[#cbd5e1]">
                        <button onClick={handleSelectAll} className="flex items-center justify-center mx-auto text-slate-600">
                          {selectedIds.length === paginatedExpenses.length && paginatedExpenses.length > 0 ? (
                            <CheckSquare className="w-4 h-4 text-rose-600" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-400" />
                          )}
                        </button>
                      </th>
                      <th className="w-12 px-3 py-2.5 text-center bg-[#e2e8f0] text-slate-600 border-r border-[#cbd5e1]">№</th>
                      <th
                        onClick={() => handleSort('date')}
                        className="px-3.5 py-2.5 border-r border-[#cbd5e1] cursor-pointer hover:bg-slate-200 transition-colors select-none"
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span>Sana</span>
                          {sortField === 'date' ? (
                            sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-rose-600" /> : <ArrowDown className="w-3 h-3 text-rose-600" />
                          ) : (
                            <ArrowUpDown className="w-3 h-3 text-slate-400" />
                          )}
                        </div>
                      </th>
                      <th
                        onClick={() => handleSort('category')}
                        className="px-3.5 py-2.5 border-r border-[#cbd5e1] cursor-pointer hover:bg-slate-200 transition-colors select-none"
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span>Kategoriya</span>
                          {sortField === 'category' ? (
                            sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-rose-600" /> : <ArrowDown className="w-3 h-3 text-rose-600" />
                          ) : (
                            <ArrowUpDown className="w-3 h-3 text-slate-400" />
                          )}
                        </div>
                      </th>
                      <th
                        onClick={() => handleSort('description')}
                        className="px-3.5 py-2.5 border-r border-[#cbd5e1] cursor-pointer hover:bg-slate-200 transition-colors select-none"
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span>Izoh / Maqsad</span>
                          {sortField === 'description' ? (
                            sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-rose-600" /> : <ArrowDown className="w-3 h-3 text-rose-600" />
                          ) : (
                            <ArrowUpDown className="w-3 h-3 text-slate-400" />
                          )}
                        </div>
                      </th>
                      <th
                        onClick={() => handleSort('payment_method')}
                        className="px-3.5 py-2.5 border-r border-[#cbd5e1] cursor-pointer hover:bg-slate-200 transition-colors select-none"
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span>To'lov Usuli</span>
                          {sortField === 'payment_method' ? (
                            sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-rose-600" /> : <ArrowDown className="w-3 h-3 text-rose-600" />
                          ) : (
                            <ArrowUpDown className="w-3 h-3 text-slate-400" />
                          )}
                        </div>
                      </th>
                      <th
                        onClick={() => handleSort('amount')}
                        className="px-3.5 py-2.5 text-right border-r border-[#cbd5e1] cursor-pointer hover:bg-slate-200 transition-colors select-none"
                      >
                        <div className="flex items-center justify-end gap-1">
                          <span>Summa ({settings.currency})</span>
                          {sortField === 'amount' ? (
                            sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-rose-600" /> : <ArrowDown className="w-3 h-3 text-rose-600" />
                          ) : (
                            <ArrowUpDown className="w-3 h-3 text-slate-400" />
                          )}
                        </div>
                      </th>
                      <th className="px-3.5 py-2.5 text-center">Amallar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-700 font-sans">
                    {paginatedExpenses.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-12 text-slate-400">
                          Xarajat ma'lumotlari topilmadi
                        </td>
                      </tr>
                    ) : (
                      paginatedExpenses.map((item, index) => {
                        const cat = categories.find((c) => c.id === item.category_id);
                        const rowNumber = (currentPage - 1) * pageSize + index + 1;
                        const isSelected = selectedIds.includes(item.id);
                        return (
                          <tr key={item.id} className={`transition-colors ${isSelected ? 'bg-rose-50/70' : 'hover:bg-rose-50/30'}`}>
                            <td className="px-2 py-2.5 text-center bg-[#f8fafc] border-r border-[#e2e8f0]">
                              <button onClick={() => handleToggleSelect(item.id)} className="flex items-center justify-center mx-auto text-slate-600">
                                {isSelected ? (
                                  <CheckSquare className="w-4 h-4 text-rose-600" />
                                ) : (
                                  <Square className="w-4 h-4 text-slate-300" />
                                )}
                              </button>
                            </td>
                            <td className="px-3 py-2.5 text-center bg-[#f8fafc] text-slate-500 font-mono border-r border-[#e2e8f0]">
                              {rowNumber}
                            </td>
                            <td className="px-3.5 py-2.5 font-medium text-slate-900 whitespace-nowrap border-r border-[#e2e8f0] font-mono">
                              {formatDate(item.date)}
                            </td>
                            <td className="px-3.5 py-2.5 whitespace-nowrap border-r border-[#e2e8f0]">
                              <div className="flex items-center gap-1.5">
                                <span
                                  className="w-2.5 h-2.5 rounded-full shrink-0"
                                  style={{ backgroundColor: cat?.color || '#ef4444' }}
                                />
                                <span className="font-semibold text-slate-800">
                                  {cat?.name || 'Boshqa xarajat'}
                                </span>
                              </div>
                            </td>
                            <td className="px-3.5 py-2.5 border-r border-[#e2e8f0]">
                              <span className="text-slate-700">{item.description || '-'}</span>
                            </td>
                            <td className="px-3.5 py-2.5 whitespace-nowrap text-slate-600 border-r border-[#e2e8f0]">
                              <span className="px-2 py-0.5 rounded bg-slate-100 text-[11px] font-medium text-slate-700">
                                {item.payment_method}
                              </span>
                            </td>
                            <td className="px-3.5 py-2.5 text-right font-bold text-[#c5221f] whitespace-nowrap font-mono border-r border-[#e2e8f0]">
                              -{formatCurrency(item.amount, settings.currency)}
                            </td>
                            <td className="px-3.5 py-2.5 text-center whitespace-nowrap">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => handleOpenModal(item)}
                                  className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                                  title="Tahrirlash"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setDeleteTargetId(item.id)}
                                  className="p-1 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                                  title="O'chirish"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                  {/* Excel Accounting Formula Total Row */}
                  {paginatedExpenses.length > 0 && (
                    <tfoot className="bg-[#f1f5f9] border-t-2 border-[#107c41] text-xs font-bold text-slate-900">
                      <tr>
                        <td colSpan={6} className="px-4 py-2.5 text-right uppercase tracking-wider text-slate-600 border-r border-[#cbd5e1]">
                          JAMI XARAJAT (=SUM):
                        </td>
                        <td className="px-3.5 py-2.5 text-right text-[#c5221f] font-mono text-sm border-r border-[#cbd5e1] border-b-4 border-double border-[#c5221f]">
                          -{formatCurrency(totalFilteredAmount, settings.currency)}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>

              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={filteredExpenses.length}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={setPageSize}
                itemLabel="xarajat"
              />
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-rose-100 text-rose-700 rounded-xl">
                  <TrendingDown className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  {editingExpense ? "Xarajatni Tahrirlash" : "Yangi Xarajat Kiritish"}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Summa (so'm) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  required
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                  placeholder="Masalan: 450 000"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Sana <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kategoriya <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formCategoryId}
                  onChange={(e) => setFormCategoryId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                >
                  {expenseCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">To'lov Usuli</label>
                <select
                  value={formPaymentMethod}
                  onChange={(e) => setFormPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                >
                  <option value="Plastik karta">Plastik karta (Uzcard / Humo / Visa)</option>
                  <option value="Naqd">Naqd pul</option>
                  <option value="Bank o'tkazmasi">Bank hisob raqami / O'tkazma</option>
                  <option value="Boshqa">Boshqa</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Izoh / Maqsad</label>
                <input
                  type="text"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Masalan: Korzinka supermarketdan oziq-ovqat"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl shadow-sm shadow-rose-600/20"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingExpense ? "O'zgarishlarni Saqlash" : "Xarajatni Saqlash"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTargetId}
        title="Xarajatni o'chirish"
        message="Haqiqatan ham ushbu xarajat yozuvini o'chirmoqchimisiz? Ushbu amaldan so'ng balans qayta hisoblanadi."
        confirmLabel="Ha, o'chirilsin"
        cancelLabel="Bekor qilish"
        onConfirm={() => {
          if (deleteTargetId) {
            deleteExpense(deleteTargetId);
            setDeleteTargetId(null);
          }
        }}
        onCancel={() => setDeleteTargetId(null)}
      />

      {/* Bulk Delete Confirmation */}
      <ConfirmDialog
        isOpen={isBulkDeleteConfirmOpen}
        title="Ommaviy Xarajatlarni O'chirish"
        message={`Haqiqatan ham tanlangan ${selectedIds.length} ta xarajat yozuvini o'chirmoqchimisiz? O'chirilgan ma'lumotlar Chiqindilar qutisiga (Recycle Bin) o'tadi va ularni keyinchalik qayta tiklash mumkin.`}
        confirmLabel={`Ha, barcha ${selectedIds.length} tasini o'chirish`}
        cancelLabel="Bekor qilish"
        onConfirm={handleExecuteBulkDelete}
        onCancel={() => setIsBulkDeleteConfirmOpen(false)}
      />
    </div>
  );
};
