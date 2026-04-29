# Municipal Internal Support Portal

An AI-powered internal support portal for a Romanian municipality (`primarie`). It pairs an in-app conversational assistant — **mihAI** — with full ticket management, internal announcements / deadlines, and a department-scoped document knowledge base.

The frontend is a single-page React + Vite application backed by Supabase (Auth, Postgres, Storage). The conversational layer is delegated to a self-hosted **Flowise** instance that orchestrates four chatflows: one for classification and three department-specific RAG agents (IT, HR, Juridic).

---

## How it works

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         React + Vite SPA                                │
│  Login · Dashboard · Chat (mihAI) · Tickets · Knowledge · Announcements │
│  Deadlines · Admin                                                      │
└──────────┬──────────────────────────────┬───────────────────────────────┘
           │                              │
           │ Auth / DB / Storage          │ POST /api/v1/prediction/<id>
           ▼                              ▼
   ┌───────────────┐             ┌──────────────────────┐
   │   Supabase    │             │       Flowise        │
   │  ─ auth        │             │  ─ classification    │  llama-3.3-70b-versatile
   │  ─ profiles    │             │  ─ IT chain          │  llama-3.3-70b-versatile
   │  ─ tickets     │             │  ─ HR chain          │  HF embeddings + Supabase vector store
   │  ─ ticket_msgs │             │  ─ Juridic chain     │  HF embeddings + Supabase vector store
   │  ─ documents   │             └──────────────────────┘
   │  ─ announcements                       │
   │  ─ deadline_…  │             ┌─────────┴──────────────────┐
   │  ─ pgvector    │◄────────────┤  HuggingFace Inference API │
   └───────────────┘   embeddings │  sentence-transformers/    │
                                  │  paraphrase-multilingual-  │
                                  │  MiniLM-L12-v2             │
                                  └────────────────────────────┘
```

### Conversational layer (mihAI)

Every chat message goes through two Flowise calls:

1. **Classification** — a small flow powered by `llama-3.3-70b-versatile` (Groq) decides whether the user's question belongs to **IT**, **HR**, **Juridic / Legislativ**, or **General**.
2. **Department chain** — based on the label, the message is forwarded to the matching specialised chatflow:
   - **IT** — `llama-3.3-70b-versatile`, no vector store. Pure technical Q&A.
   - **HR** — `llama-3.3-70b-versatile` + RAG. Documents are embedded with HuggingFace's
     `sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2` (Inference API) and stored as vectors
     in Supabase via pgvector. The HR Flowise Document Store reads from this vector table.
   - **Juridic** — same stack as HR (HF embeddings + Supabase vector store), but pointed at a separate
     legislative/urbanism document store.

If the classification returns `GENERAL`, the assistant replies with a clarifying message and does *not* call a department chain. For IT / HR / Juridic, the UI also offers a one-click escalation that pre-fills a new ticket using the chat transcript and the inferred category.

The browser proxies Flowise calls through Vite's dev server (`/flowise` → `http://localhost:3000`) to avoid CORS during local development. In production the proxy is replaced by `VITE_FLOWISE_BASE_URL`.

### Document uploads → automatic embedding

When a user uploads a document through `KnowledgePage` the frontend does three things:

1. Stores the file in the `company_documents` Supabase Storage bucket.
2. Inserts a metadata row in the `documents` table.
3. **Triggers a Flowise upsert** so the new file gets chunked, embedded with HuggingFace
   `paraphrase-multilingual-MiniLM-L12-v2`, and written into `document_vectors` (pgvector).

The mapping is defined in `src/features/documents/api/documentApi.js` (`FLOWISE_UPSERT_TARGETS`):

| Upload form "Departament" | Flowise chatflow used for upsert | `metadata.department` tag |
|---------------------------|----------------------------------|---------------------------|
| `HR` | `VITE_FLOWISE_HR_ID` | `HR` |
| `Administrativ` | `VITE_FLOWISE_JURIDIC_ID` | `Legislativ` |
| `Tehnic` / `General` | — (skipped) | — |

The metadata tag matches the filter the corresponding chatflow uses at retrieval time
(`{"department":"HR"}` / `{"department":"Legislativ"}`), so an HR upload becomes
visible only to the HR chain, and an Administrativ upload only to the Juridic chain.

If the Flowise upsert call fails, the document is still saved in Supabase (Storage + `documents`
row), but `createDocument` throws so the UI surfaces the embedding failure instead of pretending
the file is searchable. Empty `document_vectors` after a successful upload almost always means
either the chatflow ID env var is unset or Flowise's loader is misconfigured.

### Data layer (Supabase)

| Table | Purpose |
|-------|---------|
| `profiles` | Username, role (`employee`, `agent_tehnic`, `agent_hr`, `agent_legislativ`, `admin`), department |
| `tickets` | Title, description, category, priority, department, status, source (`manual` / `chat`), `chat_history` |
| `ticket_messages` | Operator ↔ requester chat per ticket |
| `documents` | `file_name`, `file_url`, `department` — uploaded to the `company_documents` Storage bucket |
| `announcements` | Internal announcements / deadlines, with `departments[]`, `pinned`, `due_at` |
| `announcement_reads` | Per-user read state |
| `deadline_completions` | Per-user "done" state for deadline-type announcements |
| pgvector tables | Embeddings consumed by Flowise (HR + Juridic Document Stores) |

Migrations for the application tables live in `supabase/migrations/`. The vector tables are created from the Flowise UI when you add the Document Stores.

---

## Tech Stack

| Layer | Tools |
|-------|-------|
| Frontend | React 18, Vite 7, JavaScript (JSX), path alias `@/*` → `src/*` |
| Routing | React Router v6 (`createBrowserRouter`) |
| Server state | TanStack Query v5 |
| Client state | Zustand (auth) with `localStorage` persistence |
| HTTP | Native `fetch` for Flowise + Supabase REST; Axios instance kept for the legacy `/api` fallback |
| Styling | Tailwind CSS 3 + `@tailwindcss/typography` |
| Charts | Recharts (admin dashboard) |
| Markdown | `react-markdown` (chat bubbles) |
| Backend / DB | Supabase: Auth, Postgres, Storage, pgvector |
| LLM orchestration | Flowise (self-hosted) |
| LLM | `llama-3.3-70b-versatile` (Groq) |
| Embeddings | `sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2` via HuggingFace Inference API |
| Testing | Vitest + jsdom |

---

## Getting Started

### Prerequisites

- Node.js 20+
- One of:
  - A Supabase project (real backend), or
  - `VITE_USE_MOCK=true` for fully local demo mode
- For real chat: a running Flowise instance with the four flows imported, plus a HuggingFace API key and Groq API key configured *inside Flowise* (the frontend never calls Groq or HuggingFace directly)

### 1. Clone and install

```bash
git clone https://github.com/<your-org>/Hackaton.git
cd Hackaton
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

`.env` keys consumed by the frontend (Vite — must be `VITE_`-prefixed):

```env
# --- App mode ---
VITE_USE_MOCK=false               # true = run entirely on local mock data, no Supabase needed

# --- Supabase ---
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=

# --- Flowise (chatbot) ---
VITE_FLOWISE_BASE_URL=            # leave empty to use the Vite dev proxy at /flowise
VITE_FLOWISE_API_KEY=             # optional; sent as Bearer token if present
VITE_FLOWISE_CLASSIFICATION_ID=   # chatflow id for the classifier
VITE_FLOWISE_IT_ID=               # chatflow id for the IT chain
VITE_FLOWISE_HR_ID=               # chatflow id for the HR RAG chain
VITE_FLOWISE_JURIDIC_ID=          # chatflow id for the Juridic RAG chain

# --- Legacy / optional ---
VITE_API_BASE_URL=http://localhost:8080/api   # only used by src/api/axios.js (not in the main flows)
```

Server-side keys (used **only** by the Node scripts in `scripts/`, never by the browser):

```env
SUPABASE_SERVICE_ROLE_KEY=        # required for create-admin / seed-demo-users / create-ticket-messages
```

### 3. Run

```bash
npm run dev          # http://localhost:5173
npm run build        # production build into dist/
npm run preview      # serve the production build
npm run build:pages  # build + post-process for GitHub Pages deploy
npm test             # vitest run
```

---

## Mock mode (no backend)

Set `VITE_USE_MOCK=true` and the entire app — auth, tickets, documents, chat — runs on `localStorage` seeded from `src/api/mockStore.js`. No Supabase or Flowise instance is needed; useful for demos, offline work, and CI.

In mock mode the chatbot performs a naïve keyword classification (`hr`, `juridic`, `parola`, `imprimanta`, …) and returns canned replies, so you can still demonstrate the escalation-to-ticket flow end to end.

### Demo accounts (mock mode)

| Username | Password | Role |
|----------|----------|------|
| `secretara` | `Secretara123!` | Employee |
| `tehnic` | `Tehnic123!` | Technical operator |
| `hr` | `Hr123456!` | HR operator |
| `administrativ` | `AdminDep123!` | Administrative operator |
| `urbanism` | `Urbanism123!` | Urbanism operator |
| `admin` | `Admin123!` | Global admin |

Login accepts the bare username or the `<username>@primarie.local` form.

---

## Project Structure

```
Hackaton/
├── index.html                      # Vite entry HTML
├── vite.config.js                  # base path, "@" alias, /flowise dev proxy, Vitest config
├── tailwind.config.js · postcss.config.js
├── package.json                    # scripts: dev / build / build:pages / preview / test
│
├── src/
│   ├── main.jsx                    # React root + RouterProvider + AppProviders
│   ├── index.css                   # Tailwind layers
│   ├── supabaseClient.js           # anon Supabase client (no-op auth lock to avoid navigator.locks deadlock)
│   │
│   ├── app/
│   │   ├── AppProviders.jsx        # QueryClientProvider, etc.
│   │   └── router.jsx              # all routes + auth loaders
│   │
│   ├── api/
│   │   ├── axios.js                # legacy axios instance (kept for the optional REST fallback)
│   │   └── mockStore.js            # localStorage-backed fake backend used when VITE_USE_MOCK=true
│   │
│   ├── config/
│   │   └── env.js                  # exports `isMockMode`
│   │
│   ├── lib/
│   │   └── supabaseAdmin.js        # service-role client (admin-only, never bundled to prod)
│   │
│   ├── store/
│   │   └── useAuthStore.js         # Zustand: { user, token } + persistence
│   │
│   ├── components/
│   │   ├── layout/                 # AppLayout, PageHeader
│   │   └── ui/                     # Avatar, Badge, Button, Card, EmptyState, Input, Loader, Select, Textarea
│   │
│   ├── pages/                      # one file per route
│   │   ├── LoginPage.jsx
│   │   ├── DashboardPage.jsx
│   │   ├── ChatPage.jsx                    # mihAI
│   │   ├── TicketsPage.jsx · NewTicketPage.jsx
│   │   ├── KnowledgePage.jsx               # documents (a.k.a. /knowledge & /documents)
│   │   ├── AnnouncementsPage.jsx · DeadlinesPage.jsx
│   │   ├── AdminDashboardPage.jsx · AdminPage.jsx · AdminTicketsPage.jsx
│   │   └── NotFoundPage.jsx
│   │
│   ├── features/                   # vertical slices: api / hooks / components / utils
│   │   ├── auth/                   # login, register, ProtectedRoute, useAuth, useCurrentUser
│   │   ├── chat/                   # mihAI: chatApi (Flowise), useChat, ChatWindow, MessageBubble, …
│   │   ├── tickets/                # ticketApi, ticketMessagesApi, useTickets, TicketTable/Form/ChatPanel,
│   │   │                           #   routing.js (category → department), TicketToDatabase + tests
│   │   ├── documents/              # documentApi (Storage + DB), useDocuments, DocumentUploadPanel
│   │   ├── announcements/          # announcementApi (announcements + deadlines), AnnouncementCard/Form
│   │   └── admin/                  # adminApi (user CRUD via service role), useAdmin
│   │
│   ├── utils/                      # avatar.js, cn.js, date.js, id.js
│   └── test/setup.js               # Vitest setup (jsdom, env, localStorage shim)
│
├── supabase/
│   ├── config.toml
│   └── migrations/
│       ├── 20260416191521_ticket_messages.sql
│       └── 20260416220345_profiles_table.sql
│
├── scripts/                        # one-off Node admin scripts (run with `node scripts/<file>.mjs`)
│   ├── create-admin.mjs            # creates admin@primarie.local + profile via service role
│   ├── seed-demo-users.mjs         # creates the demo accounts listed above
│   ├── create-ticket-messages.mjs  # ensures the ticket_messages table is provisioned
│   └── prepare-pages.mjs           # post-build step for GitHub Pages
│
└── .github/workflows/deploy-pages.yml
```

---

## Routing & Roles

Routes are gated by `requireAuth` in `src/app/router.jsx`. `ProtectedRoute` adds role checks where needed.

| Route | Who |
|-------|-----|
| `/login` | Public (redirects authenticated users home) |
| `/` (dashboard) | Any authenticated user |
| `/chat` | Any authenticated user — talks to mihAI |
| `/tickets`, `/tickets/new` | Any authenticated user |
| `/announcements` (alias `/anunturi`) | Any authenticated user |
| `/deadlines` (alias `/termene`) | Any authenticated user |
| `/documents` (alias `/knowledge`) | Any authenticated user; uploads gated by role inside the page |
| `/admin/dashboard`, `/admin/users`, `/admin/tickets` | `admin` role only |

### Ticket routing (category → department)

`src/features/tickets/utils/routing.js` is the single source of truth:

| Category produced by mihAI | Routed to department |
|----------------------------|----------------------|
| `Tehnic` / `IT` | **Tehnic** |
| `HR` / contains `resurse` | **HR** |
| `Legislativ` / anything else | **Administrativ** |

---

## Setting up Flowise

The repo doesn't ship the Flowise project itself — it's expected to be hosted separately (locally on `:3000` in dev, or remote in prod). Once Flowise is running you need to:

1. Create four chatflows. The frontend only knows their **chatflow IDs**; everything else is configured inside Flowise.
   - **Classification flow** — system prompt that returns one of `TEHNIC / HR / JURIDIC / GENERAL`. LLM node: `llama-3.3-70b-versatile` (Groq).
   - **IT flow** — direct Q&A with `llama-3.3-70b-versatile`. No retriever.
   - **HR flow** — Conversational Retrieval QA chain:
     - Embeddings: HuggingFace Inference, model `sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2`
     - Vector store: Supabase (pgvector), pointed at the HR Document Store
     - LLM: `llama-3.3-70b-versatile`
   - **Juridic flow** — same shape as HR, with its own Supabase vector table / Document Store for legislative & urbanism content.
2. In Flowise → *Document Stores*, create one store per RAG flow ("HR" and "Juridic"), upload the source documents, and run the embedding job. Flowise will write the resulting vectors into the Supabase pgvector tables.
3. Copy the four chatflow IDs into `.env` (`VITE_FLOWISE_*_ID`), and — if you've enabled Flowise auth — set `VITE_FLOWISE_API_KEY`.

The frontend talks to Flowise via:

```
POST <FLOWISE_BASE_URL>/api/v1/prediction/<chatflow_id>
{ "question": "...", "sessionId": "<uuid kept in sessionStorage>" }
```

`sessionId` is generated once per browser tab and stored in `sessionStorage`, which gives Flowise enough context to maintain conversation memory per user/tab.

---

## Running Tests

```bash
npm test                     # one-shot run
npx vitest run --coverage    # coverage report
```

Test files live next to the code they cover:

- `src/features/tickets/api/ticketApi.test.js` — Supabase / mock store dispatch
- `src/features/tickets/api/TicketToDatabase.test.js` — direct Supabase insert helper
- `src/features/tickets/api/supabaseIntegration.test.js` — end-to-end against a real Supabase project (skipped when env is missing)

---

## Deployment

- **GitHub Pages** — `npm run build:pages` then push; `.github/workflows/deploy-pages.yml` handles the rest. `vite.config.js` derives the base path from `GITHUB_REPOSITORY` automatically.
- **Vercel** — `vercel.json` is checked in; a normal `npm run build` is enough.
- **Anywhere else** — `npm run build` and serve `dist/` as static files. Make sure the host is allowed in `vite.config.js > server.allowedHosts` if you proxy through ngrok during dev.

---

## License

See `LICENSE`.
