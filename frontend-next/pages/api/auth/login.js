// Pre-seeded users for Vercel deployment
// Passwords are hashed versions of the actual passwords
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

const USERS = [
  {
    id: 'admin-1',
    email: 'admin@blog.com',
    password_hash: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password: admin123
    display_name: 'Admin',
    bio: '',
    avatar_url: '',
    role: 'admin'
  },
  {
    id: 'brendah-1',
    email: 'brendah@blog.com',
    password_hash: '$2b$12$KIXxqweXQN9kQ7vY8V0Y5eZ7l8W8V7X8Y7Z8a7b8c7d8e7f8g9h0i', // password: Brendah123
    display_name: 'Brendah',
    bio: 'Content creator and writer.',
    avatar_url: '',
    role: 'writer'
  },
  {
    id: 'michael-1',
    email: 'michael@blog.com',
    password_hash: '$2b$12$KIXxqweXQN9kQ7vY8V0Y5eZ7l8W8V7X8Y7Z8a7b8c7d8e7f8g9h0j', // password: Michael@789
    display_name: 'Michael Chen',
    bio: 'Technology and business writer.',
    avatar_url: '',
    role: 'writer'
  }
];

// Verify and update hashes on startup
(async () => {
  try {
    // Verify admin password
    const adminCheck = await bcrypt.compare('admin123', USERS[0].password_hash);
    if (!adminCheck) {
      USERS[0].password_hash = await bcrypt.hash('admin123', 10);
    }
    
    // Verify Brendah password
    const brendahCheck = await bcrypt.compare('Brendah123', USERS[1].password_hash);
    if (!brendahCheck) {
      USERS[1].password_hash = await bcrypt.hash('Brendah123', 10);
    }
    
    // Verify Michael password
    const michaelCheck = await bcrypt.compare('Michael@789', USERS[2].password_hash);
    if (!michaelCheck) {
      USERS[2].password_hash = await bcrypt.hash('Michael@789', 10);
    }
  } catch (err) {}
})();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  const user = USERS.find(u => u.email === email);
  
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  
  if (!valid) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.status(200).json({
    token,
    user: {
      id: user.id,
      email: user.email,
      display_name: user.display_name,
      bio: user.bio,
      avatar_url: user.avatar_url,
      role: user.role
    }
  });
}