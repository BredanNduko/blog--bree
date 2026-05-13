FROM node:20-alpine AS builder
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci --only=production

FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache dumb-init
COPY --from=builder /app/backend/node_modules ./node_modules
COPY backend/ .
EXPOSE 3001
ENV NODE_ENV=production
CMD ["dumb-init", "node", "server.js"]