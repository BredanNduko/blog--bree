export default function handler(req, res) {
  res.status(200).json([
    { name: 'Lifestyle', slug: 'lifestyle', count: 1 },
    { name: 'Writing', slug: 'writing', count: 1 },
    { name: 'Technology', slug: 'technology', count: 0 }
  ]);
}