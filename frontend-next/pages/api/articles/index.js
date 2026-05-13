import { getDb, query, queryOne } from '../../lib/database';

export default async function handler(req, res) {
  await getDb();

  const { page = 1, limit = 6, tag, search } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  let sql = 'SELECT * FROM articles WHERE status = ?';
  let params = ['published'];

  if (where.length) sql += ' AND ' + where.join(' AND ');
  sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), offset);

  res.json(query(sql, params));
}