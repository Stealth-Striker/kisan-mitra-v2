const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'kisan.db');
const JSON_BACKUP_FILE = path.join(__dirname, 'kisan_db.json');

let sqliteDb = null;
let useSqlite = false;

try {
  const Database = require('better-sqlite3');
  sqliteDb = new Database(DB_PATH);
  sqliteDb.pragma('journal_mode = WAL');
  sqliteDb.pragma('foreign_keys = ON');

  // ── SQLite Schema Setup ─────────────────────────────────────────────────────────
  sqliteDb.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT,
      role TEXT DEFAULT 'user',
      phone TEXT,
      notification_prefs TEXT DEFAULT '{}',
      is_verified INTEGER DEFAULT 1,
      reset_token TEXT,
      reset_token_expires_at INTEGER,
      data_json TEXT,
      created_date TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

    CREATE TABLE IF NOT EXISTS farms (
      id TEXT PRIMARY KEY,
      created_by_id TEXT,
      name TEXT,
      location TEXT,
      crop TEXT,
      soil_type TEXT,
      acreage REAL,
      sowing_date TEXT,
      language TEXT DEFAULT 'English',
      data_json TEXT,
      created_date TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_farms_creator ON farms(created_by_id);

    CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY,
      created_by_id TEXT,
      title TEXT,
      crop TEXT,
      language TEXT DEFAULT 'English',
      data_json TEXT,
      created_date TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_conversations_creator ON conversations(created_by_id);

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL,
      sender TEXT,
      content TEXT,
      image_url TEXT,
      audio_url TEXT,
      data_json TEXT,
      created_date TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);

    CREATE TABLE IF NOT EXISTS crop_diagnoses (
      id TEXT PRIMARY KEY,
      created_by_id TEXT,
      crop TEXT,
      disease TEXT,
      confidence REAL,
      severity TEXT,
      symptoms TEXT,
      recommended_actions TEXT,
      image_url TEXT,
      data_json TEXT,
      created_date TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_diagnoses_creator ON crop_diagnoses(created_by_id);

    CREATE TABLE IF NOT EXISTS disease_alerts (
      id TEXT PRIMARY KEY,
      disease TEXT,
      disease_name TEXT,
      alert_type TEXT,
      location TEXT,
      severity TEXT,
      crop TEXT,
      report_date TEXT,
      recommended_action TEXT,
      active INTEGER DEFAULT 1,
      data_json TEXT,
      created_date TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_alerts_active ON disease_alerts(active);

    CREATE TABLE IF NOT EXISTS market_prices (
      id TEXT PRIMARY KEY,
      market TEXT,
      location TEXT,
      crop TEXT,
      min_price REAL,
      max_price REAL,
      avg_price REAL,
      report_date TEXT,
      data_json TEXT,
      created_date TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_prices_crop ON market_prices(crop);
  `);
  useSqlite = true;
  console.log(`[db] SQLite database initialized successfully at: ${DB_PATH}`);
} catch (err) {
  console.warn('[db] SQLite initialization failed, falling back to JSON storage:', err.message);
  sqliteDb = null;
  useSqlite = false;
}

// ── JSON Fallback Store ────────────────────────────────────────────────────────
const DEFAULT_DB = {
  users: [],
  farms: [],
  conversations: [],
  messages: [],
  crop_diagnoses: [],
  disease_alerts: [],
  market_prices: []
};
let jsonData = { ...DEFAULT_DB };

function loadJson() {
  try {
    if (fs.existsSync(JSON_BACKUP_FILE)) {
      const content = fs.readFileSync(JSON_BACKUP_FILE, 'utf8');
      jsonData = JSON.parse(content);
      for (const key of Object.keys(DEFAULT_DB)) {
        if (!jsonData[key]) jsonData[key] = [];
      }
    } else {
      jsonData = { ...DEFAULT_DB };
      saveJson();
    }
  } catch (err) {
    console.error('[db] Error loading JSON database:', err);
    jsonData = { ...DEFAULT_DB };
  }
}

function saveJson() {
  try {
    fs.writeFileSync(JSON_BACKUP_FILE, JSON.stringify(jsonData, null, 2), 'utf8');
  } catch (err) {
    console.error('[db] Error writing JSON database to disk:', err);
  }
}

if (!useSqlite) {
  loadJson();
}

// ── SQLite Helpers ─────────────────────────────────────────────────────────────
const TABLE_COLUMNS = {
  users: ['id', 'email', 'password_hash', 'full_name', 'role', 'phone', 'notification_prefs', 'is_verified', 'reset_token', 'reset_token_expires_at', 'created_date'],
  farms: ['id', 'created_by_id', 'name', 'location', 'crop', 'soil_type', 'acreage', 'sowing_date', 'language', 'created_date'],
  conversations: ['id', 'created_by_id', 'title', 'crop', 'language', 'created_date'],
  messages: ['id', 'conversation_id', 'sender', 'content', 'image_url', 'audio_url', 'created_date'],
  crop_diagnoses: ['id', 'created_by_id', 'crop', 'disease', 'confidence', 'severity', 'symptoms', 'recommended_actions', 'image_url', 'created_date'],
  disease_alerts: ['id', 'disease', 'disease_name', 'alert_type', 'location', 'severity', 'crop', 'report_date', 'recommended_action', 'active', 'created_date'],
  market_prices: ['id', 'market', 'location', 'crop', 'min_price', 'max_price', 'avg_price', 'report_date', 'created_date'],
};

function deserializeRow(table, row) {
  if (!row) return null;
  const extra = row.data_json ? JSON.parse(row.data_json) : {};
  const obj = { ...row, ...extra };
  delete obj.data_json;

  if ('is_verified' in obj) obj.is_verified = Boolean(obj.is_verified);
  if ('active' in obj) obj.active = Boolean(obj.active);

  return obj;
}

function serializeItem(table, item) {
  const standardCols = TABLE_COLUMNS[table] || [];
  const standardData = {};
  const extraData = {};

  for (const [k, v] of Object.entries(item)) {
    if (standardCols.includes(k)) {
      if (k === 'is_verified' || k === 'active') {
        standardData[k] = v ? 1 : 0;
      } else {
        standardData[k] = v;
      }
    } else {
      extraData[k] = v;
    }
  }

  standardData.data_json = Object.keys(extraData).length > 0 ? JSON.stringify(extraData) : null;
  return standardData;
}

// ── SQLite Collection Implementation ───────────────────────────────────────────
function createSqliteCollection(tableName) {
  return {
    list: () => {
      const rows = sqliteDb.prepare(`SELECT * FROM ${tableName}`).all();
      return rows.map(r => deserializeRow(tableName, r));
    },
    find: (filterFn) => {
      const rows = sqliteDb.prepare(`SELECT * FROM ${tableName}`).all();
      const all = rows.map(r => deserializeRow(tableName, r));
      return filterFn ? all.filter(filterFn) : all;
    },
    findOne: (filterFn) => {
      const rows = sqliteDb.prepare(`SELECT * FROM ${tableName}`).all();
      const all = rows.map(r => deserializeRow(tableName, r));
      return all.find(filterFn) || null;
    },
    insert: (item) => {
      const newItem = {
        id: item.id || uuidv4(),
        created_date: item.created_date || new Date().toISOString(),
        ...item
      };
      const serialized = serializeItem(tableName, newItem);
      const keys = Object.keys(serialized);
      const placeholders = keys.map(() => '?').join(', ');
      const sql = `INSERT INTO ${tableName} (${keys.join(', ')}) VALUES (${placeholders})`;
      sqliteDb.prepare(sql).run(...Object.values(serialized));
      return newItem;
    },
    update: (id, updates) => {
      const current = sqliteDb.prepare(`SELECT * FROM ${tableName} WHERE id = ?`).get(id);
      if (!current) return null;
      const deserialized = deserializeRow(tableName, current);
      const merged = { ...deserialized, ...updates };
      const serialized = serializeItem(tableName, merged);
      
      const setClauses = Object.keys(serialized).map(k => `${k} = ?`).join(', ');
      const sql = `UPDATE ${tableName} SET ${setClauses} WHERE id = ?`;
      sqliteDb.prepare(sql).run(...Object.values(serialized), id);
      return merged;
    },
    delete: (id) => {
      const result = sqliteDb.prepare(`DELETE FROM ${tableName} WHERE id = ?`).run(id);
      return result.changes > 0;
    },
    deleteMany: (filterFn) => {
      const all = sqliteDb.prepare(`SELECT * FROM ${tableName}`).all().map(r => deserializeRow(tableName, r));
      const toDelete = all.filter(filterFn);
      if (toDelete.length === 0) return 0;

      const deleteStmt = sqliteDb.prepare(`DELETE FROM ${tableName} WHERE id = ?`);
      const trans = sqliteDb.transaction((items) => {
        let count = 0;
        for (const it of items) {
          const res = deleteStmt.run(it.id);
          count += res.changes;
        }
        return count;
      });
      return trans(toDelete);
    }
  };
}

// ── JSON Collection Implementation (Fallback) ──────────────────────────────────
function createJsonCollection(name) {
  return {
    list: () => {
      loadJson();
      return jsonData[name] || [];
    },
    find: (filterFn) => {
      loadJson();
      return (jsonData[name] || []).filter(filterFn);
    },
    findOne: (filterFn) => {
      loadJson();
      return (jsonData[name] || []).find(filterFn);
    },
    insert: (item) => {
      loadJson();
      const newItem = {
        id: item.id || uuidv4(),
        created_date: new Date().toISOString(),
        ...item
      };
      jsonData[name].push(newItem);
      saveJson();
      return newItem;
    },
    update: (id, updates) => {
      loadJson();
      const idx = jsonData[name].findIndex(item => item.id === id);
      if (idx === -1) return null;
      jsonData[name][idx] = { ...jsonData[name][idx], ...updates };
      saveJson();
      return jsonData[name][idx];
    },
    delete: (id) => {
      loadJson();
      const idx = jsonData[name].findIndex(item => item.id === id);
      if (idx === -1) return false;
      jsonData[name].splice(idx, 1);
      saveJson();
      return true;
    },
    deleteMany: (filterFn) => {
      loadJson();
      const originalCount = jsonData[name].length;
      jsonData[name] = jsonData[name].filter(item => !filterFn(item));
      const deletedCount = originalCount - jsonData[name].length;
      if (deletedCount > 0) saveJson();
      return deletedCount;
    }
  };
}

const collections = {
  users: useSqlite ? createSqliteCollection('users') : createJsonCollection('users'),
  farms: useSqlite ? createSqliteCollection('farms') : createJsonCollection('farms'),
  conversations: useSqlite ? createSqliteCollection('conversations') : createJsonCollection('conversations'),
  messages: useSqlite ? createSqliteCollection('messages') : createJsonCollection('messages'),
  crop_diagnoses: useSqlite ? createSqliteCollection('crop_diagnoses') : createJsonCollection('crop_diagnoses'),
  disease_alerts: useSqlite ? createSqliteCollection('disease_alerts') : createJsonCollection('disease_alerts'),
  market_prices: useSqlite ? createSqliteCollection('market_prices') : createJsonCollection('market_prices'),
};

// ── Initial Seeding & Migration ────────────────────────────────────────────────
(function seedInitialData() {
  const userCount = collections.users.list().length;

  if (userCount === 0) {
    let migrated = false;
    if (fs.existsSync(JSON_BACKUP_FILE)) {
      try {
        const raw = fs.readFileSync(JSON_BACKUP_FILE, 'utf8');
        const parsed = JSON.parse(raw);
        if (parsed.users && parsed.users.length > 0) {
          console.log('[db] Migrating existing kisan_db.json records to SQLite...');
          for (const key of Object.keys(collections)) {
            if (Array.isArray(parsed[key])) {
              for (const record of parsed[key]) {
                try {
                  collections[key].insert(record);
                } catch (e) {
                  // Ignore unique constraint on migration
                }
              }
            }
          }
          migrated = true;
          console.log('[db] Migration completed successfully.');
        }
      } catch (err) {
        console.warn('[db] Could not parse kisan_db.json for migration:', err.message);
      }
    }

    if (!migrated) {
      console.log('[db] Seeding default admin, alerts, and market prices...');
      const adminId = uuidv4();
      const hash = bcrypt.hashSync('admin123', 10);
      collections.users.insert({
        id: adminId,
        email: 'admin@kisanmitra.local',
        password_hash: hash,
        full_name: 'Admin',
        role: 'admin',
        notification_prefs: '{}',
        is_verified: true,
        created_date: new Date().toISOString()
      });

      const alerts = [
        { id: uuidv4(), disease: 'Early Blight', disease_name: 'Early Blight', alert_type: 'Disease', location: 'Kochi', severity: 'Moderate', crop: 'Tomato', report_date: new Date().toISOString().slice(0, 10), recommended_action: 'Apply copper-based fungicide weekly. Remove infected leaves.', active: true, created_date: new Date().toISOString() },
        { id: uuidv4(), disease: 'Powdery Mildew', disease_name: 'Powdery Mildew', alert_type: 'Disease', location: 'Ernakulam', severity: 'Low', crop: 'Tomato', report_date: new Date().toISOString().slice(0, 10), recommended_action: 'Improve air circulation. Apply neem oil spray.', active: true, created_date: new Date().toISOString() },
        { id: uuidv4(), disease: 'White Fly Infestation', disease_name: 'White Fly Infestation', alert_type: 'Pest', location: 'Thrissur', severity: 'High', crop: 'Cotton', report_date: new Date().toISOString().slice(0, 10), recommended_action: 'Use yellow sticky traps. Apply imidacloprid if severe.', active: true, created_date: new Date().toISOString() },
      ];
      alerts.forEach(a => collections.disease_alerts.insert(a));

      const prices = [
        { id: uuidv4(), market: 'Kochi Wholesale Market', location: 'Kochi', crop: 'Tomato', min_price: 14, max_price: 22, avg_price: 18, report_date: new Date().toISOString().slice(0, 10), created_date: new Date().toISOString() },
        { id: uuidv4(), market: 'Ernakulam Vegetable Market', location: 'Ernakulam', crop: 'Tomato', min_price: 15, max_price: 24, avg_price: 19, report_date: new Date().toISOString().slice(0, 10), created_date: new Date().toISOString() },
        { id: uuidv4(), market: 'Palakkad APMC', location: 'Palakkad', crop: 'Rice', min_price: 28, max_price: 34, avg_price: 31, report_date: new Date().toISOString().slice(0, 10), created_date: new Date().toISOString() },
        { id: uuidv4(), market: 'Kozhikode Market', location: 'Kozhikode', crop: 'Banana', min_price: 22, max_price: 30, avg_price: 26, report_date: new Date().toISOString().slice(0, 10), created_date: new Date().toISOString() },
      ];
      prices.forEach(p => collections.market_prices.insert(p));
    }
  }
})();

module.exports = {
  ...collections,
  _isSqlite: () => useSqlite,
  _sqliteDb: sqliteDb,
};
