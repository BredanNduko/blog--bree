require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { getDb, queryOne, run } = require('./database');

const app = express();
const PORT = process.env.PORT || 3001;

// ── MIDDLEWARE ────────────────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: false, // disabled for serving frontend
  crossOriginEmbedderPolicy: false
}));
app.use(cors({
  origin: process.env.FRONTEND_URL ? [process.env.FRONTEND_URL, 'http://localhost:3000'] : 'http://localhost:3000',
  credentials: true
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve uploaded images statically
app.use('/uploads', express.static(path.join(__dirname, '../frontend/public/uploads')));

// ── ROUTES ────────────────────────────────────────────────────────────────────
app.use('/api/auth', require('./routes/auth'));
app.use('/api/articles', require('./routes/articles'));
app.use('/api/upload', require('./routes/upload'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve frontend static files (spa)
app.use(express.static(path.join(__dirname, '../frontend/public')));

// SPA fallback — all non-API routes return index.html
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  res.sendFile(path.join(__dirname, '../frontend/public/index.html'));
});

// ── ERROR HANDLER ─────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'File too large. Max 10MB.' });
  }
  res.status(500).json({ error: err.message || 'Internal server error' });
});

// ── SEED ──────────────────────────────────────────────────────────────────────
async function seedAdmin() {
  await getDb(); // ensure DB is initialized

  const existingAdmin = queryOne('SELECT id FROM users WHERE email = ?', ['admin@blog.com']);
  if (!existingAdmin) {
    const hash = await bcrypt.hash('admin123', 12);
    const id = uuidv4();
    run(
      'INSERT INTO users (id, email, password_hash, display_name, bio, role) VALUES (?, ?, ?, ?, ?, ?)',
      [id, 'admin@blog.com', hash, 'The Author', 'Writer, thinker, creator.', 'admin']
    );
    console.log('\n✅  Admin user seeded');
    console.log('   Email:    admin@blog.com');
    console.log('   Password: admin123');

    // Seed sample articles
    await seedSampleArticles(id);
  }

  const existingBrendah = queryOne('SELECT id FROM users WHERE email = ?', ['brendah@blog.com']);
  if (!existingBrendah) {
    const brendahHash = await bcrypt.hash('Brendah123', 12);
    const brendahId = uuidv4();
    run(
      'INSERT INTO users (id, email, password_hash, display_name, bio, role) VALUES (?, ?, ?, ?, ?, ?)',
      [brendahId, 'brendah@blog.com', brendahHash, 'Brendah', 'Content creator and writer.', 'writer']
    );
    console.log('✅  Brendah user seeded');
    console.log('   Email:    brendah@blog.com');
    console.log('   Password: Brendah123\n');
  }

  const existingMichael = queryOne('SELECT id FROM users WHERE email = ?', ['michael@blog.com']);
  if (!existingMichael) {
    const michaelHash = await bcrypt.hash('Michael@789', 12);
    const michaelId = uuidv4();
    run(
      'INSERT INTO users (id, email, password_hash, display_name, bio, role) VALUES (?, ?, ?, ?, ?, ?)',
      [michaelId, 'michael@blog.com', michaelHash, 'Michael Chen', 'Technology and business writer.', 'writer']
    );
    console.log('✅  Michael user seeded');
    console.log('   Email:    michael@blog.com');
    console.log('   Password: Michael@789\n');
  }
}

async function seedSampleArticles(authorId) {
  const articles = [
    {
      title: 'The Art of Slow Mornings',
      excerpt: 'Why the first hour of your day determines everything that follows.',
      body: `<p>There is a quiet revolution happening in living rooms and kitchens across the world. People are putting down their phones, stepping away from the notifications, and choosing to begin their days with intention rather than urgency.</p>

<p>The slow morning movement isn't about laziness. It's about recognizing that how you enter the day shapes everything that follows. The tone you set in those first sixty minutes reverberates through every meeting, every conversation, every decision.</p>

<h2>What a slow morning looks like</h2>

<p>It begins before the alarm. Or rather, it begins the night before, when you decide what time to wake up — not based on the minimum viable time to get ready, but based on how much space you want to carve out for yourself.</p>

<p>Coffee made without distraction. Pages read without purpose. A walk taken not for fitness but for the simple pleasure of watching the world wake up alongside you.</p>

<h2>The neuroscience of morning rituals</h2>

<p>Research consistently shows that the brain is most creative and receptive in the early morning hours. Cortisol peaks naturally around 8am, sharpening focus. The prefrontal cortex — responsible for creative thinking and problem solving — is most active before the cognitive load of the day accumulates.</p>

<p>When we rush through mornings, we're squandering the brain's optimal state.</p>

<h2>Starting tomorrow</h2>

<p>You don't need a perfect routine. You need a slightly earlier alarm and the discipline to not check your phone for the first thirty minutes. Start there. Everything else follows.</p>`,
      cover_image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1200&q=80',
      status: 'published',
      tags: ['Lifestyle', 'Wellness', 'Productivity']
    },
    {
      title: 'On Writing Every Day',
      excerpt: 'The discipline of daily writing isn\'t about publishing. It\'s about thinking clearly.',
      body: `<p>Most people believe they can't write. What they actually mean is they've never made writing a daily practice, and so the muscle remains weak and the voice remains uncertain.</p>

<p>Writing every day changes this. Not dramatically, not overnight, but surely.</p>

<h2>The blank page problem</h2>

<p>The blank page is terrifying because it holds infinite possibility — and infinite possibility means infinite ways to fail. The daily writer learns to see the blank page differently: as a familiar friend, a neutral space, a place where thinking happens out loud.</p>

<p>After thirty days of daily writing, the blank page loses its power over you. It becomes simply the thing that comes before words.</p>

<h2>What to write about</h2>

<p>Anything. Everything. The conversation you had this morning. The thing you read last night that you can't stop thinking about. The decision you're avoiding. The idea that keeps surfacing. The memory you don't want to lose.</p>

<p>Writing isn't for publishing. Most of it should never be read by anyone. It's for thinking, for processing, for remembering who you are and what you believe.</p>

<h2>The compound effect</h2>

<p>A year of daily writing produces 365 entries. Some will be garbage. Some will surprise you. A few will be the clearest thinking you've ever done. That ratio is enough. That ratio, over time, is transformative.</p>`,
      cover_image: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=1200&q=80',
      status: 'published',
      tags: ['Writing', 'Creativity', 'Habits']
    },
    {
      title: 'Cities at 3am',
      excerpt: 'A meditation on what cities reveal when almost everyone is asleep.',
      body: `<p>There is a version of every city that most people never see. It exists between 3 and 5 in the morning, when the night crowd has finally gone home and the morning crowd hasn't yet arrived. The streets belong to almost no one.</p>

<p>I've walked through several cities at this hour, for no reason better than curiosity and an inability to sleep. What I've found is something I struggle to describe without sounding like I'm exaggerating.</p>

<h2>The honest city</h2>

<p>Cities perform for their inhabitants. During daylight hours, they are costume and commerce and noise. At 3am, the performance drops. You see the infrastructure: the delivery trucks restocking restaurants, the cleaners working on the office lobbies, the maintenance crews in the subway tunnels.</p>

<p>You see who the city actually runs on. It's never who you think.</p>

<h2>The particular silence</h2>

<p>City silence at 3am isn't quiet — it's just a different frequency. The hum of HVAC units. The distant train. The occasional taxi. A conversation drifting from a lit window above you. These sounds exist during the day too but are buried under the full orchestra of city life. At 3am, you hear the individual instruments.</p>

<h2>Why it matters</h2>

<p>I'm not sure it does, practically speaking. But aesthetically, experientially — knowing the other version of a place you inhabit gives you a relationship with it that most residents don't have. You know its secret hours. There's something intimate about that.</p>`,
      cover_image: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1200&q=80',
      status: 'published',
      tags: ['Travel', 'Urban', 'Essays']
    }
  ];

  for (const a of articles) {
    const id = uuidv4();
    const slug = a.title.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-');
    const now = new Date().toISOString();
    const words = a.body.replace(/<[^>]+>/g, '').split(/\s+/).length;
    const readTime = Math.max(1, Math.ceil(words / 200));

    run(
      `INSERT INTO articles (id, author_id, title, slug, excerpt, body, cover_image, status, read_time, views, created_at, updated_at, published_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, authorId, a.title, slug, a.excerpt, a.body, a.cover_image, 'published', readTime, Math.floor(Math.random() * 500) + 50, now, now, now]
    );

    // tags
    const { v4: uuid } = require('uuid');
    for (const tagName of a.tags) {
      const tagSlug = tagName.toLowerCase();
      let tag = queryOne('SELECT * FROM tags WHERE slug = ?', [tagSlug]);
      if (!tag) {
        const tagId = uuid();
        run('INSERT INTO tags (id, name, slug) VALUES (?, ?, ?)', [tagId, tagName, tagSlug]);
        tag = { id: tagId };
      }
      try { run('INSERT INTO article_tags (article_id, tag_id) VALUES (?, ?)', [id, tag.id]); } catch (_) {}
    }
  }

  console.log('✅  Sample articles seeded\n');
}

// ── START ─────────────────────────────────────────────────────────────────────
const HOSTNAME = process.env.HOSTNAME || 'localhost';
const PROTOCOL = process.env.NODE_ENV === 'production' ? 'https' : 'http';
const BASE_URL = process.env.BASE_URL || `${PROTOCOL}://${HOSTNAME}`;

seedAdmin().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀  Backend running at ${PROTOCOL}://${HOSTNAME}:${PORT}`);
    console.log(`📖  API base: ${PROTOCOL}://${HOSTNAME}/api`);
  });
}).catch(err => {
  console.error('Failed to start:', err);
  process.exit(1);
});
