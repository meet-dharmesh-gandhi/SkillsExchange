# SkillsExchange Frontend + API

This Next.js app now contains both UI and backend API route handlers.

## Prerequisites

- Node.js 18+
- npm 9+
- Oracle Database connection details

## Environment

Create `frontend/.env.local`:

```env
ORACLE_USER=your_oracle_username
ORACLE_PASSWORD=your_oracle_password
ORACLE_CONNECT_STRING=host:port/service_name
```

## Install and Run

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## API Base

All frontend requests use same-origin API routes:

- Base: `/api`
- Health check: `GET /api/health`

## Main API Route Handler

- `frontend/app/api/[...path]/route.ts`

This catch-all route preserves endpoint compatibility with the previous Express backend paths.
