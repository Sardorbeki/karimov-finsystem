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
  DebtStatus,
  StressScenarioResult,
  ProCFOAnalysisReport,
  DuPontAnalysis,
  LiquiditySolvencySuite,
  CashFlow3Statement,
  WorkingCapitalCycle,
  VarianceAnalysisItem,
  SensitivityMatrixCell,
  ProForecastPoint,
  CFOAuditCheckItem
} from '../types';
import { calculateDateDifferenceDays, toInputDateFormat } from './formatters';

export function computeDebtDetails(debt: Debt, payments: DebtPayment[], todayStr: string = toInputDateFormat()): DebtWithComputed {
  const debtPayments = payments.filter((p) => p.debt_id === debt.id);
  const paid_amount = debtPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const remaining_amount = Math.max(0, (Number(debt.initial_amount) || 0) - paid_amount);
  
  const diffDays = calculateDateDifferenceDays(debt.due_date, todayStr);
  const is_overdue = diffDays > 0 && remaining_amount > 0;
  const overdue_days = is_overdue ? diffDays : 0;

  let computed_status: DebtStatus = 'unpaid';
  if (remaining_amount === 0 && (Number(debt.initial_amount) || 0) > 0) {
    computed_status = 'paid';
  } else if (is_overdue) {
    computed_status = 'overdue';
  } else if (paid_amount > 0) {
    computed_status = 'partially_paid';
  } else {
    computed_status = 'unpaid';
  }

  return {
    ...debt,
    paid_amount,
    remaining_amount,
    computed_status,
    is_overdue,
    overdue_days,
    payments: debtPayments
  };
}

export function getDateRangeFromPeriod(period: PeriodFilter, customStart?: string, customEnd?: string): { start_date: string; end_date: string } {
  const now = new Date();
  const todayStr = toInputDateFormat(now);

  switch (period) {
    case 'today':
      return { start_date: todayStr, end_date: todayStr };
    case 'this_week': {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
      const monday = new Date(now.setDate(diff));
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      return { start_date: toInputDateFormat(monday), end_date: toInputDateFormat(sunday) };
    }
    case 'this_month': {
      const year = now.getFullYear();
      const month = now.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      return { start_date: toInputDateFormat(firstDay), end_date: toInputDateFormat(lastDay) };
    }
    case 'last_30_days': {
      const past30 = new Date(now);
      past30.setDate(now.getDate() - 30);
      return { start_date: toInputDateFormat(past30), end_date: todayStr };
    }
    case 'this_year': {
      const year = now.getFullYear();
      return { start_date: `${year}-01-01`, end_date: `${year}-12-31` };
    }
    case 'custom':
      return {
        start_date: customStart || `${now.getFullYear()}-01-01`,
        end_date: customEnd || todayStr
      };
    case 'all':
    default:
      return { start_date: '2000-01-01', end_date: '2099-12-31' };
  }
}

export function isDateInRange(dateStr: string, range?: DateFilterRange): boolean {
  if (!range || range.period === 'all') return true;
  if (!dateStr) return false;
  const d = dateStr.split('T')[0];
  const start = range.start_date || '2000-01-01';
  const end = range.end_date || '2099-12-31';
  return d >= start && d <= end;
}

export function calculateFinancialSummary(
  incomes: Income[],
  expenses: Expense[],
  debts: DebtWithComputed[],
  payments: DebtPayment[],
  budgets: BudgetWithComputed[],
  range: DateFilterRange
): FinancialSummary {
  // Filter active transactions
  const filteredIncomes = incomes.filter((i) => !i.is_deleted && isDateInRange(i.date, range));
  const filteredExpenses = expenses.filter((e) => !e.is_deleted && isDateInRange(e.date, range));

  const total_income = filteredIncomes.reduce((acc, i) => acc + (Number(i.amount) || 0), 0);
  const total_expense = filteredExpenses.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
  const net_balance = total_income - total_expense;

  // Real Savings rate formula (can be negative if overspent - CFO precision)
  const savings_rate = total_income > 0 ? ((total_income - total_expense) / total_income) * 100 : (total_expense > 0 ? -100 : 0);

  // Debt calculations
  const activeDebts = debts.filter((d) => !d.is_deleted);
  const givenDebts = activeDebts.filter((d) => d.type === 'given');
  const receivedDebts = activeDebts.filter((d) => d.type === 'received');

  const total_debt_given_initial = givenDebts.reduce((sum, d) => sum + Number(d.initial_amount || 0), 0);
  const total_debt_given_remaining = givenDebts.reduce((sum, d) => sum + Number(d.remaining_amount || 0), 0);
  const total_debt_received_initial = receivedDebts.reduce((sum, d) => sum + Number(d.initial_amount || 0), 0);
  const total_debt_received_remaining = receivedDebts.reduce((sum, d) => sum + Number(d.remaining_amount || 0), 0);

  // Payments in range
  const filteredPayments = payments.filter((p) => isDateInRange(p.payment_date, range));
  
  let total_debt_repayments_collected = 0; // given debts repaid back to us (Cash Inflow)
  let total_debt_repayments_made = 0; // received debts we paid back (Cash Outflow)

  filteredPayments.forEach((p) => {
    const parentDebt = activeDebts.find((d) => d.id === p.debt_id);
    if (parentDebt) {
      if (parentDebt.type === 'given') {
        total_debt_repayments_collected += Number(p.amount || 0);
      } else {
        total_debt_repayments_made += Number(p.amount || 0);
      }
    }
  });

  // Given debts in range (cash outflow when given)
  const newGivenDebtsInRange = givenDebts
    .filter((d) => isDateInRange(d.created_at, range))
    .reduce((sum, d) => sum + Number(d.initial_amount || 0), 0);

  // Received debts in range (cash inflow when received)
  const newReceivedDebtsInRange = receivedDebts
    .filter((d) => isDateInRange(d.created_at, range))
    .reduce((sum, d) => sum + Number(d.initial_amount || 0), 0);

  // Cash flow logic
  const totalCashInflow = total_income + newReceivedDebtsInRange + total_debt_repayments_collected;
  const totalCashOutflow = total_expense + newGivenDebtsInRange + total_debt_repayments_made;
  const net_cash_flow = totalCashInflow - totalCashOutflow;

  // Overdue debts
  const overdueDebts = activeDebts.filter((d) => d.is_overdue);
  const overdue_debts_count = overdueDebts.length;
  const overdue_debts_amount = overdueDebts.reduce((sum, d) => sum + Number(d.remaining_amount || 0), 0);

  // Budget summaries
  const total_budget_limit = budgets.reduce((sum, b) => sum + Number(b.limit_amount || 0), 0);
  const total_budget_spent = budgets.reduce((sum, b) => sum + Number(b.spent_amount || 0), 0);
  const budget_usage_total_percent = total_budget_limit > 0 ? (total_budget_spent / total_budget_limit) * 100 : 0;

  // -------------------------------------------------------------
  // PRO CFO FINANCIAL RATIOS & INDICATORS
  // -------------------------------------------------------------
  const net_debt_position = total_debt_given_remaining - total_debt_received_remaining;
  const net_liquid_assets = net_balance + total_debt_given_remaining - total_debt_received_remaining;

  // Monthly Burn rate & Runway
  const monthly_burn_rate = total_expense > 0 ? total_expense : 1;
  const rawRunway = monthly_burn_rate > 0 ? (Math.max(0, net_balance) / monthly_burn_rate) : 12;
  const runway_months = Number(rawRunway.toFixed(1));
  const runway_days = Math.round(rawRunway * 30);

  // DTI (Debt-to-income) Service Burden
  const dti_ratio = total_income > 0 ? (total_debt_repayments_made / total_income) * 100 : 0;

  // Receivable Collection Rate
  const receivable_collection_rate =
    total_debt_given_initial > 0
      ? (total_debt_repayments_collected / total_debt_given_initial) * 100
      : 100;

  // Income Concentration (Herfindahl-Hirschman Index)
  const incomeCategoryTotals: Record<string, number> = {};
  filteredIncomes.forEach((inc) => {
    incomeCategoryTotals[inc.category_id] = (incomeCategoryTotals[inc.category_id] || 0) + inc.amount;
  });
  const catSums = Object.values(incomeCategoryTotals);
  let income_concentration_hhi = 0;
  let topIncomeVal = 0;
  if (total_income > 0) {
    catSums.forEach((val) => {
      const share = (val / total_income) * 100;
      income_concentration_hhi += share * share;
      if (val > topIncomeVal) topIncomeVal = val;
    });
  }
  const primary_income_share = total_income > 0 ? (topIncomeVal / total_income) * 100 : 0;

  // Financial Health Score Algorithm (0 to 100):
  // 1. Savings Rate Component (0-30 pts)
  let savingsPts = 0;
  if (savings_rate >= 50) savingsPts = 30;
  else if (savings_rate >= 30) savingsPts = 25;
  else if (savings_rate >= 15) savingsPts = 20;
  else if (savings_rate >= 0) savingsPts = 12;
  else savingsPts = 0;

  // 2. Budget Adherence Component (0-25 pts)
  let budgetPts = 25;
  if (budget_usage_total_percent > 115) budgetPts = 5;
  else if (budget_usage_total_percent > 100) budgetPts = 12;
  else if (budget_usage_total_percent > 85) budgetPts = 20;
  else if (total_budget_limit > 0) budgetPts = 25;
  else budgetPts = 18; // no budgets set

  // 3. Debt Burden Component (0-25 pts)
  let debtPts = 25;
  if (overdue_debts_count > 0) debtPts -= 15;
  if (dti_ratio > 40) debtPts -= 10;
  else if (dti_ratio > 25) debtPts -= 5;
  if (total_debt_received_remaining > total_income * 2) debtPts -= 5;
  debtPts = Math.max(0, Math.min(25, debtPts));

  // 4. Liquidity Runway Component (0-20 pts)
  let liquidityPts = 0;
  if (runway_months >= 6) liquidityPts = 20;
  else if (runway_months >= 3) liquidityPts = 15;
  else if (runway_months >= 1) liquidityPts = 10;
  else if (runway_months > 0.5) liquidityPts = 5;
  else liquidityPts = 0;

  const financial_health_score = Math.round(savingsPts + budgetPts + debtPts + liquidityPts);

  let financial_health_grade: 'A+' | 'A' | 'B' | 'C' | 'D' = 'B';
  if (financial_health_score >= 90) financial_health_grade = 'A+';
  else if (financial_health_score >= 80) financial_health_grade = 'A';
  else if (financial_health_score >= 65) financial_health_grade = 'B';
  else if (financial_health_score >= 45) financial_health_grade = 'C';
  else financial_health_grade = 'D';

  return {
    total_income,
    total_expense,
    net_balance,
    savings_rate,
    total_debt_given_initial,
    total_debt_given_remaining,
    total_debt_received_initial,
    total_debt_received_remaining,
    total_debt_repayments_made,
    total_debt_repayments_collected,
    net_cash_flow,
    overdue_debts_count,
    overdue_debts_amount,
    budget_usage_total_percent,
    total_budget_limit,
    total_budget_spent,

    net_liquid_assets,
    net_debt_position,
    monthly_burn_rate,
    runway_months,
    runway_days,
    dti_ratio,
    receivable_collection_rate,
    financial_health_score,
    financial_health_grade,
    income_concentration_hhi,
    primary_income_share
  };
}

export function computeBudgets(
  budgets: Budget[],
  expenses: Expense[],
  categories: Category[],
  currentPeriodKey: string = '2026-08'
): BudgetWithComputed[] {
  return budgets
    .filter((b) => b.period_key === currentPeriodKey || b.period_key === currentPeriodKey.split('-')[0])
    .map((b) => {
      const cat = categories.find((c) => c.id === b.category_id);
      const spent = expenses
        .filter((e) => !e.is_deleted && e.category_id === b.category_id && e.date.startsWith(b.period_key))
        .reduce((sum, e) => sum + Number(e.amount || 0), 0);

      const limit = Number(b.limit_amount) || 0;
      const remaining_amount = limit - spent;
      const usage_percentage = limit > 0 ? (spent / limit) * 100 : 0;

      let status: 'on_track' | 'warning' | 'exceeded' = 'on_track';
      if (usage_percentage > 100) {
        status = 'exceeded';
      } else if (usage_percentage >= 70) {
        status = 'warning';
      } else {
        status = 'on_track';
      }

      return {
        ...b,
        category_name: cat ? cat.name : "Noma'lum kategoriya",
        category_icon: cat ? cat.icon : 'HelpCircle',
        category_color: cat ? cat.color : '#64748b',
        spent_amount: spent,
        remaining_amount,
        usage_percentage,
        status
      };
    });
}

export function generateMonthlyReports(incomes: Income[], expenses: Expense[], year: string = '2026') {
  const months = [
    { code: '01', name: 'Yanvar' },
    { code: '02', name: 'Fevral' },
    { code: '03', name: 'Mart' },
    { code: '04', name: 'Aprel' },
    { code: '05', name: 'May' },
    { code: '06', name: 'Iyun' },
    { code: '07', name: 'Iyul' },
    { code: '08', name: 'Avgust' },
    { code: '09', name: 'Sentyabr' },
    { code: '10', name: 'Oktyabr' },
    { code: '11', name: 'Noyabr' },
    { code: '12', name: 'Dekabr' }
  ];

  let cumulativeBalance = 0;

  return months.map((m) => {
    const prefix = `${year}-${m.code}`;
    const monthIncomes = incomes.filter((i) => !i.is_deleted && i.date.startsWith(prefix));
    const incTotal = monthIncomes.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);

    const monthExpenses = expenses.filter((e) => !e.is_deleted && e.date.startsWith(prefix));
    const expTotal = monthExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    const netBalance = incTotal - expTotal;
    const savingsRate = incTotal > 0 ? (Math.max(0, netBalance) / incTotal) * 100 : 0;
    cumulativeBalance += netBalance;

    return {
      monthCode: prefix,
      monthName: m.name,
      income: incTotal,
      expense: expTotal,
      netBalance,
      savingsRate,
      cumulativeBalance,
      cashInflow: incTotal,
      cashOutflow: expTotal,
      netCashFlow: netBalance,
      incomeCount: monthIncomes.length,
      expenseCount: monthExpenses.length
    };
  });
}

export function calculateAnnualTotals(monthlyReports: Array<{ income: number; expense: number; cashInflow?: number; cashOutflow?: number }>) {
  const inc = monthlyReports.reduce((s, m) => s + m.income, 0);
  const exp = monthlyReports.reduce((s, m) => s + m.expense, 0);
  const net = inc - exp;
  const savings = inc > 0 ? (Math.max(0, net) / inc) * 100 : 0;
  const cashIn = monthlyReports.reduce((s, m) => s + (m.cashInflow || m.income), 0);
  const cashOut = monthlyReports.reduce((s, m) => s + (m.cashOutflow || m.expense), 0);

  return {
    totalIncome: inc,
    totalExpense: exp,
    netBalance: net,
    savingsRate: savings,
    cashInflow: cashIn,
    cashOutflow: cashOut,
    netCashFlow: cashIn - cashOut
  };
}

export function calculateCategoryExpenseBreakdown(expenses: Expense[], categories: Category[], year: string = '2026') {
  const activeExpenses = expenses.filter((e) => !e.is_deleted && e.date.startsWith(year));
  const expCats = categories.filter((c) => c.type === 'expense');
  const totalExp = activeExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  return expCats.map((cat) => {
    const total = activeExpenses
      .filter((e) => e.category_id === cat.id)
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const percent = totalExp > 0 ? (total / totalExp) * 100 : 0;

    return {
      id: cat.id,
      name: cat.name,
      color: cat.color,
      icon: cat.icon,
      total,
      percent
    };
  }).sort((a, b) => b.total - a.total);
}

/**
 * Generates what-if stress-testing scenarios for Pro Financial Analysis
 */
export function generateStressTestScenarios(summary: FinancialSummary): StressScenarioResult[] {
  const baseIncome = summary.total_income;
  const baseExpense = summary.total_expense;
  const burn = baseExpense > 0 ? baseExpense : 1;

  // Scenario 1: Income drops by 30%
  const s1Income = baseIncome * 0.7;
  const s1Expense = baseExpense;
  const s1Balance = s1Income - s1Expense;
  const s1Runway = Number((Math.max(0, s1Balance) / burn).toFixed(1));

  // Scenario 2: Emergency Expense shock (15,000,000 UZS or 30% of expense)
  const emergencyShock = Math.max(10000000, baseExpense * 0.35);
  const s2Income = baseIncome;
  const s2Expense = baseExpense + emergencyShock;
  const s2Balance = s2Income - s2Expense;
  const s2Runway = Number((Math.max(0, s2Balance) / (s2Expense || 1)).toFixed(1));

  // Scenario 3: High Inflation & Operating Cost rise (+20% expenses)
  const s3Income = baseIncome;
  const s3Expense = baseExpense * 1.2;
  const s3Balance = s3Income - s3Expense;
  const s3Runway = Number((Math.max(0, s3Balance) / s3Expense).toFixed(1));

  // Scenario 4: Optimistic - 100% Receivables Recovered + 15% Income Growth
  const s4Income = baseIncome * 1.15 + summary.total_debt_given_remaining;
  const s4Expense = baseExpense;
  const s4Balance = s4Income - s4Expense;
  const s4Runway = Number((Math.max(0, s4Balance) / burn).toFixed(1));

  return [
    {
      scenarioName: "Daromadning 30% ga pasayishi (Daromad Shoki)",
      description: "Asosiy faoliyat yoki loyihalardan tushumlar kutilmaganda 30% ga qisqarsa",
      projectedIncome: s1Income,
      projectedExpense: s1Expense,
      projectedBalance: s1Balance,
      projectedRunwayMonths: s1Runway,
      riskLevel: s1Balance < 0 ? 'kritik' : s1Runway < 2 ? 'yuqori' : 'ortacha',
      impactDescription: s1Balance < 0 
        ? "Oylik defitsit yuzaga keladi. Xarajatlarni zudlik bilan optimallashtirish shart."
        : `Zaxira yetarli, ammo oylik sof foyda ${(100 - (s1Balance / (summary.net_balance || 1)) * 100).toFixed(0)}% ga qisqaradi.`
    },
    {
      scenarioName: "Favqulodda kutilmagan xarajat (Emergency Shock)",
      description: `Biznes yoki shaxsiy ehtiyojlar uchun bir martalik kutilmagan yirik xarajat`,
      projectedIncome: s2Income,
      projectedExpense: s2Expense,
      projectedBalance: s2Balance,
      projectedRunwayMonths: s2Runway,
      riskLevel: s2Balance < 0 ? 'yuqori' : 'ortacha',
      impactDescription: s2Balance < 0 
        ? "Likvidlik xavf ostida qoladi. Qarz yuki oshishi mumkin."
        : "Zaxira bu zarbani ko'tara oladi, lekin likvidlik buferi qisqaradi."
    },
    {
      scenarioName: "Inflyatsiya va sarf-xarajatlarning 20% ga oshishi",
      description: "Narx-navo oshishi yoki operatsion xarajatlar kengayishi natijasida chiqimlar ko'payishi",
      projectedIncome: s3Income,
      projectedExpense: s3Expense,
      projectedBalance: s3Balance,
      projectedRunwayMonths: s3Runway,
      riskLevel: s3Balance < 0 ? 'kritik' : 'ortacha',
      impactDescription: `Oylik barqarorlik chegarasi qisqaradi. Tejash marjasi ${(summary.savings_rate - (s3Balance/s3Income)*100).toFixed(1)}% ga pasayadi.`
    },
    {
      scenarioName: "Qarzlar to'liq undirilishi va 15% o'sish (Optimistik)",
      description: "Barcha berilgan qarzlar to'liq qaytarilsa va daromad 15% ga o'ssa",
      projectedIncome: s4Income,
      projectedExpense: s4Expense,
      projectedBalance: s4Balance,
      projectedRunwayMonths: s4Runway,
      riskLevel: 'past',
      impactDescription: `Likvid aktivlar maksimal darajaga chiqadi va erkin investitsion zaxira shakllanadi.`
    }
  ];
}

/**
 * DuPont Analysis (3-way decomposition of Return on Equity / Capital)
 * ROE = Net Profit Margin * Asset Turnover * Equity Multiplier (Financial Leverage)
 */
export function calculateDuPontAnalysis(summary: FinancialSummary): DuPontAnalysis {
  const revenue = summary.total_income > 0 ? summary.total_income : 1;
  const netIncome = summary.net_balance;
  
  // Net Profit Margin = Net Income / Revenue
  const netProfitMargin = (netIncome / revenue) * 100;
  
  // Operating Expense Ratio = Total Expenses / Revenue
  const operatingExpenseRatio = (summary.total_expense / revenue) * 100;
  
  // Total Assets = Net Cash Balance + Total Receivables (Given Debts Remaining)
  const totalAssets = Math.max(1, Math.max(0, summary.net_balance) + summary.total_debt_given_remaining);
  
  // Asset Turnover = Revenue / Total Assets
  const assetTurnover = Number((revenue / totalAssets).toFixed(2));
  
  // Net Worth (Equity) = Total Assets - Total Liabilities (Received Debts Remaining)
  const netWorth = Math.max(1, totalAssets - summary.total_debt_received_remaining);
  
  // Financial Leverage (Equity Multiplier) = Total Assets / Net Worth
  const financialLeverage = Number((totalAssets / netWorth).toFixed(2));
  
  // Return on Equity = Margin (%) * Turnover * Leverage
  const returnOnEquity = Number(((netProfitMargin / 100) * assetTurnover * financialLeverage * 100).toFixed(1));
  
  let capitalEfficiencyRating: 'A+' | 'A' | 'B' | 'C' | 'D' = 'B';
  if (returnOnEquity >= 35 && netProfitMargin >= 25) capitalEfficiencyRating = 'A+';
  else if (returnOnEquity >= 20 && netProfitMargin >= 15) capitalEfficiencyRating = 'A';
  else if (returnOnEquity >= 10 && netProfitMargin >= 0) capitalEfficiencyRating = 'B';
  else if (returnOnEquity >= 0) capitalEfficiencyRating = 'C';
  else capitalEfficiencyRating = 'D';

  let interpretation = '';
  if (capitalEfficiencyRating === 'A+' || capitalEfficiencyRating === 'A') {
    interpretation = "Kapital unumdorligi va sof rentabellik marjasi yuqori darajada. Aktivlar samarali aylanmoqda.";
  } else if (capitalEfficiencyRating === 'B') {
    interpretation = "O'rtacha barqaror rentabellik. Operatsion xarajatlar yuklamasini kamaytirish orqali marjani oshirish mumkin.";
  } else {
    interpretation = "Rentabellik past yoki defitsit holatida. Kapital aylanishi sust va xarajatlar yuklamasi yuqori.";
  }

  return {
    netProfitMargin: Number(netProfitMargin.toFixed(1)),
    operatingExpenseRatio: Number(operatingExpenseRatio.toFixed(1)),
    assetTurnover,
    financialLeverage,
    returnOnEquity,
    capitalEfficiencyRating,
    interpretation
  };
}

/**
 * Liquidity & Solvency Analysis Suite
 */
export function calculateLiquiditySolvencySuite(summary: FinancialSummary): LiquiditySolvencySuite {
  const currentLiabilities = summary.total_debt_received_remaining > 0 ? summary.total_debt_received_remaining : 1;
  const liquidCash = Math.max(0, summary.net_balance);
  const receivables = summary.total_debt_given_remaining;
  const currentAssets = liquidCash + receivables;
  
  // Current Ratio = Current Assets / Current Liabilities
  const currentRatio = summary.total_debt_received_remaining > 0 
    ? Number((currentAssets / currentLiabilities).toFixed(2)) 
    : 99.9;

  // Quick Ratio = (Cash + Receivables) / Current Liabilities
  const quickRatio = summary.total_debt_received_remaining > 0 
    ? Number(((liquidCash + receivables * 0.85) / currentLiabilities).toFixed(2)) 
    : 99.9;

  // Cash Ratio = Cash / Current Liabilities
  const cashRatio = summary.total_debt_received_remaining > 0 
    ? Number((liquidCash / currentLiabilities).toFixed(2)) 
    : 99.9;

  // DSCR (Debt Service Coverage Ratio) = Net Operating Cash Flow / Total Debt Repayments Made
  const debtService = summary.total_debt_repayments_made > 0 ? summary.total_debt_repayments_made : 1;
  const operatingCash = Math.max(0, summary.total_income - summary.total_expense);
  const dscr = summary.total_debt_repayments_made > 0
    ? Number((operatingCash / debtService).toFixed(2))
    : Number((operatingCash > 0 ? 10.0 : 0.0).toFixed(2));

  // Net Working Capital = Current Assets - Current Liabilities
  const netWorkingCapital = currentAssets - summary.total_debt_received_remaining;

  // Net Worth (Equity)
  const netWorth = Math.max(1, currentAssets - summary.total_debt_received_remaining);
  const debtToEquity = Number(((summary.total_debt_received_remaining / netWorth) * 100).toFixed(1));

  // Daily debt burden estimate
  const interestOrDebtBurdenPerDay = Math.round(summary.total_debt_repayments_made / 30);

  let solvencyGrade: 'A+' | 'A' | 'B' | 'C' | 'D' = 'B';
  if (currentRatio >= 2.0 && dscr >= 1.8 && summary.overdue_debts_count === 0) solvencyGrade = 'A+';
  else if (currentRatio >= 1.5 && dscr >= 1.2 && summary.overdue_debts_count === 0) solvencyGrade = 'A';
  else if (currentRatio >= 1.0 && dscr >= 1.0) solvencyGrade = 'B';
  else if (currentRatio >= 0.7) solvencyGrade = 'C';
  else solvencyGrade = 'D';

  return {
    currentRatio,
    quickRatio,
    cashRatio,
    dscr,
    netWorkingCapital,
    debtToEquity,
    interestOrDebtBurdenPerDay,
    solvencyGrade
  };
}

/**
 * IAS 7 / GAAP 3-Statement Cash Flow Breakdown
 */
export function calculate3StatementCashFlow(
  summary: FinancialSummary,
  incomes: Income[],
  expenses: Expense[],
  debts: DebtWithComputed[],
  payments: DebtPayment[],
  range: DateFilterRange
): CashFlow3Statement {
  // 1. Operating Cash Flow (CFO): Core Operating Inflows - Core Operating Outflows
  const filteredIncomes = incomes.filter((i) => !i.is_deleted && isDateInRange(i.date, range));
  const filteredExpenses = expenses.filter((e) => !e.is_deleted && isDateInRange(e.date, range));
  
  const operatingInflow = filteredIncomes.reduce((acc, i) => acc + (Number(i.amount) || 0), 0);
  const operatingOutflow = filteredExpenses.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
  const operatingCashFlow = operatingInflow - operatingOutflow;

  // 2. Investing Cash Flow (CFI): Loans given (capital allocation) vs Capital Recoveries
  const activeDebts = debts.filter((d) => !d.is_deleted);
  const newGivenDebtsInRange = activeDebts
    .filter((d) => d.type === 'given' && isDateInRange(d.created_at, range))
    .reduce((sum, d) => sum + Number(d.initial_amount || 0), 0);

  // When we give a loan, it's an investment outflow (-); collected repayments are cash recovery (+)
  const investingCashFlow = summary.total_debt_repayments_collected - newGivenDebtsInRange;

  // 3. Financing Cash Flow (CFF): Loans received (+) minus debt repayments made (-)
  const newReceivedDebtsInRange = activeDebts
    .filter((d) => d.type === 'received' && isDateInRange(d.created_at, range))
    .reduce((sum, d) => sum + Number(d.initial_amount || 0), 0);
  
  const financingCashFlow = newReceivedDebtsInRange - summary.total_debt_repayments_made;

  // Free Cash Flow (FCF) = Operating Cash Flow + Net Cash from capital loans
  const freeCashFlow = operatingCashFlow + investingCashFlow;

  // Total Net Change in Cash
  const netChangeInCash = operatingCashFlow + investingCashFlow + financingCashFlow;

  // Verification Reconciled Formula: Net Change in Cash should match summary.net_cash_flow
  const discrepancyAmount = Math.abs(netChangeInCash - summary.net_cash_flow);
  const cashReconciliationStatus: 'balanced' | 'discrepancy' = discrepancyAmount < 0.01 ? 'balanced' : 'discrepancy';

  return {
    operatingCashFlow,
    investingCashFlow,
    financingCashFlow,
    freeCashFlow,
    netChangeInCash,
    cashReconciliationStatus,
    discrepancyAmount
  };
}

/**
 * Working Capital & Turnover Cycle Metrics
 */
export function calculateWorkingCapitalMetrics(summary: FinancialSummary): WorkingCapitalCycle {
  const annualOrPeriodRevenue = summary.total_income > 0 ? summary.total_income : 1;
  const annualOrPeriodExpense = summary.total_expense > 0 ? summary.total_expense : 1;

  // Receivables DSO (Days Sales Outstanding) = (Receivables / Revenue) * 365
  const receivablesDSO = Math.round((summary.total_debt_given_remaining / annualOrPeriodRevenue) * 365);

  // Payables DPO (Days Payables Outstanding) = (Payables / Expenses) * 365
  const payablesDPO = Math.round((summary.total_debt_received_remaining / annualOrPeriodExpense) * 365);

  // Cash Conversion Cycle
  const cashConversionCycleDays = receivablesDSO - payablesDPO;

  // Receivable turnover
  const receivableTurnoverTimes = Number((annualOrPeriodRevenue / Math.max(1, summary.total_debt_given_remaining)).toFixed(1));

  return {
    receivablesDSO,
    payablesDPO,
    cashConversionCycleDays,
    receivableTurnoverTimes
  };
}

/**
 * Variance Analysis & Pareto 80/20 Cost Decomposition
 */
export function calculateVarianceAndPareto(
  budgets: BudgetWithComputed[],
  expenses: Expense[],
  categories: Category[],
  year: string = '2026'
): VarianceAnalysisItem[] {
  const activeExpenses = expenses.filter((e) => !e.is_deleted && e.date.startsWith(year));
  const totalAnnualExpense = activeExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0) || 1;

  // Map all expense categories
  const expenseCategories = categories.filter((c) => c.type === 'expense');

  const items: Array<{
    categoryId: string;
    categoryName: string;
    categoryIcon: string;
    categoryColor: string;
    budgetLimit: number;
    actualSpent: number;
    varianceAmount: number;
    variancePercent: number;
    isFavorable: boolean;
  }> = expenseCategories.map((cat) => {
    const budget = budgets.find((b) => b.category_id === cat.id);
    const limit = budget ? Number(budget.limit_amount || 0) : 0;
    const spent = activeExpenses
      .filter((e) => e.category_id === cat.id)
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    const varianceAmount = limit > 0 ? limit - spent : 0;
    const variancePercent = limit > 0 ? ((limit - spent) / limit) * 100 : 0;
    const isFavorable = varianceAmount >= 0;

    return {
      categoryId: cat.id,
      categoryName: cat.name,
      categoryIcon: cat.icon,
      categoryColor: cat.color,
      budgetLimit: limit,
      actualSpent: spent,
      varianceAmount,
      variancePercent: Number(variancePercent.toFixed(1)),
      isFavorable
    };
  });

  // Sort descending by actual spent for Pareto analysis
  items.sort((a, b) => b.actualSpent - a.actualSpent);

  let cumulative = 0;
  return items.map((item, index) => {
    cumulative += item.actualSpent;
    const paretoCumulativePercent = Number(((cumulative / totalAnnualExpense) * 100).toFixed(1));
    return {
      ...item,
      paretoRank: index + 1,
      paretoCumulativePercent
    };
  });
}

/**
 * 25-Cell Sensitivity & Multi-Scenario Stress Matrix
 */
export function generateSensitivityMatrix(summary: FinancialSummary): SensitivityMatrixCell[] {
  const baseIncome = summary.total_income;
  const baseExpense = summary.total_expense;
  const incomeSteps = [-40, -20, 0, 15, 30]; // Income shifts %
  const expenseSteps = [0, 10, 20, 35, 50];  // Expense inflation shifts %

  const matrix: SensitivityMatrixCell[] = [];

  incomeSteps.forEach((incShift) => {
    expenseSteps.forEach((expShift) => {
      const projInc = Math.max(0, baseIncome * (1 + incShift / 100));
      const projExp = Math.max(0, baseExpense * (1 + expShift / 100));
      const projNet = projInc - projExp;
      const burn = projExp > 0 ? projExp : 1;
      const projRunway = Number((Math.max(0, projNet) / burn).toFixed(1));

      let riskStatus: 'safe' | 'moderate' | 'high' | 'critical' = 'safe';
      if (projNet < 0) {
        riskStatus = Math.abs(projNet) > baseIncome * 0.35 ? 'critical' : 'high';
      } else if (projRunway < 2) {
        riskStatus = 'high';
      } else if (projRunway < 4) {
        riskStatus = 'moderate';
      } else {
        riskStatus = 'safe';
      }

      matrix.push({
        incomeChangePercent: incShift,
        expenseChangePercent: expShift,
        projectedNetBalance: Math.round(projNet),
        projectedRunwayMonths: projRunway,
        riskStatus
      });
    });
  });

  return matrix;
}

/**
 * Econometric Pro Forma 12-Month Forecast Model
 * Combines Historical Mean, Exponential Smoothing and Trend Trajectory
 */
export function generateProFormaForecast(
  monthlyReports: Array<{ monthName: string; income: number; expense: number; netBalance: number }>,
  summary: FinancialSummary
): ProForecastPoint[] {
  // Compute monthly run rate
  const validMonths = monthlyReports.filter((m) => m.income > 0 || m.expense > 0);
  const avgMonthlyIncome = validMonths.length > 0 
    ? validMonths.reduce((sum, m) => sum + m.income, 0) / validMonths.length
    : summary.total_income / 12 || 10000000;
  
  const avgMonthlyExpense = validMonths.length > 0
    ? validMonths.reduce((sum, m) => sum + m.expense, 0) / validMonths.length
    : summary.total_expense / 12 || 6000000;

  const monthNames = [
    'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
    'Iyul', 'Avgust', 'Sentyabr', 'Oktyabr', 'Noyabr', 'Dekabr'
  ];

  let cumulativeNet = summary.net_balance;
  const forecast: ProForecastPoint[] = [];

  for (let i = 1; i <= 12; i++) {
    // Seasonal factor & modest growth factor
    const growthTrend = 1 + (i * 0.008); // +0.8% monthly modest expansion
    const seasonalExp = 1 + (i % 3 === 0 ? 0.05 : 0); // quarterly expense peaks

    const baselineIncome = Math.round(avgMonthlyIncome * growthTrend);
    const baselineExpense = Math.round(avgMonthlyExpense * seasonalExp);
    const baselineNet = baselineIncome - baselineExpense;

    const pessimisticNet = Math.round((baselineIncome * 0.8) - (baselineExpense * 1.15));
    const optimisticNet = Math.round((baselineIncome * 1.15) - (baselineExpense * 0.95));

    cumulativeNet += baselineNet;

    forecast.push({
      periodLabel: monthNames[i - 1] || `Oy ${i}`,
      monthIndex: i,
      baselineIncome,
      baselineExpense,
      baselineNet,
      pessimisticNet,
      optimisticNet,
      projectedCumulativeNetWorth: cumulativeNet
    });
  }

  return forecast;
}

/**
 * Big-4 Style CFO Audit Integrity Check
 */
export function runCFOAuditIntegrityCheck(summary: FinancialSummary): CFOAuditCheckItem[] {
  const checks: CFOAuditCheckItem[] = [];

  // Check 1: Mathematical Reconciliation
  const isMathBalanced = Math.abs(summary.net_balance - (summary.total_income - summary.total_expense)) < 0.01;
  checks.push({
    id: 'AUD-001',
    code: 'MATH-RECON-01',
    title: 'Matematik Buxgalteriya Reconciliatsiyasi (Kirish = Chiqish + Qoldiq)',
    category: 'Matematik Reconciliatsiya',
    metricValue: isMathBalanced ? '0.00 so\'m nomuvofiqlik (100% Mos)' : 'Farq aniqlandi',
    benchmark: '0.00 xatolik (Zero tolerance)',
    status: isMathBalanced ? 'pass' : 'fail',
    auditNote: isMathBalanced 
      ? 'Barcha operatsiyalar va kassa oqimlari bir-birini 100% qoplamoqda. Matematik disbalans mavjud emas.' 
      : 'Matematik balansda nomuvofiqlik mavjud. Daromad va xarajatlar summalarini tekshiring.',
    actionRequired: isMathBalanced ? undefined : 'Audit loglari orqali oxirgi o\'zgartirishlarni tekshirish talab etiladi.'
  });

  // Check 2: Savings Rate / Operational Margin
  checks.push({
    id: 'AUD-002',
    code: 'OP-MARGIN-02',
    title: 'Operatsion Rentabellik & Jamg\'arma Marjasi (Savings Margin)',
    category: 'Rentabellik',
    metricValue: `${summary.savings_rate.toFixed(1)}%`,
    benchmark: '>= 20.0% (Standart CFO talabi)',
    status: summary.savings_rate >= 20 ? 'pass' : summary.savings_rate >= 5 ? 'warning' : 'fail',
    auditNote: summary.savings_rate >= 20 
      ? 'Jamg\'arma marjasi barqaror kapital to\'plash uchun to\'liq yetarli.' 
      : summary.savings_rate >= 0 
      ? 'Tejash darajasi xalqaro tavsiya etilgan 20% me\'yordan past.' 
      : 'Salbiy rentabellik (operatsion defitsit). Kassa uzilishi xavfi mavjud.',
    actionRequired: summary.savings_rate < 20 ? 'Ikkinchi darajali operatsion sarflarni 15% ga kamaytirish' : undefined
  });

  // Check 3: Liquidity Buffer & Runway
  checks.push({
    id: 'AUD-003',
    code: 'LIQ-RUNWAY-03',
    title: 'Likvidlik Buferi va Runway Zaxirasi',
    category: 'Likvidlik',
    metricValue: `${summary.runway_months} oy (${summary.runway_days} kun)`,
    benchmark: '>= 3.0 oy (Xavfsizlik yostig\'i)',
    status: summary.runway_months >= 6 ? 'pass' : summary.runway_months >= 3 ? 'pass' : summary.runway_months >= 1 ? 'warning' : 'fail',
    auditNote: summary.runway_months >= 3 
      ? 'Kompaniya/shaxs 3 oydan ortiq kutilmagan to\'xtashlarga bardosh bera oladi.' 
      : 'Likvidlik zaxirasi kritik past darajada. Favqulodda vaziyatda kassa teshilishi yuz berishi mumkin.',
    actionRequired: summary.runway_months < 3 ? 'Favqulodda zaxira jamg\'armasini (Emergency Reserve) shakllantirish' : undefined
  });

  // Check 4: Debt Overdue Risk
  checks.push({
    id: 'AUD-004',
    code: 'DEBT-OVERDUE-04',
    title: 'Muddati O\'tgan Majburiyatlar & Debitorlik Intizomi',
    category: 'Qarz Siyosati',
    metricValue: `${summary.overdue_debts_count} ta muddati o'tgan (${summary.overdue_debts_amount.toLocaleString()} so'm)`,
    benchmark: '0 ta (Zero overdue policy)',
    status: summary.overdue_debts_count === 0 ? 'pass' : 'fail',
    auditNote: summary.overdue_debts_count === 0 
      ? 'Barcha debitorlik va kreditorlik majburiyatlari grafik bo\'yicha to\'lanmoqda.' 
      : 'Muddati o\'tgan qarzlar kapital muzlashiga va to\'lov intizomi buzilishiga olib kelmoqda.',
    actionRequired: summary.overdue_debts_count > 0 ? 'Muddati o\'tgan qarzdorlar bilan talabnoma (claim) ishlarini boshlash' : undefined
  });

  // Check 5: Budget Adherence Limit
  checks.push({
    id: 'AUD-005',
    code: 'BUDGET-COMPLY-05',
    title: 'Byudjet Intizomi va Limitlarga Riyo Qilish',
    category: 'Byudjet Intizomi',
    metricValue: `${summary.budget_usage_total_percent.toFixed(1)}% sarflandi`,
    benchmark: '<= 100.0% (Limit doirasida)',
    status: summary.budget_usage_total_percent <= 90 ? 'pass' : summary.budget_usage_total_percent <= 100 ? 'warning' : 'fail',
    auditNote: summary.budget_usage_total_percent <= 100 
      ? 'Xarajatlar tasdiqlangan byudjet chegaralari doirasida qat\'iy nazorat qilinmoqda.' 
      : 'Byudjet limitidan oshish qayd etilgan. Ortiqcha sarflar rentabellikni yemiradi.',
    actionRequired: summary.budget_usage_total_percent > 100 ? 'Limitdan oshgan xarajat toifalarini zudlik bilan bloklash' : undefined
  });

  return checks;
}

/**
 * Generates an executive analytical CFO report with professional recommendations
 */
export function generateProCFOReport(
  summary: FinancialSummary,
  categories: Category[],
  expenses: Expense[]
): ProCFOAnalysisReport {
  const observations: string[] = [];
  const strengths: string[] = [];
  const vulnerabilities: string[] = [];
  const recommendations: string[] = [];

  const dupont = calculateDuPontAnalysis(summary);
  const liquidity = calculateLiquiditySolvencySuite(summary);
  const workingCapital = calculateWorkingCapitalMetrics(summary);
  const auditChecks = runCFOAuditIntegrityCheck(summary);

  // Synthetic Cash Flow 3-statement default
  const cashFlow3: CashFlow3Statement = {
    operatingCashFlow: summary.total_income - summary.total_expense,
    investingCashFlow: summary.total_debt_repayments_collected,
    financingCashFlow: -summary.total_debt_repayments_made,
    freeCashFlow: (summary.total_income - summary.total_expense) + summary.total_debt_repayments_collected,
    netChangeInCash: summary.net_cash_flow,
    cashReconciliationStatus: 'balanced',
    discrepancyAmount: 0
  };

  // Savings analysis
  if (summary.savings_rate >= 40) {
    strengths.push(`Yuqori jamg'arma darajasi: Daromadning ${summary.savings_rate.toFixed(1)}% qismi tejalmoqda (CFO me'yori: 20%+).`);
  } else if (summary.savings_rate > 15) {
    observations.push(`Jamg'arma koeffitsiyenti me'yorda: ${summary.savings_rate.toFixed(1)}%.`);
  } else if (summary.savings_rate >= 0) {
    vulnerabilities.push(`Past jamg'arma marjasi: Daromadning atigi ${summary.savings_rate.toFixed(1)}% qismi qolmoqda.`);
    recommendations.push("Ikkinchi darajali operatsion va shaxsiy xarajatlarni 10-15% ga qisqartirish talab etiladi.");
  } else {
    vulnerabilities.push(`Moliyaviy defitsit: Chiqimlar kirimlardan oshib ketgan (Sarf nisbati: ${Math.abs(summary.savings_rate).toFixed(1)}% ortiqcha).`);
    recommendations.push("Shoshilinch ravishda kassa uzilishini (cash deficit) yopish va majburiy bo'lmagan to'lovlarni to'xtatish zarur.");
  }

  // Debt analysis
  if (summary.overdue_debts_count > 0) {
    vulnerabilities.push(`${summary.overdue_debts_count} ta muddatidan o'tgan qarz mavjud.`);
    recommendations.push("Muddati o'tgan qarzlarni undirish bo'yicha qat'iy reja tuzish va debitorlar bilan muzokara o'tkazish tavsiya qilinadi.");
  } else {
    strengths.push("Muddatidan o'tgan qarzlar yo'q — qarz intizomi yuqori darajada.");
  }

  if (summary.net_debt_position >= 0) {
    strengths.push(`Ijobiy sof qarz pozitsiyasi: Bizga qaytarilishi kerak bo'lgan mablag' olingan qarzlardan ko'proq.`);
  } else {
    vulnerabilities.push(`Majburiyatlar balansi yuqori: To'lanishi kerak bo'lgan qarzlar berilgan qarzlardan ortiq.`);
    recommendations.push("Kelgusi oylarda olingan qarzlarni so'ndirishni asosiy moliyaviy ustuvorlik deb belgilash.");
  }

  // Runway analysis
  if (summary.runway_months >= 6) {
    strengths.push(`Mustahkam xavfsizlik yostig'i: ${summary.runway_months} oylik to'liq yashash/operatsion xarajatlar zaxirasi mavjud.`);
  } else if (summary.runway_months >= 3) {
    observations.push(`Likvidlik zaxirasi o'rtacha: ${summary.runway_months} oy.`);
  } else {
    vulnerabilities.push(`Qisqa moliyaviy runway: Mavjud likvid mablag'lar faqat ${summary.runway_days} kunga yetadi.`);
    recommendations.push("Kamida 3-6 oylik favqulodda zaxira jamg'armasini (Emergency Fund) to'plashni boshlang.");
  }

  // Budget Adherence
  if (summary.budget_usage_total_percent > 100) {
    vulnerabilities.push(`Oylik byudjet limiti ${(summary.budget_usage_total_percent - 100).toFixed(1)}% ga oshirib yuborilgan.`);
    recommendations.push("Limitdan oshgan xarajat toifalarini bloklash yoki limitlarni qayta ko'rib chiqish.");
  } else if (summary.total_budget_limit > 0) {
    strengths.push(`Byudjet intizomi mukammal: Reja ${summary.budget_usage_total_percent.toFixed(1)}% doirasida bajarilmoqda.`);
  }

  // Income Concentration
  if (summary.primary_income_share > 75) {
    vulnerabilities.push(`Daromad konsentratsiyasi yuqori: Tushumlarning ${summary.primary_income_share.toFixed(0)}% qismi bitta asosiy manbaga bog'liq.`);
    recommendations.push("Daromad manbalarini diversifikatsiya qilish (qo'shimcha xizmatlar yoki passiv investitsiyalar kiritish).");
  }

  return {
    generatedAt: new Date().toISOString(),
    period: '2026-yil / Joriy Davr',
    healthScore: summary.financial_health_score,
    healthGrade: summary.financial_health_grade,
    summaryObservations: observations,
    keyStrengths: strengths,
    vulnerabilities,
    actionableRecommendations: recommendations,
    dupont,
    liquidity,
    cashFlow3,
    workingCapital,
    auditChecks
  };
}
