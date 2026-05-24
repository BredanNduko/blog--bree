const router = require('express').Router();
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');
const { query, queryOne, run } = require('../database');
const { requireAuth } = require('../auth');

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

function calcReadTime(body) {
  const words = body.replace(/<[^>]+>/g, '').split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

async function attachTags(article) {
  if (!article) return null;
  const tags = await query(
    `SELECT t.id, t.name, t.slug FROM tags t
     JOIN article_tags at ON at.tag_id = t.id
     WHERE at.article_id = $1`,
    [article.id]
  );
  article.tags = tags;
  return article;
}

// ── PUBLIC ROUTES ────────────────────────────────────────────────────────────

router.get('/', async (req, res) => {
  const { tag, search, page = 1, limit = 10 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  try {
    let sql = `
      SELECT a.*, u.display_name as author_name, u.avatar_url as author_avatar
      FROM articles a
      JOIN users u ON u.id = a.author_id
      WHERE a.status = 'published'
    `;
    const params = [];

    if (search) {
      sql += ` AND (a.title ILIKE $1 OR a.excerpt ILIKE $2 OR a.body ILIKE $3)`;
      const s = `%${search}%`;
      params.push(s, s, s);
    }

    if (tag) {
      sql += ` AND a.id IN (
        SELECT at.article_id FROM article_tags at
        JOIN tags t ON t.slug = $4 WHERE t.id = at.tag_id
      )`;
      params.push(tag);
    }

    sql += ` ORDER BY a.published_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limit), offset);

    const articles = await query(sql, params);
    for (let a of articles) { await attachTags(a); }

    let countSql = `SELECT COUNT(*) as total FROM articles a WHERE a.status = 'published'`;
    const countParams = [];
    if (search) {
      countSql += ` AND (a.title ILIKE $1 OR a.excerpt ILIKE $2 OR a.body ILIKE $3)`;
      const s = `%${search}%`;
      countParams.push(s, s, s);
    }
    if (tag) {
      countSql += ` AND a.id IN (
        SELECT at.article_id FROM article_tags at
        JOIN tags t ON t.id = at.tag_id WHERE t.slug = $4
      )`;
      countParams.push(tag);
    }
    const { total } = await queryOne(countSql, countParams);

    res.json({
      articles,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/featured', async (req, res) => {
  try {
    const articles = await query(
      `SELECT a.*, u.display_name as author_name, u.avatar_url as author_avatar
       FROM articles a JOIN users u ON u.id = a.author_id
       WHERE a.status = 'published'
       ORDER BY a.views DESC, a.published_at DESC LIMIT 3`
    );
    for (let a of articles) { await attachTags(a); }
    res.json({ articles });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:slug', async (req, res) => {
  try {
    const article = await queryOne(
      `SELECT a.*, u.display_name as author_name, u.avatar_url as author_avatar, u.bio as author_bio
       FROM articles a JOIN users u ON u.id = a.author_id
       WHERE a.slug = $1 AND a.status = 'published'`,
      [req.params.slug]
    );
    if (!article) return res.status(404).json({ error: 'Article not found' });

    await run('UPDATE articles SET views = views + 1 WHERE id = $1', [article.id]);
    article.views = (article.views || 0) + 1;

    await attachTags(article);

    const related = await query(
      `SELECT a.id, a.title, a.slug, a.excerpt, a.cover_image, a.published_at, a.read_time
       FROM articles a
       WHERE a.status = 'published' AND a.id <> $1
       ORDER BY a.published_at DESC LIMIT 3`,
      [article.id]
    );

    res.json({ article, related });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── ADMIN ROUTES ─────────────────────────────────────────────────────────────

router.get('/admin/all', requireAuth, async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  try {
    let sql = `
      SELECT a.*, u.display_name as author_name
      FROM articles a JOIN users u ON u.id = a.author_id
      WHERE 1=1
    `;
    const params = [];
    if (status) { sql += ' AND a.status = $1'; params.push(status); }
    sql += ` ORDER BY a.updated_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limit), offset);

    const articles = await query(sql, params);
    for (let a of articles) { await attachTags(a); }

    const totalSql = `SELECT COUNT(*) as total FROM articles WHERE 1=1${status ? ' AND status=$1' : ''}`;
    const { total } = await queryOne(totalSql, status ? [status] : []);

    res.json({ articles, pagination: { page: parseInt(page), total, pages: Math.ceil(total / parseInt(limit)) } });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/admin/id/:id', requireAuth, async (req, res) => {
  try {
    const article = await queryOne('SELECT * FROM articles WHERE id = $1', [req.params.id]);
    if (!article) return res.status(404).json({ error: 'Not found' });
    await attachTags(article);
    res.json({ article });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', requireAuth, [
  body('title').notEmpty().trim(),
  body('body').notEmpty(),
  body('status').isIn(['draft', 'published'])
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { title, body: content, excerpt, cover_image, status, tags: tagNames = [] } = req.body;

  try {
    const id = uuidv4();
    let slug = slugify(title);
    let existing = await queryOne('SELECT id FROM articles WHERE slug = $1', [slug]);
    if (existing) slug = `${slug}-${Date.now()}`;

    const readTime = calcReadTime(content);
    const now = new Date().toISOString();
    const publishedAt = status === 'published' ? now : null;

    await run(
      `INSERT INTO articles (id, author_id, title, slug, excerpt, body, cover_image, status, read_time, views, created_at, updated_at, published_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 0, $10, $11, $12)`,
      [id, req.user.id, title, slug, excerpt || '', content, cover_image || '', status, readTime, now, now, publishedAt]
    );

    await handleTags(id, tagNames);

    const article = await queryOne('SELECT * FROM articles WHERE id = $1', [id]);
    await attachTags(article);
    res.status(201).json({ article });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', requireAuth, [
  body('title').notEmpty().trim(),
  body('body').notEmpty(),
  body('status').isIn(['draft', 'published'])
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { title, body: content, excerpt, cover_image, status, tags: tagNames = [] } = req.body;

  try {
    const existing = await queryOne('SELECT * FROM articles WHERE id = $1', [req.params.id]);
    if (!existing) return res.status(404).json({ error: 'Not found' });

    const readTime = calcReadTime(content);
    const now = new Date().toISOString();
    const publishedAt = status === 'published'
      ? (existing.published_at || now)
      : null;

    await run(
      `UPDATE articles SET title=$1, excerpt=$2, body=$3, cover_image=$4, status=$5, read_time=$6, updated_at=$7, published_at=$8 WHERE id=$9`,
      [title, excerpt || '', content, cover_image || '', status, readTime, now, publishedAt, req.params.id]
    );

    await handleTags(req.params.id, tagNames);

    const article = await queryOne('SELECT * FROM articles WHERE id = $1', [req.params.id]);
    await attachTags(article);
    res.json({ article });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const existing = await queryOne('SELECT id FROM articles WHERE id = $1', [req.params.id]);
    if (!existing) return res.status(404).json({ error: 'Not found' });
    await run('DELETE FROM article_tags WHERE article_id = $1', [req.params.id]);
    await run('DELETE FROM articles WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ── TAGS ─────────────────────────────────────────────────────────────────────

router.get('/tags/all', async (req, res) => {
  try {
    const tags = await query(`
      SELECT t.*, COUNT(at.article_id) as article_count
      FROM tags t
      LEFT JOIN article_tags at ON at.tag_id = t.id
      LEFT JOIN articles a ON a.id = at.article_id AND a.status = 'published'
      GROUP BY t.id
      ORDER BY article_count DESC
    `);
    res.json({ tags });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

async function handleTags(articleId, tagNames) {
  await run('DELETE FROM article_tags WHERE article_id = $1', [articleId]);

  for (const name of tagNames) {
    const trimmed = name.trim();
    if (!trimmed) continue;
    const slug = slugify(trimmed);

    let tag = await queryOne('SELECT * FROM tags WHERE slug = $1', [slug]);
    if (!tag) {
      const tagId = uuidv4();
      await run('INSERT INTO tags (id, name, slug) VALUES ($1, $2, $3)', [tagId, trimmed, slug]);
      tag = { id: tagId };
    }
    try { await run('INSERT INTO article_tags (article_id, tag_id) VALUES ($1, $2)', [articleId, tag.id]); } catch (_) {}
  }
}

module.exports = router;
