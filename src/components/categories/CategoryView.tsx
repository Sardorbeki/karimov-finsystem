import React, { useState, useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { Category } from '../../types';
import { CategoryIcon } from '../common/CategoryIcon';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { Pagination } from '../common/Pagination';
import { formatCurrency } from '../../lib/formatters';
import {
  Plus,
  Edit2,
  Trash2,
  Tags,
  TrendingUp,
  TrendingDown,
  X,
  Check,
  FileSpreadsheet,
  Loader2,
  Search,
  LayoutList,
  Layers,
  ArrowUpDown
} from 'lucide-react';
import { exportCategoriesModuleExcel } from '../../lib/excelExportEngine';

const PRESET_COLORS = [
  '#10b981', '#059669', '#3b82f6', '#2563eb', '#6366f1', '#4f46e5',
  '#8b5cf6', '#7c3aed', '#ec4899', '#db2777', '#f43f5e', '#e11d48',
  '#ef4444', '#dc2626', '#f59e0b', '#d97706', '#14b8a6', '#0d9488',
  '#64748b', '#475569'
];

const PRESET_ICONS = [
  'Briefcase', 'Building2', 'TrendingUp', 'Laptop', 'Coins', 'DollarSign',
  'Wallet', 'ShoppingCart', 'Zap', 'Car', 'Home', 'HeartPulse', 'GraduationCap',
  'Utensils', 'Shirt', 'PiggyBank', 'Gift', 'Plane', 'Smartphone', 'Tag'
];

export const CategoryView: React.FC = () => {
  const { categories, incomes, expenses, settings, saveCategory, deleteCategory } = useFinance();

  const [activeTab, setActiveTab] = useState<'all' | 'income' | 'expense'>('all');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [color, setColor] = useState('#10b981');
  const [icon, setIcon] = useState('Tag');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Calculate stats per category
  const categoryStats = useMemo(() => {
    const map = new Map<string, { count: number; totalAmount: number }>();
    
    categories.forEach((c) => {
      if (c.type === 'income') {
        const filtered = incomes.filter((i) => !i.is_deleted && i.category_id === c.id);
        const total = filtered.reduce((s, i) => s + i.amount, 0);
        map.set(c.id, { count: filtered.length, totalAmount: total });
      } else {
        const filtered = expenses.filter((e) => !e.is_deleted && e.category_id === c.id);
        const total = filtered.reduce((s, e) => s + e.amount, 0);
        map.set(c.id, { count: filtered.length, totalAmount: total });
      }
    });

    return map;
  }, [categories, incomes, expenses]);

  // Filtered categories
  const filteredCategories = useMemo(() => {
    return categories.filter((c) => {
      if (activeTab !== 'all' && c.type !== activeTab) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesName = c.name.toLowerCase().includes(q);
        const matchesDesc = (c.description || '').toLowerCase().includes(q);
        if (!matchesName && !matchesDesc) return false;
      }
      return true;
    });
  }, [categories, activeTab, search]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredCategories.length / pageSize) || 1;
  const paginatedCategories = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredCategories.slice(start, start + pageSize);
  }, [filteredCategories, currentPage, pageSize]);

  const handleOpenModal = (cat?: Category) => {
    if (cat) {
      setEditingCategory(cat);
      setName(cat.name);
      setType(cat.type);
      setColor(cat.color);
      setIcon(cat.icon);
      setDescription(cat.description || '');
    } else {
      setEditingCategory(null);
      setName('');
      setType(activeTab === 'income' ? 'income' : 'expense');
      setColor(activeTab === 'income' ? '#10b981' : '#f43f5e');
      setIcon('Tag');
      setDescription('');
    }
    setError(null);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Kategoriya nomini kiriting.');
      return;
    }

    if (editingCategory) {
      saveCategory({
        id: editingCategory.id,
        name: name.trim(),
        type,
        color,
        icon,
        description: description.trim(),
        is_active: true
      });
      setSuccessToast('Kategoriya muvaffaqiyatli yangilandi!');
    } else {
      saveCategory({
        name: name.trim(),
        type,
        color,
        icon,
        description: description.trim(),
        is_active: true
      });
      setSuccessToast('Yangi kategoriya yaratildi!');
    }

    setIsModalOpen(false);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const handleExportExcel = async () => {
    try {
      setIsExporting(true);
      await exportCategoriesModuleExcel(filteredCategories, incomes, expenses);
      setSuccessToast('Kategoriyalar ro\'yxati Excel faylida yuklab olindi!');
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
            <div className="p-2 bg-indigo-50 text-indigo-700 rounded-xl">
              <Tags className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Kategoriyalar Ro'yxati</h2>
          </div>
          <p className="text-xs text-slate-500">
            Daromad va xarajat kategoriyalari jadvali, operatsiyalar hisobi va umumiy aylanma summalari
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleExportExcel}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition-colors shadow-xs disabled:opacity-50"
            title="Kategoriyalarni Excel formatida yuklab olish"
          >
            {isExporting ? (
              <Loader2 className="w-3.5 h-3.5 text-indigo-600 animate-spin" />
            ) : (
              <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-600" />
            )}
            <span>{isExporting ? 'Excel...' : 'Excel (.xlsx)'}</span>
          </button>

          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#107c41] hover:bg-[#0e6837] active:bg-[#0a4d29] text-white text-xs font-bold rounded-xl shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Yangi Kategoriya</span>
          </button>
        </div>
      </div>

      {/* Control Bar: Filters & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Tabs: All / Incomes / Expenses */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => {
              setActiveTab('all');
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'all' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Barchasi ({categories.length})
          </button>
          <button
            onClick={() => {
              setActiveTab('income');
              setCurrentPage(1);
            }}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'income' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Daromadlar</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('expense');
              setCurrentPage(1);
            }}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'expense' ? 'bg-white text-rose-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <TrendingDown className="w-3.5 h-3.5" />
            <span>Xarajatlar</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Kategoriya nomi yoki izoh..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Structured Category Table (Ro'yxat / Jadval ko'rinishi) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-4 w-12 text-center">№</th>
                <th className="py-3 px-4">Kategoriya</th>
                <th className="py-3 px-4">Turi</th>
                <th className="py-3 px-4">Tavsif / Izoh</th>
                <th className="py-3 px-4 text-center">Operatsiyalar</th>
                <th className="py-3 px-4 text-right">Jami Aylanma</th>
                <th className="py-3 px-4 text-center w-28">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {paginatedCategories.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Kategoriyalar topilmadi
                  </td>
                </tr>
              ) : (
                paginatedCategories.map((cat, idx) => {
                  const stat = categoryStats.get(cat.id) || { count: 0, totalAmount: 0 };
                  const isIncome = cat.type === 'income';
                  const rowNumber = (currentPage - 1) * pageSize + idx + 1;

                  return (
                    <tr
                      key={cat.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      <td className="py-3 px-4 text-center font-mono text-[11px] text-slate-400 font-semibold">
                        {rowNumber}
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0 shadow-2xs"
                            style={{ backgroundColor: cat.color }}
                          >
                            <CategoryIcon name={cat.icon} className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 group-hover:text-[#107c41] transition-colors">
                              {cat.name}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full font-bold ${
                            isIncome
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-rose-100 text-rose-800 border border-rose-200'
                          }`}
                        >
                          {isIncome ? (
                            <TrendingUp className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <TrendingDown className="w-3 h-3 text-rose-600" />
                          )}
                          <span>{isIncome ? 'Daromad' : 'Xarajat'}</span>
                        </span>
                      </td>

                      <td className="py-3 px-4 text-slate-500 text-xs max-w-xs truncate">
                        {cat.description || <span className="text-slate-300 italic">Izohsiz</span>}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-mono font-bold text-[11px]">
                          {stat.count} ta
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <span
                          className={`font-mono font-bold ${
                            isIncome ? 'text-emerald-700' : 'text-rose-700'
                          }`}
                        >
                          {isIncome ? '+' : '-'}{formatCurrency(stat.totalAmount, settings.currency)}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenModal(cat)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Tahrirlash"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteTargetId(cat.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
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
          </table>
        </div>

        {/* Standard Pagination with 10 - 1000 rows limit */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredCategories.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          itemLabel="kategoriya"
        />
      </div>

      {/* Add / Edit Category Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-100 text-indigo-700 rounded-xl">
                  <Tags className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    {editingCategory ? "Kategoriyani Tahrirlash" : "Yangi Kategoriya Qo'shish"}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Parametrlarni kiriting va saqlang
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
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

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Kategoriya Nomi *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Masalan: Ish haqi, Oziq-ovqat, Transport..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Kategoriya Turi *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setType('expense')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      type === 'expense'
                        ? 'bg-rose-50 border-rose-300 text-rose-700 ring-2 ring-rose-200'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <TrendingDown className="w-3.5 h-3.5" />
                    <span>Xarajat (Chiqim)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('income')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      type === 'income'
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-700 ring-2 ring-emerald-200'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>Daromad (Kirim)</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Rangni Tanlang
                </label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-6 h-6 rounded-full transition-transform ${
                        color === c ? 'scale-125 ring-2 ring-offset-2 ring-slate-400' : 'hover:scale-110'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Belgi (Ikonka)
                </label>
                <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5 p-2 bg-slate-50 rounded-xl border border-slate-200 max-h-32 overflow-y-auto">
                  {PRESET_ICONS.map((i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setIcon(i)}
                      className={`p-2 rounded-lg flex items-center justify-center transition-all ${
                        icon === i ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <CategoryIcon name={i} className="w-4 h-4" />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Qisqacha Tavsif
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ixtiyoriy izoh..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold rounded-xl transition-colors"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#107c41] hover:bg-[#0e6837] text-white text-xs font-bold rounded-xl shadow-sm transition-all"
                >
                  {editingCategory ? "Saqlash" : "Qo'shish"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTargetId}
        title="Kategoriyani O'chirish"
        message="Haqiqatan ham ushbu kategoriyani o'chirmoqchimisiz? Bu kategoriya bilan bog'liq eski yozuvlar saqlanib qoladi."
        confirmText="O'chirish"
        cancelText="Bekor qilish"
        onConfirm={() => {
          if (deleteTargetId) {
            deleteCategory(deleteTargetId);
            setDeleteTargetId(null);
            setSuccessToast("Kategoriya o'chirildi!");
            setTimeout(() => setSuccessToast(null), 3000);
          }
        }}
        onCancel={() => setDeleteTargetId(null)}
      />
    </div>
  );
};
