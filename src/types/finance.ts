export type TransactionCategory =
  | 'Bodega & Alimentos'
  | 'Cerveza & Recreación'
  | 'Transporte & Boteros'
  | 'Comunicaciones & ETECSA'
  | 'Servicios & Vivienda'
  | 'Salud & Aseo'
  | 'Ventas & Negocio'
  | 'Trabajos & Servicios'
  | 'Remesas & Entradas'
  | 'Otros Gastos';

export type TransactionType = 'expense' | 'income';

export interface Transaction {
  id: string;
  title: string;
  amount: number;
  type: TransactionType;
  category: TransactionCategory;
  date: string; // ISO string
  notes?: string;
  rawUtterance?: string;
}

export type AIProvider = 'gemini' | 'ollama';

export interface UserProfile {
  id: string;
  name: string;
  currency: string; // e.g. "CUP ($)"
  customApiKey?: string;
  pushEnabled: boolean;
  reminderTime: string; // e.g. "20:00"
  lastReminderCheck?: string;
  initialCashBalance?: number;
  
  // AI Provider settings
  aiProvider: AIProvider;
  ollamaUrl: string; // e.g. "https://api.ollama.com" or "http://localhost:11434"
  ollamaModel: string; // e.g. "llama3.2", "qwen2.5", "deepseek-r1"
  ollamaApiKey?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'agent';
  content: string;
  timestamp: string;
  transactions?: Transaction[];
  isError?: boolean;
}

export interface CategorySummary {
  category: TransactionCategory;
  totalAmount: number;
  percentage: number;
  count: number;
  type: TransactionType;
}

export interface DailySummary {
  dateKey: string; // YYYY-MM-DD
  formattedDate: string;
  income: number;
  expense: number;
  net: number;
}
