# Contributing to Memora

Thank you for your interest in contributing to Memora! We welcome contributions of all kinds, including bug fixes, new features, documentation improvements, and feedback.

---

## Code of Conduct

All contributors are expected to adhere to our [Code of Conduct](CODE_OF_CONDUCT.md). Please read it to understand the standards of behavior expected when participating in our community.

---

## Getting Started

### 1. Prerequisites

Make sure you have the following installed on your development machine:
- **Node.js** v20 or higher
- **pnpm** v9 or higher (`npm i -g pnpm`)
- **Docker** and **Docker Compose** (for running PostgreSQL, Redis, and Qdrant locally)

### 2. Local Setup

1. **Fork and Clone the Repository**
   ```bash
   git clone https://github.com/your-username/memora.git
   cd memora
   ```

2. **Install Workspace Dependencies**
   ```bash
   pnpm install
   ```

3. **Start Infrastructure Services**
   ```bash
   docker-compose up -d
   ```

4. **Environment Variables**
   Copy `.env.example` to `.env` if you need to customize ports or credentials:
   ```bash
   cp .env.example .env
   ```

5. **Run Database Migrations & Seed Data**
   ```bash
   pnpm migrate
   pnpm seed
   ```

6. **Start All Services in Development Mode**
   ```bash
   pnpm dev
   ```

---

## Development Workflow

### Monorepo Structure

Memora uses a `pnpm` workspace managed by Turborepo:

- `shared/` — Common TypeScript types, constants, schemas (Zod), and utilities.
- `server/` — Fastify HTTP/WebSocket server, authentication, billing, and database models (Prisma).
- `worker/` — BullMQ background job processors, embedding pipelines, and loop engineering routines.
- `client/` — React + Vite frontend dashboard.
- `extension/` — Manifest V3 Chrome browser extension for content capture and sidebar.

### Running Commands

- **Build all packages**: `pnpm build`
- **Run all unit/integration tests**: `pnpm test`
- **Run lint checks**: `pnpm lint`

---

## Submitting Pull Requests

1. **Create a Feature Branch**
   Use a descriptive branch name:
   ```bash
   git checkout -b feat/short-description
   # or
   git checkout -b fix/issue-description
   ```

2. **Commit Your Changes**
   Follow conventional commit messages when possible:
   - `feat: add new vector filter parameter`
   - `fix: resolve Fastify correlation ID header propagation`
   - `docs: update deployment instructions`

3. **Run Tests & Verify Build**
   Ensure all tests pass before pushing:
   ```bash
   pnpm build
   pnpm test
   ```

4. **Push and Open a Pull Request**
   Push your branch to your fork and open a Pull Request against the `main` branch of `Tejas3479/memora`. Fill out the PR template provided.

---

## Reporting Issues & Feature Requests

- **Bug Reports**: Use the [Bug Report template](.github/ISSUE_TEMPLATE/bug_report.md) and include steps to reproduce, expected vs. actual behavior, and relevant error logs.
- **Feature Requests**: Use the [Feature Request template](.github/ISSUE_TEMPLATE/feature_request.md) and outline the problem statement and proposed solution.

---

## Community & Questions

If you have questions or need help getting started, feel free to open a Q&A issue on GitHub.
