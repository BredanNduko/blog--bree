import { getDb, query } from '../../../lib/database';

export default async function handler(req, res) {
  await getDb();
  res.json(query('SELECT t.*, COUNT(at.article_id) as count FROM tags t LEFT JOIN article_tags at ON t.id = at.tag_id GROUP BY t.id ORDER BY t.name'));
}