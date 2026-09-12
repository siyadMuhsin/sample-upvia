FROM node:20-slim AS builder

WORKDIR /app

COPY package.json ./
COPY shared/package.json ./shared/
COPY backend/package.json ./backend/

RUN npm install

COPY shared ./shared
COPY backend ./backend

RUN cd shared && npm run build
RUN cd backend && npm run build

FROM node:20-slim AS runner

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates openssl curl && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/package.json ./
COPY --from=builder /app/shared/package.json ./shared/
COPY --from=builder /app/shared/dist ./shared/dist
COPY --from=builder /app/backend/package.json ./backend/
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/node_modules ./backend/node_modules

EXPOSE 5000

ENV PORT=5000
ENV NODE_ENV=production
ENV USE_EMBEDDED_DB=true

CMD ["node", "backend/dist/server.js"]
