import { UserProfile, Category, Income, Expense, Debt, DebtPayment, Budget, UserSettings, AuditLog } from '../types';

export interface KeepAliveInfo {
  is_active: boolean;
  is_db_connected: boolean;
  database_type: string;
  last_ping_time: string | null;
  last_latency_ms: number | null;
  total_pings: number;
  ping_interval_seconds: number;
  anti_sleep_strategy: string;
}

export class CloudService {
  private static instance: CloudService;
  private keepAliveTimer: any = null;
  private listeners: ((info: KeepAliveInfo) => void)[] = [];
  private lastInfo: KeepAliveInfo = {
    is_active: true,
    is_db_connected: false,
    database_type: 'Checking...',
    last_ping_time: null,
    last_latency_ms: null,
    total_pings: 0,
    ping_interval_seconds: 120,
    anti_sleep_strategy: 'Neon DB SQL Pulse + Render Server Self-Ping (Every 2 Minutes)'
  };

  private constructor() {
    this.startHeartbeat();
  }

  public static getInstance(): CloudService {
    if (!CloudService.instance) {
      CloudService.instance = new CloudService();
    }
    return CloudService.instance;
  }

  public subscribe(listener: (info: KeepAliveInfo) => void) {
    this.listeners.push(listener);
    listener(this.lastInfo);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  public startHeartbeat() {
    if (this.keepAliveTimer) return;

    // Trigger immediate ping
    this.ping();

    // 2-minute recurring interval (120 seconds)
    this.keepAliveTimer = setInterval(() => {
      this.ping();
    }, 120 * 1000);
  }

  public async ping(): Promise<KeepAliveInfo> {
    try {
      const startTime = Date.now();
      const res = await fetch('/api/cloud/keepalive');
      if (res.ok) {
        const json = await res.json();
        if (json?.data) {
          this.lastInfo = {
            ...json.data,
            last_latency_ms: Date.now() - startTime
          };
        }
      }
    } catch (err) {
      console.warn('Client keep-alive ping network check:', err);
    }

    this.listeners.forEach((l) => l(this.lastInfo));
    return this.lastInfo;
  }

  // --- Auth API ---
  public async register(payload: {
    email: string;
    username: string;
    fullName: string;
    password?: string;
    phone?: string;
    role?: string;
    currency?: string;
    language?: string;
  }): Promise<{ success: boolean; message?: string; user?: UserProfile }> {
    try {
      const res = await fetch('/api/cloud/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      return data;
    } catch (err: any) {
      return { success: false, message: 'Serverga ulanishda xatolik: ' + err.message };
    }
  }

  public async login(loginIdentifier: string, password?: string): Promise<{ success: boolean; message?: string; user?: UserProfile }> {
    try {
      const res = await fetch('/api/cloud/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loginIdentifier, password })
      });
      const data = await res.json();
      return data;
    } catch (err: any) {
      return { success: false, message: 'Serverga ulanishda xatolik: ' + err.message };
    }
  }

  // --- Cloud Sync API ---
  public async pullAllData(userId: string) {
    try {
      const res = await fetch(`/api/cloud/sync/pull/${encodeURIComponent(userId)}`);
      if (!res.ok) return null;
      const json = await res.json();
      return json?.data || null;
    } catch {
      return null;
    }
  }

  public async pushAllData(payload: {
    userId: string;
    categories: Category[];
    incomes: Income[];
    expenses: Expense[];
    debts: Debt[];
    debtPayments: DebtPayment[];
    budgets: Budget[];
    settings: UserSettings;
    auditLogs: AuditLog[];
  }) {
    try {
      const res = await fetch('/api/cloud/sync/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }
}

export const cloud = CloudService.getInstance();
