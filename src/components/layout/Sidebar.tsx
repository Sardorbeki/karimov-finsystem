import React, { useState } from 'react';
import {
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  HandCoins,
  PiggyBank,
  Tags,
  FileSpreadsheet,
  FileText,
  History,
  Settings,
  LogOut,
  Sparkles,
  Bot,
  User,
  Table,
  Monitor,
  Download
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { useAuth } from '../../context/AuthContext';
import { DesktopInstallModal } from '../common/DesktopInstallModal';

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab } = useFinance();
  const { currentUser, logout } = useAuth();
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);

  const sheets = [
    { id: 'dashboard', label: 'Dashboard (Umumiy)', sheetName: 'Sheet 0', icon: LayoutDashboard },
    { id: 'pro-analytics', label: 'Pro CFO Tahlil', sheetName: 'CFO Pro', icon: TrendingUp },
    { id: 'incomes', label: 'Daromadlar', sheetName: 'Sheet 1', icon: TrendingUp },
    { id: 'expenses', label: 'Xarajatlar', sheetName: 'Sheet 2', icon: TrendingDown },
    { id: 'debts', label: 'Qarzlar & To\'lovlar', sheetName: 'Sheet 3', icon: HandCoins },
    { id: 'budgets', label: 'Byudjet Rejasi', sheetName: 'Sheet 4', icon: PiggyBank },
    { id: 'categories', label: 'Kategoriyalar', sheetName: 'Sheet 5', icon: Tags },
    { id: 'reports', label: 'Hisobotlar', sheetName: 'Sheet 6', icon: FileText },
    { id: 'migration', label: 'Excel Import / Eksport', sheetName: 'Sheet 7', icon: FileSpreadsheet },
  ];

  const tools = [
    { id: 'ai-assistant', label: 'AI Yordamchi', icon: Bot, isSpecial: true },
    { id: 'audit', label: 'Audit & Tarix', icon: History },
    { id: 'profile', label: 'Admin Profili', icon: User },
    { id: 'settings', label: 'Sozlamalar', icon: Settings },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-[#1b2b22] text-slate-200 border-r border-[#15241b] shrink-0 h-screen sticky top-0 font-sans shadow-lg">
      {/* Moliya Maks Header Logo */}
      <div className="p-4 bg-[#107c41] text-white flex items-center justify-between border-b border-[#0d6937] shadow-sm">
        <div className="flex items-center gap-2.5">
          <img
            src="/moliya_maks_logo.jpg"
            alt="Moliya Maks Logo"
            className="w-9 h-9 rounded-lg object-cover border border-emerald-300/40 shadow-sm"
            referrerPolicy="no-referrer"
          />
          <div>
            <h1 className="font-bold text-white text-base tracking-tight leading-tight flex items-center gap-1.5">
              <span>Moliya Maks</span>
            </h1>
            <div className="text-[10px] text-emerald-200 font-medium font-mono">
              moliyamaks_2026.xlsx
            </div>
          </div>
        </div>
        <span className="px-1.5 py-0.5 text-[9px] font-bold bg-white/25 text-white rounded font-mono">
          PRO
        </span>
      </div>

      {/* Navigation - Sheets List */}
      <nav className="flex-1 p-2.5 space-y-1 overflow-y-auto custom-scrollbar">
        <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400/80 flex items-center gap-1.5">
          <Table className="w-3 h-3" />
          <span>Ishchi Varaqlar (Sheets)</span>
        </div>

        {sheets.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-[#107c41] text-white shadow-md font-bold ring-1 ring-emerald-300/40'
                  : 'text-slate-300 hover:text-white hover:bg-[#23382c]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-emerald-400'}`} />
                <span>{item.label}</span>
              </div>
              <span className={`text-[10px] px-1.5 py-0.5 rounded ${isActive ? 'bg-emerald-800 text-emerald-100 font-mono' : 'text-slate-500 font-mono'}`}>
                {item.sheetName}
              </span>
            </button>
          );
        })}

        <div className="pt-3 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400/80 flex items-center gap-1.5">
          <Sparkles className="w-3 h-3" />
          <span>Qo'shimcha Asboblar</span>
        </div>

        {tools.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-[#107c41] text-white shadow-md font-bold'
                  : item.isSpecial
                  ? 'bg-emerald-950/60 text-emerald-300 hover:bg-emerald-900/60 hover:text-white border border-emerald-800/40'
                  : 'text-slate-300 hover:text-white hover:bg-[#23382c]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : item.isSpecial ? 'text-amber-400' : 'text-emerald-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.isSpecial && (
                <span className="px-1.5 py-0.2 text-[9px] font-extrabold bg-amber-500 text-slate-950 rounded">
                  AI
                </span>
              )}
            </button>
          );
        })}

        {/* Install Desktop App in Sidebar */}
        <div className="pt-2">
          <button
            onClick={() => setIsInstallModalOpen(true)}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 transition-all group"
          >
            <div className="flex items-center gap-2.5">
              <Monitor className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
              <span>Ilovani O'rnatish (App)</span>
            </div>
            <Download className="w-3.5 h-3.5 text-amber-400" />
          </button>
        </div>
      </nav>

      {/* User Status Bar */}
      <div className="p-3 border-t border-[#15241b] bg-[#14211a]">
        <div
          onClick={() => setActiveTab('profile')}
          className="flex items-center justify-between p-2 rounded-lg bg-[#1b2b22] hover:bg-[#23382c] border border-emerald-900/50 cursor-pointer transition-all"
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded bg-[#107c41] text-white font-bold flex items-center justify-center text-xs shrink-0 border border-emerald-400/40">
              {currentUser.full_name?.charAt(0) || 'A'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">{currentUser.full_name}</p>
              <p className="text-[10px] text-emerald-300 truncate">Administrator</p>
            </div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              logout();
            }}
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
            title="Chiqish"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <DesktopInstallModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
      />
    </aside>
  );
};
