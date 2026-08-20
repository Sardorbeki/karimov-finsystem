import React, { useState, useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency, formatDate } from '../../lib/formatters';
import {
  Trash2,
  RotateCcw,
  AlertTriangle,
  X,
  Check,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownLeft,
  HandCoins,
  ShieldAlert
} from 'lucide-react';
import { ConfirmDialog } from './ConfirmDialog';

interface RecycleBinModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RecycleBinModal: React.FC<RecycleBinModalProps> = ({
  isOpen,
  onClose
}) => {
  const {
    trashItems,
    restoreItem,
    permanentDeleteItem,
    emptyTrash,
    settings
  } = useFinance();

  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense' | 'debt'>('all');
  const [search, setSearch] = useState('');
  const [isConfirmEmptyOpen, setIsConfirmEmptyOpen] = useState(false);
  const [permanentTarget, setPermanentTarget] = useState<{ type: 'income' | 'expense' | 'debt'; id: string } | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const filteredItems = useMemo(() => {
    return trashItems.filter((item) => {
      if (filterType !== 'all' && item.type !== filterType) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        if (!item.title.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [trashItems, filterType, search]);

  if (!isOpen) return null;

  const handleRestore = (type: 'income' | 'expense' | 'debt', id: string, title: string) => {
    restoreItem(type, id);
    setSuccessToast(`"${title}" muvaffaqiyatli qayta tiklandi!`);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const handlePermanentDelete = () => {
    if (permanentTarget) {
      permanentDeleteItem(permanentTarget.type, permanentTarget.id);
      setPermanentTarget(null);
      setSuccessToast("Yozuv butunlay o'chirildi.");
      setTimeout(() => setSuccessToast(null), 3000);
    }
  };

  const handleEmptyTrash = () => {
    emptyTrash();
    setIsConfirmEmptyOpen(false);
    setSuccessToast("Chiqindilar qutisi to'liq tozalandi!");
    setTimeout(() => setSuccessToast(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 md:p-7 animate-in zoom-in-95 max-h-[88vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-50 text-rose-600 rounded-2xl">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-lg">
                Chiqindilar Qutisi (Recycle Bin)
              </h3>
              <p className="text-xs text-slate-500">
                O'chirilgan yozuvlarni 1-klikda qayta tiklash yoki butunlay tozalash
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toast */}
        {successToast && (
          <div className="mb-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold flex items-center justify-between animate-in fade-in shrink-0">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>{successToast}</span>
            </div>
            <button onClick={() => setSuccessToast(null)}>✕</button>
          </div>
        )}

        {/* Filter Bar & Empty All */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 shrink-0">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filterType === 'all' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Barchasi ({trashItems.length})
            </button>
            <button
              onClick={() => setFilterType('income')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filterType === 'income' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Daromadlar
            </button>
            <button
              onClick={() => setFilterType('expense')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filterType === 'expense' ? 'bg-white text-rose-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Xarajatlar
            </button>
            <button
              onClick={() => setFilterType('debt')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filterType === 'debt' ? 'bg-white text-amber-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Qarzlar
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-48">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Qidiruv..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
              />
            </div>

            {trashItems.length > 0 && (
              <button
                onClick={() => setIsConfirmEmptyOpen(true)}
                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl border border-rose-200 transition-colors flex items-center gap-1.5 shrink-0"
                title="Barcha o'chirilgan yozuvlarni butunlay tozalash"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Qutini Tozalash</span>
              </button>
            )}
          </div>
        </div>

        {/* List of Trash Items */}
        <div className="overflow-y-auto flex-1 border border-slate-200 rounded-2xl divide-y divide-slate-100 bg-white">
          {filteredItems.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <Trash2 className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p className="text-xs font-medium">Chiqindilar qutisi bo'sh</p>
            </div>
          ) : (
            filteredItems.map((item) => {
              const isIncome = item.type === 'income';
              const isExpense = item.type === 'expense';

              return (
                <div
                  key={`${item.type}_${item.id}`}
                  className="p-3.5 hover:bg-slate-50 transition-colors flex items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                        isIncome
                          ? 'bg-emerald-100 text-emerald-700'
                          : isExpense
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {isIncome ? (
                        <ArrowUpRight className="w-4 h-4" />
                      ) : isExpense ? (
                        <ArrowDownLeft className="w-4 h-4" />
                      ) : (
                        <HandCoins className="w-4 h-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900 truncate">
                          {item.title}
                        </span>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold uppercase ${
                            isIncome
                              ? 'bg-emerald-50 text-emerald-700'
                              : isExpense
                              ? 'bg-rose-50 text-rose-700'
                              : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {isIncome ? 'Daromad' : isExpense ? 'Xarajat' : 'Qarz'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        O'chirilgan vaqt: {formatDate(item.deleted_at)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={`font-mono text-xs font-bold ${
                        isIncome
                          ? 'text-emerald-700'
                          : isExpense
                          ? 'text-rose-700'
                          : 'text-slate-800'
                      }`}
                    >
                      {formatCurrency(item.amount, settings.currency)}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleRestore(item.type, item.id, item.title)}
                        className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
                        title="Asl holiga qayta tiklash"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Tiklash</span>
                      </button>
                      <button
                        onClick={() => setPermanentTarget({ type: item.type, id: item.id })}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Butunlay o'chirish"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <span>Jami: {trashItems.length} ta o'chirilgan yozuv</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Yopish
          </button>
        </div>
      </div>

      {/* Confirm Permanent Delete */}
      <ConfirmDialog
        isOpen={!!permanentTarget}
        title="Butunlay O'chirish"
        message="Haqiqatan ham ushbu yozuvni butunlay o'chirmoqchimisiz? Uni keyinchalik qayta tiklab bo'lmaydi."
        confirmText="Butunlay o'chirish"
        cancelText="Bekor qilish"
        onConfirm={handlePermanentDelete}
        onCancel={() => setPermanentTarget(null)}
      />

      {/* Confirm Empty Trash */}
      <ConfirmDialog
        isOpen={isConfirmEmptyOpen}
        title="Chiqindilar Qutisini Tozalash"
        message="Chiqindilar qutisidagi barcha o'chirilgan yozuvlar butunlay yo'q qilinadi. Rozimisiz?"
        confirmText="Barchasini tozalash"
        cancelText="Bekor qilish"
        onConfirm={handleEmptyTrash}
        onCancel={() => setIsConfirmEmptyOpen(false)}
      />
    </div>
  );
};
