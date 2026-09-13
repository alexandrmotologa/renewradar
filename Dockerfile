# Stage 1: Build Frontend
FROM node:22-alpine AS web-builder
WORKDIR /app/web
COPY web/package.json ./
RUN npm install --legacy-peer-deps
COPY web/ ./
RUN npm run build

# Stage 2: Build Backend
FROM node:22-alpine AS server-builder
WORKDIR /app/server
COPY server/package.json ./
RUN npm install
COPY server/ ./
RUN npm run build

# Stage 3: Production Runtime
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080
ENV DATABASE_PATH=/data/renewradar.db

# Create data directory for persistent SQLite database
RUN mkdir -p /data

# Copy built server assets
COPY server/package.json ./server/
COPY --from=server-builder /app/server/node_modules ./server/node_modules
COPY --from=server-builder /app/server/dist ./server/dist

# Copy built web assets
COPY --from=web-builder /app/web/dist ./web/dist

EXPOSE 8080

WORKDIR /app/server
CMD ["node", "dist/index.js"]
