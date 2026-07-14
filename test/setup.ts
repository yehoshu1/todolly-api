import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';

// Set test env
process.env.NODE_ENV = 'test';

// Use an isolated file-based DB for tests so both test runner and app can connect
const TEST_DB = path.join(process.cwd(), 'test.sqlite');
// libsql expects a file: URL scheme for local sqlite files
process.env.DB_FILE_NAME = `file:${TEST_DB}`;

// Remove any existing test DB
try {
  if (fs.existsSync(TEST_DB)) fs.unlinkSync(TEST_DB);
} catch (err) {
  // ignore
}

// Create tables needed by the app
const db = new Database(TEST_DB);
db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY UNIQUE,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tasks (
  task_id TEXT PRIMARY KEY UNIQUE,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  due_date TEXT,
  due_time TEXT,
  location TEXT,
  status INTEGER NOT NULL DEFAULT 0,
  priority TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS subtasks (
  subtask_id TEXT PRIMARY KEY UNIQUE,
  task_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status INTEGER NOT NULL DEFAULT 0,
  priority TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY(task_id) REFERENCES tasks(task_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS reminders (
  reminder_id TEXT PRIMARY KEY UNIQUE,
  task_id TEXT NOT NULL,
  remind_at TEXT NOT NULL,
  message TEXT,
  FOREIGN KEY(task_id) REFERENCES tasks(task_id) ON DELETE CASCADE
);
`);

db.close();

// Export nothing; this file runs before tests to ensure DB is ready
