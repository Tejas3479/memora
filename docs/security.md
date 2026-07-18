# Memora v2.0 Security Specifications

## 1. Browser Actions Allow-list
The Chrome extension is restricted from performing arbitrary code execution. Interaction with web pages is strictly governed by a pre-vetted allowlist of actions.

- **Allowlist Elements:**
  - `CAPTURE_PAGE`: Extracts sanitized readable article text.
  - `CAPTURE_SELECTION`: Captures user-selected text blocks.
  - `CAPTURE_SCREENSHOT`: Takes a visible tab snapshot (processed locally for OCR).
  - `OPEN_SIDEBAR`: Renders the context panel side view.
  - `TOGGLE_AUTOCAPTURE`: Saves client-side auto-capture preferences.
- **Enforcement:** The backend rejects any requests to `/api/browser/action` containing action types outside the allow-list.

---

## 2. Ingestion Security & Input Sanitization
- **DOMPurify:** Prior to sending scraped page content from `content.ts` to `background.ts` and the backend, all HTML content is sanitized using DOMPurify to eliminate `<script>`, `<iframe>`, and other active XSS vectors.
- **Strict JSON Schemas:** Every endpoint uses Fastify-supported AJV validation schemas to prevent SQL Injection, Buffer Overflows, or arbitrary payload shapes.
- **Directory Traversal Mitigation (F03):** The file server route `/uploads/:filename` employs absolute path resolution checks via `path.resolve` and verify that the target path begins with the `UPLOADS_DIR` prefix. Attempts to request files outside this directory throw a `ForbiddenError` immediately.
- **Structured Error Masking:** Centralized error boundary handles formatting of database and framework exceptions. Relational databases or file storage inner traces are never leaked in response payloads; standard custom error classes (`ValidationError`, `NotFoundError`, `ForbiddenError`, `InternalError`) translate issues into sanitized consumer-friendly API errors.

---

## 3. Token Encryption & JWT Flow
- **Encryption-at-Rest:** Access tokens and refresh tokens for connected third-party integrations (Slack, Notion, Google Drive, GitHub) are encrypted using AES-256-GCM prior to database persistence. The encryption key is sourced from the `TOKEN_ENCRYPTION_KEY` environment variable.
- **JWT Architecture:** 
  - Uses RS256 algorithm (asymmetric keys).
  - Access Token: Expiries in 15 minutes (stored in client memory).
  - Refresh Token: Expires in 7 days (stored in httpOnly, Secure, SameSite=Strict cookies).
  - Rotation: When `/auth/refresh` is triggered, the refresh token is rotated and replaced to prevent reuse attacks.

---

## 4. Rate Limiting Strategy
Distributed rate limiting is managed via Redis using the token bucket algorithm:
- **Public auth endpoints:** 10 requests per 5 minutes per IP.
- **General API endpoints:** 100 requests per 15 minutes per user.
- **Ingestion/Sync endpoints:** 20 requests per hour per user (highly resource-intensive).
