import { Router } from 'express';
import db from './db.js';
import { handleAgentRequest } from './agentHandler.js';

const router = Router();

// Helper to generate unique IDs
const genId = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

// 1. REGISTER
router.post('/auth/register', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password || !username.trim() || !password.trim()) {
    return res.status(400).json({ error: 'El nombre de usuario y la clave son obligatorios.' });
  }

  const cleanUser = username.trim().toLowerCase();

  try {
    const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(cleanUser);
    if (existing) {
      return res.status(400).json({ error: 'El nombre de usuario ya existe. Por favor inicia sesión o elige otro nombre.' });
    }

    const userId = genId('usr');
    const nowIso = new Date().toISOString();

    db.prepare(`
      INSERT INTO users (id, username, password, currency, initial_cash_balance, ai_provider, ollama_url, ollama_model, created_at)
      VALUES (?, ?, ?, 'CUP ($)', 0, 'gemini', 'https://api.ollama.com', 'llama3.2', ?)
    `).run(userId, cleanUser, password.trim(), nowIso);

    // Initial Welcome Message with 0 CUP balance
    const welcomeMsg = {
      id: genId('msg'),
      userId,
      role: 'agent',
      content: `🇨🇺 ¡Hola ${username}! Tu cuenta está lista y totalmente limpia en la base de datos (0 CUP).\n\nCada vez que generes o gastes dinero en efectivo, escríbeme o háblame por voz y actualizaré tu cuenta.`,
      timestamp: nowIso
    };

    db.prepare(`
      INSERT INTO chat_messages (id, user_id, role, content, timestamp)
      VALUES (?, ?, ?, ?, ?)
    `).run(welcomeMsg.id, welcomeMsg.userId, welcomeMsg.role, welcomeMsg.content, welcomeMsg.timestamp);

    const userProfile = {
      id: userId,
      name: username.trim(),
      currency: 'CUP ($)',
      initialCashBalance: 0,
      aiProvider: 'gemini',
      ollamaUrl: 'https://api.ollama.com',
      ollamaModel: 'llama3.2',
      ollamaApiKey: '',
      customApiKey: '',
      pushEnabled: true,
      reminderTime: '20:00'
    };

    res.json({
      success: true,
      user: userProfile,
      transactions: [], // Clean 0 transactions
      chatMessages: [welcomeMsg]
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Error al registrar el usuario en SQLite: ' + err.message });
  }
});

// 2. LOGIN
router.post('/auth/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Debes ingresar usuario y clave.' });
  }

  const cleanUser = username.trim().toLowerCase();

  try {
    const userRow: any = db.prepare('SELECT * FROM users WHERE username = ? AND password = ?').get(cleanUser, password.trim());

    if (!userRow) {
      return res.status(401).json({ error: 'Usuario o clave incorrectos.' });
    }

    const txRows: any[] = db.prepare('SELECT * FROM transactions WHERE user_id = ? ORDER BY date DESC').all(userRow.id);
    const msgRows: any[] = db.prepare('SELECT * FROM chat_messages WHERE user_id = ? ORDER BY timestamp ASC').all(userRow.id);

    const userProfile = {
      id: userRow.id,
      name: userRow.username,
      currency: userRow.currency || 'CUP ($)',
      initialCashBalance: userRow.initial_cash_balance || 0,
      aiProvider: userRow.ai_provider || 'gemini',
      ollamaUrl: userRow.ollama_url || 'https://api.ollama.com',
      ollamaModel: userRow.ollama_model || 'llama3.2',
      ollamaApiKey: userRow.ollama_api_key || '',
      customApiKey: userRow.custom_api_key || '',
      pushEnabled: Boolean(userRow.push_enabled),
      reminderTime: userRow.reminder_time || '20:00'
    };

    const transactions = txRows.map(t => ({
      id: t.id,
      title: t.title,
      amount: t.amount,
      type: t.type,
      category: t.category,
      notes: t.notes || '',
      rawUtterance: t.raw_utterance || '',
      date: t.date
    }));

    const chatMessages = msgRows.map(m => ({
      id: m.id,
      role: m.role,
      content: m.content,
      timestamp: m.timestamp,
      isError: Boolean(m.is_error),
      transactions: m.transactions_json ? JSON.parse(m.transactions_json) : undefined
    }));

    res.json({
      success: true,
      user: userProfile,
      transactions,
      chatMessages
    });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Error al iniciar sesión: ' + err.message });
  }
});

// 3. SYNC / REFRESH USER DATA
router.get('/user/sync/:userId', (req, res) => {
  const { userId } = req.params;

  try {
    const userRow: any = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    if (!userRow) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const txRows: any[] = db.prepare('SELECT * FROM transactions WHERE user_id = ? ORDER BY date DESC').all(userId);
    const msgRows: any[] = db.prepare('SELECT * FROM chat_messages WHERE user_id = ? ORDER BY timestamp ASC').all(userId);

    const userProfile = {
      id: userRow.id,
      name: userRow.username,
      currency: userRow.currency || 'CUP ($)',
      initialCashBalance: userRow.initial_cash_balance || 0,
      aiProvider: userRow.ai_provider || 'gemini',
      ollamaUrl: userRow.ollama_url || 'https://api.ollama.com',
      ollamaModel: userRow.ollama_model || 'llama3.2',
      ollamaApiKey: userRow.ollama_api_key || '',
      customApiKey: userRow.custom_api_key || '',
      pushEnabled: Boolean(userRow.push_enabled),
      reminderTime: userRow.reminder_time || '20:00'
    };

    res.json({
      success: true,
      user: userProfile,
      transactions: txRows.map(t => ({
        id: t.id,
        title: t.title,
        amount: t.amount,
        type: t.type,
        category: t.category,
        notes: t.notes || '',
        rawUtterance: t.raw_utterance || '',
        date: t.date
      })),
      chatMessages: msgRows.map(m => ({
        id: m.id,
        role: m.role,
        content: m.content,
        timestamp: m.timestamp,
        isError: Boolean(m.is_error),
        transactions: m.transactions_json ? JSON.parse(m.transactions_json) : undefined
      }))
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 4. UPDATE USER SETTINGS
router.post('/user/profile', (req, res) => {
  const { userId, currency, initialCashBalance, aiProvider, ollamaUrl, ollamaModel, ollamaApiKey, customApiKey, pushEnabled, reminderTime } = req.body;

  if (!userId) return res.status(400).json({ error: 'Falta userId' });

  try {
    db.prepare(`
      UPDATE users SET
        currency = ?,
        initial_cash_balance = ?,
        ai_provider = ?,
        ollama_url = ?,
        ollama_model = ?,
        ollama_api_key = ?,
        custom_api_key = ?,
        push_enabled = ?,
        reminder_time = ?
      WHERE id = ?
    `).run(
      currency || 'CUP ($)',
      initialCashBalance || 0,
      aiProvider || 'gemini',
      ollamaUrl || '',
      ollamaModel || 'llama3.2',
      ollamaApiKey || '',
      customApiKey || '',
      pushEnabled ? 1 : 0,
      reminderTime || '20:00',
      userId
    );

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 5. MANUAL TRANSACTION CREATE
router.post('/transactions/create', (req, res) => {
  const { userId, title, amount, type, category, notes, date } = req.body;

  if (!userId || !title || !amount) {
    return res.status(400).json({ error: 'Datos incompletos para crear transacción.' });
  }

  const txId = genId('tx');
  const nowIso = new Date().toISOString();

  try {
    db.prepare(`
      INSERT INTO transactions (id, user_id, title, amount, type, category, notes, date, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(txId, userId, title, amount, type, category, notes || '', date || nowIso, nowIso);

    res.json({
      success: true,
      transaction: {
        id: txId,
        title,
        amount,
        type,
        category,
        notes: notes || '',
        date: date || nowIso
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 6. UPDATE TRANSACTION
router.put('/transactions/:id', (req, res) => {
  const { id } = req.params;
  const { title, amount, type, category, notes } = req.body;

  try {
    db.prepare(`
      UPDATE transactions
      SET title = ?, amount = ?, type = ?, category = ?, notes = ?
      WHERE id = ?
    `).run(title, amount, type, category, notes || '', id);

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 7. DELETE TRANSACTION
router.delete('/transactions/:id', (req, res) => {
  const { id } = req.params;

  try {
    db.prepare('DELETE FROM transactions WHERE id = ?').run(id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 8. CLEAR CHAT
router.delete('/chat/clear/:userId', (req, res) => {
  const { userId } = req.params;

  try {
    db.prepare('DELETE FROM chat_messages WHERE user_id = ?').run(userId);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 9. AGENT CHAT API
router.post('/agent', async (req, res) => {
  const { userId, prompt } = req.body;

  try {
    let userRow: any = null;
    if (userId) {
      userRow = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    }

    const aiProvider = userRow ? userRow.ai_provider : req.body.aiProvider;
    const ollamaUrl = userRow ? userRow.ollama_url : req.body.ollamaUrl;
    const ollamaModel = userRow ? userRow.ollama_model : req.body.ollamaModel;
    const ollamaApiKey = userRow ? userRow.ollama_api_key : req.body.ollamaApiKey;
    const customApiKey = userRow ? userRow.custom_api_key : req.body.userApiKey;

    // Call Agent processing
    const aiResult = await handleAgentRequest({
      prompt,
      userApiKey: customApiKey,
      currentCashInHand: req.body.currentCashInHand || 0,
      aiProvider,
      ollamaUrl,
      ollamaModel,
      ollamaApiKey
    });

    const nowIso = new Date().toISOString();

    // 1. Save user chat message
    if (userId) {
      db.prepare(`
        INSERT INTO chat_messages (id, user_id, role, content, timestamp)
        VALUES (?, ?, 'user', ?, ?)
      `).run(genId('msg'), userId, prompt, nowIso);
    }

    // 2. Save extracted transactions to SQLite
    const createdTxs: any[] = [];
    if (userId && aiResult.transactions && aiResult.transactions.length > 0) {
      const insertTx = db.prepare(`
        INSERT INTO transactions (id, user_id, title, amount, type, category, notes, raw_utterance, date, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      aiResult.transactions.forEach((t: any) => {
        const txId = genId('tx');
        insertTx.run(txId, userId, t.title, t.amount, t.type, t.category, t.notes || '', prompt, nowIso, nowIso);
        createdTxs.push({
          id: txId,
          title: t.title,
          amount: t.amount,
          type: t.type,
          category: t.category,
          notes: t.notes || '',
          rawUtterance: prompt,
          date: nowIso
        });
      });
    }

    // 3. Save agent message to SQLite
    if (userId) {
      db.prepare(`
        INSERT INTO chat_messages (id, user_id, role, content, transactions_json, timestamp)
        VALUES (?, ?, 'agent', ?, ?, ?)
      `).run(genId('msg'), userId, aiResult.summary, JSON.stringify(createdTxs), nowIso);
    }

    res.json({
      success: true,
      summary: aiResult.summary,
      transactions: createdTxs
    });
  } catch (err: any) {
    console.error("Error in /api/agent:", err);
    res.status(500).json({
      success: false,
      error: err.message || "Error al procesar con la IA."
    });
  }
});

export default router;
