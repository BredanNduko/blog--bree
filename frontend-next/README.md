# Folio Blog - Next.js version for Vercel

## Setup

```bash
npm install
cp .env.example .env.local
# Edit .env.local and set JWT_SECRET
```

## Development

```bash
npm run dev
```

## Deploy to Vercel

1. Push to GitHub
2. Import to Vercel
3. Set environment variable `JWT_SECRET` in Vercel dashboard
4. Deploy

**Vercel Settings:**
- Framework Preset: **Next.js**
- Build Command: `npm run build`
- Output Directory: `.next`

## Files

- `pages/api/` - API routes (login, articles, etc.)
- `lib/database.js` - SQLite helper
- `lib/auth.js` - JWT authentication
- `public/` - Static frontend files