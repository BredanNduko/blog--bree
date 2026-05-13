const { requireAuth } = require('../../../lib/auth');
const { getDb, queryOne } = require('../../../lib/database');

module.exports = requireAuth(async function handler(req, res) {
  await getDb();
  const user = queryOne('SELECT id, email, display_name, bio, avatar_url, role FROM users WHERE id = ?', [req.user.id]);
  res.json({ user: user || null });
});