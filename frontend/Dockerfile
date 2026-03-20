# ─────────────────────────────────────────────
# Stage 1 — Builder: compile Next.js (standalone)
# ─────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# NEXT_PUBLIC_ vars are baked into the client bundle at build time.
# The server-side proxy (app/api/backend) reads NEXT_PUBLIC_BACKEND_URL
# from process.env at runtime, so this build-time default is only a fallback.
# The compose file overrides these at container startup via ENV.
ARG NEXT_PUBLIC_BACKEND_URL=http://localhost:3000
ARG NEXT_PUBLIC_WS_URL=ws://localhost:3000
ARG NEXT_PUBLIC_MOCK_PAYMENT=true
ENV NEXT_PUBLIC_BACKEND_URL=$NEXT_PUBLIC_BACKEND_URL
ENV NEXT_PUBLIC_WS_URL=$NEXT_PUBLIC_WS_URL
ENV NEXT_PUBLIC_MOCK_PAYMENT=$NEXT_PUBLIC_MOCK_PAYMENT

RUN npm run build

# ─────────────────────────────────────────────
# Stage 2 — Production: standalone runtime
# ─────────────────────────────────────────────
FROM node:20-alpine AS production
WORKDIR /app

ENV NODE_ENV=production
# Next.js standalone server defaults to port 3000; override to 3001
ENV PORT=3001
ENV HOSTNAME=0.0.0.0

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD node -e "require('http').get('http://127.0.0.1:3001/api/health',(r)=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

CMD ["node", "server.js"]
