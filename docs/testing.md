# Memora v2.0 Testing Strategy

## Overview

Memora v2.0 uses a layered testing strategy to ensure reliability, performance, and security across the entire workspace (shared types, Fastify server, background BullMQ worker, and Chrome Manifest V3 extension).

---

## 1. Unit Testing
Unit tests are written using `vitest` and cover stateless modules, helpers, and isolated domain services.

- **Shared package:** Validates schema parsing (ingest validation, search constraints), constants alignment, and basic helper functions.
- **Server Utilities:**
  - `TextChunker`: Validates recursive character splitting on text of varying lengths, correct chunk overlap, metadata inheritance, and separators.
  - `EmbeddingService`: Verifies fallback triggers when going from cloud (`Voyage AI`) to local (`transformers` Xenova all-MiniLM-L6-v2) embedding modes.
  - `QdrantService`: Tests mapping logic from Qdrant payloads to `SearchResult` models and ensures proper filters are generated.

Run unit tests via:
```bash
pnpm --filter @memora/server test
```

---

## 2. Integration & Route Testing
Integration tests focus on Fastify routers, middlewares, and database transactions.

- **Request Injection:** Using Fastify's `app.inject()` to test routes without spinning up actual TCP listening interfaces.
- **Middleware Chains:** Verifying that `authMiddleware` blocks requests without signed JWT keys, `planLimitMiddleware` reads Redis counters and limits free accounts, and team auth checks member membership roles.
- **Service Hooks:** Testing loops (like `SelfReflectionLoop` or `ConsolidationLoop`) by mocking LLM response inputs and verifying database updates.

---

## 3. Extension Testing
Browser extension tests verify parsing accuracy and offline queue reliability:

- **Readability Parser:** Validates that content extraction strips script blocks and returns sanitized text payloads.
- **Offline Sync Queue:** Mocks network drops, asserts that captures are correctly saved in `chrome.storage.local`, and validates that they sync with exponential backoff once the online flag is set.
