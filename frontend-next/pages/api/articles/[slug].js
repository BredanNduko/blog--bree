import { getDb, query, queryOne } from '../../../lib/database';

export default async function handler(req, res) {
  await getDb();
  const { slug } = req.query;
  
  const article = queryOne('SELECT * FROM articles WHERE slug = ?', [slug]);
  if (!article) return res.status(404).json({ error: 'Article not found' });

  const tags = query('SELECT t.name, t.slug FROM tags t JOIN article_tags at ON t.id = at.tag_id WHERE at.article_id = ?', [article.id]);
  const related = query('SELECT * FROM articles WHERE status = ? AND id != ? ORDER BY views DESC LIMIT 3', ['published', article.id]);
  
  res.json({ ...article, tags, related });
}