# Memora v2.0 API Specifications

All endpoints, unless otherwise specified, return JSON and expect `Content-Type: application/json`. Authenticated routes require a Bearer token in the `Authorization` header: `Authorization: Bearer <accessToken>`.

---

## Authentication Endpoints

### 1. Register User
- **Method:** `POST`
- **Path:** `/auth/register`
- **Auth Required:** No
- **Request Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "securepassword123",
    "name": "John Doe"
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "user": {
      "id": "cuid-user-id",
      "email": "user@example.com",
      "name": "John Doe",
      "plan": "FREE",
      "settings": {},
      "createdAt": "2026-07-17T12:00:00Z"
    }
  }
  ```
- **Cookies Set:** `refreshToken` (httpOnly, Secure, SameSite=Strict, 7 days)

### 2. Login User
- **Method:** `POST`
- **Path:** `/auth/login`
- **Auth Required:** No
- **Request Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "securepassword123"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "user": {
      "id": "cuid-user-id",
      "email": "user@example.com",
      "name": "John Doe",
      "plan": "FREE"
    },
    "accessToken": "eyJhbGciOiJSUzI1Ni..."
  }
  ```
- **Cookies Set:** `refreshToken`

### 3. Refresh Access Token
- **Method:** `POST`
- **Path:** `/auth/refresh`
- **Auth Required:** No (Uses `refreshToken` cookie)
- **Response (200 OK):**
  ```json
  {
    "accessToken": "new-access-token"
  }
  ```

### 4. Logout User
- **Method:** `POST`
- **Path:** `/auth/logout`
- **Auth Required:** No
- **Response (200 OK):**
  ```json
  {
    "success": true
  }
  ```

---

## Ingestion Endpoints

### 1. Ingest clean page content
- **Method:** `POST`
- **Path:** `/api/ingest`
- **Auth Required:** Yes
- **Request Body:**
  ```json
  {
    "content": "Full article text content extracted from page...",
    "url": "https://example.com/article",
    "source": "web",
    "title": "Scaling Qdrant for Real-Time Memory Layers",
    "timestamp": "2026-07-17T12:00:00Z",
    "metadata": {}
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "memoryId": "uuid-v4-point-id",
    "chunksCreated": 4,
    "status": "indexed"
  }
  ```

### 2. Document Upload
- **Method:** `POST`
- **Path:** `/api/upload`
- **Auth Required:** Yes
- **Request Body:** `multipart/form-data` containing `file` (PDF or DOCX)
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "memoryId": "uuid-v4-point-id",
    "chunksCreated": 15,
    "status": "indexed"
  }
  ```

---

## Search & Timeline Endpoints

### 1. Hybrid Search
- **Method:** `POST`
- **Path:** `/api/search`
- **Auth Required:** Yes
- **Request Body:**
  ```json
  {
    "query": "How do we scale Qdrant?",
    "filters": {
      "source": "web",
      "dateFrom": "2026-07-01T00:00:00Z",
      "dateTo": "2026-07-17T23:59:59Z"
    },
    "limit": 10,
    "offset": 0
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "results": [
      {
        "id": "uuid-v4-point-id",
        "content": "To scale Qdrant, we use HNSW index construction and scalar quantization...",
        "title": "Scaling Qdrant for Real-Time Memory Layers",
        "url": "https://example.com/article",
        "source": "web",
        "timestamp": 1784318400,
        "score": 0.892,
        "metadata": {}
      }
    ],
    "synthesizedAnswer": {
      "answer": "To scale Qdrant, use HNSW indices with scalar quantization [1].",
      "sources": [
        {
          "url": "https://example.com/article",
          "title": "Scaling Qdrant for Real-Time Memory Layers",
          "chunkId": "chunk-1"
        }
      ],
      "confidence": 0.95
    },
    "total": 1,
    "took": 45
  }
  ```

### 2. Get Memory Timeline
- **Method:** `GET`
- **Path:** `/api/timeline`
- **Auth Required:** Yes
- **Query Parameters:** `limit` (default 20), `offset` (default 0), `source` (optional), `folderId` (optional)
- **Response (200 OK):**
  ```json
  {
    "items": [
      {
        "id": "uuid-v4-point-id",
        "content": "Sample memory text...",
        "title": "Scaling Qdrant",
        "source": "web",
        "timestamp": 1784318400,
        "url": "https://example.com/article"
      }
    ],
    "total": 124,
    "hasMore": true
  }
  ```

---

## Domain Entity Endpoints

### 1. Folders (F41)
- **GET** `/api/folders` — Get user's nested folder tree.
- **POST** `/api/folders` — Create a new folder.
- **PUT** `/api/folders/:id` — Update folder properties (name, description, color, parentId).
- **DELETE** `/api/folders/:id` — Delete a folder (optionally deleting contents or moving them to root).

### 2. People (F40)
- **GET** `/api/people` — List detected persons with filters.
- **POST** `/api/people` — Manually create a person record.
- **GET** `/api/people/:id` — Get person details with all their mentions.
- **PUT** `/api/people/:id` — Update person metadata.

### 3. Automations (F44)
- **GET** `/api/automations` — List user's automation rules.
- **POST** `/api/automations` — Create a rule with triggers, conditions, and actions.
- **PUT** `/api/automations/:id` — Update rule settings or toggle enabled.
- **DELETE** `/api/automations/:id` — Delete rule.

### 4. Graph Explorer (F42)
- **GET** `/api/graph` — Fetch nodes and edges centered around rootNodeId.
- **POST** `/api/graph/explore` — Explore the temporal/knowledge graph starting from a semantic query.

### 5. Browser Allow-list (F45)
- **POST** `/api/browser/action` — Send a vetted browser action payload to run on behalf of the user.
- **GET** `/api/browser/config` — Retrieve extension global configuration parameters.

---

## AI Summarization Endpoints

### 1. Webpage Summarize
- **Method:** `POST`
- **Path:** `/api/summarize`
- **Auth Required:** Yes
- **Request Body:**
  ```json
  {
    "url": "https://example.com/article",
    "title": "Scaling Qdrant for Real-Time Memory Layers",
    "content": "Full raw page content here..."
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "summary": {
      "tldr": "A 1-2 sentence TL;DR of the webpage.",
      "keyPoints": [
        "Key takeaway point 1",
        "Key takeaway point 2",
        "Key takeaway point 3"
      ],
      "tags": ["qdrant", "database", "scaling"]
    },
    "memoryId": "uuid-v4-point-id"
  }
  ```

---

## Highlights Endpoints

### 1. Create Highlight
- **Method:** `POST`
- **Path:** `/api/highlights`
- **Auth Required:** Yes
- **Request Body:**
  ```json
  {
    "url": "https://example.com/article",
    "text": "This is the exact sentence highlighted on the page.",
    "note": "Optional comment added by the user",
    "color": "yellow",
    "memoryId": "optional-uuid"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "id": "cuid-highlight-id",
    "userId": "cuid-user-id",
    "url": "https://example.com/article",
    "text": "This is the exact sentence highlighted on the page.",
    "note": "Optional comment added by the user",
    "color": "yellow",
    "memoryId": "optional-uuid",
    "createdAt": "2026-07-17T12:00:00Z",
    "updatedAt": "2026-07-17T12:00:00Z"
  }
  ```

### 2. Get Highlights
- **Method:** `GET`
- **Path:** `/api/highlights`
- **Auth Required:** Yes
- **Query Parameters:** `url` (url-encoded webpage URL)
- **Response (200 OK):**
  ```json
  [
    {
      "id": "cuid-highlight-id",
      "userId": "cuid-user-id",
      "url": "https://example.com/article",
      "text": "This is the exact sentence highlighted on the page.",
      "note": "Optional comment added by the user",
      "color": "yellow",
      "memoryId": "optional-uuid",
      "createdAt": "2026-07-17T12:00:00Z",
      "updatedAt": "2026-07-17T12:00:00Z"
    }
  ]
  ```

### 3. Delete Highlight
- **Method:** `DELETE`
- **Path:** `/api/highlights/:id`
- **Auth Required:** Yes
- **Response (200 OK):**
  ```json
  {
    "success": true
  }
  ```

