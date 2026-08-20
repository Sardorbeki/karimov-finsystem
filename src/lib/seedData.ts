import {
  UserProfile,
  Category,
  Income,
  Expense,
  Debt,
  DebtPayment,
  Budget,
  UserSettings,
  AuditLog
} from '../types';

export const DEFAULT_USER: UserProfile = {
  id: 'user_karimov_2026',
  email: 'ismoilovsardorbek518@gmail.com',
  username: 'admin',
  password: 'admin123',
  full_name: 'Sardor Karimov',
  phone: '+998 90 123 45 67',
  role: 'bosh_admin',
  bio: 'Karimov Shaxsiy Moliyaviy Boshqaruv Tizimi Bosh Admini & Moliyachi',
  currency: 'UZS',
  language: 'uz',
  timezone: 'Asia/Tashkent',
  last_login: '2026-08-19T02:30:00.000Z',
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-08-19T01:49:00.000Z'
};

export const DEFAULT_SETTINGS: UserSettings = {
  user_id: DEFAULT_USER.id,
  currency: 'UZS',
  language: 'uz',
  timezone: 'Asia/Tashkent',
  default_period: 'this_month',
  notifications_enabled: true,
  budget_alert_threshold: 80,
  dark_mode: false,
  updated_at: '2026-08-19T01:49:00.000Z'
};

export const DEFAULT_INCOME_CATEGORIES: Category[] = [
  {
    id: 'inc_cat_1',
    user_id: DEFAULT_USER.id,
    name: 'Oylik ish haqi',
    type: 'income',
    icon: 'Briefcase',
    color: '#10b981',
    is_default: true,
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z'
  },
  {
    id: 'inc_cat_2',
    user_id: DEFAULT_USER.id,
    name: 'Biznes va Savdo',
    type: 'income',
    icon: 'TrendingUp',
    color: '#059669',
    is_default: true,
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z'
  },
  {
    id: 'inc_cat_3',
    user_id: DEFAULT_USER.id,
    name: 'Freelance & Loyihalar',
    type: 'income',
    icon: 'Laptop',
    color: '#0284c7',
    is_default: true,
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z'
  },
  {
    id: 'inc_cat_4',
    user_id: DEFAULT_USER.id,
    name: 'Investitsiya & Dividend',
    type: 'income',
    icon: 'PieChart',
    color: '#8b5cf6',
    is_default: true,
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z'
  },
  {
    id: 'inc_cat_5',
    user_id: DEFAULT_USER.id,
    name: 'Boshqa daromadlar',
    type: 'income',
    icon: 'PlusCircle',
    color: '#64748b',
    is_default: true,
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z'
  }
];

export const DEFAULT_EXPENSE_CATEGORIES: Category[] = [
  {
    id: 'exp_cat_1',
    user_id: DEFAULT_USER.id,
    name: 'Oziq-ovqat va bozor',
    type: 'expense',
    icon: 'ShoppingCart',
    color: '#ef4444',
    is_default: true,
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z'
  },
  {
    id: 'exp_cat_2',
    user_id: DEFAULT_USER.id,
    name: 'Uy-joy & Kommunal',
    type: 'expense',
    icon: 'Home',
    color: '#f97316',
    is_default: true,
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z'
  },
  {
    id: 'exp_cat_3',
    user_id: DEFAULT_USER.id,
    name: 'Transport va yoqilg\'i',
    type: 'expense',
    icon: 'Car',
    color: '#f59e0b',
    is_default: true,
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z'
  },
  {
    id: 'exp_cat_4',
    user_id: DEFAULT_USER.id,
    name: 'Oila & Ta\'lim',
    type: 'expense',
    icon: 'GraduationCap',
    color: '#3b82f6',
    is_default: true,
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z'
  },
  {
    id: 'exp_cat_5',
    user_id: DEFAULT_USER.id,
    name: 'Sog\'liq va dori-darmon',
    type: 'expense',
    icon: 'HeartPulse',
    color: '#ec4899',
    is_default: true,
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z'
  },
  {
    id: 'exp_cat_6',
    user_id: DEFAULT_USER.id,
    name: 'Kiyim-kechak',
    type: 'expense',
    icon: 'Shirt',
    color: '#6366f1',
    is_default: true,
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z'
  },
  {
    id: 'exp_cat_7',
    user_id: DEFAULT_USER.id,
    name: 'Dam olish & Kafe',
    type: 'expense',
    icon: 'Coffee',
    color: '#14b8a6',
    is_default: true,
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z'
  },
  {
    id: 'exp_cat_8',
    user_id: DEFAULT_USER.id,
    name: 'Xayriya & Ehson',
    type: 'expense',
    icon: 'Heart',
    color: '#a855f7',
    is_default: true,
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z'
  },
  {
    id: 'exp_cat_9',
    user_id: DEFAULT_USER.id,
    name: 'Texnika va uskunalar',
    type: 'expense',
    icon: 'Smartphone',
    color: '#06b6d4',
    is_default: true,
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z'
  },
  {
    id: 'exp_cat_10',
    user_id: DEFAULT_USER.id,
    name: 'Kutilmagan xarajatlar',
    type: 'expense',
    icon: 'AlertCircle',
    color: '#94a3b8',
    is_default: true,
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z'
  }
];

export const DEFAULT_INCOMES: Income[] = [
  {
    id: 'inc_1',
    user_id: DEFAULT_USER.id,
    date: '2026-08-05',
    category_id: 'inc_cat_1',
    amount: 15000000,
    description: 'Avust oyi ish haqi (Asosiy)',
    payment_method: 'Plastik karta',
    is_deleted: false,
    created_at: '2026-08-05T09:00:00Z',
    updated_at: '2026-08-05T09:00:00Z'
  },
  {
    id: 'inc_2',
    user_id: DEFAULT_USER.id,
    date: '2026-08-10',
    category_id: 'inc_cat_3',
    amount: 4800000,
    description: 'Web ilova backend ishlab chiqish',
    payment_method: 'Bank o\'tkazmasi',
    is_deleted: false,
    created_at: '2026-08-10T14:30:00Z',
    updated_at: '2026-08-10T14:30:00Z'
  },
  {
    id: 'inc_3',
    user_id: DEFAULT_USER.id,
    date: '2026-08-15',
    category_id: 'inc_cat_2',
    amount: 6500000,
    description: 'Savdo do\'konidan oylik foyda',
    payment_method: 'Naqd',
    is_deleted: false,
    created_at: '2026-08-15T11:00:00Z',
    updated_at: '2026-08-15T11:00:00Z'
  },
  {
    id: 'inc_4',
    user_id: DEFAULT_USER.id,
    date: '2026-08-18',
    category_id: 'inc_cat_4',
    amount: 1200000,
    description: 'Aksiyalar bo\'yicha choraklik dividend',
    payment_method: 'Plastik karta',
    is_deleted: false,
    created_at: '2026-08-18T16:20:00Z',
    updated_at: '2026-08-18T16:20:00Z'
  },
  // Previous months
  {
    id: 'inc_prev_1',
    user_id: DEFAULT_USER.id,
    date: '2026-07-05',
    category_id: 'inc_cat_1',
    amount: 15000000,
    description: 'Iyul oyi oylik maoshi',
    payment_method: 'Plastik karta',
    is_deleted: false,
    created_at: '2026-07-05T09:00:00Z',
    updated_at: '2026-07-05T09:00:00Z'
  },
  {
    id: 'inc_prev_2',
    user_id: DEFAULT_USER.id,
    date: '2026-07-16',
    category_id: 'inc_cat_2',
    amount: 8200000,
    description: 'Iyul oyidagi ulgurji savdo tushumi',
    payment_method: 'Naqd',
    is_deleted: false,
    created_at: '2026-07-16T12:00:00Z',
    updated_at: '2026-07-16T12:00:00Z'
  },
  {
    id: 'inc_prev_3',
    user_id: DEFAULT_USER.id,
    date: '2026-06-05',
    category_id: 'inc_cat_1',
    amount: 14500000,
    description: 'Iyun oyi maoshi',
    payment_method: 'Plastik karta',
    is_deleted: false,
    created_at: '2026-06-05T09:00:00Z',
    updated_at: '2026-06-05T09:00:00Z'
  }
];

export const DEFAULT_EXPENSES: Expense[] = [
  {
    id: 'exp_1',
    user_id: DEFAULT_USER.id,
    date: '2026-08-02',
    category_id: 'exp_cat_2',
    amount: 2200000,
    description: 'Ijara haqi va kommunal to\'lovlar',
    payment_method: 'Plastik karta',
    is_deleted: false,
    created_at: '2026-08-02T10:00:00Z',
    updated_at: '2026-08-02T10:00:00Z'
  },
  {
    id: 'exp_2',
    user_id: DEFAULT_USER.id,
    date: '2026-08-04',
    category_id: 'exp_cat_1',
    amount: 1650000,
    description: 'Korzinka va dehqon bozoridan oziq-ovqat',
    payment_method: 'Plastik karta',
    is_deleted: false,
    created_at: '2026-08-04T18:30:00Z',
    updated_at: '2026-08-04T18:30:00Z'
  },
  {
    id: 'exp_3',
    user_id: DEFAULT_USER.id,
    date: '2026-08-07',
    category_id: 'exp_cat_3',
    amount: 600000,
    description: 'Avtomobilga yoqilg\'i quyish (AI-95)',
    payment_method: 'Plastik karta',
    is_deleted: false,
    created_at: '2026-08-07T13:10:00Z',
    updated_at: '2026-08-07T13:10:00Z'
  },
  {
    id: 'exp_4',
    user_id: DEFAULT_USER.id,
    date: '2026-08-09',
    category_id: 'exp_cat_7',
    amount: 450000,
    description: 'Oilaviy kechki ovqat (Milliy taomlar)',
    payment_method: 'Plastik karta',
    is_deleted: false,
    created_at: '2026-08-09T20:15:00Z',
    updated_at: '2026-08-09T20:15:00Z'
  },
  {
    id: 'exp_5',
    user_id: DEFAULT_USER.id,
    date: '2026-08-12',
    category_id: 'exp_cat_1',
    amount: 1200000,
    description: 'Haftalik bozorlik va go\'sht mahsulotlari',
    payment_method: 'Naqd',
    is_deleted: false,
    created_at: '2026-08-12T11:45:00Z',
    updated_at: '2026-08-12T11:45:00Z'
  },
  {
    id: 'exp_6',
    user_id: DEFAULT_USER.id,
    date: '2026-08-14',
    category_id: 'exp_cat_4',
    amount: 1800000,
    description: 'Farzandlar ingliz tili va IT kursi to\'lovi',
    payment_method: 'Bank o\'tkazmasi',
    is_deleted: false,
    created_at: '2026-08-14T15:00:00Z',
    updated_at: '2026-08-14T15:00:00Z'
  },
  {
    id: 'exp_7',
    user_id: DEFAULT_USER.id,
    date: '2026-08-16',
    category_id: 'exp_cat_3',
    amount: 450000,
    description: 'Avtomashina moyini almashtirish',
    payment_method: 'Naqd',
    is_deleted: false,
    created_at: '2026-08-16T17:00:00Z',
    updated_at: '2026-08-16T17:00:00Z'
  },
  {
    id: 'exp_8',
    user_id: DEFAULT_USER.id,
    date: '2026-08-17',
    category_id: 'exp_cat_8',
    amount: 500000,
    description: 'Xayriya ehsoni (Mahalla fondi)',
    payment_method: 'Plastik karta',
    is_deleted: false,
    created_at: '2026-08-17T12:00:00Z',
    updated_at: '2026-08-17T12:00:00Z'
  },
  {
    id: 'exp_9',
    user_id: DEFAULT_USER.id,
    date: '2026-08-18',
    category_id: 'exp_cat_5',
    amount: 320000,
    description: 'Dorixona va vitaminlar',
    payment_method: 'Plastik karta',
    is_deleted: false,
    created_at: '2026-08-18T14:10:00Z',
    updated_at: '2026-08-18T14:10:00Z'
  },
  // July expenses
  {
    id: 'exp_prev_1',
    user_id: DEFAULT_USER.id,
    date: '2026-07-03',
    category_id: 'exp_cat_2',
    amount: 2200000,
    description: 'Iyul oyi ijara',
    payment_method: 'Plastik karta',
    is_deleted: false,
    created_at: '2026-07-03T10:00:00Z',
    updated_at: '2026-07-03T10:00:00Z'
  },
  {
    id: 'exp_prev_2',
    user_id: DEFAULT_USER.id,
    date: '2026-07-12',
    category_id: 'exp_cat_1',
    amount: 3800000,
    description: 'Iyul oyi umumiy oziq-ovqat',
    payment_method: 'Plastik karta',
    is_deleted: false,
    created_at: '2026-07-12T12:00:00Z',
    updated_at: '2026-07-12T12:00:00Z'
  },
  {
    id: 'exp_prev_3',
    user_id: DEFAULT_USER.id,
    date: '2026-07-20',
    category_id: 'exp_cat_3',
    amount: 1100000,
    description: 'Iyul oyi transport va benzin',
    payment_method: 'Plastik karta',
    is_deleted: false,
    created_at: '2026-07-20T15:00:00Z',
    updated_at: '2026-07-20T15:00:00Z'
  }
];

export const DEFAULT_DEBTS: Debt[] = [
  {
    id: 'debt_g_1',
    user_id: DEFAULT_USER.id,
    type: 'given', // Men berganman (Receivable)
    counterparty: 'Alisher Rahimov',
    initial_amount: 5000000,
    due_date: '2026-08-10', // Overdue!
    description: 'Biznes loyihasi uchun vaqtinchalik yordam',
    is_deleted: false,
    created_at: '2026-06-10T10:00:00Z',
    updated_at: '2026-08-01T10:00:00Z'
  },
  {
    id: 'debt_g_2',
    user_id: DEFAULT_USER.id,
    type: 'given',
    counterparty: 'Rustam Akramov',
    initial_amount: 3000000,
    due_date: '2026-09-01',
    description: 'Avtomobil ta\'miri uchun so\'ragan',
    is_deleted: false,
    created_at: '2026-07-15T14:00:00Z',
    updated_at: '2026-08-05T14:00:00Z'
  },
  {
    id: 'debt_g_3',
    user_id: DEFAULT_USER.id,
    type: 'given',
    counterparty: 'Bekzod Karimov',
    initial_amount: 1500000,
    due_date: '2026-08-01', // fully paid!
    description: 'Telefon olish uchun',
    is_deleted: false,
    created_at: '2026-05-20T11:00:00Z',
    updated_at: '2026-08-01T11:00:00Z'
  },
  {
    id: 'debt_r_1',
    user_id: DEFAULT_USER.id,
    type: 'received', // Men olganman (Payable)
    counterparty: 'Ipak Yo\'li Bank (Kredit)',
    initial_amount: 12000000,
    due_date: '2026-12-31',
    description: 'Iste\'mol krediti',
    is_deleted: false,
    created_at: '2026-01-10T10:00:00Z',
    updated_at: '2026-08-10T10:00:00Z'
  },
  {
    id: 'debt_r_2',
    user_id: DEFAULT_USER.id,
    type: 'received',
    counterparty: 'Akam (Otabek aka)',
    initial_amount: 4000000,
    due_date: '2026-09-15',
    description: 'Xonadon ta\'miri uchun olingan qarz',
    is_deleted: false,
    created_at: '2026-07-01T12:00:00Z',
    updated_at: '2026-08-01T12:00:00Z'
  }
];

export const DEFAULT_DEBT_PAYMENTS: DebtPayment[] = [
  // Repayments for debt_g_1 (Alisher: 5m -> paid 2m, remaining 3m, overdue)
  {
    id: 'pay_g_1_1',
    debt_id: 'debt_g_1',
    user_id: DEFAULT_USER.id,
    payment_date: '2026-07-10',
    amount: 1000000,
    note: '1-qism to\'lov',
    payment_method: 'Plastik karta',
    created_at: '2026-07-10T15:00:00Z',
    updated_at: '2026-07-10T15:00:00Z'
  },
  {
    id: 'pay_g_1_2',
    debt_id: 'debt_g_1',
    user_id: DEFAULT_USER.id,
    payment_date: '2026-08-01',
    amount: 1000000,
    note: '2-qism to\'lov',
    payment_method: 'Naqd',
    created_at: '2026-08-01T18:00:00Z',
    updated_at: '2026-08-01T18:00:00Z'
  },
  // Repayments for debt_g_2 (Rustam: 3m -> paid 1m)
  {
    id: 'pay_g_2_1',
    debt_id: 'debt_g_2',
    user_id: DEFAULT_USER.id,
    payment_date: '2026-08-05',
    amount: 1000000,
    note: 'Boshlang\'ich qaytarish',
    payment_method: 'Plastik karta',
    created_at: '2026-08-05T12:00:00Z',
    updated_at: '2026-08-05T12:00:00Z'
  },
  // Repayments for debt_g_3 (Bekzod: 1.5m -> paid in full 1.5m)
  {
    id: 'pay_g_3_1',
    debt_id: 'debt_g_3',
    user_id: DEFAULT_USER.id,
    payment_date: '2026-07-15',
    amount: 1500000,
    note: 'To\'liq qaytarildi',
    payment_method: 'Bank o\'tkazmasi',
    created_at: '2026-07-15T16:00:00Z',
    updated_at: '2026-07-15T16:00:00Z'
  },
  // Repayments for debt_r_1 (Bank Kredit: 12m -> paid 4m in monthly payments)
  {
    id: 'pay_r_1_1',
    debt_id: 'debt_r_1',
    user_id: DEFAULT_USER.id,
    payment_date: '2026-05-10',
    amount: 1500000,
    note: 'May oyi kredit to\'lovi',
    payment_method: 'Plastik karta',
    created_at: '2026-05-10T10:00:00Z',
    updated_at: '2026-05-10T10:00:00Z'
  },
  {
    id: 'pay_r_1_2',
    debt_id: 'debt_r_1',
    user_id: DEFAULT_USER.id,
    payment_date: '2026-06-10',
    amount: 1500000,
    note: 'Iyun oyi kredit to\'lovi',
    payment_method: 'Plastik karta',
    created_at: '2026-06-10T10:00:00Z',
    updated_at: '2026-06-10T10:00:00Z'
  },
  {
    id: 'pay_r_1_3',
    debt_id: 'debt_r_1',
    user_id: DEFAULT_USER.id,
    payment_date: '2026-07-10',
    amount: 1500000,
    note: 'Iyul oyi kredit to\'lovi',
    payment_method: 'Plastik karta',
    created_at: '2026-07-10T10:00:00Z',
    updated_at: '2026-07-10T10:00:00Z'
  },
  {
    id: 'pay_r_1_4',
    debt_id: 'debt_r_1',
    user_id: DEFAULT_USER.id,
    payment_date: '2026-08-10',
    amount: 1500000,
    note: 'Avgust oyi kredit to\'lovi',
    payment_method: 'Plastik karta',
    created_at: '2026-08-10T10:00:00Z',
    updated_at: '2026-08-10T10:00:00Z'
  },
  // Repayments for debt_r_2 (Akam: 4m -> paid 2m)
  {
    id: 'pay_r_2_1',
    debt_id: 'debt_r_2',
    user_id: DEFAULT_USER.id,
    payment_date: '2026-08-01',
    amount: 2000000,
    note: 'Qarzning yarmi berildi',
    payment_method: 'Naqd',
    created_at: '2026-08-01T14:00:00Z',
    updated_at: '2026-08-01T14:00:00Z'
  }
];

export const DEFAULT_BUDGETS: Budget[] = [
  {
    id: 'bud_1',
    user_id: DEFAULT_USER.id,
    category_id: 'exp_cat_1', // Oziq-ovqat
    period_type: 'monthly',
    period_key: '2026-08',
    limit_amount: 4000000,
    created_at: '2026-08-01T00:00:00Z',
    updated_at: '2026-08-01T00:00:00Z'
  },
  {
    id: 'bud_2',
    user_id: DEFAULT_USER.id,
    category_id: 'exp_cat_2', // Uy-joy
    period_type: 'monthly',
    period_key: '2026-08',
    limit_amount: 2500000,
    created_at: '2026-08-01T00:00:00Z',
    updated_at: '2026-08-01T00:00:00Z'
  },
  {
    id: 'bud_3',
    user_id: DEFAULT_USER.id,
    category_id: 'exp_cat_3', // Transport
    period_type: 'monthly',
    period_key: '2026-08',
    limit_amount: 1500000,
    created_at: '2026-08-01T00:00:00Z',
    updated_at: '2026-08-01T00:00:00Z'
  },
  {
    id: 'bud_4',
    user_id: DEFAULT_USER.id,
    category_id: 'exp_cat_4', // Ta'lim
    period_type: 'monthly',
    period_key: '2026-08',
    limit_amount: 2000000,
    created_at: '2026-08-01T00:00:00Z',
    updated_at: '2026-08-01T00:00:00Z'
  },
  {
    id: 'bud_5',
    user_id: DEFAULT_USER.id,
    category_id: 'exp_cat_7', // Kafe & Dam olish
    period_type: 'monthly',
    period_key: '2026-08',
    limit_amount: 800000,
    created_at: '2026-08-01T00:00:00Z',
    updated_at: '2026-08-01T00:00:00Z'
  }
];

export const DEFAULT_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log_1',
    user_id: DEFAULT_USER.id,
    entity_type: 'INCOME',
    entity_id: 'inc_1',
    action: 'CREATE',
    title: 'Yangi daromad kiritildi',
    details: '15 000 000 so\'m - Oylik ish haqi (Avust oyi)',
    timestamp: '2026-08-05T09:00:00Z'
  },
  {
    id: 'log_2',
    user_id: DEFAULT_USER.id,
    entity_type: 'REPAYMENT',
    entity_id: 'pay_g_1_2',
    action: 'REPAYMENT',
    title: 'Qarz to\'lovi qabul qilindi',
    details: 'Alisher Rahimov 1 000 000 so\'m qaytardi',
    timestamp: '2026-08-01T18:00:00Z'
  },
  {
    id: 'log_3',
    user_id: DEFAULT_USER.id,
    entity_type: 'BUDGET',
    entity_id: 'bud_1',
    action: 'CREATE',
    title: 'Avgust oyi byudjeti tasdiqlandi',
    details: 'Oziq-ovqat va bozor uchun 4 000 000 so\'m limit',
    timestamp: '2026-08-01T00:00:00Z'
  }
];
