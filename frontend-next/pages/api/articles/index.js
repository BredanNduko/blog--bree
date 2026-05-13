// Mock articles for Vercel deployment
const ARTICLES = [
  {
    id: '1',
    title: 'The Art of Slow Mornings',
    slug: 'the-art-of-slow-mornings',
    excerpt: 'Why the first hour of your day determines everything that follows.',
    cover_image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1200&q=80',
    status: 'published',
    read_time: 3,
    views: 120,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '2',
    title: 'On Writing Every Day',
    slug: 'on-writing-every-day',
    excerpt: 'The discipline of daily writing isn\'t about publishing. It\'s about thinking clearly.',
    cover_image: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=1200&q=80',
    status: 'published',
    read_time: 4,
    views: 85,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

export default function handler(req, res) {
  const { page = 1, limit = 6 } = req.query;
  const start = (page - 1) * limit;
  const end = start + parseInt(limit);
  
  res.status(200).json(ARTICLES.slice(start, end));
}