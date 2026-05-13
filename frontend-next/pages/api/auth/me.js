import { requireAuth } from '../../../lib/auth';
import { queryOne } from '../../../lib/database';

export default requireAuth(async (req, res) => {
  try {
    const user = queryOne('SELECT id, email, display_name, bio, avatar_url, role FROM users WHERE id = ?', [req.user.id]);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});