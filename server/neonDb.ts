import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Lazy PostgreSQL Pool initialization
let pool: pg.Pool | null = null;
let isConnected = false;
let lastPingTime: string | null = null;
let lastPingLatencyMs: number | null = null;
let totalPingsCount = 0;
let isKeepAliveActive = false;

export function getDbPool(): pg.Pool | null {
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!connectionString) {
    return null;
  }

  if (!pool) {
    try {
      pool = new Pool({
        connectionString,
        ssl: {
          rejectUnauthorized: false
        },
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
      });

      pool.on('error', (err) => {
        console.error('Neon PostgreSQL Pool Error:', err);
        isConnected = false;
      });
    } catch (err) {
      console.error('Failed to create Neon PostgreSQL pool:', err);
      return null;
    }
  }

  return pool;
}

export async function initNeonDatabase() {
  const p = getDbPool();
  if (!p) {
    console.log('ℹ️ DATABASE_URL is not set. System running with resilient memory/local storage fallback.');
    return false;
  }

  try {
    const client = await p.connect();
    try {
      console.log('⚡ Connecting to Neon.tech PostgreSQL database...');

      // 1. Users table with strict unique constraints
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id VARCHAR(100) PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          username VARCHAR(100) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          full_name VARCHAR(255) NOT NULL,
          phone VARCHAR(50),
          role VARCHAR(50) DEFAULT 'bosh_admin',
          bio TEXT,
          currency VARCHAR(10) DEFAULT 'UZS',
          language VARCHAR(10) DEFAULT 'uz',
          timezone VARCHAR(50) DEFAULT 'Asia/Tashkent',
          last_login TIMESTAMPTZ,
          created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // 2. Categories table
      await client.query(`
        CREATE TABLE IF NOT EXISTS categories (
          id VARCHAR(100) PRIMARY KEY,
          user_id VARCHAR(100) NOT NULL,
          name VARCHAR(255) NOT NULL,
          type VARCHAR(20) NOT NULL,
          icon VARCHAR(50) DEFAULT 'Tag',
          color VARCHAR(30) DEFAULT '#10b981',
          is_default BOOLEAN DEFAULT false,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_categories_user ON categories(user_id);
      `);

      // 3. Incomes table
      await client.query(`
        CREATE TABLE IF NOT EXISTS incomes (
          id VARCHAR(100) PRIMARY KEY,
          user_id VARCHAR(100) NOT NULL,
          category_id VARCHAR(100) NOT NULL,
          amount NUMERIC(15, 2) NOT NULL,
          date DATE NOT NULL,
          description TEXT,
          payment_method VARCHAR(50) DEFAULT 'Plastik karta',
          is_recurring BOOLEAN DEFAULT false,
          created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_incomes_user_date ON incomes(user_id, date);
      `);

      // 4. Expenses table
      await client.query(`
        CREATE TABLE IF NOT EXISTS expenses (
          id VARCHAR(100) PRIMARY KEY,
          user_id VARCHAR(100) NOT NULL,
          category_id VARCHAR(100) NOT NULL,
          amount NUMERIC(15, 2) NOT NULL,
          date DATE NOT NULL,
          description TEXT,
          payment_method VARCHAR(50) DEFAULT 'Plastik karta',
          is_essential BOOLEAN DEFAULT false,
          is_recurring BOOLEAN DEFAULT false,
          created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_expenses_user_date ON expenses(user_id, date);
      `);

      // 5. Debts table
      await client.query(`
        CREATE TABLE IF NOT EXISTS debts (
          id VARCHAR(100) PRIMARY KEY,
          user_id VARCHAR(100) NOT NULL,
          type VARCHAR(20) NOT NULL,
          counterparty VARCHAR(255) NOT NULL,
          initial_amount NUMERIC(15, 2) NOT NULL,
          due_date DATE NOT NULL,
          status VARCHAR(20) DEFAULT 'unpaid',
          description TEXT,
          created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_debts_user ON debts(user_id);
      `);

      // 6. Debt Payments table
      await client.query(`
        CREATE TABLE IF NOT EXISTS debt_payments (
          id VARCHAR(100) PRIMARY KEY,
          debt_id VARCHAR(100) NOT NULL,
          user_id VARCHAR(100) NOT NULL,
          amount NUMERIC(15, 2) NOT NULL,
          payment_date DATE NOT NULL,
          payment_method VARCHAR(50) DEFAULT 'Plastik karta',
          note TEXT,
          created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_debt_payments_debt ON debt_payments(debt_id);
      `);

      // 7. Budgets table
      await client.query(`
        CREATE TABLE IF NOT EXISTS budgets (
          id VARCHAR(100) PRIMARY KEY,
          user_id VARCHAR(100) NOT NULL,
          category_id VARCHAR(100) NOT NULL,
          period_key VARCHAR(20) NOT NULL,
          limit_amount NUMERIC(15, 2) NOT NULL,
          created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(user_id, category_id, period_key)
        );
      `);

      // 8. Audit Logs table
      await client.query(`
        CREATE TABLE IF NOT EXISTS audit_logs (
          id VARCHAR(100) PRIMARY KEY,
          user_id VARCHAR(100) NOT NULL,
          entity_type VARCHAR(50) NOT NULL,
          entity_id VARCHAR(100) NOT NULL,
          action_type VARCHAR(20) NOT NULL,
          summary TEXT NOT NULL,
          details TEXT,
          ip_address VARCHAR(50),
          created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
      `);

      // 9. User Settings table
      await client.query(`
        CREATE TABLE IF NOT EXISTS user_settings (
          user_id VARCHAR(100) PRIMARY KEY,
          currency VARCHAR(10) DEFAULT 'UZS',
          language VARCHAR(10) DEFAULT 'uz',
          timezone VARCHAR(50) DEFAULT 'Asia/Tashkent',
          default_period VARCHAR(30) DEFAULT 'this_month',
          notifications_enabled BOOLEAN DEFAULT true,
          budget_alert_threshold INTEGER DEFAULT 80,
          dark_mode BOOLEAN DEFAULT false,
          updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // 10. Keep-Alive Heartbeat Log table (for monitoring anti-sleep pings)
      await client.query(`
        CREATE TABLE IF NOT EXISTS keepalive_logs (
          id SERIAL PRIMARY KEY,
          ping_type VARCHAR(50) DEFAULT 'NEON_HEARTBEAT',
          status VARCHAR(20) DEFAULT 'OK',
          latency_ms INTEGER,
          created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        );
      `);

      isConnected = true;
      console.log('✅ Neon.tech PostgreSQL tables successfully verified and initialized!');
      return true;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('⚠️ Neon.tech PostgreSQL connection error:', err);
    isConnected = false;
    return false;
  }
}

// ----------------------------------------------------------------------
// ANTI-SLEEP HEARTBEAT ENGINE (Keep Neon.tech & Render.com Awake 24/7)
// Executes every 2 minutes (120,000 ms)
// ----------------------------------------------------------------------
export function startKeepAliveHeartbeat() {
  if (isKeepAliveActive) return;
  isKeepAliveActive = true;

  console.log('🚀 Anti-Sleep Heartbeat Engine started: Pinging every 2 minutes (120s)...');

  // Run initial ping immediately
  executeKeepAlivePing();

  // Set recurring 2-minute interval (120,000 ms)
  setInterval(() => {
    executeKeepAlivePing();
  }, 120 * 1000);
}

export async function executeKeepAlivePing() {
  const startTime = Date.now();
  totalPingsCount++;
  lastPingTime = new Date().toISOString();

  let dbOk = false;
  const p = getDbPool();

  if (p) {
    try {
      // Direct SQL ping to prevent Neon compute sleep
      const res = await p.query('SELECT 1 as alive, NOW() as current_time;');
      if (res.rows && res.rows.length > 0) {
        dbOk = true;
        isConnected = true;
      }
    } catch (err: any) {
      console.warn('Keep-alive DB ping warning (reconnecting):', err?.message || err);
      isConnected = false;
    }
  }

  // Self-ping Render web server endpoint if host url is configured
  const appUrl = process.env.APP_URL || process.env.RENDER_EXTERNAL_URL;
  if (appUrl) {
    try {
      const pingUrl = appUrl.endsWith('/') ? `${appUrl}api/health` : `${appUrl}/api/health`;
      fetch(pingUrl, { method: 'GET' }).catch(() => {});
    } catch {
      // Ignore network transport warnings
    }
  }

  lastPingLatencyMs = Date.now() - startTime;
  return {
    success: true,
    db_connected: isConnected,
    latency_ms: lastPingLatencyMs,
    timestamp: lastPingTime,
    total_pings: totalPingsCount
  };
}

export function getKeepAliveStatus() {
  return {
    is_active: isKeepAliveActive,
    is_db_connected: isConnected,
    database_type: process.env.DATABASE_URL ? 'Neon.tech PostgreSQL' : 'Memory/Local Fallback',
    last_ping_time: lastPingTime,
    last_latency_ms: lastPingLatencyMs,
    total_pings: totalPingsCount,
    ping_interval_seconds: 120,
    anti_sleep_strategy: 'Neon DB SQL Pulse + Render Server Self-Ping (Every 2 Minutes)'
  };
}
