import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export default async function handler(req, res) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.substring(7);
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Return user info from token
    res.status(200).json({
      user: {
        id: decoded.id,
        email: decoded.email,
        display_name: decoded.display_name || decoded.email.split('@')[0],
        bio: '',
        avatar_url: '',
        role: decoded.role
      }
    });
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
}