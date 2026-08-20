export type Currency = 'UZS' | 'USD' | 'EUR' | 'RUB';
export type Language = 'uz' | 'ru' | 'en';
export type AdminRole = 'bosh_admin' | 'moliya_boshqaruvchisi' | 'auditor' | 'foydalanuvchi';

export interface UserProfile {
  id: string;
  email: string;
  username?: string;
  full_name: string;
  password?: string; // encrypted or hashed locally
  phone?: string;
  role?: AdminRole;
  bio?: string;
  avatar_url?: string;
  currency: Currency;
  language: Language;
  timezone: string;
  last_login?: string;
  created_at: string;
  updated_at: string;
}

export interface AuthSession {
  isAuthenticated: boolean;
  currentUser: UserProfile;
  token?: string;
}

// AI Financial Action & Chat Types
export type AIActionType = 
  | 'ADD_INCOME' 
  | 'ADD_EXPENSE' 
  | 'ADD_DEBT' 
  | 'ADD_DEBT_PAYMENT' 
  | 'SET_BUDGET' 
  | 'ADD_CATEGORY' 
  | 'UPDATE_SETTINGS' 
  | 'UPDATE_PROFILE' 
  | 'EXPORT_EXCEL'
  | 'FINANCIAL_ADVICE';

export interface AIActionPayload {
  type: AIActionType;
  params: Record<string, any>;
  summary: string;
  status?: 'pending' | 'success' | 'failed';
  error?: string;
}

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  actions?: AIActionPayload[];
  isThinking?: boolean;
}

export type DebtType = 'given' | 'received'; // given = Berilgan qarz (Receivable), received = Olingan qarz (Payable)
export type DebtStatus = 'unpaid' | 'partially_paid' | 'paid' | 'overdue';

export interface Category {
  id: string;
  user_id: string;
  name: string;
  type: 'income' | 'expense';
  icon: string;
  color: string;
  description?: string;
  is_default?: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Income {
  id: string;
  user_id: string;
  date: string; // ISO string or YYYY-MM-DD
  category_id: string;
  amount: number;
  description: string;
  payment_method: string;
  is_deleted?: boolean;
  created_at: string;
  updated_at: string;
}

export interface Expense {
  id: string;
  user_id: string;
  date: string; // ISO string or YYYY-MM-DD
  category_id: string;
  amount: number;
  description: string;
  payment_method: string;
  is_deleted?: boolean;
  created_at: string;
  updated_at: string;
}

export interface DebtPayment {
  id: string;
  debt_id: string;
  user_id: string;
  payment_date: string;
  amount: number;
  note?: string;
  payment_method: string;
  created_at: string;
  updated_at: string;
}

export interface Debt {
  id: string;
  user_id: string;
  type: DebtType;
  counterparty: string; // Kimga / Kimdan
  initial_amount: number;
  due_date: string;
  description?: string;
  is_deleted?: boolean;
  created_at: string;
  updated_at: string;
}

export interface DebtWithComputed extends Debt {
  paid_amount: number;
  remaining_amount: number;
  computed_status: DebtStatus;
  is_overdue: boolean;
  overdue_days: number;
  payments: DebtPayment[];
}

export type BudgetPeriodType = 'monthly' | 'yearly';
export type BudgetStatus = 'on_track' | 'warning' | 'exceeded';

export interface Budget {
  id: string;
  user_id: string;
  category_id: string;
  period_type: BudgetPeriodType;
  period_key: string; // e.g. "2026-08" or "2026"
  limit_amount: number;
  created_at: string;
  updated_at: string;
}

export interface BudgetWithComputed extends Budget {
  category_name: string;
  category_icon: string;
  category_color: string;
  spent_amount: number;
  remaining_amount: number;
  usage_percentage: number;
  status: BudgetStatus;
}

export interface UserSettings {
  user_id: string;
  currency: Currency;
  language: Language;
  timezone: string;
  default_period: 'today' | 'this_week' | 'this_month' | 'last_30_days' | 'this_year' | 'all';
  notifications_enabled: boolean;
  budget_alert_threshold: number; // default 80%
  dark_mode: boolean;
  updated_at: string;
}

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'REPAYMENT' | 'IMPORT' | 'RESTORE';
export type AuditEntity = 'INCOME' | 'EXPENSE' | 'DEBT' | 'PAYMENT' | 'REPAYMENT' | 'BUDGET' | 'CATEGORY' | 'SETTINGS';

export interface AuditLog {
  id: string;
  user_id: string;
  entity_type: AuditEntity;
  entity_id: string;
  action: AuditAction;
  title: string;
  details: string;
  timestamp: string;
}

export interface FinancialSummary {
  total_income: number;
  total_expense: number;
  net_balance: number;
  savings_rate: number; // Positive savings % or negative deficit %
  total_debt_given_initial: number;
  total_debt_given_remaining: number;
  total_debt_received_initial: number;
  total_debt_received_remaining: number;
  total_debt_repayments_made: number;
  total_debt_repayments_collected: number;
  net_cash_flow: number;
  overdue_debts_count: number;
  overdue_debts_amount: number;
  budget_usage_total_percent: number;
  total_budget_limit: number;
  total_budget_spent: number;

  // Pro Financial Analyst & CFO Metrics
  net_liquid_assets: number; // Net balance + Given Debts Remaining - Received Debts Remaining
  net_debt_position: number; // Given Debts Remaining - Received Debts Remaining
  monthly_burn_rate: number; // Average monthly expenditure
  runway_months: number; // Liquid assets / monthly burn rate
  runway_days: number; // Runway expressed in days
  dti_ratio: number; // Debt-to-Income ratio %
  receivable_collection_rate: number; // % of given debts collected so far
  financial_health_score: number; // 0 to 100
  financial_health_grade: 'A+' | 'A' | 'B' | 'C' | 'D';
  income_concentration_hhi: number; // Herfindahl-Hirschman Index (0-10000)
  primary_income_share: number; // % of top income category
}

export interface StressScenarioResult {
  scenarioName: string;
  description: string;
  projectedIncome: number;
  projectedExpense: number;
  projectedBalance: number;
  projectedRunwayMonths: number;
  riskLevel: 'past' | 'ortacha' | 'yuqori' | 'kritik';
  impactDescription: string;
}

// -------------------------------------------------------------
// Advanced Wall-Street & Senior CFO Financial Analysis Types
// -------------------------------------------------------------

export interface DuPontAnalysis {
  netProfitMargin: number; // Net Income / Total Revenue (%)
  operatingExpenseRatio: number; // Operating Expenses / Total Revenue (%)
  assetTurnover: number; // Total Revenue / Total Assets
  financialLeverage: number; // Total Assets / Net Worth
  returnOnEquity: number; // ROE = Margin * Turnover * Leverage (%)
  capitalEfficiencyRating: 'A+' | 'A' | 'B' | 'C' | 'D';
  interpretation: string;
}

export interface LiquiditySolvencySuite {
  currentRatio: number; // Current Assets / Current Liabilities
  quickRatio: number; // Quick Assets / Current Liabilities
  cashRatio: number; // Cash / Current Liabilities
  dscr: number; // Debt Service Coverage Ratio
  netWorkingCapital: number; // Current Assets - Current Liabilities
  debtToEquity: number; // Total Debt / Net Worth (%)
  interestOrDebtBurdenPerDay: number;
  solvencyGrade: 'A+' | 'A' | 'B' | 'C' | 'D';
}

export interface CashFlow3Statement {
  operatingCashFlow: number; // CFO
  investingCashFlow: number; // CFI (Loans given / capital outflows)
  financingCashFlow: number; // CFF (Loans received & debt repayments)
  freeCashFlow: number; // FCF = CFO - CapEx/Investments
  netChangeInCash: number;
  cashReconciliationStatus: 'balanced' | 'discrepancy';
  discrepancyAmount: number;
}

export interface WorkingCapitalCycle {
  receivablesDSO: number; // Days Sales / Receivables Outstanding
  payablesDPO: number; // Days Payables Outstanding
  cashConversionCycleDays: number; // DSO - DPO (or cycle estimate)
  receivableTurnoverTimes: number;
}

export interface VarianceAnalysisItem {
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  budgetLimit: number;
  actualSpent: number;
  varianceAmount: number; // Budget - Actual (>0 favorable, <0 unfavorable)
  variancePercent: number;
  isFavorable: boolean;
  paretoCumulativePercent: number;
  paretoRank: number;
}

export interface SensitivityMatrixCell {
  incomeChangePercent: number;
  expenseChangePercent: number;
  projectedNetBalance: number;
  projectedRunwayMonths: number;
  riskStatus: 'safe' | 'moderate' | 'high' | 'critical';
}

export interface ProForecastPoint {
  periodLabel: string;
  monthIndex: number;
  baselineIncome: number;
  baselineExpense: number;
  baselineNet: number;
  pessimisticNet: number;
  optimisticNet: number;
  projectedCumulativeNetWorth: number;
}

export interface CFOAuditCheckItem {
  id: string;
  code: string;
  title: string;
  category: 'Likvidlik' | 'Rentabellik' | 'Qarz Siyosati' | 'Byudjet Intizomi' | 'Matematik Reconciliatsiya';
  metricValue: string;
  benchmark: string;
  status: 'pass' | 'warning' | 'fail';
  auditNote: string;
  actionRequired?: string;
}

export interface ProCFOAnalysisReport {
  generatedAt: string;
  period: string;
  healthScore: number;
  healthGrade: 'A+' | 'A' | 'B' | 'C' | 'D';
  summaryObservations: string[];
  keyStrengths: string[];
  vulnerabilities: string[];
  actionableRecommendations: string[];
  dupont: DuPontAnalysis;
  liquidity: LiquiditySolvencySuite;
  cashFlow3: CashFlow3Statement;
  workingCapital: WorkingCapitalCycle;
  auditChecks: CFOAuditCheckItem[];
}

export type PeriodFilter = 'today' | 'this_week' | 'this_month' | 'last_30_days' | 'this_year' | 'all' | 'custom';

export interface DateFilterRange {
  period: PeriodFilter;
  start_date: string;
  end_date: string;
}

export interface NotificationItem {
  id: string;
  type: 'warning' | 'danger' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: string;
  linkTo?: string;
  read: boolean;
}
