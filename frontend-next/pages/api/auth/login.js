const bcrypt = require('bcryptjs');
const { getDb, queryOne } = require('../../../lib/database');
const { generateToken } = require('../../../lib/auth');

module.exports = async function handler(req, res) {
  await getDb();
  
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  try {
    const user = queryOne('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    res.json({ token: generateToken(user), user: { id: user.id, email: user.email, display_name: user.display_name, bio: user.bio, avatar_url: user.avatar_url, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};