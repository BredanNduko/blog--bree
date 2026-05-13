import { requireAuth } from '../../../lib/auth';
import { queryOne } from '../../../lib/database';

export default requireAuth(async (req, res) => {
  const user = queryOne('SELECT id, email, display_name, bio, avatar_url, role FROM users WHERE id = ?', [req.user.id]);
  res.json({ user: user || null });
});