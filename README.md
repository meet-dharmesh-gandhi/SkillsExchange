# SkillsExchange

A full-stack skill-exchange platform built for a DBMS project. Users can offer skills, request skills to learn, get matched with reciprocal partners, schedule sessions, and rate each other after completion.

## Table of Contents

- [Overview](#overview)
- [Core Features](#core-features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [Database Setup (Oracle)](#database-setup-oracle)
- [Backend Setup](#backend-setup)
- [Frontend Setup](#frontend-setup)
- [API Endpoints](#api-endpoints)
- [Frontend Routes](#frontend-routes)
- [Matching and Rating Logic](#matching-and-rating-logic)
- [Validation and Error Handling](#validation-and-error-handling)
- [Known Limitations](#known-limitations)
- [Suggested Improvements](#suggested-improvements)

## Overview

SkillsExchange connects learners and mentors through reciprocal skill swapping:

- A user adds skills they can teach.
- A user requests skills they want to learn.
- The system finds two-way matches using an Oracle stored procedure.
- Matched users schedule sessions.
- After sessions are completed, users submit ratings and optional reviews.

## Core Features

- User registration and login
- Profile view and profile edit with password verification
- Skill catalog and user skill management (add, edit proficiency, delete)
- Skill requests with duplicate-request prevention at DB level
- Match generation through PL/SQL procedure
- Session lifecycle management:
    - pending
    - upcoming
    - complete
    - cancel
- Post-session rating and reviews
- Public profile view per user (skills + reviews)
- Basic API testing page in frontend at `/api-overview`

## Tech Stack

### Frontend

- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS v4

### Backend (inside Next.js)

- Next.js App Router Route Handlers (`frontend/app/api`)
- Oracle DB driver (`oracledb`)

### Database

- Oracle Database
- SQL schema, sequences, triggers
- PL/SQL procedure and function

## Architecture

1. Frontend calls same-origin REST APIs using `frontend/lib/api.ts`.
2. Next.js route handlers in `frontend/app/api/[...path]/route.ts` execute SQL or PL/SQL via `frontend/lib/server/db.ts`.
3. Oracle handles:
    - relational data
    - ID generation (sequences/triggers)
    - business constraints (duplicate request prevention)
    - matching logic (procedure)
    - rating aggregation support (function)

Authentication is sessionless at backend level (no JWT). Frontend stores user object in localStorage (`se_user`) and restores on reload.

## Project Structure

```text
SkillsExchange/
	backend/
		db.js
		server.js
		routes/api.js
		requests.http
	frontend/
		app/
			api-overview/
			dashboard/
			login/
			matches/
			profile/
			register/
			sessions/
			skills/
		components/
		context/
		lib/
	resources/
		schema.sql
		sequences.sql
		triggers.sql
		procedures.sql
		functions.sql
		sample_data.sql
		api_contract.md
		business_logic.md
```

## Prerequisites

- Node.js 18+
- npm 9+
- Oracle Database (local or remote)
- Oracle Instant Client available for Node `oracledb` (required by `oracledb.initOracleClient()` in backend)

## Environment Variables

### Backend (`backend/.env`)

```env
PORT=9000
ORACLE_USER=your_oracle_username
ORACLE_PASSWORD=your_oracle_password
ORACLE_CONNECT_STRING=host:port/service_name
```

### Frontend (`frontend/.env.local`)

```env
ORACLE_USER=your_oracle_username
ORACLE_PASSWORD=your_oracle_password
ORACLE_CONNECT_STRING=host:port/service_name
```

## Database Setup (Oracle)

Run scripts in this order:

1. `resources/schema.sql`
2. `resources/sequences.sql`
3. `resources/triggers.sql`
4. `resources/procedures.sql`
5. `resources/functions.sql`
6. `resources/sample_data.sql` (optional seed)

### Core Tables

- `users`
- `skills`
- `user_skills`
- `user_requests`
- `matches`
- `sessions`
- `ratings`

### Important DB Objects

- Procedure: `match_users`
- Function: `calculate_rating(u_id NUMBER)`
- Trigger: `prevent_duplicate_request` (raises Oracle app error on duplicate request)

## Backend Setup

Backend runs as part of the Next.js app via route handlers in `frontend/app/api`.

Health endpoint:

```http
GET /api/health
```

## Frontend Setup

From project root:

```bash
cd frontend
npm install
```

Run frontend dev server:

```bash
npm run dev
```

Default frontend URL: `http://localhost:3000`

Default API base URL: `http://localhost:3000/api`

## API Endpoints

Base URL: `http://localhost:3000/api`

### Auth

- `POST /register`
- `POST /login`

### Profile

- `GET /user/:userId`
- `PUT /user/:userId`

### Skills

- `GET /skills`
- `POST /add-new-skill`

### User Skills

- `GET /user-skills/:userId`
- `POST /add-skill`
- `PUT /user-skill/:id`
- `DELETE /user-skill/:id`

### Skill Requests

- `GET /user-requests/:userId`
- `POST /request-skill`

### Matching

- `POST /match-users`
- `GET /matches/:userId`

### Sessions

- `POST /schedule-session`
- `GET /sessions/:userId`
- `PUT /session/:sessionId/accept`
- `PUT /session/:sessionId/decline`
- `PUT /session/:sessionId/complete`

### Ratings

- `POST /rate-user`
- `GET /ratings/:userId`

### Search

- `GET /search/skills?q=...`
- `GET /search/users?q=...`

You can test several endpoints quickly using `backend/requests.http` or the browser UI at `/api-overview`.

## Frontend Routes

- `/` -> auth-aware redirect to dashboard or login
- `/login` -> login page
- `/register` -> registration page
- `/dashboard` -> overview of skills, requests, and sessions
- `/skills/my-skills` -> manage offered skills
- `/skills/browse` -> browse and request skills
- `/matches` -> run matching and view match cards
- `/sessions` -> manage pending/upcoming/completed/cancelled sessions
- `/sessions/schedule` -> schedule a session (optionally from match)
- `/profile/[userId]` -> public user profile with skills and reviews
- `/profile/edit` -> update own profile
- `/api-overview` -> internal API testing console

## Matching and Rating Logic

### Matching

The procedure `match_users` inserts a match when there is reciprocal compatibility:

- User A requests a skill that User B offers
- User B requests a skill that User A offers

Matches are inserted with status `matched`.

### Rating

- A user can rate another user after a session.
- Duplicate ratings for the same `(session_id, rater_id)` are blocked in API logic.
- Average ratings are calculated using Oracle aggregation logic (`calculate_rating`).

## Validation and Error Handling

- Input checks exist for critical fields in most endpoints.
- Oracle business-rule errors raised with `RAISE_APPLICATION_ERROR` (code range 20000-20999) are converted to HTTP 400.
- Other uncaught errors return HTTP 500.

## Known Limitations

- Passwords are stored as plain text (no hashing).
- No JWT/session-token authentication on backend.
- No role-based authorization checks on API.
- Matching procedure does not currently deduplicate all possible reciprocal pairs.
- Limited server-side pagination/filtering for large datasets.
- Minimal automated tests.

## Suggested Improvements

1. Hash passwords with bcrypt and add secure auth tokens.
2. Add authorization middleware and role-based access control.
3. Add migration tooling and schema versioning.
4. Add API validation library (for example zod/joi) for stricter payload checks.
5. Add tests:
    - backend route/integration tests
    - frontend component and flow tests
6. Add pagination and sorting for list endpoints.
7. Improve matching algorithm to avoid duplicate/redundant matches.
