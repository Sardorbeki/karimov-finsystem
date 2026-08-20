import { AIActionPayload } from '../types';
import { exportFullMasterExcel, exportIncomesModuleExcel, exportExpensesModuleExcel, exportDebtsModuleExcel, exportBudgetsModuleExcel } from './excelExportEngine';

export interface ActionExecutorContext {
  categories: any[];
  allCategories: any[];
  incomes: any[];
  expenses: any[];
  debts: any[];
  budgets: any[];
  summary: any;
  settings: any;
  addIncome: (income: any) => void;
  addExpense: (expense: any) => void;
  addDebt: (debt: any) => void;
  addDebtPayment: (payment: any) => void;
  saveBudget: (budget: any) => void;
  saveCategory: (category: any) => void;
  updateSettings: (settings: any) => void;
  updateProfile?: (profile: any) => void;
  setActiveTab?: (tab: string) => void;
}

export async function executeAIActions(
  actions: AIActionPayload[],
  ctx: ActionExecutorContext
): Promise<AIActionPayload[]> {
  const executed: AIActionPayload[] = [];
  const todayStr = new Date().toISOString().split('T')[0];

  for (const action of actions) {
    try {
      const p = action.params || {};

      switch (action.type) {
        case 'ADD_INCOME': {
          let categoryId = p.category_id;
          if (!categoryId && p.category_name) {
            const cat = ctx.categories.find(
              (c) => c.type === 'income' && c.name.toLowerCase().includes(p.category_name.toLowerCase())
            ) || ctx.categories.find((c) => c.type === 'income');
            categoryId = cat ? cat.id : 'inc_cat_1';
          }
          if (!categoryId) {
            const incCat = ctx.categories.find((c) => c.type === 'income');
            categoryId = incCat ? incCat.id : 'inc_cat_1';
          }

          const amount = Number(p.amount) || 0;
          if (amount > 0) {
            ctx.addIncome({
              date: p.date || todayStr,
              category_id: categoryId,
              amount,
              description: p.description || 'AI orqali kiritilgan daromad',
              payment_method: p.payment_method || 'Plastik karta'
            });
            executed.push({
              ...action,
              status: 'success',
              summary: `${amount.toLocaleString('uz-UZ')} UZS daromad muvaffaqiyatli qo'shildi`
            });
          }
          break;
        }

        case 'ADD_EXPENSE': {
          let categoryId = p.category_id;
          if (!categoryId && p.category_name) {
            const cat = ctx.categories.find(
              (c) => c.type === 'expense' && (
                c.name.toLowerCase().includes(p.category_name.toLowerCase()) ||
                p.category_name.toLowerCase().includes(c.name.toLowerCase())
              )
            );
            if (cat) categoryId = cat.id;
          }
          if (!categoryId) {
            const expCat = ctx.categories.find((c) => c.type === 'expense');
            categoryId = expCat ? expCat.id : 'exp_cat_1';
          }

          const amount = Number(p.amount) || 0;
          if (amount > 0) {
            ctx.addExpense({
              date: p.date || todayStr,
              category_id: categoryId,
              amount,
              description: p.description || 'AI orqali kiritilgan xarajat',
              payment_method: p.payment_method || 'Plastik karta'
            });
            executed.push({
              ...action,
              status: 'success',
              summary: `${amount.toLocaleString('uz-UZ')} UZS xarajat muvaffaqiyatli kiritildi`
            });
          }
          break;
        }

        case 'ADD_DEBT': {
          const amount = Number(p.initial_amount || p.amount) || 0;
          if (amount > 0) {
            const dueDate = p.due_date || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
            ctx.addDebt({
              type: p.type === 'received' ? 'received' : 'given',
              counterparty: p.counterparty || 'Tanish / Hamkor',
              initial_amount: amount,
              due_date: dueDate,
              description: p.description || 'AI orqali qayd etilgan qarz'
            });
            executed.push({
              ...action,
              status: 'success',
              summary: `${amount.toLocaleString('uz-UZ')} UZS ${p.type === 'received' ? 'olingan' : 'berilgan'} qarz qayd etildi`
            });
          }
          break;
        }

        case 'ADD_DEBT_PAYMENT': {
          const amount = Number(p.amount) || 0;
          let targetDebt = null;
          if (p.debt_id) {
            targetDebt = ctx.debts.find((d) => d.id === p.debt_id);
          } else if (p.counterparty) {
            targetDebt = ctx.debts.find((d) => d.counterparty.toLowerCase().includes(p.counterparty.toLowerCase()) && d.remaining_amount > 0);
          }
          if (!targetDebt && ctx.debts.length > 0) {
            targetDebt = ctx.debts.find((d) => d.remaining_amount > 0) || ctx.debts[0];
          }

          if (targetDebt && amount > 0) {
            ctx.addDebtPayment({
              debt_id: targetDebt.id,
              payment_date: p.payment_date || todayStr,
              amount: Math.min(amount, targetDebt.remaining_amount || amount),
              note: p.note || 'AI orqali kiritilgan qarz to\'lovi',
              payment_method: p.payment_method || 'Plastik karta'
            });
            executed.push({
              ...action,
              status: 'success',
              summary: `${targetDebt.counterparty} qarziga ${amount.toLocaleString('uz-UZ')} UZS to'lov qo'shildi`
            });
          }
          break;
        }

        case 'SET_BUDGET': {
          let categoryId = p.category_id;
          if (!categoryId && p.category_name) {
            const cat = ctx.categories.find((c) => c.name.toLowerCase().includes(p.category_name.toLowerCase()));
            if (cat) categoryId = cat.id;
          }
          if (categoryId) {
            const limit = Number(p.limit_amount || p.amount) || 1000000;
            ctx.saveBudget({
              category_id: categoryId,
              period_type: p.period_type || 'monthly',
              period_key: p.period_key || '2026-08',
              limit_amount: limit
            });
            executed.push({
              ...action,
              status: 'success',
              summary: `Byudjet limiti ${limit.toLocaleString('uz-UZ')} UZS ga o'rnatildi`
            });
          }
          break;
        }

        case 'ADD_CATEGORY': {
          if (p.name) {
            ctx.saveCategory({
              name: p.name,
              type: p.type === 'income' ? 'income' : 'expense',
              icon: p.icon || 'Folder',
              color: p.color || (p.type === 'income' ? '#10b981' : '#f43f5e'),
              description: p.description || 'AI orqali yaratilgan kategoriya',
              is_active: true
            });
            executed.push({
              ...action,
              status: 'success',
              summary: `'${p.name}' nomli yangi kategoriya yaratildi`
            });
          }
          break;
        }

        case 'UPDATE_SETTINGS': {
          ctx.updateSettings(p);
          executed.push({
            ...action,
            status: 'success',
            summary: "Tizim sozlamalari yangilandi"
          });
          break;
        }

        case 'EXPORT_EXCEL': {
          const mod = p.module || 'master';
          if (mod === 'master') {
            await exportFullMasterExcel({
              summary: ctx.summary,
              incomes: ctx.incomes,
              expenses: ctx.expenses,
              debts: ctx.debts,
              debtPayments: [],
              budgets: ctx.budgets,
              categories: ctx.categories,
              year: '2026'
            });
          } else if (mod === 'income') {
            await exportIncomesModuleExcel(ctx.incomes, ctx.categories);
          } else if (mod === 'expense') {
            await exportExpensesModuleExcel(ctx.expenses, ctx.categories);
          } else if (mod === 'debt') {
            await exportDebtsModuleExcel(ctx.debts);
          } else if (mod === 'budget') {
            await exportBudgetsModuleExcel(ctx.budgets);
          }
          executed.push({
            ...action,
            status: 'success',
            summary: "Excel kitobi yuklab olindi"
          });
          break;
        }

        default:
          break;
      }
    } catch (err: any) {
      console.error('Error executing AI action:', err);
      executed.push({
        ...action,
        status: 'failed',
        error: err.message
      });
    }
  }

  return executed;
}

export function parseAIActionsFromText(text: string): { cleanText: string; actions: AIActionPayload[] } {
  const jsonMatch = text.match(/```json_actions\s*([\s\S]*?)\s*```/);
  if (!jsonMatch) {
    return { cleanText: text, actions: [] };
  }

  try {
    const rawJson = jsonMatch[1].trim();
    const actions = JSON.parse(rawJson) as AIActionPayload[];
    const cleanText = text.replace(/```json_actions[\s\S]*?```/, '').trim();
    return { cleanText, actions };
  } catch (e) {
    console.warn('Failed to parse AI action JSON:', e);
    return { cleanText: text, actions: [] };
  }
}

export function generateClientAIResponse(message: string, currency: string = 'UZS'): string {
  const lower = message.toLowerCase();
  const todayStr = new Date().toISOString().split('T')[0];

  if (lower.includes('xarajat') || lower.includes('sarfladim') || lower.includes('berdim') || lower.includes('sotib oldim') || lower.includes('tushlik') || lower.includes('taksi') || lower.includes('harajat')) {
    const numMatch = message.match(/\d+[\d\s.,]*/);
    let amount = numMatch ? parseFloat(numMatch[0].replace(/\s+/g, '').replace(/,/g, '')) : 45000;
    let catName = 'Oziq-ovqat';
    if (lower.includes('taksi') || lower.includes('benzin') || lower.includes('yo\'l')) catName = 'Transport';
    if (lower.includes('kiyim') || lower.includes('poyabzal')) catName = 'Kiyim-kechak';
    if (lower.includes('uy') || lower.includes('ijara') || lower.includes('kommunal')) catName = 'Uy-joy & Kommunal';
    if (lower.includes('dorixona') || lower.includes('shifokor')) catName = 'Salomatlik';

    return `Sizning xarajatingiz tizimga muvaffaqiyatli kiritildi! 💳

- **Summa**: ${amount.toLocaleString('uz-UZ')} ${currency}
- **Kategoriya**: ${catName}
- **Sana**: ${todayStr}
- **Izoh**: ${message}

\`\`\`json_actions
[
  {
    "type": "ADD_EXPENSE",
    "params": {
      "amount": ${amount},
      "category_name": "${catName}",
      "description": "${message.replace(/"/g, "'")}",
      "payment_method": "Plastik karta",
      "date": "${todayStr}"
    },
    "summary": "${amount.toLocaleString('uz-UZ')} ${currency} xarajat '${catName}' kategoriyasiga qo'shildi"
  }
]
\`\`\``;
  }

  if (lower.includes('daromad') || lower.includes('maosh') || lower.includes('oylik') || lower.includes('pul tushdi') || lower.includes('topdim') || lower.includes('bonus')) {
    const numMatch = message.match(/\d+[\d\s.,]*/);
    let amount = numMatch ? parseFloat(numMatch[0].replace(/\s+/g, '').replace(/,/g, '')) : 10000000;
    let catName = 'Oylik Maosh';
    if (lower.includes('biznes') || lower.includes('savdo')) catName = 'Biznes & Savdo';
    if (lower.includes('frilans') || lower.includes('loyixa')) catName = 'Frilans / Dasturlash';

    return `Tabriklayman! Yangi daromad muvaffaqiyatli hisobga olindi 💰

- **Summa**: ${amount.toLocaleString('uz-UZ')} ${currency}
- **Kategoriya**: ${catName}
- **Sana**: ${todayStr}
- **To'lov usuli**: Plastik karta

\`\`\`json_actions
[
  {
    "type": "ADD_INCOME",
    "params": {
      "amount": ${amount},
      "category_name": "${catName}",
      "description": "${message.replace(/"/g, "'")}",
      "payment_method": "Plastik karta",
      "date": "${todayStr}"
    },
    "summary": "${amount.toLocaleString('uz-UZ')} ${currency} daromad '${catName}' kategoriyasiga qo'shildi"
  }
]
\`\`\``;
  }

  if (lower.includes('excel') || lower.includes('yuklab') || lower.includes('fayl') || lower.includes('hisobot')) {
    return `Albatta! Siz so'ragan Master Excel kitobini hoziroq tayyorlayapman 📊

\`\`\`json_actions
[
  {
    "type": "EXPORT_EXCEL",
    "params": {
      "module": "master"
    },
    "summary": "Master Excel 2.0 fayli yuklab olishga tayyorlandi"
  }
]
\`\`\`

Faylingiz yuklab olinmoqda!`;
  }

  return `Assalomu alaykum! Men sizning **Sun'iy Intellekt Moliyaviy Boshqaruvchi** yordamchingizman. 🤖
Quyidagi amallarni xohlagan vaqtda yozib buyruq berishingiz mumkin:
- Xarajat yoki daromad kiritish
- Qarz yozish yoki to'lovni yopish
- Byudjet belgilash
- Excel hisobotlarni yuklash`;
}
