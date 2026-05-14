FROM node:20-alpine AS builder

WORKDIR /app

# Copy and install dependencies
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/
RUN cd backend && npm ci && \
    cd ../frontend && npm ci

# Copy application code
COPY backend/ ./backend/
COPY frontend/ ./frontend/
COPY start.js .

EXPOSE 3000 3001
ENV NODE_ENV=production
CMD ["node", "start.js"]