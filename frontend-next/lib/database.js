const initSqlJs = require('sql.js/dist/sql-wasm.js');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(process.cwd(), 'blog.db');
let db = null;

async function getDb() {
  if (db) return db;
  
  const SQL = await initSqlJs({
    locateFile: file => 'https://sql.js.org/js/sql-wasm.wasm'
  });
  
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

function saveDb() {
  if (db) {
    const data = db.export();
    fs.writeFileSync(DB_PATH, Buffer.from(data));
  }
}

function query(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
}

function queryOne(sql, params = []) {
  const rows = query(sql, params);
  return rows[0] || null;
}

function run(sql, params = []) {
  db.run(sql, params);
  saveDb();
}

module.exports = { getDb, query, queryOne, run, saveDb };