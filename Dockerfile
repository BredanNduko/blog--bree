FROM node:20-alpine AS builder

WORKDIR /app

# Copy and install backend dependencies only
COPY backend/package*.json ./backend/
RUN cd backend && npm ci --only=production

# Copy application code
COPY backend/ ./backend/
COPY frontend/public ./frontend/public/

# Production image
FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/backend ./backend
COPY --from=builder /app/frontend/public ./frontend/public

ENV NODE_ENV=production
EXPOSE 3001
CMD ["node", "backend/server.js"]