import {
  UserProfile,
  Category,
  Income,
  Expense,
  Debt,
  DebtPayment,
  Budget,
  UserSettings,
  AuditLog,
  AuditAction,
  AuditEntity,
  AIMessage
} from '../types';
import {
  DEFAULT_USER,
  DEFAULT_SETTINGS,
  DEFAULT_INCOME_CATEGORIES,
  DEFAULT_EXPENSE_CATEGORIES,
  DEFAULT_INCOMES,
  DEFAULT_EXPENSES,
  DEFAULT_DEBTS,
  DEFAULT_DEBT_PAYMENTS,
  DEFAULT_BUDGETS,
  DEFAULT_AUDIT_LOGS
} from './seedData';

const STORAGE_KEYS = {
  USERS: 'pfms_users_v2',
  SETTINGS: 'pfms_settings_v2',
  CATEGORIES: 'pfms_categories_v2',
  INCOMES: 'pfms_incomes_v2',
  EXPENSES: 'pfms_expenses_v2',
  DEBTS: 'pfms_debts_v2',
  DEBT_PAYMENTS: 'pfms_debt_payments_v2',
  BUDGETS: 'pfms_budgets_v2',
  AUDIT_LOGS: 'pfms_audit_logs_v2',
  CURRENT_USER_ID: 'pfms_current_user_id_v2',
  AUTH_SESSION: 'pfms_auth_session_v2',
  AI_CHAT_HISTORY: 'pfms_ai_chat_history_v2'
};

// Memory fallback if localStorage is disabled
class DatabaseEngine {
  private memoryStore: Record<string, string> = {};

  private getItem<T>(key: string, defaultVal: T): T {
    try {
      let data: string | null = null;
      if (typeof window !== 'undefined' && window.localStorage) {
        data = window.localStorage.getItem(key);
      } else {
        data = this.memoryStore[key] || null;
      }
      if (!data) return defaultVal;
      return JSON.parse(data) as T;
    } catch {
      return defaultVal;
    }
  }

  private setItem<T>(key: string, value: T): void {
    try {
      const serialized = JSON.stringify(value);
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, serialized);
      }
      this.memoryStore[key] = serialized;
    } catch (err) {
      console.warn('Storage setItem failed:', err);
    }
  }

  public init() {
    const users = this.getItem<UserProfile[]>(STORAGE_KEYS.USERS, []);
    if (users.length === 0) {
      // Seed initial data
      this.setItem(STORAGE_KEYS.USERS, [DEFAULT_USER]);
      this.setItem(STORAGE_KEYS.SETTINGS, [DEFAULT_SETTINGS]);
      this.setItem(STORAGE_KEYS.CATEGORIES, [...DEFAULT_INCOME_CATEGORIES, ...DEFAULT_EXPENSE_CATEGORIES]);
      this.setItem(STORAGE_KEYS.INCOMES, DEFAULT_INCOMES);
      this.setItem(STORAGE_KEYS.EXPENSES, DEFAULT_EXPENSES);
      this.setItem(STORAGE_KEYS.DEBTS, DEFAULT_DEBTS);
      this.setItem(STORAGE_KEYS.DEBT_PAYMENTS, DEFAULT_DEBT_PAYMENTS);
      this.setItem(STORAGE_KEYS.BUDGETS, DEFAULT_BUDGETS);
      this.setItem(STORAGE_KEYS.AUDIT_LOGS, DEFAULT_AUDIT_LOGS);
      this.setItem(STORAGE_KEYS.CURRENT_USER_ID, DEFAULT_USER.id);
    }
  }

  public resetToSeedData() {
    this.setItem(STORAGE_KEYS.USERS, [DEFAULT_USER]);
    this.setItem(STORAGE_KEYS.SETTINGS, [DEFAULT_SETTINGS]);
    this.setItem(STORAGE_KEYS.CATEGORIES, [...DEFAULT_INCOME_CATEGORIES, ...DEFAULT_EXPENSE_CATEGORIES]);
    this.setItem(STORAGE_KEYS.INCOMES, DEFAULT_INCOMES);
    this.setItem(STORAGE_KEYS.EXPENSES, DEFAULT_EXPENSES);
    this.setItem(STORAGE_KEYS.DEBTS, DEFAULT_DEBTS);
    this.setItem(STORAGE_KEYS.DEBT_PAYMENTS, DEFAULT_DEBT_PAYMENTS);
    this.setItem(STORAGE_KEYS.BUDGETS, DEFAULT_BUDGETS);
    this.setItem(STORAGE_KEYS.AUDIT_LOGS, DEFAULT_AUDIT_LOGS);
    this.setItem(STORAGE_KEYS.CURRENT_USER_ID, DEFAULT_USER.id);
  }

  // --- Auth & Users ---
  public getCurrentUserId(): string {
    return this.getItem<string>(STORAGE_KEYS.CURRENT_USER_ID, DEFAULT_USER.id);
  }

  public setCurrentUserId(userId: string): void {
    this.setItem(STORAGE_KEYS.CURRENT_USER_ID, userId);
  }

  public getUsers(): UserProfile[] {
    return this.getItem<UserProfile[]>(STORAGE_KEYS.USERS, []);
  }

  public getUserById(userId: string): UserProfile | null {
    const users = this.getUsers();
    return users.find((u) => u.id === userId) || null;
  }

  public saveUser(user: UserProfile): void {
    const users = this.getUsers();
    const idx = users.findIndex((u) => u.id === user.id);
    if (idx >= 0) {
      users[idx] = { ...user, updated_at: new Date().toISOString() };
    } else {
      users.push(user);
      // Create default categories & settings for new user
      this.createDefaultUserEnvironment(user.id);
    }
    this.setItem(STORAGE_KEYS.USERS, users);
  }

  private createDefaultUserEnvironment(userId: string) {
    const now = new Date().toISOString();
    const categories = this.getItem<Category[]>(STORAGE_KEYS.CATEGORIES, []);
    const newCats: Category[] = [
      ...DEFAULT_INCOME_CATEGORIES.map((c, i) => ({ ...c, id: `cat_inc_${userId}_${i}`, user_id: userId, created_at: now, updated_at: now })),
      ...DEFAULT_EXPENSE_CATEGORIES.map((c, i) => ({ ...c, id: `cat_exp_${userId}_${i}`, user_id: userId, created_at: now, updated_at: now }))
    ];
    this.setItem(STORAGE_KEYS.CATEGORIES, [...categories, ...newCats]);

    const settingsList = this.getItem<UserSettings[]>(STORAGE_KEYS.SETTINGS, []);
    const newSettings: UserSettings = {
      ...DEFAULT_SETTINGS,
      user_id: userId,
      updated_at: now
    };
    this.setItem(STORAGE_KEYS.SETTINGS, [...settingsList.filter((s) => s.user_id !== userId), newSettings]);
  }

  // --- Settings ---
  public getSettings(userId: string): UserSettings {
    const all = this.getItem<UserSettings[]>(STORAGE_KEYS.SETTINGS, []);
    return all.find((s) => s.user_id === userId) || { ...DEFAULT_SETTINGS, user_id: userId };
  }

  public saveSettings(settings: UserSettings): void {
    const all = this.getItem<UserSettings[]>(STORAGE_KEYS.SETTINGS, []);
    const idx = all.findIndex((s) => s.user_id === settings.user_id);
    if (idx >= 0) {
      all[idx] = { ...settings, updated_at: new Date().toISOString() };
    } else {
      all.push({ ...settings, updated_at: new Date().toISOString() });
    }
    this.setItem(STORAGE_KEYS.SETTINGS, all);
  }

  // --- Audit Log Trigger ---
  public logAudit(userId: string, entity_type: AuditEntity, entity_id: string, action: AuditAction, title: string, details: string) {
    const logs = this.getItem<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, []);
    const newLog: AuditLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      user_id: userId,
      entity_type,
      entity_id,
      action,
      title,
      details,
      timestamp: new Date().toISOString()
    };
    logs.unshift(newLog);
    // Keep max 200 logs per user
    const userLogs = logs.filter((l) => l.user_id === userId).slice(0, 200);
    const otherLogs = logs.filter((l) => l.user_id !== userId);
    this.setItem(STORAGE_KEYS.AUDIT_LOGS, [...userLogs, ...otherLogs]);
  }

  public getAuditLogs(userId: string): AuditLog[] {
    const all = this.getItem<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, []);
    return all.filter((l) => l.user_id === userId);
  }

  // --- Categories ---
  public getCategories(userId: string): Category[] {
    const all = this.getItem<Category[]>(STORAGE_KEYS.CATEGORIES, []);
    return all.filter((c) => c.user_id === userId && c.is_active);
  }

  public getAllCategories(userId: string): Category[] {
    const all = this.getItem<Category[]>(STORAGE_KEYS.CATEGORIES, []);
    return all.filter((c) => c.user_id === userId);
  }

  public saveCategory(category: Category): void {
    const all = this.getItem<Category[]>(STORAGE_KEYS.CATEGORIES, []);
    const idx = all.findIndex((c) => c.id === category.id);
    const isNew = idx < 0;
    if (idx >= 0) {
      all[idx] = { ...category, updated_at: new Date().toISOString() };
    } else {
      all.push(category);
    }
    this.setItem(STORAGE_KEYS.CATEGORIES, all);
    this.logAudit(
      category.user_id,
      'CATEGORY',
      category.id,
      isNew ? 'CREATE' : 'UPDATE',
      isNew ? 'Yangi kategoriya yaratildi' : 'Kategoriya tahrirlandi',
      `${category.name} (${category.type === 'income' ? 'Daromad' : 'Xarajat'})`
    );
  }

  public deleteCategory(categoryId: string, userId: string, soft: boolean = true): { success: boolean; message?: string } {
    // Check if category has transactions
    const incomes = this.getIncomes(userId);
    const expenses = this.getExpenses(userId);
    const budgets = this.getBudgets(userId);

    const hasIncomes = incomes.some((i) => !i.is_deleted && i.category_id === categoryId);
    const hasExpenses = expenses.some((e) => !e.is_deleted && e.category_id === categoryId);
    const hasBudgets = budgets.some((b) => b.category_id === categoryId);

    if (hasIncomes || hasExpenses || hasBudgets) {
      if (!soft) {
        return {
          success: false,
          message: "Ushbu kategoriyaga bog'langan tranzaksiyalar yoki byudjet mavjud. Uni o'chirish uchun avval tranzaksiyalarni ko'chiring yoki soft-delete qiling."
        };
      }
    }

    const all = this.getItem<Category[]>(STORAGE_KEYS.CATEGORIES, []);
    if (soft) {
      const idx = all.findIndex((c) => c.id === categoryId && c.user_id === userId);
      if (idx >= 0) {
        all[idx].is_active = false;
        all[idx].updated_at = new Date().toISOString();
        this.setItem(STORAGE_KEYS.CATEGORIES, all);
      }
    } else {
      const filtered = all.filter((c) => !(c.id === categoryId && c.user_id === userId));
      this.setItem(STORAGE_KEYS.CATEGORIES, filtered);
    }

    this.logAudit(userId, 'CATEGORY', categoryId, 'DELETE', "Kategoriya o'chirildi", `ID: ${categoryId}`);
    return { success: true };
  }

  // --- Incomes ---
  public getIncomes(userId: string): Income[] {
    const all = this.getItem<Income[]>(STORAGE_KEYS.INCOMES, []);
    return all.filter((i) => i.user_id === userId && !i.is_deleted);
  }

  public saveIncome(income: Income): void {
    const all = this.getItem<Income[]>(STORAGE_KEYS.INCOMES, []);
    const idx = all.findIndex((i) => i.id === income.id);
    const isNew = idx < 0;
    if (idx >= 0) {
      all[idx] = { ...income, updated_at: new Date().toISOString() };
    } else {
      all.push(income);
    }
    this.setItem(STORAGE_KEYS.INCOMES, all);
    this.logAudit(
      income.user_id,
      'INCOME',
      income.id,
      isNew ? 'CREATE' : 'UPDATE',
      isNew ? 'Yangi daromad kiritildi' : 'Daromad o\'zgartirildi',
      `${income.amount} so'm - ${income.description || 'Izohsiz'}`
    );
  }

  public deleteIncome(incomeId: string, userId: string): void {
    const all = this.getItem<Income[]>(STORAGE_KEYS.INCOMES, []);
    const idx = all.findIndex((i) => i.id === incomeId && i.user_id === userId);
    if (idx >= 0) {
      all[idx].is_deleted = true;
      all[idx].updated_at = new Date().toISOString();
      this.setItem(STORAGE_KEYS.INCOMES, all);
      this.logAudit(userId, 'INCOME', incomeId, 'DELETE', 'Daromad o\'chirildi', `ID: ${incomeId}`);
    }
  }

  // --- Expenses ---
  public getExpenses(userId: string): Expense[] {
    const all = this.getItem<Expense[]>(STORAGE_KEYS.EXPENSES, []);
    return all.filter((e) => e.user_id === userId && !e.is_deleted);
  }

  public saveExpense(expense: Expense): void {
    const all = this.getItem<Expense[]>(STORAGE_KEYS.EXPENSES, []);
    const idx = all.findIndex((e) => e.id === expense.id);
    const isNew = idx < 0;
    if (idx >= 0) {
      all[idx] = { ...expense, updated_at: new Date().toISOString() };
    } else {
      all.push(expense);
    }
    this.setItem(STORAGE_KEYS.EXPENSES, all);
    this.logAudit(
      expense.user_id,
      'EXPENSE',
      expense.id,
      isNew ? 'CREATE' : 'UPDATE',
      isNew ? 'Yangi xarajat kiritildi' : 'Xarajat o\'zgartirildi',
      `${expense.amount} so'm - ${expense.description || 'Izohsiz'}`
    );
  }

  public deleteExpense(expenseId: string, userId: string): void {
    const all = this.getItem<Expense[]>(STORAGE_KEYS.EXPENSES, []);
    const idx = all.findIndex((e) => e.id === expenseId && e.user_id === userId);
    if (idx >= 0) {
      all[idx].is_deleted = true;
      all[idx].updated_at = new Date().toISOString();
      this.setItem(STORAGE_KEYS.EXPENSES, all);
      this.logAudit(userId, 'EXPENSE', expenseId, 'DELETE', 'Xarajat o\'chirildi', `ID: ${expenseId}`);
    }
  }

  // --- Debts & Repayments ---
  public getDebts(userId: string): Debt[] {
    const all = this.getItem<Debt[]>(STORAGE_KEYS.DEBTS, []);
    return all.filter((d) => d.user_id === userId && !d.is_deleted);
  }

  public getDebtPayments(userId: string): DebtPayment[] {
    const all = this.getItem<DebtPayment[]>(STORAGE_KEYS.DEBT_PAYMENTS, []);
    return all.filter((p) => p.user_id === userId);
  }

  public saveDebt(debt: Debt): void {
    const all = this.getItem<Debt[]>(STORAGE_KEYS.DEBTS, []);
    const idx = all.findIndex((d) => d.id === debt.id);
    const isNew = idx < 0;
    if (idx >= 0) {
      all[idx] = { ...debt, updated_at: new Date().toISOString() };
    } else {
      all.push(debt);
    }
    this.setItem(STORAGE_KEYS.DEBTS, all);
    this.logAudit(
      debt.user_id,
      'DEBT',
      debt.id,
      isNew ? 'CREATE' : 'UPDATE',
      isNew ? 'Yangi qarz qayd etildi' : 'Qarz ma\'lumoti tahrirlandi',
      `${debt.type === 'given' ? 'Berilgan' : 'Olingan'}: ${debt.counterparty} - ${debt.initial_amount} so'm`
    );
  }

  public deleteDebt(debtId: string, userId: string): void {
    const all = this.getItem<Debt[]>(STORAGE_KEYS.DEBTS, []);
    const idx = all.findIndex((d) => d.id === debtId && d.user_id === userId);
    if (idx >= 0) {
      all[idx].is_deleted = true;
      all[idx].updated_at = new Date().toISOString();
      this.setItem(STORAGE_KEYS.DEBTS, all);
      this.logAudit(userId, 'DEBT', debtId, 'DELETE', 'Qarz o\'chirildi', `ID: ${debtId}`);
    }
  }

  public addDebtPayment(payment: DebtPayment): void {
    const all = this.getItem<DebtPayment[]>(STORAGE_KEYS.DEBT_PAYMENTS, []);
    all.push(payment);
    this.setItem(STORAGE_KEYS.DEBT_PAYMENTS, all);

    this.logAudit(
      payment.user_id,
      'PAYMENT',
      payment.id,
      'REPAYMENT',
      'Qarz to\'lovi kiritildi',
      `${payment.amount} so'm - Sana: ${payment.payment_date}`
    );
  }

  public deleteDebtPayment(paymentId: string, userId: string): void {
    const all = this.getItem<DebtPayment[]>(STORAGE_KEYS.DEBT_PAYMENTS, []);
    const filtered = all.filter((p) => !(p.id === paymentId && p.user_id === userId));
    this.setItem(STORAGE_KEYS.DEBT_PAYMENTS, filtered);
    this.logAudit(userId, 'PAYMENT', paymentId, 'DELETE', 'Qarz to\'lovi o\'chirildi', `ID: ${paymentId}`);
  }

  // --- Budgets ---
  public getBudgets(userId: string): Budget[] {
    const all = this.getItem<Budget[]>(STORAGE_KEYS.BUDGETS, []);
    return all.filter((b) => b.user_id === userId);
  }

  public saveBudget(budget: Budget): void {
    const all = this.getItem<Budget[]>(STORAGE_KEYS.BUDGETS, []);
    const idx = all.findIndex((b) => b.id === budget.id || (b.category_id === budget.category_id && b.period_key === budget.period_key && b.user_id === budget.user_id));
    const isNew = idx < 0;
    if (idx >= 0) {
      all[idx] = { ...budget, updated_at: new Date().toISOString() };
    } else {
      all.push(budget);
    }
    this.setItem(STORAGE_KEYS.BUDGETS, all);
    this.logAudit(
      budget.user_id,
      'BUDGET',
      budget.id,
      isNew ? 'CREATE' : 'UPDATE',
      isNew ? 'Yangi byudjet belgilandi' : 'Byudjet limiti o\'zgartirildi',
      `${budget.period_key} davri uchun: ${budget.limit_amount} so'm`
    );
  }

  public deleteBudget(budgetId: string, userId: string): void {
    const all = this.getItem<Budget[]>(STORAGE_KEYS.BUDGETS, []);
    const filtered = all.filter((b) => !(b.id === budgetId && b.user_id === userId));
    this.setItem(STORAGE_KEYS.BUDGETS, filtered);
    this.logAudit(userId, 'BUDGET', budgetId, 'DELETE', 'Byudjet o\'chirildi', `ID: ${budgetId}`);
  }

  // --- Recycle Bin & Trash Management ---
  public getTrashItems(userId: string) {
    const incomes = this.getItem<Income[]>(STORAGE_KEYS.INCOMES, []).filter((i) => i.user_id === userId && i.is_deleted);
    const expenses = this.getItem<Expense[]>(STORAGE_KEYS.EXPENSES, []).filter((e) => e.user_id === userId && e.is_deleted);
    const debts = this.getItem<Debt[]>(STORAGE_KEYS.DEBTS, []).filter((d) => d.user_id === userId && d.is_deleted);

    return [
      ...incomes.map((i) => ({ id: i.id, type: 'income' as const, title: i.description || 'Daromad', amount: i.amount, date: i.date, deleted_at: i.updated_at })),
      ...expenses.map((e) => ({ id: e.id, type: 'expense' as const, title: e.description || 'Xarajat', amount: e.amount, date: e.date, deleted_at: e.updated_at })),
      ...debts.map((d) => ({ id: d.id, type: 'debt' as const, title: `${d.type === 'given' ? 'Berilgan' : 'Olingan'}: ${d.counterparty}`, amount: d.initial_amount, date: d.due_date, deleted_at: d.updated_at }))
    ].sort((a, b) => new Date(b.deleted_at).getTime() - new Date(a.deleted_at).getTime());
  }

  public restoreItem(type: 'income' | 'expense' | 'debt', id: string, userId: string): boolean {
    const now = new Date().toISOString();
    if (type === 'income') {
      const all = this.getItem<Income[]>(STORAGE_KEYS.INCOMES, []);
      const idx = all.findIndex((i) => i.id === id && i.user_id === userId);
      if (idx >= 0) {
        all[idx].is_deleted = false;
        all[idx].updated_at = now;
        this.setItem(STORAGE_KEYS.INCOMES, all);
        this.logAudit(userId, 'INCOME', id, 'UPDATE', 'Daromad qayta tiklandi (Recycle Bin)', `ID: ${id}`);
        return true;
      }
    } else if (type === 'expense') {
      const all = this.getItem<Expense[]>(STORAGE_KEYS.EXPENSES, []);
      const idx = all.findIndex((e) => e.id === id && e.user_id === userId);
      if (idx >= 0) {
        all[idx].is_deleted = false;
        all[idx].updated_at = now;
        this.setItem(STORAGE_KEYS.EXPENSES, all);
        this.logAudit(userId, 'EXPENSE', id, 'UPDATE', 'Xarajat qayta tiklandi (Recycle Bin)', `ID: ${id}`);
        return true;
      }
    } else if (type === 'debt') {
      const all = this.getItem<Debt[]>(STORAGE_KEYS.DEBTS, []);
      const idx = all.findIndex((d) => d.id === id && d.user_id === userId);
      if (idx >= 0) {
        all[idx].is_deleted = false;
        all[idx].updated_at = now;
        this.setItem(STORAGE_KEYS.DEBTS, all);
        this.logAudit(userId, 'DEBT', id, 'UPDATE', 'Qarz yozuvi qayta tiklandi (Recycle Bin)', `ID: ${id}`);
        return true;
      }
    }
    return false;
  }

  public permanentDeleteItem(type: 'income' | 'expense' | 'debt', id: string, userId: string): boolean {
    if (type === 'income') {
      const all = this.getItem<Income[]>(STORAGE_KEYS.INCOMES, []);
      this.setItem(STORAGE_KEYS.INCOMES, all.filter((i) => !(i.id === id && i.user_id === userId)));
    } else if (type === 'expense') {
      const all = this.getItem<Expense[]>(STORAGE_KEYS.EXPENSES, []);
      this.setItem(STORAGE_KEYS.EXPENSES, all.filter((e) => !(e.id === id && e.user_id === userId)));
    } else if (type === 'debt') {
      const all = this.getItem<Debt[]>(STORAGE_KEYS.DEBTS, []);
      this.setItem(STORAGE_KEYS.DEBTS, all.filter((d) => !(d.id === id && d.user_id === userId)));
    }
    this.logAudit(userId, 'SETTINGS', id, 'DELETE', 'Yozuv butunlay o\'chirildi (Permanent Delete)', `ID: ${id}`);
    return true;
  }

  public emptyTrash(userId: string): void {
    const incs = this.getItem<Income[]>(STORAGE_KEYS.INCOMES, []).filter((i) => !(i.user_id === userId && i.is_deleted));
    const exps = this.getItem<Expense[]>(STORAGE_KEYS.EXPENSES, []).filter((e) => !(e.user_id === userId && e.is_deleted));
    const dbts = this.getItem<Debt[]>(STORAGE_KEYS.DEBTS, []).filter((d) => !(d.user_id === userId && d.is_deleted));
    this.setItem(STORAGE_KEYS.INCOMES, incs);
    this.setItem(STORAGE_KEYS.EXPENSES, exps);
    this.setItem(STORAGE_KEYS.DEBTS, dbts);
    this.logAudit(userId, 'SETTINGS', 'trash', 'DELETE', 'Chiqindilar qutisi butunlay tozalandi', 'Barcha o\'chirilgan yozuvlar tozalandi');
  }

  public bulkDeleteIncomes(ids: string[], userId: string): void {
    const all = this.getItem<Income[]>(STORAGE_KEYS.INCOMES, []);
    const idSet = new Set(ids);
    const now = new Date().toISOString();
    all.forEach((i) => {
      if (i.user_id === userId && idSet.has(i.id)) {
        i.is_deleted = true;
        i.updated_at = now;
      }
    });
    this.setItem(STORAGE_KEYS.INCOMES, all);
    this.logAudit(userId, 'INCOME', 'bulk', 'DELETE', 'Ommaviy daromadlar o\'chirildi', `${ids.length} ta yozuv`);
  }

  public bulkDeleteExpenses(ids: string[], userId: string): void {
    const all = this.getItem<Expense[]>(STORAGE_KEYS.EXPENSES, []);
    const idSet = new Set(ids);
    const now = new Date().toISOString();
    all.forEach((e) => {
      if (e.user_id === userId && idSet.has(e.id)) {
        e.is_deleted = true;
        e.updated_at = now;
      }
    });
    this.setItem(STORAGE_KEYS.EXPENSES, all);
    this.logAudit(userId, 'EXPENSE', 'bulk', 'DELETE', 'Ommaviy xarajatlar o\'chirildi', `${ids.length} ta yozuv`);
  }

  // --- Full Database Export / Import ---
  public exportFullBackup(userId: string) {
    return {
      version: '2.0.0',
      exported_at: new Date().toISOString(),
      user: this.getUserById(userId),
      settings: this.getSettings(userId),
      categories: this.getAllCategories(userId),
      incomes: this.getIncomes(userId),
      expenses: this.getExpenses(userId),
      debts: this.getDebts(userId),
      debt_payments: this.getDebtPayments(userId),
      budgets: this.getBudgets(userId),
      audit_logs: this.getAuditLogs(userId)
    };
  }

  public importFullBackup(userId: string, backupData: any): boolean {
    if (!backupData || !backupData.categories) return false;
    try {
      if (backupData.settings) this.saveSettings({ ...backupData.settings, user_id: userId });
      
      const existingCats = this.getItem<Category[]>(STORAGE_KEYS.CATEGORIES, []).filter((c) => c.user_id !== userId);
      const importedCats = (backupData.categories || []).map((c: any) => ({ ...c, user_id: userId }));
      this.setItem(STORAGE_KEYS.CATEGORIES, [...existingCats, ...importedCats]);

      const existingIncomes = this.getItem<Income[]>(STORAGE_KEYS.INCOMES, []).filter((i) => i.user_id !== userId);
      const importedIncomes = (backupData.incomes || []).map((i: any) => ({ ...i, user_id: userId }));
      this.setItem(STORAGE_KEYS.INCOMES, [...existingIncomes, ...importedIncomes]);

      const existingExpenses = this.getItem<Expense[]>(STORAGE_KEYS.EXPENSES, []).filter((e) => e.user_id !== userId);
      const importedExpenses = (backupData.expenses || []).map((e: any) => ({ ...e, user_id: userId }));
      this.setItem(STORAGE_KEYS.EXPENSES, [...existingExpenses, ...importedExpenses]);

      const existingDebts = this.getItem<Debt[]>(STORAGE_KEYS.DEBTS, []).filter((d) => d.user_id !== userId);
      const importedDebts = (backupData.debts || []).map((d: any) => ({ ...d, user_id: userId }));
      this.setItem(STORAGE_KEYS.DEBTS, [...existingDebts, ...importedDebts]);

      const existingPayments = this.getItem<DebtPayment[]>(STORAGE_KEYS.DEBT_PAYMENTS, []).filter((p) => p.user_id !== userId);
      const importedPayments = (backupData.debt_payments || []).map((p: any) => ({ ...p, user_id: userId }));
      this.setItem(STORAGE_KEYS.DEBT_PAYMENTS, [...existingPayments, ...importedPayments]);

      const existingBudgets = this.getItem<Budget[]>(STORAGE_KEYS.BUDGETS, []).filter((b) => b.user_id !== userId);
      const importedBudgets = (backupData.budgets || []).map((b: any) => ({ ...b, user_id: userId }));
      this.setItem(STORAGE_KEYS.BUDGETS, [...existingBudgets, ...importedBudgets]);

      this.logAudit(userId, 'SETTINGS', 'backup_restore', 'RESTORE', 'Ma\'lumotlar arxivdan tiklandi', `${importedIncomes.length} daromad, ${importedExpenses.length} xarajat, ${importedDebts.length} qarz`);
      return true;
    } catch (e) {
      console.error('Backup import error:', e);
      return false;
    }
  }

  // --- AI Chat History ---
  public getAIChatHistory(userId: string): AIMessage[] {
    const all = this.getItem<Record<string, AIMessage[]>>(STORAGE_KEYS.AI_CHAT_HISTORY, {});
    return all[userId] || [];
  }

  public saveAIChatHistory(userId: string, messages: AIMessage[]): void {
    const all = this.getItem<Record<string, AIMessage[]>>(STORAGE_KEYS.AI_CHAT_HISTORY, {});
    all[userId] = messages;
    this.setItem(STORAGE_KEYS.AI_CHAT_HISTORY, all);
  }

  public clearAIChatHistory(userId: string): void {
    const all = this.getItem<Record<string, AIMessage[]>>(STORAGE_KEYS.AI_CHAT_HISTORY, {});
    delete all[userId];
    this.setItem(STORAGE_KEYS.AI_CHAT_HISTORY, all);
  }

  // --- Batch Cloud Synchronization Helpers ---
  public saveCategories(categories: Category[]): void {
    const existing = this.getItem<Category[]>(STORAGE_KEYS.CATEGORIES, []);
    const map = new Map<string, Category>();
    existing.forEach((c) => map.set(c.id, c));
    categories.forEach((c) => map.set(c.id, c));
    this.setItem(STORAGE_KEYS.CATEGORIES, Array.from(map.values()));
  }

  public saveIncomes(incomes: Income[]): void {
    const existing = this.getItem<Income[]>(STORAGE_KEYS.INCOMES, []);
    const map = new Map<string, Income>();
    existing.forEach((i) => map.set(i.id, i));
    incomes.forEach((i) => map.set(i.id, i));
    this.setItem(STORAGE_KEYS.INCOMES, Array.from(map.values()));
  }

  public saveExpenses(expenses: Expense[]): void {
    const existing = this.getItem<Expense[]>(STORAGE_KEYS.EXPENSES, []);
    const map = new Map<string, Expense>();
    existing.forEach((e) => map.set(e.id, e));
    expenses.forEach((e) => map.set(e.id, e));
    this.setItem(STORAGE_KEYS.EXPENSES, Array.from(map.values()));
  }

  public saveDebts(debts: Debt[]): void {
    const existing = this.getItem<Debt[]>(STORAGE_KEYS.DEBTS, []);
    const map = new Map<string, Debt>();
    existing.forEach((d) => map.set(d.id, d));
    debts.forEach((d) => map.set(d.id, d));
    this.setItem(STORAGE_KEYS.DEBTS, Array.from(map.values()));
  }

  public saveDebtPayments(payments: DebtPayment[]): void {
    const existing = this.getItem<DebtPayment[]>(STORAGE_KEYS.DEBT_PAYMENTS, []);
    const map = new Map<string, DebtPayment>();
    existing.forEach((p) => map.set(p.id, p));
    payments.forEach((p) => map.set(p.id, p));
    this.setItem(STORAGE_KEYS.DEBT_PAYMENTS, Array.from(map.values()));
  }

  public saveBudgets(budgets: Budget[]): void {
    const existing = this.getItem<Budget[]>(STORAGE_KEYS.BUDGETS, []);
    const map = new Map<string, Budget>();
    existing.forEach((b) => map.set(b.id, b));
    budgets.forEach((b) => map.set(b.id, b));
    this.setItem(STORAGE_KEYS.BUDGETS, Array.from(map.values()));
  }

  // --- Auth Session (Expires automatically on App/Tab Close 'X') ---
  public getAuthSession(): { isAuthenticated: boolean; userId: string } {
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        const sessionActive = window.sessionStorage.getItem('pfms_session_active');
        const sessionUserId = window.sessionStorage.getItem('pfms_session_userId');
        const lastUserId = this.getItem<string>(STORAGE_KEYS.CURRENT_USER_ID, DEFAULT_USER.id);

        if (sessionActive === 'true' && sessionUserId) {
          return {
            isAuthenticated: true,
            userId: sessionUserId
          };
        }

        // Window was closed/re-opened: force login & password prompt
        return {
          isAuthenticated: false,
          userId: lastUserId || DEFAULT_USER.id
        };
      }
    } catch (err) {
      console.warn('Session check fallback:', err);
    }

    return {
      isAuthenticated: false,
      userId: DEFAULT_USER.id
    };
  }

  public setAuthSession(session: { isAuthenticated: boolean; userId: string }): void {
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        if (session.isAuthenticated) {
          window.sessionStorage.setItem('pfms_session_active', 'true');
          window.sessionStorage.setItem('pfms_session_userId', session.userId);
          this.setItem(STORAGE_KEYS.CURRENT_USER_ID, session.userId);
        } else {
          window.sessionStorage.removeItem('pfms_session_active');
          window.sessionStorage.removeItem('pfms_session_userId');
        }
      }
    } catch (err) {
      console.warn('Set session error:', err);
    }
    this.setItem(STORAGE_KEYS.AUTH_SESSION, session);
  }
}

export const db = new DatabaseEngine();
db.init();

