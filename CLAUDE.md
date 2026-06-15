# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project status

The Next.js app is scaffolded with Supabase (schema + RLS + auth), shadcn/ui, and Zod/React Hook Form in place; auth pages (login/signup/Google OAuth scaffold) and an authenticated dashboard placeholder exist, but the core domain features (league management, matches, stat submissions, leaderboard UI) are not yet implemented. `plan.md` is the V1 business requirements document and source of truth for the domain model: leagues, roles (admin/player), matches, stat submission & approval flow, point system, final rating formula, MVP logic, and leaderboard rules. Read `plan.md` before implementing any feature in these areas.

This project runs on **Next.js 16**, which is newer than your training data and has breaking changes vs. the Next.js you know. See `AGENTS.md` before writing Next.js code — check `node_modules/next/dist/docs/` for current APIs/conventions.

## Commands

- `pnpm dev` — start the dev server (Turbopack)
- `pnpm build` — production build
- `pnpm lint` — ESLint
- `pnpm format` / `pnpm format:check` — Prettier write/check

## Technology stack

- Next.js (App Router), TypeScript, Node.js
- Tailwind CSS, shadcn/ui (Nova preset: Radix UI + Lucide React)
- Supabase (PostgreSQL, Auth — Google OAuth + email/password); Supabase Realtime disabled for V1
- Forms/validation: React Hook Form + Zod (zod pinned to `4.0.17` exact — see PROGRESS.md for why)
- Testing: Vitest + React Testing Library (unit), Playwright (E2E) (not yet set up)
- ESLint + Prettier, pnpm package manager
- Docker / Docker Compose for local dev (not yet set up; `supabase start` requires Docker)
- Deployment: Vercel (app) + Supabase (db/auth)

## Conventions

- Supabase client helpers: `src/lib/supabase/{client,server,middleware}.ts` (`@supabase/ssr` pattern — browser client, server client with cookies, middleware session refresh in `src/middleware.ts`)
- DB schema/RLS/triggers/views live in `supabase/migrations/`; `public.league_leaderboard` and `public.match_mvps` views (both `security_invoker = true`) implement the point system, final rating, and MVP ranking — query these instead of recomputing in app code
- Validation schemas: `src/lib/validations/*.ts` (Zod)
- Server Actions: `src/lib/<domain>/actions.ts` (`"use server"`), returning `{ error: string } | undefined` on failure, calling `redirect()` on success
- Forms: React Hook Form + `zodResolver`, manually building `FormData` in `onValid` and dispatching via the `formAction` from `useActionState` (RHF validates client-side, Server Action handles submission)
- UI primitives in `src/components/ui/` (shadcn) — use `Field`/`FieldGroup`/`FieldLabel`/`FieldError`/`FieldSeparator` for forms, not the older `form` component
- Design system: dark "pitch-side editorial" theme in `src/app/globals.css` — Anton (`font-heading`/`--font-display`) for headings, Geist for body, pitch-green oklch palette, `bg-pitch-stripes` and `animate-fade-up` utilities, `PitchBackdrop` decorative component in the root layout

## Development preferences

- Prefer Server Components by default; use Client Components only when interactivity is required.
- Keep business logic on the server; prefer Server Actions for mutations.
- Use TypeScript strict mode.
- Prefer composition over inheritance and simple, explicit solutions over abstractions.
- Avoid introducing additional dependencies unless necessary — explain why if you do.
- Build mobile-first, responsive, and accessible interfaces.
- Cover new business logic and reusable components with tests where practical.
- Do not use any kind of emojis for the comments in the code, if already used, remove them.

## Working with Claude

- Think through the implementation before generating code, and follow existing project conventions/folder structure once established.
- Generate production-ready TypeScript; include error handling, loading, and empty states when building features.
- Check `PROGRESS.md` for current status — what's done and what's queued next.

## Planning workflow

- Use `/feature-dev:feature-dev` to plan new feature/task implementations.
- Use `/frontend-design:frontend-design` for frontend/UI design work.
- Update `PROGRESS.md` (move items between Done/Next up) as work completes.

## Testing account

- Email - test@tfc.com
- Password - 123456
