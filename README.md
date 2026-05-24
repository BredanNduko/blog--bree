# Stalk Quil — Blog Platform (JavaScript / Node.js)

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

---



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

