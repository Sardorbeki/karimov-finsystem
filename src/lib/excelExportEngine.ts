import ExcelJS from 'exceljs';
import {
  Income,
  Expense,
  DebtWithComputed,
  DebtPayment,
  BudgetWithComputed,
  Category,
  FinancialSummary
} from '../types';
import { formatDate } from './formatters';

// Palette definitions matching the Karimov Financial Management System 2.0
const STYLES = {
  headerFill: {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1E293B' } // Slate 800
  } as ExcelJS.Fill,
  headerFont: {
    name: 'Calibri',
    size: 11,
    bold: true,
    color: { argb: 'FFFFFFFF' }
  } as Partial<ExcelJS.Font>,
  titleFill: {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF0F172A' } // Slate 900
  } as ExcelJS.Fill,
  titleFont: {
    name: 'Calibri',
    size: 14,
    bold: true,
    color: { argb: 'FFFFFFFF' }
  } as Partial<ExcelJS.Font>,
  kpiIncomeFill: {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE6F4EA' } // Light Emerald
  } as ExcelJS.Fill,
  kpiExpenseFill: {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFFCE8E6' } // Light Rose
  } as ExcelJS.Fill,
  kpiBalanceFill: {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE8EAED' } // Light Indigo / Slate
  } as ExcelJS.Fill,
  totalRowFill: {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFF1F5F9' } // Slate 100
  } as ExcelJS.Fill,
  thinBorder: {
    top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
  } as Partial<ExcelJS.Borders>,
  doubleBottomBorder: {
    top: { style: 'thin', color: { argb: 'FF94A3B8' } },
    left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    bottom: { style: 'double', color: { argb: 'FF0F172A' } },
    right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
  } as Partial<ExcelJS.Borders>
};

const CURRENCY_FMT = '#,##0 "so\'m"';
const PERCENT_FMT = '0.0%';
const DATE_FMT = 'YYYY-MM-DD';

/**
 * Helper to trigger browser download of an ExcelJS Workbook
 */
async function downloadWorkbook(workbook: ExcelJS.Workbook, filename: string) {
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.URL.revokeObjectURL(url);
}

/**
 * ============================================================================
 * 1. MASTER FULL SYSTEM EXPORT
 * Produces the complete, faithful 2026 Excel 2.0 system with all linked sheets & formulas.
 * ============================================================================
 */
export async function exportFullMasterExcel(data: {
  summary: FinancialSummary;
  incomes: Income[];
  expenses: Expense[];
  debts: DebtWithComputed[];
  debtPayments: DebtPayment[];
  budgets: BudgetWithComputed[];
  categories: Category[];
  year?: string;
}) {
  const { summary, incomes, expenses, debts, debtPayments, budgets, categories, year = '2026' } = data;
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Каримов_Moliyaviy_Boshqaruv_Tizimi';
  wb.lastModifiedBy = 'Shaxsiy Moliyaviy Boshqaruv Tizimi 2.0';
  wb.created = new Date();
  wb.modified = new Date();

  // -------------------------------------------------------------
  // Sheet 1: Dashboard
  // -------------------------------------------------------------
  const wsDash = wb.addWorksheet('Dashboard', {
    views: [{ showGridLines: true }],
    properties: { tabColor: { argb: 'FF4F46E5' } }
  });

  // Title Banner
  wsDash.mergeCells('A1:F1');
  const titleCell = wsDash.getCell('A1');
  titleCell.value = `КАРИМОВ — MOLIYAVIY BOSHQARUV TIZIMI (${year}-YILLIK)`;
  titleCell.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = STYLES.titleFill;
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  wsDash.getRow(1).height = 36;

  // Subtitle / Date
  wsDash.mergeCells('A2:F2');
  const subCell = wsDash.getCell('A2');
  subCell.value = `Hisobot shakllantirilgan sana: ${new Date().toLocaleDateString('uz-UZ')} ${new Date().toLocaleTimeString('uz-UZ')}`;
  subCell.font = { name: 'Calibri', size: 10, italic: true, color: { argb: 'FF64748B' } };
  subCell.alignment = { vertical: 'middle', horizontal: 'center' };
  wsDash.getRow(2).height = 20;

  // Section Header: Asosiy Ko'rsatkichlar
  wsDash.mergeCells('A4:F4');
  const kpiSec = wsDash.getCell('A4');
  kpiSec.value = 'ASOSIY MOLIYAVIY KO\'RSATKICHLAR (KPI)';
  kpiSec.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
  kpiSec.fill = STYLES.headerFill;
  kpiSec.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  wsDash.getRow(4).height = 24;

  const incomeRowLimit = Math.max(incomes.length + 2, 100);
  const expenseRowLimit = Math.max(expenses.length + 2, 100);

  // Table of KPIs with formulas!
  const kpiData = [
    { label: 'Jami Yillik Daromad', formula: `=SUM(Kirimlar!D3:D${incomeRowLimit})`, value: summary.total_income, numFmt: CURRENCY_FMT, fontColor: 'FF059669' },
    { label: 'Jami Yillik Xarajat', formula: `=SUM(Chiqimlar!D3:D${expenseRowLimit})`, value: summary.total_expense, numFmt: CURRENCY_FMT, fontColor: 'FFE11D48' },
    { label: 'Sof Qoldiq (Balans / Foyda)', formula: `=C5-C6`, value: summary.net_balance, numFmt: CURRENCY_FMT, fontColor: 'FF4F46E5', bold: true },
    { label: 'Jamg\'arma Koeffitsienti (Tejash %)', formula: `=IF(C5>0, MAX(0, C7)/C5, 0)`, value: summary.savings_rate / 100, numFmt: PERCENT_FMT, fontColor: 'FF0D9488' },
    { label: 'Berilgan Qarzlar Qoldig\'i (Kutilayotgan)', formula: `=SUM(Qarzlar!F3:F50)`, value: summary.total_debt_given_remaining, numFmt: CURRENCY_FMT, fontColor: 'FF0284C7' },
    { label: 'Olingan Qarzlar Qoldig\'i (Majburiyat)', formula: `=SUM(Qarzlar!G3:G50)`, value: summary.total_debt_received_remaining, numFmt: CURRENCY_FMT, fontColor: 'FFD97706' },
    { label: 'Sof Pul Oqimi (Net Cash Flow)', formula: `=C7 + C9 - C10`, value: summary.net_cash_flow, numFmt: CURRENCY_FMT, fontColor: 'FF1E293B', bold: true }
  ];

  kpiData.forEach((kpi, idx) => {
    const rowIdx = 5 + idx;
    const row = wsDash.getRow(rowIdx);
    row.height = 24;

    wsDash.mergeCells(`A${rowIdx}:B${rowIdx}`);
    const lblCell = wsDash.getCell(`A${rowIdx}`);
    lblCell.value = kpi.label;
    lblCell.font = { name: 'Calibri', size: 11, bold: kpi.bold || false, color: { argb: 'FF1E293B' } };
    lblCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    lblCell.border = STYLES.thinBorder;

    const valCell = wsDash.getCell(`C${rowIdx}`);
    valCell.value = { formula: kpi.formula, result: kpi.value } as any;
    valCell.numFmt = kpi.numFmt;
    valCell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: kpi.fontColor } };
    valCell.alignment = { vertical: 'middle', horizontal: 'right' };
    valCell.border = STYLES.thinBorder;
  });

  wsDash.getColumn(1).width = 24;
  wsDash.getColumn(2).width = 24;
  wsDash.getColumn(3).width = 28;
  wsDash.getColumn(4).width = 20;
  wsDash.getColumn(5).width = 20;
  wsDash.getColumn(6).width = 20;

  // -------------------------------------------------------------
  // Sheet 2: Kirimlar (Incomes)
  // -------------------------------------------------------------
  const wsIncome = wb.addWorksheet('Kirimlar', {
    views: [{ state: 'frozen', ySplit: 2 }],
    properties: { tabColor: { argb: 'FF10B981' } }
  });

  wsIncome.mergeCells('A1:F1');
  const incTitle = wsIncome.getCell('A1');
  incTitle.value = 'DAROMADLAR RO\'YXATI (KIRIMLAR)';
  incTitle.font = STYLES.headerFont;
  incTitle.fill = STYLES.titleFill;
  incTitle.alignment = { vertical: 'middle', horizontal: 'center' };
  wsIncome.getRow(1).height = 30;

  const incHeaders = ['T/r', 'Sana', 'Kategoriya', 'Summa', 'To\'lov Usuli', 'Izoh / Tafsilot'];
  const incHeaderRow = wsIncome.getRow(2);
  incHeaderRow.values = incHeaders;
  incHeaderRow.height = 26;
  incHeaderRow.font = STYLES.headerFont;
  incHeaderRow.fill = STYLES.headerFill;
  incHeaderRow.alignment = { vertical: 'middle', horizontal: 'center' };

  incomes.forEach((inc, idx) => {
    const cat = categories.find((c) => c.id === inc.category_id);
    const row = wsIncome.addRow([
      idx + 1,
      formatDate(inc.date),
      cat ? cat.name : 'Boshqa daromadlar',
      inc.amount,
      inc.payment_method || 'Plastik karta',
      inc.description || ''
    ]);
    row.height = 22;
    row.alignment = { vertical: 'middle' };
    row.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };
    row.getCell(2).alignment = { vertical: 'middle', horizontal: 'center' };
    row.getCell(4).numFmt = CURRENCY_FMT;
    row.getCell(4).font = { bold: true, color: { argb: 'FF059669' } };
    row.eachCell((c) => (c.border = STYLES.thinBorder));
  });

  // Total Row with Formula
  const incTotalRowIdx = incomes.length + 3;
  const incTotalRow = wsIncome.getRow(incTotalRowIdx);
  incTotalRow.values = ['JAMI:', '', '', { formula: `=SUM(D3:D${incTotalRowIdx - 1})`, result: summary.total_income }, '', ''];
  incTotalRow.height = 26;
  incTotalRow.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF059669' } };
  incTotalRow.fill = STYLES.totalRowFill;
  incTotalRow.getCell(4).numFmt = CURRENCY_FMT;
  incTotalRow.eachCell((c) => (c.border = STYLES.doubleBottomBorder));

  wsIncome.getColumn(1).width = 8;
  wsIncome.getColumn(2).width = 16;
  wsIncome.getColumn(3).width = 28;
  wsIncome.getColumn(4).width = 24;
  wsIncome.getColumn(5).width = 20;
  wsIncome.getColumn(6).width = 40;

  // -------------------------------------------------------------
  // Sheet 3: Chiqimlar (Expenses)
  // -------------------------------------------------------------
  const wsExpense = wb.addWorksheet('Chiqimlar', {
    views: [{ state: 'frozen', ySplit: 2 }],
    properties: { tabColor: { argb: 'FFF43F5E' } }
  });

  wsExpense.mergeCells('A1:F1');
  const expTitle = wsExpense.getCell('A1');
  expTitle.value = 'XARAJATLAR RO\'YXATI (CHIQIMLAR)';
  expTitle.font = STYLES.headerFont;
  expTitle.fill = STYLES.titleFill;
  expTitle.alignment = { vertical: 'middle', horizontal: 'center' };
  wsExpense.getRow(1).height = 30;

  const expHeaders = ['T/r', 'Sana', 'Kategoriya', 'Summa', 'To\'lov Usuli', 'Izoh / Tafsilot'];
  const expHeaderRow = wsExpense.getRow(2);
  expHeaderRow.values = expHeaders;
  expHeaderRow.height = 26;
  expHeaderRow.font = STYLES.headerFont;
  expHeaderRow.fill = STYLES.headerFill;
  expHeaderRow.alignment = { vertical: 'middle', horizontal: 'center' };

  expenses.forEach((exp, idx) => {
    const cat = categories.find((c) => c.id === exp.category_id);
    const row = wsExpense.addRow([
      idx + 1,
      formatDate(exp.date),
      cat ? cat.name : 'Boshqa xarajatlar',
      exp.amount,
      exp.payment_method || 'Plastik karta',
      exp.description || ''
    ]);
    row.height = 22;
    row.alignment = { vertical: 'middle' };
    row.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };
    row.getCell(2).alignment = { vertical: 'middle', horizontal: 'center' };
    row.getCell(4).numFmt = CURRENCY_FMT;
    row.getCell(4).font = { bold: true, color: { argb: 'FFE11D48' } };
    row.eachCell((c) => (c.border = STYLES.thinBorder));
  });

  // Total Row with Formula
  const expTotalRowIdx = expenses.length + 3;
  const expTotalRow = wsExpense.getRow(expTotalRowIdx);
  expTotalRow.values = ['JAMI:', '', '', { formula: `=SUM(D3:D${expTotalRowIdx - 1})`, result: summary.total_expense }, '', ''];
  expTotalRow.height = 26;
  expTotalRow.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFE11D48' } };
  expTotalRow.fill = STYLES.totalRowFill;
  expTotalRow.getCell(4).numFmt = CURRENCY_FMT;
  expTotalRow.eachCell((c) => (c.border = STYLES.doubleBottomBorder));

  wsExpense.getColumn(1).width = 8;
  wsExpense.getColumn(2).width = 16;
  wsExpense.getColumn(3).width = 28;
  wsExpense.getColumn(4).width = 24;
  wsExpense.getColumn(5).width = 20;
  wsExpense.getColumn(6).width = 40;

  // -------------------------------------------------------------
  // Sheet 4: Qarzlar (Debts)
  // -------------------------------------------------------------
  const wsDebts = wb.addWorksheet('Qarzlar', {
    views: [{ state: 'frozen', ySplit: 2 }],
    properties: { tabColor: { argb: 'FF0284C7' } }
  });

  wsDebts.mergeCells('A1:I1');
  const debtTitle = wsDebts.getCell('A1');
  debtTitle.value = 'QARZLAR VA MAJBURIYATLAR BALANSI';
  debtTitle.font = STYLES.headerFont;
  debtTitle.fill = STYLES.titleFill;
  debtTitle.alignment = { vertical: 'middle', horizontal: 'center' };
  wsDebts.getRow(1).height = 30;

  const debtHeaders = [
    'T/r',
    'Qarz Turi',
    'Hamkor / Ism',
    'Dastlabki Summa',
    'Qaytarilgan Summa',
    'Qolgan Qoldiq',
    'Qaytarish Muddati',
    'Holati',
    'Izoh'
  ];
  const debtHeaderRow = wsDebts.getRow(2);
  debtHeaderRow.values = debtHeaders;
  debtHeaderRow.height = 26;
  debtHeaderRow.font = STYLES.headerFont;
  debtHeaderRow.fill = STYLES.headerFill;
  debtHeaderRow.alignment = { vertical: 'middle', horizontal: 'center' };

  debts.forEach((d, idx) => {
    const rowIdx = idx + 3;
    const isGiven = d.type === 'given';
    const statusText =
      d.computed_status === 'paid'
        ? 'To\'liq to\'langan'
        : d.computed_status === 'overdue'
        ? `Muddati o'tgan (${d.overdue_days} kun)`
        : d.computed_status === 'partially_paid'
        ? 'Qisman to\'langan'
        : 'To\'lanmagan';

    const row = wsDebts.addRow([
      idx + 1,
      isGiven ? 'Berilgan qarz (Men berganman)' : 'Olingan qarz (Men olganman)',
      d.counterparty,
      d.initial_amount,
      d.paid_amount,
      { formula: `=D${rowIdx}-E${rowIdx}`, result: d.remaining_amount },
      formatDate(d.due_date),
      statusText,
      d.description || ''
    ]);
    row.height = 22;
    row.alignment = { vertical: 'middle' };
    row.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };
    row.getCell(4).numFmt = CURRENCY_FMT;
    row.getCell(5).numFmt = CURRENCY_FMT;
    row.getCell(6).numFmt = CURRENCY_FMT;
    row.getCell(6).font = { bold: true, color: { argb: isGiven ? 'FF0284C7' : 'FFD97706' } };
    row.getCell(7).alignment = { vertical: 'middle', horizontal: 'center' };
    row.eachCell((c) => (c.border = STYLES.thinBorder));
  });

  wsDebts.getColumn(1).width = 8;
  wsDebts.getColumn(2).width = 28;
  wsDebts.getColumn(3).width = 24;
  wsDebts.getColumn(4).width = 20;
  wsDebts.getColumn(5).width = 20;
  wsDebts.getColumn(6).width = 20;
  wsDebts.getColumn(7).width = 18;
  wsDebts.getColumn(8).width = 24;
  wsDebts.getColumn(9).width = 30;

  // -------------------------------------------------------------
  // Sheet 5: Qarz_Tolovlari (Debt Repayment Timeline)
  // -------------------------------------------------------------
  const wsPayments = wb.addWorksheet('Qarz_Tolovlari', {
    views: [{ state: 'frozen', ySplit: 2 }],
    properties: { tabColor: { argb: 'FF8B5CF6' } }
  });

  wsPayments.mergeCells('A1:G1');
  const payTitle = wsPayments.getCell('A1');
  payTitle.value = 'QARZ QAYTARISHLARI JURNALI (REPAYMENT LOG)';
  payTitle.font = STYLES.headerFont;
  payTitle.fill = STYLES.titleFill;
  payTitle.alignment = { vertical: 'middle', horizontal: 'center' };
  wsPayments.getRow(1).height = 30;

  const payHeaders = ['T/r', 'To\'lov Sanasi', 'Hamkor / Ism', 'Qarz Turi', 'To\'langan Summa', 'To\'lov Usuli', 'Izoh'];
  const payHeaderRow = wsPayments.getRow(2);
  payHeaderRow.values = payHeaders;
  payHeaderRow.height = 26;
  payHeaderRow.font = STYLES.headerFont;
  payHeaderRow.fill = STYLES.headerFill;
  payHeaderRow.alignment = { vertical: 'middle', horizontal: 'center' };

  debtPayments.forEach((p, idx) => {
    const parent = debts.find((d) => d.id === p.debt_id);
    const row = wsPayments.addRow([
      idx + 1,
      formatDate(p.payment_date),
      parent ? parent.counterparty : 'Noma\'lum',
      parent ? (parent.type === 'given' ? 'Berilgan qarz qaytishi' : 'Olingan qarzni to\'lash') : '-',
      p.amount,
      p.payment_method || 'Plastik karta',
      p.note || ''
    ]);
    row.height = 22;
    row.alignment = { vertical: 'middle' };
    row.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };
    row.getCell(2).alignment = { vertical: 'middle', horizontal: 'center' };
    row.getCell(5).numFmt = CURRENCY_FMT;
    row.getCell(5).font = { bold: true, color: { argb: 'FF4F46E5' } };
    row.eachCell((c) => (c.border = STYLES.thinBorder));
  });

  wsPayments.getColumn(1).width = 8;
  wsPayments.getColumn(2).width = 16;
  wsPayments.getColumn(3).width = 24;
  wsPayments.getColumn(4).width = 28;
  wsPayments.getColumn(5).width = 22;
  wsPayments.getColumn(6).width = 20;
  wsPayments.getColumn(7).width = 35;

  // -------------------------------------------------------------
  // Sheet 6: Byudjet_Limitlari (Budgets)
  // -------------------------------------------------------------
  const wsBudgets = wb.addWorksheet('Byudjet_Limitlari', {
    views: [{ state: 'frozen', ySplit: 2 }],
    properties: { tabColor: { argb: 'FFD97706' } }
  });

  wsBudgets.mergeCells('A1:G1');
  const budTitle = wsBudgets.getCell('A1');
  budTitle.value = 'OYLIK VA YILLIK BYUDJET CHEGARALARI (LIMITS)';
  budTitle.font = STYLES.headerFont;
  budTitle.fill = STYLES.titleFill;
  budTitle.alignment = { vertical: 'middle', horizontal: 'center' };
  wsBudgets.getRow(1).height = 30;

  const budHeaders = [
    'T/r',
    'Kategoriya',
    'Belgilangan Limit',
    'Haqiqiy Sarf',
    'Qolgan Qoldiq',
    'Ishlatilish Foizi',
    'Holati'
  ];
  const budHeaderRow = wsBudgets.getRow(2);
  budHeaderRow.values = budHeaders;
  budHeaderRow.height = 26;
  budHeaderRow.font = STYLES.headerFont;
  budHeaderRow.fill = STYLES.headerFill;
  budHeaderRow.alignment = { vertical: 'middle', horizontal: 'center' };

  budgets.forEach((b, idx) => {
    const rowIdx = idx + 3;
    const statusText =
      b.status === 'exceeded'
        ? 'Byudjet oshib ketdi ⚠️'
        : b.status === 'warning'
        ? 'Xavf chegarasida (70%+)'
        : 'Me\'yorda';

    const row = wsBudgets.addRow([
      idx + 1,
      b.category_name,
      b.limit_amount,
      b.spent_amount,
      { formula: `=C${rowIdx}-D${rowIdx}`, result: b.remaining_amount },
      { formula: `=IF(C${rowIdx}>0, D${rowIdx}/C${rowIdx}, 0)`, result: b.usage_percentage / 100 },
      statusText
    ]);
    row.height = 22;
    row.alignment = { vertical: 'middle' };
    row.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };
    row.getCell(3).numFmt = CURRENCY_FMT;
    row.getCell(4).numFmt = CURRENCY_FMT;
    row.getCell(5).numFmt = CURRENCY_FMT;
    row.getCell(6).numFmt = PERCENT_FMT;
    row.getCell(6).font = { bold: true, color: { argb: b.usage_percentage > 100 ? 'FFE11D48' : 'FF059669' } };
    row.eachCell((c) => (c.border = STYLES.thinBorder));
  });

  wsBudgets.getColumn(1).width = 8;
  wsBudgets.getColumn(2).width = 28;
  wsBudgets.getColumn(3).width = 22;
  wsBudgets.getColumn(4).width = 22;
  wsBudgets.getColumn(5).width = 22;
  wsBudgets.getColumn(6).width = 18;
  wsBudgets.getColumn(7).width = 24;

  // -------------------------------------------------------------
  // Sheet 7: Kategoriyalar (Categories Catalog)
  // -------------------------------------------------------------
  const wsCats = wb.addWorksheet('Kategoriyalar', {
    views: [{ state: 'frozen', ySplit: 2 }],
    properties: { tabColor: { argb: 'FF64748B' } }
  });

  wsCats.mergeCells('A1:E1');
  const catTitle = wsCats.getCell('A1');
  catTitle.value = 'MOLIYAVIY KATEGORIYALAR REESTRI';
  catTitle.font = STYLES.headerFont;
  catTitle.fill = STYLES.titleFill;
  catTitle.alignment = { vertical: 'middle', horizontal: 'center' };
  wsCats.getRow(1).height = 30;

  const catHeaders = ['T/r', 'Kategoriya Nomi', 'Turi', 'Tranzaksiyalar Soni', 'Izoh'];
  const catHeaderRow = wsCats.getRow(2);
  catHeaderRow.values = catHeaders;
  catHeaderRow.height = 26;
  catHeaderRow.font = STYLES.headerFont;
  catHeaderRow.fill = STYLES.headerFill;
  catHeaderRow.alignment = { vertical: 'middle', horizontal: 'center' };

  categories.forEach((c, idx) => {
    const isInc = c.type === 'income';
    const txCount = isInc
      ? incomes.filter((i) => !i.is_deleted && i.category_id === c.id).length
      : expenses.filter((e) => !e.is_deleted && e.category_id === c.id).length;

    const row = wsCats.addRow([
      idx + 1,
      c.name,
      isInc ? 'Daromad' : 'Xarajat',
      txCount,
      c.description || ''
    ]);
    row.height = 22;
    row.alignment = { vertical: 'middle' };
    row.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };
    row.getCell(3).alignment = { vertical: 'middle', horizontal: 'center' };
    row.getCell(3).font = { bold: true, color: { argb: isInc ? 'FF059669' : 'FFE11D48' } };
    row.getCell(4).alignment = { vertical: 'middle', horizontal: 'right' };
    row.eachCell((cell) => (cell.border = STYLES.thinBorder));
  });

  wsCats.getColumn(1).width = 8;
  wsCats.getColumn(2).width = 28;
  wsCats.getColumn(3).width = 16;
  wsCats.getColumn(4).width = 20;
  wsCats.getColumn(5).width = 35;

  // -------------------------------------------------------------
  // Sheet 8: Grafik_Data (12-Month Consolidated Analytical Table)
  // -------------------------------------------------------------
  const wsGrafik = wb.addWorksheet('Grafik_Data', {
    views: [{ state: 'frozen', ySplit: 2 }],
    properties: { tabColor: { argb: 'FF0EA5E9' } }
  });

  wsGrafik.mergeCells('A1:G1');
  const grTitle = wsGrafik.getCell('A1');
  grTitle.value = `${year}-YIL OYLIK DINAMIK TAHLIL (GRAFIK DATA)`;
  grTitle.font = STYLES.headerFont;
  grTitle.fill = STYLES.titleFill;
  grTitle.alignment = { vertical: 'middle', horizontal: 'center' };
  wsGrafik.getRow(1).height = 30;

  const grHeaders = ['Oy', 'Daromad', 'Xarajat', 'Sof Balans', 'Tejash %', 'Pul Kirimi', 'Pul Chiqimi'];
  const grHeaderRow = wsGrafik.getRow(2);
  grHeaderRow.values = grHeaders;
  grHeaderRow.height = 26;
  grHeaderRow.font = STYLES.headerFont;
  grHeaderRow.fill = STYLES.headerFill;
  grHeaderRow.alignment = { vertical: 'middle', horizontal: 'center' };

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

  months.forEach((m, idx) => {
    const rowIdx = idx + 3;
    const prefix = `${year}-${m.code}`;
    const incMonth = incomes.filter((i) => !i.is_deleted && i.date.startsWith(prefix)).reduce((s, i) => s + i.amount, 0);
    const expMonth = expenses.filter((e) => !e.is_deleted && e.date.startsWith(prefix)).reduce((s, e) => s + e.amount, 0);
    const net = incMonth - expMonth;
    const saveRate = incMonth > 0 ? Math.max(0, net) / incMonth : 0;

    const row = wsGrafik.addRow([
      m.name,
      incMonth,
      expMonth,
      { formula: `=B${rowIdx}-C${rowIdx}`, result: net },
      { formula: `=IF(B${rowIdx}>0, MAX(0, D${rowIdx})/B${rowIdx}, 0)`, result: saveRate },
      incMonth,
      expMonth
    ]);
    row.height = 22;
    row.alignment = { vertical: 'middle' };
    row.getCell(2).numFmt = CURRENCY_FMT;
    row.getCell(3).numFmt = CURRENCY_FMT;
    row.getCell(4).numFmt = CURRENCY_FMT;
    row.getCell(4).font = { bold: true, color: { argb: net >= 0 ? 'FF4F46E5' : 'FFE11D48' } };
    row.getCell(5).numFmt = PERCENT_FMT;
    row.getCell(6).numFmt = CURRENCY_FMT;
    row.getCell(7).numFmt = CURRENCY_FMT;
    row.eachCell((c) => (c.border = STYLES.thinBorder));
  });

  // Annual Totals
  const grTotalRowIdx = 15;
  const grTotalRow = wsGrafik.getRow(grTotalRowIdx);
  grTotalRow.values = [
    'YILLIK JAMI:',
    { formula: `=SUM(B3:B14)`, result: summary.total_income },
    { formula: `=SUM(C3:C14)`, result: summary.total_expense },
    { formula: `=B15-C15`, result: summary.net_balance },
    { formula: `=IF(B15>0, MAX(0, D15)/B15, 0)`, result: summary.savings_rate / 100 },
    { formula: `=SUM(F3:F14)`, result: summary.total_income },
    { formula: `=SUM(G3:G14)`, result: summary.total_expense }
  ];
  grTotalRow.height = 26;
  grTotalRow.font = { name: 'Calibri', size: 11, bold: true };
  grTotalRow.fill = STYLES.totalRowFill;
  grTotalRow.getCell(2).numFmt = CURRENCY_FMT;
  grTotalRow.getCell(3).numFmt = CURRENCY_FMT;
  grTotalRow.getCell(4).numFmt = CURRENCY_FMT;
  grTotalRow.getCell(5).numFmt = PERCENT_FMT;
  grTotalRow.getCell(6).numFmt = CURRENCY_FMT;
  grTotalRow.getCell(7).numFmt = CURRENCY_FMT;
  grTotalRow.eachCell((c) => (c.border = STYLES.doubleBottomBorder));

  wsGrafik.getColumn(1).width = 16;
  wsGrafik.getColumn(2).width = 22;
  wsGrafik.getColumn(3).width = 22;
  wsGrafik.getColumn(4).width = 22;
  wsGrafik.getColumn(5).width = 16;
  wsGrafik.getColumn(6).width = 22;
  wsGrafik.getColumn(7).width = 22;

  // Trigger Download
  const filename = `Каримов_Moliyaviy_boshqaruv_tizimi_excel_2_0_versiya_${year}_yillik.xlsx`;
  await downloadWorkbook(wb, filename);
}

/**
 * ============================================================================
 * 2. MODULE EXPORT: INCOMES (KIRIMLAR)
 * ============================================================================
 */
export async function exportIncomesModuleExcel(
  incomes: Income[],
  categories: Category[],
  filterTitle: string = 'Barcha Daromadlar'
) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Daromadlar_Hisoboti', {
    views: [{ state: 'frozen', ySplit: 2 }]
  });

  ws.mergeCells('A1:F1');
  const title = ws.getCell('A1');
  title.value = `DAROMADLAR HISOBOTI — ${filterTitle.toUpperCase()}`;
  title.font = STYLES.headerFont;
  title.fill = STYLES.titleFill;
  title.alignment = { vertical: 'middle', horizontal: 'center' };
  ws.getRow(1).height = 30;

  const headers = ['T/r', 'Sana', 'Kategoriya', 'Summa', 'To\'lov Usuli', 'Izoh / Tafsilot'];
  const hRow = ws.getRow(2);
  hRow.values = headers;
  hRow.height = 26;
  hRow.font = STYLES.headerFont;
  hRow.fill = STYLES.headerFill;
  hRow.alignment = { vertical: 'middle', horizontal: 'center' };

  let total = 0;
  incomes.forEach((inc, idx) => {
    total += inc.amount;
    const cat = categories.find((c) => c.id === inc.category_id);
    const row = ws.addRow([
      idx + 1,
      formatDate(inc.date),
      cat ? cat.name : 'Boshqa daromadlar',
      inc.amount,
      inc.payment_method || 'Plastik karta',
      inc.description || ''
    ]);
    row.height = 22;
    row.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };
    row.getCell(2).alignment = { vertical: 'middle', horizontal: 'center' };
    row.getCell(4).numFmt = CURRENCY_FMT;
    row.getCell(4).font = { bold: true, color: { argb: 'FF059669' } };
    row.eachCell((c) => (c.border = STYLES.thinBorder));
  });

  const totalRowIdx = incomes.length + 3;
  const tRow = ws.getRow(totalRowIdx);
  tRow.values = ['JAMI:', '', '', { formula: `=SUM(D3:D${totalRowIdx - 1})`, result: total }, '', ''];
  tRow.height = 26;
  tRow.font = { bold: true, color: { argb: 'FF059669' } };
  tRow.fill = STYLES.totalRowFill;
  tRow.getCell(4).numFmt = CURRENCY_FMT;
  tRow.eachCell((c) => (c.border = STYLES.doubleBottomBorder));

  ws.getColumn(1).width = 8;
  ws.getColumn(2).width = 16;
  ws.getColumn(3).width = 28;
  ws.getColumn(4).width = 24;
  ws.getColumn(5).width = 20;
  ws.getColumn(6).width = 40;

  const dateStr = new Date().toISOString().split('T')[0];
  await downloadWorkbook(wb, `Daromadlar_Hisoboti_${dateStr}.xlsx`);
}

/**
 * ============================================================================
 * 3. MODULE EXPORT: EXPENSES (CHIQIMLAR)
 * ============================================================================
 */
export async function exportExpensesModuleExcel(
  expenses: Expense[],
  categories: Category[],
  filterTitle: string = 'Barcha Xarajatlar'
) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Xarajatlar_Hisoboti', {
    views: [{ state: 'frozen', ySplit: 2 }]
  });

  ws.mergeCells('A1:F1');
  const title = ws.getCell('A1');
  title.value = `XARAJATLAR HISOBOTI — ${filterTitle.toUpperCase()}`;
  title.font = STYLES.headerFont;
  title.fill = STYLES.titleFill;
  title.alignment = { vertical: 'middle', horizontal: 'center' };
  ws.getRow(1).height = 30;

  const headers = ['T/r', 'Sana', 'Kategoriya', 'Summa', 'To\'lov Usuli', 'Izoh / Tafsilot'];
  const hRow = ws.getRow(2);
  hRow.values = headers;
  hRow.height = 26;
  hRow.font = STYLES.headerFont;
  hRow.fill = STYLES.headerFill;
  hRow.alignment = { vertical: 'middle', horizontal: 'center' };

  let total = 0;
  expenses.forEach((exp, idx) => {
    total += exp.amount;
    const cat = categories.find((c) => c.id === exp.category_id);
    const row = ws.addRow([
      idx + 1,
      formatDate(exp.date),
      cat ? cat.name : 'Boshqa xarajatlar',
      exp.amount,
      exp.payment_method || 'Plastik karta',
      exp.description || ''
    ]);
    row.height = 22;
    row.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };
    row.getCell(2).alignment = { vertical: 'middle', horizontal: 'center' };
    row.getCell(4).numFmt = CURRENCY_FMT;
    row.getCell(4).font = { bold: true, color: { argb: 'FFE11D48' } };
    row.eachCell((c) => (c.border = STYLES.thinBorder));
  });

  const totalRowIdx = expenses.length + 3;
  const tRow = ws.getRow(totalRowIdx);
  tRow.values = ['JAMI:', '', '', { formula: `=SUM(D3:D${totalRowIdx - 1})`, result: total }, '', ''];
  tRow.height = 26;
  tRow.font = { bold: true, color: { argb: 'FFE11D48' } };
  tRow.fill = STYLES.totalRowFill;
  tRow.getCell(4).numFmt = CURRENCY_FMT;
  tRow.eachCell((c) => (c.border = STYLES.doubleBottomBorder));

  ws.getColumn(1).width = 8;
  ws.getColumn(2).width = 16;
  ws.getColumn(3).width = 28;
  ws.getColumn(4).width = 24;
  ws.getColumn(5).width = 20;
  ws.getColumn(6).width = 40;

  const dateStr = new Date().toISOString().split('T')[0];
  await downloadWorkbook(wb, `Xarajatlar_Hisoboti_${dateStr}.xlsx`);
}

/**
 * ============================================================================
 * 4. MODULE EXPORT: DEBTS (QARZLAR)
 * ============================================================================
 */
export async function exportDebtsModuleExcel(
  debts: DebtWithComputed[],
  filterTitle: string = 'Barcha Qarzlar'
) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Qarzlar_Hisoboti', {
    views: [{ state: 'frozen', ySplit: 2 }]
  });

  ws.mergeCells('A1:I1');
  const title = ws.getCell('A1');
  title.value = `QARZLAR VA MAJBURIYATLAR — ${filterTitle.toUpperCase()}`;
  title.font = STYLES.headerFont;
  title.fill = STYLES.titleFill;
  title.alignment = { vertical: 'middle', horizontal: 'center' };
  ws.getRow(1).height = 30;

  const headers = [
    'T/r',
    'Qarz Turi',
    'Hamkor / Ism',
    'Dastlabki Summa',
    'Qaytarilgan Summa',
    'Qolgan Qoldiq',
    'Qaytarish Muddati',
    'Holati',
    'Izoh'
  ];
  const hRow = ws.getRow(2);
  hRow.values = headers;
  hRow.height = 26;
  hRow.font = STYLES.headerFont;
  hRow.fill = STYLES.headerFill;
  hRow.alignment = { vertical: 'middle', horizontal: 'center' };

  debts.forEach((d, idx) => {
    const rowIdx = idx + 3;
    const isGiven = d.type === 'given';
    const statusText =
      d.computed_status === 'paid'
        ? 'To\'liq to\'langan'
        : d.computed_status === 'overdue'
        ? `Muddati o'tgan (${d.overdue_days} kun)`
        : d.computed_status === 'partially_paid'
        ? 'Qisman to\'langan'
        : 'To\'lanmagan';

    const row = ws.addRow([
      idx + 1,
      isGiven ? 'Berilgan qarz' : 'Olingan qarz',
      d.counterparty,
      d.initial_amount,
      d.paid_amount,
      { formula: `=D${rowIdx}-E${rowIdx}`, result: d.remaining_amount },
      formatDate(d.due_date),
      statusText,
      d.description || ''
    ]);
    row.height = 22;
    row.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };
    row.getCell(4).numFmt = CURRENCY_FMT;
    row.getCell(5).numFmt = CURRENCY_FMT;
    row.getCell(6).numFmt = CURRENCY_FMT;
    row.getCell(6).font = { bold: true, color: { argb: isGiven ? 'FF0284C7' : 'FFD97706' } };
    row.getCell(7).alignment = { vertical: 'middle', horizontal: 'center' };
    row.eachCell((c) => (c.border = STYLES.thinBorder));
  });

  ws.getColumn(1).width = 8;
  ws.getColumn(2).width = 24;
  ws.getColumn(3).width = 24;
  ws.getColumn(4).width = 20;
  ws.getColumn(5).width = 20;
  ws.getColumn(6).width = 20;
  ws.getColumn(7).width = 18;
  ws.getColumn(8).width = 24;
  ws.getColumn(9).width = 30;

  const dateStr = new Date().toISOString().split('T')[0];
  await downloadWorkbook(wb, `Qarzlar_Hisoboti_${dateStr}.xlsx`);
}

/**
 * ============================================================================
 * 5. MODULE EXPORT: BUDGETS (BYUDJET)
 * ============================================================================
 */
export async function exportBudgetsModuleExcel(
  budgets: BudgetWithComputed[],
  periodTitle: string = 'Avgust 2026'
) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Byudjet_Hisoboti', {
    views: [{ state: 'frozen', ySplit: 2 }]
  });

  ws.mergeCells('A1:G1');
  const title = ws.getCell('A1');
  title.value = `BYUDJET LIMITLARI VA SARF TAHLILI — ${periodTitle.toUpperCase()}`;
  title.font = STYLES.headerFont;
  title.fill = STYLES.titleFill;
  title.alignment = { vertical: 'middle', horizontal: 'center' };
  ws.getRow(1).height = 30;

  const headers = [
    'T/r',
    'Kategoriya',
    'Belgilangan Limit',
    'Haqiqiy Sarf',
    'Qolgan Qoldiq',
    'Ishlatilish Foizi',
    'Holati'
  ];
  const hRow = ws.getRow(2);
  hRow.values = headers;
  hRow.height = 26;
  hRow.font = STYLES.headerFont;
  hRow.fill = STYLES.headerFill;
  hRow.alignment = { vertical: 'middle', horizontal: 'center' };

  budgets.forEach((b, idx) => {
    const rowIdx = idx + 3;
    const statusText =
      b.status === 'exceeded'
        ? 'Byudjet oshib ketdi ⚠️'
        : b.status === 'warning'
        ? 'Xavf chegarasida (70%+)'
        : 'Me\'yorda';

    const row = ws.addRow([
      idx + 1,
      b.category_name,
      b.limit_amount,
      b.spent_amount,
      { formula: `=C${rowIdx}-D${rowIdx}`, result: b.remaining_amount },
      { formula: `=IF(C${rowIdx}>0, D${rowIdx}/C${rowIdx}, 0)`, result: b.usage_percentage / 100 },
      statusText
    ]);
    row.height = 22;
    row.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };
    row.getCell(3).numFmt = CURRENCY_FMT;
    row.getCell(4).numFmt = CURRENCY_FMT;
    row.getCell(5).numFmt = CURRENCY_FMT;
    row.getCell(6).numFmt = PERCENT_FMT;
    row.getCell(6).font = { bold: true, color: { argb: b.usage_percentage > 100 ? 'FFE11D48' : 'FF059669' } };
    row.eachCell((c) => (c.border = STYLES.thinBorder));
  });

  ws.getColumn(1).width = 8;
  ws.getColumn(2).width = 28;
  ws.getColumn(3).width = 22;
  ws.getColumn(4).width = 22;
  ws.getColumn(5).width = 22;
  ws.getColumn(6).width = 18;
  ws.getColumn(7).width = 24;

  const dateStr = new Date().toISOString().split('T')[0];
  await downloadWorkbook(wb, `Byudjet_Hisoboti_${dateStr}.xlsx`);
}

/**
 * ============================================================================
 * 6. MODULE EXPORT: CATEGORIES (KATEGORIYALAR)
 * ============================================================================
 */
export async function exportCategoriesModuleExcel(
  categories: Category[],
  incomes: Income[],
  expenses: Expense[]
) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Kategoriyalar', {
    views: [{ state: 'frozen', ySplit: 2 }]
  });

  ws.mergeCells('A1:E1');
  const title = ws.getCell('A1');
  title.value = 'MOLIYAVIY KATEGORIYALAR RO\'YXATI';
  title.font = STYLES.headerFont;
  title.fill = STYLES.titleFill;
  title.alignment = { vertical: 'middle', horizontal: 'center' };
  ws.getRow(1).height = 30;

  const headers = ['T/r', 'Kategoriya Nomi', 'Turi', 'Operatsiyalar Soni', 'Izoh'];
  const hRow = ws.getRow(2);
  hRow.values = headers;
  hRow.height = 26;
  hRow.font = STYLES.headerFont;
  hRow.fill = STYLES.headerFill;
  hRow.alignment = { vertical: 'middle', horizontal: 'center' };

  categories.forEach((c, idx) => {
    const isInc = c.type === 'income';
    const txCount = isInc
      ? incomes.filter((i) => !i.is_deleted && i.category_id === c.id).length
      : expenses.filter((e) => !e.is_deleted && e.category_id === c.id).length;

    const row = ws.addRow([
      idx + 1,
      c.name,
      isInc ? 'Daromad' : 'Xarajat',
      txCount,
      c.description || ''
    ]);
    row.height = 22;
    row.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };
    row.getCell(3).alignment = { vertical: 'middle', horizontal: 'center' };
    row.getCell(3).font = { bold: true, color: { argb: isInc ? 'FF059669' : 'FFE11D48' } };
    row.getCell(4).alignment = { vertical: 'middle', horizontal: 'right' };
    row.eachCell((cell) => (cell.border = STYLES.thinBorder));
  });

  ws.getColumn(1).width = 8;
  ws.getColumn(2).width = 28;
  ws.getColumn(3).width = 16;
  ws.getColumn(4).width = 20;
  ws.getColumn(5).width = 35;

  const dateStr = new Date().toISOString().split('T')[0];
  await downloadWorkbook(wb, `Kategoriyalar_${dateStr}.xlsx`);
}

/**
 * ============================================================================
 * 7. MODULE EXPORT: REPORTS (YILLIK & OYLIK HISOBOTLAR)
 * ============================================================================
 */
export async function exportReportsModuleExcel(data: {
  monthlyReports: any[];
  annualTotals: any;
  categoryBreakdown: any[];
  year?: string;
}) {
  const { monthlyReports, annualTotals, categoryBreakdown, year = '2026' } = data;
  const wb = new ExcelJS.Workbook();

  // Sheet 1: Oylik Moliyaviy Jadval
  const ws = wb.addWorksheet('Oylik_Hisobotlar', {
    views: [{ state: 'frozen', ySplit: 2 }]
  });

  ws.mergeCells('A1:H1');
  const title = ws.getCell('A1');
  title.value = `${year}-YIL KONSOLIDATSIYALANGAN MOLIYAVIY HISOBOT`;
  title.font = STYLES.headerFont;
  title.fill = STYLES.titleFill;
  title.alignment = { vertical: 'middle', horizontal: 'center' };
  ws.getRow(1).height = 30;

  const headers = [
    'Oy',
    'Daromad',
    'Xarajat',
    'Sof Qoldiq',
    'Tejash %',
    'Pul Kirimi (Inflow)',
    'Pul Chiqimi (Outflow)',
    'Kumulyativ Balans'
  ];
  const hRow = ws.getRow(2);
  hRow.values = headers;
  hRow.height = 26;
  hRow.font = STYLES.headerFont;
  hRow.fill = STYLES.headerFill;
  hRow.alignment = { vertical: 'middle', horizontal: 'center' };

  monthlyReports.forEach((m, idx) => {
    const rowIdx = idx + 3;
    const row = ws.addRow([
      m.monthName,
      m.income,
      m.expense,
      { formula: `=B${rowIdx}-C${rowIdx}`, result: m.netBalance },
      { formula: `=IF(B${rowIdx}>0, MAX(0, D${rowIdx})/B${rowIdx}, 0)`, result: m.savingsRate / 100 },
      m.cashInflow,
      m.cashOutflow,
      m.cumulativeBalance
    ]);
    row.height = 22;
    row.getCell(2).numFmt = CURRENCY_FMT;
    row.getCell(3).numFmt = CURRENCY_FMT;
    row.getCell(4).numFmt = CURRENCY_FMT;
    row.getCell(4).font = { bold: true, color: { argb: m.netBalance >= 0 ? 'FF4F46E5' : 'FFE11D48' } };
    row.getCell(5).numFmt = PERCENT_FMT;
    row.getCell(6).numFmt = CURRENCY_FMT;
    row.getCell(7).numFmt = CURRENCY_FMT;
    row.getCell(8).numFmt = CURRENCY_FMT;
    row.getCell(8).font = { bold: true };
    row.eachCell((c) => (c.border = STYLES.thinBorder));
  });

  // Footer Total Row
  const totalRowIdx = monthlyReports.length + 3;
  const tRow = ws.getRow(totalRowIdx);
  tRow.values = [
    'YILLIK JAMI:',
    { formula: `=SUM(B3:B${totalRowIdx - 1})`, result: annualTotals.totalIncome },
    { formula: `=SUM(C3:C${totalRowIdx - 1})`, result: annualTotals.totalExpense },
    { formula: `=B${totalRowIdx}-C${totalRowIdx}`, result: annualTotals.netBalance },
    { formula: `=IF(B${totalRowIdx}>0, MAX(0, D${totalRowIdx})/B${totalRowIdx}, 0)`, result: annualTotals.savingsRate / 100 },
    { formula: `=SUM(F3:F${totalRowIdx - 1})`, result: annualTotals.cashInflow },
    { formula: `=SUM(G3:G${totalRowIdx - 1})`, result: annualTotals.cashOutflow },
    { formula: `=D${totalRowIdx}`, result: annualTotals.netBalance }
  ];
  tRow.height = 26;
  tRow.font = { bold: true };
  tRow.fill = STYLES.totalRowFill;
  tRow.getCell(2).numFmt = CURRENCY_FMT;
  tRow.getCell(3).numFmt = CURRENCY_FMT;
  tRow.getCell(4).numFmt = CURRENCY_FMT;
  tRow.getCell(5).numFmt = PERCENT_FMT;
  tRow.getCell(6).numFmt = CURRENCY_FMT;
  tRow.getCell(7).numFmt = CURRENCY_FMT;
  tRow.getCell(8).numFmt = CURRENCY_FMT;
  tRow.eachCell((c) => (c.border = STYLES.doubleBottomBorder));

  ws.getColumn(1).width = 16;
  ws.getColumn(2).width = 22;
  ws.getColumn(3).width = 22;
  ws.getColumn(4).width = 22;
  ws.getColumn(5).width = 16;
  ws.getColumn(6).width = 22;
  ws.getColumn(7).width = 22;
  ws.getColumn(8).width = 22;

  // Sheet 2: Kategoriya Sarf Tarkibi
  const wsCat = wb.addWorksheet('Kategoriya_Tarkibi', {
    views: [{ state: 'frozen', ySplit: 2 }]
  });

  wsCat.mergeCells('A1:D1');
  const catT = wsCat.getCell('A1');
  catT.value = `${year}-YIL KATEGORIYALAR BO'YICHA XARAJATLAR ULUSHI`;
  catT.font = STYLES.headerFont;
  catT.fill = STYLES.titleFill;
  catT.alignment = { vertical: 'middle', horizontal: 'center' };
  wsCat.getRow(1).height = 30;

  const catH = ['T/r', 'Kategoriya Nomi', 'Yillik Jami Sarf', 'Byudjetdagi Ulushi (%)'];
  const cHRow = wsCat.getRow(2);
  cHRow.values = catH;
  cHRow.height = 26;
  cHRow.font = STYLES.headerFont;
  cHRow.fill = STYLES.headerFill;
  cHRow.alignment = { vertical: 'middle', horizontal: 'center' };

  categoryBreakdown.forEach((cb, idx) => {
    const row = wsCat.addRow([
      idx + 1,
      cb.name,
      cb.total,
      cb.percent / 100
    ]);
    row.height = 22;
    row.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };
    row.getCell(3).numFmt = CURRENCY_FMT;
    row.getCell(4).numFmt = PERCENT_FMT;
    row.getCell(4).font = { bold: true, color: { argb: 'FFE11D48' } };
    row.eachCell((c) => (c.border = STYLES.thinBorder));
  });

  wsCat.getColumn(1).width = 8;
  wsCat.getColumn(2).width = 28;
  wsCat.getColumn(3).width = 24;
  wsCat.getColumn(4).width = 24;

  const dateStr = new Date().toISOString().split('T')[0];
  await downloadWorkbook(wb, `Yillik_Moliyaviy_Hisobot_${year}_${dateStr}.xlsx`);
}
