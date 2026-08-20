import React, { useState, useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { Debt, DebtWithComputed, DebtPayment } from '../../types';
import {
  formatCurrency,
  formatDate,
  getDebtStatusLabel,
  toInputDateFormat
} from '../../lib/formatters';
import {
  Plus,
  Search,
  HandCoins,
  ArrowUpRight,
  ArrowDownLeft,
  AlertTriangle,
  CheckCircle,
  Clock,
  Edit2,
  Trash2,
  Receipt,
  X,
  Check,
  Download,
  DollarSign,
  FileSpreadsheet,
  Loader2,
  List,
  History,
  CreditCard
} from 'lucide-react';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { Pagination } from '../common/Pagination';
import { exportDebtsModuleExcel } from '../../lib/excelExportEngine';

export const DebtView: React.FC = () => {
  const {
    debts,
    debtPayments,
    settings,
    addDebt,
    updateDebt,
    deleteDebt,
    addDebtPayment,
    deleteDebtPayment
  } = useFinance();

  // Top Section Mode: 'debts' (Qarzlar ro'yxati) | 'payments' (Qarz to'lovlari tarixi)
  const [activeSection, setActiveSection] = useState<'debts' | 'payments'>('debts');

  // Debts Filters & Pagination
  const [debtTab, setDebtTab] = useState<'all' | 'given' | 'received'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'paid' | 'overdue'>('all');
  const [search, setSearch] = useState('');
  const [debtPage, setDebtPage] = useState(1);
  const [debtPageSize, setDebtPageSize] = useState(20);

  // Payments Filters & Pagination
  const [paymentSearch, setPaymentSearch] = useState('');
  const [paymentPage, setPaymentPage] = useState(1);
  const [paymentPageSize, setPaymentPageSize] = useState(20);

  // Modal states
  const [isDebtModalOpen, setIsDebtModalOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
  const [selectedDebtForPayment, setSelectedDebtForPayment] = useState<DebtWithComputed | null>(null);
  const [deleteDebtTargetId, setDeleteDebtTargetId] = useState<string | null>(null);
  const [deletePaymentTargetId, setDeletePaymentTargetId] = useState<string | null>(null);

  // Debt Form
  const [formType, setFormType] = useState<'given' | 'received'>('given');
  const [formCounterparty, setFormCounterparty] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formDueDate, setFormDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return toInputDateFormat(d);
  });
  const [formDescription, setFormDescription] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Repayment Form
  const [repayAmount, setRepayAmount] = useState('');
  const [repayDate, setRepayDate] = useState(toInputDateFormat());
  const [repayMethod, setRepayMethod] = useState('Plastik karta');
  const [repayNote, setRepayNote] = useState('');
  const [repayError, setRepayError] = useState<string | null>(null);

  const [isExporting, setIsExporting] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Filtered Debts
  const filteredDebts = useMemo(() => {
    return debts.filter((d) => {
      if (debtTab !== 'all' && d.type !== debtTab) return false;

      if (statusFilter === 'active' && d.remaining_amount <= 0) return false;
      if (statusFilter === 'paid' && d.remaining_amount > 0) return false;
      if (statusFilter === 'overdue' && !d.is_overdue) return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesName = d.counterparty.toLowerCase().includes(q);
        const matchesDesc = (d.description || '').toLowerCase().includes(q);
        if (!matchesName && !matchesDesc) return false;
      }

      return true;
    });
  }, [debts, debtTab, statusFilter, search]);

  // Paginated Debts
  const totalDebtPages = Math.ceil(filteredDebts.length / debtPageSize) || 1;
  const paginatedDebts = useMemo(() => {
    const start = (debtPage - 1) * debtPageSize;
    return filteredDebts.slice(start, start + debtPageSize);
  }, [filteredDebts, debtPage, debtPageSize]);

  // Filtered Payments (with joined counterparty & debt type info)
  const paymentsWithDebtInfo = useMemo(() => {
    return debtPayments.map((p) => {
      const debt = debts.find((d) => d.id === p.debt_id);
      return {
        ...p,
        counterparty: debt ? debt.counterparty : "Noma'lum qarz",
        debtType: debt ? debt.type : 'given'
      };
    });
  }, [debtPayments, debts]);

  const filteredPayments = useMemo(() => {
    return paymentsWithDebtInfo.filter((p) => {
      if (paymentSearch.trim()) {
        const q = paymentSearch.toLowerCase();
        const matchesCounterparty = p.counterparty.toLowerCase().includes(q);
        const matchesNote = (p.note || '').toLowerCase().includes(q);
        const matchesMethod = (p.payment_method || '').toLowerCase().includes(q);
        if (!matchesCounterparty && !matchesNote && !matchesMethod) return false;
      }
      return true;
    });
  }, [paymentsWithDebtInfo, paymentSearch]);

  // Paginated Payments
  const totalPaymentPages = Math.ceil(filteredPayments.length / paymentPageSize) || 1;
  const paginatedPayments = useMemo(() => {
    const start = (paymentPage - 1) * paymentPageSize;
    return filteredPayments.slice(start, start + paymentPageSize);
  }, [filteredPayments, paymentPage, paymentPageSize]);

  // Summary KPIs
  const kpis = useMemo(() => {
    let givenTotal = 0;
    let givenRemaining = 0;
    let receivedTotal = 0;
    let receivedRemaining = 0;
    let overdueCount = 0;

    debts.forEach((d) => {
      if (d.type === 'given') {
        givenTotal += d.initial_amount;
        givenRemaining += d.remaining_amount;
      } else {
        receivedTotal += d.initial_amount;
        receivedRemaining += d.remaining_amount;
      }
      if (d.is_overdue) overdueCount++;
    });

    const totalRepayments = debtPayments.reduce((sum, p) => sum + p.amount, 0);

    return {
      givenTotal,
      givenRemaining,
      receivedTotal,
      receivedRemaining,
      netBalance: givenRemaining - receivedRemaining,
      overdueCount,
      totalRepayments
    };
  }, [debts, debtPayments]);

  // Open Add/Edit Debt Modal
  const handleOpenDebtModal = (debt?: Debt) => {
    if (debt) {
      setEditingDebt(debt);
      setFormType(debt.type);
      setFormCounterparty(debt.counterparty);
      setFormAmount(debt.initial_amount.toString());
      setFormDueDate(debt.due_date.split('T')[0]);
      setFormDescription(debt.description || '');
    } else {
      setEditingDebt(null);
      setFormType(debtTab === 'received' ? 'received' : 'given');
      setFormCounterparty('');
      setFormAmount('');
      const d = new Date();
      d.setDate(d.getDate() + 30);
      setFormDueDate(toInputDateFormat(d));
      setFormDescription('');
    }
    setFormError(null);
    setIsDebtModalOpen(true);
  };

  const handleSaveDebt = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const parsedAmount = parseFloat(formAmount.replace(/\s+/g, ''));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setFormError('Iltimos, to\'g\'ri dastlabki qarz summasini kiriting.');
      return;
    }
    if (!formCounterparty.trim()) {
      setFormError('Iltimos, shaxs yoki tashkilot nomini kiriting.');
      return;
    }
    if (!formDueDate) {
      setFormError('Iltimos, qaytarish muddatini tanlang.');
      return;
    }

    if (editingDebt) {
      updateDebt({
        ...editingDebt,
        type: formType,
        counterparty: formCounterparty.trim(),
        initial_amount: parsedAmount,
        due_date: formDueDate,
        description: formDescription.trim()
      });
      setSuccessToast('Qarz yozuvi yangilandi!');
    } else {
      addDebt({
        type: formType,
        counterparty: formCounterparty.trim(),
        initial_amount: parsedAmount,
        due_date: formDueDate,
        description: formDescription.trim()
      });
      setSuccessToast('Yangi qarz ro\'yxatga kiritildi!');
    }

    setIsDebtModalOpen(false);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  // Open Repayment Modal
  const handleOpenRepayModal = (debt: DebtWithComputed) => {
    setSelectedDebtForPayment(debt);
    setRepayAmount(debt.remaining_amount.toString());
    setRepayDate(toInputDateFormat());
    setRepayMethod('Plastik karta');
    setRepayNote('');
    setRepayError(null);
  };

  const handleAddPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setRepayError(null);
    if (!selectedDebtForPayment) return;

    const parsedAmount = parseFloat(repayAmount.replace(/\s+/g, ''));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setRepayError('Iltimos, musbat to\'lov summasini kiriting.');
      return;
    }

    if (parsedAmount > selectedDebtForPayment.remaining_amount) {
      setRepayError(
        `To'lov summasi qarz qoldig'idan (${formatCurrency(
          selectedDebtForPayment.remaining_amount,
          settings.currency
        )}) oshmasligi kerak!`
      );
      return;
    }

    addDebtPayment({
      debt_id: selectedDebtForPayment.id,
      amount: parsedAmount,
      date: repayDate,
      payment_method: repayMethod,
      note: repayNote.trim()
    });

    setSelectedDebtForPayment(null);
    setSuccessToast("Qarz to'lovi muvaffaqiyatli saqlandi!");
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const handleExportExcel = async () => {
    try {
      setIsExporting(true);
      await exportDebtsModuleExcel(filteredDebts, 'Barcha Qarzlar');
      setSuccessToast("Qarzlar va To'lovlar jurnali Excel faylida yuklab olindi!");
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
            <div className="p-2 bg-amber-50 text-amber-700 rounded-xl">
              <HandCoins className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Qarzlar va Qarz To'lovlari</h2>
          </div>
          <p className="text-xs text-slate-500">
            Berilgan va olingan qarzlar balansi, qaytarish muddatlari va to'lovlar tarixi jurnali
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleExportExcel}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition-colors shadow-xs disabled:opacity-50"
            title="Qarzlarni Excel formatida yuklab olish"
          >
            {isExporting ? (
              <Loader2 className="w-3.5 h-3.5 text-amber-600 animate-spin" />
            ) : (
              <FileSpreadsheet className="w-3.5 h-3.5 text-amber-600" />
            )}
            <span>{isExporting ? 'Excel...' : 'Excel (.xlsx)'}</span>
          </button>

          <button
            onClick={() => handleOpenDebtModal()}
            className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Yangi Qarz</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Given Debts */}
        <div className="bg-white p-4 rounded-2xl border border-amber-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">
              Berilgan Qarzlar (Kutilmoqda)
            </span>
            <ArrowUpRight className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-xl font-black text-slate-900">
            {formatCurrency(kpis.givenRemaining, settings.currency)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1 font-medium">
            Jami berilgan: {formatCurrency(kpis.givenTotal, settings.currency)}
          </p>
        </div>

        {/* Received Debts */}
        <div className="bg-white p-4 rounded-2xl border border-purple-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-purple-800 uppercase tracking-wider">
              Olingan Qarzlar (Majburiyat)
            </span>
            <ArrowDownLeft className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-xl font-black text-slate-900">
            {formatCurrency(kpis.receivedRemaining, settings.currency)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1 font-medium">
            Jami olingan: {formatCurrency(kpis.receivedTotal, settings.currency)}
          </p>
        </div>

        {/* Net Debt Balance */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              Sof Qarz Balansi
            </span>
            <Receipt className="w-4 h-4 text-slate-400" />
          </div>
          <p
            className={`text-xl font-black ${
              kpis.netBalance >= 0 ? 'text-emerald-700' : 'text-rose-700'
            }`}
          >
            {kpis.netBalance >= 0 ? '+' : ''}
            {formatCurrency(kpis.netBalance, settings.currency)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1 font-medium">
            {kpis.netBalance >= 0 ? "Sizga ko'proq qaytishi kerak" : "Majburiyatingiz ko'proq"}
          </p>
        </div>

        {/* Overdue / Repayments */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              Muddati O'tgan / To'lovlar
            </span>
            <AlertTriangle
              className={`w-4 h-4 ${
                kpis.overdueCount > 0 ? 'text-rose-600 animate-pulse' : 'text-slate-400'
              }`}
            />
          </div>
          <p
            className={`text-xl font-black ${
              kpis.overdueCount > 0 ? 'text-rose-600' : 'text-slate-900'
            }`}
          >
            {kpis.overdueCount} ta muddati o'tgan
          </p>
          <p className="text-[11px] text-slate-400 mt-1 font-medium">
            Jami qilingan to'lovlar: {formatCurrency(kpis.totalRepayments, settings.currency)}
          </p>
        </div>
      </div>

      {/* Main Section Switcher: Qarzlar Ro'yxati vs Qarz To'lovlari Tarixi */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveSection('debts')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSection === 'debts'
              ? 'bg-[#107c41] text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <List className="w-4 h-4" />
          <span>Qarzlar Ro'yxati ({debts.length})</span>
        </button>

        <button
          onClick={() => setActiveSection('payments')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSection === 'payments'
              ? 'bg-[#107c41] text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Qarz To'lovlari Tarixi ({debtPayments.length})</span>
        </button>
      </div>

      {/* SECTION 1: DEBTS TABLE (Qarzlar Ro'yxati) */}
      {activeSection === 'debts' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Tabs: All / Given / Received */}
            <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              <button
                onClick={() => {
                  setDebtTab('all');
                  setDebtPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  debtTab === 'all' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Barchasi ({debts.length})
              </button>
              <button
                onClick={() => {
                  setDebtTab('given');
                  setDebtPage(1);
                }}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all ${
                  debtTab === 'given' ? 'bg-white text-amber-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>Berilgan qarzlar</span>
              </button>
              <button
                onClick={() => {
                  setDebtTab('received');
                  setDebtPage(1);
                }}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all ${
                  debtTab === 'received' ? 'bg-white text-purple-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ArrowDownLeft className="w-3.5 h-3.5" />
                <span>Olingan qarzlar</span>
              </button>
            </div>

            {/* Filters: Status & Search */}
            <div className="flex flex-wrap items-center gap-2.5">
              <select
                value={statusFilter}
                onChange={(e: any) => {
                  setStatusFilter(e.target.value);
                  setDebtPage(1);
                }}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              >
                <option value="all">Barcha holatlar</option>
                <option value="active">Faol (Qoldiq bor)</option>
                <option value="overdue">Muddati o'tganlar</option>
                <option value="paid">To'liq to'langanlar</option>
              </select>

              <div className="relative w-full sm:w-56">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Ism yoki izoh..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setDebtPage(1);
                  }}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Structured Debts Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/90 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    <th className="py-3 px-4 w-12 text-center">№</th>
                    <th className="py-3 px-4">Kontragent / Shaxs</th>
                    <th className="py-3 px-4">Qarz Turi</th>
                    <th className="py-3 px-4 text-right">Dastlabki Summa</th>
                    <th className="py-3 px-4 text-right">To'langan</th>
                    <th className="py-3 px-4 text-right">Qoldiq Summa</th>
                    <th className="py-3 px-4 text-center">Qaytarish Muddati</th>
                    <th className="py-3 px-4 text-center">Holat</th>
                    <th className="py-3 px-4 text-center w-36">Amallar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {paginatedDebts.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400">
                        Qarz yozuvlari topilmadi
                      </td>
                    </tr>
                  ) : (
                    paginatedDebts.map((debt, idx) => {
                      const rowNumber = (debtPage - 1) * debtPageSize + idx + 1;
                      const isGiven = debt.type === 'given';
                      const statusInfo = getDebtStatusLabel(debt.computed_status);

                      return (
                        <tr
                          key={debt.id}
                          className={`hover:bg-slate-50/80 transition-colors group ${
                            debt.is_overdue ? 'bg-rose-50/40' : ''
                          }`}
                        >
                          <td className="py-3 px-4 text-center font-mono text-[11px] text-slate-400 font-semibold">
                            {rowNumber}
                          </td>

                          <td className="py-3 px-4">
                            <div>
                              <span className="font-bold text-slate-900 group-hover:text-amber-700 transition-colors">
                                {debt.counterparty}
                              </span>
                              {debt.description && (
                                <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                                  {debt.description}
                                </p>
                              )}
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full font-bold ${
                                isGiven
                                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                  : 'bg-purple-100 text-purple-800 border border-purple-200'
                              }`}
                            >
                              {isGiven ? (
                                <ArrowUpRight className="w-3 h-3 text-amber-700" />
                              ) : (
                                <ArrowDownLeft className="w-3 h-3 text-purple-700" />
                              )}
                              <span>{isGiven ? 'Berilgan' : 'Olingan'}</span>
                            </span>
                          </td>

                          <td className="py-3 px-4 text-right font-mono font-bold text-slate-700">
                            {formatCurrency(debt.initial_amount, settings.currency)}
                          </td>

                          <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">
                            {formatCurrency(debt.paid_amount, settings.currency)}
                          </td>

                          <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                            {debt.remaining_amount > 0 ? (
                              <span className={debt.is_overdue ? 'text-rose-700 font-black' : 'text-slate-900 font-black'}>
                                {formatCurrency(debt.remaining_amount, settings.currency)}
                              </span>
                            ) : (
                              <span className="text-emerald-600 font-semibold">0 (To'liq yopildi)</span>
                            )}
                          </td>

                          <td className="py-3 px-4 text-center font-mono text-[11px] text-slate-600">
                            {formatDate(debt.due_date)}
                          </td>

                          <td className="py-3 px-4 text-center">
                            <span
                              className={`inline-block text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${statusInfo.bg} ${statusInfo.color}`}
                            >
                              {statusInfo.label}
                            </span>
                          </td>

                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {debt.remaining_amount > 0 && (
                                <button
                                  onClick={() => handleOpenRepayModal(debt)}
                                  className="px-2 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1"
                                  title="To'lov kiritish"
                                >
                                  <DollarSign className="w-3 h-3" />
                                  <span>To'lash</span>
                                </button>
                              )}
                              <button
                                onClick={() => handleOpenDebtModal(debt)}
                                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                title="Tahrirlash"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setDeleteDebtTargetId(debt.id)}
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
              currentPage={debtPage}
              totalPages={totalDebtPages}
              totalItems={filteredDebts.length}
              pageSize={debtPageSize}
              onPageChange={setDebtPage}
              onPageSizeChange={setDebtPageSize}
              itemLabel="qarz yozuvi"
            />
          </div>
        </div>
      )}

      {/* SECTION 2: DEBT PAYMENTS TABLE (Qarz To'lovlari Tarixi) */}
      {activeSection === 'payments' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
              <History className="w-4 h-4 text-emerald-700" />
              <span>Qarz to'lovlari va kvitansiyalar jurnali</span>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Kontragent, to'lov usuli yoki izoh..."
                value={paymentSearch}
                onChange={(e) => {
                  setPaymentSearch(e.target.value);
                  setPaymentPage(1);
                }}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Structured Payments Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/90 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    <th className="py-3 px-4 w-12 text-center">№</th>
                    <th className="py-3 px-4">To'lov Sanasi</th>
                    <th className="py-3 px-4">Kontragent / Qarz Egasi</th>
                    <th className="py-3 px-4">Qarz Turi</th>
                    <th className="py-3 px-4 text-right">To'langan Summa</th>
                    <th className="py-3 px-4 text-center">To'lov Usuli</th>
                    <th className="py-3 px-4">Izoh / Kvitansiya</th>
                    <th className="py-3 px-4 text-center w-20">Amallar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {paginatedPayments.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        To'lov yozuvlari topilmadi
                      </td>
                    </tr>
                  ) : (
                    paginatedPayments.map((p, idx) => {
                      const rowNumber = (paymentPage - 1) * paymentPageSize + idx + 1;
                      const isGiven = p.debtType === 'given';

                      return (
                        <tr
                          key={p.id}
                          className="hover:bg-slate-50/80 transition-colors group"
                        >
                          <td className="py-3 px-4 text-center font-mono text-[11px] text-slate-400 font-semibold">
                            {rowNumber}
                          </td>

                          <td className="py-3 px-4 font-mono text-xs font-semibold text-slate-800">
                            {formatDate(p.date)}
                          </td>

                          <td className="py-3 px-4">
                            <span className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                              {p.counterparty}
                            </span>
                          </td>

                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full font-bold ${
                                isGiven
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-purple-100 text-purple-800'
                              }`}
                            >
                              {isGiven ? 'Qarz qaytarildi' : 'Qarz to\'landi'}
                            </span>
                          </td>

                          <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">
                            +{formatCurrency(p.amount, settings.currency)}
                          </td>

                          <td className="py-3 px-4 text-center">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-slate-100 text-slate-700 rounded-md font-medium text-[11px]">
                              <CreditCard className="w-3 h-3 text-slate-500" />
                              <span>{p.payment_method || 'Plastik karta'}</span>
                            </span>
                          </td>

                          <td className="py-3 px-4 text-slate-500 text-xs max-w-xs truncate">
                            {p.note || <span className="text-slate-300 italic">Izohsiz</span>}
                          </td>

                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => setDeletePaymentTargetId(p.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="To'lov yozuvini o'chirish"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
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
              currentPage={paymentPage}
              totalPages={totalPaymentPages}
              totalItems={filteredPayments.length}
              pageSize={paymentPageSize}
              onPageChange={setPaymentPage}
              onPageSizeChange={setPaymentPageSize}
              itemLabel="to'lov yozuvi"
            />
          </div>
        </div>
      )}

      {/* Add / Edit Debt Modal */}
      {isDebtModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-100 text-amber-700 rounded-xl">
                  <HandCoins className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    {editingDebt ? "Qarzni Tahrirlash" : "Yangi Qarz Kiritish"}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Qarz turi, shaxs va qaytarish muddatini kiriting
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsDebtModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-semibold">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveDebt} className="space-y-3.5">
              {/* Type Switcher */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Qarz Turi *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormType('given')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      formType === 'given'
                        ? 'bg-amber-50 border-amber-300 text-amber-800 ring-2 ring-amber-200'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <ArrowUpRight className="w-4 h-4" />
                    <span>Berilgan qarz</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormType('received')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      formType === 'received'
                        ? 'bg-purple-50 border-purple-300 text-purple-800 ring-2 ring-purple-200'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <ArrowDownLeft className="w-4 h-4" />
                    <span>Olingan qarz</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Kontragent (Shaxs / Tashkilot) *
                </label>
                <input
                  type="text"
                  required
                  value={formCounterparty}
                  onChange={(e) => setFormCounterparty(e.target.value)}
                  placeholder="Masalan: Aziz Rahimov, Hamkorbank..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Summa ({settings.currency}) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    required
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Qaytarish Muddati *
                  </label>
                  <input
                    type="date"
                    required
                    value={formDueDate}
                    onChange={(e) => setFormDueDate(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Izoh / Qo'shimcha shartlar
                </label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Ixtiyoriy izoh..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsDebtModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold rounded-xl transition-colors"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
                >
                  {editingDebt ? "Saqlash" : "Qarzni Kiritish"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Repayment Modal */}
      {selectedDebtForPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Qarz To'lovini Qabul Qilish</h3>
                  <p className="text-[11px] text-slate-400">
                    {selectedDebtForPayment.counterparty} ({formatCurrency(selectedDebtForPayment.remaining_amount, settings.currency)} qoldiq)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedDebtForPayment(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {repayError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-semibold">
                {repayError}
              </div>
            )}

            <form onSubmit={handleAddPayment} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    To'lov Summasi *
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    autoFocus
                    required
                    value={repayAmount}
                    onChange={(e) => setRepayAmount(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    To'lov Sanasi *
                  </label>
                  <input
                    type="date"
                    required
                    value={repayDate}
                    onChange={(e) => setRepayDate(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  To'lov Usuli
                </label>
                <select
                  value={repayMethod}
                  onChange={(e) => setRepayMethod(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Plastik karta">Plastik karta (UzCard / Humo)</option>
                  <option value="Naqd pul">Naqd pul</option>
                  <option value="Bank o'tkazmasi">Bank o'tkazmasi (Hisob raqam)</option>
                  <option value="Valyuta (USD)">Valyuta (USD / Naqd)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Kvitansiya / Izoh
                </label>
                <input
                  type="text"
                  value={repayNote}
                  onChange={(e) => setRepayNote(e.target.value)}
                  placeholder="Masalan: 1-qism to'landi..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedDebtForPayment(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold rounded-xl transition-colors"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
                >
                  To'lovni Tasdiqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Debt Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteDebtTargetId}
        title="Qarzni O'chirish"
        message="Haqiqatan ham ushbu qarz yozuvini va unga bog'liq barcha to'lovlar tarixini o'chirmoqchimisiz?"
        confirmText="O'chirish"
        cancelText="Bekor qilish"
        onConfirm={() => {
          if (deleteDebtTargetId) {
            deleteDebt(deleteDebtTargetId);
            setDeleteDebtTargetId(null);
            setSuccessToast("Qarz yozuvi o'chirildi!");
            setTimeout(() => setSuccessToast(null), 3000);
          }
        }}
        onCancel={() => setDeleteDebtTargetId(null)}
      />

      {/* Delete Payment Confirmation */}
      <ConfirmDialog
        isOpen={!!deletePaymentTargetId}
        title="To'lov Yozuvini O'chirish"
        message="Haqiqatan ham ushbu to'lov yozuvini o'chirmoqchimisiz? Qarz qoldig'i avtomatik qayta tiklanadi."
        confirmText="O'chirish"
        cancelText="Bekor qilish"
        onConfirm={() => {
          if (deletePaymentTargetId) {
            deleteDebtPayment(deletePaymentTargetId);
            setDeletePaymentTargetId(null);
            setSuccessToast("To'lov yozuvi o'chirildi va qoldiq tiklandi!");
            setTimeout(() => setSuccessToast(null), 3000);
          }
        }}
        onCancel={() => setDeletePaymentTargetId(null)}
      />
    </div>
  );
};
