# Folio — Blog Platform (JavaScript / Node.js)

A production-ready blog platform with a beautiful reader-facing UI and a hidden admin panel for writing, editing, and managing articles.

---

## Features

### Reader UI
- Editorial magazine aesthetic — dark, refined, typographically rich
- Hero section with featured articles
- Article grid and list views
- Full article page with cover image, rich body, related articles
- Tag filtering and full-text search
- Smooth client-side routing (SPA — no page reloads)
- Responsive across desktop, tablet, and mobile

### Admin Panel (Hidden)
- Accessed at `/admin.html` — no link from the public blog
- JWT authentication (7-day session, persisted in localStorage)
- Dashboard with article stats (total, published, drafts, views)
- Full article manager with status filtering
- Rich HTML editor with formatting toolbar and live preview
- Cover image upload (file upload or URL)
- Tag management with chip UI
- Excerpt editor
- Profile and password settings
- Keyboard shortcut: `Cmd/Ctrl+S` to save

### Architecture
- **Backend**: Node.js + Express REST API (port 3001)
- **Frontend**: Vanilla JS SPA served by Express (port 3000)
- **Database**: SQLite via sql.js (zero native dependencies, file-persisted)
- **Auth**: bcryptjs passwords + JWT tokens
- **Uploads**: multer (images stored in `frontend/public/uploads/`)
- **Multi-user**: Role-based accounts (`admin` and `writer`) for collaborative blogging

---

## Quick Start

### 1. Install dependencies

```bash
# Install backend deps
cd backend && npm install && cd ..

# Install frontend deps
cd frontend && npm install && cd ..
```

### 2. Configure environment (optional)

```bash
cp backend/.env.example backend/.env
# Edit backend/.env to set a strong JWT_SECRET
```

### 3. Start both servers

```bash
node start.js
```

Or start them separately:

```bash
# Terminal 1 — API
cd backend && npm start

# Terminal 2 — Frontend
cd frontend && npm start
```

### 4. Open

| URL | Description |
|-----|-------------|
| `http://localhost:3000` | Public blog |
| `http://localhost:3000/admin.html` | Admin panel (hidden) |
| `http://localhost:3001/api` | REST API |

---

## Default Login

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@blog.com` | `admin123` |
| Writer | `brendah@blog.com` | `Brendah123` |
| Writer | `michael@blog.com` | `Michael@789` |

> **Change these after first login** via Admin → Settings → Change Password.

### How Writers Log In

Writers access the admin panel at `http://localhost:3000/admin.html` and enter their credentials above. The same `/admin.html` link is used by all users — the role determines available features.

---

## Project Structure

```
blog-platform/
├── start.js                  # Boots both servers
├── backend/
│   ├── server.js             # Express app, seed, startup
│   ├── database.js           # SQLite (sql.js) helper
│   ├── auth.js               # JWT middleware
│   ├── routes/
│   │   ├── auth.js           # /api/auth/*
│   │   ├── articles.js       # /api/articles/*
│   │   └── upload.js         # /api/upload/*
│   └── .env.example
└── frontend/
    ├── server.js             # Static file server
    └── public/
        ├── index.html        # Reader SPA shell
        ├── admin.html        # Admin panel (hidden)
        ├── css/
        │   ├── main.css      # Reader styles
        │   └── admin.css     # Admin styles
        ├── js/
        │   ├── api.js        # API client
        │   ├── router.js     # Client-side router
        │   ├── main.js       # App init + search + nav
        │   ├── admin/
        │   │   └── admin.js  # Full admin logic
        │   └── pages/
        │       ├── home.js
        │       ├── article.js
        │       ├── articles.js
        │       └── about.js
        └── uploads/          # Uploaded images (auto-created)
```

---

## API Reference

### Public Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/articles` | List published articles (supports `?page`, `?limit`, `?tag`, `?search`) |
| GET | `/api/articles/featured` | Top 3 articles by views |
| GET | `/api/articles/:slug` | Single article + related |
| GET | `/api/articles/tags/all` | All tags with article count |
| GET | `/api/health` | Health check |

### Protected Endpoints (require `Authorization: Bearer <token>`)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/login` | Login → returns JWT |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/auth/update-profile` | Update name/bio |
| POST | `/api/auth/change-password` | Change password |
| GET | `/api/articles/admin/all` | All articles (drafts + published) |
| GET | `/api/articles/admin/id/:id` | Get article by ID |
| POST | `/api/articles` | Create article |
| PUT | `/api/articles/:id` | Update article |
| DELETE | `/api/articles/:id` | Delete article |
| POST | `/api/upload/image` | Upload image (multipart/form-data) |

---

## Database Schema

```sql
users (id, email, password_hash, display_name, bio, avatar_url, role, created_at)
articles (id, author_id, title, slug, excerpt, body, cover_image, status, read_time, views, created_at, updated_at, published_at)
tags (id, name, slug)
article_tags (article_id, tag_id)
```

The `role` column supports `admin` and `writer` roles.

### Adding More Writer Accounts

The `users` table has a `role` column (`admin` | `writer`). To add accounts:

```bash
# In backend directory, run a one-time seed script:
node -e "
const bcrypt = require('bcryptjs');
const { v4: uuid } = require('uuid');
const { getDb, run } = require('./database');
getDb().then(async () => {
  const hash = await bcrypt.hash('newpassword', 12);
  run('INSERT INTO users (id, email, password_hash, display_name, role) VALUES (?,?,?,?,?)',
    [uuid(), 'newwriter@blog.com', hash, 'New Writer', 'writer']);
  console.log('User created');
  process.exit(0);
});
"
```

---

## Deployment

### Environment Variables

```bash
PORT=3001                    # API port
FRONTEND_URL=https://yourdomain.com
JWT_SECRET=<64-char random string>
```

Generate a JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### Production Checklist

- [ ] Change default admin password
- [ ] Set a strong `JWT_SECRET` in `backend/.env`
- [ ] Point `FRONTEND_URL` to your actual domain
- [ ] Use a reverse proxy (nginx) in front of both servers
- [ ] Enable HTTPS
- [ ] Back up `backend/blog.db` regularly
- [ ] Consider moving uploads to S3 for persistence

---

## Go Backend Version

This is the **JavaScript/Node.js** version. The Go version (using Gin + GORM) has identical API contracts and database schema — only the server implementation differs.
