FROM node:20-alpine AS builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci --only=production

FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache dumb-init
COPY --from=builder /app/frontend/node_modules ./node_modules
COPY frontend/ .
EXPOSE 3000
ENV NODE_ENV=production
CMD ["dumb-init", "node", "server.js"]