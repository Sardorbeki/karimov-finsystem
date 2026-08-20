import React, { useState, useEffect } from 'react';
import { X, TrendingUp, TrendingDown, HandCoins, Check, AlertCircle } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { toInputDateFormat } from '../../lib/formatters';

export const QuickAddModal: React.FC = () => {
  const {
    isQuickAddOpen,
    setIsQuickAddOpen,
    quickAddType,
    setQuickAddType,
    categories,
    addIncome,
    addExpense,
    addDebt
  } = useFinance();

  const [date, setDate] = useState(toInputDateFormat());
  const [categoryId, setCategoryId] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Plastik karta');
  const [debtType, setDebtType] = useState<'given' | 'received'>('given');
  const [counterparty, setCounterparty] = useState('');
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return toInputDateFormat(d);
  });
  const [error, setError] = useState<string | null>(null);

  // Filter categories by type
  const incomeCategories = categories.filter((c) => c.type === 'income');
  const expenseCategories = categories.filter((c) => c.type === 'expense');

  useEffect(() => {
    if (quickAddType === 'income' && incomeCategories.length > 0) {
      setCategoryId(incomeCategories[0].id);
    } else if (quickAddType === 'expense' && expenseCategories.length > 0) {
      setCategoryId(expenseCategories[0].id);
    }
    setError(null);
  }, [quickAddType, categories]);

  if (!isQuickAddOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsedAmount = parseFloat(amount.replace(/\s+/g, ''));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Iltimos, musbat summa kiriting.');
      return;
    }

    if (!date) {
      setError('Iltimos, sanani tanlang.');
      return;
    }

    if (quickAddType === 'income') {
      if (!categoryId) {
        setError('Iltimos, kategoriyani tanlang.');
        return;
      }
      addIncome({
        date,
        category_id: categoryId,
        amount: parsedAmount,
        description: description.trim(),
        payment_method: paymentMethod
      });
    } else if (quickAddType === 'expense') {
      if (!categoryId) {
        setError('Iltimos, kategoriyani tanlang.');
        return;
      }
      addExpense({
        date,
        category_id: categoryId,
        amount: parsedAmount,
        description: description.trim(),
        payment_method: paymentMethod
      });
    } else if (quickAddType === 'debt') {
      if (!counterparty.trim()) {
        setError('Iltimos, kimga/kimdan ekanligini yozing.');
        return;
      }
      if (!dueDate) {
        setError('Iltimos, qaytarish muddatini kiriting.');
        return;
      }
      addDebt({
        type: debtType,
        counterparty: counterparty.trim(),
        initial_amount: parsedAmount,
        due_date: dueDate,
        description: description.trim()
      });
    }

    // Reset & Close
    setAmount('');
    setDescription('');
    setCounterparty('');
    setIsQuickAddOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95">
        {/* Header Tabs */}
        <div className="bg-slate-50 border-b border-slate-200 p-3 flex items-center justify-between">
          <div className="flex items-center gap-1 bg-slate-200/80 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setQuickAddType('income')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                quickAddType === 'income'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Daromad</span>
            </button>
            <button
              type="button"
              onClick={() => setQuickAddType('expense')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                quickAddType === 'expense'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TrendingDown className="w-3.5 h-3.5" />
              <span>Xarajat</span>
            </button>
            <button
              type="button"
              onClick={() => setQuickAddType('debt')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                quickAddType === 'debt'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <HandCoins className="w-3.5 h-3.5" />
              <span>Qarz</span>
            </button>
          </div>

          <button
            onClick={() => setIsQuickAddOpen(false)}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Debt Type Selector (if Debt) */}
          {quickAddType === 'debt' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Qarz Yo'nalishi</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDebtType('given')}
                  className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                    debtType === 'given'
                      ? 'bg-amber-50 border-amber-300 text-amber-900 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span>Berilgan qarz (Menga qaytarishadi)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDebtType('received')}
                  className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                    debtType === 'received'
                      ? 'bg-indigo-50 border-indigo-300 text-indigo-900 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span>Olingan qarz (Men qaytarishim kerak)</span>
                </button>
              </div>
            </div>
          )}

          {/* Amount */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Summa (so'm) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                step="any"
                min="0"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Masalan: 1 500 000"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all placeholder:text-slate-400"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                so'm
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Sana <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Category / Due Date */}
            {quickAddType !== 'debt' ? (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Kategoriya <span className="text-rose-500">*</span>
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                >
                  {(quickAddType === 'income' ? incomeCategories : expenseCategories).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Qaytarish muddati <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            )}
          </div>

          {/* Counterparty if Debt */}
          {quickAddType === 'debt' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                {debtType === 'given' ? 'Kimga berildi (Ism / Tashkilot)' : 'Kimdan olindi (Ism / Bank)'} <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={counterparty}
                onChange={(e) => setCounterparty(e.target.value)}
                placeholder="Masalan: Alisher Rahimov"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          )}

          {/* Payment Method if Income/Expense */}
          {quickAddType !== 'debt' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">To'lov Usuli</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Plastik karta">Plastik karta (Uzcard / Humo / Visa)</option>
                <option value="Naqd">Naqd pul</option>
                <option value="Bank o'tkazmasi">Bank hisob raqami / O'tkazma</option>
                <option value="Boshqa">Boshqa</option>
              </select>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Izoh / Maqsad</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Qisqacha izoh yozing..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Submit */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsQuickAddOpen(false)}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              className={`flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white rounded-xl shadow-md transition-all ${
                quickAddType === 'income'
                  ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                  : quickAddType === 'expense'
                  ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
                  : 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20'
              }`}
            >
              <Check className="w-4 h-4" />
              <span>Saqlash</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
