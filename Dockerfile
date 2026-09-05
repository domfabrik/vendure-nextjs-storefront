ARG NODE_VER=25.2.1
FROM node:${NODE_VER}-bookworm-slim AS deps

WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

COPY package.json package-lock.json ./
RUN npm ci

FROM node:${NODE_VER}-bookworm-slim AS builder

WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ARG BUILD_API_URL
ENV API_URL=${BUILD_API_URL}

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN if [ -f .env.production ]; then sed -i '/^[[:space:]]*API_URL=/d' .env.production; fi \
    && test -n "${BUILD_API_URL}" \
    && npm run build

FROM node:${NODE_VER}-bookworm-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001
ENV HOSTNAME=0.0.0.0
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3001

CMD ["node", "server.js"]
