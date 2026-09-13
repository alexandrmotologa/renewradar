import path from 'node:path';
import fs from 'node:fs';

// In CommonJS runtime, require is built-in
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { DatabaseSync } = (eval('require'))('node:sqlite') as { DatabaseSync: any };

let dbInstance: any = null;

export function getDatabase(dbPath?: string): any {
  if (dbInstance) {
    return dbInstance;
  }

  const resolvedPath = dbPath || process.env.DATABASE_PATH || './data/renewradar.db';
  
  // Handle in-memory database for testing
  if (resolvedPath === ':memory:') {
    dbInstance = new DatabaseSync(':memory:');
    initSchema(dbInstance);
    return dbInstance;
  }

  const fullPath = path.resolve(process.cwd(), resolvedPath);
  const dir = path.dirname(fullPath);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  dbInstance = new DatabaseSync(fullPath);

  // Set WAL mode and performance optimizations
  dbInstance.exec('PRAGMA journal_mode = WAL;');
  dbInstance.exec('PRAGMA synchronous = NORMAL;');
  dbInstance.exec('PRAGMA foreign_keys = ON;');

  initSchema(dbInstance);
  runMigrations(dbInstance);
  return dbInstance;
}

function initSchema(db: any): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS subscriptions (
      id TEXT PRIMARY KEY,
      telegram_user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      amount REAL NOT NULL,
      currency TEXT DEFAULT 'EUR',
      billing_cycle TEXT NOT NULL,
      next_billing_date INTEGER NOT NULL,
      is_free_trial INTEGER DEFAULT 0,
      trial_duration_days INTEGER DEFAULT 0,
      alert_sent INTEGER DEFAULT 0,
      cancel_url TEXT,
      cancellation_steps TEXT,
      notes TEXT,
      status TEXT DEFAULT 'ACTIVE',
      saved_amount REAL DEFAULT 0.0,
      shared_with_count INTEGER DEFAULT 1,
      platform TEXT DEFAULT 'WEB',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_subscriptions_user 
      ON subscriptions(telegram_user_id);

    CREATE INDEX IF NOT EXISTS idx_subscriptions_watchdog 
      ON subscriptions(is_free_trial, alert_sent, next_billing_date);

    CREATE TABLE IF NOT EXISTS user_settings (
      telegram_user_id INTEGER PRIMARY KEY,
      preferred_currency TEXT DEFAULT 'EUR',
      alert_threshold_hours INTEGER DEFAULT 48,
      alert_thresholds TEXT DEFAULT '[48, 24]',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);
}

function runMigrations(db: any): void {
  // Non-destructive column additions for existing tables
  const columns = [
    { table: 'subscriptions', column: 'cancellation_steps', type: 'TEXT' },
    { table: 'subscriptions', column: 'status', type: "TEXT DEFAULT 'ACTIVE'" },
    { table: 'subscriptions', column: 'saved_amount', type: 'REAL DEFAULT 0.0' },
    { table: 'subscriptions', column: 'shared_with_count', type: 'INTEGER DEFAULT 1' },
    { table: 'subscriptions', column: 'platform', type: "TEXT DEFAULT 'WEB'" },
    { table: 'user_settings', column: 'alert_thresholds', type: "TEXT DEFAULT '[48, 24]'" },
  ];

  for (const item of columns) {
    try {
      db.exec(`ALTER TABLE ${item.table} ADD COLUMN ${item.column} ${item.type};`);
    } catch (e) {
      // Column already exists, ignore error safely
    }
  }
}

export function closeDatabase(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}
