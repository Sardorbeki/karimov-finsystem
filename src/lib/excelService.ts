import * as XLSX from 'xlsx';
import {
  Income,
  Expense,
  DebtWithComputed,
  BudgetWithComputed,
  Category,
  FinancialSummary,
  DebtPayment
} from '../types';
import { formatDate, formatCurrency } from './formatters';

export function exportFinancialDataToExcel(
  summary: FinancialSummary,
  incomes: Income[],
  expenses: Expense[],
  debts: DebtWithComputed[],
  payments: DebtPayment[],
  budgets: BudgetWithComputed[],
  categories: Category[],
  fileName: string = 'Moliyaviy_boshqaruv_hisoboti_2026.xlsx'
) {
  const wb = XLSX.utils.book_new();

  // 1. Summary Sheet
  const summaryData = [
    ['SHAXSIY MOLIYAVIY BOSHQARUV TIZIMI - YILLIK HISOBOT'],
    ['Eksport qilingan sana:', new Date().toLocaleString()],
    [''],
    ['ASOSIY KO\'RSATKICHLAR (KPI)', 'SUMMA / KO\'RSATKICH'],
    ['Jami Daromad', summary.total_income],
    ['Jami Xarajat', summary.total_expense],
    ['Joriy Balans (Sof foyda/qoldiq)', summary.net_balance],
    ['Tejash Foizi (%)', `${summary.savings_rate.toFixed(1)}%`],
    [''],
    ['QARZLAR HOLATI', 'SUMMA'],
    ['Berilgan qarzlar (Dastlabki)', summary.total_debt_given_initial],
    ['Berilgan qarzlar (Qolgan qoldiq)', summary.total_debt_given_remaining],
    ['Olingan qarzlar (Dastlabki)', summary.total_debt_received_initial],
    ['Olingan qarzlar (Qolgan qoldiq)', summary.total_debt_received_remaining],
    ['Muddati o\'tgan qarzlar soni', summary.overdue_debts_count],
    ['Muddati o\'tgan qarzlar summasi', summary.overdue_debts_amount],
    [''],
    ['PUL OQIMI (CASH FLOW)', 'SUMMA'],
    ['Sof Pul Oqimi (Net Cash Flow)', summary.net_cash_flow],
    ['Qarzlar bo\'yicha to\'langan to\'lovlar', summary.total_debt_repayments_made],
    ['Qarzlar bo\'yicha qabul qilingan to\'lovlar', summary.total_debt_repayments_collected]
  ];
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Umumiy Hisobot');

  // 2. Incomes Sheet
  const incomeRows = incomes.map((i, idx) => {
    const cat = categories.find((c) => c.id === i.category_id);
    return {
      'T/r': idx + 1,
      'Sana': formatDate(i.date),
      'Kategoriya': cat ? cat.name : 'Noma\'lum',
      'Summa (so\'m)': i.amount,
      'To\'lov usuli': i.payment_method || 'Boshqa',
      'Izoh': i.description || ''
    };
  });
  const wsIncome = XLSX.utils.json_to_sheet(incomeRows);
  XLSX.utils.book_append_sheet(wb, wsIncome, 'Daromadlar');

  // 3. Expenses Sheet
  const expenseRows = expenses.map((e, idx) => {
    const cat = categories.find((c) => c.id === e.category_id);
    return {
      'T/r': idx + 1,
      'Sana': formatDate(e.date),
      'Kategoriya': cat ? cat.name : 'Noma\'lum',
      'Summa (so\'m)': e.amount,
      'To\'lov usuli': e.payment_method || 'Boshqa',
      'Izoh': e.description || ''
    };
  });
  const wsExpense = XLSX.utils.json_to_sheet(expenseRows);
  XLSX.utils.book_append_sheet(wb, wsExpense, 'Xarajatlar');

  // 4. Debts Sheet
  const debtRows = debts.map((d, idx) => ({
    'T/r': idx + 1,
    'Qarz turi': d.type === 'given' ? 'Berilgan qarz (Men berganman)' : 'Olingan qarz (Men olganman)',
    'Kimga / Kimdan': d.counterparty,
    'Dastlabki summa (so\'m)': d.initial_amount,
    'To\'langan summa (so\'m)': d.paid_amount,
    'Qolgan summa (so\'m)': d.remaining_amount,
    'Qaytarish muddati': formatDate(d.due_date),
    'Holati': d.computed_status === 'paid' ? 'To\'langan' : d.computed_status === 'overdue' ? `Muddati o'tgan (${d.overdue_days} kun)` : d.computed_status === 'partially_paid' ? 'Qisman to\'langan' : 'To\'lanmagan',
    'Izoh': d.description || ''
  }));
  const wsDebts = XLSX.utils.json_to_sheet(debtRows);
  XLSX.utils.book_append_sheet(wb, wsDebts, 'Qarzlar');

  // 5. Debt Payments Sheet
  const paymentRows = payments.map((p, idx) => {
    const parentDebt = debts.find((d) => d.id === p.debt_id);
    return {
      'T/r': idx + 1,
      'Qarz egasi / Hamkor': parentDebt ? parentDebt.counterparty : 'Noma\'lum',
      'Qarz turi': parentDebt ? (parentDebt.type === 'given' ? 'Berilgan qarz' : 'Olingan qarz') : '-',
      'To\'lov sanasi': formatDate(p.payment_date),
      'To\'langan summa (so\'m)': p.amount,
      'To\'lov turi': p.payment_method,
      'Izoh': p.note || ''
    };
  });
  const wsPayments = XLSX.utils.json_to_sheet(paymentRows);
  XLSX.utils.book_append_sheet(wb, wsPayments, 'Qarz to\'lovlari');

  // 6. Budgets Sheet
  const budgetRows = budgets.map((b, idx) => ({
    'T/r': idx + 1,
    'Kategoriya': b.category_name,
    'Davr': b.period_key,
    'Belgilangan limit (so\'m)': b.limit_amount,
    'Sarflangan summa (so\'m)': b.spent_amount,
    'Qolgan qoldiq (so\'m)': b.remaining_amount,
    'Ishlatilish foizi (%)': `${b.usage_percentage.toFixed(1)}%`,
    'Holati': b.status === 'exceeded' ? 'Byudjet oshdi' : b.status === 'warning' ? 'Ogohlantirish (70%+)' : 'Byudjet ichida'
  }));
  const wsBudgets = XLSX.utils.json_to_sheet(budgetRows);
  XLSX.utils.book_append_sheet(wb, wsBudgets, 'Byudjet');

  // Write file
  XLSX.writeFile(wb, fileName);
}

export function exportToCSV(data: any[], filename: string) {
  const ws = XLSX.utils.json_to_sheet(data);
  const csv = XLSX.utils.sheet_to_csv(ws);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export interface ParsedImportData {
  incomes: Array<{ date: string; categoryName: string; amount: number; description: string; paymentMethod: string }>;
  expenses: Array<{ date: string; categoryName: string; amount: number; description: string; paymentMethod: string }>;
  debts: Array<{ type: 'given' | 'received'; counterparty: string; initial_amount: number; due_date: string; description: string }>;
}

export async function parseExcelFile(file: File): Promise<ParsedImportData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        const result: ParsedImportData = {
          incomes: [],
          expenses: [],
          debts: []
        };

        // Scan all sheets
        workbook.SheetNames.forEach((sheetName) => {
          const sheet = workbook.Sheets[sheetName];
          const json: any[] = XLSX.utils.sheet_to_json(sheet);
          const lowerSheetName = sheetName.toLowerCase();

          if (lowerSheetName.includes('daromad') || lowerSheetName.includes('income')) {
            json.forEach((row) => {
              const amount = extractAmount(row);
              const date = extractDate(row);
              const category = extractCategory(row);
              const desc = extractDescription(row);
              const method = extractPaymentMethod(row);
              if (amount > 0) {
                result.incomes.push({ date, categoryName: category || 'Boshqa daromadlar', amount, description: desc, paymentMethod: method });
              }
            });
          } else if (lowerSheetName.includes('xarajat') || lowerSheetName.includes('expense')) {
            json.forEach((row) => {
              const amount = extractAmount(row);
              const date = extractDate(row);
              const category = extractCategory(row);
              const desc = extractDescription(row);
              const method = extractPaymentMethod(row);
              if (amount > 0) {
                result.expenses.push({ date, categoryName: category || 'Kutilmagan xarajatlar', amount, description: desc, paymentMethod: method });
              }
            });
          } else if (lowerSheetName.includes('qarz') || lowerSheetName.includes('debt')) {
            json.forEach((row) => {
              const amount = extractAmount(row);
              const counterparty = row['Kimga / Kimdan'] || row['Hamkor'] || row['Ism'] || row['Kimdan'] || row['Kimga'] || row['Counterparty'] || 'Noma\'lum';
              const typeStr = (row['Qarz turi'] || row['Turi'] || row['Type'] || '').toLowerCase();
              const type: 'given' | 'received' = typeStr.includes('berilgan') || typeStr.includes('given') ? 'given' : 'received';
              const dueDate = extractDueDate(row);
              const desc = extractDescription(row);
              if (amount > 0) {
                result.debts.push({ type, counterparty, initial_amount: amount, due_date: dueDate, description: desc });
              }
            });
          } else {
            // General or single sheet table: check row contents
            json.forEach((row) => {
              const type = (row['Turi'] || row['Type'] || row['Kategoriya turi'] || '').toLowerCase();
              const amount = extractAmount(row);
              const date = extractDate(row);
              const category = extractCategory(row);
              const desc = extractDescription(row);
              const method = extractPaymentMethod(row);

              if (type.includes('daromad') || type.includes('income')) {
                if (amount > 0) result.incomes.push({ date, categoryName: category || 'Boshqa daromadlar', amount, description: desc, paymentMethod: method });
              } else if (type.includes('xarajat') || type.includes('expense')) {
                if (amount > 0) result.expenses.push({ date, categoryName: category || 'Kutilmagan xarajatlar', amount, description: desc, paymentMethod: method });
              }
            });
          }
        });

        resolve(result);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
}

function extractAmount(row: any): number {
  const val = row['Summa'] ?? row['Summa (so\'m)'] ?? row['Amount'] ?? row['Miqdor'] ?? row['Dastlabki summa'] ?? row['Dastlabki summa (so\'m)'];
  if (typeof val === 'number') return Math.abs(val);
  if (typeof val === 'string') {
    const cleaned = val.replace(/[^0-9.-]/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : Math.abs(num);
  }
  return 0;
}

function extractDate(row: any): string {
  const val = row['Sana'] ?? row['Date'] ?? row['Vaqt'] ?? row['Tranzaksiya sanasi'];
  return parseDateString(val);
}

function extractDueDate(row: any): string {
  const val = row['Qaytarish muddati'] ?? row['Muddat'] ?? row['Due Date'] ?? row['Sana'];
  return parseDateString(val);
}

function parseDateString(val: any): string {
  if (!val) return new Date().toISOString().split('T')[0];
  if (val instanceof Date) return val.toISOString().split('T')[0];
  if (typeof val === 'number') {
    // Excel serial date format
    const date = new Date(Math.round((val - 25569) * 86400 * 1000));
    return isNaN(date.getTime()) ? new Date().toISOString().split('T')[0] : date.toISOString().split('T')[0];
  }
  if (typeof val === 'string') {
    // Check DD.MM.YYYY
    const ddmmyyyy = val.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})/);
    if (ddmmyyyy) {
      const day = ddmmyyyy[1].padStart(2, '0');
      const month = ddmmyyyy[2].padStart(2, '0');
      const year = ddmmyyyy[3];
      return `${year}-${month}-${day}`;
    }
    // Check YYYY-MM-DD
    const yyyymmdd = val.match(/^(\d{4})[./-](\d{1,2})[./-](\d{1,2})/);
    if (yyyymmdd) {
      const year = yyyymmdd[1];
      const month = yyyymmdd[2].padStart(2, '0');
      const day = yyyymmdd[3].padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  }
  return new Date().toISOString().split('T')[0];
}

function extractCategory(row: any): string {
  return row['Kategoriya'] ?? row['Category'] ?? row['Kategoriya nomi'] ?? row['Tur'] ?? '';
}

function extractDescription(row: any): string {
  return row['Izoh'] ?? row['Description'] ?? row['Maqsad'] ?? row['Qo\'shimcha'] ?? row['Note'] ?? '';
}

function extractPaymentMethod(row: any): string {
  return row['To\'lov usuli'] ?? row['To\'lov turi'] ?? row['Payment Method'] ?? 'Plastik karta';
}

export function exportComprehensiveExcel(
  incomes: Income[],
  expenses: Expense[],
  debts: DebtWithComputed[] | any[],
  categories: Category[]
) {
  const wb = XLSX.utils.book_new();

  // 1. Incomes Sheet
  const incomeRows = incomes.map((i, idx) => {
    const cat = categories.find((c) => c.id === i.category_id);
    return {
      'T/r': idx + 1,
      'Sana': formatDate(i.date),
      'Kategoriya': cat ? cat.name : 'Noma\'lum',
      'Summa (so\'m)': i.amount,
      'To\'lov usuli': i.payment_method || 'Plastik karta',
      'Izoh': i.description || ''
    };
  });
  const wsIncome = XLSX.utils.json_to_sheet(incomeRows);
  XLSX.utils.book_append_sheet(wb, wsIncome, 'Daromadlar');

  // 2. Expenses Sheet
  const expenseRows = expenses.map((e, idx) => {
    const cat = categories.find((c) => c.id === e.category_id);
    return {
      'T/r': idx + 1,
      'Sana': formatDate(e.date),
      'Kategoriya': cat ? cat.name : 'Noma\'lum',
      'Summa (so\'m)': e.amount,
      'To\'lov usuli': e.payment_method || 'Plastik karta',
      'Izoh': e.description || ''
    };
  });
  const wsExpense = XLSX.utils.json_to_sheet(expenseRows);
  XLSX.utils.book_append_sheet(wb, wsExpense, 'Xarajatlar');

  // 3. Debts Sheet
  const debtRows = debts.map((d, idx) => ({
    'T/r': idx + 1,
    'Qarz turi': d.type === 'given' ? 'Berilgan qarz' : 'Olingan qarz',
    'Kimga / Kimdan': d.counterparty,
    'Dastlabki summa (so\'m)': d.initial_amount,
    'Qaytarish muddati': formatDate(d.due_date),
    'Izoh': d.description || ''
  }));
  const wsDebts = XLSX.utils.json_to_sheet(debtRows);
  XLSX.utils.book_append_sheet(wb, wsDebts, 'Qarzlar');

  // 4. Categories Sheet
  const catRows = categories.map((c, idx) => ({
    'T/r': idx + 1,
    'Kategoriya nomi': c.name,
    'Turi': c.type === 'income' ? 'Daromad' : 'Xarajat',
    'Izoh': c.description || ''
  }));
  const wsCats = XLSX.utils.json_to_sheet(catRows);
  XLSX.utils.book_append_sheet(wb, wsCats, 'Kategoriyalar');

  XLSX.writeFile(wb, 'Каримов_Moliyaviy_boshqaruv_tizimi_excel_2_0_versiya_2026_yillik.xlsx');
}

export function generateEmptyTemplateExcel(categories: Category[]) {
  const wb = XLSX.utils.book_new();

  const sampleIncome = [
    { 'Sana': '2026-08-01', 'Kategoriya': 'Ish haqi', 'Summa': 15000000, 'To\'lov usuli': 'Plastik karta', 'Izoh': 'Avgust maoshi' }
  ];
  const sampleExpense = [
    { 'Sana': '2026-08-02', 'Kategoriya': 'Oziq-ovqat', 'Summa': 500000, 'To\'lov usuli': 'Plastik karta', 'Izoh': 'Bozorlik' }
  ];
  const sampleDebts = [
    { 'Qarz turi': 'Berilgan qarz', 'Kimga / Kimdan': 'Alisher Rahimov', 'Dastlabki summa': 3000000, 'Qaytarish muddati': '2026-09-01', 'Izoh': 'Qisqa muddatli qarz' }
  ];

  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sampleIncome), 'Daromadlar');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sampleExpense), 'Xarajatlar');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sampleDebts), 'Qarzlar');

  XLSX.writeFile(wb, 'Каримов_Moliyaviy_boshqaruv_shablon_2026.xlsx');
}

export function exportBackupJSON() {
  const data: Record<string, any> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('pfms_')) {
      try {
        data[key] = JSON.parse(localStorage.getItem(key) || '');
      } catch {
        data[key] = localStorage.getItem(key);
      }
    }
  }

  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `PFMS_Backup_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export async function importBackupJSON(file: File): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const data = JSON.parse(text);
        Object.entries(data).forEach(([key, val]) => {
          if (key.startsWith('pfms_')) {
            localStorage.setItem(key, typeof val === 'string' ? val : JSON.stringify(val));
          }
        });
        resolve(true);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsText(file);
  });
}

export function downloadSampleExcelTemplate() {
  const wb = XLSX.utils.book_new();

  const sampleIncome = [
    { 'Sana': '01.08.2026', 'Kategoriya': 'Oylik ish haqi', 'Summa': 12000000, 'To\'lov usuli': 'Plastik karta', 'Izoh': 'Avgust oyi maoshi' },
    { 'Sana': '10.08.2026', 'Kategoriya': 'Freelance & Loyihalar', 'Summa': 3500000, 'To\'lov usuli': 'Bank o\'tkazmasi', 'Izoh': 'Veb-sayt yaratish' }
  ];
  const sampleExpense = [
    { 'Sana': '02.08.2026', 'Kategoriya': 'Oziq-ovqat va bozor', 'Summa': 850000, 'To\'lov usuli': 'Plastik karta', 'Izoh': 'Bozorlik va oziq-ovqat' },
    { 'Sana': '05.08.2026', 'Kategoriya': 'Transport va yoqilg\'i', 'Summa': 400000, 'To\'lov usuli': 'Plastik karta', 'Izoh': 'Benzin' }
  ];
  const sampleDebts = [
    { 'Qarz turi': 'Berilgan qarz', 'Kimga / Kimdan': 'Alisher Rahimov', 'Dastlabki summa': 3000000, 'Qaytarish muddati': '25.08.2026', 'Izoh': 'Do\'stona yordam' },
    { 'Qarz turi': 'Olingan qarz', 'Kimga / Kimdan': 'Kredit Bank', 'Dastlabki summa': 8000000, 'Qaytarish muddati': '30.12.2026', 'Izoh': 'Mebel uchun' }
  ];

  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sampleIncome), 'Daromadlar');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sampleExpense), 'Xarajatlar');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sampleDebts), 'Qarzlar');

  XLSX.writeFile(wb, 'Moliyaviy_boshqaruv_namuna_shablon.xlsx');
}
