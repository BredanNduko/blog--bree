import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'blog.db');
let db = null;

export async function getDb() {
  if (db) return db;
  
  const SQL = await initSqlJs();
  
  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }
  
  initSchema();
  return db;
}

function initSchema() {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL,
    display_name TEXT NOT NULL, bio TEXT DEFAULT '', avatar_url TEXT DEFAULT '', 
    role TEXT DEFAULT 'admin', created_at TEXT DEFAULT (datetime('now'))
  )`);
  
  db.run(`CREATE TABLE IF NOT EXISTS articles (
    id TEXT PRIMARY KEY, author_id TEXT NOT NULL, title TEXT NOT NULL, slug TEXT UNIQUE NOT NULL,
    excerpt TEXT DEFAULT '', body TEXT NOT NULL, cover_image TEXT DEFAULT '', 
    status TEXT DEFAULT 'draft', read_time INTEGER DEFAULT 0, views INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now')),
    published_at TEXT, FOREIGN KEY (author_id) REFERENCES users(id)
  )`);
  
  db.run(`CREATE TABLE IF NOT EXISTS tags (
    id TEXT PRIMARY KEY, name TEXT UNIQUE NOT NULL, slug TEXT UNIQUE NOT NULL
  )`);
  
  db.run(`CREATE TABLE IF NOT EXISTS article_tags (
    article_id TEXT NOT NULL, tag_id TEXT NOT NULL,
    PRIMARY KEY (article_id, tag_id),
    FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
  )`);
  
  saveDb();
}

export function saveDb() {
  if (db) {
    const data = db.export();
    fs.writeFileSync(DB_PATH, Buffer.from(data));
  }
}

export const query = (sql, params = []) => {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
};

export const queryOne = (sql, params = []) => query(sql, params)[0] || null;

export const run = (sql, params = []) => { db.run(sql, params); saveDb(); };