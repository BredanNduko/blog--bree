const { Pool } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL || `postgresql://${process.env.DB_USER || 'postgres'}:${process.env.DB_PASSWORD || ''}@${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME || 'blog_bree'}`;

// Determine SSL configuration
let sslConfig;
if (process.env.DATABASE_URL) {
  // For managed services like Render, enable SSL with relaxed validation
  sslConfig = { rejectUnauthorized: false };
} else {
  // For local development (including Docker-compose), disable SSL
  sslConfig = false;
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: sslConfig,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000
});

pool.on('error', (err) => {
  console.error('PostgreSQL pool error:', err);
});

async function getDb() {
  return pool;
}

async function query(sql, params = []) {
  const result = await pool.query(sql, params);
  return result.rows;
}

async function queryOne(sql, params = []) {
  const rows = await query(sql, params);
  return rows[0] || null;
}

async function run(sql, params = []) {
  await pool.query(sql, params);
}

// Initialize schema
async function initSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      display_name TEXT NOT NULL,
      bio TEXT DEFAULT '',
      avatar_url TEXT DEFAULT '',
      role TEXT DEFAULT 'admin',
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS articles (
      id TEXT PRIMARY KEY,
      author_id TEXT NOT NULL,
      title TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      excerpt TEXT DEFAULT '',
      body TEXT NOT NULL,
      cover_image TEXT DEFAULT '',
      status TEXT DEFAULT 'draft',
      read_time INTEGER DEFAULT 0,
      views INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW(),
      published_at TIMESTAMP,
      FOREIGN KEY (author_id) REFERENCES users(id)
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS tags (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      slug TEXT UNIQUE NOT NULL
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS article_tags (
      article_id TEXT NOT NULL,
      tag_id TEXT NOT NULL,
      PRIMARY KEY (article_id, tag_id),
      FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
      FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
    )
  `);
}

module.exports = { getDb, query, queryOne, run, initSchema };
