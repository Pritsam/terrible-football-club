# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project status

The Next.js app has been scaffolded (App Router, TypeScript, Tailwind, src/ dir) but no domain features are implemented yet. `plan.md` is the V1 business requirements document and source of truth for the domain model: leagues, roles (admin/player), matches, stat submission & approval flow, point system, final rating formula, MVP logic, and leaderboard rules. Read `plan.md` before implementing any feature in these areas.

This project runs on **Next.js 16**, which is newer than your training data and has breaking changes vs. the Next.js you know. See `AGENTS.md` before writing Next.js code — check `node_modules/next/dist/docs/` for current APIs/conventions.

## Commands

- `pnpm dev` — start the dev server (Turbopack)
- `pnpm build` — production build
- `pnpm lint` — ESLint
- `pnpm format` / `pnpm format:check` — Prettier write/check

## Technology stack

- Next.js (App Router), TypeScript, Node.js
- Tailwind CSS, shadcn/ui (not yet installed), Lucide React (not yet installed)
- Supabase (PostgreSQL, Auth — Google OAuth + email/password); Supabase Realtime disabled for V1
- Forms/validation: React Hook Form + Zod (not yet installed)
- Testing: Vitest + React Testing Library (unit), Playwright (E2E) (not yet set up)
- ESLint + Prettier, pnpm package manager
- Docker / Docker Compose for local dev
- Deployment: Vercel (app) + Supabase (db/auth)

## Development preferences

- Prefer Server Components by default; use Client Components only when interactivity is required.
- Keep business logic on the server; prefer Server Actions for mutations.
- Use TypeScript strict mode.
- Prefer composition over inheritance and simple, explicit solutions over abstractions.
- Avoid introducing additional dependencies unless necessary — explain why if you do.
- Build mobile-first, responsive, and accessible interfaces.
- Cover new business logic and reusable components with tests where practical.

## Working with Claude

- Think through the implementation before generating code, and follow existing project conventions/folder structure once established.
- Generate production-ready TypeScript; include error handling, loading, and empty states when building features.
