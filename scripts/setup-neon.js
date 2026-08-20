import pg from 'pg';

const { Pool } = pg;

const connectionString = "postgresql://neondb_owner:npg_DPEfuB63jhWF@ep-red-cell-ayayoar2-pooler.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require";

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  console.log("Connecting to Neon.tech PostgreSQL...");
  const client = await pool.connect();
  try {
    console.log("Creating database schema...");

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

      CREATE TABLE IF NOT EXISTS debts (
        id VARCHAR(100) PRIMARY KEY,
        user_id VARCHAR(100) NOT NULL,
        type VARCHAR(20) NOT NULL,
        counterparty VARCHAR(255) NOT NULL,
        initial_amount NUMERIC(15, 2) NOT NULL,
        due_date DATE NOT NULL,
        status VARCHAR(20) DEFAULT 'unpaid',
        interest_rate NUMERIC(5, 2) DEFAULT 0,
        notes TEXT,
        phone VARCHAR(50),
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_debts_user_status ON debts(user_id, status);

      CREATE TABLE IF NOT EXISTS debt_payments (
        id VARCHAR(100) PRIMARY KEY,
        debt_id VARCHAR(100) NOT NULL,
        user_id VARCHAR(100) NOT NULL,
        amount NUMERIC(15, 2) NOT NULL,
        payment_date DATE NOT NULL,
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_debt_payments_debt ON debt_payments(debt_id);

      CREATE TABLE IF NOT EXISTS budgets (
        id VARCHAR(100) PRIMARY KEY,
        user_id VARCHAR(100) NOT NULL,
        category_id VARCHAR(100) NOT NULL,
        amount_limit NUMERIC(15, 2) NOT NULL,
        period_month VARCHAR(7) NOT NULL,
        alert_threshold INTEGER DEFAULT 80,
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (user_id, category_id, period_month)
      );

      CREATE TABLE IF NOT EXISTS user_settings (
        user_id VARCHAR(100) PRIMARY KEY,
        currency VARCHAR(10) DEFAULT 'UZS',
        budget_alert_threshold INTEGER DEFAULT 80,
        notifications_enabled BOOLEAN DEFAULT true,
        debt_reminder_days INTEGER DEFAULT 3,
        pro_analytics_mode BOOLEAN DEFAULT true,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS audit_logs (
        id VARCHAR(100) PRIMARY KEY,
        user_id VARCHAR(100) NOT NULL,
        entity_type VARCHAR(50) NOT NULL,
        entity_id VARCHAR(100) NOT NULL,
        action VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        details TEXT,
        timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id, timestamp DESC);
    `);

    // Insert standard admin if not exists
    await client.query(`
      INSERT INTO users (id, email, username, password, full_name, role)
      VALUES ('usr_admin_default', 'admin@karimov.uz', 'admin', 'admin123', 'Sardor Karimov (Bosh Moliyachi)', 'bosh_admin')
      ON CONFLICT (username) DO NOTHING;
    `);

    const tables = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name");
    console.log("SUCCESS! Tables created in Neon.tech PostgreSQL database:");
    console.log(tables.rows.map(r => r.table_name).join(", "));
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error("Neon setup failed:", err);
  process.exit(1);
});
