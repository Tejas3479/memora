# Changelog

All notable changes to the Memora project will be documented in this file. The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [4.1.0] - 2026-07-18

### Added
- **SSE Streaming Search:** Integrated Server-Sent Events (SSE) support in the `/api/search` route for real-time token streaming.
- **Voyage API Key Fallback:** Implemented pre-flight checks in `EmbeddingService` to fallback automatically to the local HuggingFace embedding extractor if the Voyage cloud API key is missing.
- **Centralized Error Boundaries:** Added custom structured HTTP exception throwing (`ValidationError`, `NotFoundError`, `ForbiddenError`, `InternalError`) in Comments, Ingestion, and Transcription paths.
- **Audio Upload File Limits:** Enforced a `15MB` max upload size limit for audio files to avoid memory exhaustion during transcribing.
- **High-Fidelity Mockups:** Generated and integrated premium Obsidian Memory dashboard and extension sidebar user interface visuals in the documentation.

### Security
- **Directory Traversal Mitigations:** Secured file serving routes against directory traversal attacks using absolute resolve path assertions.

---

## [4.0.0] - 2026-07-17

### Added
- **Stateful LangGraph Agents:** Refactored complex search routes and proactive suggestion streams using `@langchain/langgraph` state graphs.
- **Active Notion & Slack Sync Workers:** Created cursor-paginated Notion database indexing and Slack message timeline sync pollers.
- **Zep Fact Memory Graph:** Connected session endpoints to query long-term memory graph entities.
- **Semantic Consolidation:** Added cosine similarity scans to merge near-duplicate timeline points and delete redundancies in Qdrant.
- **Speculative Dreaming Loop:** Configured idle random walks to speculatively generate concept connection cards cached in Redis.
- **Interactive Physics Canvas Layout:** Replaced graph loaders with a high-performance 2D Fruchterman-Reingold canvas physics simulation handling panning, zooming, and node dragging.
- **Date Scrubber & Native ZIP Exporter:** Built timeline date scrubbing boundaries in UI and zero-dependency native ZIP archive builders.

---

## [3.0.0] - 2026-07-15

### Added
- **Obsidian Memory UI:** Implemented deep black layouts, radial glowing backdrops, bento grids, and glassmorphic card variables.
- **ADHD Focus Mode:** Added dimming selectors, visual session timers, and reduced motion parameters.
- **Color-Blind safe palette:** Integrated protanopia/deuteranopia safe layout configurations.

---

## [2.0.0] - 2026-07-10

### Added
- **Ingestion Pipelines:** Built PDF/DOCX file extractors and image OCR support via Tesseract.js.
- **RRF Search & Reranking:** Configured Reciprocal Rank Fusion queries using Voyage reranker models.
- **Timeline Feed:** Added chronological memory timeline retrieval.

---

## [1.0.0] - 2026-07-01

### Added
- **Initial Setup:** Configured Turborepo monorepo layouts, Fastify API configurations, Prisma PostgreSQL schemes, Qdrant vector database hooks, and Chrome MV3 extension templates.
