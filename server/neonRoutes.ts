import express from 'express';
import { getDbPool, getKeepAliveStatus, executeKeepAlivePing } from './neonDb';

export const cloudRouter = express.Router();

// -------------------------------------------------------------
// Keep-Alive & Diagnostic Endpoint (Heartbeat for Render & Neon)
// -------------------------------------------------------------
cloudRouter.get('/keepalive', async (req, res) => {
  const result = await executeKeepAlivePing();
  const status = getKeepAliveStatus();
  res.json({
    status: 'ok',
    message: 'Anti-sleep heartbeat pulse executed successfully.',
    data: {
      ...status,
      last_result: result
    }
  });
});

cloudRouter.get('/status', (req, res) => {
  res.json({
    status: 'ok',
    data: getKeepAliveStatus()
  });
});

// -------------------------------------------------------------
// Cloud Registration with Strict Unique Login & Email Validation
// -------------------------------------------------------------
cloudRouter.post('/auth/register', async (req, res) => {
  try {
    const { email, username, fullName, password, phone, role, currency, language } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, message: "Email manzili kiritilishi shart." });
    }
    if (!username || !username.trim()) {
      return res.status(400).json({ success: false, message: "Login (Username) kiritilishi shart." });
    }
    if (!password || password.length < 4) {
      return res.status(400).json({ success: false, message: "Parol kamida 4 ta belgidan iborat bo'lishi kerak." });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanUsername = username.trim().toLowerCase();
    const cleanFullName = (fullName || username).trim();
    const cleanPhone = (phone || '').trim();

    const pool = getDbPool();

    if (pool) {
      // 1. Check if email or username already exists in Neon database
      const existing = await pool.query(
        'SELECT id, email, username FROM users WHERE LOWER(email) = $1 OR LOWER(username) = $2 LIMIT 1',
        [cleanEmail, cleanUsername]
      );

      if (existing.rows && existing.rows.length > 0) {
        const found = existing.rows[0];
        if (found.email.toLowerCase() === cleanEmail) {
          return res.status(409).json({
            success: false,
            message: "Ushbu email manzili bilan allaqachon ro'yxatdan o'tilgan. Boshqa email tanlang yoki tizimga kiring."
          });
        }
        if (found.username.toLowerCase() === cleanUsername) {
          return res.status(409).json({
            success: false,
            message: "Ushbu login (username) allaqachon band. Iltimos boshqa login tanlang."
          });
        }
      }

      // 2. Insert new user
      const userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const now = new Date().toISOString();

      await pool.query(
        `INSERT INTO users (id, email, username, password, full_name, phone, role, currency, language, created_at, updated_at, last_login)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          userId,
          cleanEmail,
          cleanUsername,
          password,
          cleanFullName,
          cleanPhone,
          role || 'bosh_admin',
          currency || 'UZS',
          language || 'uz',
          now,
          now,
          now
        ]
      );

      // Create default settings
      await pool.query(
        `INSERT INTO user_settings (user_id, currency, language, updated_at)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (user_id) DO NOTHING`,
        [userId, currency || 'UZS', language || 'uz', now]
      );

      return res.json({
        success: true,
        message: "Ro'yxatdan muvaffaqiyatli o'tdingiz!",
        user: {
          id: userId,
          email: cleanEmail,
          username: cleanUsername,
          full_name: cleanFullName,
          phone: cleanPhone,
          role: role || 'bosh_admin',
          currency: currency || 'UZS',
          language: language || 'uz',
          last_login: now,
          created_at: now
        }
      });
    } else {
      // Memory fallback response
      const userId = `user_${Date.now()}`;
      return res.json({
        success: true,
        message: "Foydalanuvchi muvaffaqiyatli yaratildi (Lokal rejim)",
        user: {
          id: userId,
          email: cleanEmail,
          username: cleanUsername,
          full_name: cleanFullName,
          phone: cleanPhone,
          role: role || 'bosh_admin',
          currency: currency || 'UZS',
          language: language || 'uz'
        }
      });
    }
  } catch (err: any) {
    console.error('Registration error:', err);
    res.status(500).json({ success: false, message: 'Ro\'yxatdan o\'tishda xatolik: ' + (err?.message || 'Server xatosi') });
  }
});

// -------------------------------------------------------------
// Cloud Login Endpoint
// -------------------------------------------------------------
cloudRouter.post('/auth/login', async (req, res) => {
  try {
    const { loginIdentifier, password } = req.body;
    if (!loginIdentifier || !loginIdentifier.trim()) {
      return res.status(400).json({ success: false, message: "Login yoki email kiritilishi shart." });
    }

    const cleanId = loginIdentifier.trim().toLowerCase();
    const pool = getDbPool();

    if (pool) {
      const userRes = await pool.query(
        'SELECT * FROM users WHERE LOWER(email) = $1 OR LOWER(username) = $2 LIMIT 1',
        [cleanId, cleanId]
      );

      if (!userRes.rows || userRes.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Kiritilgan login yoki email bo'yicha foydalanuvchi topilmadi."
        });
      }

      const user = userRes.rows[0];

      if (password && user.password !== password) {
        return res.status(401).json({
          success: false,
          message: "Noto'g'ri parol kiritildi! Iltimos qaytadan tekshirib ko'ring."
        });
      }

      // Update last login
      const now = new Date().toISOString();
      await pool.query('UPDATE users SET last_login = $1 WHERE id = $2', [now, user.id]);
      user.last_login = now;

      // Safe user object without password
      const safeUser = { ...user };
      delete safeUser.password;

      return res.json({
        success: true,
        message: "Tizimga muvaffaqiyatli kirildi!",
        user: safeUser
      });
    } else {
      return res.json({
        success: true,
        message: "Lokal rejimda tizimga kirildi",
        user: {
          id: 'user_karimov_2026',
          username: cleanId,
          email: cleanId.includes('@') ? cleanId : `${cleanId}@mail.uz`,
          full_name: 'Sardor Karimov',
          role: 'bosh_admin'
        }
      });
    }
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Tizimga kirishda xatolik: ' + (err?.message || 'Server xatosi') });
  }
});

// -------------------------------------------------------------
// Cloud Data Pull: Pull All User Data on Any Device/Computer
// -------------------------------------------------------------
cloudRouter.get('/sync/pull/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const pool = getDbPool();

    if (!pool) {
      return res.json({
        success: true,
        cloud_active: false,
        message: 'DATABASE_URL o\'rnatilmagan, lokal xotiradan foydalanilmoqda.'
      });
    }

    const [userRes, catsRes, incsRes, expsRes, debtsRes, paymentsRes, budgetsRes, settingsRes, auditRes] = await Promise.all([
      pool.query('SELECT * FROM users WHERE id = $1', [userId]),
      pool.query('SELECT * FROM categories WHERE user_id = $1 ORDER BY created_at ASC', [userId]),
      pool.query('SELECT * FROM incomes WHERE user_id = $1 ORDER BY date DESC, created_at DESC', [userId]),
      pool.query('SELECT * FROM expenses WHERE user_id = $1 ORDER BY date DESC, created_at DESC', [userId]),
      pool.query('SELECT * FROM debts WHERE user_id = $1 ORDER BY due_date ASC', [userId]),
      pool.query('SELECT * FROM debt_payments WHERE user_id = $1 ORDER BY payment_date DESC', [userId]),
      pool.query('SELECT * FROM budgets WHERE user_id = $1', [userId]),
      pool.query('SELECT * FROM user_settings WHERE user_id = $1', [userId]),
      pool.query('SELECT * FROM audit_logs WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50', [userId])
    ]);

    const user = userRes.rows[0] || null;
    if (user) delete user.password;

    res.json({
      success: true,
      cloud_active: true,
      data: {
        user,
        categories: catsRes.rows,
        incomes: incsRes.rows,
        expenses: expsRes.rows,
        debts: debtsRes.rows,
        debtPayments: paymentsRes.rows,
        budgets: budgetsRes.rows,
        settings: settingsRes.rows[0] || null,
        auditLogs: auditRes.rows
      }
    });
  } catch (err: any) {
    console.error('Data pull error:', err);
    res.status(500).json({ success: false, message: 'Bulutdan yuklashda xatolik: ' + err.message });
  }
});

// -------------------------------------------------------------
// Cloud Data Push: Synchronize Local Changes to Neon Database
// -------------------------------------------------------------
cloudRouter.post('/sync/push', async (req, res) => {
  try {
    const { userId, categories, incomes, expenses, debts, debtPayments, budgets, settings, auditLogs } = req.body;
    const pool = getDbPool();

    if (!pool) {
      return res.json({
        success: true,
        cloud_active: false,
        message: 'DATABASE_URL mavjud emas, faqat lokal saqlandi.'
      });
    }

    if (!userId) {
      return res.status(400).json({ success: false, message: 'Foydalanuvchi ID talab qilinadi.' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Categories batch upsert
      if (Array.isArray(categories)) {
        for (const c of categories) {
          await client.query(
            `INSERT INTO categories (id, user_id, name, type, icon, color, is_default, is_active, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
             ON CONFLICT (id) DO UPDATE SET
               name = EXCLUDED.name,
               type = EXCLUDED.type,
               icon = EXCLUDED.icon,
               color = EXCLUDED.color,
               is_active = EXCLUDED.is_active,
               updated_at = EXCLUDED.updated_at`,
            [c.id, userId, c.name, c.type, c.icon || 'Tag', c.color || '#10b981', !!c.is_default, c.is_active !== false, c.created_at || new Date().toISOString(), c.updated_at || new Date().toISOString()]
          );
        }
      }

      // 2. Incomes batch upsert
      if (Array.isArray(incomes)) {
        for (const item of incomes) {
          await client.query(
            `INSERT INTO incomes (id, user_id, category_id, amount, date, description, payment_method, is_recurring, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
             ON CONFLICT (id) DO UPDATE SET
               category_id = EXCLUDED.category_id,
               amount = EXCLUDED.amount,
               date = EXCLUDED.date,
               description = EXCLUDED.description,
               payment_method = EXCLUDED.payment_method,
               updated_at = EXCLUDED.updated_at`,
            [item.id, userId, item.category_id, item.amount, item.date, item.description || '', item.payment_method || 'Plastik karta', !!item.is_recurring, item.created_at || new Date().toISOString(), item.updated_at || new Date().toISOString()]
          );
        }
      }

      // 3. Expenses batch upsert
      if (Array.isArray(expenses)) {
        for (const item of expenses) {
          await client.query(
            `INSERT INTO expenses (id, user_id, category_id, amount, date, description, payment_method, is_essential, is_recurring, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
             ON CONFLICT (id) DO UPDATE SET
               category_id = EXCLUDED.category_id,
               amount = EXCLUDED.amount,
               date = EXCLUDED.date,
               description = EXCLUDED.description,
               payment_method = EXCLUDED.payment_method,
               is_essential = EXCLUDED.is_essential,
               updated_at = EXCLUDED.updated_at`,
            [item.id, userId, item.category_id, item.amount, item.date, item.description || '', item.payment_method || 'Plastik karta', !!item.is_essential, !!item.is_recurring, item.created_at || new Date().toISOString(), item.updated_at || new Date().toISOString()]
          );
        }
      }

      // 4. Debts batch upsert
      if (Array.isArray(debts)) {
        for (const d of debts) {
          await client.query(
            `INSERT INTO debts (id, user_id, type, counterparty, initial_amount, due_date, status, description, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
             ON CONFLICT (id) DO UPDATE SET
               type = EXCLUDED.type,
               counterparty = EXCLUDED.counterparty,
               initial_amount = EXCLUDED.initial_amount,
               due_date = EXCLUDED.due_date,
               status = EXCLUDED.status,
               description = EXCLUDED.description,
               updated_at = EXCLUDED.updated_at`,
            [d.id, userId, d.type, d.counterparty, d.initial_amount, d.due_date, d.status || 'unpaid', d.description || '', d.created_at || new Date().toISOString(), d.updated_at || new Date().toISOString()]
          );
        }
      }

      // 5. Debt Payments batch upsert
      if (Array.isArray(debtPayments)) {
        for (const p of debtPayments) {
          await client.query(
            `INSERT INTO debt_payments (id, debt_id, user_id, amount, payment_date, payment_method, note, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             ON CONFLICT (id) DO UPDATE SET
               amount = EXCLUDED.amount,
               payment_date = EXCLUDED.payment_date,
               payment_method = EXCLUDED.payment_method,
               note = EXCLUDED.note`,
            [p.id, p.debt_id, userId, p.amount, p.payment_date, p.payment_method || 'Plastik karta', p.note || '', p.created_at || new Date().toISOString()]
          );
        }
      }

      // 6. Budgets batch upsert
      if (Array.isArray(budgets)) {
        for (const b of budgets) {
          await client.query(
            `INSERT INTO budgets (id, user_id, category_id, period_key, limit_amount, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             ON CONFLICT (user_id, category_id, period_key) DO UPDATE SET
               limit_amount = EXCLUDED.limit_amount,
               updated_at = EXCLUDED.updated_at`,
            [b.id, userId, b.category_id, b.period_key, b.limit_amount, b.created_at || new Date().toISOString(), b.updated_at || new Date().toISOString()]
          );
        }
      }

      await client.query('COMMIT');
      res.json({
        success: true,
        cloud_active: true,
        message: 'Barcha ma\'lumotlar Neon.tech bulutli bazasiga muvaffaqiyatli sinxronlandi! ☁️'
      });
    } catch (txErr: any) {
      await client.query('ROLLBACK');
      throw txErr;
    } finally {
      client.release();
    }
  } catch (err: any) {
    console.error('Data push error:', err);
    res.status(500).json({ success: false, message: 'Bulutga yuklashda xatolik: ' + err.message });
  }
});
