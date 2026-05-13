import { getDb, query, queryOne } from '../../../lib/database';

export default async function handler(req, res) {
  await getDb();
  const { page = 1, limit = 6, tag, search } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  let sql = 'SELECT * FROM articles WHERE status = ?';
  let params = ['published'];
  let joins = '';
  let where = [];

  if (tag) { joins = ' JOIN article_tags at ON articles.id = at.article_id JOIN tags t ON at.tag_id = t.id'; where.push('t.slug = ?'); params.push(tag); }
  if (search) { where.push('(title LIKE ? OR excerpt LIKE ?)'); params.push(`%${search}%`, `%${search}%`); }
  
  sql = `SELECT articles.* FROM articles${joins}${where.length ? ' WHERE ' + where.join(' AND ') : ''} ORDER BY created_at DESC LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), offset);
  
  res.json(query(sql, params));
}