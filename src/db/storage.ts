import { UserProfile, Transaction, ChatMessage, CategorySummary, DailySummary } from '../types/finance';

const PROFILE_KEY = 'finan_ai_user_profile_clean_v5';
const TRANSACTIONS_KEY = 'finan_ai_transactions_clean_v5';
const CHAT_HISTORY_KEY = 'finan_ai_chat_history_clean_v5';
const SESSION_KEY = 'finan_ai_auth_session_clean_v5';

export const DEFAULT_PROFILE: UserProfile = {
  id: '',
  name: '',
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

function emitChange() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('finan_storage_updated'));
  }
}

// Session API
export function getStoredSession(): { userId: string; username: string } | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveSessionData(data: { user: UserProfile; transactions: Transaction[]; chatMessages: ChatMessage[] }) {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ userId: data.user.id, username: data.user.name }));
  localStorage.setItem(PROFILE_KEY, JSON.stringify(data.user));
  localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(data.transactions || []));
  localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(data.chatMessages || []));
  emitChange();
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(PROFILE_KEY);
  localStorage.removeItem(TRANSACTIONS_KEY);
  localStorage.removeItem(CHAT_HISTORY_KEY);
  emitChange();
}

// Profile API
export function getUserProfile(): UserProfile {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return DEFAULT_PROFILE;
    return JSON.parse(raw);
  } catch {
    return DEFAULT_PROFILE;
  }
}

export function saveUserProfile(profile: Partial<UserProfile>): UserProfile {
  const current = getUserProfile();
  const updated = { ...current, ...profile };
  localStorage.setItem(PROFILE_KEY, JSON.stringify(updated));
  emitChange();

  // Async server sync if online
  if (typeof navigator !== 'undefined' && navigator.onLine && updated.id) {
    fetch('/api/user/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: updated.id,
        currency: updated.currency,
        initialCashBalance: updated.initialCashBalance,
        aiProvider: updated.aiProvider,
        ollamaUrl: updated.ollamaUrl,
        ollamaModel: updated.ollamaModel,
        ollamaApiKey: updated.ollamaApiKey,
        customApiKey: updated.customApiKey,
        pushEnabled: updated.pushEnabled,
        reminderTime: updated.reminderTime
      })
    }).catch(e => console.warn('Offline profile update queued locally:', e));
  }

  return updated;
}

// Transactions API (Starts cleanly at 0)
export function getTransactions(): Transaction[] {
  try {
    const raw = localStorage.getItem(TRANSACTIONS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function setLocalTransactions(txs: Transaction[]) {
  localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(txs));
  emitChange();
}

export function addTransactions(newTxs: Omit<Transaction, 'id'>[]): Transaction[] {
  const current = getTransactions();
  const user = getUserProfile();

  const created: Transaction[] = newTxs.map(t => ({
    ...t,
    id: (t as any).id || `tx_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
  }));

  const updated = [...created, ...current];
  localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(updated));
  emitChange();

  // Async server sync
  if (typeof navigator !== 'undefined' && navigator.onLine && user.id) {
    created.forEach(tx => {
      fetch('/api/transactions/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          title: tx.title,
          amount: tx.amount,
          type: tx.type,
          category: tx.category,
          notes: tx.notes,
          date: tx.date
        })
      }).catch(e => console.warn('Offline transaction creation saved locally:', e));
    });
  }

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

  if (typeof navigator !== 'undefined' && navigator.onLine) {
    fetch(`/api/transactions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(current[idx])
    }).catch(e => console.warn('Offline update saved locally:', e));
  }

  return current[idx];
}

export function deleteTransaction(id: string): boolean {
  const current = getTransactions();
  const filtered = current.filter(t => t.id !== id);
  localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(filtered));
  emitChange();

  if (typeof navigator !== 'undefined' && navigator.onLine) {
    fetch(`/api/transactions/${id}`, {
      method: 'DELETE'
    }).catch(e => console.warn('Offline delete saved locally:', e));
  }

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
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function setLocalChatMessages(msgs: ChatMessage[]) {
  localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(msgs));
  emitChange();
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
  const user = getUserProfile();
  localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify([]));
  emitChange();

  if (typeof navigator !== 'undefined' && navigator.onLine && user.id) {
    fetch(`/api/chat/clear/${user.id}`, { method: 'DELETE' }).catch(e => console.warn(e));
  }
}

// Variable Income Cash Flow Summary Calculations (Clean 0 Balance)
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

export async function resetUserDataAPI(): Promise<boolean> {
  const user = getUserProfile();
  if (!user.id) return false;

  try {
    const res = await fetch(`/api/user/reset/${user.id}`, {
      method: 'DELETE'
    });
    const data = await res.json();
    if (data.success) {
      setLocalTransactions([]);
      if (data.chatMessage) {
        setLocalChatMessages([data.chatMessage]);
      } else {
        setLocalChatMessages([]);
      }
      return true;
    }
  } catch (e) {
    console.error('Error resetting user data:', e);
  }
  return false;
}

