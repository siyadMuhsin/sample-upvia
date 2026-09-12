# Upvia Deployment & Production Operations

## Deployment Architecture

Upvia is engineered for containerized on-premise deployment within university private data centers or hyperscale cloud providers (AWS, Azure, Google Cloud).

---

## Docker Orchestration

The root [`docker-compose.yml`](file:///Users/siyadmuhsin/Documents/TNL/upvia/docker-compose.yml) orchestrates all application layers and stateful backing services:

```yaml
services:
  mongodb:
    image: mongo:7.0
    restart: always
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

  redis:
    image: redis:7.2-alpine
    restart: always
    ports:
      - "6379:6379"

  backend:
    build:
      context: .
      dockerfile: backend/Dockerfile
    restart: always
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - PORT=5000
      - MONGODB_URI=mongodb://mongodb:27017/upvia
      - JWT_SECRET=prod_super_secret_jwt_key_upvia_enterprise
      - JWT_EXPIRES_IN=7d
      - FRONTEND_URL=http://localhost:3000
    depends_on:
      - mongodb
      - redis

  frontend:
    build:
      context: .
      dockerfile: frontend/Dockerfile
    restart: always
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
    depends_on:
      - backend
```

---

## Environment Configuration

Create a `.env` file in the project root:

```ini
# Application Configuration
NODE_ENV=production
PORT=5000

# Database & Cache
MONGODB_URI=mongodb://localhost:27017/upvia
REDIS_URL=redis://localhost:6379

# Security & Authentication
JWT_SECRET=super_secret_jwt_signing_key_replace_in_production
JWT_EXPIRES_IN=7d

# Cross-Origin URLs
FRONTEND_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
```

---

## Embedded Database Fallback (Zero-Config Mode)

For seamless local development, rapid evaluation, and automated CI/CD runners where an external MongoDB instance is not provisioned, Upvia incorporates an automatic **embedded in-memory MongoDB fallback**:

```typescript
// backend/src/config/database.ts
if (!process.env.MONGODB_URI) {
  const { MongoMemoryServer } = await import('mongodb-memory-server');
  const mongod = await MongoMemoryServer.create();
  mongoUri = mongod.getUri();
  console.log(`[Upvia Database] No MONGODB_URI provided. Started embedded MongoDB instance at ${mongoUri}`);
}
```

This guarantees that the entire platform can be booted, seeded, and tested without manual database setup.

---

## Production Build & Run Workflow

### 1. Build Monorepo Packages
```bash
# From workspace root:
npm install
npm run build:shared
npm run build:backend
npm run build:frontend
```

### 2. Seed Initial Institutional Data
```bash
npm run seed
```

### 3. Launch Services
```bash
# In production with Docker Compose:
docker-compose up -d --build

# Or natively with Node.js:
npm run start:backend   # Express REST API on Port 5000
npm run start:frontend  # Next.js App Router on Port 3000
```

---

## Health Checks & Monitoring

- **Backend Health Check**: `GET /api/v1/health` returns `200 OK` with system uptime and database connection status.
- **Audit Ledger**: All administrative overrides and status transitions are recorded in the `audit_logs` collection and inspectable at `/admin/audit-logs`.
