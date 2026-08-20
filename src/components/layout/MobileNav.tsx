import React from 'react';
import {
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  HandCoins,
  PiggyBank,
  MoreHorizontal
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';

interface MobileNavProps {
  onOpenMore: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ onOpenMore }) => {
  const { activeTab, setActiveTab } = useFinance();

  const navItems = [
    { id: 'dashboard', label: 'Boshqaruv', icon: LayoutDashboard },
    { id: 'incomes', label: 'Daromad', icon: TrendingUp },
    { id: 'expenses', label: 'Xarajat', icon: TrendingDown },
    { id: 'debts', label: 'Qarzlar', icon: HandCoins },
    { id: 'budgets', label: 'Byudjet', icon: PiggyBank }
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-slate-200 px-2 py-1 flex items-center justify-around shadow-lg">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-colors ${
              isActive ? 'text-indigo-600 font-semibold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Icon className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">{item.label}</span>
          </button>
        );
      })}
      <button
        onClick={onOpenMore}
        className="flex flex-col items-center justify-center py-1 px-2 rounded-xl text-slate-500 hover:text-slate-800 transition-colors"
      >
        <MoreHorizontal className="w-5 h-5 mb-0.5" />
        <span className="text-[10px]">Ko'proq</span>
      </button>
    </div>
  );
};
