# Local Development Guide

This guide provides steps for setting up your local environment, running Memora services, database operations, and development tools.

---

## 1. Prerequisites

Before starting, ensure you have the following installed on your machine:
- **Node.js**: `v20.0.0` or higher (Active LTS recommended)
- **pnpm**: `v9.15.0` or higher (package manager)
- **Docker** & **Docker Compose**: For running backing databases locally
- **Google Chrome**: For loading and testing the extension

---

## 2. Quick Start Developer Flow

Follow these sequential steps to set up the codebase locally:

### Step 1: Install Dependencies
From the repository root, install workspace dependencies:
```bash
pnpm install
```

### Step 2: Configure Environment Variables
Copy the env template to create your local configurations:
```bash
cp .env.example .env
```
Fill in required values, particularly the LLM API keys:
- `GOOGLE_API_KEY`: Required for Gemini actions and loop runners.
- `VOYAGE_API_KEY`: Required for vector search embeddings.
- Generate local JWT RS256 keys or token encryption keys as specified in the comments inside `.env.example`.

### Step 3: Launch Local Services
Spin up the backing Docker services (Postgres, Redis, Qdrant):
```bash
docker-compose up -d
```

### Step 4: Setup Database & Seeds
Generate Prisma client, run migration scripts, and seed initial development data:
```bash
# Generate Prisma typings
pnpm --filter @memora/server db:generate

# Execute database migrations
pnpm migrate

# Seed databases with sample records and templates
pnpm seed
```

### Step 5: Start Development Server
Launch Turborepo to run all workspaces concurrently in watcher mode:
```bash
pnpm dev
```

---

## 3. Workspaces & Developer Commands

We use Turborepo to orchestrate tasks. You can run commands globally or target specific workspaces.

### Global Monorepo Scripts
- `pnpm dev`: Start all apps in watch mode.
- `pnpm build`: Compile all packages (`shared`, `server`, `worker`, `client`, `extension`).
- `pnpm test`: Execute Vitest suites across the workspaces.
- `pnpm lint`: Run ESLint and check formatting.
- `pnpm clean`: Wipe build outputs (`dist/`, `.turbo/`, `node_modules/`).

### Target Specific Package Runs
*   **Fastify API Server:** `pnpm --filter @memora/server dev`
*   **BullMQ Background Worker:** `pnpm --filter @memora/worker dev`
*   **Client React Dashboard:** `pnpm --filter @memora/client dev`
*   **MV3 Extension Build (Watch Mode):** `pnpm --filter @memora/extension dev`

---

## 4. Loading the Browser Extension

To load and debug the Chrome MV3 Extension locally:

1. Compile the extension in developer watch mode by running `pnpm dev` or manually executing `pnpm --filter @memora/extension build` to output the `extension/dist` directory.
2. Open Google Chrome and navigate to `chrome://extensions/`.
3. Enable **Developer mode** (toggle in the top-right corner).
4. Click **Load unpacked** in the top-left.
5. Select the `extension/dist` directory in your file dialog.
6. The extension is now active. Click the Extension icon in Chrome's toolbar to open the Popup, capture pages, or overlay the custom glassmorphic Sidebar.

---

## 5. Backing Services Inspector Tools

For inspecting your local backend services:
- **Qdrant Dashboard**: Open `http://localhost:6333/dashboard` in your browser to inspect collections, vector entries, and payload structures.
- **Redis CLI**: Run `docker exec -it memora-redis redis-cli` to check active caches, BullMQ jobs queue statuses, or blacklist tokens.
- **Postgres Inspection**: Connect using DBeaver, pgAdmin, or any client of your choice to `postgresql://memora:memora_dev@localhost:5432/memora`.
