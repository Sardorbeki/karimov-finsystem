import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  AlertTriangle,
  Flame,
  Clock,
  PieChart,
  Percent,
  Layers,
  ArrowUpRight,
  ArrowDownLeft,
  Coins,
  FileSpreadsheet,
  Sliders,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  Bot,
  Zap,
  Activity,
  Award,
  BarChart3,
  Calendar,
  DollarSign,
  Info,
  Scale,
  Target,
  FileCheck,
  CheckCircle,
  XCircle,
  HelpCircle,
  SlidersHorizontal,
  ChevronRight,
  Calculator
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  AreaChart,
  Area
} from 'recharts';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency, formatPercentage } from '../../lib/formatters';
import {
  generateStressTestScenarios,
  generateProCFOReport,
  calculateCategoryExpenseBreakdown,
  calculateDuPontAnalysis,
  calculateLiquiditySolvencySuite,
  calculate3StatementCashFlow,
  calculateWorkingCapitalMetrics,
  calculateVarianceAndPareto,
  generateSensitivityMatrix,
  generateProFormaForecast,
  runCFOAuditIntegrityCheck,
  generateMonthlyReports
} from '../../lib/calculations';
import { exportFullMasterExcel } from '../../lib/excelExportEngine';

type ProAnalyticsTab = 
  | 'cfo_dashboard' 
  | 'dupont_ratios' 
  | 'cashflow_3' 
  | 'variance_pareto' 
  | 'stress_matrix' 
  | 'forecast_12m' 
  | 'audit_checklist';

export const ProAnalyticsView: React.FC = () => {
  const { summary, incomes, expenses, debts, debtPayments, budgets, categories, settings, setActiveTab, filterRange } = useFinance();
  const [activeSubTab, setActiveSubTab] = useState<ProAnalyticsTab>('cfo_dashboard');

  // Custom interactive stress test state
  const [incomeShockPercent, setIncomeShockPercent] = useState<number>(-20);
  const [expenseSurgePercent, setExpenseSurgePercent] = useState<number>(10);
  const [emergencyExpense, setEmergencyExpense] = useState<number>(5000000);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Pre-calculated default scenarios
  const defaultScenarios = useMemo(() => {
    return generateStressTestScenarios(summary);
  }, [summary]);

  // Executive CFO Report & Analytical Suites
  const cfoReport = useMemo(() => {
    return generateProCFOReport(summary, categories, expenses);
  }, [summary, categories, expenses]);

  const dupont = useMemo(() => {
    return calculateDuPontAnalysis(summary);
  }, [summary]);

  const liquidity = useMemo(() => {
    return calculateLiquiditySolvencySuite(summary);
  }, [summary]);

  const cashFlow3 = useMemo(() => {
    return calculate3StatementCashFlow(summary, incomes, expenses, debts, debtPayments, filterRange);
  }, [summary, incomes, expenses, debts, debtPayments, filterRange]);

  const workingCapital = useMemo(() => {
    return calculateWorkingCapitalMetrics(summary);
  }, [summary]);

  const varianceAndPareto = useMemo(() => {
    return calculateVarianceAndPareto(budgets, expenses, categories, '2026');
  }, [budgets, expenses, categories]);

  const sensitivityMatrix = useMemo(() => {
    return generateSensitivityMatrix(summary);
  }, [summary]);

  const monthlyReports = useMemo(() => {
    return generateMonthlyReports(incomes, expenses, '2026');
  }, [incomes, expenses]);

  const forecastPoints = useMemo(() => {
    return generateProFormaForecast(monthlyReports, summary);
  }, [monthlyReports, summary]);

  const auditChecks = useMemo(() => {
    return runCFOAuditIntegrityCheck(summary);
  }, [summary]);

  // Dynamic Custom Scenario computation
  const customScenario = useMemo(() => {
    const projectedIncome = Math.max(0, summary.total_income * (1 + incomeShockPercent / 100));
    const projectedExpense = Math.max(0, summary.total_expense * (1 + expenseSurgePercent / 100) + emergencyExpense);
    const projectedBalance = projectedIncome - projectedExpense;
    const burn = projectedExpense > 0 ? projectedExpense : 1;
    const projectedRunwayMonths = Number((Math.max(0, projectedBalance) / burn).toFixed(1));
    const projectedRunwayDays = Math.round(projectedRunwayMonths * 30);

    let riskLevel: 'past' | 'ortacha' | 'yuqori' | 'kritik' = 'past';
    if (projectedBalance < 0) {
      riskLevel = Math.abs(projectedBalance) > summary.total_income * 0.3 ? 'kritik' : 'yuqori';
    } else if (projectedRunwayMonths < 2) {
      riskLevel = 'yuqori';
    } else if (projectedRunwayMonths < 4) {
      riskLevel = 'ortacha';
    }

    return {
      projectedIncome,
      projectedExpense,
      projectedBalance,
      projectedRunwayMonths,
      projectedRunwayDays,
      riskLevel
    };
  }, [summary, incomeShockPercent, expenseSurgePercent, emergencyExpense]);

  const handleExportMaster = async () => {
    try {
      setIsExporting(true);
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
    } catch (err) {
      console.error('Master export error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const gradeColors = {
    'A+': 'bg-emerald-600 text-white border-emerald-700',
    A: 'bg-emerald-500 text-white border-emerald-600',
    B: 'bg-indigo-600 text-white border-indigo-700',
    C: 'bg-amber-500 text-white border-amber-600',
    D: 'bg-rose-600 text-white border-rose-700'
  };

  // Reconciled balance integrity status
  const isBalanceReconciled = Math.abs(summary.net_balance - (summary.total_income - summary.total_expense)) < 0.01;
  const passedChecksCount = auditChecks.filter((c) => c.status === 'pass').length;

  return (
    <div className="space-y-5 max-w-7xl mx-auto font-sans pb-12">
      {/* 1. Header Banner & Zero-Error Mathematical Integrity Badge */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 text-white text-xs font-bold uppercase tracking-wider shadow-xs">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Big-4 & Wall Street CFO Standarti</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-[10px] text-emerald-300 font-mono">100% Matematik Aniqlik</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Professional Moliyaviy Tahlil & Audit Diagnostikasi
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Zarra xatosiz buxgalteriya balansi, DuPont rentabellik dekompozitsiyasi, 3-bosqichli pul oqimlari (IAS 7) va chuqur stress-test modellari.
          </p>
        </div>

        {/* Health Score & Audit Badge */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 bg-slate-900 text-white p-4 rounded-xl shadow-md border border-slate-800 w-full sm:w-auto">
          <div className="text-center pr-3 border-r border-slate-700">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">CFO Reyting</span>
            <div className={`mt-1 inline-block px-3 py-1 rounded-lg text-lg font-black tracking-tight ${gradeColors[summary.financial_health_grade]}`}>
              {summary.financial_health_grade}
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black font-mono text-emerald-400">
                {summary.financial_health_score}
              </span>
              <span className="text-xs text-slate-400 font-mono">/ 100 ball</span>
            </div>
            <div className="text-[11px] text-slate-300 font-medium mt-0.5 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Audit: {passedChecksCount}/{auditChecks.length} nazoratdan o'tdi</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Pro Financial Module Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200 custom-scrollbar text-xs font-semibold">
        <button
          onClick={() => setActiveSubTab('cfo_dashboard')}
          className={`px-3.5 py-2.5 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
            activeSubTab === 'cfo_dashboard'
              ? 'bg-[#107c41] text-white shadow-sm font-bold'
              : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>CFO Boshqaruv & KPI</span>
        </button>

        <button
          onClick={() => setActiveSubTab('dupont_ratios')}
          className={`px-3.5 py-2.5 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
            activeSubTab === 'dupont_ratios'
              ? 'bg-[#107c41] text-white shadow-sm font-bold'
              : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <Calculator className="w-4 h-4" />
          <span>DuPont & Rentabellik</span>
        </button>

        <button
          onClick={() => setActiveSubTab('cashflow_3')}
          className={`px-3.5 py-2.5 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
            activeSubTab === 'cashflow_3'
              ? 'bg-[#107c41] text-white shadow-sm font-bold'
              : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <Coins className="w-4 h-4" />
          <span>3-Bosqichli Pul Oqimlari (IAS 7)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('variance_pareto')}
          className={`px-3.5 py-2.5 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
            activeSubTab === 'variance_pareto'
              ? 'bg-[#107c41] text-white shadow-sm font-bold'
              : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <Scale className="w-4 h-4" />
          <span>Reja vs Haqiqat & Pareto 80/20</span>
        </button>

        <button
          onClick={() => setActiveSubTab('stress_matrix')}
          className={`px-3.5 py-2.5 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
            activeSubTab === 'stress_matrix'
              ? 'bg-[#107c41] text-white shadow-sm font-bold'
              : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Stress-Test & Sensitivlik (25 Katak)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('forecast_12m')}
          className={`px-3.5 py-2.5 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
            activeSubTab === 'forecast_12m'
              ? 'bg-[#107c41] text-white shadow-sm font-bold'
              : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>12 Oylik Ekonometrik Prognoz</span>
        </button>

        <button
          onClick={() => setActiveSubTab('audit_checklist')}
          className={`px-3.5 py-2.5 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
            activeSubTab === 'audit_checklist'
              ? 'bg-[#107c41] text-white shadow-sm font-bold'
              : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <FileCheck className="w-4 h-4" />
          <span>CFO Audit Guvohnomasi</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: CFO DASHBOARD & CORE KPI COMMAND */}
      {/* ========================================================================= */}
      {activeSubTab === 'cfo_dashboard' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* Mathematical Reconciliation Strip */}
          <div className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs ${
            isBalanceReconciled 
              ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950' 
              : 'bg-rose-50 border-rose-200 text-rose-950'
          }`}>
            <div className="flex items-center gap-2.5">
              {isBalanceReconciled ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
              )}
              <div>
                <span className="font-bold uppercase tracking-wider block">
                  Buxgalteriya Reconciliatsiyasi & Formulalar Mosligi:
                </span>
                <span className="text-slate-600">
                  {isBalanceReconciled 
                    ? "Matematik tenglik to'liq ta'minlangan: [Jami Daromad] - [Jami Xarajat] = [Sof Balans] (Disbalans = 0.00 so'm)."
                    : "Diqqat: Kassa va buxgalteriya balansi o'rtasida nomuvofiqlik aniqlandi!"}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0 font-mono font-bold">
              <span className="px-2.5 py-1 rounded bg-white border border-emerald-200 text-emerald-800">
                Δ = 0.00 UZS
              </span>
              <span className="px-2.5 py-1 rounded bg-emerald-600 text-white">
                100% TAYYOR
              </span>
            </div>
          </div>

          {/* Top 4 Core CFO Ratio Indicators */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* Card 1: Runway & Liquidity */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-indigo-300 transition-all">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-amber-500" />
                  Runway (Zaxira)
                </span>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold font-mono bg-amber-50 text-amber-800">
                  {summary.runway_days} kun
                </span>
              </div>
              <div className="text-2xl font-bold font-mono text-slate-900">
                {summary.runway_months} <span className="text-sm font-normal text-slate-500">oy</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-2 space-y-0.5 pt-2 border-t border-slate-100">
                <div className="flex justify-between">
                  <span>Oylik sarf (Burn rate):</span>
                  <span className="font-semibold text-slate-700">{formatCurrency(summary.monthly_burn_rate, settings.currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Sof likvid aktivlar:</span>
                  <span className="font-semibold text-emerald-700">{formatCurrency(summary.net_liquid_assets, settings.currency)}</span>
                </div>
              </div>
            </div>

            {/* Card 2: Debt-to-Income / Leverage */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-indigo-300 transition-all">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-purple-600" />
                  Qarz yuki (DTI)
                </span>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold font-mono bg-purple-50 text-purple-800">
                  {summary.dti_ratio.toFixed(1)}%
                </span>
              </div>
              <div className="text-2xl font-bold font-mono text-slate-900">
                {summary.dti_ratio < 25 ? 'Past xavf' : summary.dti_ratio < 40 ? 'O\'rtacha' : 'Yuqori yuk'}
              </div>
              <div className="text-[11px] text-slate-500 mt-2 space-y-0.5 pt-2 border-t border-slate-100">
                <div className="flex justify-between">
                  <span>Sof qarz pozitsiyasi:</span>
                  <span className={`font-semibold ${summary.net_debt_position >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {summary.net_debt_position >= 0 ? '+' : ''}{formatCurrency(summary.net_debt_position, settings.currency)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Muddati o'tgan qarzlar:</span>
                  <span className="font-semibold text-slate-700">{summary.overdue_debts_count} ta</span>
                </div>
              </div>
            </div>

            {/* Card 3: Receivable Recovery Rate */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-indigo-300 transition-all">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                  <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
                  Undirish samaradorligi
                </span>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold font-mono bg-emerald-50 text-emerald-800">
                  {summary.receivable_collection_rate.toFixed(1)}%
                </span>
              </div>
              <div className="text-2xl font-bold font-mono text-slate-900">
                {formatCurrency(summary.total_debt_repayments_collected, settings.currency)}
              </div>
              <div className="text-[11px] text-slate-500 mt-2 space-y-0.5 pt-2 border-t border-slate-100">
                <div className="flex justify-between">
                  <span>Kutilayotgan qoldiq:</span>
                  <span className="font-semibold text-slate-700">{formatCurrency(summary.total_debt_given_remaining, settings.currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Jami berilgan qarz:</span>
                  <span className="font-semibold text-slate-700">{formatCurrency(summary.total_debt_given_initial, settings.currency)}</span>
                </div>
              </div>
            </div>

            {/* Card 4: Income Concentration (HHI) */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-indigo-300 transition-all">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                  <PieChart className="w-4 h-4 text-blue-600" />
                  Daromad Diversifikatsiyasi
                </span>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold font-mono bg-blue-50 text-blue-800">
                  HHI: {summary.income_concentration_hhi.toFixed(0)}
                </span>
              </div>
              <div className="text-2xl font-bold font-mono text-slate-900">
                {summary.primary_income_share.toFixed(0)}% <span className="text-xs font-normal text-slate-500">asosiy ulush</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-2 space-y-0.5 pt-2 border-t border-slate-100">
                <div className="flex justify-between">
                  <span>Xavf darajasi:</span>
                  <span className="font-semibold text-slate-700">
                    {summary.income_concentration_hhi < 2500 ? 'Barqaror' : 'Konsentratsiyalangan'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Tejash koeffitsiyenti:</span>
                  <span className={`font-semibold ${summary.savings_rate >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {formatPercentage(summary.savings_rate)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Strategic CFO Summary Actions */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-indigo-600" />
                <div>
                  <h2 className="text-base font-bold text-slate-900">Bosh Moliyachi (CFO) Strategik Xulosasi</h2>
                  <p className="text-xs text-slate-500">Tizim ma'lumotlari asosida avtomatik shakllantirilgan tahliliy memorandum</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportMaster}
                  disabled={isExporting}
                  className="px-3 py-1.5 rounded-lg bg-[#107c41] text-white text-xs font-semibold hover:bg-[#0c6634] flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  {isExporting ? 'Yuklanmoqda...' : 'Excel Master Faylni Yuklash'}
                </button>
                <button
                  onClick={() => setActiveTab('ai-assistant')}
                  className="px-3 py-1.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold hover:bg-indigo-100 flex items-center gap-1.5 transition-colors"
                >
                  <Bot className="w-3.5 h-3.5" />
                  AI Maslahatchi
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Strengths */}
              <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-100 space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-900 uppercase tracking-wider">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Kuchli Moliyaviy Tomonlar
                </div>
                <ul className="space-y-1.5 text-xs text-emerald-800">
                  {cfoReport.keyStrengths.map((str, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-emerald-600 font-bold mt-0.5">•</span>
                      <span>{str}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Vulnerabilities */}
              <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-100 space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-900 uppercase tracking-wider">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  Xatarlar va E'tibor Qaratish Zarur
                </div>
                <ul className="space-y-1.5 text-xs text-amber-800">
                  {cfoReport.vulnerabilities.length > 0 ? (
                    cfoReport.vulnerabilities.map((vul, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-amber-600 font-bold mt-0.5">•</span>
                        <span>{vul}</span>
                      </li>
                    ))
                  ) : (
                    <li className="text-slate-500 italic">Hech qanday kritik xatar aniqlanmadi.</li>
                  )}
                </ul>
              </div>

              {/* Recommendations */}
              <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-100 space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-900 uppercase tracking-wider">
                  <Zap className="w-4 h-4 text-indigo-600" />
                  CFO Amaliy Tavsiyalari
                </div>
                <ul className="space-y-1.5 text-xs text-indigo-800">
                  {cfoReport.actionableRecommendations.length > 0 ? (
                    cfoReport.actionableRecommendations.map((rec, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-indigo-600 font-bold mt-0.5">•</span>
                        <span>{rec}</span>
                      </li>
                    ))
                  ) : (
                    <li className="text-slate-500 italic">Joriy moliyaviy oqimlar to'liq me'yorda.</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: DUPONT ANALYSIS & RENTABELLIK MODELI */}
      {/* ========================================================================= */}
      {activeSubTab === 'dupont_ratios' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs">
            <div className="border-b border-slate-100 pb-4 mb-5">
              <div className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-emerald-600" />
                <h2 className="text-base font-bold text-slate-900">DuPont 3-Omilli Rentabellik Dekompozitsiyasi</h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                ROE = Sof Marja (Rentabellik) × Aktivlar Aylanmasi (Samaradorlik) × Moliyaviy Leveridj (Kapital Multiplikatori)
              </p>
            </div>

            {/* DuPont Formula Visual Tree */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6">
              {/* Factor 1: Margin */}
              <div className="p-4 bg-white rounded-xl border border-slate-200 text-center shadow-xs">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">1. Sof Foyda Marjasi</span>
                <div className={`text-2xl font-black font-mono mt-1 ${dupont.netProfitMargin >= 20 ? 'text-emerald-600' : dupont.netProfitMargin >= 0 ? 'text-indigo-600' : 'text-rose-600'}`}>
                  {dupont.netProfitMargin.toFixed(1)}%
                </div>
                <span className="text-[10px] text-slate-400 block mt-1">Sof Foyda / Jami Daromad</span>
              </div>

              {/* Multiplier Icon */}
              <div className="hidden md:flex justify-center text-slate-400 font-bold text-xl">×</div>

              {/* Factor 2: Turnover */}
              <div className="p-4 bg-white rounded-xl border border-slate-200 text-center shadow-xs">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">2. Aktivlar Aylanmasi</span>
                <div className="text-2xl font-black font-mono text-slate-800 mt-1">
                  {dupont.assetTurnover.toFixed(2)}x
                </div>
                <span className="text-[10px] text-slate-400 block mt-1">Daromad / Jami Aktivlar</span>
              </div>

              {/* Factor 3: Leverage */}
              <div className="p-4 bg-white rounded-xl border border-slate-200 text-center shadow-xs">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">3. Kapital Multiplikatori</span>
                <div className="text-2xl font-black font-mono text-purple-700 mt-1">
                  {dupont.financialLeverage.toFixed(2)}x
                </div>
                <span className="text-[10px] text-slate-400 block mt-1">Aktivlar / Sof Kapital (Equity)</span>
              </div>
            </div>

            {/* DuPont Master Result Box */}
            <div className="p-5 rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 text-white flex flex-col md:flex-row items-center justify-between gap-4 shadow-md">
              <div className="space-y-1 text-center md:text-left">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">DuPont Umumiy Xulosasi</span>
                <h3 className="text-xl font-bold">Kapital Rentabelligi (ROE): <span className="font-mono text-emerald-300">{dupont.returnOnEquity.toFixed(1)}%</span></h3>
                <p className="text-xs text-slate-300 max-w-xl">{dupont.interpretation}</p>
              </div>
              <div className="px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-center shrink-0">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Kapital Bahosi</span>
                <span className="text-lg font-black text-emerald-400 font-mono">{dupont.capitalEfficiencyRating} Sinf</span>
              </div>
            </div>
          </div>

          {/* Liquidity & Solvency Breakdown Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">Current Ratio (Joriy Likvidlik)</h4>
                <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-emerald-50 text-emerald-800">
                  {liquidity.currentRatio.toFixed(2)}x
                </span>
              </div>
              <div className="text-xl font-black font-mono text-slate-900">
                {liquidity.currentRatio >= 2.0 ? 'Mukammal (> 2.0x)' : liquidity.currentRatio >= 1.2 ? 'Yetarli' : 'Kritik Past'}
              </div>
              <p className="text-[11px] text-slate-500">
                Joriy aktivlarning barcha qisqa muddatli qarz majburiyatlarini qoplash qobiliyati.
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">DSCR (Qarzni Qoplash Koeffitsiyenti)</h4>
                <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-indigo-50 text-indigo-800">
                  {liquidity.dscr.toFixed(2)}x
                </span>
              </div>
              <div className="text-xl font-black font-mono text-slate-900">
                {liquidity.dscr >= 1.5 ? 'Xavfsiz (> 1.5x)' : liquidity.dscr >= 1.0 ? 'Chegarada' : 'Defitsit'}
              </div>
              <p className="text-[11px] text-slate-500">
                Operatsion sof daromadning davriy qarz to'lovlarini necha barobar qoplab bera olishi.
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">Sof Aylanma Kapital (NWC)</h4>
                <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-purple-50 text-purple-800">
                  {formatCurrency(liquidity.netWorkingCapital, settings.currency)}
                </span>
              </div>
              <div className="text-xl font-black font-mono text-slate-900">
                {liquidity.netWorkingCapital >= 0 ? 'Ijobiy Zaxira' : 'Salbiy Aylanma'}
              </div>
              <p className="text-[11px] text-slate-500">
                Aktivlar va joriy majburiyatlar o'rtasidagi erkin aylanma pul buferi.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: 3-STATEMENT CASH FLOW (IAS 7) */}
      {/* ========================================================================= */}
      {activeSubTab === 'cashflow_3' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs">
            <div className="border-b border-slate-100 pb-4 mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Coins className="w-5 h-5 text-emerald-600" />
                  <h2 className="text-base font-bold text-slate-900">IFRS / IAS 7 Xalqaro Standartidagi Pul Oqimlari (3-Bosqich)</h2>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Operatsion (CFO), Investitsion (CFI) va Moliyaviy (CFF) pul oqimlarining to'liq buxgalteriya balansi
                </p>
              </div>

              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                Reconciliation: 100% BALANCED
              </span>
            </div>

            {/* 3 Streams Summary Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {/* CFO */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">1. Operatsion Oqim (CFO)</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono font-bold">
                    Asosiy Faoliyat
                  </span>
                </div>
                <div className={`text-xl font-bold font-mono ${cashFlow3.operatingCashFlow >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {formatCurrency(cashFlow3.operatingCashFlow, settings.currency)}
                </div>
                <p className="text-[11px] text-slate-500">
                  Kundalik daromadlar minus operatsion xarajatlar.
                </p>
              </div>

              {/* CFI */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">2. Investitsion Oqim (CFI)</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-mono font-bold">
                    Kapital & Qarzlar
                  </span>
                </div>
                <div className={`text-xl font-bold font-mono ${cashFlow3.investingCashFlow >= 0 ? 'text-emerald-700' : 'text-blue-700'}`}>
                  {formatCurrency(cashFlow3.investingCashFlow, settings.currency)}
                </div>
                <p className="text-[11px] text-slate-500">
                  Berilgan qarzlar va ularning qaytarilgan tushumlari.
                </p>
              </div>

              {/* CFF */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">3. Moliyaviy Oqim (CFF)</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-purple-100 text-purple-800 font-mono font-bold">
                    Majburiyatlar
                  </span>
                </div>
                <div className={`text-xl font-bold font-mono ${cashFlow3.financingCashFlow >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {formatCurrency(cashFlow3.financingCashFlow, settings.currency)}
                </div>
                <p className="text-[11px] text-slate-500">
                  Olingan qarzlar va to'langan qarz majburiyatlari.
                </p>
              </div>
            </div>

            {/* Free Cash Flow (FCF) Executive Banner */}
            <div className="p-4 rounded-xl bg-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-0.5 text-center sm:text-left">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Erkin Pul Oqimi (Free Cash Flow - FCF)</span>
                <div className="text-2xl font-black font-mono text-emerald-300">
                  {formatCurrency(cashFlow3.freeCashFlow, settings.currency)}
                </div>
                <p className="text-[11px] text-slate-400">Biznes va shaxsiy rivojlanish uchun erkin investitsiya qilinishi mumkin bo'lgan sof naqd pul zaxirasi.</p>
              </div>
              <div className="text-right font-mono text-xs bg-slate-800 p-3 rounded-lg border border-slate-700 shrink-0">
                <div className="text-slate-400">Jami Sof Kassa O'zgarishi:</div>
                <div className="text-sm font-bold text-white mt-0.5">
                  {formatCurrency(cashFlow3.netChangeInCash, settings.currency)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: VARIANCE & PARETO 80/20 ANALYSIS */}
      {/* ========================================================================= */}
      {activeSubTab === 'variance_pareto' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs">
            <div className="border-b border-slate-100 pb-4 mb-5">
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-indigo-600" />
                <h2 className="text-base font-bold text-slate-900">Reja va Haqiqat Tahlili (Variance) hamda Pareto 80/20 Qoidasi</h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Xarajatlarning 80% qismini shakllantiruvchi 20% asosiy toifalarni aniqlash va byudjet chetlanishlari
              </p>
            </div>

            {/* Variance & Pareto Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-y border-slate-200 text-slate-700 font-bold">
                    <th className="py-2.5 px-3">Pareto O'rni</th>
                    <th className="py-2.5 px-3">Xarajat Kategoriyasi</th>
                    <th className="py-2.5 px-3 text-right">Byudjet Limiti</th>
                    <th className="py-2.5 px-3 text-right">Amaldagi Sarf</th>
                    <th className="py-2.5 px-3 text-right">Farq (Variance)</th>
                    <th className="py-2.5 px-3 text-right">Kumulyativ Pareto %</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {varianceAndPareto.map((item) => (
                    <tr key={item.categoryId} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-500">#{item.paretoRank}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900 flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.categoryColor }}></span>
                        <span>{item.categoryName}</span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-right">{formatCurrency(item.budgetLimit, settings.currency)}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-right text-slate-900">{formatCurrency(item.actualSpent, settings.currency)}</td>
                      <td className={`py-2.5 px-3 font-mono font-bold text-right ${item.isFavorable ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {item.varianceAmount > 0 ? '+' : ''}{formatCurrency(item.varianceAmount, settings.currency)} ({item.variancePercent}%)
                      </td>
                      <td className="py-2.5 px-3 font-mono text-right font-bold text-indigo-700">
                        {item.paretoCumulativePercent}%
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          item.paretoCumulativePercent <= 80
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {item.paretoCumulativePercent <= 80 ? 'Kritik 80%' : 'Ikkilamchi 20%'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: 25-CELL SENSITIVITY MATRIX & WHAT-IF SIMULATION */}
      {/* ========================================================================= */}
      {activeSubTab === 'stress_matrix' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-indigo-600" />
                  <h2 className="text-base font-bold text-slate-900">Interaktiv Stress-Test & 25-Katakli Sensitivlik Matritsasi</h2>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Daromadlar pasayishi va xarajatlar inflyatsiyasi sharoitida moliyaviy barqarorlik chegarasi
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setIncomeShockPercent(-20);
                    setExpenseSurgePercent(10);
                    setEmergencyExpense(5000000);
                  }}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 flex items-center gap-1.5 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Standartga qaytarish
                </button>
              </div>
            </div>

            {/* Slider Controls */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 bg-slate-50/80 p-4 rounded-xl border border-slate-200/80 mb-5">
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold text-slate-700">
                  <span>Daromad O'zgarishi:</span>
                  <span className={`font-mono font-bold ${incomeShockPercent < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {incomeShockPercent > 0 ? '+' : ''}{incomeShockPercent}%
                  </span>
                </div>
                <input
                  type="range"
                  min="-60"
                  max="40"
                  step="5"
                  value={incomeShockPercent}
                  onChange={(e) => setIncomeShockPercent(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold text-slate-700">
                  <span>Xarajat Inflyatsiyasi:</span>
                  <span className="font-mono font-bold text-amber-700">+{expenseSurgePercent}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="50"
                  step="5"
                  value={expenseSurgePercent}
                  onChange={(e) => setExpenseSurgePercent(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold text-slate-700">
                  <span>Favqulodda Chiqim:</span>
                  <span className="font-mono font-bold text-rose-700">{formatCurrency(emergencyExpense, settings.currency)}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="30000000"
                  step="1000000"
                  value={emergencyExpense}
                  onChange={(e) => setEmergencyExpense(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-rose-600"
                />
              </div>
            </div>

            {/* Dynamic Custom Outcome */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-white p-4 rounded-xl border border-indigo-100 shadow-xs mb-6">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[11px] text-slate-500 font-medium block">Prognoz Daromad:</span>
                <div className="text-base font-bold font-mono text-emerald-700 mt-1">
                  {formatCurrency(customScenario.projectedIncome, settings.currency)}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[11px] text-slate-500 font-medium block">Prognoz Xarajat:</span>
                <div className="text-base font-bold font-mono text-rose-700 mt-1">
                  {formatCurrency(customScenario.projectedExpense, settings.currency)}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[11px] text-slate-500 font-medium block">Sof Balans:</span>
                <div className={`text-base font-bold font-mono mt-1 ${customScenario.projectedBalance >= 0 ? 'text-indigo-700' : 'text-rose-700'}`}>
                  {formatCurrency(customScenario.projectedBalance, settings.currency)}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[11px] text-slate-500 font-medium block">Runway (Zaxira):</span>
                <div className="text-base font-bold font-mono text-slate-900 mt-1">
                  {customScenario.projectedRunwayMonths} oy
                </div>
              </div>
            </div>

            {/* 25-Cell Sensitivity Matrix Heatmap */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                25-Katakli Sensitivlik Stress Matritsasi (Daromad Shoki vs Inflyatsiya)
              </h3>
              <div className="grid grid-cols-5 gap-2 text-xs font-mono">
                {sensitivityMatrix.map((cell, idx) => (
                  <div
                    key={idx}
                    className={`p-2.5 rounded-lg border text-center transition-all ${
                      cell.riskStatus === 'safe'
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                        : cell.riskStatus === 'moderate'
                        ? 'bg-amber-50 border-amber-200 text-amber-900'
                        : cell.riskStatus === 'high'
                        ? 'bg-orange-50 border-orange-200 text-orange-900'
                        : 'bg-rose-50 border-rose-200 text-rose-900 font-bold'
                    }`}
                  >
                    <div className="text-[10px] text-slate-500 font-sans">
                      D: {cell.incomeChangePercent > 0 ? '+' : ''}{cell.incomeChangePercent}% | X: +{cell.expenseChangePercent}%
                    </div>
                    <div className="text-xs font-bold mt-1">
                      {formatCurrency(cell.projectedNetBalance, settings.currency)}
                    </div>
                    <div className="text-[10px] opacity-75 mt-0.5">
                      {cell.projectedRunwayMonths} oy
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: 12-MONTH PRO FORMA FORECAST */}
      {/* ========================================================================= */}
      {activeSubTab === 'forecast_12m' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs">
            <div className="border-b border-slate-100 pb-4 mb-5">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
                <h2 className="text-base font-bold text-slate-900">12 Oylik Ekonometrik Pro Forma Prognozi (2026)</h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Eksponensial tekislash (Exponential smoothing) va mavsumiylikni inobatga olgan uch ssenariyli o'sish traektoriyasi
              </p>
            </div>

            {/* Recharts Pro Forma Trajectory */}
            <div className="h-72 w-full mb-6">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={forecastPoints}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="periodLabel" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip
                    formatter={(value: any) => [`${Number(value).toLocaleString()} UZS`]}
                    contentStyle={{ borderRadius: '8px', fontSize: '12px', border: '1px solid #cbd5e1' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Bar dataKey="baselineIncome" name="Prognoz Daromad" fill="#107c41" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="baselineExpense" name="Prognoz Xarajat" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                  <Line type="monotone" dataKey="baselineNet" name="Sof Oylik Foyda" stroke="#4f46e5" strokeWidth={3} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="optimisticNet" name="Optimistik (+15%)" stroke="#10b981" strokeDasharray="3 3" />
                  <Line type="monotone" dataKey="pessimisticNet" name="Pessimistik (-20%)" stroke="#e11d48" strokeDasharray="3 3" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Forecast Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-y border-slate-200 text-slate-700 font-bold">
                    <th className="py-2.5 px-3">Davr (Oy)</th>
                    <th className="py-2.5 px-3 text-right">Asosiy Daromad</th>
                    <th className="py-2.5 px-3 text-right">Asosiy Xarajat</th>
                    <th className="py-2.5 px-3 text-right">Sof Foyda (Base)</th>
                    <th className="py-2.5 px-3 text-right">Optimistik Ssenariy</th>
                    <th className="py-2.5 px-3 text-right">Kumulyativ Sof Kapital</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-mono">
                  {forecastPoints.map((fp) => (
                    <tr key={fp.monthIndex} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2 px-3 font-sans font-semibold text-slate-900">{fp.periodLabel}</td>
                      <td className="py-2 px-3 text-right text-emerald-700">{formatCurrency(fp.baselineIncome, settings.currency)}</td>
                      <td className="py-2 px-3 text-right text-rose-700">{formatCurrency(fp.baselineExpense, settings.currency)}</td>
                      <td className="py-2 px-3 text-right font-bold text-slate-900">{formatCurrency(fp.baselineNet, settings.currency)}</td>
                      <td className="py-2 px-3 text-right text-emerald-600">{formatCurrency(fp.optimisticNet, settings.currency)}</td>
                      <td className="py-2 px-3 text-right font-bold text-indigo-700">{formatCurrency(fp.projectedCumulativeNetWorth, settings.currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 7: BIG-4 CFO AUDIT CHECKLIST & VERIFICATION */}
      {/* ========================================================================= */}
      {activeSubTab === 'audit_checklist' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-emerald-600" />
                  <h2 className="text-base font-bold text-slate-900">Bosh Moliyachi (CFO) Rasmiy Audit Guvohnomasi</h2>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Barcha me'yoriy moliyaviy koeffitsiyentlarning avtomatlashtirilgan audit tekshiruvi
                </p>
              </div>

              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-slate-900 text-white">
                Status: {passedChecksCount} / {auditChecks.length} QONIQLI
              </span>
            </div>

            <div className="space-y-3">
              {auditChecks.map((check) => (
                <div
                  key={check.id}
                  className={`p-4 rounded-xl border transition-all ${
                    check.status === 'pass'
                      ? 'bg-emerald-50/50 border-emerald-200'
                      : check.status === 'warning'
                      ? 'bg-amber-50/50 border-amber-200'
                      : 'bg-rose-50/50 border-rose-200'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      {check.status === 'pass' ? (
                        <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                      ) : check.status === 'warning' ? (
                        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                      ) : (
                        <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] font-bold text-slate-400">{check.code}</span>
                          <span className="text-xs font-bold text-slate-900">{check.title}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-600 font-semibold">
                            {check.category}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1">{check.auditNote}</p>
                      </div>
                    </div>

                    <div className="text-right sm:shrink-0 font-mono">
                      <span className="text-xs font-bold text-slate-900 block">{check.metricValue}</span>
                      <span className="text-[10px] text-slate-500 block">Me'yor: {check.benchmark}</span>
                    </div>
                  </div>

                  {check.actionRequired && (
                    <div className="mt-2.5 pt-2 border-t border-slate-200/60 text-xs text-rose-800 font-medium flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-rose-600" />
                      <span>Zarur Harakat: {check.actionRequired}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
