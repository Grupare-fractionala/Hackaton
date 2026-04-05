# Municipal Internal Support Portal

A hackathon project — an AI-powered internal support portal for a Romanian municipality. Combines an employee-facing AI chatbot with ticket management and an internal document knowledge base.

---

## Features

- **AI Chatbot** — Answers employee questions on technical, HR, and legislative topics using a Flowise-backed LLM pipeline
- **Auto-escalation** — If the AI cannot resolve a query, it automatically creates a support ticket routed to the appropriate department
- **Ticket Management** — Full CRUD for support tickets with department routing, status tracking, and operator views
- **Document Knowledge Base** — Internal document upload and filtering by department and category
- **Role-based Access** — Employee, department operator, and global admin roles with route protection

---

## Tech Stack

| Layer | Tools |
|-------|-------|
| Frontend | React 19, Vite, JavaScript |
| Routing | React Router v6 |
| State | Zustand |
| Data Fetching | TanStack Query, Axios (with interceptors) |
| Styling | Tailwind CSS |
| Backend / DB | Supabase (PostgreSQL, Auth, Storage) |
| Chatbot | Streamlit + Flowise (Google Gemini) |
| Testing | Vitest, React Testing Library |

---

## Getting Started

### Prerequisites

- Node.js 20+
- A Supabase project (or use mock mode — see below)

### 1. Clone and install

```bash
git clone https://github.com/your-username/Hackaton.git
cd Hackaton
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
VITE_USE_MOCK=true          # Run fully on local mocks (no backend needed)
VITE_API_BASE_URL=...       # Set when connecting to a real backend
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

### 3. Run

```bash
npm run dev
```

Open `http://localhost:5173`.

**Mock mode** (`VITE_USE_MOCK=true`) runs entirely on local mock data — no backend or Supabase needed. Useful for local development and demos.

---

## Demo Accounts (mock mode)

| Email | Password | Role |
|-------|----------|------|
| `secretara@primarie.local` | `Secretara123!` | Employee |
| `tehnic@primarie.local` | `Tehnic123!` | Technical dept. operator |
| `hr@primarie.local` | `Hr123456!` | HR dept. operator |
| `administrativ@primarie.local` | `AdminDep123!` | Admin dept. operator |
| `admin@primarie.local` | `Admin123!` | Global admin |

---

## Project Structure

```
Hackaton/
├── src/
│   ├── features/
│   │   ├── auth/       # Login, Register, ProtectedRoute
│   │   ├── tickets/    # Ticket API, UI components, tests
│   │   ├── documents/  # Document upload and filtering
│   │   └── chatbot/    # Chat interface
│   ├── api/            # Axios client with auth interceptors
│   ├── store/          # Zustand state (auth, tickets)
│   └── components/     # Shared UI components
├── ai_chatbot/         # Streamlit + Flowise chatbot service
│   ├── main.py
│   └── requirements.txt
└── scripts/            # Utility scripts
```

---

## Ticket Routing

| Topic | Routed to |
|-------|-----------|
| Technical | Technical Department |
| HR | HR Department |
| Legislative / General | Administrative Department |

---

## AI Chatbot Setup

The chatbot runs as a separate Streamlit service:

```bash
cd ai_chatbot
pip install -r requirements.txt
streamlit run main.py
```

Configure credentials in `ai_chatbot/.streamlit/secrets.toml` (see `.streamlit/secrets.toml.example` if present). The chatbot connects to a Flowise endpoint and uses Google Gemini as the underlying model.

---

## Running Tests

```bash
npm test
```

Coverage areas:
- `TicketToDatabase` — direct Supabase insertion logic
- `ticketApi` — Supabase / mock server / fallback API client integration

To generate a coverage report:

```bash
npx vitest run --coverage
```
