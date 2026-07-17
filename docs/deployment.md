# Deployment & Infrastructure Guide

This document outlines the deployment configuration, production architecture, observability, and containerization setup for Memora.

---

## 1. Local Infrastructure (Docker Compose)

Memora uses Docker Compose to run local developer services including PostgreSQL, Redis, and Qdrant.

### Services

- **PostgreSQL (`memora-postgres`)**:
  - Image: `postgres:16-alpine`
  - Relational storage for users, settings, memory metadata, integrations, and workspace information.
  - Healthcheck: `pg_isready -U memora -d memora` to ensure database readiness before server startup.
- **Redis (`memora-redis`)**:
  - Image: `redis:7-alpine`
  - Key-value cache layer, rate-limit manager, and BullMQ backing store.
  - Healthcheck: `redis-cli ping`
- **Qdrant (`memora-qdrant`)**:
  - Image: `qdrant/qdrant:v1.14.0`
  - Specialized vector database for semantic similarity and search.
  - Healthcheck: `curl -sf http://localhost:6333/healthz || exit 1`
- **Zep (`memora-zep` - Optional)**:
  - Image: `zepai/zep:latest`
  - Long-term memory store backing.

### Commands

Start infrastructure:
```bash
docker-compose up -d
```

Stop infrastructure:
```bash
docker-compose down
```

---

## 2. Production Environments & Setup

### Environment Variables Matrix

A production deployment requires these essential variables to be configured:

#### Server Layer
- `DATABASE_URL`: PostgreSQL connection string (with connection pooling enabled, e.g., using PgBouncer or serverless connection pooling).
- `REDIS_URL`: Production Redis cluster connection string.
- `QDRANT_URL`: Production Qdrant database HTTP/gRPC endpoint.
- `VOYAGE_API_KEY`: API key for generating high-quality embeddings.
- `GOOGLE_API_KEY`: API key for Gemini LLM synthesis and cognitive loops.
- `JWT_PRIVATE_KEY` / `JWT_PUBLIC_KEY`: Asymmetric RS256 keys for cryptographic token signature.
- `TOKEN_ENCRYPTION_KEY`: 256-bit hexadecimal key for GCM-AES token encryption.
- `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET`: Payment processing and sync.

#### Client & Extension Layers
- `VITE_API_URL` / `VITE_WS_URL`: Target server endpoints.
- `MEMORA_API_URL`: Chrome extension target.

---

## 3. Database Scaling & Tuning

### Qdrant Vector DB
- **Collection Configuration**: Vector dimension size set to `1024` with `Cosine` distance metric (matching Voyage AI `voyage-3-large`).
- **Quantization**: Enable **Scalar Quantization** (`int8`) in production settings. This reduces RAM usage by up to 4x with minimal impact on retrieval precision (typically <1% recall drop).
- **HNSW Index parameters**: Set `m=16` and `ef_construct=100` to balance indexing speed with search precision.

### PostgreSQL (Prisma Client)
- **Connection Pools**: Configure pool sizes relative to Server Instance concurrency. In serverless/containerized auto-scaling environments, use PgBouncer or Prisma Accelerate to prevent connections starvation.

---

## 4. Observability & Observance

### LangSmith Integration
Memora integrates with **LangSmith** to monitor LLM synthesis, cognitive loops, and prompt chains in production.

To enable, configure the following:
```env
LANGSMITH_API_KEY="your-langsmith-key"
LANGSMITH_PROJECT="memora-prod"
```

This captures:
1. Exact prompts sent to Google Gemini for synthesis, reflection, consolidation, and dreaming.
2. Latency, token counts, error rates, and hallucinations.
3. Cost mapping of model usage per user/workspace.

---

## 5. CI/CD Pipeline & Caching

### Turborepo Build Cache
Turborepo orchestrates builds across the workspaces. In the CI pipeline, enable remote caching or folder caching of the `.turbo` directory to speed up build executions.

### Build Target Sequence
1. Install dependencies: `pnpm install`
2. Build shared module: `pnpm --filter @memora/shared build`
3. Generate Prisma client: `pnpm --filter @memora/server db:generate`
4. Build all workspaces: `pnpm build`
5. Run test suites: `pnpm test`
