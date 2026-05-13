const { getDb, query, queryOne } = require('../../../lib/database');

module.exports = async function handler(req, res) {
  await getDb();
  const articles = query('SELECT * FROM articles WHERE status = ? ORDER BY views DESC LIMIT 3', ['published']);
  res.json(articles);
};