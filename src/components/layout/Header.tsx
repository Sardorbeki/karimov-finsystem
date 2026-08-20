import React, { useState } from 'react';
import {
  Bell,
  Plus,
  TrendingUp,
  TrendingDown,
  HandCoins,
  FileSpreadsheet,
  Calendar,
  Loader2,
  Sparkles,
  Bot,
  User,
  Table,
  Check,
  Search,
  Download,
  Monitor
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { useAuth } from '../../context/AuthContext';
import { DateRangeSelector } from '../common/DateRangeSelector';
import { formatDate } from '../../lib/formatters';
import { exportFullMasterExcel } from '../../lib/excelExportEngine';
import { DesktopInstallModal } from '../common/DesktopInstallModal';

interface HeaderProps {
  onOpenNotifications: () => void;
  onOpenAIAssistant?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenNotifications, onOpenAIAssistant }) => {
  const {
    activeTab,
    setActiveTab,
    filterRange,
    setPeriodFilter,
    unreadNotificationCount,
    setIsQuickAddOpen,
    setQuickAddType,
    summary,
    incomes,
    expenses,
    debts,
    debtPayments,
    budgets,
    categories
  } = useFinance();

  const { currentUser } = useAuth();
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [isExportingMaster, setIsExportingMaster] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);

  const handleExportMaster = async () => {
    try {
      setIsExportingMaster(true);
      await exportFullMasterExcel({
        summary,
        incomes,
        expenses,
        debts,
        debtPayments,
        budgets,
        categories,
        year: '2026'
      });
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (err: any) {
      alert('Excel yaratishda xatolik: ' + err.message);
    } finally {
      setIsExportingMaster(false);
    }
  };

  const handleOpenQuick = (type: 'income' | 'expense' | 'debt') => {
    setQuickAddType(type);
    setIsQuickAddOpen(true);
    setIsAddMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-20 bg-white border-b border-[#cbd5e1] shadow-xs font-sans">
      {/* Main Header Bar */}
      <div className="bg-[#107c41] px-4 py-2 text-white flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 font-bold tracking-wide">
            <img
              src="/moliya_maks_logo.jpg"
              alt="Moliya Maks"
              className="w-5 h-5 rounded object-cover border border-white/40"
              referrerPolicy="no-referrer"
            />
            <span className="text-white font-bold text-sm">Moliya Maks</span>
            <span className="hidden sm:inline text-emerald-200 text-[11px] font-normal font-mono">- Moliya_Maks_2026.xlsx</span>
          </div>

          <span className="hidden md:inline px-2 py-0.5 bg-[#0e6837] text-emerald-100 rounded text-[10px] font-mono">
            Varaq: {activeTab.toUpperCase()}
          </span>
        </div>

        {/* Top Right Quick Master Export, AI & Actions */}
        <div className="flex items-center gap-2">
          {/* Desktop App Install Button */}
          <button
            type="button"
            onClick={() => setIsInstallModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-400 hover:bg-amber-300 text-slate-900 font-extrabold rounded shadow-xs text-xs transition-all active:scale-95 animate-pulse hover:animate-none"
            title="Dasturni kompyuterga o'rnatish (Standalone App)"
          >
            <Download className="w-3.5 h-3.5 text-slate-900" />
            <span className="hidden sm:inline">Ilovani O'rnatish</span>
          </button>

          {/* Master Export */}
          <button
            type="button"
            onClick={handleExportMaster}
            disabled={isExportingMaster}
            className="flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-emerald-50 text-[#107c41] font-bold rounded shadow-xs text-xs transition-all active:scale-95 disabled:opacity-50"
            title="Excel 2.0 master faylni yuklab olish"
          >
            {isExportingMaster ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : exportSuccess ? (
              <Check className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <FileSpreadsheet className="w-3.5 h-3.5 text-[#107c41]" />
            )}
            <span>{isExportingMaster ? "Tayyorlanmoqda..." : exportSuccess ? "Yuklab olindi!" : "To'liq Excel"}</span>
          </button>

          {/* AI Helper button in top bar */}
          <button
            type="button"
            onClick={onOpenAIAssistant || (() => setActiveTab('ai-assistant'))}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-[#0c5c30] hover:bg-[#094725] text-amber-300 font-semibold rounded text-xs transition-all"
          >
            <Bot className="w-3.5 h-3.5 text-amber-300" />
            <span className="hidden sm:inline">AI Yordamchi</span>
          </button>

          {/* Notifications */}
          <button
            onClick={onOpenNotifications}
            className="relative p-1.5 text-emerald-100 hover:text-white hover:bg-[#0c5c30] rounded transition-colors"
            title="Bildirishnomalar"
          >
            <Bell className="w-3.5 h-3.5" />
            {unreadNotificationCount > 0 && (
              <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-[#107c41]" />
            )}
          </button>
        </div>
      </div>

      {/* Control Toolbar: Period Filter & Quick Add */}
      <div className="bg-[#f8fafc] px-4 py-2 border-b border-[#e2e8f0] flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <DateRangeSelector
            currentPeriod={filterRange.period}
            startDate={filterRange.start_date}
            endDate={filterRange.end_date}
            onPeriodChange={setPeriodFilter}
          />
        </div>

        {/* Quick Add Row Button */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsAddMenuOpen(!isAddMenuOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#107c41] hover:bg-[#0e6b38] active:bg-[#0c592e] text-white text-xs font-bold rounded shadow-xs transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Yangi Qator</span>
          </button>

          {isAddMenuOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-48 bg-white rounded-lg shadow-xl border border-slate-300 py-1.5 z-30 animate-in fade-in">
              <button
                onClick={() => handleOpenQuick('income')}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 text-left transition-colors"
              >
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                <span>+ Daromad yozuvi</span>
              </button>
              <button
                onClick={() => handleOpenQuick('expense')}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-rose-50 hover:text-rose-800 text-left transition-colors"
              >
                <TrendingDown className="w-3.5 h-3.5 text-rose-600" />
                <span>+ Xarajat yozuvi</span>
              </button>
              <button
                onClick={() => handleOpenQuick('debt')}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-amber-50 hover:text-amber-800 text-left transition-colors"
              >
                <HandCoins className="w-3.5 h-3.5 text-amber-600" />
                <span>+ Qarz yozuvi</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Desktop App Install Modal */}
      <DesktopInstallModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
      />
    </header>
  );
};
