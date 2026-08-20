import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { FinanceProvider, useFinance } from './context/FinanceContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { MobileNav } from './components/layout/MobileNav';
import { NotificationDrawer } from './components/layout/NotificationDrawer';
import { QuickAddModal } from './components/layout/QuickAddModal';
import { AIAssistantModal } from './components/ai/AIAssistantModal';
import { LoginModal } from './components/auth/LoginModal';
import { ProfileModal } from './components/auth/ProfileModal';

// Views
import { DashboardView } from './components/dashboard/DashboardView';
import { IncomeView } from './components/income/IncomeView';
import { ExpenseView } from './components/expense/ExpenseView';
import { DebtView } from './components/debts/DebtView';
import { BudgetView } from './components/budget/BudgetView';
import { CategoryView } from './components/categories/CategoryView';
import { ReportView } from './components/reports/ReportView';
import { MigrationView } from './components/migration/MigrationView';
import { AuditView } from './components/audit/AuditView';
import { SettingsView } from './components/settings/SettingsView';
import { AIAssistantView } from './components/ai/AIAssistantView';
import { ProfileView } from './components/auth/ProfileView';
import { ProAnalyticsView } from './components/analytics/ProAnalyticsView';

import { Sparkles, Bot } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { activeTab, setActiveTab } = useFinance();
  const { isAuthenticated, isLoginModalOpen, setIsLoginModalOpen, isProfileModalOpen, setIsProfileModalOpen } = useAuth();
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isMobileMoreOpen, setIsMobileMoreOpen] = useState(false);
  const [isAIAssistantModalOpen, setIsAIAssistantModalOpen] = useState(false);

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView />;
      case 'pro-analytics':
        return <ProAnalyticsView />;
      case 'ai-assistant':
        return <AIAssistantView />;
      case 'profile':
        return <ProfileView />;
      case 'incomes':
        return <IncomeView />;
      case 'expenses':
        return <ExpenseView />;
      case 'debts':
        return <DebtView />;
      case 'budgets':
        return <BudgetView />;
      case 'categories':
        return <CategoryView />;
      case 'reports':
        return <ReportView />;
      case 'migration':
        return <MigrationView />;
      case 'audit':
        return <AuditView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardView />;
    }
  };

  const { summary, settings } = useFinance();

  return (
    <div className="min-h-screen bg-[#f3f5f8] flex text-slate-800 font-sans antialiased selection:bg-[#107c41] selection:text-white">
      {/* Sidebar (Desktop) */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-12">
        <Header
          onOpenNotifications={() => setIsNotificationOpen(true)}
          onOpenAIAssistant={() => setIsAIAssistantModalOpen(true)}
        />

        <main className="flex-1 p-3 sm:p-5 lg:p-6 max-w-7xl w-full mx-auto animate-in fade-in duration-200">
          {renderActiveView()}
        </main>

        {/* Excel Bottom Status Bar (Classic Excel Ready Bar) */}
        <div className="hidden sm:flex items-center justify-between px-4 py-1.5 bg-[#f1f5f9] border-t border-[#cbd5e1] text-[11px] text-slate-600 font-mono fixed bottom-0 left-0 right-0 z-20 lg:left-64">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
              <span className="w-2 h-2 rounded-full bg-[#107c41] inline-block"></span>
              <span>TAYYOR (READY)</span>
            </div>
            <span className="text-slate-400">|</span>
            <span>DAVR: {summary.period_label || '2026-Yil'}</span>
            <span className="text-slate-400">|</span>
            <span>HISOBLASH: AVTOMATIK (=SUM)</span>
          </div>

          <div className="flex items-center gap-4">
            <span>DAROMAD: <strong className="text-emerald-700">{summary.total_income.toLocaleString()} {settings.currency}</strong></span>
            <span className="text-slate-400">|</span>
            <span>XARAJAT: <strong className="text-rose-700">{summary.total_expense.toLocaleString()} {settings.currency}</strong></span>
            <span className="text-slate-400">|</span>
            <span>BALANS: <strong className={summary.net_balance >= 0 ? "text-emerald-700" : "text-rose-700"}>{summary.net_balance.toLocaleString()} {settings.currency}</strong></span>
            <span className="text-slate-400">|</span>
            <span>100%</span>
          </div>
        </div>
      </div>

      {/* Floating AI Assistant Trigger Button (FAB) */}
      <div className="fixed bottom-10 right-5 z-30">
        <button
          onClick={() => setIsAIAssistantModalOpen(true)}
          className="flex items-center gap-2 px-3.5 py-2.5 bg-[#107c41] hover:bg-[#0e6837] active:bg-[#0a4d29] text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-900/30 border border-emerald-400/40 hover:scale-105 active:scale-95 transition-all group"
        >
          <Bot className="w-4 h-4 text-amber-300 group-hover:rotate-12 transition-transform" />
          <span className="hidden sm:inline">AI Yordamchi</span>
          <Sparkles className="w-3 h-3 text-amber-300" />
        </button>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav onOpenMore={() => setIsMobileMoreOpen(true)} />

      {/* Mobile "More" Drawer */}
      {isMobileMoreOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-end lg:hidden">
          <div className="w-full bg-white rounded-t-3xl p-6 space-y-3 animate-in slide-in-from-bottom">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Barcha Bo'limlar & AI</h3>
              <button
                onClick={() => setIsMobileMoreOpen(false)}
                className="text-xs font-semibold text-slate-500"
              >
                Yopish
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => {
                  setActiveTab('pro-analytics');
                  setIsMobileMoreOpen(false);
                }}
                className="p-3 text-left bg-emerald-50 hover:bg-emerald-100 rounded-xl font-bold text-emerald-800 flex items-center gap-2"
              >
                <span>📊 Pro CFO Tahlil</span>
              </button>
              <button
                onClick={() => {
                  setActiveTab('ai-assistant');
                  setIsMobileMoreOpen(false);
                }}
                className="p-3 text-left bg-indigo-50 hover:bg-indigo-100 rounded-xl font-bold text-indigo-800 flex items-center gap-2"
              >
                <span>🤖 AI Boshqaruvchi</span>
              </button>
              <button
                onClick={() => {
                  setActiveTab('profile');
                  setIsMobileMoreOpen(false);
                }}
                className="p-3 text-left bg-slate-50 hover:bg-indigo-50 rounded-xl font-semibold text-slate-700"
              >
                👤 Admin Profili
              </button>
              <button
                onClick={() => {
                  setActiveTab('categories');
                  setIsMobileMoreOpen(false);
                }}
                className="p-3 text-left bg-slate-50 hover:bg-indigo-50 rounded-xl font-semibold text-slate-700"
              >
                🏷️ Kategoriyalar
              </button>
              <button
                onClick={() => {
                  setActiveTab('reports');
                  setIsMobileMoreOpen(false);
                }}
                className="p-3 text-left bg-slate-50 hover:bg-indigo-50 rounded-xl font-semibold text-slate-700"
              >
                📄 Hisobotlar & Eksport
              </button>
              <button
                onClick={() => {
                  setActiveTab('migration');
                  setIsMobileMoreOpen(false);
                }}
                className="p-3 text-left bg-slate-50 hover:bg-indigo-50 rounded-xl font-semibold text-slate-700"
              >
                📊 Excel 2.0 Import
              </button>
              <button
                onClick={() => {
                  setActiveTab('audit');
                  setIsMobileMoreOpen(false);
                }}
                className="p-3 text-left bg-slate-50 hover:bg-indigo-50 rounded-xl font-semibold text-slate-700"
              >
                🕒 Audit & Tarix
              </button>
              <button
                onClick={() => {
                  setActiveTab('settings');
                  setIsMobileMoreOpen(false);
                }}
                className="col-span-2 p-3 text-left bg-slate-50 hover:bg-indigo-50 rounded-xl font-semibold text-slate-700"
              >
                ⚙️ Foydalanuvchi Sozlamalari
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Slide-over Notification Drawer */}
      <NotificationDrawer
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
      />

      {/* Global Quick Add Modal */}
      <QuickAddModal />

      {/* Interactive AI Assistant Modal */}
      <AIAssistantModal
        isOpen={isAIAssistantModalOpen}
        onClose={() => setIsAIAssistantModalOpen(false)}
      />

      {/* Admin Login Modal (if logged out or explicitly opened) */}
      <LoginModal
        isOpen={!isAuthenticated || isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        canClose={isAuthenticated}
      />

      {/* Admin Profile Modal */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <FinanceProvider>
        <MainLayout />
      </FinanceProvider>
    </AuthProvider>
  );
}

export default App;
