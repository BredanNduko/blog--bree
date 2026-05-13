import { getDb, query } from '../../../lib/database';

export default async function handler(req, res) {
  await getDb();
  res.json(query('SELECT * FROM articles WHERE status = ? ORDER BY views DESC LIMIT 3', ['published']));
}