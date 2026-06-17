# Progress

Tracks what's done and what's queued next for the Fantasy League Tracking System (see `plan.md` for the full V1 spec).

## Done

- Next.js 16 scaffold (App Router, TypeScript, Tailwind v4, `src/` dir, Turbopack)
- ESLint + Prettier configured and passing (`pnpm lint`, `pnpm format:check`)
- `AGENTS.md` present (notes Next.js 16 breaking changes vs. training data)
- `CLAUDE.md` written with stack, domain summary, and commands
- Supabase project setup: local CLI config (`supabase/config.toml`, Google OAuth provider scaffolded), client/server/middleware helpers (`src/lib/supabase/*`), session-refresh middleware at `src/middleware.ts`
- DB schema migration (`supabase/migrations/20260615000000_init_schema.sql`): profiles, leagues, league_memberships, matches, stat_submissions; RLS policies; admin-safety + league-deletion triggers; `league_leaderboard` and `match_mvps` views implementing the V1 point system, final rating, and MVP rules
- shadcn/ui (Nova preset, Radix + Lucide React) installed — Button, Input, Label, Card, Field/FieldGroup/FieldLabel/FieldError/FieldSeparator, Separator
- Zod + React Hook Form + `@hookform/resolvers` installed (zod pinned to `4.0.17` — see note below)
- Auth pages: `/login`, `/signup` (email/password + scaffolded "Continue with Google"), `/auth/callback` OAuth callback route, server actions in `src/lib/auth/actions.ts` (login, signup, signInWithGoogle, logout)
- Authenticated dashboard placeholder at `src/app/page.tsx` (welcome message + sign-out, via `SiteHeader`)
- Pitch-themed dark design system in `src/app/globals.css` (Anton display font, Geist body font, pitch-green oklch palette, diagonal stripe + floodlight backdrop, fade-up animation)
- Docker Desktop installed/running and local Supabase stack started (`supabase start`); migration `20260615000000_init_schema.sql` applied to the local DB
- Fixed dev server failing with Internal Server Error on `/`: created `.env.local` (was missing, causing `createServerClient` to throw in `src/middleware.ts` on every request) and removed a stray typo line that had been prepended to `.env.example`
- Fixed login/signup not redirecting after success: `login`/`signup` server actions in `src/lib/auth/actions.ts` now return `{ success: true }` instead of calling `redirect()` (which was swallowed when the action is invoked manually via `useActionState` + RHF `handleSubmit`); `LoginForm`/`SignupForm` now `useEffect` on `state.success` and call `router.push("/")` + `router.refresh()`. Verified end-to-end with Playwright for both login and signup.
- Added a project-scoped Supabase MCP server (`.mcp.json`) pointed at a new hosted project (`upxtoabbikplrousvuuv`); `.env.local` updated with that project's URL + anon key (local Supabase credentials kept as a commented-out fallback)
- Authenticated the Supabase MCP server (OAuth) and applied `20260615000000_init_schema.sql` to the hosted project (`upxtoabbikplrousvuuv`) via `mcp__supabase__apply_migration` — all 5 tables created with RLS enabled
- Ran the security advisor and fixed the actionable findings via `20260615000001_harden_function_security.sql`: pinned `search_path = ''` on `generate_invite_code`/`set_updated_at`, and revoked `EXECUTE` on trigger-only functions (`handle_new_user`, `enforce_admin_safety`, `handle_league_deletion`) from `public`/`anon`/`authenticated` so they aren't exposed via PostgREST RPC. Remaining advisor warnings (`is_league_member`, `is_league_admin`, `get_league_by_invite_code` callable as security-definer RPCs) are intentional — left as-is.

### Notes / known issues

- `zod` is pinned to `4.0.17` (exact) via `dependencies` + `pnpm.overrides`. Newer zod 4.x (4.1+) breaks `@hookform/resolvers@5.4.0`'s `zodResolver` type overloads (`_zod.version.minor` mismatch). Revisit this pin when `@hookform/resolvers` ships a fix.
- "Continue with Google" is wired to `signInWithOAuth` but needs real Google OAuth credentials (Google Cloud Console + `SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID`/`SECRET` env vars) to function.
- **Hosted Supabase project (`upxtoabbikplrousvuuv`) has no schema applied yet.** `.env.local` now points at it, but the `20260615000000_init_schema.sql` migration has not been run there — auth/profile/league features will fail against it until it's applied (via `supabase link` + `supabase db push`, or by pasting the migration into the hosted SQL Editor).
- League management phase 1: create league + dashboard listing + league detail stub
  - `src/lib/leagues/actions.ts` — `createLeague` server action using `public.create_league()` RPC
  - `src/lib/validations/leagues.ts` — Zod schema for league name
  - `src/components/leagues/create-league-form.tsx` — RHF + zodResolver form
  - `src/app/leagues/new/page.tsx` — create league page
  - `src/app/leagues/[id]/page.tsx` — league detail stub (shows name, status, role)
  - `src/app/page.tsx` — dashboard rewritten to list user's leagues
  - `supabase/migrations/20260616000000_fix_membership_bootstrap_policy.sql` — fixed self-comparison bug in RLS
  - `supabase/migrations/20260616000001_create_league_fn.sql` — `public.create_league(p_name)` SECURITY DEFINER RPC

### Notes / known issues (continued)

- `INSERT … RETURNING` on `leagues` triggers SELECT RLS (`is_league_member`) before the membership row exists — solved by using a SECURITY DEFINER function (`create_league`) that inserts both rows atomically, bypassing the bootstrap ordering problem.
- The original membership bootstrap RLS policy had a self-comparison bug (`m.league_id = m.league_id`) that blocked all first-admin inserts whenever any memberships existed anywhere. Fixed in migration `20260616000000`.

- League management phase 2: invite system
  - `src/lib/leagues/actions.ts` — `joinLeague` server action using `public.join_league_by_invite_code()` RPC
  - `src/lib/validations/leagues.ts` — Zod schema for invite code
  - `src/components/leagues/join-league-form.tsx` — RHF + zodResolver form on dashboard
  - `src/components/leagues/join-via-link-form.tsx` — join button on `/join/[code]` page
  - `src/components/leagues/invite-panel.tsx` — admin-only invite code + copy buttons on league detail
  - `src/app/join/[code]/page.tsx` — invite link landing page (validates code, checks membership, shows join confirmation)
  - `src/app/page.tsx` — "Join a league" card added to dashboard
  - `src/app/leagues/[id]/page.tsx` — renders `InvitePanel` for admins
  - `supabase/migrations/20260617000000_join_league_by_invite_code_fn.sql` — `public.join_league_by_invite_code(p_invite_code)` SECURITY DEFINER RPC

- League management phase 3: membership management + league settings
  - `src/lib/leagues/actions.ts` — `updateLeagueStatus`, `updateMemberRole`, `removeMember` server actions
  - `src/components/leagues/members-list.tsx` — member list with inline promote/demote/remove (admin only)
  - `src/components/leagues/league-settings-panel.tsx` — close/reopen/delete league with inline confirmation
  - `src/app/leagues/[id]/page.tsx` — parallel data fetch for members, renders new components

## Next up

- Match system: create match, list matches, match detail
- Stat submission/approval flow
- Leaderboard + MVP display
- Vitest + React Testing Library (unit), Playwright (E2E)
- Docker / Docker Compose for local dev (compose file not yet written, though Docker Desktop itself is installed)
