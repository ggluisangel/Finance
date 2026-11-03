import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.resolve(process.cwd(), 'data.sqlite');
const db = new Database(dbPath);

// Enable WAL mode for high performance concurrency
db.pragma('journal_mode = WAL');

// Initialize SQLite Database Tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    currency TEXT DEFAULT 'CUP ($)',
    initial_cash_balance REAL DEFAULT 0,
    ai_provider TEXT DEFAULT 'gemini',
    ollama_url TEXT DEFAULT 'https://api.ollama.com',
    ollama_model TEXT DEFAULT 'llama3.2',
    ollama_api_key TEXT DEFAULT '',
    custom_api_key TEXT DEFAULT '',
    push_enabled INTEGER DEFAULT 1,
    reminder_time TEXT DEFAULT '20:00',
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    amount REAL NOT NULL,
    type TEXT NOT NULL,
    category TEXT NOT NULL,
    notes TEXT,
    raw_utterance TEXT,
    date TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS chat_messages (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    transactions_json TEXT,
    is_error INTEGER DEFAULT 0,
    timestamp TEXT NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);

export default db;
