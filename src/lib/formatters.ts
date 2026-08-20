import { Currency, DebtStatus, BudgetStatus } from '../types';

export function formatCurrency(amount: number, currency: Currency = 'UZS'): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    amount = 0;
  }
  
  // Format with thousands separated by space
  const rounded = Math.round(amount);
  const isNegative = rounded < 0;
  const absAmount = Math.abs(rounded);
  const formattedNumber = absAmount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

  const sign = isNegative ? '-' : '';

  switch (currency) {
    case 'UZS':
      return `${sign}${formattedNumber} so'm`;
    case 'USD':
      return `${sign}$${formattedNumber}`;
    case 'EUR':
      return `${sign}€${formattedNumber}`;
    case 'RUB':
      return `${sign}${formattedNumber} ₽`;
    default:
      return `${sign}${formattedNumber} so'm`;
  }
}

export function formatPercentage(value: number, decimals: number = 1): string {
  if (isNaN(value) || value === null || value === undefined) return '0%';
  return `${value.toFixed(decimals)}%`;
}

export function formatDate(dateString: string): string {
  if (!dateString) return '';
  try {
    const parts = dateString.split('T')[0].split('-');
    if (parts.length === 3) {
      const [year, month, day] = parts;
      return `${day.padStart(2, '0')}.${month.padStart(2, '0')}.${year}`;
    }
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}.${month}.${year}`;
  } catch {
    return dateString;
  }
}

export function toInputDateFormat(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getDebtStatusLabel(status: DebtStatus): { label: string; color: string; bg: string } {
  switch (status) {
    case 'paid':
      return { label: "To'langan", color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' };
    case 'partially_paid':
      return { label: "Qisman to'langan", color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' };
    case 'overdue':
      return { label: "Muddati o'tgan", color: 'text-rose-700', bg: 'bg-rose-50 border-rose-200' };
    case 'unpaid':
    default:
      return { label: "To'lanmagan", color: 'text-slate-700', bg: 'bg-slate-100 border-slate-200' };
  }
}

export function getBudgetStatusLabel(status: BudgetStatus): { label: string; color: string; bg: string } {
  switch (status) {
    case 'on_track':
      return { label: 'Byudjet ichida', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' };
    case 'warning':
      return { label: 'Ogohlantirish', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' };
    case 'exceeded':
      return { label: 'Byudjet oshdi', color: 'text-rose-700', bg: 'bg-rose-50 border-rose-200' };
    default:
      return { label: 'Byudjet ichida', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' };
  }
}

export function calculateDateDifferenceDays(date1: string, date2: string = toInputDateFormat()): number {
  const d1 = new Date(date1.split('T')[0]);
  const d2 = new Date(date2.split('T')[0]);
  const diffTime = d2.getTime() - d1.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}
