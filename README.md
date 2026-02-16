# MindBoard (GENSHAI Mental Model Project)

MindBoard is an AI-assisted thinking workspace for better decisions.  
It gives users a "personal board of advisors" with distinct mental models, then supports multi-perspective chat, book-based guidance, skill generation, and OpenClaw export workflows.

## Core Features

- Advisor chat with configurable response style, tone, and complexity
- Persona chat and book chat flows
- Mental model library and conversation history
- Skills library (generate, review, approve/reject, execute)
- OpenClaw export dashboard for advisor blueprints (`SOUL.md`, `AGENTS.md`, `SKILL.md`)
- Admin area for personas, frameworks, books, AI provider settings, and analytics

## Tech Stack

- Frontend: React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, React Query
- Backend: Supabase (Auth, Postgres, Edge Functions)
- AI/Agent integrations: Supabase Edge Functions, provider routing, OpenClaw-oriented export
- Testing: Vitest + Testing Library

## Architecture at a Glance

- `src/`: React application (pages, components, hooks, shared libraries)
- `supabase/functions/`: Edge Functions for chat, skills, generation, imports, and AI provider tooling
- `supabase/migrations/`: schema and policy migrations
- `docs/plans/`: implementation plans and architecture notes

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Create/update `.env` with:

```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
VITE_SUPABASE_PROJECT_ID=...
```

### 3. Run locally

```bash
npm run dev
```

App runs with Vite on local dev server (default: `http://localhost:5173`).

## Available Scripts

- `npm run dev` - start development server
- `npm run build` - production build
- `npm run build:dev` - development-mode build
- `npm run preview` - preview production build
- `npm run lint` - run ESLint
- `npm run test` - run Vitest once
- `npm run test:watch` - run Vitest in watch mode

## Supabase Functions in This Repo

Examples include:

- `advisor-chat`
- `book-chat`
- `persona-chat`
- `goodreads-import`
- `skill-generator`
- `skill-executor`
- `generate-advisor`
- `export-openclaw`
- `fetch-models`

If you plan to run functions locally, make sure Supabase CLI is installed and linked to the project.

## Project Status

This repository is actively evolving, with ongoing work around hybrid Brain/Hands architecture and OpenClaw-compatible workflows (see `docs/plans/`).
