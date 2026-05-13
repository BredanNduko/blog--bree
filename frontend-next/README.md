# Folio Blog - Vercel Deployment

## Deploy to Vercel

1. **Root Directory**: `frontend-next`
2. **Framework Preset**: Next.js
3. **Build Command**: `npm run build`
4. **Environment Variables**:
   - `JWT_SECRET`: Generate with `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`

## Login Credentials

- **Admin**: `admin@blog.com` / `admin123`
- **Writer**: `brendah@blog.com` / `Brendah123`
- **Writer**: `michael@blog.com` / `Michael@789`

## API Endpoints

- `/api/auth/login` - Login (POST with email, password)
- `/api/auth/me` - Get current user (GET with Bearer token)
- `/api/articles` - List articles (GET)
- `/api/articles/featured` - Featured articles (GET)
- `/api/articles/[slug]` - Single article (GET)
- `/api/tags` - Tags list (GET)
- `/api/health` - Health check (GET)