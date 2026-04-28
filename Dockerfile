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
ARG NEXT_PUBLIC_HOST=http://localhost:3000
ARG NEXT_PUBLIC_DOMAIN=http://localhost:3001
ENV NEXT_PUBLIC_HOST=${NEXT_PUBLIC_HOST}
ENV NEXT_PUBLIC_DOMAIN=${NEXT_PUBLIC_DOMAIN}

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

FROM node:${NODE_VER}-bookworm-slim AS runner

WORKDIR /app

ARG NEXT_PUBLIC_HOST=http://localhost:3000
ARG NEXT_PUBLIC_DOMAIN=http://localhost:3001
ENV NODE_ENV=production
ENV PORT=3001
ENV HOSTNAME=0.0.0.0
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_PUBLIC_HOST=${NEXT_PUBLIC_HOST}
ENV NEXT_PUBLIC_DOMAIN=${NEXT_PUBLIC_DOMAIN}

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/next-i18next.config.js ./next-i18next.config.js

EXPOSE 3001

CMD ["node", "server.js"]
