import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  Income,
  Expense,
  Debt,
  DebtPayment,
  DebtWithComputed,
  Budget,
  BudgetWithComputed,
  Category,
  FinancialSummary,
  PeriodFilter,
  DateFilterRange,
  UserSettings,
  AuditLog,
  NotificationItem
} from '../types';
import { useAuth } from './AuthContext';
import { db } from '../lib/storage';
import { cloud } from '../lib/cloudService';
import {
  computeDebtDetails,
  computeBudgets,
  calculateFinancialSummary,
  getDateRangeFromPeriod
} from '../lib/calculations';
import { formatCurrency, formatDate } from '../lib/formatters';

interface FinanceContextType {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  filterRange: DateFilterRange;
  setPeriodFilter: (period: PeriodFilter, customStart?: string, customEnd?: string) => void;
  categories: Category[];
  allCategories: Category[];
  incomes: Income[];
  expenses: Expense[];
  debts: DebtWithComputed[];
  debtPayments: DebtPayment[];
  budgets: BudgetWithComputed[];
  summary: FinancialSummary;
  settings: UserSettings;
  auditLogs: AuditLog[];
  notifications: NotificationItem[];
  unreadNotificationCount: number;
  markNotificationAsRead: (id: string) => void;
  clearAllNotifications: () => void;

  // CRUD Incomes
  addIncome: (income: Omit<Income, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => void;
  updateIncome: (income: Income) => void;
  deleteIncome: (id: string) => void;

  // CRUD Expenses
  addExpense: (expense: Omit<Expense, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => void;
  updateExpense: (expense: Expense) => void;
  deleteExpense: (id: string) => void;

  // CRUD Debts
  addDebt: (debt: Omit<Debt, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => void;
  updateDebt: (debt: Debt) => void;
  deleteDebt: (id: string) => void;
  addDebtPayment: (payment: Omit<DebtPayment, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => void;
  deleteDebtPayment: (paymentId: string) => void;

  // CRUD Budgets
  saveBudget: (budget: Omit<Budget, 'id' | 'user_id' | 'created_at' | 'updated_at'> & { id?: string }) => void;
  deleteBudget: (id: string) => void;

  // CRUD Categories
  saveCategory: (category: Omit<Category, 'id' | 'user_id' | 'created_at' | 'updated_at'> & { id?: string }) => void;
  deleteCategory: (id: string, soft?: boolean) => { success: boolean; message?: string };

  // Settings
  updateSettings: (newSettings: Partial<UserSettings>) => void;

  // Recycle Bin & Trash
  trashItems: Array<{ id: string; type: 'income' | 'expense' | 'debt'; title: string; amount: number; date: string; deleted_at: string }>;
  restoreItem: (type: 'income' | 'expense' | 'debt', id: string) => void;
  permanentDeleteItem: (type: 'income' | 'expense' | 'debt', id: string) => void;
  emptyTrash: () => void;
  bulkDeleteIncomes: (ids: string[]) => void;
  bulkDeleteExpenses: (ids: string[]) => void;
  setBudgetLimit: (categoryId: string, month: string, limitAmount: number) => void;

  // Refresh
  refreshData: () => void;

  // Quick modals
  isQuickAddOpen: boolean;
  setIsQuickAddOpen: (open: boolean) => void;
  quickAddType: 'income' | 'expense' | 'debt';
  setQuickAddType: (type: 'income' | 'expense' | 'debt') => void;
}

const FinanceContext = createContext<FinanceContextType | null>(null);

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [rawCategories, setRawCategories] = useState<Category[]>([]);
  const [rawIncomes, setRawIncomes] = useState<Income[]>([]);
  const [rawExpenses, setRawExpenses] = useState<Expense[]>([]);
  const [rawDebts, setRawDebts] = useState<Debt[]>([]);
  const [rawPayments, setRawPayments] = useState<DebtPayment[]>([]);
  const [rawBudgets, setRawBudgets] = useState<Budget[]>([]);
  const [settings, setSettings] = useState<UserSettings>(db.getSettings(currentUser.id));
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [readNotifications, setReadNotifications] = useState<string[]>([]);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState<boolean>(false);
  const [quickAddType, setQuickAddType] = useState<'income' | 'expense' | 'debt'>('expense');

  // Filter state
  const [filterRange, setFilterRange] = useState<DateFilterRange>(() => {
    const dates = getDateRangeFromPeriod('this_month');
    return {
      period: 'this_month',
      start_date: dates.start_date,
      end_date: dates.end_date
    };
  });

  const loadUserData = useCallback(() => {
    if (!currentUser) return;
    const userId = currentUser.id;
    const cats = db.getAllCategories(userId);
    const incs = db.getIncomes(userId);
    const exps = db.getExpenses(userId);
    const dbts = db.getDebts(userId);
    const pymts = db.getDebtPayments(userId);
    const bdgs = db.getBudgets(userId);
    const sttngs = db.getSettings(userId);
    const logs = db.getAuditLogs(userId);

    setRawCategories(cats);
    setRawIncomes(incs);
    setRawExpenses(exps);
    setRawDebts(dbts);
    setRawPayments(pymts);
    setRawBudgets(bdgs);
    setSettings(sttngs);
    setAuditLogs(logs);

    // Asynchronously push to Neon.tech PostgreSQL in background if connected
    cloud.pushAllData({
      userId,
      categories: cats,
      incomes: incs,
      expenses: exps,
      debts: dbts,
      debtPayments: pymts,
      budgets: bdgs,
      settings: sttngs,
      auditLogs: logs
    }).catch(() => {});
  }, [currentUser]);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  const setPeriodFilter = (period: PeriodFilter, customStart?: string, customEnd?: string) => {
    const dates = getDateRangeFromPeriod(period, customStart, customEnd);
    setFilterRange({
      period,
      start_date: dates.start_date,
      end_date: dates.end_date
    });
  };

  // Active Categories
  const categories = useMemo(() => {
    return rawCategories.filter((c) => c.is_active);
  }, [rawCategories]);

  // Computed Debts with Payment History
  const debts = useMemo<DebtWithComputed[]>(() => {
    return rawDebts.map((d) => computeDebtDetails(d, rawPayments));
  }, [rawDebts, rawPayments]);

  // Computed Budgets for the active period month
  const currentPeriodKey = useMemo(() => {
    if (filterRange.start_date) {
      return filterRange.start_date.substring(0, 7); // "YYYY-MM"
    }
    return new Date().toISOString().substring(0, 7);
  }, [filterRange]);

  const budgets = useMemo<BudgetWithComputed[]>(() => {
    return computeBudgets(rawBudgets, rawExpenses, categories, currentPeriodKey);
  }, [rawBudgets, rawExpenses, categories, currentPeriodKey]);

  // Computed Financial Summary
  const summary = useMemo<FinancialSummary>(() => {
    return calculateFinancialSummary(
      rawIncomes,
      rawExpenses,
      debts,
      rawPayments,
      budgets,
      filterRange
    );
  }, [rawIncomes, rawExpenses, debts, rawPayments, budgets, filterRange]);

  // Notifications Generator
  const notifications = useMemo<NotificationItem[]>(() => {
    const list: NotificationItem[] = [];

    // 1. Check overdue debts
    const overdueDebts = debts.filter((d) => d.is_overdue);
    if (overdueDebts.length > 0) {
      const totalOverdue = overdueDebts.reduce((sum, d) => sum + d.remaining_amount, 0);
      list.push({
        id: 'notif_overdue_debts',
        type: 'danger',
        title: "Muddati o'tgan qarzlar mavjud",
        message: `${overdueDebts.length} ta qarz qaytarish muddati o'tgan (${formatCurrency(totalOverdue, settings.currency)}).`,
        timestamp: new Date().toISOString(),
        linkTo: 'debts',
        read: readNotifications.includes('notif_overdue_debts')
      });
    }

    // 2. Check budgets warning / exceeded
    budgets.forEach((b) => {
      if (b.status === 'exceeded') {
        list.push({
          id: `notif_budget_exceeded_${b.id}`,
          type: 'danger',
          title: `"${b.category_name}" byudjeti oshib ketdi!`,
          message: `Belgilangan limitdan ${formatCurrency(Math.abs(b.remaining_amount), settings.currency)} ko'p sarflandi (${b.usage_percentage.toFixed(0)}%).`,
          timestamp: new Date().toISOString(),
          linkTo: 'budgets',
          read: readNotifications.includes(`notif_budget_exceeded_${b.id}`)
        });
      } else if (b.status === 'warning') {
        list.push({
          id: `notif_budget_warn_${b.id}`,
          type: 'warning',
          title: `"${b.category_name}" byudjeti chegarada`,
          message: `Limitning ${b.usage_percentage.toFixed(0)}% qismi sarflab bo'lindi. Qoldiq: ${formatCurrency(b.remaining_amount, settings.currency)}.`,
          timestamp: new Date().toISOString(),
          linkTo: 'budgets',
          read: readNotifications.includes(`notif_budget_warn_${b.id}`)
        });
      }
    });

    // 3. Positive feedback
    if (summary.savings_rate >= 50 && summary.total_income > 0) {
      list.push({
        id: 'notif_high_savings',
        type: 'success',
        title: 'Ajoyib natija!',
        message: `Ushbu davrda daromadingizning ${summary.savings_rate.toFixed(1)}% qismini tejashga erishdingiz.`,
        timestamp: new Date().toISOString(),
        linkTo: 'dashboard',
        read: readNotifications.includes('notif_high_savings')
      });
    }

    return list;
  }, [debts, budgets, summary, settings.currency, readNotifications]);

  const unreadNotificationCount = useMemo(() => {
    return notifications.filter((n) => !n.read).length;
  }, [notifications]);

  const markNotificationAsRead = (id: string) => {
    setReadNotifications((prev) => (prev.includes(id) ? prev : [...prev, id]));
  };

  const clearAllNotifications = () => {
    setReadNotifications(notifications.map((n) => n.id));
  };

  // --- CRUD Handlers ---

  const addIncome = (data: Omit<Income, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    const now = new Date().toISOString();
    const newIncome: Income = {
      ...data,
      id: `inc_${Date.now()}`,
      user_id: currentUser.id,
      is_deleted: false,
      created_at: now,
      updated_at: now
    };
    db.saveIncome(newIncome);
    loadUserData();
  };

  const updateIncome = (income: Income) => {
    db.saveIncome(income);
    loadUserData();
  };

  const deleteIncome = (id: string) => {
    db.deleteIncome(id, currentUser.id);
    loadUserData();
  };

  const addExpense = (data: Omit<Expense, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    const now = new Date().toISOString();
    const newExpense: Expense = {
      ...data,
      id: `exp_${Date.now()}`,
      user_id: currentUser.id,
      is_deleted: false,
      created_at: now,
      updated_at: now
    };
    db.saveExpense(newExpense);
    loadUserData();
  };

  const updateExpense = (expense: Expense) => {
    db.saveExpense(expense);
    loadUserData();
  };

  const deleteExpense = (id: string) => {
    db.deleteExpense(id, currentUser.id);
    loadUserData();
  };

  const addDebt = (data: Omit<Debt, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    const now = new Date().toISOString();
    const newDebt: Debt = {
      ...data,
      id: `debt_${Date.now()}`,
      user_id: currentUser.id,
      is_deleted: false,
      created_at: now,
      updated_at: now
    };
    db.saveDebt(newDebt);
    loadUserData();
  };

  const updateDebt = (debt: Debt) => {
    db.saveDebt(debt);
    loadUserData();
  };

  const deleteDebt = (id: string) => {
    db.deleteDebt(id, currentUser.id);
    loadUserData();
  };

  const addDebtPayment = (data: Omit<DebtPayment, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    const now = new Date().toISOString();
    const newPayment: DebtPayment = {
      ...data,
      id: `pay_${Date.now()}`,
      user_id: currentUser.id,
      created_at: now,
      updated_at: now
    };
    db.addDebtPayment(newPayment);
    loadUserData();
  };

  const deleteDebtPayment = (paymentId: string) => {
    db.deleteDebtPayment(paymentId, currentUser.id);
    loadUserData();
  };

  const saveBudget = (data: Omit<Budget, 'id' | 'user_id' | 'created_at' | 'updated_at'> & { id?: string }) => {
    const now = new Date().toISOString();
    const newBudget: Budget = {
      id: data.id || `bud_${Date.now()}`,
      user_id: currentUser.id,
      category_id: data.category_id,
      period_type: data.period_type,
      period_key: data.period_key,
      limit_amount: data.limit_amount,
      created_at: now,
      updated_at: now
    };
    db.saveBudget(newBudget);
    loadUserData();
  };

  const deleteBudget = (id: string) => {
    db.deleteBudget(id, currentUser.id);
    loadUserData();
  };

  const saveCategory = (data: Omit<Category, 'id' | 'user_id' | 'created_at' | 'updated_at'> & { id?: string }) => {
    const now = new Date().toISOString();
    const newCategory: Category = {
      id: data.id || `cat_${Date.now()}`,
      user_id: currentUser.id,
      name: data.name,
      type: data.type,
      icon: data.icon,
      color: data.color,
      is_active: data.is_active !== undefined ? data.is_active : true,
      created_at: now,
      updated_at: now
    };
    db.saveCategory(newCategory);
    loadUserData();
  };

  const deleteCategory = (id: string, soft: boolean = true) => {
    const res = db.deleteCategory(id, currentUser.id, soft);
    loadUserData();
    return res;
  };

  const updateSettings = (newSettings: Partial<UserSettings>) => {
    const updated: UserSettings = {
      ...settings,
      ...newSettings,
      updated_at: new Date().toISOString()
    };
    db.saveSettings(updated);
    setSettings(updated);
  };

  const trashItems = useMemo(() => {
    if (!currentUser) return [];
    return db.getTrashItems(currentUser.id);
  }, [currentUser, rawIncomes, rawExpenses, rawDebts]);

  const restoreItem = (type: 'income' | 'expense' | 'debt', id: string) => {
    if (!currentUser) return;
    db.restoreItem(type, id, currentUser.id);
    loadUserData();
  };

  const permanentDeleteItem = (type: 'income' | 'expense' | 'debt', id: string) => {
    if (!currentUser) return;
    db.permanentDeleteItem(type, id, currentUser.id);
    loadUserData();
  };

  const emptyTrash = () => {
    if (!currentUser) return;
    db.emptyTrash(currentUser.id);
    loadUserData();
  };

  const bulkDeleteIncomes = (ids: string[]) => {
    if (!currentUser || ids.length === 0) return;
    db.bulkDeleteIncomes(ids, currentUser.id);
    loadUserData();
  };

  const bulkDeleteExpenses = (ids: string[]) => {
    if (!currentUser || ids.length === 0) return;
    db.bulkDeleteExpenses(ids, currentUser.id);
    loadUserData();
  };

  const setBudgetLimit = (categoryId: string, month: string, limitAmount: number) => {
    if (!currentUser) return;
    saveBudget({
      category_id: categoryId,
      period_type: 'monthly',
      period_key: month,
      limit_amount: limitAmount
    });
  };

  return (
    <FinanceContext.Provider
      value={{
        activeTab,
        setActiveTab,
        filterRange,
        setPeriodFilter,
        categories,
        allCategories: rawCategories,
        incomes: rawIncomes,
        expenses: rawExpenses,
        debts,
        debtPayments: rawPayments,
        budgets,
        summary,
        settings,
        auditLogs,
        notifications,
        unreadNotificationCount,
        markNotificationAsRead,
        clearAllNotifications,

        addIncome,
        updateIncome,
        deleteIncome,

        addExpense,
        updateExpense,
        deleteExpense,

        addDebt,
        updateDebt,
        deleteDebt,
        addDebtPayment,
        deleteDebtPayment,

        saveBudget,
        deleteBudget,

        saveCategory,
        deleteCategory,

        updateSettings,
        trashItems,
        restoreItem,
        permanentDeleteItem,
        emptyTrash,
        bulkDeleteIncomes,
        bulkDeleteExpenses,
        setBudgetLimit,
        refreshData: loadUserData,

        isQuickAddOpen,
        setIsQuickAddOpen,
        quickAddType,
        setQuickAddType
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};
