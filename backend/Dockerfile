FROM node:20-alpine AS builder
WORKDIR /app/backend
COPY package*.json ./
RUN npm ci --only=production

FROM node:20-alpine
WORKDIR /app/backend
RUN apk add --no-cache dumb-init
COPY --from=builder --chown=node:node /app/backend/node_modules ./node_modules
COPY --chown=node:node . .
EXPOSE 3001
ENV NODE_ENV=production
USER node
CMD ["dumb-init", "node", "server.js"]