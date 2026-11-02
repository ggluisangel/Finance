import { UserProfile, Transaction, ChatMessage, CategorySummary, DailySummary } from '../types/finance';

const PROFILE_KEY = 'finan_ai_user_profile_cuba_v4';
const TRANSACTIONS_KEY = 'finan_ai_transactions_cuba_v4';
const CHAT_HISTORY_KEY = 'finan_ai_chat_history_cuba_v4';

export const DEFAULT_PROFILE: UserProfile = {
  id: 'user_main',
  name: 'Luis Ángel',
  currency: 'CUP ($)',
  customApiKey: '',
  pushEnabled: true,
  reminderTime: '20:00',
  initialCashBalance: 0,
  aiProvider: 'gemini',
  ollamaUrl: 'https://api.ollama.com',
  ollamaModel: 'llama3.2',
  ollamaApiKey: ''
};

// Seed realistic transactions for variable cash income & expenses in Cuba
function getInitialSeedTransactions(): Transaction[] {
  const now = new Date();
  
  const daysAgo = (days: number, hour = 14) => {
    const d = new Date(now);
    d.setDate(d.getDate() - days);
    d.setHours(hour, 0, 0, 0);
    return d.toISOString();
  };

  return [
    {
      id: 'tx_cuba_var_1',
      title: 'Dinero generado en negocio / servicio',
      amount: 18000,
      type: 'income',
      category: 'Trabajos & Servicios',
      date: daysAgo(4, 10),
      notes: 'Cobrado en efectivo al instante',
      rawUtterance: 'hice 18000 pesos en un trabajo'
    },
    {
      id: 'tx_cuba_var_2',
      title: 'Venta de productos / mercancía',
      amount: 12500,
      type: 'income',
      category: 'Ventas & Negocio',
      date: daysAgo(2, 16),
      notes: 'Efectivo recibido de cliente',
      rawUtterance: 'me entraron 12500 de una venta'
    },
    {
      id: 'tx_cuba_var_3',
      title: 'Gasolina y pasajes botero',
      amount: 1800,
      type: 'expense',
      category: 'Transporte & Boteros',
      date: daysAgo(3, 11),
      notes: 'Botero y gasolina en efectivo',
      rawUtterance: 'gaste 1800 en gasolina y botero'
    },
    {
      id: 'tx_cuba_var_4',
      title: 'Cervezas Bucanero y comida afuera',
      amount: 1200,
      type: 'expense',
      category: 'Cerveza & Recreación',
      date: daysAgo(2, 21),
      notes: 'Salida con amigos',
      rawUtterance: '1200 en cerveza y comida'
    },
    {
      id: 'tx_cuba_var_5',
      title: 'Mandados de la bodega, arroz y viandas',
      amount: 3400,
      type: 'expense',
      category: 'Bodega & Alimentos',
      date: daysAgo(1, 15),
      notes: 'Alimentos en efectivo',
      rawUtterance: 'hoy gaste 3400 en bodega y mandados'
    },
    {
      id: 'tx_cuba_var_6',
      title: 'Recarga ETECSA paquete datos',
      amount: 500,
      type: 'expense',
      category: 'Comunicaciones & ETECSA',
      date: daysAgo(0, 9),
      notes: 'Paquete de datos en efectivo',
      rawUtterance: '500 pesos de recarga ETECSA'
    }
  ];
}

function getInitialChatMessages(): ChatMessage[] {
  return [
    {
      id: 'msg_seed_cuba_v4',
      role: 'agent',
      content: '🇨🇺 ¡Hola! Soy **FinanAI Cuba**, tu agente para controlar tu **efectivo diario en vivo**.\n\nSoporta modelos de **Ollama Cloud** (Llama 3.2, Qwen 2.5, DeepSeek R1) y **Gemini AI**.\n\nPuedes escribirme o hablarme en voz normal:\n\n* *"Hice 12000 pesos hoy en el negocio y gasté 1500 en gasolina y 800 en comida"*\n* *"Cobré 4500 de un servicio"*\n\nYo sumaré y restaré todo al instante.',
      timestamp: new Date().toISOString()
    }
  ];
}

function emitChange() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('finan_storage_updated'));
  }
}

// Profile API
export function getUserProfile(): UserProfile {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(DEFAULT_PROFILE));
      return DEFAULT_PROFILE;
    }
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_PROFILE, ...parsed };
  } catch {
    return DEFAULT_PROFILE;
  }
}

export function saveUserProfile(profile: Partial<UserProfile>): UserProfile {
  const current = getUserProfile();
  const updated = { ...current, ...profile };
  localStorage.setItem(PROFILE_KEY, JSON.stringify(updated));
  emitChange();
  return updated;
}

// Transactions API
export function getTransactions(): Transaction[] {
  try {
    const raw = localStorage.getItem(TRANSACTIONS_KEY);
    if (!raw) {
      const seeds = getInitialSeedTransactions();
      localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(seeds));
      return seeds;
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function addTransactions(newTxs: Omit<Transaction, 'id'>[]): Transaction[] {
  const current = getTransactions();
  const created: Transaction[] = newTxs.map(t => ({
    ...t,
    id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
  }));
  const updated = [...created, ...current];
  localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(updated));
  emitChange();
  return created;
}

export function addSingleTransaction(tx: Omit<Transaction, 'id'>): Transaction {
  const [created] = addTransactions([tx]);
  return created;
}

export function updateTransaction(id: string, updates: Partial<Transaction>): Transaction | null {
  const current = getTransactions();
  const idx = current.findIndex(t => t.id === id);
  if (idx === -1) return null;
  current[idx] = { ...current[idx], ...updates };
  localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(current));
  emitChange();
  return current[idx];
}

export function deleteTransaction(id: string): boolean {
  const current = getTransactions();
  const filtered = current.filter(t => t.id !== id);
  localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(filtered));
  emitChange();
  return true;
}

export function clearAllTransactions() {
  localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify([]));
  emitChange();
}

// Chat API
export function getChatMessages(): ChatMessage[] {
  try {
    const raw = localStorage.getItem(CHAT_HISTORY_KEY);
    if (!raw) {
      const initial = getInitialChatMessages();
      localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function addChatMessage(msg: Omit<ChatMessage, 'id'>): ChatMessage {
  const current = getChatMessages();
  const created: ChatMessage = {
    ...msg,
    id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
  };
  const updated = [...current, created];
  localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(updated));
  emitChange();
  return created;
}

export function clearChatHistory() {
  const initial = getInitialChatMessages();
  localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(initial));
  emitChange();
}

// Variable Income Cash Flow Summary Calculations
export function getFinancialSummary(year?: number, month?: number) {
  const txs = getTransactions();
  const profile = getUserProfile();

  const targetDate = new Date();
  const targetYear = year ?? targetDate.getFullYear();
  const targetMonth = month ?? targetDate.getMonth();

  // All-time totals for absolute cash in hand
  const allTimeIncome = txs
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const allTimeExpenses = txs
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const currentCashInHand = (profile.initialCashBalance || 0) + allTimeIncome - allTimeExpenses;

  // Current Month Totals
  const monthlyTxs = txs.filter(t => {
    const d = new Date(t.date);
    return d.getFullYear() === targetYear && d.getMonth() === targetMonth;
  });

  const monthlyIncome = monthlyTxs
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const monthlyExpenses = monthlyTxs
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const monthlyNet = monthlyIncome - monthlyExpenses;

  // Category Breakdown
  const categoryMap: Record<string, { total: number; count: number; type: 'expense' | 'income' }> = {};
  
  monthlyTxs.forEach(t => {
    if (!categoryMap[t.category]) {
      categoryMap[t.category] = { total: 0, count: 0, type: t.type };
    }
    categoryMap[t.category].total += t.amount;
    categoryMap[t.category].count += 1;
  });

  const categorySummaries: CategorySummary[] = Object.entries(categoryMap)
    .map(([cat, data]) => {
      const baseTotal = data.type === 'income' ? (monthlyIncome || 1) : (monthlyExpenses || 1);
      const pct = (data.total / baseTotal) * 100;
      return {
        category: cat as any,
        totalAmount: data.total,
        percentage: Math.round(pct * 10) / 10,
        count: data.count,
        type: data.type
      };
    })
    .sort((a, b) => b.totalAmount - a.totalAmount);

  // Daily timeline
  const dailyMap: Record<string, { income: number; expense: number }> = {};
  monthlyTxs.forEach(t => {
    const key = t.date.split('T')[0];
    if (!dailyMap[key]) {
      dailyMap[key] = { income: 0, expense: 0 };
    }
    if (t.type === 'income') dailyMap[key].income += t.amount;
    else dailyMap[key].expense += t.amount;
  });

  const sortedDates = Object.keys(dailyMap).sort();
  const dailySummaries: DailySummary[] = sortedDates.map(dKey => {
    const d = new Date(dKey + 'T00:00:00');
    const formattedDate = d.toLocaleDateString('es-CU', { day: 'numeric', month: 'short' });
    const inc = dailyMap[dKey].income;
    const exp = dailyMap[dKey].expense;
    return {
      dateKey: dKey,
      formattedDate,
      income: inc,
      expense: exp,
      net: inc - exp
    };
  });

  return {
    currentCashInHand,
    monthlyIncome,
    monthlyExpenses,
    monthlyNet,
    allTimeIncome,
    allTimeExpenses,
    transactionCount: monthlyTxs.length,
    categorySummaries,
    dailySummaries,
    monthlyTxs
  };
}
