const ARTICLES = [
  { id: '1', slug: 'the-art-of-slow-mornings', title: 'The Art of Slow Mornings', body: '<p>Content...</p>', excerpt: 'Excerpt...' },
  { id: '2', slug: 'on-writing-every-day', title: 'On Writing Every Day', body: '<p>Content...</p>', excerpt: 'Excerpt...' }
];

export default function handler(req, res) {
  const { slug } = req.query;
  const article = ARTICLES.find(a => a.slug === slug);
  
  if (!article) {
    return res.status(404).json({ error: 'Article not found' });
  }
  
  res.status(200).json({ ...article, tags: [], related: [] });
}