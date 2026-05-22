# VedaAI – AI Assessment Creator

A production-grade AI-powered assessment/question paper generator. Built as a monorepo with a Next.js frontend and Node.js + Express backend.

**Contents:** [Architecture](#architecture-overview) · [Tech stack](#tech-stack) · [Secrets](#secrets--environment-files) · [Setup](#setup-instructions) · [Production](#running-in-production) · [Hosted deploy](#deploying-hosted) · [Project structure](#project-structure) · [API](#api-endpoints) · [WebSocket](#websocket-events) · [AI providers](#free-ai-options-no-openai-payment-required) · [Design decisions](#design-decisions)

## Architecture Overview

```
┌─────────────┐     REST API      ┌─────────────┐     BullMQ      ┌──────────┐
│   Frontend   │ ─────────────▶  │   Backend    │ ──────────────▶ │  Worker   │
│  (Next.js)   │                  │  (Express)   │                 │  (BullMQ) │
│              │ ◀──── WS ──────  │              │                 │           │
└─────────────┘   Socket.io       └──────┬───────┘                 └─────┬─────┘
                                         │                               │
                                    ┌────▼────┐                    ┌─────▼─────┐
                                    │  Redis   │                    │  OpenAI /  │
                                    │ (Cache)  │                    │ Anthropic  │
                                    └─────────┘                    └───────────┘
                                    ┌─────────┐
                                    │ MongoDB  │
                                    │  (Data)  │
                                    └─────────┘
```

**Flow:**
1. User fills the form → POST to `/api/assignments`
2. Backend creates MongoDB doc, queues a BullMQ job
3. Worker picks up the job, calls OpenAI/Anthropic to generate questions
4. Worker parses & validates the LLM JSON → saves to MongoDB
5. Socket.io pushes progress events to frontend in real-time
6. Frontend renders the generated paper + PDF export

## Tech Stack

### Frontend
- **Next.js** (App Router) + TypeScript
- **Zustand** for state management
- **WebSocket** (Socket.io-client) for real-time updates
- TailwindCSS for styling
- React Hook Form + Zod for validation
- @react-pdf/renderer for PDF export
- Lucide React for icons

### Backend
- **Node.js + Express** + TypeScript
- **MongoDB** with Mongoose
- **Redis** (ioredis) for caching & job state
- **BullMQ** for background job queues
- **WebSocket** (Socket.io) for real-time events
- Multer for file uploads
- pdf-parse for PDF text extraction
- AI SDKs — Gemini / Groq / Ollama / OpenAI / Anthropic (via `AI_PROVIDER` env var)
- Zod for request validation

### Shared
- `@vedaai/shared` — TypeScript types shared across frontend and backend via workspace path aliases

### Infrastructure
- Docker Compose for **local** MongoDB + Redis only (`docker-compose.yml`). Production databases are usually hosted (e.g. MongoDB Atlas + managed Redis).

## Secrets & environment files

- **Never commit secrets** — no API keys, tokens, or passwords in git, README snippets beyond placeholders, or tracked config files.
- **Use a local `.env`** at the repo root (copy from `.env.example`). Root `.gitignore` ignores `.env`, `.env.*`, and similar patterns; **`.env.example` is the only committed env template** and must stay placeholder-only (`your_key_here`, empty values, or obvious dummies like `changeme`).
- **Production:** set variables in your host’s dashboard (Vercel, Railway, Render, etc.) rather than committing a `.env` file.
- If a real key was ever pushed, **rotate it immediately** and consider scrubbing git history (`git filter-repo`, BFG Repo-Cleaner).

## Setup Instructions

### Prerequisites
- Node.js 18+
- Docker + Docker Compose

### Installation

1. **Clone the repo**
   ```bash
   git clone <repo-url>
   cd vedaai
   ```

2. **Copy environment file**
   ```bash
   cp .env.example .env
   ```
   Fill in secrets locally only (never commit `.env`). Set `AI_PROVIDER` and the matching API key (see **Free AI options** below). Use **`NEXT_PUBLIC_API_URL`** / **`NEXT_PUBLIC_WS_URL`** as the **API origin only** (no `/api` suffix); see [`apps/frontend/src/lib/api/assignments.ts`](apps/frontend/src/lib/api/assignments.ts). For production splits, set **`FRONTEND_URL`** on the backend to your deployed frontend URL (see **Deploying (hosted)**).

3. **Start infrastructure**
   ```bash
   docker-compose up -d
   ```
   This starts MongoDB on port 27017 and Redis on port 6379.

4. **Install all dependencies**
   ```bash
   npm install
   ```
   This installs root dependencies and all workspace packages.

5. **Start both services**
   ```bash
   npm run dev
   ```
   Backend runs on `http://localhost:4000`, frontend on `http://localhost:3000`.

   Or start individually:
   ```bash
   npm run dev:backend
   npm run dev:frontend
   ```

### Running in Production

Build and run each app (from the paths below). Ensure `.env` exists at the repo root with production values, **or** export the same variables on the server.

```bash
# Backend
cd apps/backend
npm run build
npm start

# Frontend
cd apps/frontend
npm run build
npm start
```

From the monorepo root you can run **`npm run build`** to build backend then frontend.

### Deploying (hosted)

Typical split deployment:

1. **Backend** (Node-friendly host: Railway, Render, Fly.io, etc.)
   - Set `PORT`, `MONGODB_URI`, `REDIS_URL`, `FRONTEND_URL` (your live frontend origin, no trailing slash), `JWT_SECRET` (long random string), and AI variables (`GEMINI_API_KEY`, etc.) in the provider’s env UI.
   - `FRONTEND_URL` drives **CORS** and **Socket.io** origins (`apps/backend/src/app.ts`, `apps/backend/src/socket/index.ts`).
   - Health check: **`GET /health`** on the API origin.
   - **Render + this monorepo:** leave Root Directory blank (repo root). **Build:** `npm ci && npm run build:backend`. **Start:** **`node apps/backend/dist/apps/backend/src/server.js`** (nested path is intentional with the current `tsconfig`; see [`render.yaml`](render.yaml)). `typescript` and `@types/*` live under **`dependencies`** in **`apps/backend`** so production installs still run `tsc`.

2. **Frontend** (e.g. Vercel)
   - Build `apps/frontend`.
   - Set **`NEXT_PUBLIC_API_URL`** and **`NEXT_PUBLIC_WS_URL`** to your **public API origin only** (e.g. `https://api.example.com`) — **do not** append `/api`; the Axios client adds `/api` for REST ([`apps/frontend/src/lib/api/assignments.ts`](apps/frontend/src/lib/api/assignments.ts)).

3. **Data**
   - Use managed MongoDB (e.g. Atlas) and Redis (e.g. Redis Cloud) in production instead of local Docker.

## Project Structure

```
vedaai/
├── apps/
│   ├── frontend/            # Next.js (App Router) + TypeScript
│   │   └── src/
│   │       ├── app/         # Pages (App Router)
│   │       ├── components/  # React components
│   │       │   ├── layout/  # Sidebar, TopBar, MobileTabBar, AppShell
│   │       │   ├── assignment/ # Form, FileUpload
│   │       │   ├── paper/   # PaperView, PDFExport, DifficultyBadge
│   │       │   └── shared/  # LoadingSpinner, StatusBadge, ErrorBoundary
│   │       └── lib/
│   │           ├── store/   # Zustand store
│   │           ├── socket/  # WebSocket hook
│   │           ├── api/     # Axios API client
│   │           └── utils/   # Validation, formatting
│   └── backend/             # Node.js + Express + TypeScript
│       └── src/
│           ├── config/      # DB, Redis, env config
│           ├── models/      # Mongoose models
│           ├── queues/      # BullMQ queue & worker
│           ├── services/    # AI service & PDF service
│           ├── routes/      # REST API routes
│           ├── middleware/   # Multer upload
│           └── socket/      # Socket.io setup
├── packages/
│   └── shared/              # Shared TypeScript types (@vedaai/shared)
│       └── types.ts
├── docker-compose.yml
├── .env.example
└── README.md
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/assignments` | Create a new assignment (multipart form) |
| GET | `/api/assignments` | List all assignments (paginated) |
| GET | `/api/assignments/:id` | Get a single assignment |
| POST | `/api/assignments/:id/regenerate` | Regenerate an assignment |
| DELETE | `/api/assignments/:id` | Delete an assignment |

## WebSocket Events

| Event | Direction | Payload |
|-------|-----------|---------|
| `subscribe:assignment` | Client → Server | `assignmentId` |
| `job:started` | Server → Client | `{ type, assignmentId, message }` |
| `job:progress` | Server → Client | `{ type, assignmentId, progress, message }` |
| `job:completed` | Server → Client | `{ type, assignmentId, progress, result }` |
| `job:failed` | Server → Client | `{ type, assignmentId, error }` |

## Free AI options (no OpenAI payment required)

| Provider | Cost | Setup |
|----------|------|--------|
| **gemini** (default) | Free tier on Google AI Studio | [Get API key](https://aistudio.google.com/apikey) → set `AI_PROVIDER=gemini` and `GEMINI_API_KEY` |
| **groq** | Free tier | [Get API key](https://console.groq.com/keys) → set `AI_PROVIDER=groq` and `GROQ_API_KEY` (uses Llama open models) |
| **ollama** | Free, runs on your Mac | Install [Ollama](https://ollama.com), run `ollama pull llama3.2`, set `AI_PROVIDER=ollama` (no API key) |

Paid options: `openai`, `anthropic` (same as before).

**Check quotas:** Open AI Studio → **Usage / Rate limits**. If **Gemini 2.5 Pro** shows **0 RPM / 0 RPD**, switch to a model that has non‑zero limits (e.g. **`gemini-2.5-flash`**). Flash tiers often allow **few requests per day** on free/low tiers — avoid regenerating repeatedly.

Example `.env` for Gemini:

```env
AI_PROVIDER=gemini
GEMINI_API_KEY=your_key_here
GEMINI_MODEL=gemini-2.5-flash
```

**Gemini Pro:** Only use `GEMINI_MODEL=gemini-2.5-pro` if your AI Studio **rate limits** page shows **non‑zero** RPM/RPD for that model. If Pro shows **0 / 0**, requests will fail — use **`gemini-2.5-flash`** (or **`gemini-2.0-flash-lite`**) instead.

**Gemini Advanced** (Google One) is separate from **API quotas**. Consumer subscription does not replace AI Studio model quotas.

If you get 404 or permission errors on Pro, try `gemini-2.5-pro-preview` or check **Models** in AI Studio.

**If you see Gemini `429` / quota errors:** The backend retries automatically using Google’s suggested delay. If limits persist (especially daily caps), wait and retry later, enable billing on AI Studio for higher limits, or use **`AI_PROVIDER=groq`** / **`AI_PROVIDER=ollama`** instead.

Restart the backend after changing `.env`.

## Design Decisions

- **Why BullMQ**: LLM calls take 10-30s. BullMQ provides reliable job processing with retry logic (3 attempts, exponential backoff), preventing request timeouts and enabling concurrent processing.

- **Why Zustand over Redux**: Simpler API with less boilerplate. For this app's state complexity, Zustand provides the right balance of power and simplicity without the overhead of actions/reducers/middleware.

- **Prompt design**: The prompt forces structured JSON output, grouping questions by type into sections. This makes parsing deterministic and lets us validate the structure before saving.

- **PDF rendering**: Using `@react-pdf/renderer` instead of browser print ensures consistent, professional PDFs across all platforms.

- **Redis caching**: Assignment results are cached for 1 hour. Cache is invalidated on regeneration or deletion.

- **WebSocket rooms**: Socket.io rooms per assignment ID allow targeted event delivery — only clients watching a specific assignment receive its progress updates.

- **Shared types**: `@vedaai/shared` package provides a single source of truth for TypeScript interfaces used across both frontend and backend, preventing type drift.
