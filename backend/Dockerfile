FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json ./
COPY shared/package.json ./shared/
COPY backend/package.json ./backend/

RUN npm install

COPY shared ./shared
COPY backend ./backend

RUN cd shared && npm run build
RUN cd backend && npm run build

FROM node:20-alpine AS runner

WORKDIR /app

COPY --from=builder /app/package.json ./
COPY --from=builder /app/shared/package.json ./shared/
COPY --from=builder /app/shared/dist ./shared/dist
COPY --from=builder /app/backend/package.json ./backend/
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/node_modules ./backend/node_modules

EXPOSE 5000

CMD ["node", "backend/dist/server.js"]
