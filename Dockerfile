FROM node:20-alpine

WORKDIR /app

# Install all dependencies
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/
RUN cd backend && npm ci --only=production && \
    cd ../frontend && npm ci --only=production

# Copy application code
COPY backend/ ./backend/
COPY frontend/ ./frontend/
COPY start.js .

EXPOSE 3000 3001

ENV NODE_ENV=production

CMD ["node", "start.js"]