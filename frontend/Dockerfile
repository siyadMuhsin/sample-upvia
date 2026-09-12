FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json ./
COPY shared/package.json ./shared/
COPY frontend/package.json ./frontend/

RUN npm install

COPY shared ./shared
COPY frontend ./frontend

RUN cd shared && npm run build
RUN cd frontend && npm run build

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY --from=builder /app/package.json ./
COPY --from=builder /app/frontend/package.json ./frontend/
COPY --from=builder /app/frontend/.next ./frontend/.next
COPY --from=builder /app/frontend/public ./frontend/public
COPY --from=builder /app/frontend/node_modules ./frontend/node_modules

EXPOSE 3000

CMD ["npm", "run", "start", "--workspace=frontend"]
