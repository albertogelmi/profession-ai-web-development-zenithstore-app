# ─────────────────────────────────────────────
# Stage 1 — Builder: compile TypeScript
# ─────────────────────────────────────────────
FROM node:18-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ─────────────────────────────────────────────
# Stage 2 — Production: lean runtime image
# ─────────────────────────────────────────────
FROM node:18-alpine AS production
WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev

# Compiled JS output
COPY --from=builder /app/dist ./dist

# Static HTML pages are not compiled by TypeScript — copy manually
COPY src/pages ./dist/pages

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD wget -qO- http://localhost:3000/health || exit 1

CMD ["node", "dist/server.js"]
