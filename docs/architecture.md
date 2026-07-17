# Architecture

## System Overview

Memora is a monorepo application composed of five packages that work together to provide a personal memory layer. The system captures content from the user's browser, processes it asynchronously, and makes it available for semantic search and AI-driven synthesis.

The architecture follows a clear separation between synchronous HTTP handling and asynchronous job processing. The Fastify API server handles all client-facing requests—authentication, ingestion, search, and settings—while a dedicated BullMQ worker handles compute-intensive tasks like embedding generation, memory consolidation, and loop engineering processes.

```mermaid
graph TD
    subgraph Browser Extension (MV3)
        ContentScript[Content Script]
        BackgroundWorker[Background Service Worker]
        SidebarPanel[Sidebar Panel]
        Popup[Popup UI]
    end

    subgraph API Server (Fastify)
        AuthRoutes[Auth Routes]
        IngestRoutes[Ingest Routes]
        SearchRoutes[Search Routes]
        BillingRoutes[Billing & Settings Routes]
        
        AuthService[Auth Service]
        MemoryService[Memory Service]
        SearchService[Search Service]
        BillingService[Billing Service]
    end

    subgraph Storage & Infrastructure
        Postgres[(PostgreSQL + Prisma)]
        Qdrant[(Qdrant Vector DB)]
        Redis[(Redis Cache / BullMQ Backend)]
        Stripe[Stripe API]
    end

    subgraph Background Worker (BullMQ)
        BullWorker[Worker Process]
        EmbedJob[Embed Job]
        ConsolidateJob[Consolidate Job]
        ReflectJob[Reflect Job]
        EvaluateJob[Evaluate Job]
        DreamJob[Dream Job]
    end

    subgraph AI Models
        Voyage[Voyage AI Embeddings]
        Gemini[Google Gemini LLM]
    end

    %% Communication Flows
    ContentScript -->|Local IPC| BackgroundWorker
    SidebarPanel -->|Local IPC| BackgroundWorker
    Popup -->|Local IPC| BackgroundWorker
    
    BackgroundWorker -->|HTTPS / WSS| AuthRoutes
    BackgroundWorker -->|HTTPS / WSS| IngestRoutes
    BackgroundWorker -->|HTTPS / WSS| SearchRoutes
    BackgroundWorker -->|HTTPS / WSS| BillingRoutes

    AuthRoutes --> AuthService
    IngestRoutes --> MemoryService
    SearchRoutes --> SearchService
    BillingRoutes --> BillingService

    AuthService --> Postgres
    AuthService --> Redis
    
    MemoryService --> Postgres
    MemoryService --> Redis
    
    SearchService --> Qdrant
    SearchService --> Voyage
    SearchService --> Gemini
    
    BillingService --> Postgres
    BillingService --> Stripe

    Redis -->|Queue Jobs| BullWorker
    BullWorker --> EmbedJob
    BullWorker --> ConsolidateJob
    BullWorker --> ReflectJob
    BullWorker --> EvaluateJob
    BullWorker --> DreamJob

    EmbedJob --> Voyage
    EmbedJob --> Qdrant
    ConsolidateJob --> Gemini
    ReflectJob --> Gemini
    DreamJob --> Gemini
    DreamJob --> Qdrant
```

---

## Data Flow

### Capture → Chunk → Embed → Store → Search → Synthesize

1. **Capture**: The browser extension detects page loads, text selections, or manual screenshot triggers. Content is sent to the API server via authenticated HTTPS requests. If the user is offline, captures are queued in IndexedDB and flushed when connectivity resumes.

2. **Chunk**: The ingest route receives raw content and immediately persists a `Memory` record in PostgreSQL. It then enqueues an `embed` job on the BullMQ queue. The worker picks up the job, splits content into overlapping chunks (default: 512 tokens with 64-token overlap) using a recursive character text splitter that respects sentence boundaries.

3. **Embed**: Each chunk is sent to the Voyage AI embedding API (`voyage-3-large`, 1024 dimensions). Embeddings are generated in batches of up to 128 chunks per request to minimize API calls and latency.

4. **Store**: The worker upserts each chunk's embedding vector into Qdrant with a payload containing the memory ID, chunk index, source URL, timestamp, and user ID. The Qdrant collection uses HNSW indexing with cosine similarity for fast approximate nearest-neighbor retrieval.

5. **Search**: When the user issues a search query, the server embeds the query text using the same Voyage AI model, then performs a vector similarity search against Qdrant filtered by user ID. Results are re-ranked by a combination of vector similarity score and temporal recency.

6. **Synthesize**: If the user has synthesis enabled, the top-k retrieved chunks are passed to Google Gemini with a carefully constructed prompt that instructs the model to synthesize a coherent answer citing specific sources. The synthesized answer is returned alongside the raw search results.

---

## Service Boundaries

### API Server (Fastify)

The Fastify server is the single entry point for all client communication. It handles:

- **Authentication**: Registration, login, token refresh, and token revocation
- **Ingestion**: Receiving content from the browser extension and dashboard
- **Search**: Query embedding, vector retrieval, and optional synthesis
- **Timeline**: Paginated chronological view of captured memories
- **Settings**: User preferences, integration configuration, notification rules
- **Billing**: Stripe checkout session creation and webhook processing
- **Knowledge Graph**: Entity and relationship queries for the graph view
- **Teams**: Workspace management, invitations, and role-based access
- **WebSocket**: Real-time updates for sidebar and proactive suggestions

The server does **not** perform any long-running computation. All embedding generation, consolidation, reflection, and loop processes are delegated to the worker via BullMQ job queues.

### Background Worker (BullMQ)

The worker is a standalone Node.js process that consumes jobs from Redis-backed BullMQ queues. It handles:

- **Embedding jobs**: Chunk text and generate Voyage AI embeddings
- **Consolidation jobs**: Merge semantically similar memories
- **Reflection jobs**: Analyze memory patterns and generate insights
- **Evaluation jobs**: Measure retrieval quality metrics
- **Dreaming jobs**: Discover non-obvious connections between memories
- **Integration sync jobs**: Pull content from third-party services
- **Automation execution jobs**: Run user-defined automation rules

Each job type has its own dedicated queue with configurable concurrency, retry policies, and backoff strategies. Failed jobs are moved to a dead-letter queue after exhausting retries.

---

## Security Model

### JWT RS256 Authentication

All API routes (except auth and Stripe webhook) require a valid JWT access token. Tokens are signed using RS256 asymmetric keys:

- **Access tokens**: 15-minute TTL, sent via `Authorization: Bearer` header
- **Refresh tokens**: 7-day TTL, stored in httpOnly secure cookies with `SameSite=Strict`
- **Token revocation**: Revoked tokens are added to a Redis blacklist checked on every request. Blacklist entries auto-expire when the token's natural TTL elapses.

### AES-256-GCM Token Encryption

OAuth tokens from third-party integrations (Notion, Readwise, etc.) are encrypted at rest using AES-256-GCM:

- Each encrypted value uses a unique, randomly generated 12-byte initialization vector (IV)
- The IV is prepended to the ciphertext and stored as a single binary blob
- The encryption key is derived from a master secret via HKDF
- Key rotation is supported by versioning the encryption key; old versions are retained for decryption until all tokens are re-encrypted

### Rate Limiting

Rate limits are enforced using a sliding window counter stored in Redis:

| Scope            | Limit                    |
| ---------------- | ------------------------ |
| Authenticated    | 100 requests / minute    |
| Unauthenticated  | 20 requests / minute     |
| Auth endpoints   | 10 requests / minute     |
| Automation       | 100 actions / hour / user|

### CORS

CORS is configured to allow requests only from:
- The dashboard origin (`https://app.memora.dev`)
- The browser extension origin (`chrome-extension://<extension-id>`)
- `localhost` origins during development

---

## Job vs. Worker Separation

The architectural boundary between the Fastify server and the BullMQ worker is strict and intentional:

**Fastify Server responsibilities:**
- Validate and authenticate incoming requests
- Persist data to PostgreSQL via Prisma
- Enqueue jobs on BullMQ queues via Redis
- Query Qdrant for vector search results
- Return responses to clients within tight latency budgets (~200ms p95)

**BullMQ Worker responsibilities:**
- Consume jobs from Redis queues
- Execute compute-intensive operations (chunking, embedding, LLM calls)
- Update PostgreSQL and Qdrant with processing results
- Schedule recurring loop engineering tasks via BullMQ repeatable jobs
- Handle retries, backoff, and dead-letter queue routing

This separation ensures the API server remains responsive under load. Even if the worker falls behind on embedding jobs, users can still search existing memories and capture new content without degradation.

---

## Loop Engineering

Memora employs five interconnected loop processes that continuously improve the quality and connectedness of the user's memory store:

### Self-Reflection

Runs every 24 hours per user. Analyzes the user's recent captures to identify:
- Recurring topics and emerging interests
- Gaps in knowledge coverage
- Content that was captured but never searched or revisited

The reflection output is stored as a special `reflection` memory type and surfaced via proactive suggestions.

### Consolidation

Runs every 12 hours. Identifies clusters of semantically similar memories using Qdrant's built-in clustering capabilities:
- Memories with cosine similarity > 0.92 are candidates for merging
- The consolidation job uses Gemini to generate a unified summary
- Original memories are preserved but linked to the consolidated version
- Duplicate or near-duplicate captures are deduplicated

### Evaluation

Runs weekly. Measures the quality of the memory system:
- **Retrieval relevance**: Samples recent searches and measures nDCG@10 against user click-through data
- **Embedding freshness**: Detects memories whose embeddings were generated by an older model version
- **Coverage**: Identifies topics with sparse memory coverage
- Results are logged and used to tune chunking parameters and re-embedding schedules

### Multi-Agent Debate

Triggered on-demand for complex synthesis queries. Two Gemini instances are given the same retrieved context but opposing initial positions. They debate through three rounds, after which a third instance synthesizes the strongest arguments into a final answer. This reduces hallucination and surface-level responses for nuanced questions.

### Dreaming

Runs during user-configured idle periods (default: 2:00–6:00 AM user-local time). Performs random walks through the memory graph:
- Selects a random seed memory
- Retrieves its nearest neighbors in Qdrant
- Follows knowledge graph edges to discover non-obvious connections
- Generates "insight" memories that link previously unconnected concepts
- Insights are tagged with a confidence score and surfaced only above a threshold

---

## Browser Extension Security

The browser extension operates under a strict allow-list model. The background service worker only processes the following action types:

| Action                 | Description                                        |
| ---------------------- | -------------------------------------------------- |
| `CAPTURE_PAGE`         | Extract and send the current page's text content   |
| `CAPTURE_SELECTION`    | Send the user's highlighted text selection          |
| `CAPTURE_SCREENSHOT`   | Capture a visible-area screenshot of the active tab |
| `OPEN_SIDEBAR`         | Toggle the extension's sidebar panel               |
| `TOGGLE_AUTOCAPTURE`   | Enable or disable passive page capture              |

**Explicitly prohibited behaviors:**
- No arbitrary JavaScript execution on pages
- No DOM mutation or content injection (except the sidebar iframe)
- No programmatic navigation or URL changes
- No access to form data, passwords, or autofill fields
- No cross-origin requests from the content script (all API calls go through the background service worker)

The content script uses `document.cloneNode(true)` to extract a read-only copy of the DOM, strips scripts and styles, and extracts clean text using Mozilla's Readability algorithm. No raw HTML is ever sent to the server—only sanitized plain text and metadata.

---

## Database Choices

### PostgreSQL (via Prisma)

PostgreSQL serves as the authoritative data store for all relational data:
- **Users**: Account information, preferences, subscription status
- **Memories**: Metadata, source URL, title, timestamps, processing status
- **Folders**: Hierarchical organization with parent-child relationships
- **Automations**: User-defined rules with triggers, conditions, and actions
- **Teams**: Workspace membership, roles, and invitation tracking
- **Comments**: Threaded discussions on individual memories
- **People**: Contact entities extracted from memories
- **Integration tokens**: Encrypted OAuth credentials for third-party services

Prisma provides type-safe database access, automatic migrations, and a declarative schema that serves as the single source of truth for the relational data model.

### Qdrant (Vector Store)

Qdrant stores dense vector embeddings for semantic search:
- **Collection**: `memories` with 1024-dimension vectors (Voyage AI `voyage-3-large`)
- **Distance metric**: Cosine similarity
- **Index type**: HNSW with `m=16`, `ef_construct=100`
- **Payload filtering**: User ID, source type, timestamp range, folder ID
- **Quantization**: Scalar quantization enabled for reduced memory footprint in production

Qdrant was chosen over pgvector for its purpose-built HNSW implementation, payload-filtered search, built-in clustering, and horizontal scalability. For a memory system where search quality is the core value proposition, a dedicated vector database is justified.

### Redis

Redis serves three roles:
1. **BullMQ backend**: Reliable job queue storage with at-least-once delivery guarantees
2. **Cache layer**: Short-lived caches for user sessions, rate limit counters, and frequently accessed settings
3. **Token blacklist**: Revoked JWT tokens are stored with TTL matching the token's remaining validity period
