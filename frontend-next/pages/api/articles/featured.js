const ARTICLES = [
  {
    id: '1',
    title: 'The Art of Slow Mornings',
    slug: 'the-art-of-slow-mornings',
    views: 120
  },
  {
    id: '2',
    title: 'On Writing Every Day',
    slug: 'on-writing-every-day',
    views: 85
  }
];

export default function handler(req, res) {
  const featured = ARTICLES.sort((a, b) => b.views - a.views).slice(0, 3);
  res.status(200).json(featured);
}