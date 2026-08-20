import express from 'express';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { initNeonDatabase, startKeepAliveHeartbeat, getKeepAliveStatus } from './server/neonDb';
import { cloudRouter } from './server/neonRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Mount Cloud Neon PostgreSQL & Anti-Sleep Heartbeat Routes
app.use('/api/cloud', cloudRouter);
app.use('/api/keepalive', (req, res) => {
  res.redirect('/api/cloud/keepalive');
});

// Lazy GoogleGenAI initialization
let aiClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

// -------------------------------------------------------------
// Health Check with Keep-Alive & DB Status
// -------------------------------------------------------------
app.get('/api/health', (req, res) => {
  const keepAlive = getKeepAliveStatus();
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    ai_configured: !!process.env.GEMINI_API_KEY,
    database: keepAlive.database_type,
    is_db_connected: keepAlive.is_db_connected,
    keep_alive_active: keepAlive.is_active,
    last_ping_time: keepAlive.last_ping_time
  });
});

// Helper: Call Gemini with fallback models and retry on temporary 503 / 429 errors
async function callGeminiWithRetry(
  ai: GoogleGenAI,
  systemInstruction: string,
  contents: any[]
): Promise<string | null> {
  const modelsToTry = ['gemini-3.7-flash', 'gemini-flash-latest'];

  for (const model of modelsToTry) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents,
          config: {
            systemInstruction
          }
        });

        if (response && response.text) {
          return response.text;
        }
      } catch (err: any) {
        const isTransient =
          err?.status === 503 ||
          err?.code === 503 ||
          err?.message?.includes('503') ||
          err?.message?.includes('high demand') ||
          err?.message?.includes('UNAVAILABLE') ||
          err?.message?.includes('429');

        if (isTransient && attempt === 0) {
          // Wait 800ms before retrying the same model
          await new Promise((resolve) => setTimeout(resolve, 800));
          continue;
        }
        // If second attempt fails or non-transient, proceed to next model
        break;
      }
    }
  }

  return null;
}

// -------------------------------------------------------------
// AI Chat Endpoint with Full Action Capabilities
// -------------------------------------------------------------
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { message, conversationHistory = [], contextData = {} } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }

    const ai = getGenAI();

    // System prompt describing the complete financial management system and executable action format
    const systemInstruction = `
Sen — Shaxsiy Moliyaviy Boshqaruv Tizimi (Karimov FinSystem 2.0) ning yuqori malakali Bosh Sun'iy Intellekt Moliyaviy Maslahatchisi va Boshqaruvchisisan.
Sening vazifang foydalanuvchi (Admin) bilan o'zbek tilida tabiiy, samimiy va professional muloqot qilish hamda uning buyruqlari bo'yicha tizimdagi barcha amallarni avtomatik bajarishdir.

FOYDALANUVCHINING HOZIRGI MOLIYAVIY MA'LUMOTLARI:
- Mavjud Kategoriyalar: ${JSON.stringify(contextData.categories || [])}
- Oylik / Yillik Xulosa: ${JSON.stringify(contextData.summary || {})}
- Oxirgi Qarzlar: ${JSON.stringify(contextData.debts || [])}
- Byudjetlar: ${JSON.stringify(contextData.budgets || [])}
- Valyuta: ${contextData.currency || 'UZS'}
- Bugungi sana: ${new Date().toISOString().split('T')[0]}

SEN QUYIDAGI BARCHA AMALLARNI BAJARA OLASAN:
1. "ADD_INCOME" — Yangi daromad kiritish (amount, category_name/category_id, description, payment_method, date)
2. "ADD_EXPENSE" — Yangi xarajat kiritish (amount, category_name/category_id, description, payment_method, date)
3. "ADD_DEBT" — Yangi qarz qo'shish (type: 'given' | 'received', counterparty, initial_amount, due_date, description)
4. "ADD_DEBT_PAYMENT" — Qarzni qaytarish/yopish (debt_id yoki counterparty, amount, payment_date, note, payment_method)
5. "SET_BUDGET" — Kategoriya byudjet limitini belgilash yoki yangilash (category_name/category_id, period_key masalan '2026-08', limit_amount)
6. "ADD_CATEGORY" — Yangi kategoriya yaratish (name, type: 'income' | 'expense', color, icon, description)
7. "UPDATE_SETTINGS" — Sozlamalarni o'zgartirish (currency, language, default_period, notifications_enabled)
8. "EXPORT_EXCEL" — Excel hisobotini yuklab berish (module: 'master' | 'income' | 'expense' | 'debt' | 'budget' | 'reports')
9. "FINANCIAL_ADVICE" — Chuqur tahlil, optimallashtirish va tejash bo'yicha maslahat berish

JAVOB FORMATI:
Javobingda foydalanuvchiga tushunarli, chiroyli formatlangan matn (Markdown formatida) yoz.
Agar foydalanuvchi biror amalni bajarishni so'ragan bo'lsa (yoki xarajat/daromad/qarz aytgan bo'lsa), javobing oxirida maxsus ACTION JSON blokini joylashtir:

\`\`\`json_actions
[
  {
    "type": "ADD_EXPENSE",
    "params": {
      "amount": 50000,
      "category_name": "Oziq-ovqat",
      "description": "Tushlik",
      "payment_method": "Plastik karta",
      "date": "2026-08-19"
    },
    "summary": "50 000 so'm xarajat 'Oziq-ovqat' kategoriyasiga qo'shildi"
  }
]
\`\`\`

Agar foydalanuvchi faqat maslahat yoki savol so'ragan bo'lsa, json_actions bloki bo'sh bo'lishi yoki umuman yozilmasligi mumkin.
Har doim do'stona, aniq, hisob-kitoblarga boy va muloyim o'zbek tilida javob ber.
`;

    if (ai) {
      try {
        const contents = [];
        
        // Add conversation history
        for (const msg of conversationHistory.slice(-6)) {
          contents.push({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content }]
          });
        }

        contents.push({
          role: 'user',
          parts: [{ text: message }]
        });

        const replyText = await callGeminiWithRetry(ai, systemInstruction, contents);

        if (replyText) {
          return res.json({
            reply: replyText,
            status: 'success'
          });
        }
      } catch (geminiError: any) {
        console.warn('Gemini API temporary issue, activating local engine fallback:', geminiError?.message || geminiError);
      }
    }

    // Local financial AI Rule-Based Engine as a reliable backup
    const fallbackResponse = generateLocalAIResponse(message, contextData);
    return res.json({
      reply: fallbackResponse,
      status: 'fallback'
    });
  } catch (error: any) {
    console.error('Error in /api/ai/chat:', error);
    // Never crash or send 500 when client message can be parsed locally
    const fallbackResponse = generateLocalAIResponse(req.body?.message || '', req.body?.contextData || {});
    return res.json({
      reply: fallbackResponse,
      status: 'fallback'
    });
  }
});

// Robust Local Financial AI Rule-Based Engine
function generateLocalAIResponse(message: string, context: any): string {
  const lower = message.toLowerCase();
  const todayStr = new Date().toISOString().split('T')[0];

  // 1. Detect Expense Add Intent
  if (lower.includes('xarajat') || lower.includes('sarfladim') || lower.includes('berdim') || lower.includes('sotib oldim') || lower.includes('tushlik') || lower.includes('taksi') || lower.includes('harajat')) {
    const numMatch = message.match(/\d+[\d\s.,]*/);
    let amount = 0;
    if (numMatch) {
      amount = parseFloat(numMatch[0].replace(/\s+/g, '').replace(/,/g, ''));
    }
    if (!amount) amount = 45000;

    let catName = 'Oziq-ovqat';
    if (lower.includes('taksi') || lower.includes('benzin') || lower.includes('yo\'l')) catName = 'Transport';
    if (lower.includes('kiyim') || lower.includes('poyabzal')) catName = 'Kiyim-kechak';
    if (lower.includes('uy') || lower.includes('ijara') || lower.includes('kommunal')) catName = 'Uy-joy & Kommunal';
    if (lower.includes('dorixona') || lower.includes('shifokor')) catName = 'Salomatlik';
    if (lower.includes('kafe') || lower.includes('restoran')) catName = 'Restoran & Kafe';

    return `Sizning xarajatingiz tizimga muvaffaqiyatli kiritildi! 💳

- **Summa**: ${amount.toLocaleString('uz-UZ')} ${context.currency || 'UZS'}
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
    "summary": "${amount.toLocaleString('uz-UZ')} UZS xarajat '${catName}' kategoriyasiga qo'shildi"
  }
]
\`\`\`

Yana qanday xarajat yoki daromadni kiritishimiz kerak?`;
  }

  // 2. Detect Income Add Intent
  if (lower.includes('daromad') || lower.includes('maosh') || lower.includes('oylik') || lower.includes('pul tushdi') || lower.includes('topdim') || lower.includes('bonus') || lower.includes('ish haqi')) {
    const numMatch = message.match(/\d+[\d\s.,]*/);
    let amount = 0;
    if (numMatch) {
      amount = parseFloat(numMatch[0].replace(/\s+/g, '').replace(/,/g, ''));
    }
    if (!amount) amount = 10000000;

    let catName = 'Oylik Maosh';
    if (lower.includes('biznes') || lower.includes('savdo')) catName = 'Biznes & Savdo';
    if (lower.includes('frilans') || lower.includes('loyixa')) catName = 'Frilans / Dasturlash';
    if (lower.includes('invest') || lower.includes('dividend')) catName = 'Investitsiya & Dividend';

    return `Tabriklayman! Yangi daromad muvaffaqiyatli hisobga olindi 💰

- **Summa**: ${amount.toLocaleString('uz-UZ')} ${context.currency || 'UZS'}
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
    "summary": "${amount.toLocaleString('uz-UZ')} UZS daromad '${catName}' kategoriyasiga qo'shildi"
  }
]
\`\`\`

Moliya balansingiz yangilandi!`;
  }

  // 3. Detect Debt Intent
  if (lower.includes('qarz') || lower.includes('nasiya')) {
    if (lower.includes('qaytardi') || lower.includes('yopdim') || lower.includes('to\'ladim')) {
      const numMatch = message.match(/\d+[\d\s.,]*/);
      let amount = numMatch ? parseFloat(numMatch[0].replace(/\s+/g, '').replace(/,/g, '')) : 500000;
      return `Qarz to'lovi muvaffaqiyatli qayd etildi! ✅

- **To'lov summasi**: ${amount.toLocaleString('uz-UZ')} UZS
- **Sana**: ${todayStr}

\`\`\`json_actions
[
  {
    "type": "ADD_DEBT_PAYMENT",
    "params": {
      "amount": ${amount},
      "payment_date": "${todayStr}",
      "note": "${message.replace(/"/g, "'")}",
      "payment_method": "Plastik karta"
    },
    "summary": "${amount.toLocaleString('uz-UZ')} UZS qarz to'lovi qabul qilindi"
  }
]
\`\`\``;
    }

    const isGiven = lower.includes('berdim') || lower.includes('qarz berdim');
    const type = isGiven ? 'given' : 'received';
    const numMatch = message.match(/\d+[\d\s.,]*/);
    let amount = numMatch ? parseFloat(numMatch[0].replace(/\s+/g, '').replace(/,/g, '')) : 2000000;

    const due = new Date();
    due.setDate(due.getDate() + 30);
    const dueStr = due.toISOString().split('T')[0];

    const person = isGiven ? 'Sherik / Tanish' : 'Kreditor / Bank';

    return `Qarz operatsiyasi ro'yxatga olindi 🤝

- **Qarz turi**: ${isGiven ? 'Berilgan qarz (Menga qaytarishadi)' : 'Olingan qarz (Men berishim kerak)'}
- **Summa**: ${amount.toLocaleString('uz-UZ')} UZS
- **Muddati**: ${dueStr}

\`\`\`json_actions
[
  {
    "type": "ADD_DEBT",
    "params": {
      "type": "${type}",
      "counterparty": "${person}",
      "initial_amount": ${amount},
      "due_date": "${dueStr}",
      "description": "${message.replace(/"/g, "'")}"
    },
    "summary": "${amount.toLocaleString('uz-UZ')} UZS ${isGiven ? 'berilgan' : 'olingan'} qarz qo'shildi"
  }
]
\`\`\``;
  }

  // 4. Detect Budget Intent
  if (lower.includes('byudjet') || lower.includes('budget') || lower.includes('limit')) {
    const numMatch = message.match(/\d+[\d\s.,]*/);
    let amount = numMatch ? parseFloat(numMatch[0].replace(/\s+/g, '').replace(/,/g, '')) : 1000000;
    const currentMonthKey = todayStr.substring(0, 7); // '2026-08'

    let catName = 'Oziq-ovqat';
    if (lower.includes('transport') || lower.includes('benzin') || lower.includes('avto')) catName = 'Transport';
    if (lower.includes('kiyim')) catName = 'Kiyim-kechak';
    if (lower.includes('kommunal') || lower.includes('uy')) catName = 'Uy-joy & Kommunal';

    return `Byudjet limiti muvaffaqiyatli belgilandi! 🎯

- **Kategoriya**: ${catName}
- **Davr**: ${currentMonthKey}
- **Limit summasi**: ${amount.toLocaleString('uz-UZ')} UZS

\`\`\`json_actions
[
  {
    "type": "SET_BUDGET",
    "params": {
      "category_name": "${catName}",
      "period_key": "${currentMonthKey}",
      "limit_amount": ${amount}
    },
    "summary": "${catName} kategoriyasiga ${amount.toLocaleString('uz-UZ')} UZS byudjet limiti belgilandi"
  }
]
\`\`\``;
  }

  // 5. Detect Excel Export Intent
  if (lower.includes('excel') || lower.includes('yuklab') || lower.includes('fayl') || lower.includes('hisobot')) {
    return `Albatta! Siz so'ragan Excel hisobotini hoziroq tayyorlayapman 📊

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

  // 6. Default General Financial Health & Advice
  return `Assalomu alaykum, hurmatli Admin! Men sizning **Sun'iy Intellekt Moliyaviy Boshqaruvchi** yordamchingizman. 🤖

Siz men bilan suhbat orqali quyidagi barcha amallarni tezkor bajarishingiz mumkin:
1. **Xarajat va Daromad yozish**: masalan, *"Bugun tushlikka 45 000 so'm sarfladim"* yoki *"Maoshim 12 000 000 tushdi"*
2. **Qarz kiritish & Qaytarish**: *"Aliga 1 500 000 qarz berdim"* yoki *"Qarz qaytarildi"*
3. **Byudjet belgilash**: *"Transport uchun oylik byudjetni 600 000 so'm qil"*
4. **Excel hisobotlarni yuklash**: *"2026 Master Excel kitobini yuklab ber"*
5. **Moliyaviy tahlil**: *"Mening bu oylik xarajatlarim holatini tahlil qil va maslahat ber"*

Buyruq yoki savolingizni yozing, men darhol bajaraman!`;
}

// -------------------------------------------------------------
// Vite Server Integration for Development and Production
// -------------------------------------------------------------
async function startServer() {
  // Initialize Neon.tech PostgreSQL connection & tables
  try {
    await initNeonDatabase();
  } catch (err) {
    console.error('Neon DB init error:', err);
  }

  // Start background anti-sleep heartbeat (Every 2 minutes)
  startKeepAliveHeartbeat();

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Financial Management System Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
