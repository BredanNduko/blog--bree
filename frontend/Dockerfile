FROM node:20-alpine AS builder
WORKDIR /app/frontend
COPY package*.json ./
RUN npm ci --only=production

FROM node:20-alpine
WORKDIR /app/frontend
RUN apk add --no-cache dumb-init
COPY --from=builder --chown=node:node /app/frontend/node_modules ./node_modules
COPY --chown=node:node . .
EXPOSE 3000
ENV NODE_ENV=production
USER node
CMD ["dumb-init", "node", "server.js"]