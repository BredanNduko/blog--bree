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

function attachTags(article) {
  if (!article) return null;
  const tags = query(
    `SELECT t.id, t.name, t.slug FROM tags t
     JOIN article_tags at ON at.tag_id = t.id
     WHERE at.article_id = ?`,
    [article.id]
  );
  article.tags = tags;
  return article;
}

// ── PUBLIC ROUTES ────────────────────────────────────────────────────────────

// GET /api/articles — list published articles
router.get('/', (req, res) => {
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
      sql += ` AND (a.title LIKE ? OR a.excerpt LIKE ? OR a.body LIKE ?)`;
      const s = `%${search}%`;
      params.push(s, s, s);
    }

    if (tag) {
      sql += ` AND a.id IN (
        SELECT at.article_id FROM article_tags at
        JOIN tags t ON t.id = at.tag_id WHERE t.slug = ?
      )`;
      params.push(tag);
    }

    sql += ` ORDER BY a.published_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), offset);

    const articles = query(sql, params).map(a => attachTags(a));

    // Count total
    let countSql = `SELECT COUNT(*) as total FROM articles a WHERE a.status = 'published'`;
    const countParams = [];
    if (search) {
      countSql += ` AND (a.title LIKE ? OR a.excerpt LIKE ? OR a.body LIKE ?)`;
      const s = `%${search}%`;
      countParams.push(s, s, s);
    }
    if (tag) {
      countSql += ` AND a.id IN (
        SELECT at.article_id FROM article_tags at
        JOIN tags t ON t.id = at.tag_id WHERE t.slug = ?
      )`;
      countParams.push(tag);
    }
    const { total } = queryOne(countSql, countParams);

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

// GET /api/articles/featured — top 3 featured articles
router.get('/featured', (req, res) => {
  try {
    const articles = query(
      `SELECT a.*, u.display_name as author_name, u.avatar_url as author_avatar
       FROM articles a JOIN users u ON u.id = a.author_id
       WHERE a.status = 'published'
       ORDER BY a.views DESC, a.published_at DESC LIMIT 3`
    ).map(a => attachTags(a));
    res.json({ articles });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/articles/:slug — single article (public)
router.get('/:slug', (req, res) => {
  try {
    const article = queryOne(
      `SELECT a.*, u.display_name as author_name, u.avatar_url as author_avatar, u.bio as author_bio
       FROM articles a JOIN users u ON u.id = a.author_id
       WHERE a.slug = ? AND a.status = 'published'`,
      [req.params.slug]
    );
    if (!article) return res.status(404).json({ error: 'Article not found' });

    // increment views
    run('UPDATE articles SET views = views + 1 WHERE id = ?', [article.id]);
    article.views = (article.views || 0) + 1;

    attachTags(article);

    // related articles
    const related = query(
      `SELECT a.id, a.title, a.slug, a.excerpt, a.cover_image, a.published_at, a.read_time
       FROM articles a
       WHERE a.status = 'published' AND a.id != ?
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

// GET /api/articles/admin/all — all articles (drafts + published)
router.get('/admin/all', requireAuth, (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  try {
    let sql = `
      SELECT a.*, u.display_name as author_name
      FROM articles a JOIN users u ON u.id = a.author_id
      WHERE 1=1
    `;
    const params = [];
    if (status) { sql += ' AND a.status = ?'; params.push(status); }
    sql += ' ORDER BY a.updated_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const articles = query(sql, params).map(a => attachTags(a));
    const { total } = queryOne(`SELECT COUNT(*) as total FROM articles WHERE 1=1${status ? ' AND status=?' : ''}`, status ? [status] : []);

    res.json({ articles, pagination: { page: parseInt(page), total, pages: Math.ceil(total / parseInt(limit)) } });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/articles/admin/:id — get by id for editing
router.get('/admin/id/:id', requireAuth, (req, res) => {
  try {
    const article = queryOne('SELECT * FROM articles WHERE id = ?', [req.params.id]);
    if (!article) return res.status(404).json({ error: 'Not found' });
    attachTags(article);
    res.json({ article });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/articles — create article
router.post('/', requireAuth, [
  body('title').notEmpty().trim(),
  body('body').notEmpty(),
  body('status').isIn(['draft', 'published'])
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { title, body: content, excerpt, cover_image, status, tags: tagNames = [] } = req.body;

  try {
    const id = uuidv4();
    let slug = slugify(title);

    // ensure unique slug
    let existing = queryOne('SELECT id FROM articles WHERE slug = ?', [slug]);
    if (existing) slug = `${slug}-${Date.now()}`;

    const readTime = calcReadTime(content);
    const now = new Date().toISOString();
    const publishedAt = status === 'published' ? now : null;

    run(
      `INSERT INTO articles (id, author_id, title, slug, excerpt, body, cover_image, status, read_time, views, created_at, updated_at, published_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)`,
      [id, req.user.id, title, slug, excerpt || '', content, cover_image || '', status, readTime, now, now, publishedAt]
    );

    // handle tags
    handleTags(id, tagNames);

    const article = queryOne('SELECT * FROM articles WHERE id = ?', [id]);
    attachTags(article);
    res.status(201).json({ article });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/articles/:id — update article
router.put('/:id', requireAuth, [
  body('title').notEmpty().trim(),
  body('body').notEmpty(),
  body('status').isIn(['draft', 'published'])
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { title, body: content, excerpt, cover_image, status, tags: tagNames = [] } = req.body;

  try {
    const existing = queryOne('SELECT * FROM articles WHERE id = ?', [req.params.id]);
    if (!existing) return res.status(404).json({ error: 'Not found' });

    const readTime = calcReadTime(content);
    const now = new Date().toISOString();
    const publishedAt = status === 'published'
      ? (existing.published_at || now)
      : null;

    run(
      `UPDATE articles SET title=?, excerpt=?, body=?, cover_image=?, status=?, read_time=?, updated_at=?, published_at=? WHERE id=?`,
      [title, excerpt || '', content, cover_image || '', status, readTime, now, publishedAt, req.params.id]
    );

    handleTags(req.params.id, tagNames);

    const article = queryOne('SELECT * FROM articles WHERE id = ?', [req.params.id]);
    attachTags(article);
    res.json({ article });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/articles/:id
router.delete('/:id', requireAuth, (req, res) => {
  try {
    const existing = queryOne('SELECT id FROM articles WHERE id = ?', [req.params.id]);
    if (!existing) return res.status(404).json({ error: 'Not found' });
    run('DELETE FROM article_tags WHERE article_id = ?', [req.params.id]);
    run('DELETE FROM articles WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ── TAGS ─────────────────────────────────────────────────────────────────────

// GET /api/articles/tags/all
router.get('/tags/all', (req, res) => {
  try {
    const tags = query(`
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

function handleTags(articleId, tagNames) {
  run('DELETE FROM article_tags WHERE article_id = ?', [articleId]);

  for (const name of tagNames) {
    const trimmed = name.trim();
    if (!trimmed) continue;
    const slug = slugify(trimmed);

    let tag = queryOne('SELECT * FROM tags WHERE slug = ?', [slug]);
    if (!tag) {
      const tagId = uuidv4();
      run('INSERT INTO tags (id, name, slug) VALUES (?, ?, ?)', [tagId, trimmed, slug]);
      tag = { id: tagId };
    }
    try {
      run('INSERT INTO article_tags (article_id, tag_id) VALUES (?, ?)', [articleId, tag.id]);
    } catch (_) {}
  }
}

module.exports = router;
